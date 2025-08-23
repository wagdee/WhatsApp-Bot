import pkg from 'whatsapp-web.js';
const { Client, MessageMedia } = pkg;
import qrcode from 'qrcode-terminal';
import { getDatabase } from '../database/init.js';
import { processAutoReply } from './autoReply.js';

let client = null;
let qrCodeData = null;

function initializeWhatsApp() {
  client = new Client({
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    }
  });

  client.on('qr', (qr) => {
    console.log('📱 قم بمسح رمز QR باستخدام WhatsApp:');
    qrcode.generate(qr, { small: true });
    qrCodeData = qr;
    updateWhatsAppStatus(false, null, qr);
  });

  client.on('ready', async () => {
    console.log('✅ WhatsApp Bot جاهز للاستخدام!');
    const info = client.info;
    qrCodeData = null;
    updateWhatsAppStatus(true, info.wid.user, null);
  });

  client.on('message', async (message) => {
    try {
      // تسجيل الرسالة الواردة
      await logMessage(null, message.from, message.body, 'incoming');
      
      // معالجة الرد التلقائي
      await processAutoReply(message);
    } catch (error) {
      console.error('خطأ في معالجة الرسالة:', error);
    }
  });

  client.on('disconnected', (reason) => {
    console.log('❌ تم قطع الاتصال مع WhatsApp:', reason);
    updateWhatsAppStatus(false, null, null);
  });

  client.initialize();
}

async function sendMessage(phoneNumber, message) {
  if (!client || (await client.getState()) !== 'CONNECTED') {
    throw new Error('WhatsApp غير متصل');
  }

  try {
    const chatId = phoneNumber.includes('@c.us') ? phoneNumber : `${phoneNumber}@c.us`;
    await client.sendMessage(chatId, message);
    
    // تسجيل الرسالة المرسلة
    await logMessage(null, phoneNumber, message, 'outgoing', 'sent');
    
    return { success: true, message: 'تم إرسال الرسالة بنجاح' };
  } catch (error) {
    console.error('خطأ في إرسال الرسالة:', error);
    await logMessage(null, phoneNumber, message, 'outgoing', 'failed');
    throw error;
  }
}

async function getWhatsAppStatus() {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM whatsapp_settings ORDER BY created_at DESC LIMIT 1', (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      
      const status = {
        isConnected: row ? row.is_connected : false,
        phoneNumber: row ? row.phone_number : null,
        qrCode: qrCodeData,
        lastActivity: row ? row.last_activity : null
      };
      
      resolve(status);
    });
  });
}

function updateWhatsAppStatus(isConnected, phoneNumber = null, qrCode = null) {
  const db = getDatabase();

  // Format current time as dd/mm/yyyy HH:mm (Gregorian)
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const formattedNow = `${day}/${month}/${year} ${hours}:${minutes}`;
  
  db.run(`
    INSERT OR REPLACE INTO whatsapp_settings 
    (id, is_connected, phone_number, qr_code, last_activity, updated_at) 
    VALUES (1, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `, [isConnected, phoneNumber, qrCode, formattedNow], (err) => {
    if (err) {
      console.error('خطأ في تحديث حالة WhatsApp:', err);
    }
  });
}

async function logMessage(userId, phoneNumber, message, direction, status = 'sent') {
  const db = getDatabase();
  const { v4: uuidv4 } = await import('uuid');
  
  return new Promise((resolve, reject) => {
    db.run(`
      INSERT INTO message_logs (id, user_id, phone_number, message, direction, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [uuidv4(), userId, phoneNumber, message, direction, status], (err) => {
      if (err) {
        console.error('خطأ في تسجيل الرسالة:', err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function getClient() {
  return client;
}

export {
  initializeWhatsApp,
  sendMessage,
  getWhatsAppStatus,
  getClient
};