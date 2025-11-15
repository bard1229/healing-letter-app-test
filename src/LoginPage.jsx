import React, { useState } from 'react';
import { Mail, Lock, KeyRound } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from './firebase';
import { getLineLoginUrl, generateState, saveState } from './lineAuth';

// 水獺圖片
const OTTER_IMAGE = '/otter.png';

const LoginPage = ({ onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // LINE Login 處理
  const handleLineLogin = () => {
    try {
      const state = generateState();
      saveState(state);
      const loginUrl = getLineLoginUrl(state);
      window.location.href = loginUrl;
    } catch (error) {
      console.error('LINE Login 初始化失敗:', error);
      setError('LINE 登入初始化失敗,請稍後再試 😢');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log('註冊成功:', userCredential.user);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('登入成功:', userCredential.user);
      }
      
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (error) {
      console.error('認證錯誤:', error);
      
      switch (error.code) {
        case 'auth/invalid-email':
          setError('Email 格式不正確 📧');
          break;
        case 'auth/user-not-found':
          setError('找不到此帳號,請先註冊 🔍');
          break;
        case 'auth/wrong-password':
          setError('密碼錯誤,請重試 🔒');
          break;
        case 'auth/email-already-in-use':
          setError('此 Email 已被註冊 ⚠️');
          break;
        case 'auth/weak-password':
          setError('密碼強度不足,至少需要 6 個字元 💪');
          break;
        case 'auth/invalid-credential':
          setError('帳號或密碼錯誤 🔐');
          break;
        case 'auth/network-request-failed':
          setError('網路連線失敗,請檢查網路 📡');
          break;
        case 'auth/too-many-requests':
          setError('登入嘗試次數過多,請稍後再試 ⏰');
          break;
        default:
          setError('登入失敗,請稍後再試 😢');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    if (!email) {
      setError('請輸入 Email 📧');
      return;
    }

    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage('✅ 密碼重設信已寄出!請檢查您的 Email 收件匣');
      setTimeout(() => {
        setShowForgotPassword(false);
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('密碼重設失敗:', error);
      
      switch (error.code) {
        case 'auth/invalid-email':
          setError('Email 格式不正確 📧');
          break;
        case 'auth/user-not-found':
          setError('找不到此帳號 🔍');
          break;
        case 'auth/network-request-failed':
          setError('網路連線失敗,請檢查網路 📡');
          break;
        case 'auth/too-many-requests':
          setError('請求次數過多,請稍後再試 ⏰');
          break;
        default:
          setError('密碼重設失敗,請稍後再試 😢');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #FFF9F5 0%, #FBF7F4 50%, #F5EDE7 100%)'
      }}
    >
      <div className="w-full max-w-md">
        {/* 🦦 水獺圖片 */}
        <div className="flex justify-center mb-6">
          <img 
            src={OTTER_IMAGE} 
            alt="Otter" 
            className="w-32 h-32 object-contain animate-float"
          />
        </div>

        {/* 標題與 Slogan */}
        <div className="text-center mb-8">
          <h1 
            className="text-3xl font-bold mb-3"
            style={{ color: '#5A4A42' }}
          >
            HealingNote 療心筆記
          </h1>
          <p 
            className="text-lg leading-relaxed"
            style={{ color: '#8B7A70' }}
          >
            每一個情緒都值得被理解<br />
            陪你記錄與長期陪伴
          </p>
        </div>

        {/* 分隔線 */}
        <div className="flex items-center justify-center mb-6">
          <div style={{ width: '80px', height: '1px', background: '#E8D4C4' }}></div>
        </div>

        {/* 簡介卡片 */}
        <div 
          className="mb-8 p-6 rounded-3xl shadow-lg"
          style={{ 
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(232, 212, 196, 0.3)'
          }}
        >
          <p 
            className="text-center text-lg font-medium mb-4"
            style={{ color: '#5A4A42' }}
          >
            你的私密情緒日記 📔
          </p>
          
          <p 
            className="text-sm leading-relaxed mb-4 text-center"
            style={{ color: '#8B7A70' }}
          >
            記錄每一天的心情起伏 🌈<br />
            不只回應你,更幫你看見情緒變化 💙<br />
            你的專屬情緒管家 🦦
          </p>

          <div 
            className="space-y-3 text-sm"
            style={{ color: '#8B7A70' }}
          >
            <div className="flex items-start gap-2">
              <span>•</span>
              <span>專注情緒健康,溫暖細膩的覺察 ✨</span>
            </div>
            <div className="flex items-start gap-2">
              <span>•</span>
              <span>保存記錄,追蹤心情變化 📊</span>
            </div>
            <div className="flex items-start gap-2">
              <span>•</span>
              <span>智能趨勢分析,陪你看見成長 🌱</span>
            </div>
          </div>
        </div>

        {/* 分隔線 */}
        <div className="flex items-center justify-center mb-6">
          <div style={{ width: '80px', height: '1px', background: '#E8D4C4' }}></div>
        </div>

        {/* 登入/註冊表單 */}
        {!showForgotPassword ? (
          <div 
            className="p-8 rounded-3xl shadow-xl"
            style={{ 
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(232, 212, 196, 0.3)'
            }}
          >
            <h2 
              className="text-xl font-medium text-center mb-6"
              style={{ color: '#5A4A42' }}
            >
              {isSignUp ? '註冊新帳號 ✨' : '歡迎回來 💙'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <div className="relative">
                  <Mail 
                    className="absolute left-4 top-1/2 -translate-y-1/2" 
                    size={20}
                    style={{ color: '#A87D5F' }}
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-2xl focus:outline-none transition-all"
                    style={{ 
                      background: '#FBF7F4',
                      border: '2px solid #E8D4C4',
                      color: '#5A4A42'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#C9A386'}
                    onBlur={(e) => e.target.style.borderColor = '#E8D4C4'}
                    required
                  />
                </div>
              </div>

              <div>
                <div className="relative">
                  <Lock 
                    className="absolute left-4 top-1/2 -translate-y-1/2" 
                    size={20}
                    style={{ color: '#A87D5F' }}
                  />
                  <input
                    type="password"
                    placeholder="密碼"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-2xl focus:outline-none transition-all"
                    style={{ 
                      background: '#FBF7F4',
                      border: '2px solid #E8D4C4',
                      color: '#5A4A42'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#C9A386'}
                    onBlur={(e) => e.target.style.borderColor = '#E8D4C4'}
                    required
                  />
                </div>
              </div>

              {error && (
                <div 
                  className="p-3 rounded-xl text-sm text-center"
                  style={{ 
                    background: '#FFF5F5',
                    color: '#C53030',
                    border: '1px solid #FED7D7'
                  }}
                >
                  {error}
                </div>
              )}

              {successMessage && (
                <div 
                  className="p-3 rounded-xl text-sm text-center"
                  style={{ 
                    background: '#F0FFF4',
                    color: '#22543D',
                    border: '1px solid #C6F6D5'
                  }}
                >
                  {successMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl font-medium text-white transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(to right, #C9A386, #D4A373)',
                  boxShadow: '0 4px 6px rgba(169, 131, 102, 0.2)'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 12px rgba(169, 131, 102, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 6px rgba(169, 131, 102, 0.2)';
                }}
              >
                {loading ? '處理中...' : (isSignUp ? '註冊 💌' : '登入 💌')}
              </button>

              {/* LINE Login */}
              <div className="relative flex items-center justify-center my-4">
                <div style={{ flex: 1, height: '1px', background: '#E8D4C4' }}></div>
                <span className="px-4 text-xs" style={{ color: '#A89B93' }}>或</span>
                <div style={{ flex: 1, height: '1px', background: '#E8D4C4' }}></div>
              </div>

              <button
                type="button"
                onClick={handleLineLogin}
                className="w-full py-3 rounded-2xl font-medium transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                style={{
                  background: '#06C755',
                  color: 'white'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                <span className="text-xl">🟢</span>
                使用 LINE 登入
              </button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                  setSuccessMessage('');
                }}
                className="text-sm transition-colors"
                style={{ color: '#A87D5F' }}
                onMouseEnter={(e) => e.target.style.color = '#C9A386'}
                onMouseLeave={(e) => e.target.style.color = '#A87D5F'}
              >
                {isSignUp ? '已有帳號? 立即登入' : '還沒有帳號? 立即註冊'}
              </button>

              {!isSignUp && (
                <>
                  <br />
                  <button
                    onClick={() => {
                      setShowForgotPassword(true);
                      setError('');
                      setSuccessMessage('');
                    }}
                    className="text-sm transition-colors"
                    style={{ color: '#A87D5F' }}
                    onMouseEnter={(e) => e.target.style.color = '#C9A386'}
                    onMouseLeave={(e) => e.target.style.color = '#A87D5F'}
                  >
                    <KeyRound size={14} className="inline mr-1" />
                    忘記密碼?
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          /* 忘記密碼表單 */
          <div 
            className="p-8 rounded-3xl shadow-xl"
            style={{ 
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(232, 212, 196, 0.3)'
            }}
          >
            <h2 
              className="text-xl font-medium text-center mb-6"
              style={{ color: '#5A4A42' }}
            >
              重設密碼 🔐
            </h2>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <div className="relative">
                  <Mail 
                    className="absolute left-4 top-1/2 -translate-y-1/2" 
                    size={20}
                    style={{ color: '#A87D5F' }}
                  />
                  <input
                    type="email"
                    placeholder="輸入您的 Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-2xl focus:outline-none transition-all"
                    style={{ 
                      background: '#FBF7F4',
                      border: '2px solid #E8D4C4',
                      color: '#5A4A42'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#C9A386'}
                    onBlur={(e) => e.target.style.borderColor = '#E8D4C4'}
                    required
                  />
                </div>
              </div>

              {error && (
                <div 
                  className="p-3 rounded-xl text-sm text-center"
                  style={{ 
                    background: '#FFF5F5',
                    color: '#C53030',
                    border: '1px solid #FED7D7'
                  }}
                >
                  {error}
                </div>
              )}

              {successMessage && (
                <div 
                  className="p-3 rounded-xl text-sm text-center"
                  style={{ 
                    background: '#F0FFF4',
                    color: '#22543D',
                    border: '1px solid #C6F6D5'
                  }}
                >
                  {successMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl font-medium text-white transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(to right, #C9A386, #D4A373)',
                  boxShadow: '0 4px 6px rgba(169, 131, 102, 0.2)'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 12px rgba(169, 131, 102, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 6px rgba(169, 131, 102, 0.2)';
                }}
              >
                {loading ? '發送中...' : '發送重設信 📧'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setError('');
                  setSuccessMessage('');
                }}
                className="text-sm transition-colors"
                style={{ color: '#A87D5F' }}
                onMouseEnter={(e) => e.target.style.color = '#C9A386'}
                onMouseLeave={(e) => e.target.style.color = '#A87D5F'}
              >
                ← 返回登入
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
