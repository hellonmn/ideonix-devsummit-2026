import { Platform } from 'react-native';

// 🚀 CONFIGURATION: Using ngrok for a stable backend URL
const BASE_URL = 'https://eternal-viper-hardly.ngrok-free.app'; 


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
    'ngrok-skip-browser-warning': '1', // Bypass ngrok warning page
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

  const text = await response.text();
  let data: any = {};
  try {
    data = JSON.parse(text);
  } catch (e) {
    // If it's not JSON, we'll treat the text as an error message if not ok
    console.warn(`[API] Non-JSON response from ${endpoint}:`, text.substring(0, 100));
  }

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
    throw new ApiError(data.error || text || 'Request failed', response.status, data);
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
  
  async getSubject(id: string | number) {
    return request(`/api/subjects/${id}`);
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

// ─── Lectures API ───
export const lecturesApi = {
  async getLecture(id: string | number) {
    return request(`/api/lectures/${id}`);
  },

  async getLecturesBySubject(subjectId: string | number) {
    return request(`/api/lectures/subject/${subjectId}`);
  },

  async startLecture(title: string, subjectId?: string | number) {
    return request('/api/lectures/start', {
      method: 'POST',
      body: JSON.stringify({ title, subjectId }),
    });
  },

  async uploadChunk(sessionId: string, chunkIndex: number, audioUri: string) {
    const accessToken = await getAccessToken();
    
    // Using native Fetch with FormData for file upload
    const formData = new FormData();
    formData.append('sessionId', sessionId);
    formData.append('chunkIndex', chunkIndex.toString());
    
    // @ts-ignore
    formData.append('audio', {
      uri: audioUri.startsWith('file://') ? audioUri : `file://${audioUri}`,
      type: 'audio/m4a',
      name: `chunk_${chunkIndex}.m4a`,
    });

    console.log(`[API] Uploading chunk ${chunkIndex} from: ${audioUri}`);

    const response = await fetch(`${BASE_URL}/api/lectures/upload-chunk`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'ngrok-skip-browser-warning': '1',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to upload chunk');
    }

    return response.json();
  },

  async uploadFull(sessionId: string, audioUri: string, onProgress: (progress: number) => void) {
    const accessToken = await getAccessToken();
    const url = `${BASE_URL}/api/lectures/upload-full?sessionId=${sessionId}`;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);

      xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
      xhr.setRequestHeader('ngrok-skip-browser-warning', '1');

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (e) {
            resolve({ message: 'Upload successful' });
          }
        } else {
          reject(new Error(xhr.responseText || 'Upload failed'));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));

      const formData = new FormData();
      formData.append('sessionId', sessionId);
      // @ts-ignore
      formData.append('audio', {
        uri: audioUri.startsWith('file://') ? audioUri : `file://${audioUri}`,
        type: 'application/octet-stream',
        name: 'full_audio.m4a',
      });

      xhr.send(formData);
    });
  },

  async finishLecture(sessionId: string, title: string, subjectId?: string | number) {
    return request('/api/lectures/finish', {
      method: 'POST',
      body: JSON.stringify({ sessionId, title, subjectId }),
    });
  },
  
  async deleteLecture(id: string | number) {
    return request(`/api/lectures/${id}`, {
      method: 'DELETE',
    });
  },

  async transcribeLecture(id: string | number) {
    return request(`/api/lectures/${id}/transcribe`, {
      method: 'POST',
    });
  },

  async generateNotes(id: string | number) {
    return request(`/api/lectures/${id}/notes`, {
      method: 'POST',
    });
  },
};
