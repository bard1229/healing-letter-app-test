import React, { useState, useEffect } from 'react';
import { Heart, Mic, Send, Clock, TrendingUp, Mail, Sparkles } from 'lucide-react';

const HealingLetterApp = () => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentLetter, setCurrentLetter] = useState(null);
  const [letters, setLetters] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showTrend, setShowTrend] = useState(false);
  const [trendAnalysis, setTrendAnalysis] = useState(null);

  // 載入歷史信件
  useEffect(() => {
    loadLetters();
  }, []);

  const loadLetters = () => {
    try {
      const saved = localStorage.getItem('healingLetters');
      if (saved) {
        setLetters(JSON.parse(saved));
      }
    } catch (error) {
      console.error('載入歷史記錄失敗:', error);
    }
  };

  const saveLetters = (newLetters) => {
    try {
      localStorage.setItem('healingLetters', JSON.stringify(newLetters));
      setLetters(newLetters);
    } catch (error) {
      console.error('儲存失敗:', error);
    }
  };

  // 語音輸入
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('抱歉,你的瀏覽器不支援語音輸入 😢\n\n請使用以下瀏覽器:\n• Google Chrome\n• Microsoft Edge\n• Safari (iOS)');
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'zh-TW';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        console.log('語音輸入已啟動');
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + ' ' + transcript);
        console.log('識別結果:', transcript);
      };

      recognition.onerror = (event) => {
        console.error('語音識別錯誤:', event.error);
        setIsListening(false);
        
        let errorMsg = '語音輸入發生錯誤 😢\n\n';
        if (event.error === 'not-allowed') {
          errorMsg += '請允許瀏覽器使用麥克風權限\n\n步驟:\n1. 點擊網址列左側的 🔒 圖示\n2. 允許「麥克風」權限\n3. 重新整理頁面';
        } else if (event.error === 'no-speech') {
          errorMsg += '沒有偵測到聲音,請再試一次';
        } else if (event.error === 'network') {
          errorMsg += '網路連線錯誤,請檢查網路';
        } else {
          errorMsg += '錯誤代碼: ' + event.error;
        }
        alert(errorMsg);
      };

      recognition.onend = () => {
        setIsListening(false);
        console.log('語音輸入已結束');
      };

      recognition.start();
      console.log('開始語音輸入...');
    } catch (error) {
      console.error('語音輸入初始化失敗:', error);
      alert('語音輸入啟動失敗 😢\n\n可能原因:\n• 瀏覽器不支援\n• 沒有麥克風權限\n• 請使用 Chrome 或 Edge');
      setIsListening(false);
    }
  };

  // 生成療癒信
  const generateLetter = () => {
    if (!input.trim()) {
      alert('請先告訴我你的心情或煩惱喔 💙');
      return;
    }

    setIsGenerating(true);
    
    // 模擬 AI 生成
    setTimeout(() => {
      const letter = {
        id: Date.now(),
        date: new Date().toISOString(),
        userInput: input,
        content: generateHealingContent(input),
        emotion: analyzeEmotion(input)
      };

      const newLetters = [...letters, letter];
      saveLetters(newLetters);
      setCurrentLetter(letter);
      setInput('');
      setIsGenerating(false);

      // 檢查是否達到 4 封
      if (newLetters.length === 4) {
        setTimeout(() => {
          generateTrendAnalysis(newLetters);
        }, 1000);
      }
    }, 2000);
  };

  // 生成療癒信內容
  const generateHealingContent = (userInput) => {
    const lowerInput = userInput.toLowerCase();
    
    let middlePart = '';
    if (lowerInput.includes('壓力') || lowerInput.includes('累') || lowerInput.includes('疲憊')) {
      middlePart = '工作和生活的壓力,有時候真的會讓人感到喘不過氣。你願意說出來,本身就是很勇敢的一步。這些感受都是真實的,也是值得被理解的。';
    } else if (lowerInput.includes('難過') || lowerInput.includes('傷心') || lowerInput.includes('委屈')) {
      middlePart = '我聽到了你的難過。這樣的感覺確實很不容易,但請記得,允許自己感到難過,也是一種溫柔的力量。你不需要強迫自己馬上好起來。';
    } else if (lowerInput.includes('迷茫') || lowerInput.includes('不知道') || lowerInput.includes('困惑')) {
      middlePart = '面對未知的迷茫,是每個人都會經歷的。不確定的感覺雖然讓人不安,但這也代表著,你正在思考、正在尋找屬於自己的方向。';
    } else {
      middlePart = '謝謝你願意和我分享你的心情。每一個感受都值得被好好對待,包括此刻的你。';
    }

    return `親愛的你:

我收到了你的心聲,也感受到了你此刻的心情。

${middlePart}

或許,我們可以試著換一個角度看看:這些經歷,雖然辛苦,但也都是你成長路上的印記。而此刻願意面對這些情緒的你,其實已經比想像中更堅強了。

記得,你不需要一個人扛著所有的重量。無論是找信任的朋友聊聊,或是給自己一些喘息的空間,都是很好的選擇。

最後,我想對你說:你已經做得很好了。未來的路,我們一起慢慢走。

永遠支持你的
一封給你的信 ✨`;
  };

  // 情緒分析
  const analyzeEmotion = (text) => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('壓力') || lowerText.includes('累') || lowerText.includes('疲憊')) return 'stressed';
    if (lowerText.includes('難過') || lowerText.includes('傷心') || lowerText.includes('委屈')) return 'sad';
    if (lowerText.includes('開心') || lowerText.includes('快樂') || lowerText.includes('高興')) return 'happy';
    if (lowerText.includes('迷茫') || lowerText.includes('不知道') || lowerText.includes('困惑')) return 'confused';
    return 'neutral';
  };

  // 生成趨勢分析
  const generateTrendAnalysis = (allLetters) => {
    const emotions = allLetters.map(l => l.emotion);
    
    let emotionObservation = '';
    const stressedCount = emotions.filter(e => e === 'stressed').length;
    const sadCount = emotions.filter(e => e === 'sad').length;
    
    if (stressedCount > 2) {
      emotionObservation = '你似乎承受著不少的壓力。這些壓力可能來自工作、生活,或是對自己的期待。我想告訴你,感到壓力是很正常的,但也記得要好好照顧自己。';
    } else if (sadCount > 2) {
      emotionObservation = '你的心情時常感到低落。這樣的感受雖然辛苦,但我看見你每一次都願意面對,這份勇氣很珍貴。';
    } else {
      emotionObservation = '你的情緒有著不同的起伏,這是很自然的。每一種情緒都在告訴你一些訊息,值得我們好好聆聽。';
    }

    const analysis = {
      date: new Date().toISOString(),
      content: `親愛的你:

這段時間,我一直陪伴著你,也見證了你的心情變化。

回顧這四次的對話,我注意到:

${emotionObservation}

在這段時間裡,我也看見了你的成長:
• 你願意表達自己的感受,這需要很大的勇氣
• 你持續在面對生活的挑戰,從未放棄
• 你懂得尋求支持,這是很有智慧的選擇

或許,接下來你可以留意:
• 給自己一些放鬆的時間,不一定要一直往前衝
• 記錄那些讓你感到開心的小事,它們比你想像的重要
• 必要時,尋求專業的協助也是一種照顧自己的方式

無論未來如何,請記得:你不是一個人。我會一直在這裡,陪著你慢慢前進。

繼續加油,也繼續善待自己。

永遠支持你的
一封給你的信 💙`
    };
    
    setTrendAnalysis(analysis);
    setShowTrend(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* 頂部導航 */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Heart className="text-pink-500" fill="currentColor" size={24} />
            <h1 className="text-xl font-medium text-gray-800">給你的一封信</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowHistory(!showHistory); setShowTrend(false); }}
              className="px-4 py-2 rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 transition-all flex items-center gap-2"
            >
              <Clock size={16} />
              歷史 ({letters.length})
            </button>
            {letters.length >= 4 && (
              <button
                onClick={() => { setShowTrend(!showTrend); setShowHistory(false); }}
                className="px-4 py-2 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all flex items-center gap-2"
              >
                <TrendingUp size={16} />
                趨勢分析
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 主要內容區 */}
        {!showHistory && !showTrend && (
          <>
            {/* 歡迎區 */}
            {!currentLetter && letters.length === 0 && (
              <div className="text-center mb-8 animate-fade-in">
                <div className="inline-block p-4 bg-white/60 rounded-full mb-4">
                  <Sparkles className="text-purple-500" size={48} />
                </div>
                <h2 className="text-2xl font-medium text-gray-800 mb-2">
                  在這裡,你可以說出心裡的話
                </h2>
                <p className="text-gray-600">
                  無論是煩惱、心情,還是想分享的事<br />
                  這裡會有一封信,溫柔地回應你
                </p>
              </div>
            )}

            {/* 輸入區 */}
            {!currentLetter && (
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg p-6 mb-6">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="告訴我你最近的心情或煩惱..."
                  className="w-full h-32 p-4 border-2 border-purple-100 rounded-2xl focus:border-purple-300 focus:outline-none resize-none text-gray-700"
                  disabled={isGenerating}
                />
                
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={startListening}
                    disabled={isListening || isGenerating}
                    className={`flex-1 py-3 rounded-2xl font-medium transition-all flex items-center justify-center gap-2 ${
                      isListening
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    }`}
                  >
                    <Mic size={20} />
                    {isListening ? '正在聆聽...' : '語音輸入'}
                  </button>
                  
                  <button
                    onClick={generateLetter}
                    disabled={isGenerating || !input.trim()}
                    className={`flex-1 py-3 rounded-2xl font-medium transition-all flex items-center justify-center gap-2 ${
                      isGenerating
                        ? 'bg-gray-300 text-gray-500'
                        : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg'
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <Send size={20} />
                        生成療癒信
                      </>
                    )}
                  </button>
                </div>

                {letters.length > 0 && letters.length < 4 && (
                  <p className="text-center text-sm text-gray-500 mt-4">
                    再 {4 - letters.length} 封信,就能看到你的心情趨勢分析 ✨
                  </p>
                )}
              </div>
            )}

            {/* 顯示當前療癒信 */}
            {currentLetter && (
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 mb-6 animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2 text-purple-600">
                    <Mail size={24} />
                    <span className="font-medium">你的療癒信</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(currentLetter.date).toLocaleDateString('zh-TW')}
                  </span>
                </div>
                
                <div className="prose prose-lg max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {currentLetter.content}
                  </div>
                </div>

                <button
                  onClick={() => setCurrentLetter(null)}
                  className="mt-6 w-full py-3 rounded-2xl bg-purple-100 text-purple-700 hover:bg-purple-200 transition-all font-medium"
                >
                  寫下一封信
                </button>
              </div>
            )}
          </>
        )}

        {/* 歷史信件列表 */}
        {showHistory && (
          <div className="space-y-4">
            <h2 className="text-2xl font-medium text-gray-800 mb-6">歷史信件</h2>
            {letters.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                還沒有任何信件喔
              </div>
            ) : (
              letters.slice().reverse().map((letter) => (
                <div
                  key={letter.id}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md p-6 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => {
                    setCurrentLetter(letter);
                    setShowHistory(false);
                  }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-sm text-gray-500">
                      {new Date(letter.date).toLocaleDateString('zh-TW', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <p className="text-gray-600 line-clamp-2">{letter.userInput}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* 趨勢分析 */}
        {showTrend && trendAnalysis && (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 animate-fade-in">
            <div className="flex items-center gap-2 text-blue-600 mb-6">
              <TrendingUp size={24} />
              <span className="font-medium text-xl">心情趨勢分析</span>
            </div>
            
            <div className="prose prose-lg max-w-none">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {trendAnalysis.content}
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default HealingLetterApp;
