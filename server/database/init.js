import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const Database = sqlite3.verbose().Database;

const DB_PATH = path.join(__dirname, '../data/whatsapp_bot.db');

let db = null;

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db = new Database(DB_PATH, (err) => {
      if (err) {
        console.error('خطأ في الاتصال بقاعدة البيانات:', err);
        reject(err);
        return;
      }
      console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
      createTables().then(resolve).catch(reject);
    });
  });
}

function createTables() {
  return new Promise((resolve, reject) => {
    const queries = [
      // جدول المستخدمين
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        role TEXT DEFAULT 'user'
      )`,
      
      // جدول الرسائل المجدولة
      `CREATE TABLE IF NOT EXISTS scheduled_messages (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        phone_number TEXT NOT NULL,
        message TEXT NOT NULL,
        scheduled_time DATETIME NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        sent_at DATETIME,
        error_message TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,
      
      // جدول الردود التلقائية
      `CREATE TABLE IF NOT EXISTS auto_replies (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        trigger_text TEXT NOT NULL,
        response_text TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        match_type TEXT DEFAULT 'contains',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,
      
      // جدول إعدادات WhatsApp
      `CREATE TABLE IF NOT EXISTS whatsapp_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        is_connected BOOLEAN DEFAULT false,
        phone_number TEXT,
        qr_code TEXT,
        last_activity DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // جدول سجل الرسائل
      `CREATE TABLE IF NOT EXISTS message_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        phone_number TEXT NOT NULL,
        message TEXT NOT NULL,
        direction TEXT NOT NULL, -- 'incoming' or 'outgoing'
        status TEXT DEFAULT 'sent',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
      )`
    ];

    let completed = 0;
    const total = queries.length;

    queries.forEach((query, index) => {
      db.run(query, (err) => {
        if (err) {
          console.error(`خطأ في إنشاء الجدول ${index + 1}:`, err);
          reject(err);
          return;
        }
        completed++;
        if (completed === total) {
          console.log('✅ تم إنشاء جميع الجداول بنجاح');
          resolve();
        }
      });
    });
  });
}

function getDatabase() {
  return db;
}

export {
  initializeDatabase,
  getDatabase
};