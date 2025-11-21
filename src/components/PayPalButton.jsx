// 💳 PayPal 付款流程組件
// HealingNote - 訂閱付費系統

import React, { useState } from 'react';
import { X, Check, ShieldCheck, CreditCard, Globe, Lock } from 'lucide-react';

// ==================== 付款確認頁面 ====================

export const PaymentConfirmationModal = ({ 
  plan, 
  onConfirm, 
  onClose 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    setIsProcessing(true);
    await onConfirm(plan);
  };

  // 方案資訊
  const getPlanInfo = () => {
    if (plan.id === 'single') {
      return {
        name: `單次解鎖${plan.selectedItem?.name}`,
        price: plan.selectedItem?.price,
        description: '一次性付款，永久保存'
      };
    }
    
    if (plan.id === 'monthly') {
      return {
        name: '月訂閱',
        price: plan.firstMonth || plan.price,
        originalPrice: plan.price,
        period: '月',
        description: '無限查看週報和月報',
        savings: plan.savings
      };
    }
    
    if (plan.id === 'yearly') {
      return {
        name: '年訂閱',
        price: plan.price,
        period: '年',
        description: '最划算的選擇',
        savings: plan.savings,
        note: plan.note
      };
    }
  };

  const planInfo = getPlanInfo();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div 
        className="w-full max-w-md rounded-3xl shadow-2xl"
        style={{ 
          background: '#FFF9F5',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div 
          className="flex justify-between items-center p-6 border-b"
          style={{ borderColor: '#E8D4C4' }}
        >
          <h2 className="text-2xl font-bold" style={{ color: '#5A4A42' }}>
            確認訂閱方案
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={24} style={{ color: '#8B7A70' }} />
          </button>
        </div>

        {/* Content - 可滾動 */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* 方案資訊 */}
          <div 
            className="mb-6 p-4 rounded-xl" 
            style={{ background: '#F5EDE7' }}
          >
            <p className="text-sm mb-1" style={{ color: '#8B7A70' }}>
              訂閱方案：
            </p>
            <div className="flex items-baseline gap-2 mb-2">
              <p className="text-2xl font-bold" style={{ color: '#5A4A42' }}>
                {planInfo.name}
              </p>
              {planInfo.period && (
                <span className="text-sm" style={{ color: '#8B7A70' }}>
                  / {planInfo.period}
                </span>
              )}
            </div>
            
            {planInfo.originalPrice && (
              <p className="text-sm line-through mb-1" style={{ color: '#A89B93' }}>
                原價 NT$ {planInfo.originalPrice}
              </p>
            )}
            
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-bold" style={{ color: '#D4A373' }}>
                NT$ {planInfo.price}
              </span>
            </div>

            {planInfo.savings && (
              <p className="text-sm font-medium mb-2" style={{ color: '#22C55E' }}>
                🎉 {planInfo.savings}
              </p>
            )}

            <p className="text-xs" style={{ color: '#8B7A70' }}>
              {planInfo.description}
            </p>

            {planInfo.note && (
              <p className="text-xs mt-2" style={{ color: '#A89B93' }}>
                💡 {planInfo.note}
              </p>
            )}
          </div>

          {/* PayPal 信任說明區塊 - 重點！ */}
          <div 
            className="mb-6 p-4 rounded-xl border-2" 
            style={{ 
              background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
              borderColor: '#3B82F6'
            }}
          >
            <div className="flex items-start gap-3 mb-4">
              <div 
                className="p-2 rounded-lg"
                style={{ background: '#3B82F6' }}
              >
                <ShieldCheck size={24} color="white" />
              </div>
              <div>
                <p className="font-bold mb-1" style={{ color: '#1E40AF' }}>
                  使用 PayPal 安全付款
                </p>
                <p className="text-xs leading-relaxed" style={{ color: '#3B82F6' }}>
                  PayPal 是全球最大的線上支付平台<br/>
                  服務超過 4 億用戶，安全可靠
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Check size={18} className="flex-shrink-0 mt-0.5" style={{ color: '#22C55E' }} />
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: '#1E40AF' }}>
                    不需要 PayPal 帳戶
                  </p>
                  <p className="text-xs" style={{ color: '#3B82F6' }}>
                    可直接使用信用卡付款
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Check size={18} className="flex-shrink-0 mt-0.5" style={{ color: '#22C55E' }} />
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: '#1E40AF' }}>
                    國際級加密技術
                  </p>
                  <p className="text-xs" style={{ color: '#3B82F6' }}>
                    您的信用卡資訊由 PayPal 加密保護
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Check size={18} className="flex-shrink-0 mt-0.5" style={{ color: '#22C55E' }} />
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: '#1E40AF' }}>
                    不儲存您的卡號
                  </p>
                  <p className="text-xs" style={{ color: '#3B82F6' }}>
                    HealingNote 不會看到您的信用卡資訊
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Check size={18} className="flex-shrink-0 mt-0.5" style={{ color: '#22C55E' }} />
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: '#1E40AF' }}>
                    買家保護計劃
                  </p>
                  <p className="text-xs" style={{ color: '#3B82F6' }}>
                    付款有問題可聯繫 PayPal 客服協助
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 付款流程說明 */}
          <div 
            className="mb-6 p-4 rounded-xl" 
            style={{ background: '#FFF9F5', border: '1px solid #E8D4C4' }}
          >
            <p className="text-sm font-medium mb-3 flex items-center gap-2" 
              style={{ color: '#5A4A42' }}>
              <CreditCard size={18} style={{ color: '#D4A373' }} />
              付款流程
            </p>
            <ol className="text-xs space-y-2" style={{ color: '#8B7A70' }}>
              <li className="flex gap-2">
                <span className="font-bold" style={{ color: '#D4A373' }}>1.</span>
                <span>點擊下方按鈕，跳轉到 PayPal 安全付款頁面</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold" style={{ color: '#D4A373' }}>2.</span>
                <span>選擇「<strong>使用信用卡或金融卡</strong>」（不需註冊）</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold" style={{ color: '#D4A373' }}>3.</span>
                <span>輸入您的信用卡資訊</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold" style={{ color: '#D4A373' }}>4.</span>
                <span>完成付款後自動返回，立即解鎖功能！</span>
              </li>
            </ol>
          </div>

          {/* 支援的卡別 */}
          <div 
            className="mb-6 p-4 rounded-xl text-center" 
            style={{ background: '#F5EDE7' }}
          >
            <p className="text-xs mb-3" style={{ color: '#8B7A70' }}>
              💳 支援的付款方式
            </p>
            <div className="flex justify-center gap-3 mb-2">
              <div className="px-4 py-2 rounded-lg font-bold" 
                style={{ background: 'white', color: '#1A1F71' }}>
                VISA
              </div>
              <div className="px-4 py-2 rounded-lg font-bold" 
                style={{ background: 'white', color: '#EB001B' }}>
                Mastercard
              </div>
              <div className="px-4 py-2 rounded-lg font-bold" 
                style={{ background: 'white', color: '#0E4C96' }}>
                JCB
              </div>
            </div>
          </div>

          {/* 付款按鈕 */}
          <button
            onClick={handleConfirm}
            disabled={isProcessing}
            className="w-full py-4 rounded-2xl font-bold text-lg text-white transition-all hover:shadow-xl mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(to right, #0070BA, #003087)' }}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                處理中...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Lock size={20} />
                前往 PayPal 安全付款
              </span>
            )}
          </button>

          {/* 信任標章 */}
          <div className="text-center mb-4">
            <p className="text-xs mb-2 flex items-center justify-center gap-2" 
              style={{ color: '#A89B93' }}>
              <Globe size={14} />
              PayPal 已為全球 4 億用戶提供服務
            </p>
            <p className="text-xs flex items-center justify-center gap-2" 
              style={{ color: '#A89B93' }}>
              <Lock size={14} />
              採用 SSL 256-bit 加密 • 通過 PCI DSS 認證
            </p>
          </div>

          {/* 取消按鈕 */}
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="w-full py-2 text-sm disabled:opacity-50"
            style={{ color: '#8B7A70' }}
          >
            暫時不訂閱
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== 付款處理中頁面 ====================

