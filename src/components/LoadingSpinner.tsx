import React from 'react';
import { MessageCircle } from 'lucide-react';

export default function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-green-50 to-blue-100">
      <div className="text-center">
        <div className="relative mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl animate-pulse">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-500 to-blue-600 animate-ping opacity-20"></div>
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          جاري التحميل...
        </h2>
        <p className="text-gray-600">
          يرجى الانتظار قليلاً
        </p>
        
        <div className="mt-6 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    </div>
  );
}