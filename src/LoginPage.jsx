import React, { useState } from 'react';
import { Heart, Mail, Lock, Sparkles, KeyRound } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from './firebase';
import LineLoginButton from './LineLoginButton';

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
      
      let errorMessage = '發生錯誤,請稍後再試 😢';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = '這個 Email 已經被註冊了 📧';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email 格式不正確 ❌';
          break;
        case 'auth/weak-password':
          errorMessage = '密碼至少需要 6 個字元 🔒';
          break;
        case 'auth/user-not-found':
          errorMessage = '找不到此帳號,請先註冊 💭';
          break;
        case 'auth/wrong-password':
          errorMessage = '密碼錯誤 🔑';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Email 或密碼錯誤 ⚠️';
          break;
        default:
          errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    if (!email) {
      setError('請輸入你的 Email 📧');
      return;
    }

    console.log('🔄 開始發送重設信件到:', email);
    console.log('🔄 當前時間:', new Date().toLocaleString('zh-TW'));

    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      console.log('✅ Firebase 回應成功!信件已發送!');
      console.log('✅ 請檢查以下位置:');
      console.log('   1. 收件匣');
      console.log('   2. 垃圾郵件');
      console.log('   3. 促銷內容');
      
      setSuccessMessage(`✅ 密碼重設信件已發送!

請檢查 Email 收件匣 📧
目標信箱: ${email}

💡 提醒:
• 檢查垃圾郵件資料夾
• 可能需要等待 1-2 分鐘
• 信件來自 noreply@...firebaseapp.com`);
      
      setTimeout(() => {
        setShowForgotPassword(false);
        setSuccessMessage('');
      }, 8000);
    } catch (error) {
      console.error('❌ 發送重設信件失敗!');
      console.error('❌ 錯誤代碼:', error.code);
      console.error('❌ 錯誤訊息:', error.message);
      console.error('❌ 完整錯誤:', error);
      
      let errorMessage = '發送失敗,請稍後再試 😢';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = '找不到此 Email 的帳號 ❌\n\n請確認:\n• Email 拼寫正確\n• 已經註冊過此帳號';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email 格式不正確 ⚠️\n\n範例: your@email.com';
          break;
        case 'auth/missing-email':
          errorMessage = '請輸入 Email ⚠️';
          break;
        case 'auth/too-many-requests':
          errorMessage = '⚠️ 發送次數過多\n\n請稍後再試 (約 1 小時)';
          break;
        default:
          errorMessage = `發送失敗 😢\n\n錯誤: ${error.message}\n\n請截圖此訊息聯絡客服`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* 標題區 */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-block mb-4">
            <img src={OTTER_IMAGE} alt="歐特" className="w-24 h-24 mx-auto object-contain" />
          </div>
          <h1 className="text-3xl font-medium text-gray-800 mb-2">
            HealingNote 療心筆記 💙
          </h1>
          <p className="text-gray-600">
            在這裡,你可以安心說出心裡的話 ✨
          </p>
        </div>

        {/* 忘記密碼表單 */}
        {showForgotPassword ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 animate-fade-in">
            <div className="flex items-center gap-2 mb-6">
              <KeyRound className="text-purple-600" size={24} />
              <h2 className="text-xl font-medium text-gray-800">重設密碼 🔑</h2>
            </div>

            <p className="text-gray-600 mb-6 text-sm">
              輸入你的 Email,我們會發送密碼重設連結給你 📧
            </p>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email 📧
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full pl-10 pr-4 py-3 border-2 border-purple-100 rounded-2xl focus:border-purple-300 focus:outline-none"
                  />
                </div>
              </div>

              {successMessage && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-3 text-green-700 text-sm whitespace-pre-line">
                  {successMessage}
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-red-600 text-sm whitespace-pre-line">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowForgotPassword(false); setError(''); setSuccessMessage(''); }}
                  className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium transition-all"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 py-3 rounded-2xl font-medium transition-all flex items-center justify-center gap-2 ${
                    loading
                      ? 'bg-gray-300 text-gray-500'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg'
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      發送中...
                    </>
                  ) : (
                    <>
                      <Mail size={20} />
                      發送重設信件
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* 登入/註冊表單 */
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8">
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => { setIsSignUp(false); setError(''); setSuccessMessage(''); }}
                className={`flex-1 py-2 rounded-full font-medium transition-all ${
                  !isSignUp
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                登入 🔓
              </button>
              <button
                onClick={() => { setIsSignUp(true); setError(''); setSuccessMessage(''); }}
                className={`flex-1 py-2 rounded-full font-medium transition-all ${
                  isSignUp
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                註冊 ✨
              </button>
            </div>

            {/* LINE Login 按鈕 */}
            <div className="mb-6">
              <LineLoginButton onError={setError} />
            </div>

            {/* 分隔線 */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white/80 text-gray-500">或使用 Email 登入</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email 📧
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full pl-10 pr-4 py-3 border-2 border-purple-100 rounded-2xl focus:border-purple-300 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    密碼 🔒
                  </label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-purple-600 hover:text-purple-700 transition-colors"
                    >
                      忘記密碼? 🔑
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="至少 6 個字元"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-4 py-3 border-2 border-purple-100 rounded-2xl focus:border-purple-300 focus:outline-none"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-red-600 text-sm whitespace-pre-line">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-2xl font-medium transition-all flex items-center justify-center gap-2 ${
                  loading
                    ? 'bg-gray-300 text-gray-500'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg'
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    處理中...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    {isSignUp ? '註冊帳號 ✨' : '登入 💙'}
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              {isSignUp ? (
                <>註冊後,你的所有記錄都會安全地儲存在雲端 ☁️</>
              ) : (
                <>還沒有帳號嗎?點上方「註冊」建立新帳號 ✨</>
              )}
            </p>
          </div>
        )}

        {/* 底部說明 */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>🔒 你的隱私很重要</p>
          <p>所有記錄內容都僅限你本人查看 💙</p>
        </div>
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

export default LoginPage;
