import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/init.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'whatsapp_bot_secret_key_2024';

// تسجيل مستخدم جديد
router.post('/register', async (req, res) => {
  try {
    // التحقق من إعدادات النظام
    const db = getDatabase();
    const allowRegistration = await new Promise((resolve, reject) => {
      db.get('SELECT setting_value FROM system_settings WHERE setting_key = ?', ['allow_registration'], (err, row) => {
        if (err) reject(err);
        else resolve(row ? row.setting_value === 'true' : true);
      });
    });

    if (!allowRegistration) {
      return res.status(403).json({
        success: false,
        message: 'التسجيل مغلق حالياً من قبل المدير'
      });
    }

    const { username, email, password } = req.body;

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

    // تشفير كلمة المرور
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const userToken = `whatsapp_${uuidv4().replace(/-/g, '')}_${Date.now().toString(36)}`;

    // إنشاء المستخدم
    await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO users (id, username, email, password_hash, token, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, true, CURRENT_TIMESTAMP)
      `, [userId, username, email, passwordHash, userToken], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });

    // إنشاء JWT token
    const jwtToken = jwt.sign(
      { userId, username, email, userToken },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
      data: {
        user: {
          id: userId,
          username,
          email,
          token: userToken
        },
        authToken: jwtToken
      }
    });

  } catch (error) {
    console.error('خطأ في التسجيل:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

// تسجيل الدخول
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني وكلمة المرور مطلوبان'
      });
    }

    const db = getDatabase();
    
    // البحث عن المستخدم
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
      });
    }

    if (!user.is_active) {
      return res.status(400).json({
        success: false,
        message: 'الحساب غير مفعل'
      });
    }

    // التحقق من كلمة المرور
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
      });
    }

    // تحديث آخر تسجيل دخول
    await new Promise((resolve, reject) => {
      db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // إنشاء JWT token
    const jwtToken = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        email: user.email, 
        userToken: user.token,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          token: user.token,
          role: user.role
        },
        authToken: jwtToken
      }
    });

  } catch (error) {
    console.error('خطأ في تسجيل الدخول:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

// التحقق من صحة التوكن
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT id, username, email, token, is_active, role FROM users WHERE id = ?', [req.user.userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'المستخدم غير موجود أو غير مفعل'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          token: user.token,
          role: user.role
        }
      }
    });

  } catch (error) {
    console.error('خطأ في التحقق من التوكن:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

// Middleware للتحقق من التوكن
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'التوكن مطلوب'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'التوكن غير صحيح'
      });
    }
    req.user = user;
    next();
  });
}

export default router;
export { authenticateToken };