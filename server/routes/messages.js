import express from 'express';
import { authenticateToken } from './auth.js';
import {
  getScheduledMessages,
  createScheduledMessage,
  deleteScheduledMessage
} from '../services/scheduler.js';

const router = express.Router();

// الحصول على الرسائل المجدولة
router.get('/scheduled', authenticateToken, async (req, res) => {
  try {
    const messages = await getScheduledMessages(req.user.userId);
    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('خطأ في الحصول على الرسائل المجدولة:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

// إنشاء رسالة مجدولة
router.post('/schedule', authenticateToken, async (req, res) => {
  try {
    const { phoneNumber, message, scheduledTime } = req.body;

    if (!phoneNumber || !message || !scheduledTime) {
      return res.status(400).json({
        success: false,
        message: 'جميع الحقول مطلوبة'
      });
    }

    // التحقق من أن الوقت المجدول في المستقبل
    const scheduledDate = new Date(scheduledTime);
    const now = new Date();

    if (scheduledDate <= now) {
      return res.status(400).json({
        success: false,
        message: 'وقت الإرسال يجب أن يكون في المستقبل'
      });
    }

    const scheduledMessage = await createScheduledMessage(
      req.user.userId,
      phoneNumber,
      message,
      scheduledTime
    );

    res.status(201).json({
      success: true,
      message: 'تم جدولة الرسالة بنجاح',
      data: scheduledMessage
    });

  } catch (error) {
    console.error('خطأ في جدولة الرسالة:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

// حذف رسالة مجدولة
router.delete('/scheduled/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteScheduledMessage(id);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'الرسالة غير موجودة'
      });
    }

    res.json({
      success: true,
      message: 'تم حذف الرسالة بنجاح'
    });

  } catch (error) {
    console.error('خطأ في حذف الرسالة:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

export default router;