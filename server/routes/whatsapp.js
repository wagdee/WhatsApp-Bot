import express from 'express';
import { getWhatsAppStatus, sendMessage } from '../services/whatsapp.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// الحصول على حالة WhatsApp
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const status = await getWhatsAppStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('خطأ في الحصول على حالة WhatsApp:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

// إرسال رسالة فورية
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        message: 'رقم الهاتف والرسالة مطلوبان'
      });
    }

    const result = await sendMessage(phoneNumber, message);
    
    res.json({
      success: true,
      message: 'تم إرسال الرسالة بنجاح',
      data: result
    });

  } catch (error) {
    console.error('خطأ في إرسال الرسالة:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'حدث خطأ في إرسال الرسالة'
    });
  }
});

export default router;