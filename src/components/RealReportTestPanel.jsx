// 🧪 真實 API 測試按鈕組件
// 替換原本的測試按鈕,改成呼叫真實 API

import React, { useState } from 'react';
import { generateWeeklyReport, generateMonthlyReport } from '../geminiService';

export const RealReportTestPanel = ({ userId, onReportGenerated, isDevelopment }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState('');
  
  if (!isDevelopment) return null;

  const handleGenerateWeekly = async () => {
    setIsGenerating(true);
    setMessage('⏳ 正在生成週報...');
    
    try {
      const result = await generateWeeklyReport(userId);
      setMessage(`✅ 成功! 已生成 ${result.diaryCount} 天的週報`);
      
      // 通知父組件重新載入報告
      if (onReportGenerated) {
        setTimeout(() => {
          onReportGenerated('weekly');
        }, 1500);
      }
    } catch (error) {
      setMessage(`❌ 失敗: ${error.message}`);
    } finally {
      setIsGenerating(false);
      
      // 3秒後清除訊息
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleGenerateMonthly = async () => {
    setIsGenerating(true);
    setMessage('⏳ 正在生成月報...');
    
    try {
      const result = await generateMonthlyReport(userId);
      setMessage(`✅ 成功! 已生成 ${result.diaryCount} 天的月報`);
      
      // 通知父組件重新載入報告
      if (onReportGenerated) {
        setTimeout(() => {
          onReportGenerated('monthly');
        }, 1500);
      }
    } catch (error) {
      setMessage(`❌ 失敗: ${error.message}`);
    } finally {
      setIsGenerating(false);
      
      // 3秒後清除訊息
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {/* 訊息提示 */}
      {message && (
        <div 
          className="p-4 rounded-2xl shadow-2xl text-white text-sm font-medium animate-fade-in"
          style={{ background: message.includes('✅') ? '#4ADE80' : message.includes('❌') ? '#EF4444' : '#3B82F6' }}
        >
          {message}
        </div>
      )}
      
      {/* 月報按鈕 (綠色,上方) */}
      <div 
        className="p-4 rounded-2xl shadow-2xl"
        style={{ background: '#22C55E' }}
      >
        <p className="text-white text-xs font-bold mb-2">🧪 測試月報生成</p>
        <button
          onClick={handleGenerateMonthly}
          disabled={isGenerating}
          className="w-full py-2 px-4 rounded-xl text-sm font-medium bg-white hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ color: '#22C55E' }}
        >
          {isGenerating ? '生成中...' : '生成真實月報 (AI)'}
        </button>
      </div>
      
      {/* 週報按鈕 (紅色,下方) */}
      <div 
        className="p-4 rounded-2xl shadow-2xl"
        style={{ background: '#FF6B6B' }}
      >
        <p className="text-white text-xs font-bold mb-2">🧪 測試週報生成</p>
        <button
          onClick={handleGenerateWeekly}
          disabled={isGenerating}
          className="w-full py-2 px-4 rounded-xl text-sm font-medium bg-white hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ color: '#FF6B6B' }}
        >
          {isGenerating ? '生成中...' : '生成真實週報 (AI)'}
        </button>
      </div>
    </div>
  );
};

export default RealReportTestPanel;
