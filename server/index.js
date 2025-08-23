import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import whatsappRoutes from './routes/whatsapp.js';
import messageRoutes from './routes/messages.js';
import autoReplyRoutes from './routes/autoReply.js';
import { initializeDatabase } from './database/init.js';
import { initializeWhatsApp } from './services/whatsapp.js';
import { startScheduler } from './services/scheduler.js';

const app = express();
const PORT = process.env.PORT || 3001;

// تهيئة قاعدة البيانات
initializeDatabase();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/auto-reply', autoReplyRoutes);

// تشغيل خدمات WhatsApp والجدولة
initializeWhatsApp();
startScheduler();

// معالجة الأخطاء العامة
app.use((err, req, res, next) => {
  console.error('خطأ في الخادم:', err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'حدث خطأ داخلي في الخادم' 
  });
});

// تشغيل الخادم
app.listen(PORT, () => {
  console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`);
});

export default app;