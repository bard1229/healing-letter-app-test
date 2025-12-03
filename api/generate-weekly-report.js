// API Route: /api/generate-weekly-report.js
// 修正版: 使用 letters collection (測試版-本週)

import { GoogleGenerativeAI } from '@google/generative-ai';
import admin from 'firebase-admin';

// 初始化 Firebase Admin (只初始化一次)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();
const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);

// 格式化日期
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

// ⭐ 測試版: 計算本週的日期範圍 (週一到今天)
const getWeekRange = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 週一為起點
  
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff); // 本週一
  monday.setHours(0, 0, 0, 0);
  
  const now = new Date(); // 到現在為止
  now.setHours(23, 59, 59, 999);
  
  return { start: monday, end: now };
};

// 🔧 修正: 從 letters collection 取得日記
const getWeeklyDiaries = async (userId, startDate, endDate) => {
  try {
    const lettersRef = db.collection('letters');
    const snapshot = await lettersRef
      .where('userId', '==', userId)
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(startDate))
      .where('createdAt', '<=', admin.firestore.Timestamp.fromDate(endDate))
      .orderBy('createdAt', 'asc')
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().createdAt.toDate()
    }));
  } catch (error) {
    console.error('取得週日記失敗:', error);
    throw error;
  }
};

// 分析情緒統計
const analyzeEmotions = (diaries) => {
  const emotionCount = {};
  
  diaries.forEach(diary => {
    const emotion = diary.emotion || '未知';
    emotionCount[emotion] = (emotionCount[emotion] || 0) + 1;
  });
  
  // 找出最常出現的情緒
  let mostFrequent = { emotion: '平靜', emoji: '😌', count: 0 };
  const emotionEmojis = {
    '開心': '😊',
    '難過': '😢',
    '壓力': '😰',
    '焦慮': '😨',
    '迷茫': '🤔',
    '平靜': '😌',
    '期待': '😊',
    '充實': '😊'
  };
  
  Object.entries(emotionCount).forEach(([emotion, count]) => {
    if (count > mostFrequent.count) {
      mostFrequent = {
        emotion,
        emoji: emotionEmojis[emotion] || '😊',
        count
      };
    }
  });
  
  return { mostFrequent, totalCount: diaries.length };
};

