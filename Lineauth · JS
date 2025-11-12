// LINE Login 認證服務

const LINE_LOGIN_CHANNEL_ID = import.meta.env.VITE_LINE_LOGIN_CHANNEL_ID;
const LINE_LOGIN_CALLBACK_URL = import.meta.env.VITE_LINE_LOGIN_CALLBACK_URL;

/**
 * 產生 LINE Login 授權 URL
 * @param {string} state - 防 CSRF 攻擊的隨機字串
 * @returns {string} LINE Login 授權 URL
 */
export const getLineLoginUrl = (state) => {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: LINE_LOGIN_CHANNEL_ID,
    redirect_uri: LINE_LOGIN_CALLBACK_URL,
    state: state,
    scope: 'profile openid email',
  });

  return `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;
};

/**
 * 使用授權碼交換 Access Token
 * @param {string} code - LINE 回傳的授權碼
 * @returns {Promise<Object>} Access Token 資訊
 */
export const getLineAccessToken = async (code) => {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: LINE_LOGIN_CALLBACK_URL,
    client_id: LINE_LOGIN_CHANNEL_ID,
    client_secret: import.meta.env.VITE_LINE_LOGIN_CHANNEL_SECRET,
  });

  const response = await fetch('https://api.line.me/oauth2/v2.1/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error('Failed to get LINE access token');
  }

  return await response.json();
};

/**
 * 使用 Access Token 取得使用者資料
 * @param {string} accessToken - LINE Access Token
 * @returns {Promise<Object>} 使用者資料
 */
export const getLineProfile = async (accessToken) => {
  const response = await fetch('https://api.line.me/v2/profile', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get LINE profile');
  }

  return await response.json();
};

/**
 * 驗證 ID Token (額外的安全檢查)
 * @param {string} idToken - LINE ID Token
 * @returns {Promise<Object>} 驗證後的使用者資訊
 */
export const verifyIdToken = async (idToken) => {
  const params = new URLSearchParams({
    id_token: idToken,
    client_id: LINE_LOGIN_CHANNEL_ID,
  });

  const response = await fetch('https://api.line.me/oauth2/v2.1/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error('Failed to verify ID token');
  }

  return await response.json();
};

/**
 * 產生隨機 state 字串 (防 CSRF)
 * @returns {string} 隨機字串
 */
export const generateState = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

/**
 * 儲存 state 到 sessionStorage
 * @param {string} state - state 字串
 */
export const saveState = (state) => {
  sessionStorage.setItem('line_login_state', state);
};

/**
 * 驗證 state 是否正確
 * @param {string} state - 要驗證的 state
 * @returns {boolean} 是否正確
 */
export const verifyState = (state) => {
  const savedState = sessionStorage.getItem('line_login_state');
  sessionStorage.removeItem('line_login_state');
  return savedState === state;
};
