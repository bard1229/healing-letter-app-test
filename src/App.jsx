import React, { useState, useEffect } from 'react';
import { Heart, Mic, Send, Clock, TrendingUp, Mail, Sparkles, Home, ArrowLeft, LogOut } from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import LoginPage from './LoginPage';
import { generateHealingLetter, generateTrendAnalysis, analyzeEmotion } from './geminiService';

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
  const [trendAnalyses, setTrendAnalyses] = useState([]);
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
        setTrendAnalyses([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadUserData = async (userId) => {
    try {
      setLoading(true);
      
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
      
      setLetters(loadedLetters.reverse());
      console.log('載入了', loadedLetters.length, '封信件');

      if (loadedLetters.length >= 4) {
        await loadTrendAnalyses(userId);
      }
    } catch (error) {
      console.error('載入資料失敗:', error);
      alert('載入資料時發生錯誤,請重新整理頁面');
    } finally {
      setLoading(false);
    }
  };

  const loadTrendAnalyses = async (userId) => {
    try {
      const trendRef = collection(db, 'trendAnalysis');
      const q = query(
        trendRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const analyses = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        analyses.push({
          id: doc.id,
          date: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
          content: data.content,
          letterCount: data.letterCount || 4
        });
      });
      
      setTrendAnalyses(analyses);
      console.log('載入了', analyses.length, '份趨勢分析');
    } catch (error) {
      console.error('載入趨勢分析失敗:', error);
    }
  };

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

  const saveTrendAnalysisToFirestore = async (analysis) => {
    if (!user) return;
    
    try {
      const trendRef = collection(db, 'trendAnalysis');
      const docRef = await addDoc(trendRef, {
        userId: user.uid,
        userEmail: user.email,
        content: analysis.content,
        letterCount: letters.length,
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
      setTrendAnalyses([]);
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
    
    try {
      console.log('開始呼叫 Gemini API...');
      
      const content = await generateHealingLetter(input);
      console.log('Gemini 回應成功');
      
      const emotion = await analyzeEmotion(input);
      console.log('情緒分析:', emotion);
      
      const newLetter = {
        userInput: input,
        content: content,
        emotion: emotion
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
      }
    } catch (error) {
      console.error('生成信件失敗:', error);
      alert(error.message || '生成信件時發生錯誤,請稍後再試');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAndSaveTrendAnalysis = async (allLetters) => {
    try {
      console.log('開始生成趨勢分析...');
      
      const content = await generateTrendAnalysis(allLetters);
      console.log('趨勢分析生成成功');
      
      const analysis = {
        date: new Date().toISOString(),
        content: content
      };
      
      const docId = await saveTrendAnalysisToFirestore(analysis);
      
      if (docId) {
        const newAnalysis = {
          id: docId,
          letterCount: allLetters.length,
          ...analysis
        };
        
        setTrendAnalyses([newAnalysis, ...trendAnalyses]);
        setShowTrend(true);
      }
    } catch (error) {
      console.error('生成趨勢分析失敗:', error);
      alert(error.message || '生成趨勢分析時發生錯誤');
    }
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
            {trendAnalyses.length > 0 && (
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
                            正在為你準備一封溫暖的信...
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

                    {letters.length === 4 && trendAnalyses.length === 0 && (
                      <div className="mt-4 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border-2 border-blue-200 animate-fade-in">
                        <div className="flex items-center gap-2 text-blue-700 mb-3">
                          <Sparkles size={24} />
                          <span className="font-medium text-lg">這是你的第 4 封信 ✨</span>
                        </div>
                        <p className="text-gray-700 mb-4">
                          累積了 4 次的心情記錄,現在可以為你生成專屬的心情趨勢分析,
                          看看這段時間的變化和成長 💙
                        </p>
                        <button
                          onClick={() => generateAndSaveTrendAnalysis(letters)}
                          className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                          <TrendingUp size={20} />
                          為我生成心情趨勢分析
                        </button>
                      </div>
                    )}

                    {letters.length > 4 && letters.length % 4 === 0 && trendAnalyses.length > 0 && (
                      <div className="mt-4 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200 animate-fade-in">
                        <div className="flex items-center gap-2 text-purple-700 mb-3">
                          <TrendingUp size={24} />
                          <span className="font-medium text-lg">又累積了 4 封信 ✨</span>
                        </div>
                        <p className="text-gray-700 mb-4">
                          你已經寫了 {letters.length} 封信了!
                          想看看最新的心情趨勢變化嗎?
                        </p>
                        <button
                          onClick={() => generateAndSaveTrendAnalysis(letters)}
                          className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                          <TrendingUp size={20} />
                          更新我的趨勢分析
                        </button>
                      </div>
                    )}
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

            {showTrend && trendAnalyses.length > 0 && (
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
                
                <div className="space-y-6">
                  {trendAnalyses.map((analysis, index) => (
                    <div key={analysis.id} className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8">
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                          {index === 0 && (
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full font-medium">
                              最新
                            </span>
                          )}
                          <span className="text-gray-600">
                            第 {trendAnalyses.length - index} 次分析
                          </span>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <div>{new Date(analysis.date).toLocaleDateString('zh-TW', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}</div>
                          <div className="text-xs">基於 {analysis.letterCount} 封信件</div>
                        </div>
                      </div>
                      <div className="prose prose-lg max-w-none">
                        <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                          {analysis.content}
                        </div>
                      </div>
                    </div>
                  ))}
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
