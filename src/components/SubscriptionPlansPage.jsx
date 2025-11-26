// 📋 訂閱方案頁面組件
// HealingNote - 訂閱系統

import React, { useState } from 'react';
import { X, Check, Star, Gift, Sparkles, Crown, TrendingUp } from 'lucide-react';

// ==================== 訂閱方案頁面 ====================

export const SubscriptionPlansPage = ({ 
  user,
  onClose, 
  onSelectPlan,
  hasTrial 
}) => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showFAQ, setShowFAQ] = useState(false);

  // 方案資料
  const plans = {
    trial: {
      id: 'trial',
      name: '免費體驗',
      icon: '🎁',
      price: 0,
      period: '7 天',
      features: [
        '7 天免費試用',
        '包含 1 份完整週報',
        '體驗所有功能(不含月報)',
        '隨時可升級訂閱'
      ],
      highlight: false,
      available: !hasTrial
    },
    single: {
      id: 'single',
      name: '單次解鎖',
      icon: '💡',
      description: '可試閱報告內容',
      items: [
        { name: '週報', price: 49, period: '份' },
        { name: '月報', price: 79, period: '份' }
      ],
      features: [
        '解鎖單份報告',
        '永久保存',
        '可匯出 PDF',
        '適合偶爾查看'
      ],
      highlight: false
    },
    monthly: {
      id: 'monthly',
      name: '月訂閱',
      icon: '⭐',
      price: 149,
      firstMonth: 109,
      period: '月',
      badge: '推薦',
      features: [
        '當月所有週報',
        '當月月報',
        '深度情緒分析',
        '個人化建議',
        '匯出與分享',
        '優先客服'
      ],
      highlight: true,
      savings: '首月只要 NT$ 109'
    },
    yearly: {
      id: 'yearly',
      name: '年訂閱',
      icon: '💎',
      price: 1490,
      period: '年',
      badge: '超值',
      features: [
        '月訂閱所有功能',
        '年度成長報告',
        '專屬成就徽章',
        '獨家主題包',
        '優先新功能體驗'
      ],
      highlight: false,
      savings: '比月繳優惠 NT$ 298',
      note: '相當於每月 NT$ 124'
    }
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    onSelectPlan(plan);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]">
      <div 
        className="w-full max-w-4xl rounded-3xl shadow-2xl"
  style={{ 
    background: '#FFF9F5',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column'
  }}
