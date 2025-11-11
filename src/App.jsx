import React, { useState, useEffect } from 'react';
import { Heart, Mic, Send, Clock, TrendingUp, Mail, Sparkles, Home, ArrowLeft, LogOut, Calendar, BarChart3, ChevronLeft, ChevronRight, AlertCircle, Share2, Facebook, Twitter, Instagram } from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import LoginPage from './LoginPage';
import { generateHealingLetter, generateTrendAnalysis, analyzeEmotion } from './geminiService';

// 水獺圖片
const OTTER_IMAGE = '/otter.png';

const HealingNoteApp = () => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentLetter, setCurrentLetter] = useState(null);
  const [letters, setLetters] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showTrend, setShowTrend] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showDayDetail, setShowDayDetail] = useState(false);
  const [selectedDayLetters, setSelectedDayLetters] = useState([]);
  const [trendAnalyses, setTrendAnalyses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);
  const [emotionStats, setEmotionStats] = useState({});
  const [calendarDate, setCalendarDate] = useState(new Date());

  // 免費版每日限制
  const DAILY_LIMIT = 2;

  // 情緒 emoji 對照
  const emotionEmojis = {
    '壓力': '😰',
    '難過': '😢',
    '迷茫': '🤔',
    '焦慮': '😰',
    '開心': '😊',
    '平靜': '😌'
  };

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
        setDailyCount(0);
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

      // 計算今日已寫次數
      const today = new Date().toDateString();
      const todayLetters = loadedLetters.filter(l => 
        new Date(l.date).toDateString() === today
      );
      setDailyCount(todayLetters.length);

      // 計算情緒統計
      calculateEmotionStats(loadedLetters);

      // 載入趨勢分析
      await loadTrendAnalyses(userId);
      
    } catch (error) {
      console.error('載入資料失敗:', error);
      alert('載入資料時發生錯誤,請重新整理頁面');
    } finally {
      setLoading(false);
    }
  };

  // 檢查連續記錄天數
  const checkConsecutiveDays = (allLetters) => {
    if (allLetters.length === 0) return 0;

    const dates = [...new Set(allLetters.map(l => 
      new Date(l.date).toDateString()
    ))].sort((a, b) => new Date(b) - new Date(a));

    let consecutiveDays = 1;
    for (let i = 0; i < dates.length - 1; i++) {
      const current = new Date(dates[i]);
      const next = new Date(dates[i + 1]);
      const diffDays = Math.floor((current - next) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        consecutiveDays++;
      } else {
        break;
      }
    }

    return consecutiveDays;
  };

  // 計算總記錄天數
  const getTotalDays = (allLetters) => {
    if (allLetters.length === 0) return 0;
    const uniqueDates = new Set(allLetters.map(l => new Date(l.date).toDateString()));
    return uniqueDates.size;
  };

  // 計算情緒統計
  const calculateEmotionStats = (allLetters) => {
    if (allLetters.length === 0) {
      setEmotionStats({});
      return;
    }

    const recentLetters = allLetters.filter(l => l.emotion);

    if (recentLetters.length === 0) {
      setEmotionStats({});
      return;
    }

    const emotionCount = {};
    const emotionMap = {
      '壓力': { emoji: '😰', name: '壓力' },
      '焦慮': { emoji: '😰', name: '焦慮' },
      '緊張': { emoji: '😰', name: '緊張' },
      '難過': { emoji: '😢', name: '難過' },
      '悲傷': { emoji: '😢', name: '悲傷' },
      '失落': { emoji: '😢', name: '失落' },
      '迷茫': { emoji: '🤔', name: '迷茫' },
      '困惑': { emoji: '🤔', name: '困惑' },
      '不安': { emoji: '🤔', name: '不安' },
      '開心': { emoji: '😊', name: '開心' },
      '快樂': { emoji: '😊', name: '快樂' },
      '喜悅': { emoji: '😊', name: '喜悅' },
      '平靜': { emoji: '😌', name: '平靜' },
      '放鬆': { emoji: '😌', name: '放鬆' },
      '安心': { emoji: '😌', name: '安心' }
    };

    recentLetters.forEach(letter => {
      if (letter.emotion) {
        const emotion = letter.emotion.trim();
        const emotionInfo = emotionMap[emotion] || { emoji: '💭', name: emotion };
        const key = `${emotionInfo.emoji} ${emotionInfo.name}`;
        emotionCount[key] = (emotionCount[key] || 0) + 1;
      }
    });

    const total = Object.values(emotionCount).reduce((a, b) => a + b, 0);
    const stats = {};
    Object.entries(emotionCount).forEach(([key, count]) => {
      stats[key] = {
        count,
        percentage: Math.round((count / total) * 100)
      };
    });

    setEmotionStats(stats);
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
      setShowStats(false);
      setShowCalendar(false);
      setShowDayDetail(false);
      setSelectedDayLetters([]);
      setTrendAnalyses([]);
      setDailyCount(0);
      console.log('登出成功');
    } catch (error) {
      console.error('登出失敗:', error);
      alert('登出時發生錯誤');
    }
  };

  const goHome = () => {
    setShowHistory(false);
    setShowTrend(false);
    setShowStats(false);
    setShowCalendar(false);
    setShowDayDetail(false);
    setCurrentLetter(null);
    setSelectedDayLetters([]);
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
    // 檢查每日限制
    if (dailyCount >= DAILY_LIMIT) {
      alert(`📔 今日記錄已達上限\n\n免費版每天限 ${DAILY_LIMIT} 次記錄\n明天再來記錄新的心情吧! 💙`);
      return;
    }

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
        setDailyCount(dailyCount + 1);
        
        // 重新計算情緒統計
        calculateEmotionStats(newLetters);
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
        setCurrentLetter(null);
      }
    } catch (error) {
      console.error('生成趨勢分析失敗:', error);
      alert(error.message || '生成趨勢分析時發生錯誤');
    }
  };

  // 社群分享功能
  const shareToSocial = (platform, content) => {
    const text = `我在 HealingNote 記錄了我的心情變化 ✨\n\n${content.substring(0, 100)}...\n\n#情緒日記 #心理健康 #HealingNote`;
    const url = window.location.href;
    
    let shareUrl = '';
    
    switch(platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'threads':
        shareUrl = `https://threads.net/intent/post?text=${encodeURIComponent(text)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(text + '\n\n' + url);
        alert('✅ 已複製到剪貼簿!\n\n可以貼到 IG 限時動態或 TikTok 了!');
        return;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  // 心情日曆相關函數
  const getCalendarData = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const calendar = [];
    let week = new Array(7).fill(null);
    
    for (let i = 0; i < firstDayOfWeek; i++) {
      week[i] = null;
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayOfWeek = (firstDayOfWeek + day - 1) % 7;
      const date = new Date(year, month, day);
      
      const dayLetters = letters.filter(letter => {
        const letterDate = new Date(letter.date);
        return letterDate.getFullYear() === year &&
               letterDate.getMonth() === month &&
               letterDate.getDate() === day;
      });
      
      week[dayOfWeek] = {
        day,
        date,
        letters: dayLetters,
        emotion: dayLetters.length > 0 ? dayLetters[dayLetters.length - 1].emotion : null
      };
      
      if (dayOfWeek === 6) {
        calendar.push(week);
        week = new Array(7).fill(null);
      }
    }
    
    if (week.some(d => d !== null)) {
      calendar.push(week);
    }
    
    return calendar;
  };

  const changeMonth = (offset) => {
    const newDate = new Date(calendarDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCalendarDate(newDate);
  };

  const handleDayClick = (dayData) => {
    if (dayData.letters.length > 0) {
      setSelectedDayLetters(dayData.letters);
      setShowDayDetail(true);
      setShowCalendar(false);
    }
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
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

  const consecutiveDays = checkConsecutiveDays(letters);
  const totalDays = getTotalDays(letters);
  const canGenerateTrend = totalDays >= 4; // 改為總天數 >= 4 天
  const calendarData = getCalendarData();
  const isLimitReached = dailyCount >= DAILY_LIMIT;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={OTTER_IMAGE} alt="歐特" className="w-12 h-12 object-contain" />
            <div>
              <h1 className="text-xl font-medium text-gray-800">HealingNote 療心筆記</h1>
              <p className="text-xs text-gray-500 hidden sm:block">每一個情緒都值得被理解 💙</p>
            </div>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <span className="text-sm text-gray-600 hidden sm:inline">
              {user.email}
            </span>
            {(showHistory || showTrend || showStats || showCalendar || showDayDetail) && (
              <button
                onClick={goHome}
                className="px-4 py-2 rounded-full bg-pink-100 text-pink-700 hover:bg-pink-200 transition-all flex items-center gap-2"
              >
                <Home size={16} />
                <span className="hidden sm:inline">首頁</span>
              </button>
            )}
            <button
              onClick={() => { setShowHistory(!showHistory); setShowTrend(false); setShowStats(false); setShowCalendar(false); setShowDayDetail(false); setCurrentLetter(null); }}
              className="px-4 py-2 rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 transition-all flex items-center gap-2"
            >
              <Clock size={16} />
              <span className="hidden sm:inline">歷史</span> ({letters.length})
            </button>
            {letters.length > 0 && (
              <button
                onClick={() => { setShowCalendar(!showCalendar); setShowHistory(false); setShowTrend(false); setShowStats(false); setShowDayDetail(false); setCurrentLetter(null); }}
                className="px-4 py-2 rounded-full bg-green-100 text-green-700 hover:bg-green-200 transition-all flex items-center gap-2"
              >
                <Calendar size={16} />
                <span className="hidden sm:inline">日曆</span>
              </button>
            )}
            {Object.keys(emotionStats).length > 0 && (
              <button
                onClick={() => { setShowStats(!showStats); setShowHistory(false); setShowTrend(false); setShowCalendar(false); setShowDayDetail(false); setCurrentLetter(null); }}
                className="px-4 py-2 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all flex items-center gap-2"
              >
                <BarChart3 size={16} />
                <span className="hidden sm:inline">統計</span>
              </button>
            )}
            {trendAnalyses.length > 0 && (
              <button
                onClick={() => { setShowTrend(!showTrend); setShowHistory(false); setShowStats(false); setShowCalendar(false); setShowDayDetail(false); setCurrentLetter(null); }}
                className="px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-all flex items-center gap-2"
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
            {/* 當天多筆記錄詳細頁面 */}
            {showDayDetail && selectedDayLetters.length > 0 && (
              <div className="animate-fade-in">
                <div className="flex items-center gap-3 mb-6">
                  <button
                    onClick={() => { setShowDayDetail(false); setShowCalendar(true); }}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <ArrowLeft size={24} />
                  </button>
                  <h2 className="text-2xl font-medium text-gray-800">
                    {new Date(selectedDayLetters[0].date).toLocaleDateString('zh-TW', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })} 的記錄 📝
                  </h2>
                  <span className="text-sm text-gray-500">
                    共 {selectedDayLetters.length} 篇
                  </span>
                </div>

                <div className="space-y-6">
                  {selectedDayLetters.map((letter, index) => (
                    <div key={letter.id} className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <img src={OTTER_IMAGE} alt="歐特" className="w-12 h-12 object-contain" />
                          <div>
                            <div className="flex items-center gap-2 text-purple-600">
                              <Mail size={24} />
                              <span className="font-medium">第 {index + 1} 篇記錄 💌</span>
                            </div>
                            {letter.emotion && (
                              <div className="text-sm text-gray-500 mt-1">
                                情緒: <span className="font-medium">{emotionEmojis[letter.emotion] || '💭'} {letter.emotion}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(letter.date).toLocaleTimeString('zh-TW', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })} ⏰
                        </span>
                      </div>

                      {/* 使用者輸入 */}
                      <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500 mb-2">💭 你的心情:</p>
                        <p className="text-gray-700">{letter.userInput}</p>
                      </div>

                      {/* AI 回應 */}
                      <div className="prose prose-lg max-w-none">
                        <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                          {letter.content}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => { setShowDayDetail(false); setShowCalendar(true); }}
                  className="mt-6 w-full py-3 rounded-2xl bg-purple-100 text-purple-700 hover:bg-purple-200 transition-all font-medium"
                >
                  📅 返回日曆
                </button>
              </div>
            )}

            {/* 心情日曆頁面 */}
            {showCalendar && !showDayDetail && (
              <div className="animate-fade-in">
                <div className="flex items-center gap-3 mb-6">
                  <button
                    onClick={goHome}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <ArrowLeft size={24} />
                  </button>
                  <div className="flex items-center gap-2 text-green-600">
                    <Calendar size={24} />
                    <span className="font-medium text-xl">心情日曆 📅</span>
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-6 md:p-8">
                  {/* 月份選擇器 */}
                  <div className="flex items-center justify-between mb-6">
                    <button
                      onClick={() => changeMonth(-1)}
                      className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <ChevronLeft size={24} className="text-gray-600" />
                    </button>
                    
                    <h3 className="text-xl font-medium text-gray-800">
                      {calendarDate.getFullYear()} 年 {calendarDate.getMonth() + 1} 月
                    </h3>
                    
                    <button
                      onClick={() => changeMonth(1)}
                      className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <ChevronRight size={24} className="text-gray-600" />
                    </button>
                  </div>

                  {/* 星期標題 */}
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {['日', '一', '二', '三', '四', '五', '六'].map(day => (
                      <div key={day} className="text-center font-medium text-gray-600 text-sm">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* 日曆格子 */}
                  <div className="space-y-2">
                    {calendarData.map((week, weekIndex) => (
                      <div key={weekIndex} className="grid grid-cols-7 gap-2">
                        {week.map((dayData, dayIndex) => (
                          <div
                            key={dayIndex}
                            onClick={() => dayData && dayData.letters.length > 0 && handleDayClick(dayData)}
                            className={`
                              aspect-square flex flex-col items-center justify-center rounded-xl
                              ${dayData ? 'bg-gray-50' : ''}
                              ${dayData && dayData.letters.length > 0 ? 'cursor-pointer hover:bg-purple-50 hover:shadow-md transition-all' : ''}
                              ${dayData && isToday(dayData.date) ? 'ring-2 ring-purple-500' : ''}
                            `}
                          >
                            {dayData && (
                              <>
                                <span className="text-sm text-gray-700 mb-1">
                                  {dayData.day}
                                </span>
                                {dayData.emotion && (
                                  <span className="text-2xl">
                                    {emotionEmojis[dayData.emotion] || '💭'}
                                  </span>
                                )}
                                {dayData.letters.length > 1 && (
                                  <span className="text-xs text-gray-400 mt-1">
                                    {dayData.letters.length}篇
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* 說明 */}
                  <div className="mt-6 p-4 bg-purple-50 rounded-xl">
                    <p className="text-sm text-gray-600 text-center">
                      💡 點擊有 emoji 的日期可以查看當天的記錄
                    </p>
                    {letters.length === 0 && (
                      <p className="text-sm text-gray-500 text-center mt-2">
                        開始記錄心情,日曆就會顯示你的情緒變化喔! ✨
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 主頁面 */}
            {!showHistory && !showTrend && !showStats && !showCalendar && !showDayDetail && (
              <>
                {/* 新用戶:完整簡介 */}
                {!currentLetter && letters.length === 0 && !isLimitReached && (
                  <div className="text-center mb-8 animate-fade-in">
                    <div className="inline-block mb-6">
                      <img src={OTTER_IMAGE} alt="歐特" className="w-32 h-auto mx-auto mb-4" />
                    </div>
                    <h2 className="text-2xl font-medium text-gray-800 mb-4">
                      你的私密情緒日記 📔
                    </h2>
                    <div className="max-w-2xl mx-auto text-left bg-white/60 rounded-2xl p-6 mb-4">
                      <p className="text-gray-700 mb-4">
                        記錄每一天的心情起伏 🌈<br />
                        不只回應你,更幫你看見情緒變化 💙<br />
                        你的專屬情緒管家 🦦
                      </p>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p>1️⃣ 專注情緒健康,溫暖細膩的覺察 ✨</p>
                        <p>2️⃣ 保存記錄,追蹤心情變化 📊</p>
                        <p>3️⃣ 智能趨勢分析,陪你看見自己的成長 🌱</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 老用戶:簡短歡迎 */}
                {!currentLetter && letters.length > 0 && !isLimitReached && (
                  <div className="text-center mb-8 animate-fade-in">
                    <div className="inline-block mb-4">
                      <img src={OTTER_IMAGE} alt="歐特" className="w-20 h-auto mx-auto" />
                    </div>
                    <h2 className="text-2xl font-medium text-gray-800 mb-2">
                      歡迎回來! 🦦✨
                    </h2>
                    <p className="text-gray-600 mb-4">
                      今天想記錄什麼心情呢? 💭
                    </p>
                    <div className="max-w-md mx-auto bg-white/60 rounded-2xl p-4">
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="text-center">
                          <div className="text-2xl mb-1">📊</div>
                          <div className="text-gray-600">已記錄</div>
                          <div className="font-medium text-purple-600">{totalDays} 天</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl mb-1">🔥</div>
                          <div className="text-gray-600">連續</div>
                          <div className="font-medium text-purple-600">{consecutiveDays} 天</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl mb-1">💌</div>
                          <div className="text-gray-600">總計</div>
                          <div className="font-medium text-purple-600">{letters.length} 封</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 每日限制已達提示 */}
                {isLimitReached && !currentLetter && (
                  <div className="mb-6 p-6 bg-gradient-to-r from-orange-50 to-pink-50 rounded-3xl border-2 border-orange-200 animate-fade-in">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <AlertCircle size={32} className="text-orange-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-orange-800 mb-2">
                          📔 今日記錄已達上限
                        </h3>
                        <p className="text-gray-700 mb-3">
                          免費版每天限 {DAILY_LIMIT} 次記錄,你今天已經完成了 {dailyCount} 次記錄! 🎉
                        </p>
                        <div className="bg-white/60 rounded-xl p-4 mb-3">
                          <p className="text-sm text-gray-600 mb-2">💡 小建議:</p>
                          <ul className="text-sm text-gray-600 space-y-1 ml-4">
                            <li>• 明天再來記錄新的心情 ☀️</li>
                            <li>• 可以查看「日曆」回顧今天的記錄 📅</li>
                            <li>• 或查看「統計」了解情緒變化 📊</li>
                          </ul>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setShowCalendar(true)}
                            className="px-4 py-2 rounded-xl bg-white text-gray-700 hover:bg-gray-50 transition-all text-sm font-medium"
                          >
                            📅 查看日曆
                          </button>
                          {Object.keys(emotionStats).length > 0 && (
                            <button
                              onClick={() => setShowStats(true)}
                              className="px-4 py-2 rounded-xl bg-white text-gray-700 hover:bg-gray-50 transition-all text-sm font-medium"
                            >
                              📊 查看統計
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 輸入區 */}
                {!currentLetter && (
                  <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-gray-700">今日心情記錄 ✍️</h3>
                      <div className="text-sm text-gray-500">
                        今日剩餘: <span className={`font-medium ${isLimitReached ? 'text-orange-600' : 'text-purple-600'}`}>
                          {DAILY_LIMIT - dailyCount}
                        </span> / {DAILY_LIMIT} 次
                      </div>
                    </div>
                    
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={isLimitReached ? "今日記錄已達上限,明天再來記錄新的心情吧! 💙" : "告訴我你最近的心情或煩惱... 💭"}
                      className="w-full h-32 p-4 border-2 border-purple-100 rounded-2xl focus:border-purple-300 focus:outline-none resize-none text-gray-700"
                      disabled={isGenerating || isLimitReached}
                    />
                    
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={startListening}
                        disabled={isListening || isGenerating || isLimitReached}
                        className={`flex-1 py-3 rounded-2xl font-medium transition-all flex items-center justify-center gap-2 ${
                          isListening
                            ? 'bg-red-500 text-white animate-pulse'
                            : isLimitReached
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                        }`}
                      >
                        <Mic size={20} />
                        {isListening ? '聆聽中... 🎤' : '語音 🎤'}
                      </button>
                      
                      <button
                        onClick={generateLetter}
                        disabled={isGenerating || !input.trim() || isLimitReached}
                        className={`flex-1 py-3 rounded-2xl font-medium transition-all flex items-center justify-center gap-2 ${
                          isGenerating || isLimitReached
                            ? 'bg-gray-300 text-gray-500'
                            : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg'
                        }`}
                      >
                        {isGenerating ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            覺察情緒中...
                          </>
                        ) : (
                          <>
                            <Send size={20} />
                            看見你的情緒 ✨
                          </>
                        )}
                      </button>
                    </div>

                    {/* 連續記錄進度 */}
                    {letters.length > 0 && !isLimitReached && (
                      <div className="mt-4 p-4 bg-purple-50 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-700">📊 記錄統計</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600">連續: </span>
                            <span className="font-medium text-purple-600">{consecutiveDays} 天 🔥</span>
                          </div>
                          <div>
                            <span className="text-gray-600">總計: </span>
                            <span className="font-medium text-purple-600">{totalDays} 天 📅</span>
                          </div>
                        </div>
                        {!canGenerateTrend && (
                          <p className="text-xs text-gray-500 mt-2">
                            💡 記錄滿 {4 - totalDays} 天,就能獲得趨勢分析 ✨
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 顯示當前信件 */}
                {currentLetter && (
                  <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 mb-6 animate-fade-in">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <img src={OTTER_IMAGE} alt="歐特" className="w-12 h-12 object-contain" />
                        <div>
                          <div className="flex items-center gap-2 text-purple-600">
                            <Mail size={24} />
                            <span className="font-medium">歐特的回應 💌</span>
                          </div>
                          {currentLetter.emotion && (
                            <div className="text-sm text-gray-500 mt-1">
                              情緒: <span className="font-medium">{emotionEmojis[currentLetter.emotion] || '💭'} {currentLetter.emotion}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(currentLetter.date).toLocaleDateString('zh-TW')} 📅
                      </span>
                    </div>
                    
                    <div className="prose prose-lg max-w-none">
                      <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                        {currentLetter.content}
                      </div>
                    </div>

                    {/* 社群分享按鈕 */}
                    <div className="mt-6 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl">
                      <div className="flex items-center gap-2 mb-3">
                        <Share2 size={20} className="text-purple-600" />
                        <span className="text-sm font-medium text-gray-700">分享你的心情成長 ✨</span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => shareToSocial('facebook', currentLetter.content)}
                          className="flex-1 min-w-[100px] px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <Facebook size={16} />
                          Facebook
                        </button>
                        <button
                          onClick={() => shareToSocial('twitter', currentLetter.content)}
                          className="flex-1 min-w-[100px] px-4 py-2 rounded-xl bg-sky-500 text-white hover:bg-sky-600 transition-all text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <Twitter size={16} />
                          X (Twitter)
                        </button>
                        <button
                          onClick={() => shareToSocial('threads', currentLetter.content)}
                          className="flex-1 min-w-[100px] px-4 py-2 rounded-xl bg-black text-white hover:bg-gray-800 transition-all text-sm font-medium"
                        >
                          Threads
                        </button>
                        <button
                          onClick={() => shareToSocial('copy', currentLetter.content)}
                          className="flex-1 min-w-[100px] px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:shadow-lg transition-all text-sm font-medium"
                        >
                          複製文案
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        💡 複製文案可貼到 IG 限動或 TikTok
                      </p>
                    </div>

                    <button
                      onClick={() => setCurrentLetter(null)}
                      className="mt-6 w-full py-3 rounded-2xl bg-purple-100 text-purple-700 hover:bg-purple-200 transition-all font-medium"
                    >
                      {isLimitReached ? '查看今日記錄 📅' : '繼續記錄心情 ✍️'}
                    </button>

                    {/* 趨勢分析提示 - 修正條件 */}
                    {canGenerateTrend && trendAnalyses.length === 0 && (
                      <div className="mt-4 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border-2 border-blue-200 animate-fade-in">
                        <div className="flex items-center gap-2 text-blue-700 mb-3">
                          <Sparkles size={24} />
                          <span className="font-medium text-lg">已記錄 {totalDays} 天! 🎉</span>
                        </div>
                        <p className="text-gray-700 mb-4">
                          太棒了!你已經記錄了 {totalDays} 天的心情,現在可以為你生成專屬的心情趨勢分析,
                          看看這段時間的變化和成長 💙✨
                        </p>
                        <button
                          onClick={() => generateAndSaveTrendAnalysis(letters)}
                          className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                          <TrendingUp size={20} />
                          為我生成心情趨勢分析 ✨
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* 歷史記錄頁面 */}
            {showHistory && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-6">
                  <button
                    onClick={goHome}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <ArrowLeft size={24} />
                  </button>
                  <h2 className="text-2xl font-medium text-gray-800">歷史記錄 📚</h2>
                </div>
                {letters.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    還沒有任何記錄喔 💭<br />
                    開始記錄你的第一個心情吧! ✨
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
                          📅 {new Date(letter.date).toLocaleDateString('zh-TW', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                        {letter.emotion && (
                          <span className="text-sm px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
                            {emotionEmojis[letter.emotion] || '💭'} {letter.emotion}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 line-clamp-2">{letter.userInput}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 情緒統計頁面 */}
            {showStats && (
              <div className="animate-fade-in">
                <div className="flex items-center gap-3 mb-6">
                  <button
                    onClick={goHome}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <ArrowLeft size={24} />
                  </button>
                  <div className="flex items-center gap-2 text-blue-600">
                    <BarChart3 size={24} />
                    <span className="font-medium text-xl">情緒統計 📊</span>
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8">
                  <div className="space-y-4">
                    {Object.entries(emotionStats)
                      .sort((a, b) => b[1].percentage - a[1].percentage)
                      .map(([emotion, data]) => (
                        <div key={emotion} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700 font-medium">{emotion}</span>
                            <span className="text-purple-600 font-medium">{data.percentage}% ✨</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
                              style={{ width: `${data.percentage}%` }}
                            />
                          </div>
                          <div className="text-sm text-gray-500">
                            共 {data.count} 次記錄 📝
                          </div>
                        </div>
                      ))}
                  </div>

                  {Object.keys(emotionStats).length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      還沒有足夠的記錄喔 💭<br />
                      開始寫下你的心情吧! ✍️
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 趨勢分析頁面 */}
            {showTrend && trendAnalyses.length > 0 && (
              <div className="animate-fade-in">
                <div className="flex items-center gap-3 mb-6">
                  <button
                    onClick={goHome}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <ArrowLeft size={24} />
                  </button>
                  <div className="flex items-center gap-2 text-indigo-600">
                    <TrendingUp size={24} />
                    <span className="font-medium text-xl">心情趨勢分析 📈</span>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {trendAnalyses.map((analysis, index) => (
                    <div key={analysis.id} className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8">
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                          {index === 0 && (
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full font-medium">
                              最新 ✨
                            </span>
                          )}
                          <span className="text-gray-600">
                            第 {trendAnalyses.length - index} 次分析 📊
                          </span>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <div>📅 {new Date(analysis.date).toLocaleDateString('zh-TW', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}</div>
                          <div className="text-xs">基於 {analysis.letterCount} 封記錄 💌</div>
                        </div>
                      </div>
                      <div className="prose prose-lg max-w-none">
                        <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                          {analysis.content}
                        </div>
                      </div>

                      {/* 社群分享按鈕 */}
                      <div className="mt-6 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl">
                        <div className="flex items-center gap-2 mb-3">
                          <Share2 size={20} className="text-purple-600" />
                          <span className="text-sm font-medium text-gray-700">分享你的成長 ✨</span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => shareToSocial('facebook', analysis.content)}
                            className="flex-1 min-w-[100px] px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all text-sm font-medium flex items-center justify-center gap-2"
                          >
                            <Facebook size={16} />
                            Facebook
                          </button>
                          <button
                            onClick={() => shareToSocial('twitter', analysis.content)}
                            className="flex-1 min-w-[100px] px-4 py-2 rounded-xl bg-sky-500 text-white hover:bg-sky-600 transition-all text-sm font-medium flex items-center justify-center gap-2"
                          >
                            <Twitter size={16} />
                            X (Twitter)
                          </button>
                          <button
                            onClick={() => shareToSocial('threads', analysis.content)}
                            className="flex-1 min-w-[100px] px-4 py-2 rounded-xl bg-black text-white hover:bg-gray-800 transition-all text-sm font-medium"
                          >
                            Threads
                          </button>
                          <button
                            onClick={() => shareToSocial('copy', analysis.content)}
                            className="flex-1 min-w-[100px] px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:shadow-lg transition-all text-sm font-medium"
                          >
                            複製文案
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          💡 複製文案可貼到 IG 限動或 TikTok
                        </p>
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

export default HealingNoteApp;
