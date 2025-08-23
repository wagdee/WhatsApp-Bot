import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  Key, 
  ToggleLeft, 
  ToggleRight, 
  Settings,
  Shield,
  UserCheck,
  UserX,
  Calendar,
  Clock,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import { adminApi } from '../services/api';
import { User, SystemSettings } from '../types';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface UserFormData {
  username: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
}

export default function AdminDashboard() {
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [userForm, setUserForm] = useState<UserFormData>({
    username: '',
    email: '',
    password: '',
    role: 'user'
  });

  const queryClient = useQueryClient();

  // جلب المستخدمين
  const { data: users, isLoading: usersLoading } = useQuery('adminUsers', adminApi.getUsers);

  // جلب إعدادات النظام
  const { data: settings, isLoading: settingsLoading } = useQuery('systemSettings', adminApi.getSettings);

  // إنشاء مستخدم جديد
  const createUserMutation = useMutation(
    ({ username, email, password, role }: UserFormData) =>
      adminApi.createUser(username, email, password, role),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminUsers');
        resetUserForm();
      }
    }
  );

  // تحديث مستخدم
  const updateUserMutation = useMutation(
    ({ id, updates }: { id: string; updates: any }) => adminApi.updateUser(id, updates),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminUsers');
        setEditingUser(null);
      }
    }
  );

  // تغيير كلمة المرور
  const changePasswordMutation = useMutation(
    ({ id, newPassword }: { id: string; newPassword: string }) =>
      adminApi.changePassword(id, newPassword),
    {
      onSuccess: () => {
        setShowPasswordForm(null);
        setNewPassword('');
      }
    }
  );

  // حذف مستخدم
  const deleteUserMutation = useMutation(adminApi.deleteUser, {
    onSuccess: () => {
      queryClient.invalidateQueries('adminUsers');
    }
  });

  // تحديث إعدادات النظام
  const updateSettingsMutation = useMutation(adminApi.updateSettings, {
    onSuccess: () => {
      queryClient.invalidateQueries('systemSettings');
    }
  });

  const resetUserForm = () => {
    setShowUserForm(false);
    setEditingUser(null);
    setUserForm({
      username: '',
      email: '',
      password: '',
      role: 'user'
    });
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(userForm);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role
    });
    setShowUserForm(true);
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const updates: any = {
      username: userForm.username,
      email: userForm.email,
      role: userForm.role
    };

    updateUserMutation.mutate({ id: editingUser.id, updates });
  };

  const handleToggleUserStatus = (user: User) => {
    updateUserMutation.mutate({
      id: user.id,
      updates: { is_active: !user.is_active }
    });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPasswordForm || !newPassword) return;

    changePasswordMutation.mutate({
      id: showPasswordForm,
      newPassword
    });
  };

  const handleToggleRegistration = () => {
    const currentSetting = settings?.data?.allowRegistration ?? true;
    updateSettingsMutation.mutate({
      allowRegistration: !currentSetting
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'لم يسجل دخول بعد';
    try {
      return format(new Date(dateString), 'dd MMM yyyy HH:mm', { locale: ar });
    } catch {
      return dateString;
    }
  };

  const getRoleText = (role: string) => {
    return role === 'admin' ? 'مدير' : 'مستخدم';
  };

  const getRoleColor = (role: string) => {
    return role === 'admin' 
      ? 'bg-purple-100 text-purple-800' 
      : 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
            <Shield className="w-7 h-7 ml-3 text-purple-600" />
            لوحة تحكم المدير
          </h2>
          <p className="text-gray-600">
            إدارة المستخدمين وإعدادات النظام
          </p>
        </div>

        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          {/* زر تبديل التسجيل */}
          <button
            onClick={handleToggleRegistration}
            disabled={updateSettingsMutation.isLoading}
            className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              settings?.data?.allowRegistration
                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                : 'bg-red-100 text-red-800 hover:bg-red-200'
            }`}
          >
            <Settings className="w-4 h-4 ml-2" />
            {settings?.data?.allowRegistration ? 'إيقاف التسجيل' : 'تفعيل التسجيل'}
          </button>

          {/* زر إضافة مستخدم */}
          <button
            onClick={() => setShowUserForm(!showUserForm)}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 transform hover:scale-105"
          >
            <Plus className="w-5 h-5 ml-2" />
            {showUserForm ? 'إلغاء' : 'إضافة مستخدم'}
          </button>
        </div>
      </div>

      {/* إعدادات النظام */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
            <Settings className="w-5 h-5 ml-2" />
            إعدادات النظام
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">السماح بإنشاء حسابات جديدة</p>
              <p className="text-sm text-gray-600">
                {settings?.data?.allowRegistration 
                  ? 'المستخدمون يمكنهم إنشاء حسابات جديدة' 
                  : 'التسجيل مغلق - المدير فقط يمكنه إضافة مستخدمين'}
              </p>
            </div>
            <button
              onClick={handleToggleRegistration}
              disabled={updateSettingsMutation.isLoading}
              className="p-2 rounded-lg transition-colors"
            >
              {settings?.data?.allowRegistration ? (
                <ToggleRight className="w-8 h-8 text-green-600" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-gray-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* نموذج إضافة/تحديث مستخدم */}
      {showUserForm && (
        <div className="mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">
              {editingUser ? 'تحديث المستخدم' : 'إضافة مستخدم جديد'}
            </h3>
            
            <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* اسم المستخدم */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم المستخدم
                  </label>
                  <input
                    type="text"
                    required
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="أدخل اسم المستخدم"
                  />
                </div>

                {/* البريد الإلكتروني */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    required
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="أدخل البريد الإلكتروني"
                  />
                </div>

                {/* كلمة المرور */}
                {!editingUser && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      كلمة المرور
                    </label>
                    <input
                      type="password"
                      required
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="أدخل كلمة المرور"
                      minLength={6}
                    />
                  </div>
                )}

                {/* الدور */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الدور
                  </label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value as 'user' | 'admin' })}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="user">مستخدم</option>
                    <option value="admin">مدير</option>
                  </select>
                </div>
              </div>

              {/* أزرار التحكم */}
              <div className="flex justify-end space-x-3 rtl:space-x-reverse">
                <button
                  type="button"
                  onClick={resetUserForm}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={createUserMutation.isLoading || updateUserMutation.isLoading}
                  className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50"
                >
                  {(createUserMutation.isLoading || updateUserMutation.isLoading) ? (
                    <>
                      <Loader2 className="animate-spin w-4 h-4 ml-2 inline" />
                      جاري الحفظ...
                    </>
                  ) : (
                    editingUser ? 'تحديث المستخدم' : 'إضافة المستخدم'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نموذج تغيير كلمة المرور */}
      {showPasswordForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              تغيير كلمة المرور
            </h3>
            
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  كلمة المرور الجديدة
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full px-3 py-3 pr-12 border border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="أدخل كلمة المرور الجديدة"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-end space-x-3 rtl:space-x-reverse">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(null);
                    setNewPassword('');
                    setShowPassword(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={changePasswordMutation.isLoading}
                  className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-blue-600 rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50"
                >
                  {changePasswordMutation.isLoading ? (
                    <>
                      <Loader2 className="animate-spin w-4 h-4 ml-2 inline" />
                      جاري التحديث...
                    </>
                  ) : (
                    'تغيير كلمة المرور'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* قائمة المستخدمين */}
      {usersLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل المستخدمين...</p>
        </div>
      ) : users?.data?.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا يوجد مستخدمون</h3>
          <p className="text-gray-600">ابدأ بإضافة مستخدم جديد</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Users className="w-5 h-5 ml-2" />
              إدارة المستخدمين ({users?.data?.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المستخدم
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الدور
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    آخر تسجيل دخول
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    تاريخ الإنشاء
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users?.data?.map((user: User) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.username}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {getRoleText(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? (
                          <>
                            <UserCheck className="w-3 h-3 ml-1" />
                            نشط
                          </>
                        ) : (
                          <>
                            <UserX className="w-3 h-3 ml-1" />
                            معطل
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 ml-1 text-gray-400" />
                        {formatDate(user.last_login)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 ml-1 text-gray-400" />
                        {formatDate(user.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        {/* تبديل الحالة */}
                        <button
                          onClick={() => handleToggleUserStatus(user)}
                          disabled={updateUserMutation.isLoading || user.email === 'admin@admin.com'}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                          title={user.is_active ? 'إيقاف المستخدم' : 'تفعيل المستخدم'}
                        >
                          {user.is_active ? (
                            <ToggleRight className="w-5 h-5 text-green-600" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-gray-400" />
                          )}
                        </button>

                        {/* تحديث */}
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="تحديث المستخدم"
                        >
                          <Edit3 className="w-5 h-5" />
                        </button>

                        {/* تغيير كلمة المرور */}
                        <button
                          onClick={() => setShowPasswordForm(user.id)}
                          className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="تغيير كلمة المرور"
                        >
                          <Key className="w-5 h-5" />
                        </button>

                        {/* حذف */}
                        <button
                          onClick={() => {
                            if (window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
                              deleteUserMutation.mutate(user.id);
                            }
                          }}
                          disabled={deleteUserMutation.isLoading || user.email === 'admin@admin.com'}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="حذف المستخدم"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <div className="mr-4">
              <div className="text-2xl font-bold text-gray-900">
                {users?.data?.length || 0}
              </div>
              <div className="text-sm text-gray-600">إجمالي المستخدمين</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserCheck className="w-8 h-8 text-green-600" />
            </div>
            <div className="mr-4">
              <div className="text-2xl font-bold text-gray-900">
                {users?.data?.filter((u: User) => u.is_active).length || 0}
              </div>
              <div className="text-sm text-gray-600">مستخدمون نشطون</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
            <div className="mr-4">
              <div className="text-2xl font-bold text-gray-900">
                {users?.data?.filter((u: User) => u.role === 'admin').length || 0}
              </div>
              <div className="text-sm text-gray-600">مديرون</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Settings className="w-8 h-8 text-gray-600" />
            </div>
            <div className="mr-4">
              <div className="text-2xl font-bold text-gray-900">
                {settings?.data?.allowRegistration ? 'مفتوح' : 'مغلق'}
              </div>
              <div className="text-sm text-gray-600">التسجيل</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}