>
        {/* Header */}
        <div 
          className="sticky top-0 z-10 flex justify-between items-center p-6 border-b"
          style={{ 
            background: '#FFF9F5',
            borderColor: '#E8D4C4'
          }}
        >
          <div>
            <h2 className="text-2xl font-bold mb-1" style={{ color: '#5A4A42' }}>
              訂閱方案 💎
            </h2>
            <p className="text-sm" style={{ color: '#8B7A70' }}>
              選擇最適合你的方案
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={24} style={{ color: '#8B7A70' }} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {/* 主標語 */}
          <div 
            className="text-center mb-8 p-6 rounded-2xl"
            style={{ background: 'linear-gradient(135deg, #FFE4B5, #FFD700)' }}
          >
            <h3 className="text-xl font-bold mb-2" style={{ color: '#5A4A42' }}>
              解鎖所有成長報告 ✨
            </h3>
            <p className="text-sm" style={{ color: '#8B7A70' }}>
              所有週報 + 月報 + 深度分析
            </p>
          </div>

          {/* 方案卡片 */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {/* 免費體驗 */}
            {plans.trial.available && (
              <PlanCard 
                plan={plans.trial}
                selected={selectedPlan?.id === 'trial'}
                onSelect={() => handleSelectPlan(plans.trial)}
              />
            )}

            {/* 單次解鎖 */}
            <SinglePurchaseCard 
              plan={plans.single}
              onSelect={handleSelectPlan}
            />

            {/* 月訂閱 */}
            <PlanCard 
              plan={plans.monthly}
              selected={selectedPlan?.id === 'monthly'}
              onSelect={() => handleSelectPlan(plans.monthly)}
            />

            {/* 年訂閱 */}
            <PlanCard 
              plan={plans.yearly}
              selected={selectedPlan?.id === 'yearly'}
              onSelect={() => handleSelectPlan(plans.yearly)}
            />
          </div>

          {/* 為什麼需要訂閱 */}
          <div 
            className="mb-6 p-6 rounded-2xl"
            style={{ background: '#F5EDE7' }}
          >
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#5A4A42' }}>
              <Sparkles size={20} style={{ color: '#D4A373' }} />
              為什麼需要訂閱？
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <BenefitItem 
                icon="📊"
                title="自動生成報告"
                desc="每週一、每月1號自動生成"
              />
              <BenefitItem 
                icon="📈"
                title="深入了解趨勢"
                desc="看見情緒變化的軌跡"
              />
              <BenefitItem 
                icon="💡"
                title="個人化建議"
                desc="根據你的記錄給予指引"
              />
              <BenefitItem 
                icon="💾"
                title="永久保存"
                desc="所有報告隨時查看"
              />
            </div>
          </div>

          {/* FAQ */}
          <div 
            className="mb-6 p-6 rounded-2xl"
            style={{ background: '#FFFFFF', border: '1px solid #E8D4C4' }}
          >
            <button
              onClick={() => setShowFAQ(!showFAQ)}
              className="w-full flex justify-between items-center"
            >
              <h3 className="text-lg font-bold" style={{ color: '#5A4A42' }}>
                ❓ 常見問題
              </h3>
              <span style={{ color: '#8B7A70' }}>
                {showFAQ ? '▲' : '▼'}
              </span>
            </button>
            
            {showFAQ && (
              <div className="mt-4 space-y-4">
                <FAQItem 
                  q="可以隨時取消訂閱嗎？"
                  a="可以！隨時在「我的訂閱」中取消，訂閱期結束後不再扣款。"
                />
                <FAQItem 
                  q="取消後還能看已解鎖的報告嗎？"
                  a="可以！已解鎖的報告永久保留，隨時可以查看。"
                />
                <FAQItem 
                  q="免費試用會自動扣款嗎？"
                  a="不會！試用期結束後需要手動訂閱才會開始扣款。"
                />
                <FAQItem 
                  q="可以更改訂閱方案嗎？"
                  a="可以！隨時可以升級或降級方案，費用會自動調整。"
                />
              </div>
            )}
          </div>

          {/* 安全提示 */}
          <div className="text-center">
            <p className="text-xs mb-2" style={{ color: '#A89B93' }}>
              🔒 採用 SSL 加密傳輸 • 不儲存信用卡資訊 • 可隨時取消
            </p>
            <p className="text-xs" style={{ color: '#A89B93' }}>
              使用 Stripe 與 LINE Pay 安全付款
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== 方案卡片組件 ====================

const PlanCard = ({ plan, selected, onSelect }) => {
  return (
    <div
      onClick={onSelect}
      className={`relative p-6 rounded-2xl cursor-pointer transition-all ${
        selected ? 'ring-2 ring-offset-2' : 'hover:shadow-lg'
      }`}
      style={{
        background: plan.highlight 
          ? 'linear-gradient(135deg, #FFE4B5, #FFD700)'
          : '#FFFFFF',
        border: plan.highlight ? 'none' : '1px solid #E8D4C4',
        ringColor: '#D4A373'
      }}
    >
      {/* 推薦標籤 */}
      {plan.badge && (
        <div 
          className="absolute -top-3 -right-3 px-3 py-1 rounded-full text-xs font-bold text-white"
          style={{ background: 'linear-gradient(to right, #C9A386, #D4A373)' }}
        >
          {plan.badge}
        </div>
      )}

      {/* 圖示與名稱 */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{plan.icon}</span>
        <div>
          <h3 className="text-xl font-bold" style={{ color: '#5A4A42' }}>
            {plan.name}
          </h3>
          {plan.description && (
            <p className="text-xs" style={{ color: '#8B7A70' }}>
              {plan.description}
            </p>
          )}
        </div>
      </div>

      {/* 價格 */}
      <div className="mb-4">
        {plan.price === 0 ? (
          <div>
            <span className="text-3xl font-bold" style={{ color: '#4ADE80' }}>
              免費
            </span>
            <span className="text-sm ml-2" style={{ color: '#8B7A70' }}>
              {plan.period}
            </span>
          </div>
        ) : (
          <div>
            {plan.firstMonth && (
              <div className="mb-1">
                <span className="text-sm line-through" style={{ color: '#A89B93' }}>
                  NT$ {plan.price}
                </span>
                <span className="ml-2 text-xs font-medium px-2 py-1 rounded" 
                  style={{ background: '#4ADE80', color: 'white' }}>
                  首月優惠
                </span>
              </div>
            )}
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold" style={{ color: '#5A4A42' }}>
                NT$ {plan.firstMonth || plan.price}
              </span>
              <span className="text-sm" style={{ color: '#8B7A70' }}>
                /{plan.period}
              </span>
            </div>
          </div>
        )}
        
        {plan.savings && (
          <p className="text-sm mt-1 font-medium" style={{ color: '#D4A373' }}>
            {plan.savings}
          </p>
        )}
        {plan.note && (
          <p className="text-xs mt-1" style={{ color: '#8B7A70' }}>
            {plan.note}
          </p>
        )}
      </div>

      {/* 功能列表 */}
      <ul className="space-y-2 mb-4">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2 text-sm">
            <Check size={16} className="mt-0.5 flex-shrink-0" style={{ color: '#4ADE80' }} />
            <span style={{ color: '#5A4A42' }}>{feature}</span>
          </li>
        ))}
      </ul>

      {/* 選擇按鈕 */}
      <button
        className={`w-full py-3 rounded-xl font-medium transition-all ${
          selected ? 'ring-2 ring-offset-2' : 'hover:shadow-lg'
        }`}
        style={{
          background: selected 
            ? 'linear-gradient(to right, #C9A386, #D4A373)'
            : plan.highlight
              ? 'linear-gradient(to right, #C9A386, #D4A373)'
              : '#F5EDE7',
          color: selected || plan.highlight ? 'white' : '#5A4A42',
          ringColor: '#D4A373'
        }}
      >
        {selected ? '已選擇 ✓' : plan.available === false ? '已使用' : '選擇方案'}
      </button>
    </div>
  );
};

