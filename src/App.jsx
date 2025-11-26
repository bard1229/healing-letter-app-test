// 🔧 完整修復版 App.jsx
// 修復問題:
// 1. ✅ 歷史記錄顯示療癒信內容
// 2. ✅ 趨勢報告 4 天邏輯
// 3. ✅ 第 4 天療癒信下方顯示按鈕
// 4. ✅ 進度提醒
// 5. ✅ Markdown 格式清理

// 關鍵修改說明
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
import { 
  WeeklyReportCard, 
  WeeklyReportsPage, 
  WeeklyReportDetailPage,
  WeeklyReportTestPanel 
} from './components/WeeklyReportSystem';
import { 
  MonthlyReportCard, 
  MonthlyReportsPage, 
  MonthlyReportDetailPage,
  MonthlyReportTestPanel,
} from './components/MonthlyReportSystem';
import React, { useState, useEffect } from 'react';
import { Heart, Mic, Send, Clock, TrendingUp, Mail, Sparkles, Home, ArrowLeft, LogOut, Calendar, BarChart3, ChevronLeft, ChevronRight, AlertCircle, Share2, Facebook, Twitter, Instagram, Settings } from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, collection, addDoc, query, where, getDocs, orderBy, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import LoginPage from './LoginPage';
import SubscriptionPlansPage from './components/SubscriptionPlansPage';
import SettingsPage from './SettingsPage';
import { generateHealingLetter, generateTrendAnalysis, analyzeEmotion } from './geminiService';
import { 
  PaymentConfirmationModal,
  PaymentSuccessModal,
  PaymentErrorModal
} from './components/PaymentFlow';
import { handlePayPalCallback, redirectToPayPal } from './components/PayPalButton';
import DiaryEditModal from './components/DiaryEditModal.jsx';
// 水獺圖片
const OTTER_IMAGE = '/otter.png';

