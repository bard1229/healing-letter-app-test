import React, { useState } from 'react';
import { Mail, Lock, Sparkles } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';

// 水獺圖片
const OTTER_IMAGE = '/otter.png';

const LoginPage = ({ onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        // 註冊新帳號
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log('註冊成功:', userCredential.user);
      } else {
        // 登入
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('登入成功:', userCredential.user);
      }
      
      // 登入成功後,父元件會自動偵測到 auth state 變化
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (error) {
      console.error('認證錯誤:', error);
      
      // 翻譯錯誤訊息
      let errorMessage = '發生錯誤,請稍後再試';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = '這個 Email 已經被註冊了';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email 格式不正確';
          break;
        case 'auth/weak-password':
          errorMessage = '密碼至少需要 6 個字元';
          break;
        case 'auth/user-not-found':
          errorMessage = '找不到此帳號,請先註冊';
          break;
        case 'auth/wrong-password':
          errorMessage = '密碼錯誤';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Email 或密碼錯誤';
          break;
        default:
          errorMessage = error.message;
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
            <img src={OTTER_IMAGE} alt="歐特" className="w-24 h-auto mx-auto" />
          </div>
          <h1 className="text-3xl font-medium text-gray-800 mb-2">
            HealingNote 療心筆記
          </h1>
          <p className="text-gray-600">
            每一個情緒都值得被理解
          </p>
        </div>

        {/* 登入/註冊表單 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => { setIsSignUp(false); setError(''); }}
              className={`flex-1 py-2 rounded-full font-medium transition-all ${
                !isSignUp
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              登入
            </button>
            <button
              onClick={() => { setIsSignUp(true); setError(''); }}
              className={`flex-1 py-2 rounded-full font-medium transition-all ${
                isSignUp
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              註冊
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email 輸入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
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

            {/* 密碼輸入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                密碼
              </label>
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

            {/* 錯誤訊息 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* 提交按鈕 */}
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
                  {isSignUp ? '註冊帳號' : '登入'}
                </>
              )}
            </button>
          </form>

          {/* 提示文字 */}
          <p className="text-center text-sm text-gray-500 mt-6">
            {isSignUp ? (
              <>註冊後,你的所有記錄都會安全地儲存在雲端</>
            ) : (
              <>還沒有帳號嗎?點上方「註冊」建立新帳號</>
            )}
          </p>
        </div>

        {/* 底部說明 */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>你的隱私很重要</p>
          <p>所有記錄內容都僅限你本人查看</p>
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
