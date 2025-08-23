import { getDatabase } from '../database/init.js';
import { sendMessage } from './whatsapp.js';

async function processAutoReply(message) {
  const db = getDatabase();
  
  try {
    // الحصول على جميع الردود التلقائية النشطة
    const autoReplies = await new Promise((resolve, reject) => {
      db.all(`
        SELECT ar.*, u.token, u.is_active as user_active
        FROM auto_replies ar
        JOIN users u ON ar.user_id = u.id
        WHERE ar.is_active = 1 AND u.is_active = 1
        ORDER BY ar.created_at ASC
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const messageText = message.body?.toLowerCase()?.trim() ?? '';

    // تجاهل الرسائل الصادرة منّا لتجنب الحلقات
    if (message.fromMe) return;
    
    // البحث عن تطابق
    for (const reply of autoReplies) {
      let shouldReply = false;
      const triggerText = (reply.trigger_text || '').toLowerCase();
      
      switch (reply.match_type) {
        case 'all':
          shouldReply = true; // رد على جميع الرسائل
          break;
        case 'exact':
          shouldReply = messageText === triggerText;
          break;
        case 'starts_with':
          shouldReply = messageText.startsWith(triggerText);
          break;
        case 'ends_with':
          shouldReply = messageText.endsWith(triggerText);
          break;
        case 'contains':
        default:
          shouldReply = messageText.includes(triggerText);
          break;
      }
      
      if (shouldReply) {
        try {
          await sendMessage(message.from, reply.response_text);
          console.log(`✅ تم إرسال رد تلقائي للرقم: ${message.from}`);
          break; // إرسال أول رد مطابق فقط
        } catch (error) {
          console.error('خطأ في إرسال الرد التلقائي:', error);
        }
      }
    }
  } catch (error) {
    console.error('خطأ في معالجة الرد التلقائي:', error);
  }
}

async function getAutoReplies(userId) {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT * FROM auto_replies 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `, [userId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function createAutoReply(userId, triggerText, responseText, matchType = 'contains') {
  const db = getDatabase();
  const { v4: uuidv4 } = await import('uuid');
  const id = uuidv4();
  
  return new Promise((resolve, reject) => {
    db.run(`
      INSERT INTO auto_replies (id, user_id, trigger_text, response_text, match_type, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [id, userId, triggerText, responseText, matchType], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id, user_id: userId, trigger_text: triggerText, response_text: responseText, match_type: matchType });
      }
    });
  });
}

async function updateAutoReply(id, updates) {
  const db = getDatabase();
  
  const fields = [];
  const values = [];
  
  Object.keys(updates).forEach(key => {
    if (key !== 'id') {
      fields.push(`${key} = ?`);
      values.push(updates[key]);
    }
  });
  
  if (fields.length === 0) {
    throw new Error('لا توجد حقول للتحديث');
  }
  
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  return new Promise((resolve, reject) => {
    db.run(`
      UPDATE auto_replies 
      SET ${fields.join(', ')}
      WHERE id = ?
    `, values, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ changes: this.changes });
      }
    });
  });
}

async function deleteAutoReply(id) {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM auto_replies WHERE id = ?', [id], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ changes: this.changes });
      }
    });
  });
}

export {
  processAutoReply,
  getAutoReplies,
  createAutoReply,
  updateAutoReply,
  deleteAutoReply
};