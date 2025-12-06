// 🎯 週報系統 - 完整實作
// 先不含付費功能,使用測試資料

import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Calendar, Heart, Sparkles } from 'lucide-react';

// ==================== 工具函數 ====================

// 格式化日期範圍
const formatWeekRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return `${start.getFullYear()}/${(start.getMonth() + 1).toString().padStart(2, '0')}/${start.getDate().toString().padStart(2, '0')} - ${end.getMonth() + 1}/${end.getDate()}`;
};

// 計算本週已記錄天數
const getThisWeekDays = (letters) => {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1);
  monday.setHours(0, 0, 0, 0);
  
  return letters.filter(letter => {
    const letterDate = letter.date?.toDate ? letter.date.toDate() : new Date(letter.createdAt?.seconds * 1000);
    return letterDate >= monday;
  }).length;
};

// ==================== 測試資料 ====================

const createTestWeeklyReports = () => [
  {
    id: 'week_2025_47',
    weekNumber: 47,
    year: 2025,
    weekStart: '2025-11-18',
    weekEnd: '2025-11-24',
    totalDiaries: 2,
    status: 'pending', // pending / claimed / paid
    generatedAt: new Date().toISOString(),
    content: {
      overview: '本週你記錄了2天的心情，從週一的期待到週三的充實，能感受到你對新開始的積極態度。雖然記錄天數不多，但每一次的書寫都是在照顧自己的心。\n\n在這兩天的記錄中，我看到你對生活充滿好奇心，願意嘗試新事物。週一的那份期待感很珍貴，它代表著你對未來保持開放的心態。週三的充實感則顯示你正在積極實踐，把想法化為行動。這種從期待到實踐的過程，就是成長的軌跡。\n\n繼續保持這份對自己的關注，每天抽出幾分鐘記錄心情，你會發現更多關於自己的美好。',
      suggestions: [
        '週一展現了對新事物的好奇心，這種開放的態度很棒！',
        '建議可以在忙碌的日子也抽出5分鐘記錄，不用寫太多',
        '試著觀察不同情境下的情緒變化'
      ],
      highlights: {
        mostFrequent: { emotion: '期待', emoji: '😊', count: 1 },
        moodStability: '穩定',
        growth: '+5%'
      },
      encouragement: '看到你開始記錄心情，真的很棒！每一次的書寫都是在更了解自己，都是在照顧自己的情緒健康。\n\n雖然這週只記錄了兩天，但這已經是一個很好的開始。記錄心情不需要完美，不需要每天都寫，重要的是你願意為自己停下來，傾聽內心的聲音。\n\n下週試著多記錄幾天吧！不用寫很多，簡單幾句話就好。你會發現，這些記錄會成為你了解自己、陪伴自己的珍貴禮物。記住，我都在這裡陪伴你成長 🥰'
    }
  },
  {
    id: 'week_2025_46',
    weekNumber: 46,
    year: 2025,
    weekStart: '2025-11-11',
    weekEnd: '2025-11-17',
    totalDiaries: 5,
    status: 'claimed', // 已領取但未付費
    generatedAt: '2025-11-18T08:00:00.000Z',
    content: {
      overview: '這週你記錄了5天的心情，從週一的忙碌到週五的輕鬆，能感受到你在工作與生活間找到了平衡。情緒的起伏都被你好好地察覺和記錄下來了。',
      suggestions: [
        '週三的突破很棒！你嘗試了新的方式處理壓力',
        '週五展現了韌性，面對困難沒有放棄',
        '建議下週可以多關注自己的需求，適時休息'
      ],
      highlights: {
        mostFrequent: { emotion: '開心', emoji: '😊', count: 3 },
        moodStability: '穩定向上',
        growth: '+15%'
      },
      encouragement: '看到你這週持續記錄，真的很棒！每一次的書寫都是在照顧自己的心。你對情緒的覺察力提升了很多！'
    }
  },
  {
    id: 'week_2025_45',
    weekNumber: 45,
    year: 2025,
    weekStart: '2025-11-04',
    weekEnd: '2025-11-10',
    totalDiaries: 6,
    status: 'paid', // 已付費,可查看
    generatedAt: '2025-11-11T08:00:00.000Z',
    paidAt: '2025-11-12T10:30:00.000Z',
    content: {
      overview: '本週你記錄了6天的心情，這是很棒的堅持！從週一的平靜到週末的愉悅，整週的情緒都維持在正向的狀態。',
      suggestions: [
        '週二面對挑戰時的冷靜很值得稱讚',
        '週四的自我照顧做得很好，繼續保持',
        '週末的放鬆很重要，給自己充電的時間'
      ],
      highlights: {
        mostFrequent: { emotion: '平靜', emoji: '😌', count: 4 },
        moodStability: '非常穩定',
        growth: '+20%'
      },
      encouragement: '這週的你很棒！不僅持續記錄，還能在忙碌中保持情緒穩定。看到你的成長真的很感動！'
    }
  }
];

