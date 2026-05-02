import { Platform } from 'react-native';

// Use the machine's local IP address to allow physical devices (Expo Go) to connect to the backend
const BASE_URL = 'http://10.207.196.52:3001';

import * as SecureStore from 'expo-secure-store';

// ─── Token Storage (Persistent via expo-secure-store) ───

export async function setTokens(access: string, refresh: string) {
  await SecureStore.setItemAsync('accessToken', access);
  await SecureStore.setItemAsync('refreshToken', refresh);
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync('accessToken');
  await SecureStore.deleteItemAsync('refreshToken');
}

export async function getAccessToken() {
  return await SecureStore.getItemAsync('accessToken');
}

export async function getRefreshToken() {
  return await SecureStore.getItemAsync('refreshToken');
}

// ─── HTTP Helpers ───
async function request(endpoint: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  const accessToken = await getAccessToken();
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    // Attempt token refresh on 401
    const refreshToken = await getRefreshToken();
    if (response.status === 401 && data.code === 'TOKEN_EXPIRED' && refreshToken) {
      const refreshed = await attemptRefresh();
      if (refreshed) {
        // Retry the original request with the new token
        const newAccessToken = await getAccessToken();
        headers['Authorization'] = `Bearer ${newAccessToken}`;
        const retryResponse = await fetch(url, { ...options, headers });
        return retryResponse.json();
      }
    }
    throw new ApiError(data.error || 'Request failed', response.status, data);
  }

  return data;
}

async function attemptRefresh(): Promise<boolean> {
  try {
    const refreshToken = await getRefreshToken();
    const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      await clearTokens();
      return false;
    }

    const data = await response.json();
    await setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    await clearTokens();
    return false;
  }
}

// ─── Error Class ───
export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// ─── Auth API ───
export const authApi = {
  async register(name: string, email: string, password: string) {
    const data = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    await setTokens(data.accessToken, data.refreshToken);
    return data;
  },

  async login(email: string, password: string) {
    const data = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    await setTokens(data.accessToken, data.refreshToken);
    return data;
  },

  async googleAuth(idToken: string, email: string, name: string, googleId: string, avatarUrl?: string) {
    const data = await request('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken, email, name, googleId, avatarUrl }),
    });
    await setTokens(data.accessToken, data.refreshToken);
    return data;
  },

  async getMe() {
    return request('/api/auth/me');
  },

  async logout() {
    try {
      const refreshToken = await getRefreshToken();
      await request('/api/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    } finally {
      await clearTokens();
    }
  },
};

// ─── Subjects API ───
export const subjectsApi = {
  async getSubjects() {
    return request('/api/subjects');
  },

  async addSubject(title: string, description?: string, color?: string, icon?: string) {
    return request('/api/subjects', {
      method: 'POST',
      body: JSON.stringify({ title, description, color, icon }),
    });
  },

  async updateSubject(id: string | number, updates: { title?: string, description?: string, color?: string, icon?: string }) {
    return request(`/api/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteSubject(id: string | number) {
    return request(`/api/subjects/${id}`, {
      method: 'DELETE',
    });
  },
};
