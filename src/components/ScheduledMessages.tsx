import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Plus, Clock, Phone, MessageSquare, Trash2, Calendar, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { messagesApi } from '../services/api';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ScheduledMessage {
  id: string;
  user_id: string;
  phone_number: string;
  message: string;
  scheduled_time: string;
  status: 'pending' | 'sent' | 'failed';
  created_at: string;
  sent_at?: string;
  error_message?: string;
}

export default function ScheduledMessages() {
  const [showForm, setShowForm] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  const queryClient = useQueryClient();

  // جلب الرسائل المجدولة
  const { data: scheduledMessages, isLoading } = useQuery('scheduledMessages', messagesApi.getScheduled);

  // إنشاء رسالة مجدولة
  const createMutation = useMutation(
    ({ phoneNumber, message, scheduledTime }: { phoneNumber: string; message: string; scheduledTime: string }) =>
      messagesApi.schedule(phoneNumber, message, scheduledTime),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('scheduledMessages');
        setShowForm(false);
        setPhoneNumber('');
        setMessage('');
        setScheduledDate('');
        setScheduledTime('');
      }
    }
  );

  // حذف رسالة مجدولة
  const deleteMutation = useMutation(messagesApi.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('scheduledMessages');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const scheduledDateTime = `${scheduledDate}T${scheduledTime}:00`;
    const scheduledTimestamp = new Date(scheduledDateTime).toISOString();
    
    createMutation.mutate({
      phoneNumber,
      message,
      scheduledTime: scheduledTimestamp
    });
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length > 0 && !numbers.startsWith('967')) {
      return '967' + numbers;
    }
    return numbers;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      case 'pending':
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'sent':
        return 'تم الإرسال';
      case 'failed':
        return 'فشل الإرسال';
      case 'pending':
      default:
        return 'في الانتظار';
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            الرسائل المجدولة
          </h2>
          <p className="text-gray-600">
            جدولة الرسائل لإرسالها في أوقات محددة
          </p>
        </div>
        
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 transform hover:scale-105"
        >
          <Plus className="w-5 h-5 ml-2" />
          {showForm ? 'إلغاء' : 'جدولة رسالة جديدة'}
        </button>
      </div>

      {/* نموذج جدولة رسالة جديدة */}
      {showForm && (
        <div className="mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">
              جدولة رسالة جديدة
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* رقم الهاتف */}
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
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* التاريخ */}
                <div>
                  <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700 mb-2">
                    التاريخ
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="scheduledDate"
                      type="date"
                      required
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* الوقت */}
                <div>
                  <label htmlFor="scheduledTime" className="block text-sm font-medium text-gray-700 mb-2">
                    الوقت
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <Clock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="scheduledTime"
                      type="time"
                      required
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* نص الرسالة */}
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
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="اكتب رسالتك هنا..."
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-400 text-left">
                  {message.length} حرف
                </p>
              </div>

              {/* أزرار التحكم */}
              <div className="flex justify-end space-x-3 rtl:space-x-reverse">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isLoading}
                  className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-blue-600 rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50"
                >
                  {createMutation.isLoading ? (
                    <>
                      <Loader2 className="animate-spin w-4 h-4 ml-2 inline" />
                      جاري الحفظ...
                    </>
                  ) : (
                    'جدولة الرسالة'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* قائمة الرسائل المجدولة */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل الرسائل المجدولة...</p>
        </div>
      ) : scheduledMessages?.data?.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد رسائل مجدولة</h3>
          <p className="text-gray-600">ابدأ بجدولة رسالة جديدة</p>
        </div>
      ) : (
        <div className="space-y-4">
          {scheduledMessages?.data?.map((msg: ScheduledMessage) => (
            <div key={msg.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-3">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(msg.status)}`}>
                      {getStatusIcon(msg.status)}
                      <span className="mr-1">{getStatusText(msg.status)}</span>
                    </div>
                    <div className="mr-4 text-sm text-gray-500">
                      {format(new Date(msg.scheduled_time), 'dd MMM yyyy HH:mm', { locale: ar })}
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <Phone className="w-4 h-4 ml-1" />
                      <span className="font-mono">{msg.phone_number}</span>
                    </div>
                    <div className="text-gray-900">
                      <p className="line-clamp-2">{msg.message}</p>
                    </div>
                  </div>

                  {msg.error_message && (
                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">
                      خطأ: {msg.error_message}
                    </div>
                  )}
                </div>

                <div className="mr-4">
                  <button
                    onClick={() => deleteMutation.mutate(msg.id)}
                    disabled={deleteMutation.isLoading}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="حذف الرسالة"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}