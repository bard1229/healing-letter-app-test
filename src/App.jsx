// 🔧 完整修復版 App.jsx
// 修復問題:
// 1. ✅ 歷史記錄顯示療癒信內容
// 2. ✅ 趨勢報告 4 天邏輯
// 3. ✅ 第 4 天療癒信下方顯示按鈕
// 4. ✅ 進度提醒
// 5. ✅ Markdown 格式清理

// 關鍵修改說明:
// 
// 1. 歷史記錄部分 (line ~860):
//    - 點擊歷史記錄卡片會顯示完整療癒信
//    - 卡片上顯示療癒信預覽 (前 100 字)
//
// 2. 趨勢報告邏輯 (line ~250, ~580):
//    - 檢查唯一天數 (getTotalDays)
//    - 只有達到 4 天才顯示按鈕
//    - 每 4 天更新一次
//
// 3. 療癒信下方按鈕 (line ~575):
//    - 檢查是否為第 4 天記錄
//    - 顯示生成趨勢報告按鈕
//
// 4. 進度提醒 (line ~660):
//    - 顯示「再寫 X 天就能看到趨勢報告」
//
// 5. Markdown 清理 (line ~238):
//    - 移除 ** 和 ## 標記

// ========================================
// 完整程式碼如下 (複製整個檔案):
// ========================================

import React, { useState, useEffect } from 'react';
import { Heart, Mic, Send, Clock, TrendingUp, Mail, Sparkles, Home, ArrowLeft, LogOut, Calendar, BarChart3, ChevronLeft, ChevronRight, AlertCircle, Share2, Facebook, Twitter, Instagram, Settings } from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import LoginPage from './LoginPage';
import SettingsPage from './SettingsPage';
import { generateHealingLetter, generateTrendAnalysis, analyzeEmotion } from './geminiService';

// 水獺圖片
const OTTER_IMAGE = '/otter.png';

const HealingNoteApp = () => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
// 🎨 奶茶暖色系 CSS - 自動覆蓋所有紫色和粉色
const teaWarmStyles = `
  /* 主要漸層 */
  .bg-gradient-to-r.from-purple-500.to-pink-500,
  .bg-gradient-to-br.from-purple-500.to-pink-500 {
    background: linear-gradient(to right, #C9A386, #D4A373) !important;
  }
  
  /* 紫色替換 */
  .bg-purple-600 { background-color: #A87D5F !important; }
  .bg-purple-500 { background-color: #C9A386 !important; }
  .bg-purple-200 { background-color: #E8D4C4 !important; }
  .bg-purple-100 { background-color: #E8D4C4 !important; }
  .bg-purple-50 { background-color: #FBF7F4 !important; }
  
  .text-purple-700 { color: #5A4A42 !important; }
  .text-purple-600 { color: #A87D5F !important; }
  .text-purple-500 { color: #C9A386 !important; }
  
  .border-purple-300,
  .border-purple-200,
  .border-purple-100 { border-color: #E8D4C4 !important; }
  
  /* 粉色替換 */
  .bg-pink-600 { background-color: #B8865F !important; }
  .bg-pink-500 { background-color: #D4A373 !important; }
  .bg-pink-50 { background-color: #FFF9F5 !important; }
  
  .text-pink-600 { color: #D4A373 !important; }
  
  /* Hover 效果增強 */
  .bg-gradient-to-r:hover {
    box-shadow: 0 6px 12px rgba(169, 131, 102, 0.3) !important;
  }
  
  /* 背景色 */
  body {
    background: linear-gradient(135deg, #FFF9F5 0%, #FBF7F4 50%, #F5EDE7 100%) !important;
  }
`;

