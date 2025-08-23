import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/init.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Middleware للتحقق من صلاحيات المدير
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'غير مصرح لك بالوصول لهذه الصفحة'
    });
  }
  next();
}

// الحصول على جميع المستخدمين
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getDatabase();
    
    const users = await new Promise((resolve, reject) => {
      db.all(`
        SELECT id, username, email, is_active, created_at, last_login, role
        FROM users 
        ORDER BY created_at DESC
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('خطأ في جلب المستخدمين:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

// إنشاء مستخدم جديد
router.post('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { username, email, password, role = 'user' } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'جميع الحقول مطلوبة'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
      });
    }

    const db = getDatabase();
    
    // التحقق من وجود المستخدم
    const existingUser = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM users WHERE email = ? OR username = ?', [email, username], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'المستخدم موجود مسبقاً'
      });
    }

    // إنشاء المستخدم
    const userId = uuidv4();
    const userToken = `user_${uuidv4().replace(/-/g, '')}_${Date.now().toString(36)}`;
    const passwordHash = await bcrypt.hash(password, 10);

    await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO users (id, username, email, password_hash, token, is_active, role, created_at)
        VALUES (?, ?, ?, ?, ?, true, ?, CURRENT_TIMESTAMP)
      `, [userId, username, email, passwordHash, userToken, role], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });

    res.status(201).json({
      success: true,
      message: 'تم إنشاء المستخدم بنجاح',
      data: {
        id: userId,
        username,
        email,
        role,
        is_active: true
      }
    });

  } catch (error) {
    console.error('خطأ في إنشاء المستخدم:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

// تحديث مستخدم
router.put('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, is_active, role } = req.body;

    const db = getDatabase();

    // التحقق من وجود المستخدم
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // منع تعديل حساب المدير الرئيسي
    if (user.email === 'admin@admin.com' && req.user.userId !== id) {
      return res.status(403).json({
        success: false,
        message: 'لا يمكن تعديل حساب المدير الرئيسي'
      });
    }

    const updates = [];
    const values = [];

    if (username !== undefined) {
      updates.push('username = ?');
      values.push(username);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active);
    }
    if (role !== undefined) {
      updates.push('role = ?');
      values.push(role);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'لا توجد بيانات للتحديث'
      });
    }

    values.push(id);

    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE users 
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, values, function(err) {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({
      success: true,
      message: 'تم تحديث المستخدم بنجاح'
    });

  } catch (error) {
    console.error('خطأ في تحديث المستخدم:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

// تغيير كلمة المرور
router.put('/users/:id/password', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
      });
    }

    const db = getDatabase();

    // التحقق من وجود المستخدم
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM users WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await new Promise((resolve, reject) => {
      db.run('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, id], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح'
    });

  } catch (error) {
    console.error('خطأ في تغيير كلمة المرور:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

// حذف مستخدم
router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    // التحقق من وجود المستخدم
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT email FROM users WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // منع حذف المدير الرئيسي
    if (user.email === 'admin@admin.com') {
      return res.status(403).json({
        success: false,
        message: 'لا يمكن حذف حساب المدير الرئيسي'
      });
    }

    await new Promise((resolve, reject) => {
      db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({
      success: true,
      message: 'تم حذف المستخدم بنجاح'
    });

  } catch (error) {
    console.error('خطأ في حذف المستخدم:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

// الحصول على إعدادات النظام
router.get('/settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getDatabase();
    
    const settings = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM system_settings', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.setting_key] = setting.setting_value === 'true';
    });

    res.json({
      success: true,
      data: settingsObj
    });

  } catch (error) {
    console.error('خطأ في جلب إعدادات النظام:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

// تحديث إعدادات النظام
router.put('/settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { allowRegistration } = req.body;
    const db = getDatabase();

    await new Promise((resolve, reject) => {
      db.run(`
        INSERT OR REPLACE INTO system_settings (setting_key, setting_value, updated_at)
        VALUES ('allow_registration', ?, CURRENT_TIMESTAMP)
      `, [allowRegistration ? 'true' : 'false'], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({
      success: true,
      message: 'تم تحديث إعدادات النظام بنجاح'
    });

  } catch (error) {
    console.error('خطأ في تحديث إعدادات النظام:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

export default router;