import { GoogleGenerativeAI } from '@google/generative-ai';

// 初始化 Gemini API
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error('請設定 VITE_GEMINI_API_KEY 環境變數');
}

const genAI = new GoogleGenerativeAI(API_KEY);

// 延遲函數
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 帶重試的 API 呼叫
const generateContentWithRetry = async (model, prompt, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`嘗試第 ${attempt} 次呼叫 Gemini API...`);
      const result = await model.generateContent(prompt);
      return result;
    } catch (error) {
      const isOverloaded = error.message?.includes('503') || error.message?.includes('overloaded');
      const isLastAttempt = attempt === maxRetries;
      
      if (isOverloaded && !isLastAttempt) {
        const waitTime = attempt * 2000; // 2秒, 4秒, 6秒
        console.log(`伺服器忙碌中,${waitTime/1000} 秒後重試...`);
        await delay(waitTime);
        continue;
      }
      
      // 最後一次失敗或非 503 錯誤,直接拋出
      throw error;
    }
  }
};

// 生成療癒信
export const generateHealingLetter = async (userInput) => {
  try {
    // 使用 gemini-2.5-flash 模型(最新版)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `你是一位溫柔、有同理心的心靈陪伴者,請為以下使用者撰寫一封療癒信:

【使用者的心情/煩惱】
${userInput}

【寫作要求】
1. 語氣:溫柔、理解、不帶評判,像朋友般關心
2. 結構:
   - 開頭:溫暖的問候,表達你收到了 TA 的心聲
   - 中段:具體回應 TA 的感受,展現深度理解與同理
   - 建議:提供 1-2 個溫和的視角或建議(非說教)
   - 結尾:鼓勵的話語,讓 TA 感到被支持
3. 長度:300-500 字
4. 避免:
   - 過度樂觀或毒雞湯
   - 空洞的安慰詞彙
   - 直接給建議而不先同理
   - 說教或批判的語氣

【範例語氣】
"我聽到了你的疲憊..." / "這樣的感覺確實很不容易..." / "你願意說出來,本身就很勇敢..."

【重要】
- 請用繁體中文回應
- 以「親愛的你:」或類似溫暖的稱呼開頭
- 以「一直陪伴你的朋友 ✨」結尾
- 不要使用 Markdown 格式(如 **、##等)
- 直接輸出信件內容,不需要其他說明

請直接生成信件內容:`;

    const result = await generateContentWithRetry(model, prompt);
    const response = result.response;
    const text = response.text();
    
    console.log('Gemini 回應成功,長度:', text.length);
    return text;

  } catch (error) {
    console.error('Gemini API 錯誤:', error);
    
    // 詳細的錯誤處理
    if (error.message?.includes('API_KEY') || error.message?.includes('API key')) {
      throw new Error('API Key 設定錯誤,請檢查環境變數');
    } else if (error.message?.includes('quota') || error.message?.includes('429')) {
      throw new Error('API 使用量已達上限,請稍後再試');
    } else if (error.message?.includes('404') || error.message?.includes('not found')) {
      throw new Error('API 模型不可用,請聯繫開發者');
    } else if (error.message?.includes('403') || error.message?.includes('permission')) {
      throw new Error('API 權限錯誤,請檢查 API Key 設定');
    } else if (error.message?.includes('503') || error.message?.includes('overloaded')) {
      throw new Error('伺服器目前忙碌中,已自動重試但仍無法完成。請稍後再試 (1-2 分鐘)');
    } else if (error.message?.includes('503') || error.message?.includes('overloaded')) {
      throw new Error('伺服器目前忙碌中,已自動重試但仍無法完成。請稍後再試 (1-2 分鐘)');
    } else {
      throw new Error('生成信件時發生錯誤,請稍後再試');
    }
  }
};

// 生成趨勢分析
export const generateTrendAnalysis = async (letters) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // 準備信件摘要
    const lettersSummary = letters.map((letter, index) => {
      return `第 ${index + 1} 封 (${new Date(letter.date).toLocaleDateString('zh-TW')}):
使用者說: ${letter.userInput}
情緒標籤: ${letter.emotion}`;
    }).join('\n\n');

    const prompt = `你是專業的情緒分析師,請分析使用者過去 ${letters.length} 次的心情記錄,並以一封溫柔的「分析信」呈現:

【過去 ${letters.length} 次記錄】
${lettersSummary}

【分析要求】
1. 觀察情緒變化趨勢:
   - 是否有改善、持續低落、或波動?
   - 主要的情緒模式是什麼?
   
2. 找出正向改變的跡象:
   - 即使微小也要提出
   - 鼓勵使用者的成長
   
3. 識別可能的核心議題或模式:
   - 反覆出現的主題
   - 需要關注的部分
   
4. 以「寫信」的方式呈現:
   - 不要像冷冰冰的報告
   - 保持溫暖、同理的語氣
   
5. 長度:400-600 字

【信件結構】
- 開頭:「這段時間,我一直陪伴著你...」
- 觀察:「我注意到你在...方面有些變化...」
- 正向肯定:「我看見你的...」
- 溫柔提醒:「或許可以留意...」
- 成長回顧:列出使用者的成長點(用項目符號)
- 建議:給予 2-3 個溫和的建議
- 結尾:「無論如何,我都會在這裡。」

【重要】
- 請用繁體中文回應
- 以「親愛的你:」開頭
- 以「永遠支持你的\n一封給你的信 💙」結尾
- 加上分析日期
- 不要使用 Markdown 格式
- 直接輸出信件內容

請直接生成分析信內容:`;

    const result = await generateContentWithRetry(model, prompt);
    const response = result.response;
    const text = response.text();
    
    console.log('Gemini 趨勢分析成功,長度:', text.length);
    return text;

  } catch (error) {
    console.error('Gemini 趨勢分析錯誤:', error);
    
    if (error.message?.includes('API_KEY') || error.message?.includes('API key')) {
      throw new Error('API Key 設定錯誤,請檢查環境變數');
    } else if (error.message?.includes('quota') || error.message?.includes('429')) {
      throw new Error('API 使用量已達上限,請稍後再試');
    } else if (error.message?.includes('404') || error.message?.includes('not found')) {
      throw new Error('API 模型不可用,請聯繫開發者');
    } else {
      throw new Error('生成趨勢分析時發生錯誤,請稍後再試');
    }
  }
};

// 分析情緒標籤(用 AI 判斷)
export const analyzeEmotion = async (text) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `請分析以下文字的主要情緒,只回答一個英文單字:

文字: "${text}"

可選的情緒標籤:
- stressed (壓力/疲憊/忙碌)
- sad (難過/傷心/委屈)
- confused (迷茫/困惑/不知所措)
- lonely (孤單/寂寞)
- anxious (焦慮/擔心/害怕)
- happy (開心/快樂)
- neutral (中性/平靜)

請只回答一個最符合的英文單字,不要有其他文字:`;

    const result = await generateContentWithRetry(model, prompt);
    const response = result.response;
    const emotion = response.text().trim().toLowerCase();
    
    // 驗證回應是否是有效的情緒標籤
    const validEmotions = ['stressed', 'sad', 'confused', 'lonely', 'anxious', 'happy', 'neutral'];
    
    if (validEmotions.includes(emotion)) {
      console.log('情緒分析結果:', emotion);
      return emotion;
    } else {
      console.warn('AI 返回了無效的情緒標籤:', emotion, '使用預設值 neutral');
      return 'neutral';
    }

  } catch (error) {
    console.error('情緒分析錯誤:', error);
    // 如果 API 失敗,使用簡單的關鍵字判斷作為備用
    const lowerText = text.toLowerCase();
    if (lowerText.includes('壓力') || lowerText.includes('累') || lowerText.includes('疲憊')) return 'stressed';
    if (lowerText.includes('難過') || lowerText.includes('傷心') || lowerText.includes('委屈')) return 'sad';
    if (lowerText.includes('迷茫') || lowerText.includes('不知道') || lowerText.includes('困惑')) return 'confused';
    if (lowerText.includes('孤單') || lowerText.includes('寂寞')) return 'lonely';
    if (lowerText.includes('焦慮') || lowerText.includes('擔心') || lowerText.includes('害怕')) return 'anxious';
    if (lowerText.includes('開心') || lowerText.includes('快樂') || lowerText.includes('高興')) return 'happy';
    return 'neutral';
  }
};
