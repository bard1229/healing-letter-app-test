import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error('⚠️ Gemini API Key 未設定!');
}

const genAI = new GoogleGenerativeAI(API_KEY);

export const generateHealingLetter = async (userInput) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const prompt = `你是一位溫暖、同理心強的心理輔導者,名叫「歐特」(一隻可愛的水獺)。

使用者的心情:
${userInput}

請給予溫暖、療癒的回應:

📋 回應要求:
1. 用「我」第一人稱回應(代表歐特水獺)
2. 語氣溫暖、同理、支持,像朋友聊天
3. 先同理使用者的感受,再給予建議
4. **全文加入適當的 emoji 讓文字更溫暖活潑** ✨
5. 字數 200-300 字

💡 emoji 使用指南:
- 情緒相關: 😊 😢 😰 🤔 💙 💪 🌈 ✨
- 鼓勵支持: 💖 🌟 🌸 🦋 🌺 
- 時間相關: ⏰ 📅 🌅 🌙
- 行動建議: 💡 📝 🎯 🚶‍♀️
- 結尾溫暖: 🤗 💕 🫂

🎯 範例格式:
[同理段落] 💙
[分析感受] 💭  
[具體建議] 💡
[溫暖鼓勵] ✨

字數: 200-300字
語氣: 溫暖、同理、像朋友
請開始你的回應:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text;
  } catch (error) {
    console.error('生成療癒信失敗:', error);
    throw new Error('生成失敗,請稍後再試 😢');
  }
};

export const generateTrendAnalysis = async (letters) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const letterSummaries = letters.slice(-10).map((letter, index) => {
      return `[記錄 ${index + 1}] ${new Date(letter.date).toLocaleDateString('zh-TW')}
情緒: ${letter.emotion || '未標記'}
內容: ${letter.userInput}`;
    }).join('\n\n');
    
    const prompt = `你是一位專業且溫暖的心理分析師「歐特」(一隻可愛的水獺)。

使用者最近的情緒記錄:
${letterSummaries}

請生成一份溫暖、深入的心情趨勢分析:

📋 分析架構:
1. 🌈 整體趨勢觀察 (情緒變化模式)
2. 💡 深層洞察 (可能的原因或模式)
3. 💪 正向進展 (值得肯定的地方)
4. 🎯 成長建議 (具體可行的建議 2-3 項)
5. 💙 溫暖鼓勵 (給予支持和信心)

✨ 寫作要求:
- **全文要有豐富的 emoji,讓文字活潑溫暖**
- 用「我」第一人稱(代表歐特)
- 語氣溫暖、專業但親切
- 重點用 emoji 標記
- 字數 400-600 字

💡 emoji 建議:
- 標題: 🌈 💡 💪 🎯 💙 ✨
- 情緒: 😊 😢 😰 🤔 💭
- 正向: 🌟 🌸 🦋 🌺 💖
- 成長: 🌱 📈 🚀 💪
- 溫暖: 🤗 💕 🫂 ☀️

請開始你的分析:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text;
  } catch (error) {
    console.error('生成趨勢分析失敗:', error);
    throw new Error('生成趨勢分析失敗,請稍後再試 😢');
  }
};

export const analyzeEmotion = async (userInput) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const prompt = `分析以下文字的主要情緒,只回答一個中文詞彙:

文字: ${userInput}

情緒類別(只能選一個):
- 開心
- 難過  
- 壓力
- 焦慮
- 迷茫
- 平靜

只回答一個詞,不要有其他文字:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const emotion = response.text().trim();
    
    const validEmotions = ['開心', '難過', '壓力', '焦慮', '迷茫', '平靜'];
    return validEmotions.includes(emotion) ? emotion : '迷茫';
  } catch (error) {
    console.error('分析情緒失敗:', error);
    return '迷茫';
  }
};