export const PaymentProcessingModal = () => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div 
        className="w-full max-w-sm rounded-3xl shadow-2xl p-8 text-center" 
        style={{ background: '#FFF9F5' }}
      >
        <div className="mb-6">
          <div 
            className="w-20 h-20 border-4 rounded-full mx-auto animate-spin"
            style={{ 
              borderColor: '#E8D4C4',
              borderTopColor: '#0070BA'
            }}
          />
        </div>

        <h3 className="text-xl font-bold mb-4" style={{ color: '#5A4A42' }}>
          正在前往 PayPal 付款頁面
        </h3>

        <div 
          className="mb-6 p-4 rounded-xl" 
          style={{ background: '#EFF6FF' }}
        >
          <p className="text-sm mb-3 font-medium" style={{ color: '#3B82F6' }}>
            💡 溫馨提醒
          </p>
          <div className="text-xs text-left space-y-2" style={{ color: '#1E40AF' }}>
            <p>• 請在 PayPal 頁面選擇<br/>
            「<strong>使用信用卡或金融卡</strong>」</p>
            <p>• 不需要註冊 PayPal 帳戶</p>
            <p>• 付款完成後會自動返回 HealingNote</p>
          </div>
        </div>

        <p className="text-xs flex items-center justify-center gap-2" 
          style={{ color: '#A89B93' }}>
          <Lock size={14} />
          您的付款資訊由 PayPal 加密保護
        </p>
      </div>
    </div>
  );
};