const HealingNoteApp = () => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState('');
// 🎨 奶茶暖色系 CSS - 終極完整版
const teaWarmStyles = `
  /* 主要頁面背景漸層 - 最高優先級 */
  .bg-gradient-to-br.from-pink-50.via-purple-50.to-blue-50,
  div.bg-gradient-to-br.from-pink-50.via-purple-50.to-blue-50 {
    background: linear-gradient(135deg, #FFF9F5 0%, #FBF7F4 50%, #F5EDE7 100%) !important;
  }
  
  .min-h-screen.bg-gradient-to-br {
    background: linear-gradient(135deg, #FFF9F5 0%, #FBF7F4 50%, #F5EDE7 100%) !important;
  }
  
  /* 主要按鈕漸層 */
  .bg-gradient-to-r.from-purple-500.to-pink-500,
  .bg-gradient-to-br.from-purple-500.to-pink-500 {
    background: linear-gradient(to right, #C9A386, #D4A373) !important;
  }
  
  /* 淺色漸層背景 - "你說:" 區塊 */
  .bg-gradient-to-br.from-purple-50.to-pink-50,
  .bg-gradient-to-r.from-purple-50.to-pink-50,
  div.bg-gradient-to-br.from-purple-50.to-pink-50 {
    background: linear-gradient(to bottom right, #FBF7F4, #FFF9F5) !important;
  }
  
  /* 其他淺色漸層 */
  .from-blue-50.to-purple-50,
  .bg-gradient-to-r.from-blue-50.to-purple-50 {
    background: linear-gradient(to right, #EFF6FF, #FBF7F4) !important;
  }
  
  /* 紫色背景 - 加強優先級 */
  .bg-purple-600,
  div.bg-purple-600 { background-color: #A87D5F !important; }
  
  .bg-purple-500,
  div.bg-purple-500 { background-color: #C9A386 !important; }
  
  .bg-purple-200,
  div.bg-purple-200 { background-color: #E8D4C4 !important; }
  
  .bg-purple-100,
  div.bg-purple-100,
  span.bg-purple-100 { background-color: #E8D4C4 !important; }
  
  .bg-purple-50,
  div.bg-purple-50 { background-color: #FBF7F4 !important; }
  
  /* 紫色文字 - 加強優先級 */
  .text-purple-700,
  div.text-purple-700,
  span.text-purple-700 { color: #5A4A42 !important; }
  
  .text-purple-600,
  div.text-purple-600,
  span.text-purple-600 { color: #A87D5F !important; }
  
  .text-purple-500,
  div.text-purple-500,
  span.text-purple-500 { color: #C9A386 !important; }
  
  /* 紫色邊框 */
  .border-purple-300,
  .border-purple-200,
  .border-purple-100 { border-color: #E8D4C4 !important; }
  
  /* 粉色背景 */
  .bg-pink-600,
  div.bg-pink-600 { background-color: #B8865F !important; }
  
  .bg-pink-500,
  div.bg-pink-500 { background-color: #D4A373 !important; }
  
  .bg-pink-50,
  div.bg-pink-50 { background-color: #FFF9F5 !important; }
  
  /* 粉色文字 - 加強優先級 */
  .text-pink-600,
  div.text-pink-600,
  span.text-pink-600 { color: #D4A373 !important; }
  
  .text-pink-500,
  div.text-pink-500,
  span.text-pink-500 { color: #C9A386 !important; }
  
  /* Hover 效果增強 */
  .bg-gradient-to-r:hover {
    box-shadow: 0 6px 12px rgba(169, 131, 102, 0.3) !important;
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
  
  const [emotionStats, setEmotionStats] = useState({});
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedEmotion, setSelectedEmotion] = useState('');
  const [showEmotionSelector, setShowEmotionSelector] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [editingLetter, setEditingLetter] = useState(null);
// 週報相關狀態
const [showWeeklyReports, setShowWeeklyReports] = useState(false);
const [selectedReport, setSelectedReport] = useState(null);
const [weeklyReports, setWeeklyReports] = useState([]);
const [showSubscriptionPlans, setShowSubscriptionPlans] = useState(false);
const [userSubscription, setUserSubscription] = useState(null);  
const [paymentFlow, setPaymentFlow] = useState({
  show: false,
  step: null,
  plan: null,
  error: null
});
// 月報相關狀態
const [showMonthlyReports, setShowMonthlyReports] = useState(false);
const [selectedMonthlyReport, setSelectedMonthlyReport] = useState(null);
const [monthlyReports, setMonthlyReports] = useState([]);  

// 開發模式 (測試完改成 false)
const isDevelopment = true;
  // 免費版每日限制
  

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
// 💰 付款處理函數
const handleStartPayment = (plan) => {
  console.log('選擇方案:', plan);
  setPaymentFlow({
    show: true,
    step: 'confirm',
    plan: plan,
    error: null
  });
};

const handleConfirmPayment = async (plan) => {
  try {
    localStorage.setItem('pendingPayment', JSON.stringify(plan));
    redirectToPayPal(plan);
  } catch (error) {
    console.error('付款錯誤:', error);
    setPaymentFlow(prev => ({
      ...prev,
      step: 'error',
      error: error.message || '付款過程發生錯誤，請稍後再試'
    }));
  }
};

const handlePaymentSuccess = async (paymentData) => {
  try {
    const pendingPayment = localStorage.getItem('pendingPayment');
    const plan = pendingPayment ? JSON.parse(pendingPayment) : null;

    if (!plan) {
      throw new Error('找不到訂單資訊');
    }

    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      subscription: {
        planId: plan.id,
        status: 'active',
        startDate: new Date(),
        paymentId: paymentData.transactionId,
        provider: 'paypal',
        amount: paymentData.amount
      }
    }, { merge: true });

    if (plan.id === 'single') {
      console.log('解鎖報告:', plan.selectedItem.name);
    }

    setUserSubscription({
      planId: plan.id,
      status: 'active',
      startDate: new Date()
    });

    localStorage.removeItem('pendingPayment');

    setPaymentFlow({
      show: true,
      step: 'success',
      plan: plan,
      error: null
    });

  } catch (error) {
    console.error('處理付款成功失敗:', error);
    setPaymentFlow({
      show: true,
      step: 'error',
      plan: null,
      error: '訂閱啟用失敗，請聯繫客服'
    });
  }
};

const handlePaymentCancel = () => {
  const pendingPayment = localStorage.getItem('pendingPayment');
  const plan = pendingPayment ? JSON.parse(pendingPayment) : null;

  setPaymentFlow({
    show: true,
    step: 'error',
    plan: plan,
    error: '您已取消付款'
  });

  localStorage.removeItem('pendingPayment');
};

const handleRetryPayment = () => {
  setPaymentFlow(prev => ({
    ...prev,
    step: 'confirm',
    error: null
  }));
};

const handleClosePayment = () => {
  setPaymentFlow({
    show: false,
    step: null,
    plan: null,
    error: null
  });
};

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
          
        }
      }
    });

    return () => unsubscribe();
  }, []);
useEffect(() => {
  handlePayPalCallback(
    handlePaymentSuccess,
    handlePaymentCancel
  );
}, []);
  const loadUserData = async (userId) => {
    try {
      setLoading(true);
      
      const lettersRef = collection(db, 'letters');
const q = query(
  lettersRef,
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
  if (!input.trim()) return;

  setIsGenerating(true);

  try {
    // 🤖 AI 自動判斷情緒（如果使用者沒選）
    let finalEmotion = selectedEmotion;
    
    if (!finalEmotion || finalEmotion === '') {
      console.log('🤖 使用者未選擇情緒，啟動 AI 自動判斷...');
      finalEmotion = await analyzeEmotion(input);
      console.log('🤖 AI 判斷結果:', finalEmotion);
    }

    // 保存到 letters 集合
    await addDoc(collection(db, 'letters'), {
      userId: user.uid,
      userInput: input,
      content: "",
      emotion: finalEmotion,
      createdAt: Timestamp.now(),
      timestamp: Date.now()
    });

    // 重新載入資料
    await loadUserData(user.uid);

    // 清空輸入
    setInput('');
    setSelectedEmotion('');
    setShowEmotionSelector(false);

    alert('日記已保存! 📔');

  } catch (error) {
    console.error('保存失敗:', error);
    alert('保存失敗,請稍後再試 😢');
  } finally {
    setIsGenerating(false);
  }
};
  // 📝 處理編輯日記
const handleEditLetter = (letter) => {
  setEditingLetter(letter);
};

// 📝 處理編輯儲存
const handleSaveEdit = (updatedLetter) => {
  // 更新本地 letters 狀態
  setLetters(prevLetters => 
    prevLetters.map(letter => 
      letter.id === updatedLetter.id ? updatedLetter : letter
    )
  );
  
  // 如果正在查看這封信，也更新 currentLetter
  if (currentLetter?.id === updatedLetter.id) {
    setCurrentLetter(updatedLetter);
  }
  
  setEditingLetter(null);
};
// ==================== 週報系統函數 ====================
  
  // 領取週報
  const handleClaimReport = (reportId) => {
    console.log('領取週報:', reportId); // 加這行測試
    setWeeklyReports(prev => 
      prev.map(report => 
        report.id === reportId 
          ? { ...report, status: 'claimed' }
          : report
      )
    );
    alert('週報已領取！可以解鎖查看了 ✨');
    setSelectedReport(null);
  };

  // 解鎖週報 (目前只是測試，未接金流)
  const handleUnlockReport = (reportId) => {
  const reportToUnlock = weeklyReports.find(r => r.id === reportId);
  if (!reportToUnlock) return;
  
  const unlockedReport = {
    ...reportToUnlock,
    status: 'paid',
    paidAt: new Date().toISOString()
  };
  
  setWeeklyReports(prev => 
    prev.map(report => 
      report.id === reportId ? unlockedReport : report
    )
  );
  
  setSelectedReport(unlockedReport);  // ← 關鍵!
  
  alert('🧪 測試解鎖成功！(實際需接金流)');
};
    
    

  // 查看報告
  const handleViewReport = (report) => {
    setSelectedReport(report);
  };

  // 建立測試週報 (開發用)
  const handleCreateTestReport = () => {
  // 如果是第一次點擊,先載入完整測試資料
  if (weeklyReports.length === 0) {
    const initialReports = [
      {
        id: 'week_2025_47',
        weekNumber: 47,
        year: 2025,
        weekStart: '2025-11-18',
        weekEnd: '2025-11-24',
        totalDiaries: 2,
        status: 'pending',
        generatedAt: new Date().toISOString(),
        content: {
          overview: '本週你記錄了2天的心情，從週一的期待到週三的充實，能感受到你對新開始的積極態度。雖然記錄天數不多，但每一次的書寫都是在照顧自己的心。\n\n在這兩天的記錄中，我看到你對生活充滿好奇心，願意嘗試新事物。週一的那份期待感很珍貴，它代表著你對未來保持開放的心態。週三的充實感則顯示你正在積極實踐，把想法化為行動。這種從期待到實踐的過程，就是成長的軌跡。\n\n繼續保持這份對自己的關注，每天抽出幾分鐘記錄心情，你會發現更多關於自己的美好。',
          suggestions: [
            '週一展現了對新事物的好奇心，這種開放的態度很棒！',
            '建議可以在忙碌的日子也抽出5分鐘記錄，不用寫太多',
            '試著觀察不同情境下的情緒變化'
          ],
          highlights: {
            mostFrequent: { emotion: '期待', emoji: '😊', count: 1 },
            moodStability: '穩定',
            growth: '+5%'
          },
          encouragement: '看到你開始記錄心情，真的很棒！每一次的書寫都是在更了解自己，都是在照顧自己的情緒健康。\n\n雖然這週只記錄了兩天，但這已經是一個很好的開始。記錄心情不需要完美，不需要每天都寫，重要的是你願意為自己停下來，傾聽內心的聲音。\n\n下週試著多記錄幾天吧！不用寫很多，簡單幾句話就好。你會發現，這些記錄會成為你了解自己、陪伴自己的珍貴禮物。記住，我都在這裡陪伴你成長 🥰'
        }
      },
      {
        id: 'week_2025_46',
        weekNumber: 46,
        year: 2025,
        weekStart: '2025-11-11',
        weekEnd: '2025-11-17',
        totalDiaries: 5,
        status: 'claimed',
        generatedAt: '2025-11-18T08:00:00.000Z',
        content: {
          overview: '這週你記錄了5天的心情，從週一的忙碌到週五的輕鬆，能感受到你在工作與生活間找到了平衡。情緒的起伏都被你好好地察覺和記錄下來了。',
          suggestions: [
            '週三的突破很棒！你嘗試了新的方式處理壓力',
            '週五展現了韌性，面對困難沒有放棄',
            '建議下週可以多關注自己的需求，適時休息'
          ],
          highlights: {
            mostFrequent: { emotion: '開心', emoji: '😊', count: 3 },
            moodStability: '穩定向上',
            growth: '+15%'
          },
          encouragement: '看到你這週持續記錄，真的很棒！每一次的書寫都是在照顧自己的心。你對情緒的覺察力提升了很多！'
        }
      },
      {
        id: 'week_2025_45',
        weekNumber: 45,
        year: 2025,
        weekStart: '2025-11-04',
        weekEnd: '2025-11-10',
        totalDiaries: 6,
        status: 'paid',
        generatedAt: '2025-11-11T08:00:00.000Z',
        paidAt: '2025-11-12T10:30:00.000Z',
        content: {
          overview: '本週你記錄了6天的心情，這是很棒的堅持！從週一的平靜到週末的愉悅，整週的情緒都維持在正向的狀態。',
          suggestions: [
            '週二面對挑戰時的冷靜很值得稱讚',
            '週四的自我照顧做得很好，繼續保持',
            '週末的放鬆很重要，給自己充電的時間'
          ],
          highlights: {
            mostFrequent: { emotion: '平靜', emoji: '😌', count: 4 },
            moodStability: '非常穩定',
            growth: '+20%'
          },
          encouragement: '這週的你很棒！不僅持續記錄，還能在忙碌中保持情緒穩定。看到你的成長真的很感動！'
        }
      }
    ];

// 領取月報
const handleClaimMonthlyReport = (reportId) => {
  console.log('領取月報:', reportId);
  setMonthlyReports(prev => 
    prev.map(report => 
      report.id === reportId 
        ? { ...report, status: 'claimed' }
        : report
    )
  );
  alert('月報已領取！可以解鎖查看了 ✨');
  setSelectedMonthlyReport(null);
};

// 解鎖月報 (目前只是測試，未接金流)
const handleUnlockMonthlyReport = (reportId) => {
  const reportToUnlock = monthlyReports.find(r => r.id === reportId);
  if (!reportToUnlock) return;
  
  const unlockedReport = {
    ...reportToUnlock,
    status: 'paid',
    paidAt: new Date().toISOString()
  };
  
  setMonthlyReports(prev => 
    prev.map(report => 
      report.id === reportId ? unlockedReport : report
    )
  );
  
  setSelectedMonthlyReport(unlockedReport);
  alert('🧪 測試解鎖成功！(實際需接金流)');
};

// 查看月報
const handleViewMonthlyReport = (report) => {
  setSelectedMonthlyReport(report);
};

// 建立測試月報（開發用）
const handleCreateTestMonthlyReport = () => {
  // 如果是第一次點擊，先載入完整測試資料
  if (monthlyReports.length === 0) {
    const initialReports = [
      {
        id: 'month_2025_11',
        month: 11,
        year: 2025,
        monthStart: '2025-11-01',
        monthEnd: '2025-11-30',
        totalDiaries: 15,
        status: 'pending',
        generatedAt: new Date().toISOString(),
        content: {
          overview: '本月你記錄了 15 天的心情，從這一個月的紀錄看來，你似乎正處在一個相對平穩但也在思考人生方向的階段。',
          suggestions: [
            '持續保持自我覺察的習慣',
            '可以嘗試建立更固定的放鬆儀式',
            '在感到迷茫時，寫下三個可以採取的小行動'
          ],
          highlights: {
            mostFrequent: { emotion: '平靜', emoji: '😌', count: 6 },
            moodStability: '穩定向上',
            growth: '+25%'
          },
          encouragement: '這個月的你展現了很好的情緒穩定度，繼續保持這份對內在的關注。'
        }
      },
      {
        id: 'month_2025_10',
        month: 10,
        year: 2025,
        monthStart: '2025-10-01',
        monthEnd: '2025-10-31',
        totalDiaries: 12,
        status: 'claimed',
        generatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        content: {
          overview: '十月份你記錄了 12 天，這個月的情緒波動較大。',
          suggestions: ['注意休息', '適時尋求支持', '保持運動習慣'],
          highlights: {
            mostFrequent: { emotion: '焦慮', emoji: '😰', count: 5 },
            moodStability: '波動較大',
            growth: '-10%'
          },
          encouragement: '雖然這個月比較辛苦，但你一直在努力面對。'
        }
      }
    ];
    
    setMonthlyReports(initialReports);
    alert('✅ 已建立測試月報！點「月報記錄」查看');
  } else {
    alert('📊 測試資料已存在！');
  }
};
    // ==================== 訂閱系統函數 ====================

// 選擇方案
const handleSelectPlan = (plan) => {
  console.log('選擇方案:', plan);
  
  // 測試模式：直接模擬訂閱成功
  if (isDevelopment) {
    if (plan.id === 'trial') {
      // 免費試用
      setUserSubscription({
        status: 'trial',
        plan: 'trial',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });
      alert('🎉 免費試用已開通！7 天內可免費查看週報');
    } else if (plan.id === 'monthly' || plan.id === 'yearly') {
      // 訂閱方案
      setUserSubscription({
        status: 'active',
        plan: plan.id,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
      alert(`🎉 ${plan.name}訂閱成功！(測試模式)`);
    } else if (plan.selectedItem) {
      // 單次購買
      alert(`🎉 ${plan.selectedItem.name}已解鎖！NT$ ${plan.selectedItem.price} (測試模式)`);
    }
    
    setShowSubscriptionPlans(false);
  }
};
    setWeeklyReports(initialReports);
    alert('✅ 測試週報已載入! (3份)\n點擊「查看我的成長記錄」開始測試!');
    return;
  }
  
  // 後續點擊才建立新的測試週報
  const newReport = {
    id: `test_${Date.now()}`,
    weekNumber: 48,
    year: 2025,
    weekStart: '2025-11-25',
    weekEnd: '2025-12-01',
    totalDiaries: 4,
    status: 'pending',
    generatedAt: new Date().toISOString(),
    content: {
      overview: '測試週報內容...',
      suggestions: ['測試建議1', '測試建議2'],
      highlights: {
        mostFrequent: { emotion: '開心', emoji: '😊', count: 2 },
        moodStability: '穩定',
        growth: '+10%'
      },
      encouragement: '測試鼓勵文字...'
    }
  };
  
  setWeeklyReports(prev => [newReport, ...prev]);
  alert('✅ 新測試週報已建立！');
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
            {/* 統計卡片 - 全淺藍配色 */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {/* 總記錄 - 淺藍色 */}
              <div 
                className="rounded-2xl shadow-md p-4 text-center transition-all hover:shadow-lg hover:scale-105"
                style={{ background: '#F5EDE7' }}
              >
                <div className="text-3xl font-bold" style={{ color: '#3B82F6' }}>{letters.length}</div>
                <div className="text-sm mt-1 text-gray-600">總記錄 📝</div>
              </div>
              
              {/* 連續天數 - 淺藍色 */}
              <div 
                className="rounded-2xl shadow-md p-4 text-center transition-all hover:shadow-lg hover:scale-105"
                style={{ background: '#F5EDE7' }}
              >
                <div className="text-3xl font-bold" style={{ color: '#3B82F6' }}>{checkConsecutiveDays(letters)}</div>
                <div className="text-sm mt-1 text-gray-600">連續天數 🔥</div>
              </div>
              
              {/* 記錄天數 - 淺藍色 */}
              <div 
                className="rounded-2xl shadow-md p-4 text-center transition-all hover:shadow-lg hover:scale-105"
                style={{ background: '#F5EDE7' }}
              >
                <div className="text-3xl font-bold text-blue-600">{totalDays}</div>
                <div className="text-sm text-gray-600 mt-1">記錄天數 📅</div>
              </div>
            </div>
{/* 測試訂閱系統按鈕 (開發模式) */}
{isDevelopment && (
  <button
    onClick={() => setShowSubscriptionPlans(true)}
    className="w-full py-3 rounded-2xl font-medium transition-all hover:shadow-lg mb-4"
    style={{
      background: 'linear-gradient(to right, #FFD700, #FFA500)',
      color: 'white'
    }}
  >
    🧪 測試訂閱系統
  </button>
)}
            
{/* 週報提示卡片 */}
<WeeklyReportCard 
  letters={letters}
  onViewReports={() => setShowWeeklyReports(true)}
/>
            
{/* 📈 月報提示卡片 */}
<MonthlyReportCard
  letters={letters}
  onViewReports={() => setShowMonthlyReports(true)}
/>
            
            {/* 當前信件顯示 */}
            {currentLetter ? (
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 mb-6 animate-fade-in">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="text-purple-600" size={24} />
                      <h2 className="text-xl font-medium text-gray-800">我的專屬日記 📘</h2>
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

                

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="分享你的心情、煩惱、或任何想說的話...&#10;歐特在這裡陪伴你成長 🥰"
                      className="w-full h-32 p-4 pr-12 border-2 border-purple-100 rounded-2xl focus:border-purple-300 focus:outline-none resize-none"
                      disabled={isGenerating}
                    />
                    <button
                      type="button"
                      onClick={handleVoiceInput}
                      className={`absolute right-3 top-3 p-2 rounded-xl transition-all ${
                        isListening 
                          ? 'bg-red-500 text-white animate-pulse' 
                          : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                      }`}
                      disabled={isGenerating}
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
                    disabled={isGenerating || !input.trim()}
                    className={`w-full py-3 rounded-2xl font-medium transition-all flex items-center justify-center gap-2 ${
                      isGenerating || !input.trim()
                        ? 'bg-gray-300 text-gray-500'
                        : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg'
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        保存中......
                      </>
                    ) : (
                      <>
                        <Send size={20} />
                        保存日記 💾
                      </>
                    )}
                  </button>
                </form>

                {/* 🔧 加強版進度提醒 */}
                <div className="mt-4 space-y-3">
                  {/* 剩餘次數 */}
                  <div className="text-center text-xs text-gray-500">
                    
                  </div>

                 
                </div>
              </div>
            )}

            {/* 功能按鈕 - 沙色背景 */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowHistory(true)}
                className="backdrop-blur-sm rounded-2xl shadow-md p-6 transition-all text-left group hover:shadow-xl hover:scale-105"
                style={{ background: '#F5EDE7' }}
              >
                <Clock className="mb-3 group-hover:scale-110 transition-transform" style={{ color: '#A87D5F' }} size={28} />
                <h3 className="font-medium mb-1" style={{ color: '#5A4A42' }}>歷史記錄 📚</h3>
                <p className="text-sm" style={{ color: '#8B7A70' }}>查看過去的對話</p>
              </button>

              <button
                onClick={() => setShowCalendar(true)}
                className="backdrop-blur-sm rounded-2xl shadow-md p-6 transition-all text-left group hover:shadow-xl hover:scale-105"
                style={{ background: '#F5EDE7' }}
              >
                <Calendar className="mb-3 group-hover:scale-110 transition-transform" style={{ color: '#A87D5F' }} size={28} />
                <h3 className="font-medium mb-1" style={{ color: '#5A4A42' }}>日曆檢視 📅</h3>
                <p className="text-sm" style={{ color: '#8B7A70' }}>看看哪些日子有記錄</p>
              </button>

              <button
                onClick={() => setShowStats(true)}
                className="backdrop-blur-sm rounded-2xl shadow-md p-6 transition-all text-left group hover:shadow-xl hover:scale-105"
                style={{ background: '#F5EDE7' }}
              >
                <BarChart3 className="mb-3 group-hover:scale-110 transition-transform" style={{ color: '#A87D5F' }} size={28} />
                <h3 className="font-medium mb-1" style={{ color: '#5A4A42' }}>情緒統計 📊</h3>
                <p className="text-sm" style={{ color: '#8B7A70' }}>了解你的情緒變化</p>
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
                className={`backdrop-blur-sm rounded-2xl shadow-md p-6 transition-all text-left group ${
                  !canGenerateReport
                    ? 'cursor-not-allowed'
                    : 'hover:shadow-xl hover:scale-105'
                }`}
                style={{ 
                  background: !canGenerateReport ? '#E5E7EB' : '#F5EDE7'
                }}
              >
                <TrendingUp 
                  className="mb-3 group-hover:scale-110 transition-transform" 
                  style={{ color: !canGenerateReport ? '#9CA3AF' : '#A87D5F' }}
                  size={28} 
                />
                <h3 
                  className="font-medium mb-1"
                  style={{ color: !canGenerateReport ? '#6B7280' : '#5A4A42' }}
                >
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
    className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md p-6 hover:shadow-lg transition-all"
  >
    <div className="flex justify-between items-start mb-3">
      <span className="text-sm text-gray-500">
        📅 {new Date(letter.date).toLocaleDateString('zh-TW', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}
      </span>
      <div className="flex gap-2">
        {letter.emotion && (
          <span className="text-sm px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
            {emotionEmojis[letter.emotion] || '💭'} {letter.emotion}
          </span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleEditLetter(letter);
          }}
          className="px-3 py-1 rounded-full text-sm font-medium transition-all hover:shadow-md"
          style={{ background: '#FFD700', color: '#5A4A42' }}
        >
          ✏️ 編輯
        </button>
      </div>
    </div>
    
    <div 
      onClick={() => {
        setCurrentLetter(letter);
        setShowHistory(false);
      }}
      className="cursor-pointer"
    >
      <div className="mb-2">
        <p className="text-xs text-gray-500 mb-1">💭 你說:</p>
        <p className="text-gray-700 font-medium line-clamp-2">
          {highlightKeyword(letter.userInput)}
        </p>
      </div>
      {letter.content && (
        <div>
          <p className="text-xs text-gray-500 mb-1">💌 歐特說:</p>
          <p className="text-gray-600 text-sm italic line-clamp-3">
            {highlightKeyword(letter.content?.substring(0, 150))}...
          </p>
        </div>
      )}
      <p className="text-xs text-purple-600 mt-2">點擊查看完整內容 →</p>
    </div>
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
{/* 週報列表頁面 */}
{showWeeklyReports && (
  <WeeklyReportsPage
    weeklyReports={weeklyReports}
    onClose={() => setShowWeeklyReports(false)}
    onViewReport={handleViewReport}
    onShowSubscription={() => setShowSubscriptionPlans(true)}
  />
)}

{/* 週報詳細內容頁面 */}
{selectedReport && (
  <WeeklyReportDetailPage
    report={selectedReport}
    onClose={() => setSelectedReport(null)}
    onClaim={handleClaimReport}
    onUnlock={handleUnlockReport}
  />
)}
{/* 月報列表頁面 */}
{showMonthlyReports && (
  <MonthlyReportsPage
    monthlyReports={monthlyReports}
    onClose={() => setShowMonthlyReports(false)}
    onViewReport={handleViewMonthlyReport}
    onShowSubscription={() => setShowSubscriptionPlans(true)}
  />
)}

{/* 月報詳細內容頁面 */}
{selectedMonthlyReport && (
  <MonthlyReportDetailPage
    report={selectedMonthlyReport}
    onClose={() => setSelectedMonthlyReport(null)}
    onClaim={handleClaimMonthlyReport}
    onUnlock={handleUnlockMonthlyReport}
  />
)}

{/* 月報測試面板 */}
<MonthlyReportTestPanel
  isDevelopment={isDevelopment}
  onCreateTestReport={handleCreateTestMonthlyReport}
/>

      {/* 💳 付款流程 Modal */}
{paymentFlow.show && paymentFlow.step === 'confirm' && (
  <PaymentConfirmationModal
    plan={paymentFlow.plan}
    onConfirm={handleConfirmPayment}
    onClose={handleClosePayment}
  />
)}

{paymentFlow.show && paymentFlow.step === 'success' && (
  <PaymentSuccessModal
    plan={paymentFlow.plan}
    onClose={handleClosePayment}
    nextBillingDate={
      paymentFlow.plan?.period === '月' 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('zh-TW')
        : paymentFlow.plan?.period === '年'
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('zh-TW')
        : null
    }
  />
)}

{paymentFlow.show && paymentFlow.step === 'error' && (
  <PaymentErrorModal
    error={paymentFlow.error}
    onRetry={handleRetryPayment}
    onClose={handleClosePayment}
  />
)}


{/* 訂閱方案頁面 */}
{showSubscriptionPlans && (
  <SubscriptionPlansPage
    user={user}
    onClose={() => setShowSubscriptionPlans(false)}
    onSelectPlan={handleStartPayment}
    hasTrial={userSubscription?.status === 'trial'}
  />
)}
{/* 開發者測試面板 */}
<WeeklyReportTestPanel
  isDevelopment={isDevelopment}
  onCreateTestReport={handleCreateTestReport}
/>

// 📝 日記編輯 Modal
{editingLetter && (
  <DiaryEditModal
    letter={editingLetter}
    onClose={() => setEditingLetter(null)}
    onSave={handleSaveEdit}
  />
)}      
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

// ==================== 訂閱系統函數 ====================

// 選擇方案
const handleSelectPlan = (plan) => {
  console.log('選擇方案:', plan);
  
  // 測試模式:直接模擬訂閱成功
  if (isDevelopment) {
    if (plan.id === 'trial') {
      // 免費試用
      setUserSubscription({
        status: 'trial',
        plan: 'trial',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });
      alert('🎉 免費試用已開通！7 天內可免費查看週報');
    } else if (plan.id === 'monthly' || plan.id === 'yearly') {
      // 訂閱方案
      setUserSubscription({
        status: 'active',
        plan: plan.id,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
      alert(`🎉 ${plan.name}訂閱成功！(測試模式)`);
    } else if (plan.selectedItem) {
      // 單次購買
      alert(`🎉 ${plan.selectedItem.name}已解鎖！NT$ ${plan.selectedItem.price} (測試模式)`);
    }
    
    setShowSubscriptionPlans(false);
  }
};
export default HealingNoteApp;
