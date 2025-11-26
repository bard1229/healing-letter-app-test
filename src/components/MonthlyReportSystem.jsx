// 🎯 月報系統 - 完整實作
// 複製自週報系統，改為月報版本

import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Calendar, Heart, Sparkles } from 'lucide-react';

// ==================== 工具函數 ====================

// 格式化月份範圍
const formatMonthRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return `${start.getFullYear()}/${(start.getMonth() + 1).toString().padStart(2, '0')}/${start.getDate().toString().padStart(2, '0')} - ${end.getMonth() + 1}/${end.getDate()}`;
};

// 計算本月已記錄天數
const getThisMonthDays = (letters) => {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  firstDay.setHours(0, 0, 0, 0);
  
  return letters.filter(letter => {
    const letterDate = letter.date?.toDate ? letter.date.toDate() : new Date(letter.createdAt?.seconds * 1000);
    return letterDate >= firstDay;
  }).length;
};

// ==================== 測試資料 ====================

const createTestMonthlyReports = () => [
  {
    id: 'month_2025_11',
    month: 11,
    year: 2025,
    monthStart: '2025-11-01',
    monthEnd: '2025-11-30',
    totalDiaries: 15,
    status: 'pending', // pending / claimed / paid
    generatedAt: new Date().toISOString(),
    content: {
      overview: '本月你記錄了15天的心情，相當用心！從月初的期待到月末的成長，能看到你一步步在進步。\n\n整個月份下來，你展現了很好的自我覺察能力。有壓力時會記錄，開心時也不忘記錄，這種持續的自我對話很珍貴。特別是月中那幾天，雖然遇到挑戰，但你都一一記錄下來，這本身就是一種勇氣。\n\n持續記錄會幫助你更了解自己的情緒模式，也能在回顧時看到自己的成長軌跡。',
      suggestions: [
        '本月展現了很好的堅持，15天的記錄值得鼓勵！',
        '情緒變化有一定規律，可以觀察是否與週間/週末有關',
        '建議可以在記錄時加入當天的重要事件，方便日後回顧'
      ],
      highlights: {
        mostFrequent: { emotion: '平靜', emoji: '😌', count: 6 },
        moodStability: '穩定向上',
        growth: '+25%'
      },
      encouragement: '一個月的堅持不容易！看到你持續記錄心情，真的很感動。\n\n每一次的書寫都是在陪伴自己，都是在照顧自己的情緒健康。15天的記錄代表你有一半的日子都在關注自己的內心，這已經很棒了！\n\n下個月繼續加油！不用給自己壓力，保持這個節奏就很好。記住，我都在這裡陪伴你 💖'
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
    generatedAt: '2025-11-01T08:00:00.000Z',
    content: {
      overview: '10月你記錄了12天的心情，從秋天的開始到萬聖節，每個階段都有你的足跡。',
      suggestions: [
        '月初的調適做得很好',
        '中旬有些波動，但都成功度過',
        '月底的正向情緒值得保持'
      ],
      highlights: {
        mostFrequent: { emotion: '開心', emoji: '😊', count: 5 },
        moodStability: '穩定',
        growth: '+18%'
      },
      encouragement: '10月的記錄很棒！看到你在季節轉換中依然保持記錄的習慣，真的不容易。繼續加油！'
    }
  }
];

// ==================== 月報提示卡片 ====================

export const MonthlyReportCard = ({ letters, onViewReports }) => {
  const thisMonthDays = getThisMonthDays(letters);
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const percentage = Math.round((thisMonthDays / daysInMonth) * 100);

  return (
    <div 
      className="mb-6 p-6 rounded-3xl shadow-lg"
      style={{ background: '#F5EDE7' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📈</span>
          <h3 className="text-lg font-bold" style={{ color: '#5A4A42' }}>
            本月情緒記錄
          </h3>
        </div>
        <span className="text-sm font-medium" style={{ color: '#8B7A70' }}>
          {thisMonthDays} / {daysInMonth} 天
        </span>
      </div>
      
      {/* 進度條 */}
<div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
  <div 
    className="h-full rounded-full transition-all"
    style={{ 
      width: `${Math.min(percentage, 100)}%`,  // ← 加 Math.min 限制最大 100%
      background: 'linear-gradient(to right, #C9A386, #D4A373)'
    }}
  />
</div>
      
      <p className="text-sm mb-4" style={{ color: '#8B7A70' }}>
        💡 每月 1 號早上 8:00 會生成上月的成長報告
      </p>
      
      {/* 查看報告按鈕 */}
      <button
        onClick={onViewReports}
        className="w-full py-3 rounded-2xl font-medium transition-all hover:shadow-lg"
        style={{
          background: 'linear-gradient(to right, #C9A386, #D4A373)',
          color: 'white'
        }}
      >
        查看月報記錄 ✨
      </button>
    </div>
  );
};

// ==================== 月報列表項目 ====================

const MonthlyReportListItem = ({ report, index, onView }) => {
  const getStatusBadge = () => {
    switch (report.status) {
      case 'pending':
        return { text: '未領取', color: '#FFD700', textColor: '#5A4A42' };
      case 'claimed':
        return { text: '已領取', color: '#4ADE80', textColor: 'white' };
      case 'paid':
        return { text: '已解鎖', color: '#3B82F6', textColor: 'white' };
      default:
        return { text: '', color: '', textColor: '' };
    }
  };

  const badge = getStatusBadge();
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

  return (
    <div 
      onClick={() => onView(report)}
      className="p-6 rounded-2xl cursor-pointer transition-all hover:shadow-lg"
      style={{ background: '#FFF9F5', border: '2px solid #E8D4C4' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📈</span>
          <div>
            <h3 className="font-bold text-lg" style={{ color: '#5A4A42' }}>
              {report.year} 年 {monthNames[report.month - 1]}
            </h3>
            <p className="text-sm" style={{ color: '#8B7A70' }}>
              {formatMonthRange(report.monthStart, report.monthEnd)}
            </p>
          </div>
        </div>
        <span 
          className="px-4 py-2 rounded-full text-sm font-medium"
          style={{ background: badge.color, color: badge.textColor }}
        >
          {badge.text}
        </span>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4">
          <span className="text-sm" style={{ color: '#8B7A70' }}>
            📝 {report.totalDiaries} 天記錄
          </span>
          <span className="text-sm" style={{ color: '#8B7A70' }}>
            {report.content.highlights.mostFrequent.emoji} {report.content.highlights.mostFrequent.emotion}最常見
          </span>
        </div>
        <span className="text-sm font-medium" style={{ color: '#C9A386' }}>
          點擊查看 →
        </span>
      </div>
    </div>
  );
};

// ==================== 月報列表頁面 ====================

export const MonthlyReportsPage = ({ monthlyReports, onClose, onViewReport, onShowSubscription }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div 
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl shadow-2xl"
        style={{ background: '#FFF9F5' }}
      >
        {/* Header */}
        <div 
          className="sticky top-0 z-10 flex justify-between items-center p-6 border-b"
          style={{ 
            background: '#FFF9F5',
            borderColor: '#E8D4C4'
          }}
        >
          <h2 className="text-2xl font-bold" style={{ color: '#5A4A42' }}>
            月報記錄 📈
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={24} style={{ color: '#8B7A70' }} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* 月報列表 */}
          {monthlyReports.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">📈</span>
              <p className="text-lg mb-2" style={{ color: '#8B7A70' }}>
                還沒有月報喔!
              </p>
              <p className="text-sm" style={{ color: '#A89B93' }}>
                每月 1 號早上 8:00 會自動生成
              </p>
            </div>
          ) : (
            monthlyReports.map((report, index) => (
              <MonthlyReportListItem
                key={report.id}
                report={report}
                index={monthlyReports.length - index}
                onView={() => onViewReport(report)}
              />
            ))
          )}

          {/* 訂閱方案卡片 */}
          <div 
            className="mt-6 p-6 rounded-2xl"
            style={{ 
              background: 'linear-gradient(135deg, #FFE4B5, #FFD700)'
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">💎</span>
              <h3 className="font-bold text-lg" style={{ color: '#5A4A42' }}>
                升級訂閱方案
              </h3>
            </div>
            <p className="text-sm mb-4" style={{ color: '#5A4A42' }}>
              訂閱後可無限查看所有月報，深入了解自己的成長軌跡！
            </p>
            <button
              onClick={onShowSubscription}
              className="w-full py-3 rounded-xl font-medium transition-all hover:shadow-lg"
              style={{ background: '#5A4A42', color: 'white' }}
            >
              查看方案 ✨
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== 月報詳細頁面 ====================

export const MonthlyReportDetailPage = ({ report, onClose, onClaim, onUnlock }) => {
  if (!report) return null;

  // 已付費：顯示完整內容
  if (report.status === 'paid') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div 
          className="w-full max-w-3xl my-8 rounded-3xl shadow-2xl"
          style={{ background: '#FFF9F5' }}
        >
          {/* Header */}
          <div 
            className="sticky top-0 z-10 flex justify-between items-center p-6 border-b"
            style={{ background: '#FFF9F5', borderColor: '#E8D4C4' }}
          >
            <div>
              <h2 className="text-2xl font-bold mb-1" style={{ color: '#5A4A42' }}>
                {report.year} 年 {report.month} 月成長報告
              </h2>
              <p className="text-sm" style={{ color: '#8B7A70' }}>
                {formatMonthRange(report.monthStart, report.monthEnd)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={24} style={{ color: '#8B7A70' }} />
            </button>
          </div>

          {/* Content */}
          <div className="p-8 space-y-8">
            {/* 整體回顧 */}
            <section>
              <h3 
                className="text-lg font-bold mb-3 flex items-center gap-2"
                style={{ color: '#5A4A42' }}
              >
                <Heart size={20} style={{ color: '#D4A373' }} />
                本月回顧
              </h3>
              <div 
                className="p-6 rounded-xl"
                style={{ background: 'linear-gradient(135deg, #FFF9F5, #F5EDE7)' }}
              >
                <p className="text-base leading-relaxed whitespace-pre-wrap" style={{ color: '#5A4A42' }}>
                  {report.content.overview}
                </p>
              </div>
            </section>

            <div style={{ height: '1px', background: '#E8D4C4' }} />

            {/* 發現與建議 */}
            <section>
              <h3 
                className="text-lg font-bold mb-3 flex items-center gap-2"
                style={{ color: '#5A4A42' }}
              >
                <Sparkles size={20} style={{ color: '#D4A373' }} />
                發現與建議
              </h3>
              <ul className="space-y-3">
                {report.content.suggestions.map((suggestion, index) => (
                  <li 
                    key={index}
                    className="p-4 rounded-xl flex items-start gap-3"
                    style={{ background: '#F5EDE7' }}
                  >
                    <span style={{ color: '#D4A373' }}>•</span>
                    <span className="text-base" style={{ color: '#5A4A42' }}>
                      {suggestion}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <div style={{ height: '1px', background: '#E8D4C4' }} />

            {/* 情緒亮點 */}
            <section>
              <h3 
                className="text-lg font-bold mb-3 flex items-center gap-2"
                style={{ color: '#5A4A42' }}
              >
                <TrendingUp size={20} style={{ color: '#D4A373' }} />
                本月亮點
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div 
                  className="p-4 rounded-xl text-center"
                  style={{ background: '#F5EDE7' }}
                >
                  <p className="text-sm mb-1" style={{ color: '#8B7A70' }}>
                    最常見情緒:
                  </p>
                  <p className="text-2xl mb-1">
                    {report.content.highlights.mostFrequent.emoji}
                  </p>
                  <p className="text-base font-medium" style={{ color: '#5A4A42' }}>
                    {report.content.highlights.mostFrequent.emotion}
                  </p>
                </div>
                <div 
                  className="p-4 rounded-xl text-center"
                  style={{ background: '#F5EDE7' }}
                >
                  <p className="text-sm mb-1" style={{ color: '#8B7A70' }}>
                    情緒穩定度:
                  </p>
                  <p className="text-base font-medium mt-3" style={{ color: '#5A4A42' }}>
                    {report.content.highlights.moodStability}
                  </p>
                </div>
                <div 
                  className="p-4 rounded-xl text-center"
                  style={{ background: '#F5EDE7' }}
                >
                  <p className="text-sm mb-1" style={{ color: '#8B7A70' }}>
                    本月成長:
                  </p>
                  <p className="text-base font-medium mt-3" style={{ color: '#4ADE80' }}>
                    {report.content.highlights.growth}
                  </p>
                </div>
              </div>
            </section>

            <div style={{ height: '1px', background: '#E8D4C4' }} />

            {/* 成長軌跡 */}
            <section>
              <h3 
                className="text-lg font-bold mb-3 flex items-center gap-2"
                style={{ color: '#5A4A42' }}
              >
                <Calendar size={20} style={{ color: '#D4A373' }} />
                給你的話
              </h3>
              <div 
                className="p-6 rounded-xl"
                style={{ background: 'linear-gradient(135deg, #FFF9F5, #F5EDE7)' }}
              >
                <p className="text-base leading-relaxed whitespace-pre-wrap" style={{ color: '#5A4A42' }}>
                  {report.content.encouragement}
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  // 未領取：顯示領取頁面
  if (report.status === 'pending') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div 
          className="w-full max-w-lg rounded-3xl shadow-2xl p-8"
          style={{ background: '#FFF9F5' }}
        >
          <div className="text-center">
            <span className="text-6xl mb-4 block">🎉</span>
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#5A4A42' }}>
              本月成長報告已準備好!
            </h2>
            
            <div className="mb-6 space-y-2">
              <p className="text-sm" style={{ color: '#8B7A70' }}>
                📅 統計期間:
              </p>
              <p className="text-base font-medium" style={{ color: '#5A4A42' }}>
                {formatMonthRange(report.monthStart, report.monthEnd)}
              </p>
              
              <p className="text-sm mt-4" style={{ color: '#8B7A70' }}>
                📝 本月記錄: {report.totalDiaries} 天
              </p>
            </div>

            <button
              onClick={() => onClaim(report.id)}
              className="w-full py-4 rounded-2xl font-bold text-lg text-white transition-all hover:shadow-xl mb-4"
              style={{ background: 'linear-gradient(to right, #4ADE80, #22C55E)' }}
            >
              領取本月報告 📈
            </button>

            <p className="text-xs" style={{ color: '#A89B93' }}>
              💡 解鎖後可查看完整報告
            </p>

            <button
              onClick={onClose}
              className="mt-6 text-sm"
              style={{ color: '#8B7A70' }}
            >
              稍後再說
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 已領取但未付費：顯示解鎖頁面
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div 
        className="w-full max-w-lg rounded-3xl shadow-2xl p-8"
        style={{ background: '#FFF9F5' }}
      >
        <div className="text-center">
          <span className="text-6xl mb-4 block">🔒</span>
          <h2 className="text-2xl font-bold mb-6" style={{ color: '#5A4A42' }}>
            解鎖查看月報
          </h2>
          
          <div className="mb-6 text-left space-y-4">
            <div>
              <p className="text-sm mb-2" style={{ color: '#8B7A70' }}>
                📅 統計期間:
              </p>
              <p className="text-base font-medium" style={{ color: '#5A4A42' }}>
                {formatMonthRange(report.monthStart, report.monthEnd)}
              </p>
            </div>

            <div>
              <p className="text-sm mb-2" style={{ color: '#8B7A70' }}>
                📊 本月統計:
              </p>
              <ul className="space-y-1 text-sm" style={{ color: '#5A4A42' }}>
                <li>• 記錄天數: {report.totalDiaries} 天</li>
                <li>• 情緒多樣性: 豐富</li>
                <li>• 記錄完整度: 高</li>
              </ul>
            </div>

            <div 
              className="p-4 rounded-xl"
              style={{ background: '#F5EDE7' }}
            >
              <p className="text-sm mb-2 font-medium" style={{ color: '#5A4A42' }}>
                💎 月報包含:
              </p>
              <ul className="space-y-1 text-sm" style={{ color: '#8B7A70' }}>
                <li>✓ 本月回顧</li>
                <li>✓ 發現與建議</li>
                <li>✓ 情緒亮點</li>
                <li>✓ 給你的話</li>
              </ul>
            </div>
          </div>

          <div className="text-center mb-4">
            <p className="text-3xl font-bold mb-2" style={{ color: '#5A4A42' }}>
              NT$ 79
            </p>
          </div>

          <button
            onClick={() => onUnlock(report.id)}
            className="w-full py-4 rounded-2xl font-bold text-lg transition-all hover:shadow-xl mb-4"
            style={{ background: '#FFD700', color: '#5A4A42' }}
          >
            解鎖查看 💳
          </button>

          <div 
            className="p-4 rounded-xl text-center"
            style={{ background: '#EFF6FF' }}
          >
            <p className="text-sm mb-2" style={{ color: '#3B82F6' }}>
              💡 或訂閱方案享無限月報!
            </p>
            <button 
              className="text-sm font-medium"
              style={{ color: '#3B82F6' }}
            >
              查看訂閱方案 →
            </button>
          </div>

          <button
            onClick={onClose}
            className="mt-6 text-sm"
            style={{ color: '#8B7A70' }}
          >
            返回
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== 測試組件 ====================

export const MonthlyReportTestPanel = ({ onCreateTestReport, isDevelopment }) => {
  if (!isDevelopment) return null;

  return (
    <div className="fixed bottom-24 right-4 z-50">
      <div 
        className="p-4 rounded-2xl shadow-2xl"
        style={{ background: '#4ADE80' }}
      >
        <p className="text-white text-xs font-bold mb-2">🧪 月報測試面板</p>
        <button
  onClick={() => {
    if (onCreateTestReport) {
      onCreateTestReport();
    }
  }}
  className="w-full py-2 px-4 rounded-xl text-sm font-medium bg-white hover:bg-gray-100 transition-all"
  style={{ color: '#4ADE80' }}
>
  建立測試月報
</button>
      </div>
    </div>
  );
};

