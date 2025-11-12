import React, { useEffect, useState } from 'react';
import { getLineAccessToken, getLineProfile, verifyState } from './lineAuth';
import { auth, db } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const LineCallback = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // 取得 URL 參數
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const errorParam = urlParams.get('error');
      const errorDescription = urlParams.get('error_description');

      // 檢查是否有錯誤
      if (errorParam) {
        throw new Error(errorDescription || 'LINE 登入失敗');
      }

      // 檢查必要參數
      if (!code || !state) {
        throw new Error('缺少必要的授權參數');
      }

      // 驗證 state (防 CSRF)
      if (!verifyState(state)) {
        throw new Error('安全驗證失敗,請重新登入');
      }

      console.log('🔄 正在處理 LINE 登入...');

      // 1. 取得 Access Token
      const tokenData = await getLineAccessToken(code);
      console.log('✅ 已取得 Access Token');

      // 2. 取得使用者資料
      const profile = await getLineProfile(tokenData.access_token);
      console.log('✅ 已取得使用者資料:', profile);

      // 3. 在 Firebase 建立/更新使用者
      await createOrUpdateUser(profile, tokenData.access_token);
      console.log('✅ 使用者資料已同步到 Firebase');

      // 4. 導向首頁 (使用原生方式,不需要 react-router)
      window.location.href = '/';
    } catch (error) {
      console.error('❌ LINE 登入處理失敗:', error);
      setError(error.message || 'LINE 登入處理失敗');
      setLoading(false);
    }
  };

  const createOrUpdateUser = async (lineProfile, lineAccessToken) => {
    try {
      // 檢查使用者是否已存在
      const userDocRef = doc(db, 'users', lineProfile.userId);
      const userDoc = await getDoc(userDocRef);

      const userData = {
        lineUserId: lineProfile.userId,
        displayName: lineProfile.displayName,
        pictureUrl: lineProfile.pictureUrl,
        statusMessage: lineProfile.statusMessage || '',
        lineAccessToken: lineAccessToken,
        lastLoginAt: new Date(),
      };

      if (userDoc.exists()) {
        // 更新現有使用者
        await setDoc(userDocRef, {
          ...userData,
          updatedAt: new Date(),
        }, { merge: true });
      } else {
        // 建立新使用者
        await setDoc(userDocRef, {
          ...userData,
          createdAt: new Date(),
        });
      }

      // 儲存登入狀態到 localStorage
      localStorage.setItem('lineUserId', lineProfile.userId);
      localStorage.setItem('lineUserName', lineProfile.displayName);
      localStorage.setItem('lineUserPicture', lineProfile.pictureUrl || '');
      
    } catch (error) {
      console.error('建立/更新使用者失敗:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#06C755] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-700 text-lg">正在處理 LINE 登入...</p>
          <p className="text-gray-500 text-sm mt-2">請稍候 ✨</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-medium text-gray-800 mb-2">登入失敗 😢</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:shadow-lg transition-all"
          >
            返回登入頁面
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default LineCallback;