// 呼叫 Gemini 生成週報內容
const generateWeeklyContent = async (diaries, emotionStats) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    // 準備日記摘要
    const diarySummaries = diaries.map((diary, index) => {
      const date = new Date(diary.date);
      return `[第${index + 1}天] ${date.getMonth() + 1}/${date.getDate()}
情緒: ${diary.emotion || '未標記'}
內容: ${diary.userInput || diary.content}`;
    }).join('\n\n');
    
    const prompt = `你是一位溫暖、專業的心理陪伴者「歐特」(一隻可愛的水獺)。

使用者本週的情緒日記記錄(共${diaries.length}天):
${diarySummaries}

統計資訊:
- 最常出現情緒: ${emotionStats.mostFrequent.emotion} (${emotionStats.mostFrequent.count}次)
- 總記錄天數: ${emotionStats.totalCount}天

請生成一份溫暖、深入的週報,包含以下四個部分:

📋 **必須包含的四個部分:**

1. 📖 整體回顧 (overview)
- 總結本週的情緒狀態和生活狀況
- 觀察到的變化和模式
- 字數: 150-200字
- 語氣: 溫暖、同理、像朋友般關心

2. 🌟 發現與建議 (suggestions)  
- 給出3-4條具體、個人化的建議
- 每條建議要真的從日記內容中發現問題或亮點
- 格式: 陣列形式,每條50-80字

3. 💡 情緒亮點摘要 (highlights_summary)
- 簡短描述情緒穩定度的觀察
- 給予正向鼓勵或溫和提醒
- 字數: 30-50字

4. 💝 成長軌跡/溫暖鼓勵 (encouragement)
- 深度的情感陪伴和鼓勵
- 肯定使用者的努力和成長
- 給予未來的希望和支持
- 字數: 200-250字
- 語氣: 深情、溫暖、有力量

✨ **寫作要求:**
- 用「你」稱呼使用者(第二人稱)
- 全文要適當使用 emoji 增加溫度 💙
- 語言要有畫面感、具體、不空泛
- 真的從日記內容找細節,展現有仔細閱讀
- 避免說教,多用同理和陪伴的語氣

🎯 **回傳格式 (JSON):**
{
  "overview": "整體回顧內容...",
  "suggestions": [
    "建議1...",
    "建議2...",
    "建議3..."
  ],
  "highlights_summary": "情緒亮點摘要...",
  "encouragement": "成長軌跡/鼓勵內容..."
}

**重要:** 只回傳 JSON 格式,不要有其他文字。請開始生成:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // 清理可能的 markdown 標記
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const content = JSON.parse(text);
    
    return content;
  } catch (error) {
    console.error('Gemini 生成週報失敗:', error);
    throw error;
  }
};

// 儲存週報到 Firestore
const saveWeeklyReport = async (userId, weekData, content, emotionStats) => {
  try {
    const reportRef = db.collection('users').doc(userId).collection('weeklyReports');
    const reportId = `week_${weekData.year}_${weekData.weekNumber}`;
    
    await reportRef.doc(reportId).set({
      id: reportId,
      year: weekData.year,
      weekNumber: weekData.weekNumber,
      weekStart: formatDate(weekData.start),
      weekEnd: formatDate(weekData.end),
      totalDiaries: emotionStats.totalCount,
      status: 'pending',
      generatedAt: admin.firestore.FieldValue.serverTimestamp(),
      content: {
        overview: content.overview,
        suggestions: content.suggestions,
        highlights: {
          mostFrequent: emotionStats.mostFrequent,
          moodStability: content.highlights_summary || '穩定',
          growth: '+5%' // 可以之後改成真實計算
        },
        encouragement: content.encouragement
      }
    });
    
    return reportId;
  } catch (error) {
    console.error('儲存週報失敗:', error);
    throw error;
  }
};

// 主要處理函數
export default async function handler(req, res) {
  // 只允許 POST 請求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只允許 POST 請求' });
  }
  
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: '缺少 userId' });
    }
    
    // 1. 計算週報日期範圍 (本週)
    const weekRange = getWeekRange();
    const weekNumber = Math.ceil((weekRange.start.getDate() + 6) / 7);
    const year = weekRange.start.getFullYear();
    
    console.log(`🧪 測試模式: 生成本週週報 ${year}年第${weekNumber}週`);
    console.log(`📅 日期範圍: ${formatDate(weekRange.start)} ~ ${formatDate(weekRange.end)}`);
    
    // 2. 取得該週的日記
    const diaries = await getWeeklyDiaries(userId, weekRange.start, weekRange.end);
    
    if (diaries.length === 0) {
      return res.status(400).json({ 
        error: '本週沒有日記記錄',
        message: '至少需要1天的記錄才能生成週報'
      });
    }
    
    console.log(`✅ 找到 ${diaries.length} 篇日記`);
    
    // 3. 分析情緒統計
    const emotionStats = analyzeEmotions(diaries);
    
    // 4. 呼叫 Gemini 生成內容
    console.log('🤖 呼叫 Gemini API 生成內容...');
    const content = await generateWeeklyContent(diaries, emotionStats);
    
    // 5. 儲存到 Firestore
    const reportId = await saveWeeklyReport(
      userId,
      { start: weekRange.start, end: weekRange.end, year, weekNumber },
      content,
      emotionStats
    );
    
    console.log(`🎉 週報生成成功: ${reportId}`);
    
    return res.status(200).json({
      success: true,
      reportId,
      message: '週報生成成功! (測試版-本週)',
      diaryCount: diaries.length
    });
    
  } catch (error) {
    console.error('❌ 生成週報錯誤:', error);
    return res.status(500).json({
      error: '生成週報失敗',
      message: error.message
    });
  }
}
