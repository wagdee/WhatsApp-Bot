import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { MessageCircle, LogOut, User, Settings, Phone, Clock, MessageSquare, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { whatsappApi } from '../services/api';
import WhatsAppStatus from '../components/WhatsAppStatus';
import SendMessage from '../components/SendMessage';
import ScheduledMessages from '../components/ScheduledMessages';
import AutoReplies from '../components/AutoReplies';
import LoadingSpinner from '../components/LoadingSpinner';

type ActiveTab = 'status' | 'send' | 'schedule' | 'auto-reply';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('status');
  const { user, logout } = useAuth();

  // جلب حالة WhatsApp
  const { data: whatsappStatus, isLoading } = useQuery(
    'whatsappStatus',
    whatsappApi.getStatus,
    {
      refetchInterval: 5000, // تحديث كل 5 ثوان
    }
  );

  const tabs = [
    { id: 'status' as ActiveTab, name: 'حالة الاتصال', icon: Phone },
    { id: 'send' as ActiveTab, name: 'إرسال رسالة', icon: Send },
    { id: 'schedule' as ActiveTab, name: 'الرسائل المجدولة', icon: Clock },
    { id: 'auto-reply' as ActiveTab, name: 'الردود التلقائية', icon: MessageSquare },
  ];

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-100">
      {/* الشريط العلوي */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* الشعار والعنوان */}
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  WhatsApp Bot
                </h1>
                <p className="text-sm text-gray-500">
                  لوحة التحكم الاحترافية
                </p>
              </div>
            </div>

            {/* معلومات المستخدم */}
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
              
              <button
                onClick={logout}
                className="flex items-center justify-center w-9 h-9 bg-gray-100 hover:bg-red-100 rounded-lg transition-colors group"
                title="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4 text-gray-600 group-hover:text-red-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* الشريط الجانبي */}
          <div className="lg:w-64">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <nav className="p-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 mb-1 ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-green-500 to-blue-600 text-white shadow-lg transform scale-105'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="w-5 h-5 ml-3" />
                      {tab.name}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* معلومات التوكن */}
            <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                معلومات الحساب
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500">التوكن الفريد:</p>
                  <p className="text-xs font-mono bg-gray-50 p-2 rounded-lg break-all">
                    {user?.token}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">الحالة:</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    نشط
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* المحتوى الرئيسي */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 min-h-96">
              {activeTab === 'status' && <WhatsAppStatus status={whatsappStatus?.data} />}
              {activeTab === 'send' && <SendMessage />}
              {activeTab === 'schedule' && <ScheduledMessages />}
              {activeTab === 'auto-reply' && <AutoReplies />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}