import React, { useState, useEffect } from 'react';
import { Heart, Mic, Send, Clock, TrendingUp, Mail, Sparkles, Home, ArrowLeft, LogOut } from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, query, where, getDocs, orderBy, Timestamp, doc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import LoginPage from './LoginPage';

const HealingLetterApp = () => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentLetter, setCurrentLetter] = useState(null);
  const [letters, setLetters] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showTrend, setShowTrend] = useState(false);
  const [trendAnalysis, setTrendAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      
      if (currentUser) {
        console.log('使用者已登入:', currentUser.email);
        loadUserData(currentUser.uid);
      } else {
        console.log('使用者未登入');
        setLetters([]);
        setTrendAnalysis(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // 載入使用者資料(信件 + 趨勢分析)
  const loadUserData = async (userId) => {
    try {
      setLoading(true);
      
      // 載入信件
      const lettersRef = collection(db, 'letters');
      const q = query(
        lettersRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const loadedLetters = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        loadedLetters.push({
          id: doc.id,
          ...data,
          date: data.createdAt?.toDate().toISOString() || new Date().toISOString()
        });
      });
      
      setLetters(loadedLetters);
      console.log('載入了', loadedLetters.length, '封信件');

      // 如果有 4 封或以上,載入趨勢分析
      if (loadedLetters.length >= 4) {
        await loadTrendAnalysis(userId);
      }
    } catch (error) {
      console.error('載入資料失敗:', error);
      alert('載入資料時發生錯誤,請重新整理頁面');
    } finally {
      setLoading(false);
    }
  };

  // 載入趨勢分析
  const loadTrendAnalysis = async (userId) => {
    try {
      const trendRef = collection(db, 'trendAnalysis');
      const q = query(
        trendRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const latestTrend = querySnapshot.docs[0].data();
        setTrendAnalysis({
          id: querySnapshot.docs[0].id,
          date: latestTrend.createdAt?.toDate().toISOString() || new Date().toISOString(),
          content: latestTrend.content
        });
        console.log('載入了趨勢分析');
      }
    } catch (error) {
      console.error('載入趨勢分析失敗:', error);
    }
  };

  // 儲存信件到 Firestore
  const saveLetterToFirestore = async (letter) => {
    if (!user) return;
    
    try {
      const lettersRef = collection(db, 'letters');
      const docRef = await addDoc(lettersRef, {
        userId: user.uid,
        userEmail: user.email,
        userInput: letter.userInput,
        content: letter.content,
        emotion: letter.emotion,
        createdAt: Timestamp.now()
      });
      
      console.log('信件已儲存,ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('儲存信件失敗:', error);
      alert('儲存信件時發生錯誤');
    }
  };

  // 儲存趨勢分析到 Firestore
  const saveTrendAnalysisToFirestore = async (analysis) => {
    if (!user) return;
    
    try {
      const trendRef = collection(db, 'trendAnalysis');
      const docRef = await addDoc(trendRef, {
        userId: user.uid,
        userEmail: user.email,
        content: analysis.content,
        letterCount: letters.length + 1, // 包含剛寫的這封
        createdAt: Timestamp.now()
      });
      
      console.log('趨勢分析已儲存,ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('儲存趨勢分析失敗:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setLetters([]);
      setCurrentLetter(null);
      setShowHistory(false);
      setShowTrend(false);
      setTrendAnalysis(null);
      console.log('登出成功');
    } catch (error) {
      console.error('登出失敗:', error);
      alert('登出時發生錯誤');
    }
  };

  const goHome = () => {
    setShowHistory(false);
    setShowTrend(false);
    setCurrentLetter(null);
  };

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
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + ' ' + transcript);
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        let errorMsg = '語音輸入發生錯誤 😢\n\n';
        if (event.error === 'not-allowed') {
          errorMsg += '請允許瀏覽器使用麥克風權限';
        } else if (event.error === 'no-speech') {
          errorMsg += '沒有偵測到聲音,請再試一次';
        }
        alert(errorMsg);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (error) {
      alert('語音輸入啟動失敗');
      setIsListening(false);
    }
  };

  const generateLetter = async () => {
    if (!input.trim()) {
      alert('請先告訴我你的心情或煩惱喔 💙');
      return;
    }

    setIsGenerating(true);
    
    setTimeout(async () => {
      const newLetter = {
        userInput: input,
        content: generateHealingContent(input),
        emotion: analyzeEmotion(input)
      };

      const docId = await saveLetterToFirestore(newLetter);
      
      if (docId) {
        const letterWithId = {
          id: docId,
          date: new Date().toISOString(),
          ...newLetter
        };
        
        const newLetters = [...letters, letterWithId];
        setLetters(newLetters);
        setCurrentLetter(letterWithId);
        setInput('');
        setIsGenerating(false);

        // 檢查是否達到 4 封(且之前沒有生成過趨勢分析)
        if (newLetters.length === 4 && !trendAnalysis) {
          console.log('達到 4 封信,生成趨勢分析...');
          setTimeout(() => {
            generateAndSaveTrendAnalysis(newLetters);
          }, 1000);
        } else if (newLetters.length > 4 && newLetters.length % 4 === 0) {
          // 每累積 4 封就更新一次趨勢分析
          console.log('累積', newLetters.length, '封信,更新趨勢分析...');
          setTimeout(() => {
            generateAndSaveTrendAnalysis(newLetters);
          }, 1000);
        }
      } else {
        setIsGenerating(false);
      }
    }, 2000);
  };

  // 生成並儲存趨勢分析
  const generateAndSaveTrendAnalysis = async (allLetters) => {
    const analysis = {
      date: new Date().toISOString(),
      content: generateTrendContent(allLetters)
    };
    
    // 儲存到 Firestore
    const docId = await saveTrendAnalysisToFirestore(analysis);
    
    if (docId) {
      setTrendAnalysis({
        id: docId,
        ...analysis
      });
      setShowTrend(true);
    }
  };

  // 生成趨勢分析內容
  const generateTrendContent = (allLetters) => {
    const emotions = allLetters.map(l => l.emotion);
    const stressedCount = emotions.filter(e => e === 'stressed').length;
    const sadCount = emotions.filter(e => e === 'sad').length;
    const confusedCount = emotions.filter(e => e === 'confused').length;
    
    let observation = '';
    if (stressedCount > allLetters.length / 2) {
      observation = '你最近似乎承受著不少的壓力。這些壓力可能來自工作、生活,或是對自己的期待。記得要好好照顧自己,適時休息很重要。';
    } else if (sadCount > allLetters.length / 2) {
      observation = '你的心情時常感到低落。這樣的感受雖然辛苦,但我看見你每一次都願意面對,這份勇氣很珍貴。';
    } else if (confusedCount > allLetters.length / 2) {
      observation = '你似乎正處在一個迷茫的階段,對未來有些不確定。這種感覺雖然不舒服,但也代表你正在思考、正在成長。';
    } else {
      observation = '你的情緒有著不同的起伏,這是很自然的。每一種情緒都在告訴你一些訊息,值得我們好好聆聽。';
    }

    return `親愛的你:

這段時間,我一直陪伴著你,也見證了你的心情變化。

回顧這 ${allLetters.length} 次的對話,我注意到:

${observation}

在這段時間裡,我也看見了你的成長:
• 你願意表達自己的感受,這需要很大的勇氣
• 你持續在面對生活的挑戰,從未放棄
• 你懂得尋求支持,這是很有智慧的選擇
• 即使在困難中,你仍在努力照顧自己

或許,接下來你可以留意:
• 給自己一些放鬆的時間,不一定要一直往前衝
• 記錄那些讓你感到開心的小事,它們比你想像的重要
• 培養一些讓自己感到平靜的習慣,像是散步、聽音樂、寫日記
• 必要時,尋求專業的協助也是一種照顧自己的方式

無論未來如何,請記得:你不是一個人。我會一直在這裡,陪著你慢慢前進。

你已經做得很好了,繼續加油,也繼續善待自己。

永遠支持你的
一封給你的信 💙

分析日期: ${new Date().toLocaleDateString('zh-TW')}`;
  };

  const generateHealingContent = (userInput) => {
    const lowerInput = userInput.toLowerCase();
    
    const greetings = ['親愛的你:', '嗨,', '你好:', '親愛的朋友:'];
    const acknowledgments = [
      '我收到了你的心聲,也感受到了你此刻的心情。',
      '謝謝你願意和我分享這些。我聽見你了。',
      '看到你的訊息,我能感受到你現在的狀態。',
      '你願意說出這些,我覺得很珍貴。',
    ];

    let emotionResponse = '';
    let suggestion = '';
    
    if (lowerInput.includes('壓力') || lowerInput.includes('累') || lowerInput.includes('疲憊') || lowerInput.includes('忙')) {
      const responses = [
        '工作和生活的壓力,有時候真的會讓人感到喘不過氣。你願意說出來,本身就是很勇敢的一步。',
        '我知道這種累,不只是身體的累,更多是心的累。能夠承認自己累了,其實需要很大的勇氣。',
        '感覺你最近真的扛了很多。這些壓力都是真實存在的,你的感受也都是合理的。',
      ];
      const suggestions = [
        '或許可以試著給自己一些喘息的空間。不一定要馬上解決所有問題,先讓自己好好休息,也是很重要的。',
        '有時候,我們需要學會放下一些「應該」和「必須」。你已經做得夠多了,真的。',
      ];
      emotionResponse = responses[Math.floor(Math.random() * responses.length)];
      suggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
    } else if (lowerInput.includes('難過') || lowerInput.includes('傷心') || lowerInput.includes('委屈')) {
      const responses = [
        '我聽到了你的難過。這樣的感覺確實很不容易,但請記得,允許自己感到難過,也是一種溫柔的力量。',
        '你的眼淚和難過,都是很真實的情緒。不需要壓抑,也不需要急著好起來。',
      ];
      const suggestions = [
        '如果想哭,就讓眼淚流下來吧。有時候,哭過之後,心裡會輕鬆一些。',
        '給自己一些時間和空間,慢慢去感受、去理解這些情緒。不用急著「振作」。',
      ];
      emotionResponse = responses[Math.floor(Math.random() * responses.length)];
      suggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
    } else {
      const responses = [
        '謝謝你願意和我分享這些。每一個感受都值得被好好對待,包括此刻的你。',
        '我聽見你了。你說的這些,我都收到了。',
      ];
      const suggestions = [
        '或許可以給自己一些時間,好好感受現在的狀態。不用急著改變什麼。',
        '記得對自己溫柔一點。你已經做得很好了。',
      ];
      emotionResponse = responses[Math.floor(Math.random() * responses.length)];
      suggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
    }
    
    const endings = [
      '最後,我想對你說:你已經做得很好了。未來的路,我們一起慢慢走。',
      '記得,你不是一個人。無論何時,這裡都會有一封信等著你。',
      '繼續加油,也繼續善待自己。你值得所有美好的事物。',
    ];
    
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    const acknowledgment = acknowledgments[Math.floor(Math.random() * acknowledgments.length)];
    const ending = endings[Math.floor(Math.random() * endings.length)];

    return `${greeting}

${acknowledgment}

${emotionResponse}

${suggestion}

${ending}

永遠支持你的
一封給你的信 ✨`;
  };

  const analyzeEmotion = (text) => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('壓力') || lowerText.includes('累') || lowerText.includes('疲憊')) return 'stressed';
    if (lowerText.includes('難過') || lowerText.includes('傷心') || lowerText.includes('委屈')) return 'sad';
    if (lowerText.includes('迷茫') || lowerText.includes('不知道') || lowerText.includes('困惑')) return 'confused';
    return 'neutral';
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="bg-white/80 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Heart className="text-pink-500" fill="currentColor" size={24} />
            <h1 className="text-xl font-medium text-gray-800">給你的一封信</h1>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <span className="text-sm text-gray-600 hidden sm:inline">
              {user.email}
            </span>
            {(showHistory || showTrend) && (
              <button
                onClick={goHome}
                className="px-4 py-2 rounded-full bg-pink-100 text-pink-700 hover:bg-pink-200 transition-all flex items-center gap-2"
              >
                <Home size={16} />
                <span className="hidden sm:inline">首頁</span>
              </button>
            )}
            <button
              onClick={() => { setShowHistory(!showHistory); setShowTrend(false); setCurrentLetter(null); }}
              className="px-4 py-2 rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 transition-all flex items-center gap-2"
            >
              <Clock size={16} />
              <span className="hidden sm:inline">歷史</span> ({letters.length})
            </button>
            {trendAnalysis && (
              <button
                onClick={() => { setShowTrend(!showTrend); setShowHistory(false); setCurrentLetter(null); }}
                className="px-4 py-2 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all flex items-center gap-2"
              >
                <TrendingUp size={16} />
                <span className="hidden sm:inline">趨勢</span>
              </button>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all flex items-center gap-2"
              title="登出"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">載入中...</p>
          </div>
        ) : (
          <>
            {!showHistory && !showTrend && (
              <>
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
                        {isListening ? '聆聽中...' : '語音'}
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

                    {letters.length > 0 && letters.length < 4 && !trendAnalysis && (
                      <p className="text-center text-sm text-gray-500 mt-4">
                        再 {4 - letters.length} 封信,就能看到你的心情趨勢分析 ✨
                      </p>
                    )}
                    {letters.length >= 4 && trendAnalysis && (
                      <p className="text-center text-sm text-blue-600 mt-4">
                        ✨ 你已經有趨勢分析了!點右上角「趨勢」查看
                      </p>
                    )}
                  </div>
                )}

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

            {showHistory && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-6">
                  <button
                    onClick={goHome}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <ArrowLeft size={24} />
                  </button>
                  <h2 className="text-2xl font-medium text-gray-800">歷史信件</h2>
                </div>
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

            {showTrend && trendAnalysis && (
              <div className="animate-fade-in">
                <div className="flex items-center gap-3 mb-6">
                  <button
                    onClick={goHome}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <ArrowLeft size={24} />
                  </button>
                  <div className="flex items-center gap-2 text-blue-600">
                    <TrendingUp size={24} />
                    <span className="font-medium text-xl">心情趨勢分析</span>
                  </div>
                </div>
                
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8">
                  <div className="prose prose-lg max-w-none">
                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                      {trendAnalysis.content}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
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
