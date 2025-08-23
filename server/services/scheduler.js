import cron from 'node-cron';
import { getDatabase } from '../database/init.js';
import { sendMessage } from './whatsapp.js';

function startScheduler() {
  // فحص الرسائل المجدولة كل دقيقة
  cron.schedule('* * * * *', async () => {
    try {
      console.log('⏰ فحص الرسائل المجدولة عند', new Date().toISOString());
      await processScheduledMessages();
    } catch (error) {
      console.error('خطأ في معالجة الرسائل المجدولة:', error);
    }
  });
  
  console.log('✅ تم تشغيل جدولة الرسائل');
}

async function processScheduledMessages() {
  const db = getDatabase();
  
  // الحصول على الرسائل المجدولة المستحقة
  const scheduledMessages = await new Promise((resolve, reject) => {
    db.all(`
      SELECT sm.*, u.token, u.is_active as user_active
      FROM scheduled_messages sm
      JOIN users u ON sm.user_id = u.id
      WHERE sm.status = 'pending' 
        AND datetime(sm.scheduled_time) <= CURRENT_TIMESTAMP
        AND u.is_active = 1
      ORDER BY datetime(sm.scheduled_time) ASC
      LIMIT 10
    `, (err, rows) => {
      if (err) {
        console.error('❌ SQL Error fetching scheduled messages:', err);
        reject(err);
      } else {
        console.log(`🔎 عُثر على ${rows?.length || 0} رسائل مستحقة`);
        resolve(rows);
      }
    });
  });

  for (const message of scheduledMessages) {
    try {
      // تحديث الحالة إلى "جاري الإرسال"
      await updateMessageStatus(message.id, 'sending');
      
      // إرسال الرسالة
      await sendMessage(message.phone_number, message.message);
      
      // تحديث الحالة إلى "تم الإرسال"
      await updateMessageStatus(message.id, 'sent', null);
      
      console.log(`✅ تم إرسال رسالة مجدولة للرقم: ${message.phone_number}`);
      
    } catch (error) {
      console.error(`❌ خطأ في إرسال رسالة للرقم ${message.phone_number}:`, error);
      
      // تحديث الحالة إلى "فشل"
      await updateMessageStatus(message.id, 'failed', error.message);
    }
  }
}

async function updateMessageStatus(messageId, status, errorMessage = null) {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    const sentAt = status === 'sent' ? 'CURRENT_TIMESTAMP' : 'NULL';
    
    db.run(`
      UPDATE scheduled_messages 
      SET status = ?, error_message = ?, sent_at = ${sentAt}
      WHERE id = ?
    `, [status, errorMessage, messageId], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ changes: this.changes });
      }
    });
  });
}

async function getScheduledMessages(userId) {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT * FROM scheduled_messages 
      WHERE user_id = ? 
      ORDER BY scheduled_time DESC
    `, [userId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function createScheduledMessage(userId, phoneNumber, message, scheduledTime) {
  const db = getDatabase();
  const { v4: uuidv4 } = await import('uuid');
  const id = uuidv4();
  
  return new Promise((resolve, reject) => {
    db.run(`
      INSERT INTO scheduled_messages (id, user_id, phone_number, message, scheduled_time, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
    `, [id, userId, phoneNumber, message, scheduledTime], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ 
          id, 
          user_id: userId, 
          phone_number: phoneNumber, 
          message, 
          scheduled_time: scheduledTime,
          status: 'pending'
        });
      }
    });
  });
}

async function deleteScheduledMessage(id) {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM scheduled_messages WHERE id = ?', [id], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ changes: this.changes });
      }
    });
  });
}

export {
  startScheduler,
  getScheduledMessages,
  createScheduledMessage,
  deleteScheduledMessage,
  updateMessageStatus
};