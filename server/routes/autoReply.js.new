import express from 'express';
import { authenticateToken } from './auth.js';
import {
  getAutoReplies,
  createAutoReply,
  updateAutoReply,
  deleteAutoReply
} from '../services/autoReply.js';

const router = express.Router();

// الحصول على الردود التلقائية
router.get('/', authenticateToken, async (req, res) => {
  try {
    const autoReplies = await getAutoReplies(req.user.userId);
    res.json({
      success: true,
      data: autoReplies
    });
  } catch (error) {
    console.error('خطأ في الحصول على الردود التلقائية:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

// إنشاء رد تلقائي جديد
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { triggerText, responseText, matchType } = req.body;

    if (!triggerText || !responseText) {
      return res.status(400).json({
        success: false,
        message: 'النص المحفز والرد مطلوبان'
      });
    }

    const autoReply = await createAutoReply(
      req.user.userId,
      triggerText,
      responseText,
      matchType
    );

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الرد التلقائي بنجاح',
      data: autoReply
    });

  } catch (error) {
    console.error('خطأ في إنشاء الرد التلقائي:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

// تحديث رد تلقائي
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const result = await updateAutoReply(id, updates);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'الرد التلقائي غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم تحديث الرد التلقائي بنجاح'
    });

  } catch (error) {
    console.error('خطأ في تحديث الرد التلقائي:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

// حذف رد تلقائي
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteAutoReply(id);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'الرد التلقائي غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم حذف الرد التلقائي بنجاح'
    });

  } catch (error) {
    console.error('خطأ في حذف الرد التلقائي:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

export default router;