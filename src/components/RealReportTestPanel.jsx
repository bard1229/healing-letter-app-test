// 🧪 真實 API 測試按鈕組件 (更新版)
// 生成成功後顯示「查看報告」按鈕

import React, { useState } from 'react';
import { generateWeeklyReport, generateMonthlyReport } from '../geminiService';

export const RealReportTestPanel = ({ userId, onReportGenerated, onNavigateToReport, isDevelopment }) => {
  const [weeklyState, setWeeklyState] = useState({ isGenerating: false, message: '', reportId: null });
  const [monthlyState, setMonthlyState] = useState({ isGenerating: false, message: '', reportId: null });
  
  if (!isDevelopment) return null;

  const handleGenerateWeekly = async () => {
    setWeeklyState({ isGenerating: true, message: '⏳ 正在生成週報...', reportId: null });
    
    try {
      const result = await generateWeeklyReport(userId);
      setWeeklyState({
        isGenerating: false,
        message: `✅ 成功! 已生成 ${result.diaryCount} 天的週報`,
        reportId: result.reportId
      });
      
      // 通知父組件重新載入報告
      if (onReportGenerated) {
        onReportGenerated('weekly');
      }
    } catch (error) {
      setWeeklyState({
        isGenerating: false,
        message: `❌ 失敗: ${error.message}`,
        reportId: null
      });
      
      // 3秒後清除錯誤訊息
      setTimeout(() => setWeeklyState({ isGenerating: false, message: '', reportId: null }), 3000);
    }
  };

  const handleGenerateMonthly = async () => {
    setMonthlyState({ isGenerating: true, message: '⏳ 正在生成月報...', reportId: null });
    
    try {
      const result = await generateMonthlyReport(userId);
      setMonthlyState({
        isGenerating: false,
        message: `✅ 成功! 已生成 ${result.diaryCount} 天的月報`,
        reportId: result.reportId
      });
      
      // 通知父組件重新載入報告
      if (onReportGenerated) {
        onReportGenerated('monthly');
      }
    } catch (error) {
      setMonthlyState({
        isGenerating: false,
        message: `❌ 失敗: ${error.message}`,
        reportId: null
      });
      
      // 3秒後清除錯誤訊息
      setTimeout(() => setMonthlyState({ isGenerating: false, message: '', reportId: null }), 3000);
    }
  };

  const handleViewWeeklyReport = () => {
    if (onNavigateToReport) {
      onNavigateToReport('weekly');
    }
    // 清除週報狀態
    setWeeklyState({ isGenerating: false, message: '', reportId: null });
  };

  const handleViewMonthlyReport = () => {
    if (onNavigateToReport) {
      onNavigateToReport('monthly');
    }
    // 清除月報狀態
    setMonthlyState({ isGenerating: false, message: '', reportId: null });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {/* 月報按鈕 (綠色,上方) */}
      <div 
        className="p-4 rounded-2xl shadow-2xl"
        style={{ background: '#22C55E' }}
      >
        <p className="text-white text-xs font-bold mb-2">🧪 測試月報生成</p>
        
        {/* 訊息提示 */}
        {monthlyState.message && (
          <div 
            className="mb-2 p-3 rounded-xl text-white text-sm font-medium animate-fade-in"
            style={{ 
              background: monthlyState.message.includes('✅') 
                ? 'rgba(255, 255, 255, 0.2)' 
                : monthlyState.message.includes('❌') 
                ? 'rgba(239, 68, 68, 0.3)' 
                : 'rgba(255, 255, 255, 0.1)' 
            }}
          >
            {monthlyState.message}
          </div>
        )}
        
        {/* 生成按鈕 */}
        {!monthlyState.reportId && (
          <button
            onClick={handleGenerateMonthly}
            disabled={monthlyState.isGenerating}
            className="w-full py-2 px-4 rounded-xl text-sm font-medium bg-white hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ color: '#22C55E' }}
          >
            {monthlyState.isGenerating ? '生成中...' : '生成真實月報 (AI)'}
          </button>
        )}
        
        {/* 查看報告按鈕 */}
        {monthlyState.reportId && (
          <button
            onClick={handleViewMonthlyReport}
            className="w-full py-2 px-4 rounded-xl text-sm font-medium bg-white hover:bg-yellow-50 transition-all"
            style={{ color: '#22C55E' }}
          >
            📊 查看月報
          </button>
        )}
      </div>
      
      {/* 週報按鈕 (紅色,下方) */}
      <div 
        className="p-4 rounded-2xl shadow-2xl"
        style={{ background: '#FF6B6B' }}
      >
        <p className="text-white text-xs font-bold mb-2">🧪 測試週報生成</p>
        
        {/* 訊息提示 */}
        {weeklyState.message && (
          <div 
            className="mb-2 p-3 rounded-xl text-white text-sm font-medium animate-fade-in"
            style={{ 
              background: weeklyState.message.includes('✅') 
                ? 'rgba(255, 255, 255, 0.2)' 
                : weeklyState.message.includes('❌') 
                ? 'rgba(239, 68, 68, 0.3)' 
                : 'rgba(255, 255, 255, 0.1)' 
            }}
          >
            {weeklyState.message}
          </div>
        )}
        
        {/* 生成按鈕 */}
        {!weeklyState.reportId && (
          <button
            onClick={handleGenerateWeekly}
            disabled={weeklyState.isGenerating}
            className="w-full py-2 px-4 rounded-xl text-sm font-medium bg-white hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ color: '#FF6B6B' }}
          >
            {weeklyState.isGenerating ? '生成中...' : '生成真實週報 (AI)'}
          </button>
        )}
        
        {/* 查看報告按鈕 */}
        {weeklyState.reportId && (
          <button
            onClick={handleViewWeeklyReport}
            className="w-full py-2 px-4 rounded-xl text-sm font-medium bg-white hover:bg-yellow-50 transition-all"
            style={{ color: '#FF6B6B' }}
          >
            📊 查看週報
          </button>
        )}
      </div>
    </div>
  );
};

export default RealReportTestPanel;
