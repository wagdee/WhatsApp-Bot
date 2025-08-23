import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Plus, MessageSquare, Edit3, Trash2, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { autoReplyApi } from '../services/api';

interface AutoReply {
  id: string;
  user_id: string;
  trigger_text: string;
  response_text: string;
  is_active: boolean;
  match_type: 'exact' | 'contains' | 'starts_with' | 'ends_with' | 'all';
  created_at: string;
  updated_at: string;
}

export default function AutoReplies() {
  const [showForm, setShowForm] = useState(false);
  const [editingReply, setEditingReply] = useState<AutoReply | null>(null);
  const [triggerText, setTriggerText] = useState('');
  const [responseText, setResponseText] = useState('');
  const [matchType, setMatchType] = useState<'exact' | 'contains' | 'starts_with' | 'ends_with' | 'all'>('contains');

  const queryClient = useQueryClient();

  // جلب الردود التلقائية
  const { data: autoReplies, isLoading } = useQuery('autoReplies', autoReplyApi.getAll);

  // إنشاء رد تلقائي جديد
  const createMutation = useMutation(
    ({ triggerText, responseText, matchType }: { triggerText: string; responseText: string; matchType: 'exact' | 'contains' | 'starts_with' | 'ends_with' | 'all' }) =>
      autoReplyApi.create(triggerText, responseText, matchType),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('autoReplies');
        resetForm();
      }
    }
  );

  // تحديث رد تلقائي
  const updateMutation = useMutation(
    ({ id, updates }: { id: string; updates: any }) => autoReplyApi.update(id, updates),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('autoReplies');
        resetForm();
      }
    }
  );

  // حذف رد تلقائي
  const deleteMutation = useMutation(autoReplyApi.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('autoReplies');
    }
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingReply(null);
    setTriggerText('');
    setResponseText('');
    setMatchType('contains');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingReply) {
      updateMutation.mutate({
        id: editingReply.id,
        updates: {
          trigger_text: triggerText,
          response_text: responseText,
          match_type: matchType
        }
      });
    } else {
      createMutation.mutate({ triggerText, responseText, matchType });
    }
  };

  const handleEdit = (reply: AutoReply) => {
    setEditingReply(reply);
    setTriggerText(reply.trigger_text);
    setResponseText(reply.response_text);
    setMatchType(reply.match_type);
    setShowForm(true);
  };

  const handleToggleActive = (reply: AutoReply) => {
    updateMutation.mutate({
      id: reply.id,
      updates: { is_active: !reply.is_active }
    });
  };

  const getMatchTypeText = (type: string) => {
    switch (type) {
      case 'exact':
        return 'تطابق تام';
      case 'starts_with':
        return 'يبدأ بـ';
      case 'ends_with':
        return 'ينتهي بـ';
      case 'all':
        return 'جميع الرسائل';
      case 'contains':
      default:
        return 'يحتوي على';
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            الردود التلقائية
          </h2>
          <p className="text-gray-600">
            إعداد ردود تلقائية على الرسائل الواردة
          </p>
        </div>
        
        <button
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
            }
          }}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 transform hover:scale-105"
        >
          <Plus className="w-5 h-5 ml-2" />
          {showForm ? 'إلغاء' : 'إضافة رد جديد'}
        </button>
      </div>

      {/* نموذج إضافة/تحديث رد تلقائي */}
      {showForm && (
        <div className="mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">
              {editingReply ? 'تحديث الرد التلقائي' : 'إضافة رد تلقائي جديد'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* النص المحفز */}
                <div>
                  <label htmlFor="triggerText" className="block text-sm font-medium text-gray-700 mb-2">
                    النص المحفز
                  </label>
                  <input
                    id="triggerText"
                    type="text"
                    required
                    value={triggerText}
                    onChange={(e) => setTriggerText(e.target.value)}
                    placeholder="مثال: السلام عليكم"
                    className="block w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    النص الذي سيؤدي إلى الرد التلقائي
                  </p>
                </div>

                {/* نوع التطابق */}
                <div>
                  <label htmlFor="matchType" className="block text-sm font-medium text-gray-700 mb-2">
                    نوع التطابق
                  </label>
                  <select
                    id="matchType"
                    value={matchType}
                    onChange={(e) => setMatchType(e.target.value as any)}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">جميع الرسائل</option>
                    <option value="contains">يحتوي على</option>
                    <option value="exact">تطابق تام</option>
                    <option value="starts_with">يبدأ بـ</option>
                    <option value="ends_with">ينتهي بـ</option>
                  </select>
                </div>
              </div>

              {/* نص الرد */}
              <div>
                <label htmlFor="responseText" className="block text-sm font-medium text-gray-700 mb-2">
                  نص الرد
                </label>
                <textarea
                  id="responseText"
                  required
                  rows={4}
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="مثال: وعليكم السلام ورحمة الله وبركاته، كيف يمكنني مساعدتك؟"
                  className="block w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
                <p className="mt-1 text-xs text-gray-400 text-left">
                  {responseText.length} حرف
                </p>
              </div>

              {/* أزرار التحكم */}
              <div className="flex justify-end space-x-3 rtl:space-x-reverse">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                  className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-blue-600 rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50"
                >
                  {(createMutation.isLoading || updateMutation.isLoading) ? (
                    <>
                      <Loader2 className="animate-spin w-4 h-4 ml-2 inline" />
                      جاري الحفظ...
                    </>
                  ) : (
                    editingReply ? 'تحديث الرد' : 'إضافة الرد'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* قائمة الردود التلقائية */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل الردود التلقائية...</p>
        </div>
      ) : autoReplies?.data?.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد ردود تلقائية</h3>
          <p className="text-gray-600">ابدأ بإضافة رد تلقائي جديد</p>
        </div>
      ) : (
        <div className="space-y-4">
          {autoReplies?.data?.map((reply: AutoReply) => (
            <div key={reply.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      reply.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {reply.is_active ? 'نشط' : 'غير نشط'}
                    </span>
                    <span className="mr-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                      {getMatchTypeText(reply.match_type)}
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>النص المحفز:</strong> "{reply.trigger_text}"
                    </p>
                    <p className="text-gray-900">
                      <strong>الرد:</strong> {reply.response_text}
                    </p>
                  </div>

                  <div className="text-xs text-gray-500">
                    تم الإنشاء: {new Date(reply.created_at).toLocaleDateString('ar-SA')}
                  </div>
                </div>

                <div className="flex items-center space-x-2 rtl:space-x-reverse mr-4">
                  <button
                    onClick={() => handleToggleActive(reply)}
                    disabled={updateMutation.isLoading}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title={reply.is_active ? 'إلغاء التفعيل' : 'تفعيل'}
                  >
                    {reply.is_active ? (
                      <ToggleRight className="w-5 h-5 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleEdit(reply)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="تحديث"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={() => deleteMutation.mutate(reply.id)}
                    disabled={deleteMutation.isLoading}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="حذف"
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