// API Route: /api/generate-monthly-report.js
// 修正版: 使用 letters collection (測試版-本月)

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

// ⭐ 測試版: 計算本月的日期範圍 (本月1號到今天)
const getMonthRange = () => {
  const today = new Date();
  
  // 本月的第一天
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  firstDay.setHours(0, 0, 0, 0);
  
  // 今天
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  
  return { start: firstDay, end: now };
};

// 🔧 修正: 從 letters collection 取得日記
const getMonthlyDiaries = async (userId, startDate, endDate) => {
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
    console.error('取得月日記失敗:', error);
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
  
  return { mostFrequent, totalCount: diaries.length, emotionCount };
};

// 呼叫 Gemini 生成月報內容
const generateMonthlyContent = async (diaries, emotionStats, monthInfo) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // 準備日記摘要 (如果日記太多,只取部分)
    const sampleSize = Math.min(diaries.length, 20);
    const sampledDiaries = diaries.length > 20 
      ? diaries.filter((_, index) => index % Math.ceil(diaries.length / 20) === 0).slice(0, 20)
      : diaries;
    
    const diarySummaries = sampledDiaries.map((diary, index) => {
      const date = new Date(diary.date);
      return `[${date.getMonth() + 1}/${date.getDate()}] 情緒:${diary.emotion || '未標記'} | ${(diary.userInput || diary.content).substring(0, 100)}...`;
    }).join('\n');
    
    // 情緒分布統計
    const emotionDistribution = Object.entries(emotionStats.emotionCount)
      .map(([emotion, count]) => `${emotion}: ${count}次`)
      .join(', ');
    
    const prompt = `你是一位溫暖、專業的心理陪伴者「歐特」(一隻可愛的水獺)。

使用者 ${monthInfo.year}年${monthInfo.month}月 的情緒日記記錄:
- 總記錄天數: ${diaries.length}天
- 情緒分布: ${emotionDistribution}
- 最常出現: ${emotionStats.mostFrequent.emotion} (${emotionStats.mostFrequent.count}次)

日記內容摘要 (部分代表性記錄):
${diarySummaries}

請生成一份深度、溫暖的月報,包含以下四個部分:

📋 **必須包含的四個部分:**

1. 📖 本月回顧 (overview)
- 整個月的情緒狀態和生活變化
- 觀察到的重要模式和轉折點
- 月初到月末的成長軌跡
- 字數: 200-300字
- 語氣: 深度同理、像老朋友般了解

2. 🌟 發現與建議 (suggestions)
- 給出3條深度、個人化的月度建議
- 基於整個月的觀察,給予成長方向
- 每條建議80-120字,要有深度和洞察
- 格式: 陣列形式

3. 💡 本月亮點摘要 (highlights_summary)
- 描述整個月的情緒穩定度變化
- 給予正向肯定或溫和的成長建議
- 字數: 50-80字

4. 💝 給你的話 (encouragement)
- 深度的情感陪伴和月度總結
- 肯定整個月的努力和堅持
- 給予下個月的期許和力量
- 字數: 250-350字
- 語氣: 深情、有力量、充滿希望

✨ **寫作要求:**
- 用「你」稱呼使用者(第二人稱)
- 全文要豐富使用 emoji 💙✨🌸
- 語言要有深度、畫面感、情感豐富
- 真的從日記內容找出情緒模式和變化
- 月報要比週報更有深度和洞察力
- 展現一個月來的陪伴和觀察

🎯 **回傳格式 (JSON):**
{
  "overview": "本月回顧內容...",
  "suggestions": [
    "深度建議1...",
    "深度建議2...",
    "深度建議3..."
  ],
  "highlights_summary": "本月亮點摘要...",
  "encouragement": "給你的話內容..."
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
    console.error('Gemini 生成月報失敗:', error);
    throw error;
  }
};

// 計算成長百分比
const calculateGrowth = (diaries) => {
  const positiveEmotions = ['開心', '平靜', '期待', '充實'];
  const firstHalf = diaries.slice(0, Math.floor(diaries.length / 2));
  const secondHalf = diaries.slice(Math.floor(diaries.length / 2));
  
  const firstHalfPositive = firstHalf.filter(d => positiveEmotions.includes(d.emotion)).length;
  const secondHalfPositive = secondHalf.filter(d => positiveEmotions.includes(d.emotion)).length;
  
  const firstRatio = firstHalf.length > 0 ? firstHalfPositive / firstHalf.length : 0;
  const secondRatio = secondHalf.length > 0 ? secondHalfPositive / secondHalf.length : 0;
  
  const growth = ((secondRatio - firstRatio) * 100).toFixed(0);
  return growth > 0 ? `+${growth}%` : `${growth}%`;
};

// 儲存月報到 Firestore
const saveMonthlyReport = async (userId, monthData, content, emotionStats) => {
  try {
    const reportRef = db.collection('users').doc(userId).collection('monthlyReports');
    const reportId = `month_${monthData.year}_${monthData.month}`;
    
    const growth = calculateGrowth(monthData.diaries);
    
    await reportRef.doc(reportId).set({
      id: reportId,
      year: monthData.year,
      month: monthData.month,
      monthStart: formatDate(monthData.start),
      monthEnd: formatDate(monthData.end),
      totalDiaries: emotionStats.totalCount,
      status: 'pending',
      generatedAt: admin.firestore.FieldValue.serverTimestamp(),
      content: {
        overview: content.overview,
        suggestions: content.suggestions,
        highlights: {
          mostFrequent: emotionStats.mostFrequent,
          moodStability: content.highlights_summary || '穩定向上',
          growth: growth
        },
        encouragement: content.encouragement
      }
    });
    
    return reportId;
  } catch (error) {
    console.error('儲存月報失敗:', error);
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
    
    // 1. 計算月報日期範圍 (本月)
    const monthRange = getMonthRange();
    const month = monthRange.start.getMonth() + 1;
    const year = monthRange.start.getFullYear();
    
    console.log(`🧪 測試模式: 生成本月月報 ${year}年${month}月`);
    console.log(`📅 日期範圍: ${formatDate(monthRange.start)} ~ ${formatDate(monthRange.end)}`);
    
    // 2. 取得該月的日記
    const diaries = await getMonthlyDiaries(userId, monthRange.start, monthRange.end);
    
    if (diaries.length === 0) {
      return res.status(400).json({ 
        error: '本月沒有日記記錄',
        message: '至少需要1天的記錄才能生成月報'
      });
    }
    
    console.log(`✅ 找到 ${diaries.length} 篇日記`);
    
    // 3. 分析情緒統計
    const emotionStats = analyzeEmotions(diaries);
    
    // 4. 呼叫 Gemini 生成內容
    console.log('🤖 呼叫 Gemini API 生成月報內容...');
    const content = await generateMonthlyContent(
      diaries, 
      emotionStats,
      { year, month }
    );
    
    // 5. 儲存到 Firestore
    const reportId = await saveMonthlyReport(
      userId,
      { start: monthRange.start, end: monthRange.end, year, month, diaries },
      content,
      emotionStats
    );
    
    console.log(`🎉 月報生成成功: ${reportId}`);
    
    return res.status(200).json({
      success: true,
      reportId,
      message: '月報生成成功! (測試版-本月)',
      diaryCount: diaries.length
    });
    
  } catch (error) {
    console.error('❌ 生成月報錯誤:', error);
    return res.status(500).json({
      error: '生成月報失敗',
      message: error.message
    });
  }
}