// ==================== 單次購買卡片 ====================

const SinglePurchaseCard = ({ plan, onSelect }) => {
  return (
    <div
      className="p-6 rounded-2xl"
      style={{ background: '#FFFFFF', border: '1px solid #E8D4C4' }}
    >
      {/* 圖示與名稱 */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{plan.icon}</span>
        <div>
          <h3 className="text-xl font-bold" style={{ color: '#5A4A42' }}>
            {plan.name}
          </h3>
          <p className="text-xs" style={{ color: '#8B7A70' }}>
            {plan.description}
          </p>
        </div>
      </div>

      {/* 選項 */}
      <div className="space-y-3 mb-4">
        {plan.items.map((item, index) => (
          <button
            key={index}
            onClick={() => onSelect({ ...plan, selectedItem: item })}
            className="w-full p-3 rounded-xl flex justify-between items-center transition-all hover:shadow-md"
            style={{ background: '#F5EDE7' }}
          >
            <div className="flex items-center gap-2">
              <Check size={16} style={{ color: '#4ADE80' }} />
              <span className="font-medium" style={{ color: '#5A4A42' }}>
                解鎖一份{item.name}
              </span>
            </div>
            <span className="font-bold" style={{ color: '#D4A373' }}>
              NT$ {item.price}
            </span>
          </button>
        ))}
      </div>

      {/* 功能說明 */}
      <ul className="space-y-2 text-xs" style={{ color: '#8B7A70' }}>
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            <span>•</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

// ==================== 好處項目 ====================

const BenefitItem = ({ icon, title, desc }) => {
  return (
    <div className="flex gap-3">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="font-medium mb-1" style={{ color: '#5A4A42' }}>
          {title}
        </p>
        <p className="text-xs" style={{ color: '#8B7A70' }}>
          {desc}
        </p>
      </div>
    </div>
  );
};

// ==================== FAQ 項目 ====================

const FAQItem = ({ q, a }) => {
  return (
    <div>
      <p className="font-medium mb-1 text-sm" style={{ color: '#5A4A42' }}>
        Q: {q}
      </p>
      <p className="text-sm" style={{ color: '#8B7A70' }}>
        A: {a}
      </p>
    </div>
  );
};

export default SubscriptionPlansPage;
