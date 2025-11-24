// 📝 日記編輯 Modal
// 功能：編輯已存在的日記內容（不重新生成療癒信）

import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const DiaryEditModal = ({ letter, onClose, onSave }) => {
  const [editedContent, setEditedContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (letter) {
      setEditedContent(letter.userInput || '');
    }
  }, [letter]);

  const handleSave = async () => {
    if (!editedContent.trim()) {
      alert('日記內容不能是空的喔 📝');
      return;
    }

    setIsSaving(true);

    try {
      // 更新 Firestore
      const letterRef = doc(db, 'letters', letter.id);
      await updateDoc(letterRef, {
        userInput: editedContent,
        updatedAt: new Date()
      });

      // 通知父組件更新
      if (onSave) {
        onSave({
          ...letter,
          userInput: editedContent
        });
      }

      alert('日記已更新！ ✨');
      onClose();

    } catch (error) {
      console.error('更新日記失敗:', error);
      alert('更新失敗，請稍後再試 😢');
    } finally {
      setIsSaving(false);
    }
  };

  if (!letter) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div 
        className="w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
        style={{ background: '#FFF9F5', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div 
          className="flex justify-between items-center p-6 border-b"
          style={{ borderColor: '#E8D4C4' }}
        >
          <h2 className="text-2xl font-bold" style={{ color: '#5A4A42' }}>
            ✏️ 編輯日記
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={24} style={{ color: '#8B7A70' }} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 日期和情緒 */}
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm" style={{ color: '#8B7A70' }}>
              📅 {new Date(letter.date).toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
            {letter.emotion && (
              <span 
                className="text-sm px-3 py-1 rounded-full"
                style={{ background: '#E8D4C4', color: '#5A4A42' }}
              >
                {letter.emotion}
              </span>
            )}
          </div>

          {/* 編輯區域 */}
          <div className="mb-4">
            <label 
              className="block text-sm font-medium mb-2"
              style={{ color: '#5A4A42' }}
            >
              💭 日記內容：
            </label>
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              placeholder="寫下你的心情..."
              className="w-full p-4 rounded-xl border-2 focus:outline-none focus:ring-2 resize-none"
              style={{
                borderColor: '#E8D4C4',
                minHeight: '200px'
              }}
              disabled={isSaving}
            />
            <p className="text-xs mt-2" style={{ color: '#8B7A70' }}>
              💡 修改後將保存新的內容
            </p>
          </div>

          {/* 原始療癒信（顯示但不可編輯） */}
          {letter.content && (
            <div 
              className="p-4 rounded-xl"
              style={{ background: '#F5EDE7' }}
            >
              <p className="text-sm font-medium mb-2" style={{ color: '#5A4A42' }}>
                💌 歐特的回應：
              </p>
              <p className="text-sm whitespace-pre-wrap" style={{ color: '#8B7A70' }}>
                {letter.content}
              </p>
              <p className="text-xs mt-2" style={{ color: '#A89B93' }}>
                ℹ️ 療癒信不會重新生成，保持原樣
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div 
          className="p-6 border-t"
          style={{ borderColor: '#E8D4C4' }}
        >
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-medium transition-all"
              style={{ background: '#E8D4C4', color: '#5A4A42' }}
              disabled={isSaving}
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 py-3 rounded-xl font-medium text-white transition-all hover:shadow-lg disabled:opacity-50"
              style={{ background: 'linear-gradient(to right, #C9A386, #D4A373)' }}
            >
              {isSaving ? (
                <>
                  <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  儲存中...
                </>
              ) : (
                <>
                  <Save size={18} className="inline mr-2" />
                  儲存修改 ✨
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiaryEditModal;
