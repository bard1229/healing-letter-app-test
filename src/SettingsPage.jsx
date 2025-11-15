import React, { useState } from 'react';
import { ArrowLeft, User, Save, Mail } from 'lucide-react';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

const SettingsPage = ({ user, onBack, onUpdate }) => {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    if (!displayName.trim()) {
      setMessage('請輸入暱稱 💭');
      return;
    }

    setIsSaving(true);
    setMessage('');

    try {
      // 更新 Firebase Auth 的 displayName
      if (auth.currentUser && !user.isLineUser) {
        await updateProfile(auth.currentUser, {
          displayName: displayName.trim()
        });
      }

      // 如果是 LINE 使用者,更新 localStorage
      if (user.isLineUser) {
        localStorage.setItem('lineUserName', displayName.trim());
      }

      // 更新 Firestore 的使用者資料
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: displayName.trim(),
        updatedAt: new Date()
      });

      setMessage('✅ 儲存成功!');
      
      // 通知父組件更新
      onUpdate();

      // 3秒後清除訊息
      setTimeout(() => {
        setMessage('');
      }, 3000);

    } catch (error) {
      console.error('儲存失敗:', error);
      setMessage('❌ 儲存失敗,請重試');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-medium text-gray-800">個人設定 ⚙️</h2>
      </div>

      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8">
        {/* 個人資訊區 */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
            <User size={20} className="text-purple-600" />
            個人資訊
          </h3>

          {/* Email 顯示 (唯讀) */}
          {user.email && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Mail size={16} />
                Email
              </label>
              <div className="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-2xl text-gray-600">
                {user.email}
              </div>
              <p className="text-xs text-gray-500 mt-1">Email 無法修改</p>
            </div>
          )}

          {/* LINE 使用者標記 */}
          {user.isLineUser && (
            <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-2xl">
              <p className="text-sm text-green-700 flex items-center gap-2">
                <span className="text-lg">🟢</span>
                已使用 LINE 登入
              </p>
            </div>
          )}

          {/* 暱稱輸入 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <User size={16} />
              暱稱
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="請輸入你的暱稱"
              className="w-full p-4 border-2 border-purple-100 rounded-2xl focus:border-purple-300 focus:outline-none"
              maxLength={20}
            />
            <p className="text-xs text-gray-500 mt-1">
              暱稱會顯示在首頁和療癒信中 ({displayName.length}/20)
            </p>
          </div>

          {/* 儲存按鈕 */}
          <button
            onClick={handleSave}
            disabled={isSaving || !displayName.trim()}
            className={`w-full py-3 rounded-2xl font-medium transition-all flex items-center justify-center gap-2 ${
              isSaving || !displayName.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg'
            }`}
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                儲存中...
              </>
            ) : (
              <>
                <Save size={20} />
                儲存設定
              </>
            )}
          </button>

          {/* 訊息提示 */}
          {message && (
            <div className={`mt-4 p-4 rounded-2xl text-center font-medium ${
              message.includes('✅') 
                ? 'bg-green-50 text-green-700 border-2 border-green-200'
                : 'bg-red-50 text-red-700 border-2 border-red-200'
            }`}>
              {message}
            </div>
          )}
        </div>

        {/* 其他設定區 (未來擴展) */}
        <div className="pt-8 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-800 mb-4">其他設定</h3>
          <p className="text-sm text-gray-500">
            更多設定功能即將推出 ✨
          </p>
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

export default SettingsPage;