// ==================== 付款成功頁面 ====================

export const PaymentSuccessModal = ({ 
  plan, 
  onClose,
  nextBillingDate 
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div 
        className="w-full max-w-md rounded-3xl shadow-2xl p-8 text-center" 
        style={{ background: '#FFF9F5' }}
      >
        <span className="text-6xl mb-4 block">🎉</span>
        
        <h2 className="text-2xl font-bold mb-4" style={{ color: '#5A4A42' }}>
          {plan.id === 'single' ? '解鎖成功！' : '訂閱成功！'}
        </h2>

        <div 
          className="mb-6 p-4 rounded-xl" 
          style={{ background: '#F0FDF4' }}
        >
          <p className="text-sm mb-2" style={{ color: '#15803D' }}>
            ✅ {plan.id === 'single' 
              ? `已成功解鎖${plan.selectedItem?.name}` 
              : `已成功訂閱${plan.name}`}
          </p>
          <p className="text-xs" style={{ color: '#16A34A' }}>
            {plan.id === 'single' 
              ? '報告已永久保存，隨時可以查看！'
              : '您現在可以無限查看所有週報和月報了！'}
          </p>
        </div>

        {plan.id !== 'single' && (
          <div 
            className="mb-6 p-4 rounded-xl" 
            style={{ background: '#EFF6FF' }}
          >
            <p className="text-xs mb-2" style={{ color: '#3B82F6' }}>
              📧 訂閱確認信已發送至您的 Email
            </p>
            {nextBillingDate && (
              <p className="text-xs" style={{ color: '#3B82F6' }}>
                🔄 下次扣款日期：{nextBillingDate}
              </p>
            )}
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-4 rounded-2xl font-bold text-lg text-white transition-all hover:shadow-xl"
          style={{ background: 'linear-gradient(to right, #C9A386, #D4A373)' }}
        >
          開始使用 ✨
        </button>

        {plan.id !== 'single' && (
          <p className="text-xs mt-4" style={{ color: '#A89B93' }}>
            可隨時在「我的訂閱」中管理或取消
          </p>
        )}
      </div>
    </div>
  );
};

// ==================== 付款失敗頁面 ====================

export const PaymentErrorModal = ({ 
  error, 
  onRetry, 
  onClose 
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div 
        className="w-full max-w-md rounded-3xl shadow-2xl p-8 text-center" 
        style={{ background: '#FFF9F5' }}
      >
        <span className="text-5xl mb-4 block">😔</span>
        
        <h3 className="text-xl font-bold mb-4" style={{ color: '#5A4A42' }}>
          付款未完成
        </h3>

        <p className="text-sm mb-6" style={{ color: '#8B7A70' }}>
          {error || '付款過程中發生問題，請稍後再試'}
        </p>

        <button
          onClick={onRetry}
          className="w-full py-3 rounded-2xl font-medium text-white mb-3 transition-all hover:shadow-lg"
          style={{ background: 'linear-gradient(to right, #C9A386, #D4A373)' }}
        >
          重新付款
        </button>

        <button
          onClick={onClose}
          className="w-full py-2 text-sm"
          style={{ color: '#8B7A70' }}
        >
          返回
        </button>

        <div 
          className="mt-6 p-4 rounded-xl" 
          style={{ background: '#FEF3C7' }}
        >
          <p className="text-xs" style={{ color: '#92400E' }}>
            💡 如果持續遇到問題，請聯繫我們：<br/>
            📧 support@healingnote.com
          </p>
        </div>
      </div>
    </div>
  );
};

export default {
  PaymentConfirmationModal,
  PaymentProcessingModal,
  PaymentSuccessModal,
  PaymentErrorModal
};
