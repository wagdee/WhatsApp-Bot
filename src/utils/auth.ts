import { User } from '../types';

export const hashPassword = async (password: string): Promise<string> => {
  // في التطبيق الحقيقي، استخدم bcrypt
  return btoa(password + 'salt_key_secret');
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const hashedInput = await hashPassword(password);
  return hashedInput === hash;
};

export const generateToken = (): string => {
  return Math.random().toString(36).substr(2) + Date.now().toString(36);
};

export const generateUniqueUserToken = (): string => {
  return 'whatsapp_' + Math.random().toString(36).substr(2, 16) + '_' + Date.now().toString(36);
};

export const setAuthToken = (token: string) => {
  localStorage.setItem('auth_token', token);
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

export const removeAuthToken = () => {
  localStorage.removeItem('auth_token');
};