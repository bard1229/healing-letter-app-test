// 💳 簡化版 PayPal 付款按鈕
// 不需要安裝 npm 套件，直接跳轉 PayPal

import React from 'react';

// PayPal 設定
const PAYPAL_ENV = 'sandbox'; // 測試環境，正式上線改為 'live'
const PAYPAL_CLIENT_ID = 'AVw3m5Z7OBkzKxOZAzo8e2a0arOD02GQHAT83FdwjOXqbPyeS4r10RxZnar5ocRb4umn9w9gV3vDEKoQ';

// ==================== PayPal 付款 URL 生成 ====================

export const generatePayPalURL = (plan) => {
  const baseURL = PAYPAL_ENV === 'sandbox' 
    ? 'https://www.sandbox.paypal.com'
    : 'https://www.paypal.com';

  // 當前網站 URL（用於返回）
  const returnURL = encodeURIComponent(`${window.location.origin}?payment=success`);
  const cancelURL = encodeURIComponent(`${window.location.origin}?payment=cancel`);

  // 單次付款
  if (plan.id === 'single') {
    const amount = plan.selectedItem.price;
    const itemName = encodeURIComponent(`HealingNote - ${plan.selectedItem.name}`);
    
    return `${baseURL}/cgi-bin/webscr?cmd=_xclick&business=${PAYPAL_CLIENT_ID}&item_name=${itemName}&amount=${amount}&currency_code=TWD&return=${returnURL}&cancel_return=${cancelURL}&no_shipping=1`;
  }

  // 訂閱付款（月/年）
  // 注意：訂閱需要在 PayPal 建立 Plan，這裡先用單次付款模擬
  const amount = plan.firstMonth || plan.price;
  const itemName = encodeURIComponent(`HealingNote - ${plan.name}`);
  
  return `${baseURL}/cgi-bin/webscr?cmd=_xclick&business=${PAYPAL_CLIENT_ID}&item_name=${itemName}&amount=${amount}&currency_code=TWD&return=${returnURL}&cancel_return=${cancelURL}&no_shipping=1`;
};

// ==================== 跳轉到 PayPal ====================

export const redirectToPayPal = (plan) => {
  const paypalURL = generatePayPalURL(plan);
  console.log('跳轉到 PayPal:', paypalURL);
  window.location.href = paypalURL;
};

// ==================== PayPal 按鈕組件 ====================

export const PayPalButton = ({ plan, onSuccess, onError }) => {
  const handleClick = () => {
    try {
      redirectToPayPal(plan);
    } catch (error) {
      console.error('PayPal 跳轉失敗:', error);
      if (onError) {
        onError(error);
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      className="w-full py-4 rounded-2xl font-bold text-lg text-white transition-all hover:shadow-xl"
      style={{ background: 'linear-gradient(to right, #0070BA, #003087)' }}
    >
      前往 PayPal 安全付款 🔒
    </button>
  );
};

// ==================== 處理 PayPal 回調 ====================

export const handlePayPalCallback = (onSuccess, onCancel) => {
  const urlParams = new URLSearchParams(window.location.search);
  const paymentStatus = urlParams.get('payment');
  
  if (paymentStatus === 'success') {
    // 付款成功
    const txnId = urlParams.get('tx'); // PayPal 交易 ID
    const amount = urlParams.get('amt');
    const currency = urlParams.get('cc');
    
    console.log('付款成功！', { txnId, amount, currency });
    
    if (onSuccess) {
      onSuccess({
        transactionId: txnId,
        amount: amount,
        currency: currency,
        status: 'completed'
      });
    }
    
    // 清除 URL 參數
    window.history.replaceState({}, '', window.location.pathname);
    
  } else if (paymentStatus === 'cancel') {
    // 付款取消
    console.log('付款已取消');
    
    if (onCancel) {
      onCancel();
    }
    
    // 清除 URL 參數
    window.history.replaceState({}, '', window.location.pathname);
  }
};

// default export
export default {
  generatePayPalURL,
  redirectToPayPal,
  PayPalButton,
  handlePayPalCallback
};
