const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(credentials: { email: string; password: string }): Promise<{ success: boolean; data: { token: string; user: any }; message?: string }> {
    const response = await this.request<{ success: boolean; data: { token: string; user: any }; message?: string }>('/auth/login-test', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    return response;
  }

  async register(userData: { email: string; password: string; firstName: string; lastName: string }): Promise<{ success: boolean; data: { token: string; user: any }; message?: string }> {
    // Convert firstName/lastName to name for server compatibility
    const serverData = {
      ...userData,
      name: `${userData.firstName} ${userData.lastName}`.trim(),
    };

    const response = await this.request<{ success: boolean; data: { token: string; user: any }; message?: string }>('/auth/register-test', {
      method: 'POST',
      body: JSON.stringify(serverData),
    });
    return response;
  }

  async logout(): Promise<{ success: boolean; data?: any; message?: string }> {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async refreshToken(): Promise<{ success: boolean; data: { token: string }; message?: string }> {
    return this.request('/auth/refresh', {
      method: 'POST',
    });
  }

  // User endpoints
  async getProfile(): Promise<{ success: boolean; data: any; message?: string }> {
    return this.request('/users/profile');
  }

  async updateProfile(userData: any): Promise<{ success: boolean; data: any; message?: string }> {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async getUserProfile(userId: string) {
    return this.request(`/users/${userId}`);
  }

  // Skills endpoints
  async getSkills() {
    return this.request('/skills');
  }

  async createSkill(skillData: any) {
    return this.request('/skills', {
      method: 'POST',
      body: JSON.stringify(skillData),
    });
  }

  async updateSkill(skillId: string, skillData: any) {
    return this.request(`/skills/${skillId}`, {
      method: 'PUT',
      body: JSON.stringify(skillData),
    });
  }

  async deleteSkill(skillId: string) {
    return this.request(`/skills/${skillId}`, {
      method: 'DELETE',
    });
  }

  // Swaps endpoints
  async getSwaps() {
    return this.request('/swaps');
  }

  async createSwap(swapData: any) {
    return this.request('/swaps', {
      method: 'POST',
      body: JSON.stringify(swapData),
    });
  }

  async updateSwap(swapId: string, swapData: any) {
    return this.request(`/swaps/${swapId}`, {
      method: 'PUT',
      body: JSON.stringify(swapData),
    });
  }

  async deleteSwap(swapId: string) {
    return this.request(`/swaps/${swapId}`, {
      method: 'DELETE',
    });
  }

  // Admin endpoints
  async getAdminStats() {
    return this.request('/admin/stats');
  }

  async getAdminUsers() {
    return this.request('/admin/users');
  }

  async updateUserRole(userId: string, role: string) {
    return this.request(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  // Auth token management
  setAuthToken(token: string) {
    localStorage.setItem('token', token);
  }

  removeAuthToken() {
    localStorage.removeItem('token');
  }
}

export const apiService = new ApiService();
export const api = apiService; // For backward compatibility