// ==================== 週報提示卡片 ====================

export const WeeklyReportCard = ({ letters, onViewReports }) => {
  const thisWeekDays = getThisWeekDays(letters);
  const percentage = Math.round((thisWeekDays / 7) * 100);

  return (
    <div 
      className="mb-6 p-6 rounded-3xl shadow-lg"
      style={{ background: '#F5EDE7' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📊</span>
          <h3 className="text-lg font-bold" style={{ color: '#5A4A42' }}>
            本週情緒記錄
          </h3>
        </div>
        <span className="text-sm font-medium" style={{ color: '#8B7A70' }}>
          {thisWeekDays} / 7 天
        </span>
      </div>
      
      {/* 進度條 */}
      <div className="w-full h-3 rounded-full mb-4" style={{ background: '#E8D4C4' }}>
        <div 
          className="h-3 rounded-full transition-all duration-500"
          style={{ 
            background: 'linear-gradient(to right, #C9A386, #D4A373)',
            width: `${percentage}%`
          }}
        />
      </div>
      
      <p className="text-sm mb-4" style={{ color: '#8B7A70' }}>
        💡 每週一早上 8:00 會生成本週的情緒成長報告
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
        查看我的成長記錄 (3 次) ✨
      </button>
    </div>
  );
};

// ==================== 週報列表頁面 ====================

export const WeeklyReportsPage = ({ weeklyReports, onClose, onViewReport, onShowSubscription }) => {
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
            我的成長記錄 🌱
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={24} style={{ color: '#8B7A70' }} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* 週報列表 */}
          {weeklyReports.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">📊</span>
              <p className="text-lg mb-2" style={{ color: '#8B7A70' }}>
                還沒有週報喔!
              </p>
              <p className="text-sm" style={{ color: '#A89B93' }}>
                每週一早上 8:00 會自動生成
              </p>
            </div>
          ) : (
            weeklyReports.map((report, index) => (
              <WeeklyReportListItem
                key={report.id}
                report={report}
                index={weeklyReports.length - index}
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
                訂閱方案
              </h3>
            </div>
            <p className="text-sm mb-4" style={{ color: '#8B7A70' }}>
              無限查看所有週報 + 月報
            </p>
            <button 
  onClick={() => {
    onClose();
    if (onShowSubscription) {
      onShowSubscription();
    }
  }}
  className="w-full py-3 rounded-xl font-medium text-white transition-all hover:shadow-lg"
  style={{ background: 'linear-gradient(to right, #C9A386, #D4A373)' }}
>
  訂閱 NT$ 149/月 ⭐
</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== 週報卡片 (列表項目) ====================

const WeeklyReportListItem = ({ report, index, onView }) => {
  const getStatusBadge = () => {
    if (report.status === 'pending') {
      return (
        <span 
          className="px-3 py-1 rounded-full text-xs font-medium"
          style={{ background: '#4ADE80', color: 'white' }}
        >
          未領取
        </span>
      );
    } else if (report.status === 'claimed') {
      return (
        <span 
          className="px-3 py-1 rounded-full text-xs font-medium"
          style={{ background: '#94A3B8', color: 'white' }}
        >
          已領取
        </span>
      );
    } else {
      return (
        <span 
          className="px-3 py-1 rounded-full text-xs font-medium"
          style={{ background: '#FFD700', color: '#5A4A42' }}
        >
          已解鎖 ✨
        </span>
      );
    }
  };

  const getActionButton = () => {
    if (report.status === 'pending') {
      return (
        <button 
          onClick={() => onView()}
          className="px-6 py-2 rounded-xl text-sm font-medium text-white transition-all hover:shadow-lg"
          style={{ background: '#4ADE80' }}
        >
          領取報告 📊
        </button>
      );
    } else if (report.status === 'claimed') {
      return (
        <button 
  onClick={() => onView({
    action: 'unlock',
    plan: {
      id: 'single',
      name: '單次解鎖',
      price: 49,
      reportType: 'weekly',
      reportId: report.id  // ← 傳遞報告 ID
    }
  })}
  className="..."
  style={{ background: '#FFD700', color: '#5A4A42' }}
>
  💎 解鎖 NT$ 49
</button>
      );
    } else {
      return (
        <button 
          onClick={() => onView()}
          className="px-6 py-2 rounded-xl text-sm font-medium text-white transition-all hover:shadow-lg"
          style={{ background: 'linear-gradient(to right, #C9A386, #D4A373)' }}
        >
          查看報告 →
        </button>
      );
    }
  };

  // 記錄少的提示
  const showLowRecordWarning = report.totalDiaries <= 2;

  return (
    <div 
      className="p-6 rounded-2xl cursor-pointer transition-all hover:shadow-lg"
      style={{ background: '#FFFFFF', border: '1px solid #E8D4C4' }}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold text-lg" style={{ color: '#5A4A42' }}>
              第 {index} 週成長報告
            </h3>
            {getStatusBadge()}
          </div>
          <p className="text-sm mb-1" style={{ color: '#8B7A70' }}>
            📅 {formatWeekRange(report.weekStart, report.weekEnd)}
          </p>
          <p className="text-sm" style={{ color: '#8B7A70' }}>
            本週記錄: {report.totalDiaries} 天
          </p>
        </div>
        <span className="text-3xl">✨</span>
      </div>

      {/* 記錄少的溫馨提醒 */}
      {showLowRecordWarning && report.status !== 'paid' && (
        <div 
          className="mb-4 p-4 rounded-xl"
          style={{ background: '#FFF9F5', border: '1px solid #FFD700' }}
        >
          <p className="text-sm mb-2" style={{ color: '#8B7A70' }}>
            💙 溫馨提醒
          </p>
          <p className="text-xs mb-2" style={{ color: '#A89B93' }}>
            這週只記錄了 {report.totalDiaries} 天呢~ 試著多和自己對話，記錄心情吧！
          </p>
          <p className="text-xs" style={{ color: '#D4A373' }}>
            我都在這裡陪伴你成長 🥰
          </p>
        </div>
      )}

      <div className="flex justify-end">
        {getActionButton()}
      </div>
    </div>
  );
};

// ==================== 週報詳細內容頁 ====================

export const WeeklyReportDetailPage = ({ report, onClose, onClaim, onUnlock }) => {
  // 已付費：顯示完整內容
  if (report.status === 'paid') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div 
          className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-3xl shadow-2xl"
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
            <div>
              <h2 className="text-2xl font-bold mb-1" style={{ color: '#5A4A42' }}>
                成長報告 ✨
              </h2>
              <p className="text-sm" style={{ color: '#8B7A70' }}>
                📅 {formatWeekRange(report.weekStart, report.weekEnd)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={24} style={{ color: '#8B7A70' }} />
            </button>
          </div>

          <div className="p-6">
            {/* 統計資訊 */}
            <div 
              className="mb-6 p-4 rounded-2xl"
              style={{ background: '#EFF6FF' }}
            >
              <p className="text-sm" style={{ color: '#3B82F6' }}>
                本週記錄: {report.totalDiaries} 天
              </p>
            </div>

            {/* 報告內容 */}
            <div className="space-y-6">
              {/* 整體回顧 */}
              <section>
                <h3 
                  className="text-lg font-bold mb-3 flex items-center gap-2"
                  style={{ color: '#5A4A42' }}
                >
                  <Heart size={20} style={{ color: '#D4A373' }} />
                  整體回顧
                </h3>
                <p className="text-base leading-relaxed" style={{ color: '#5A4A42' }}>
                  {report.content.overview}
                </p>
              </section>

              <div style={{ height: '1px', background: '#E8D4C4' }} />

              {/* 發現情緒與建議 */}
              <section>
                <h3 
                  className="text-lg font-bold mb-3 flex items-center gap-2"
                  style={{ color: '#5A4A42' }}
                >
                  <Sparkles size={20} style={{ color: '#D4A373' }} />
                  發現情緒與建議
                </h3>
                <ul className="space-y-2">
                  {report.content.suggestions.map((suggestion, index) => (
                    <li 
                      key={index}
                      className="flex items-start gap-2 text-base"
                      style={{ color: '#5A4A42' }}
                    >
                      <span style={{ color: '#D4A373' }}>•</span>
                      <span>{suggestion}</span>
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
                  情緒亮點
                </h3>
                <div className="space-y-3">
                  <div 
                    className="p-4 rounded-xl"
                    style={{ background: '#F5EDE7' }}
                  >
                    <p className="text-sm mb-1" style={{ color: '#8B7A70' }}>
                      最常出現:
                    </p>
                    <p className="text-lg font-medium" style={{ color: '#5A4A42' }}>
                      {report.content.highlights.mostFrequent.emoji} {report.content.highlights.mostFrequent.emotion} 
                      <span className="text-sm ml-2" style={{ color: '#A89B93' }}>
                        ({report.content.highlights.mostFrequent.count}次)
                      </span>
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div 
                      className="p-4 rounded-xl"
                      style={{ background: '#F5EDE7' }}
                    >
                      <p className="text-sm mb-1" style={{ color: '#8B7A70' }}>
                        情緒穩定度:
                      </p>
                      <p className="text-base font-medium" style={{ color: '#5A4A42' }}>
                        {report.content.highlights.moodStability}
                      </p>
                    </div>
                    <div 
                      className="p-4 rounded-xl"
                      style={{ background: '#F5EDE7' }}
                    >
                      <p className="text-sm mb-1" style={{ color: '#8B7A70' }}>
                        本週成長:
                      </p>
                      <p className="text-base font-medium" style={{ color: '#4ADE80' }}>
                        {report.content.highlights.growth}
                      </p>
                    </div>
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
                  成長軌跡
                </h3>
                <div 
                  className="p-6 rounded-xl"
                  style={{ background: 'linear-gradient(135deg, #FFF9F5, #F5EDE7)' }}
                >
                  <p className="text-base leading-relaxed" style={{ color: '#5A4A42' }}>
                    {report.content.encouragement}
                  </p>
                </div>
              </section>
            </div>

            {/* 分享按鈕 */}
            <div className="mt-8">
              <p className="text-sm mb-3" style={{ color: '#8B7A70' }}>
                分享這週的成長:
              </p>
              <div className="flex gap-3">
                <button 
                  className="flex-1 py-3 rounded-xl font-medium transition-all hover:shadow-lg"
                  style={{ background: '#1877F2', color: 'white' }}
                >
                  Facebook
                </button>
                <button 
                  className="flex-1 py-3 rounded-xl font-medium transition-all hover:shadow-lg"
                  style={{ background: '#06C755', color: 'white' }}
                >
                  LINE
                </button>
                <button 
                  className="flex-1 py-3 rounded-xl font-medium transition-all hover:shadow-lg"
                  style={{ background: '#E4405F', color: 'white' }}
                >
                  Instagram
                </button>
              </div>
            </div>
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
              本週情緒成長報告已準備好!
            </h2>
            
            <div className="mb-6 space-y-2">
              <p className="text-sm" style={{ color: '#8B7A70' }}>
                📅 統計期間:
              </p>
              <p className="text-base font-medium" style={{ color: '#5A4A42' }}>
                {formatWeekRange(report.weekStart, report.weekEnd)}
              </p>
              
              <p className="text-sm mt-4" style={{ color: '#8B7A70' }}>
                📝 本週記錄: {report.totalDiaries} 天
              </p>
            </div>

            <button
              onClick={() => onClaim(report.id)}
              className="w-full py-4 rounded-2xl font-bold text-lg text-white transition-all hover:shadow-xl mb-4"
              style={{ background: 'linear-gradient(to right, #4ADE80, #22C55E)' }}
            >
              領取本週報告 📊
            </button>

            <p className="text-xs" style={{ color: '#A89B93' }}>
              💡 解鎖領取查看完整報告
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
            解鎖查看情緒成長報告
          </h2>
          
          <div className="mb-6 text-left space-y-4">
            <div>
              <p className="text-sm mb-2" style={{ color: '#8B7A70' }}>
                📅 統計期間:
              </p>
              <p className="text-base font-medium" style={{ color: '#5A4A42' }}>
                {formatWeekRange(report.weekStart, report.weekEnd)}
              </p>
            </div>

            <div>
              <p className="text-sm mb-2" style={{ color: '#8B7A70' }}>
                📊 本週統計:
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
                💎 週報包含:
              </p>
              <ul className="space-y-1 text-sm" style={{ color: '#8B7A70' }}>
                <li>✓ 整體回顧</li>
                <li>✓ 發現情緒與建議</li>
                <li>✓ 情緒亮點</li>
                <li>✓ 成長軌跡</li>
              </ul>
            </div>
          </div>

          <div className="text-center mb-4">
            <p className="text-3xl font-bold mb-2" style={{ color: '#5A4A42' }}>
              NT$ 49
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
              💡 或訂閱月方案享無限週報+月報!
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

export const WeeklyReportTestPanel = ({ onCreateTestReport, isDevelopment }) => {
  if (!isDevelopment) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div 
        className="p-4 rounded-2xl shadow-2xl"
        style={{ background: '#FF6B6B' }}
      >
        <p className="text-white text-xs font-bold mb-2">🧪 開發者測試面板</p>
        <button
          onClick={onCreateTestReport}
          className="w-full py-2 px-4 rounded-xl text-sm font-medium bg-white hover:bg-gray-100 transition-all"
          style={{ color: '#FF6B6B' }}
        >
          建立測試週報
        </button>
      </div>
    </div>
  );
};

export default {
  WeeklyReportCard,
  WeeklyReportsPage,
  WeeklyReportDetailPage,
  WeeklyReportTestPanel
};
