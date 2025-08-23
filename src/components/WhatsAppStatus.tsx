import React from 'react';
import { CheckCircle, XCircle, QrCode, Phone, Clock } from 'lucide-react';
import { BotStatus } from '../types';

interface WhatsAppStatusProps {
  status?: BotStatus;
}

// Format a date string to Gregorian dd/mm/yyyy HH:mm
function formatGregorianDate(dateString?: string) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export default function WhatsAppStatus({ status }: WhatsAppStatusProps) {
  if (!status) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">جاري تحميل حالة الاتصال...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          حالة اتصال WhatsApp
        </h2>
        <p className="text-gray-600">
          تحقق من حالة الاتصال وقم بإعداد البوت
        </p>
      </div>

      {/* حالة الاتصال */}
      <div className="mb-8">
        <div className={`flex items-center justify-center p-6 rounded-2xl ${
          status.isConnected 
            ? 'bg-green-50 border-2 border-green-200' 
            : 'bg-red-50 border-2 border-red-200'
        }`}>
          {status.isConnected ? (
            <CheckCircle className="w-8 h-8 text-green-600 ml-3" />
          ) : (
            <XCircle className="w-8 h-8 text-red-600 ml-3" />
          )}
          <div>
            <h3 className={`text-lg font-semibold ${
              status.isConnected ? 'text-green-900' : 'text-red-900'
            }`}>
              {status.isConnected ? 'متصل بنجاح' : 'غير متصل'}
            </h3>
            <p className={`text-sm ${
              status.isConnected ? 'text-green-700' : 'text-red-700'
            }`}>
              {status.isConnected 
                ? 'البوت جاهز لإرسال واستقبال الرسائل' 
                : 'يرجى مسح رمز QR للاتصال'}
            </p>
          </div>
        </div>
      </div>

      {/* معلومات الرقم */}
      {status.isConnected && status.phoneNumber && (
        <div className="mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <div className="flex items-center">
              <Phone className="w-6 h-6 text-blue-600 ml-3" />
              <div>
                <h4 className="font-semibold text-blue-900">رقم الهاتف المتصل</h4>
                <p className="text-blue-700 font-mono text-lg">{status.phoneNumber}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* رمز QR */}
      {!status.isConnected && status.qrCode && (
        <div className="mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
            <div className="text-center">
              <QrCode className="w-8 h-8 text-yellow-600 mx-auto mb-4" />
              <h4 className="font-semibold text-yellow-900 mb-2">
                مسح رمز QR للاتصال
              </h4>
              <p className="text-yellow-700 text-sm mb-4">
                افتح WhatsApp واختر "الأجهزة المرتبطة" ثم امسح الرمز أدناه
              </p>
              <div className="bg-white p-4 rounded-xl inline-block">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(status.qrCode)}`}
                  alt="QR Code"
                  className="w-48 h-48 mx-auto"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* آخر نشاط */}
      {status.lastActivity && (
        <div>
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center">
              <Clock className="w-6 h-6 text-gray-600 ml-3" />
              <div>
                <h4 className="font-semibold text-gray-900">آخر نشاط</h4>
                <p className="text-gray-700">
                  {formatGregorianDate(status.lastActivity)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* تعليمات الاستخدام */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6">
        <h4 className="font-semibold text-blue-900 mb-3">تعليمات الاستخدام:</h4>
        <ul className="text-blue-800 text-sm space-y-2">
          <li className="flex items-start">
            <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 ml-2"></span>
            تأكد من أن WhatsApp مثبت على هاتفك ومفعل
          </li>
          <li className="flex items-start">
            <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 ml-2"></span>
            اذهب إلى الإعدادات → الأجهزة المرتبطة → ربط جهاز
          </li>
          <li className="flex items-start">
            <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 ml-2"></span>
            امسح رمز QR المعروض أعلاه
          </li>
          <li className="flex items-start">
            <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 ml-2"></span>
            بعد الاتصال، ستتمكن من استخدام جميع ميزات البوت
          </li>
        </ul>
      </div>
    </div>
  );
}