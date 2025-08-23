import React, { useState } from 'react';
import { Send, Phone, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';
import { whatsappApi } from '../services/api';

export default function SendMessage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setResult(null);
    setLoading(true);

    try {
      const response = await whatsappApi.sendMessage(phoneNumber, message);
      
      if (response.success) {
        setResult({ type: 'success', message: 'تم إرسال الرسالة بنجاح!' });
        setMessage('');
      } else {
        setResult({ type: 'error', message: response.message });
      }
    } catch (error: any) {
      setResult({ 
        type: 'error', 
        message: error.message || 'حدث خطأ في إرسال الرسالة' 
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // إزالة جميع الأحرف غير الرقمية
    const numbers = value.replace(/\D/g, '');
    
    // إضافة رقم المنطقة إذا لم يكن موجوداً
    if (numbers.length > 0 && !numbers.startsWith('967')) {
      return '967' + numbers;
    }
    
    return numbers;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          إرسال رسالة فورية
        </h2>
        <p className="text-gray-600">
          أرسل رسالة واتساب إلى أي رقم فوراً
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
        {/* حقل رقم الهاتف */}
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
            رقم الهاتف
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="phoneNumber"
              type="tel"
              required
              value={phoneNumber}
              onChange={handlePhoneChange}
              placeholder="96777777777"
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
              dir="ltr"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            أدخل الرقم بصيغة دولية (مثال: 96777777777)
          </p>
        </div>

        {/* حقل الرسالة */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            نص الرسالة
          </label>
          <div className="relative">
            <div className="absolute top-3 left-3 pointer-events-none">
              <MessageSquare className="h-5 w-5 text-gray-400" />
            </div>
            <textarea
              id="message"
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="اكتب رسالتك هنا..."
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 resize-none"
            />
          </div>
          <div className="flex justify-between mt-1">
            <p className="text-xs text-gray-500">
              اكتب الرسالة التي تريد إرسالها
            </p>
            <p className="text-xs text-gray-400">
              {message.length} حرف
            </p>
          </div>
        </div>

        {/* رسالة النتيجة */}
        {result && (
          <div className={`p-4 rounded-xl border ${
            result.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center">
              {result.type === 'success' ? (
                <CheckCircle className="w-5 h-5 ml-2" />
              ) : (
                <AlertCircle className="w-5 h-5 ml-2" />
              )}
              {result.message}
            </div>
          </div>
        )}

        {/* زر الإرسال */}
        <div className="text-center">
          <button
            type="submit"
            disabled={loading || !phoneNumber || !message}
            className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-2"></div>
                جاري الإرسال...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 ml-2" />
                إرسال الرسالة
              </>
            )}
          </button>
        </div>
      </form>

      {/* نصائح مفيدة */}
      <div className="mt-8 max-w-2xl mx-auto">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h4 className="font-semibold text-blue-900 mb-3">نصائح مهمة:</h4>
          <ul className="text-blue-800 text-sm space-y-2">
            <li className="flex items-start">
              <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 ml-2"></span>
              تأكد من أن WhatsApp متصل قبل الإرسال
            </li>
            <li className="flex items-start">
              <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 ml-2"></span>
              أدخل رقم الهاتف بالصيغة الدولية بدون علامات (+, -, مسافات)
            </li>
            <li className="flex items-start">
              <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 ml-2"></span>
              تجنب إرسال رسائل مزعجة أو غير مرغوب فيها
            </li>
            <li className="flex items-start">
              <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 ml-2"></span>
              استخدم النص البسيط لضمان التوافق مع جميع الأجهزة
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}