// 注入樣式到頁面
if (typeof document !== 'undefined' && !document.getElementById('tea-warm-styles')) {
  const styleTag = document.createElement('style');
  styleTag.id = 'tea-warm-styles';
  styleTag.innerHTML = teaWarmStyles;
  document.head.appendChild(styleTag);
}
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentLetter, setCurrentLetter] = useState(null);
  const [letters, setLetters] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showTrend, setShowTrend] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showDayDetail, setShowDayDetail] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedDayLetters, setSelectedDayLetters] = useState([]);
  const [trendAnalyses, setTrendAnalyses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);
  const [emotionStats, setEmotionStats] = useState({});
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedEmotion, setSelectedEmotion] = useState('');
  const [showEmotionSelector, setShowEmotionSelector] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

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

  // 🎨 情緒選擇器選項
  const emotionOptions = [
    { emoji: '😊', label: '開心', value: '開心' },
    { emoji: '😢', label: '難過', value: '難過' },
    { emoji: '😰', label: '壓力', value: '壓力' },
    { emoji: '😤', label: '生氣', value: '生氣' },
    { emoji: '🤔', label: '迷茫', value: '迷茫' },
    { emoji: '😌', label: '平靜', value: '平靜' },
    { emoji: '😴', label: '疲憊', value: '疲憊' },
    { emoji: '🥰', label: '感動', value: '感動' },
    { emoji: '😎', label: '自信', value: '自信' }
  ];

  // 🔧 修改後的登入檢查 - 同時支援 Firebase Auth 和 LINE 登入
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // Firebase Auth 使用者 (Email 登入)
        console.log('✅ Firebase Auth 使用者已登入:', currentUser.email);
        setUser(currentUser);
        setAuthLoading(false);
        loadUserData(currentUser.uid);
      } else {
        // 檢查是否為 LINE 登入
        const lineUserId = localStorage.getItem('lineUserId');
        const lineUserName = localStorage.getItem('lineUserName');
        const lineUserPicture = localStorage.getItem('lineUserPicture');
        
        if (lineUserId) {
          // LINE 使用者
          console.log('✅ LINE 使用者已登入:', lineUserName);
          const lineUser = {
            uid: lineUserId,
            displayName: lineUserName || '使用者',
            photoURL: lineUserPicture || '',
            email: null,
            isLineUser: true  // 標記為 LINE 使用者
          };
          setUser(lineUser);
          setAuthLoading(false);
          loadUserData(lineUserId);
        } else {
          // 沒有登入
          console.log('❌ 使用者未登入');
          setUser(null);
          setAuthLoading(false);
          setLetters([]);
          setTrendAnalyses([]);
          setDailyCount(0);
        }
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
        
        // 🔧 清理舊療癒信的格式 (加強版)
        const cleanedContent = data.content
          ? data.content
              .replace(/\[同理段落\]/g, '')
              .replace(/\[分析感受\]/g, '')
              .replace(/\[具體建議\]/g, '')
              .replace(/\[溫暖鼓勵\]/g, '')
              .replace(/\*\*/g, '')
              .replace(/###\s*/g, '')
              .replace(/##\s*/g, '')
              .replace(/#\s*/g, '')
              .replace(/---/g, '')
              .replace(/\n{3,}/g, '\n\n')
              .trim()
          : data.content;
        
        loadedLetters.push({
          id: doc.id,
          ...data,
          content: cleanedContent,  // 使用清理後的內容
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

  // 🔧 計算總記錄天數 (唯一天數)
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
        
        // 🔧 清理舊報告的格式 (加強版)
        const cleanedContent = data.content
          ? data.content
              .replace(/\[同理段落\]/g, '')
              .replace(/\[分析感受\]/g, '')
              .replace(/\[具體建議\]/g, '')
              .replace(/\[溫暖鼓勵\]/g, '')
              .replace(/\*\*/g, '')
              .replace(/###\s*/g, '')
              .replace(/##\s*/g, '')
              .replace(/#\s*/g, '')
              .replace(/---/g, '')
              .replace(/\n{3,}/g, '\n\n')
              .trim()
          : data.content;
        
        analyses.push({
          id: doc.id,
          ...data,
          content: cleanedContent,  // 使用清理後的內容
          date: data.createdAt?.toDate().toISOString() || new Date().toISOString()
        });
      });
      
      setTrendAnalyses(analyses);
    } catch (error) {
      console.error('載入趨勢分析失敗:', error);
    }
  };

  // 🔧 修改後的登出函數 - 同時處理 Firebase 和 LINE 登出
  const handleLogout = async () => {
    try {
      // Firebase Auth 登出
      await signOut(auth);
      
      // 清除 LINE 登入資料
      localStorage.removeItem('lineUserId');
      localStorage.removeItem('lineUserName');
      localStorage.removeItem('lineUserPicture');
      localStorage.removeItem('line_login_state');
      localStorage.removeItem('line_login_state_time');
      
      console.log('✅ 登出成功');
      
      // 重置狀態
      setUser(null);
      setLetters([]);
      setTrendAnalyses([]);
      setCurrentLetter(null);
      setShowHistory(false);
      setShowTrend(false);
      setShowStats(false);
      setShowCalendar(false);
    } catch (error) {
      console.error('登出失敗:', error);
      alert('登出時發生錯誤');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!input.trim()) {
      alert('請輸入你的心情 💭');
      return;
    }

    if (dailyCount >= DAILY_LIMIT) {
      alert(`免費版每天限制 ${DAILY_LIMIT} 次喔 💙\n\n明天再來記錄吧!`);
      return;
    }

    setIsGenerating(true);

    try {
      // 🎨 使用選擇的情緒或 AI 判斷
      let emotion;
      if (selectedEmotion) {
        emotion = selectedEmotion;
        console.log('使用者選擇的情緒:', emotion);
      } else {
        emotion = await analyzeEmotion(input);
        console.log('AI 判斷的情緒:', emotion);
      }

      const letter = await generateHealingLetter(input, emotion);
      
      // 🔧 清理 Markdown 格式和後台標籤 (加強版)
      const cleanedLetter = letter
        .replace(/\[同理段落\]/g, '')          // 移除 [同理段落]
        .replace(/\[分析感受\]/g, '')          // 移除 [分析感受]
        .replace(/\[具體建議\]/g, '')          // 移除 [具體建議]
        .replace(/\[溫暖鼓勵\]/g, '')          // 移除 [溫暖鼓勵]
        .replace(/\*\*/g, '')                  // 移除 **
        .replace(/###\s*/g, '')                // 移除 ###
        .replace(/##\s*/g, '')                 // 移除 ##
        .replace(/#\s*/g, '')                  // 移除 #
        .replace(/---/g, '')                   // 移除 ---
        .replace(/\n{3,}/g, '\n\n')            // 移除多餘空行
        .trim();
      
      const newLetter = {
        userInput: input,
        content: cleanedLetter,  // 改用 content
        emotion: emotion,
        date: new Date().toISOString()
      };
      
      setCurrentLetter(newLetter);
      
      const docRef = await addDoc(collection(db, 'letters'), {
        userId: user.uid,
        userInput: input,
        content: cleanedLetter,  // 改用 content
        emotion: emotion,
        createdAt: Timestamp.now()
      });

      newLetter.id = docRef.id;
      const updatedLetters = [...letters, newLetter];
      setLetters(updatedLetters);
      
      setDailyCount(dailyCount + 1);

      calculateEmotionStats(updatedLetters);
      
      setInput('');
      setSelectedEmotion('');  // 清除選擇的情緒
      setShowEmotionSelector(false);  // 關閉選擇器
      
    } catch (error) {
      console.error('生成信件失敗:', error);
      alert('抱歉,生成信件時發生錯誤 😢\n\n請稍後再試,或檢查網路連線!');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('抱歉,你的瀏覽器不支援語音輸入 😢');
      return;
    }

    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'zh-TW';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      console.log('開始聽取語音...');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      console.log('語音轉文字:', transcript);
    };

    recognition.onerror = (event) => {
      console.error('語音辨識錯誤:', event.error);
      alert('語音辨識失敗,請再試一次 🎤');
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      console.log('語音輸入結束');
    };

    recognition.start();
  };

  // 🔍 搜尋過濾函數
  const getFilteredLetters = () => {
    if (!searchKeyword.trim()) {
      return letters;
    }
    
    const keyword = searchKeyword.toLowerCase();
    return letters.filter(letter => 
      letter.input?.toLowerCase().includes(keyword) ||
      letter.content?.toLowerCase().includes(keyword) ||
      letter.emotion?.toLowerCase().includes(keyword)
    );
  };

  // 🎨 高亮搜尋關鍵字
  const highlightKeyword = (text) => {
    if (!searchKeyword.trim() || !text) return text;
    
    const regex = new RegExp(`(${searchKeyword})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">{part}</mark>
      ) : (
        part
      )
    );
  };

  const goHome = () => {
    setCurrentLetter(null);
    setShowHistory(false);
    setShowTrend(false);
    setShowStats(false);
    setShowCalendar(false);
    setShowDayDetail(false);
    setShowSettings(false);
    setSearchKeyword('');  // 清除搜尋
  };

  // 🔧 生成趨勢報告 (修正邏輯)
  const generateTrend = async () => {
    const totalDays = getTotalDays(letters);
    
    if (totalDays < 4) {
      alert(`至少需要 4 天的記錄才能生成情緒健康報告喔 📊\n\n目前記錄了 ${totalDays} 天`);
      return;
    }

    setIsGenerating(true);
    try {
      const recentLetters = letters.slice(-10);
      const analysis = await generateTrendAnalysis(recentLetters);
      
      // 🔧 清理 Markdown 格式和後台標籤 (加強版)
      const cleanedAnalysis = analysis
        .replace(/\[同理段落\]/g, '')          // 移除 [同理段落]
        .replace(/\[分析感受\]/g, '')          // 移除 [分析感受]
        .replace(/\[具體建議\]/g, '')          // 移除 [具體建議]
        .replace(/\[溫暖鼓勵\]/g, '')          // 移除 [溫暖鼓勵]
        .replace(/\*\*/g, '')                  // 移除 **
        .replace(/###\s*/g, '')                // 移除 ###
        .replace(/##\s*/g, '')                 // 移除 ##
        .replace(/#\s*/g, '')                  // 移除 #
        .replace(/---/g, '')                   // 移除 ---
        .replace(/\n{3,}/g, '\n\n')            // 移除多餘空行
        .trim();
      
      const docRef = await addDoc(collection(db, 'trendAnalysis'), {
        userId: user.uid,
        content: cleanedAnalysis,
        letterCount: recentLetters.length,
        createdAt: Timestamp.now()
      });

      const newAnalysis = {
        id: docRef.id,
        content: cleanedAnalysis,
        letterCount: recentLetters.length,
        date: new Date().toISOString()
      };

      setTrendAnalyses([newAnalysis, ...trendAnalyses]);
      setShowTrend(true);
      
      // 🔧 生成後立即回到首頁,避免按鈕重複出現
      setTimeout(() => {
        setCurrentLetter(null);
      }, 1000);
      
    } catch (error) {
      console.error('生成趨勢分析失敗:', error);
      alert('抱歉,生成趨勢分析時發生錯誤 😢');
    } finally {
      setIsGenerating(false);
    }
  };

  const shareToSocial = (platform, content) => {
    const shareText = `我在 HealingNote 記錄了我的心情成長 💙\n\n${content.substring(0, 100)}...\n\n一起來記錄你的心情吧! ✨`;
    
    switch(platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(shareText)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
        break;
      case 'threads':
        navigator.clipboard.writeText(shareText);
        alert('已複製到剪貼簿! 📋\n請到 Threads 貼上分享 ✨');
        break;
      case 'copy':
        navigator.clipboard.writeText(shareText);
        alert('已複製到剪貼簿! 📋\n可以貼到 IG 限動或任何地方分享 ✨');
        break;
      default:
        break;
    }
  };

  const getCalendarDays = (year, month) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  const hasLetterOnDate = (day) => {
    if (!day) return false;
    const targetDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day);
    return letters.some(letter => {
      const letterDate = new Date(letter.date);
      return letterDate.toDateString() === targetDate.toDateString();
    });
  };

  const getLettersForDate = (day) => {
    const targetDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day);
    return letters.filter(letter => {
      const letterDate = new Date(letter.date);
      return letterDate.toDateString() === targetDate.toDateString();
    });
  };

  const handleDateClick = (day) => {
    if (!day) return;
    const dayLetters = getLettersForDate(day);
    if (dayLetters.length > 0) {
      setSelectedDayLetters(dayLetters);
      setShowDayDetail(true);
    }
  };

  const previousMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1));
  };

  const calendarDays = getCalendarDays(calendarDate.getFullYear(), calendarDate.getMonth());
  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  // 🔧 計算進度
  const totalDays = getTotalDays(letters);
  const daysUntilReport = Math.max(0, 4 - totalDays);
  const canGenerateReport = totalDays >= 4;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLoginSuccess={() => setAuthLoading(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <img src={OTTER_IMAGE} alt="歐特" className="w-12 h-12 object-contain" />
            <div>
              <h1 className="text-2xl font-medium text-gray-800">HealingNote 💙</h1>
              <p className="text-sm text-gray-600">
                嗨 {user.displayName || user.email || '使用者'} ✨
                {user.isLineUser && <span className="ml-1 text-xs text-green-600">(LINE 登入)</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 backdrop-blur-sm text-gray-600 hover:text-gray-800 hover:bg-white transition-all shadow-sm"
            >
              <Settings size={18} />
              <span className="text-sm">設定</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 backdrop-blur-sm text-gray-600 hover:text-gray-800 hover:bg-white transition-all shadow-sm"
            >
              <LogOut size={18} />
              <span className="text-sm">登出</span>
            </button>
          </div>
        </div>

        {/* 主要內容區 */}
        {!showHistory && !showTrend && !showStats && !showCalendar && !showSettings && (
          <>
            {/* 統計卡片 */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md p-4 text-center">
                <div className="text-3xl font-bold text-purple-600">{letters.length}</div>
                <div className="text-sm text-gray-600 mt-1">總記錄 📝</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md p-4 text-center">
                <div className="text-3xl font-bold text-pink-600">{checkConsecutiveDays(letters)}</div>
                <div className="text-sm text-gray-600 mt-1">連續天數 🔥</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">{totalDays}</div>
                <div className="text-sm text-gray-600 mt-1">記錄天數 📅</div>
              </div>
            </div>

            {/* 當前信件顯示 */}
            {currentLetter ? (
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 mb-6 animate-fade-in">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="text-purple-600" size={24} />
                      <h2 className="text-xl font-medium text-gray-800">給你的療癒信 💌</h2>
                    </div>
                    <p className="text-sm text-gray-500">
                      📅 {new Date(currentLetter.date).toLocaleDateString('zh-TW', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {currentLetter.emotion && (
                    <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                      {emotionEmojis[currentLetter.emotion] || '💭'} {currentLetter.emotion}
                    </span>
                  )}
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 mb-6">
                  <p className="text-sm text-gray-600 mb-2">💭 你說:</p>
                  <p className="text-gray-700 italic">"{currentLetter.userInput}"</p>
                </div>

                <div className="prose prose-lg max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {currentLetter.content}
                  </p>
                </div>

                {/* 🔧 第 4 天顯示按鈕 */}
                {totalDays === 4 && trendAnalyses.length === 0 && (
                  <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border-2 border-blue-200 animate-fade-in">
                    <div className="flex items-center gap-2 text-blue-700 mb-3">
                      <Sparkles size={24} />
                      <span className="font-medium text-lg">這是你第 4 天的記錄 ✨</span>
                    </div>
                    <p className="text-gray-700 mb-4">
                      累積了 4 天的心情記錄,現在可以為你生成專屬的情緒健康報告,
                      看看這段時間的變化和成長 💙
                    </p>
                    <button
                      onClick={generateTrend}
                      disabled={isGenerating}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <TrendingUp size={20} />
                      {isGenerating ? '生成中...' : '為我生成情緒健康報告'}
                    </button>
                  </div>
                )}

                {/* 🔧 之後每 4 天更新 - 檢查是否為新週期 */}
                {totalDays > 4 && totalDays % 4 === 0 && trendAnalyses.length > 0 && (
                  <div className="mt-6 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200 animate-fade-in">
                    <div className="flex items-center gap-2 text-purple-700 mb-3">
                      <TrendingUp size={24} />
                      <span className="font-medium text-lg">又累積了 4 天記錄 ✨</span>
                    </div>
                    <p className="text-gray-700 mb-4">
                      你已經記錄了 {totalDays} 天了!
                      想看看最新的心情趨勢變化嗎?
                    </p>
                    <button
                      onClick={generateTrend}
                      disabled={isGenerating}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <TrendingUp size={20} />
                      {isGenerating ? '生成中...' : '更新我的情緒健康報告'}
                    </button>
                  </div>
                )}

                <button
                  onClick={goHome}
                  className="mt-6 w-full py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Home size={20} />
                  回到首頁 🏠
                </button>
              </div>
            ) : (
              /* 輸入表單 */
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="text-purple-600" size={24} />
                  <h2 className="text-xl font-medium text-gray-800">今天想說什麼呢? 💭</h2>
                </div>

                {dailyCount >= DAILY_LIMIT && (
                  <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl flex items-start gap-3">
                    <AlertCircle className="text-yellow-600 flex-shrink-0 mt-1" size={20} />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium mb-1">今天已達到免費版限制 ({DAILY_LIMIT} 次) 💙</p>
                      <p className="text-xs text-yellow-700">明天再來繼續記錄吧!每天都能有新的成長 ✨</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="分享你的心情、煩惱、或任何想說的話...&#10;歐特都在這裡傾聽 💙"
                      className="w-full h-32 p-4 pr-12 border-2 border-purple-100 rounded-2xl focus:border-purple-300 focus:outline-none resize-none"
                      disabled={isGenerating || dailyCount >= DAILY_LIMIT}
                    />
                    <button
                      type="button"
                      onClick={handleVoiceInput}
                      className={`absolute right-3 top-3 p-2 rounded-xl transition-all ${
                        isListening 
                          ? 'bg-red-500 text-white animate-pulse' 
                          : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                      }`}
                      disabled={isGenerating || dailyCount >= DAILY_LIMIT}
                    >
                      <Mic size={20} />
                    </button>
                  </div>

                  {/* 🎨 情緒選擇器按鈕 */}
                  <button
                    type="button"
                    onClick={() => setShowEmotionSelector(!showEmotionSelector)}
                    className="w-full py-2 rounded-xl bg-purple-100 text-purple-700 font-medium hover:bg-purple-200 transition-all flex items-center justify-center gap-2 mb-2"
                  >
                    <span className="text-lg">{selectedEmotion ? emotionOptions.find(e => e.value === selectedEmotion)?.emoji : '😊'}</span>
                    <span className="text-sm">
                      {selectedEmotion ? `已選: ${selectedEmotion}` : '選擇情緒 (可選)'}
                    </span>
                  </button>

                  {/* 🎨 情緒選擇器面板 */}
                  {showEmotionSelector && (
                    <div className="mb-3 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200 animate-fade-in">
                      <p className="text-sm font-medium text-gray-700 mb-3 text-center">
                        💭 選擇或修改情緒 (不選則由 AI 自動判斷)
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {emotionOptions.map((emotion) => (
                          <button
                            key={emotion.value}
                            type="button"
                            onClick={() => {
                              setSelectedEmotion(emotion.value);
                              setShowEmotionSelector(false);
                            }}
                            className={`p-3 rounded-xl text-sm font-medium transition-all transform hover:scale-105 ${
                              selectedEmotion === emotion.value
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-105'
                                : 'bg-white text-gray-700 hover:bg-purple-100 shadow-sm'
                            }`}
                          >
                            <div className="text-2xl mb-1">{emotion.emoji}</div>
                            <div className="text-xs">{emotion.label}</div>
                          </button>
                        ))}
                      </div>
                      {selectedEmotion && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedEmotion('');
                            setShowEmotionSelector(false);
                          }}
                          className="mt-3 w-full py-2 bg-gray-200 text-gray-700 rounded-xl text-xs font-medium hover:bg-gray-300 transition-all"
                        >
                          清除選擇 (讓 AI 判斷)
                        </button>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isGenerating || !input.trim() || dailyCount >= DAILY_LIMIT}
                    className={`w-full py-3 rounded-2xl font-medium transition-all flex items-center justify-center gap-2 ${
                      isGenerating || !input.trim() || dailyCount >= DAILY_LIMIT
                        ? 'bg-gray-300 text-gray-500'
                        : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg'
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        歐特正在理解你的心情...
                      </>
                    ) : (
                      <>
                        <Send size={20} />
                        送出 💌
                      </>
                    )}
                  </button>
                </form>

                {/* 🔧 加強版進度提醒 */}
                <div className="mt-4 space-y-3">
                  {/* 剩餘次數 */}
                  <div className="text-center text-xs text-gray-500">
                    <p>💡 今日剩餘次數: {DAILY_LIMIT - dailyCount} / {DAILY_LIMIT}</p>
                  </div>

                  {/* 記錄統計 */}
                  <div className="flex items-center justify-center gap-6 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">📅 本週期:</span>
                      <span className={`font-bold ${(totalDays % 4) === 0 && totalDays > 0 ? 'text-green-600' : 'text-blue-600'}`}>
                        {totalDays % 4 === 0 && totalDays > 0 ? '4' : totalDays % 4}/4 天
                      </span>
                      {(totalDays % 4) === 0 && totalDays > 0 && <span className="text-green-600">✓</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">🔥 連續記錄:</span>
                      <span className="font-bold text-orange-600">
                        {checkConsecutiveDays(letters)} 天
                      </span>
                    </div>
                  </div>

                  {/* 進度條 - 每 4 天重置 */}
                  <div className="px-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${
                          (totalDays % 4) === 0 && totalDays > 0
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                            : 'bg-gradient-to-r from-blue-500 to-purple-500'
                        }`}
                        style={{ 
                          width: `${totalDays === 0 ? 0 : ((totalDays % 4 === 0 ? 4 : totalDays % 4) / 4) * 100}%` 
                        }}
                      />
                    </div>
                    <p className="text-center text-xs text-gray-400 mt-1">
                      {(totalDays % 4) === 0 && totalDays > 0 
                        ? '本週期已完成! 🎉' 
                        : `進度 ${Math.round(((totalDays % 4) / 4) * 100)}%`}
                    </p>
                  </div>

                  {/* 總記錄天數 */}
                  <div className="text-center text-xs text-gray-500">
                    <p>📊 累積記錄: {totalDays} 天 | 已生成 {trendAnalyses.length} 份報告 💜</p>
                  </div>

                  {/* 狀態提示 */}
                  {totalDays % 4 !== 0 && (
                    <div className="text-center p-2 bg-blue-50 rounded-xl">
                      <p className="text-xs text-blue-700 font-medium">
                        📊 再記錄 {4 - (totalDays % 4)} 天就能生成新的情緒健康報告!
                      </p>
                    </div>
                  )}
                  {(totalDays % 4) === 0 && totalDays > 0 && trendAnalyses.length * 4 < totalDays && (
                    <div className="text-center p-2 bg-green-50 rounded-xl animate-pulse">
                      <p className="text-xs text-green-700 font-medium">
                        ✨ 太棒了!可以生成新的情緒健康報告了!
                      </p>
                    </div>
                  )}
                  {(totalDays % 4) === 0 && totalDays > 0 && trendAnalyses.length * 4 >= totalDays && (
                    <div className="text-center p-2 bg-purple-50 rounded-xl">
                      <p className="text-xs text-purple-700 font-medium">
                        💜 已有最新報告!繼續記錄 4 天後可生成下一份
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 功能按鈕 */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowHistory(true)}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md p-6 hover:shadow-lg transition-all text-left group"
              >
                <Clock className="text-blue-600 mb-3 group-hover:scale-110 transition-transform" size={28} />
                <h3 className="font-medium text-gray-800 mb-1">歷史記錄 📚</h3>
                <p className="text-sm text-gray-600">查看過去的對話</p>
              </button>

              <button
                onClick={() => setShowCalendar(true)}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md p-6 hover:shadow-lg transition-all text-left group"
              >
                <Calendar className="text-green-600 mb-3 group-hover:scale-110 transition-transform" size={28} />
                <h3 className="font-medium text-gray-800 mb-1">日曆檢視 📅</h3>
                <p className="text-sm text-gray-600">看看哪些日子有記錄</p>
              </button>

              <button
                onClick={() => setShowStats(true)}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md p-6 hover:shadow-lg transition-all text-left group"
              >
                <BarChart3 className="text-purple-600 mb-3 group-hover:scale-110 transition-transform" size={28} />
                <h3 className="font-medium text-gray-800 mb-1">情緒統計 📊</h3>
                <p className="text-sm text-gray-600">了解你的情緒變化</p>
              </button>

              {/* 🔧 修正趨勢報告按鈕邏輯 - 查看報告而非生成 */}
              <button
                onClick={() => {
                  if (trendAnalyses.length > 0) {
                    setShowTrend(true);  // 有報告 → 查看報告
                  } else {
                    alert(`至少需要 4 天的記錄才能生成情緒健康報告喔 📊\n\n目前記錄了 ${totalDays} 天`);
                  }
                }}
                disabled={!canGenerateReport}
                className={`rounded-2xl shadow-md p-6 transition-all text-left group ${
                  !canGenerateReport
                    ? 'bg-gray-200 cursor-not-allowed'
                    : 'bg-white/80 backdrop-blur-sm hover:shadow-lg'
                }`}
              >
                <TrendingUp 
                  className={`mb-3 group-hover:scale-110 transition-transform ${
                    !canGenerateReport ? 'text-gray-400' : 'text-indigo-600'
                  }`} 
                  size={28} 
                />
                <h3 className={`font-medium mb-1 ${!canGenerateReport ? 'text-gray-500' : 'text-gray-800'}`}>
                  情緒健康報告 📈
                </h3>
                <p className={`text-sm ${!canGenerateReport ? 'text-gray-400' : 'text-gray-600'}`}>
                  {!canGenerateReport ? `需要 ${daysUntilReport} 天記錄` : '查看你的心情趨勢'}
                </p>
              </button>
            </div>
          </>
        )}

        {/* 日曆檢視頁面 */}
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
                <span className="font-medium text-xl">日曆檢視 📅</span>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8">
              {/* 月份選擇 */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={previousMonth}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft size={24} className="text-gray-600" />
                </button>
                <h3 className="text-xl font-medium text-gray-800">
                  {calendarDate.getFullYear()} 年 {monthNames[calendarDate.getMonth()]}
                </h3>
                <button
                  onClick={nextMonth}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronRight size={24} className="text-gray-600" />
                </button>
              </div>

              {/* 星期標題 */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {weekDays.map(day => (
                  <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* 日期格子 */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, index) => (
                  <button
                    key={index}
                    onClick={() => handleDateClick(day)}
                    disabled={!day || !hasLetterOnDate(day)}
                    className={`aspect-square rounded-lg p-2 text-center transition-all ${
                      !day
                        ? 'invisible'
                        : hasLetterOnDate(day)
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white hover:shadow-lg cursor-pointer'
                        : 'bg-gray-50 text-gray-400 cursor-default'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>

              <div className="mt-6 p-4 bg-purple-50 rounded-2xl text-sm text-gray-600 text-center">
                💡 點擊有顏色的日期查看當天的記錄
              </div>
            </div>
          </div>
        )}

        {/* 單日詳細記錄 */}
        {showDayDetail && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setShowDayDetail(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <h2 className="text-2xl font-medium text-gray-800">
                📅 {new Date(selectedDayLetters[0].date).toLocaleDateString('zh-TW', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h2>
            </div>

            <div className="space-y-4">
              {selectedDayLetters.map((letter) => (
                <div
                  key={letter.id}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md p-6 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => {
                    setCurrentLetter(letter);
                    setShowCalendar(false);
                    setShowDayDetail(false);
                  }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-sm text-gray-500">
                      ⏰ {new Date(letter.date).toLocaleTimeString('zh-TW', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {letter.emotion && (
                      <span className="text-sm px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
                        {emotionEmojis[letter.emotion] || '💭'} {letter.emotion}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-2">{letter.userInput}</p>
                  {/* 🔧 顯示療癒信預覽 */}
                  <p className="text-gray-500 text-sm italic line-clamp-2">
                    "{letter.content?.substring(0, 100)}..."
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 🔧 歷史記錄頁面 - 修正顯示療癒信 */}
        {showHistory && (
          <div className="animate-fade-in">
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

              {/* 🔍 搜尋框 */}
              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="搜尋心情內容、情緒或療癒信... 🔍"
                    className="w-full p-4 pr-12 border-2 border-purple-100 rounded-2xl focus:border-purple-300 focus:outline-none bg-white/80 backdrop-blur-sm"
                  />
                  {searchKeyword && (
                    <button
                      onClick={() => setSearchKeyword('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {searchKeyword && (
                  <p className="text-xs text-gray-500 mt-2">
                    找到 {getFilteredLetters().length} 筆結果
                  </p>
                )}
              </div>

              {getFilteredLetters().length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  {searchKeyword ? (
                    <>
                      找不到包含「{searchKeyword}」的記錄 😢<br />
                      試試其他關鍵字吧!
                    </>
                  ) : (
                    <>
                      還沒有任何記錄喔 💭<br />
                      開始記錄你的第一個心情吧! ✨
                    </>
                  )}
                </div>
              ) : (
                getFilteredLetters().slice().reverse().map((letter) => (
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
                    <div className="mb-2">
                      <p className="text-xs text-gray-500 mb-1">💭 你說:</p>
                      <p className="text-gray-700 font-medium line-clamp-2">
                        {highlightKeyword(letter.userInput)}
                      </p>
                    </div>
                    {/* 🔧 顯示療癒信預覽 */}
                    <div>
                      <p className="text-xs text-gray-500 mb-1">💌 歐特說:</p>
                      <p className="text-gray-600 text-sm italic line-clamp-3">
                        {highlightKeyword(letter.content?.substring(0, 150))}...
                      </p>
                    </div>
                    <p className="text-xs text-purple-600 mt-2">點擊查看完整內容 →</p>
                  </div>
                ))
              )}
            </div>
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
                <span className="font-medium text-xl">情緒健康報告 📈</span>
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

        {/* 設定頁面 */}
        {showSettings && (
          <SettingsPage
            user={user}
            onBack={() => setShowSettings(false)}
            onUpdate={() => {
              // 重新載入使用者資料
              if (user.isLineUser) {
                const newName = localStorage.getItem('lineUserName');
                setUser({ ...user, displayName: newName });
              } else {
                // Firebase Auth 使用者會自動更新
                setUser({ ...user, displayName: auth.currentUser?.displayName });
              }
            }}
          />
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
