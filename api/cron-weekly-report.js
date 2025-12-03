// API Route: /api/cron-weekly-report.js
// 功能: Vercel Cron Job - 每週一自動生成所有用戶的週報

import admin from 'firebase-admin';

// 初始化 Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  // 驗證是 Vercel Cron Job 的請求
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('🕐 開始執行週報 Cron Job...');
    
    // 1. 取得所有用戶
    const usersSnapshot = await db.collection('users').get();
    const userIds = usersSnapshot.docs.map(doc => doc.id);
    
    console.log(`找到 ${userIds.length} 位用戶`);
    
    const results = {
      total: userIds.length,
      success: 0,
      failed: 0,
      errors: []
    };
    
    // 2. 為每個用戶生成週報
    for (const userId of userIds) {
      try {
        // 呼叫生成週報的 API
        const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/generate-weekly-report`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        });
        
        if (response.ok) {
          results.success++;
          console.log(`✅ 用戶 ${userId} 週報生成成功`);
        } else {
          results.failed++;
          const error = await response.json();
          results.errors.push({ userId, error: error.message });
          console.log(`❌ 用戶 ${userId} 週報生成失敗: ${error.message}`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push({ userId, error: error.message });
        console.error(`❌ 用戶 ${userId} 週報生成錯誤:`, error);
      }
    }
    
    console.log('✅ 週報 Cron Job 執行完成', results);
    
    return res.status(200).json({
      message: '週報 Cron Job 執行完成',
      results
    });
    
  } catch (error) {
    console.error('❌ 週報 Cron Job 執行失敗:', error);
    return res.status(500).json({
      error: '週報 Cron Job 執行失敗',
      message: error.message
    });
  }
}
