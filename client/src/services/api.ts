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
  async login(credentials: { email: string; password: string }): Promise<any> {
    return this.request('/auth/login-test', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData: any): Promise<any> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout(): Promise<any> {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async refreshToken(): Promise<any> {
    return this.request('/auth/refresh', {
      method: 'POST',
    });
  }

  async getProfile(): Promise<any> {
    return this.request('/auth/me');
  }

  async updateProfile(userData: any): Promise<any> {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  // Skills endpoints
  async getMySkills(): Promise<any> {
    return this.request('/skills/me');
  }

  async createSkill(skillData: any): Promise<any> {
    return this.request('/skills', {
      method: 'POST',
      body: JSON.stringify(skillData),
    });
  }

  async updateSkill(id: number, skillData: any): Promise<any> {
    return this.request(`/skills/${id}`, {
      method: 'PUT',
      body: JSON.stringify(skillData),
    });
  }

  async deleteSkill(id: number): Promise<any> {
    return this.request(`/skills/${id}`, {
      method: 'DELETE',
    });
  }

  // Swaps endpoints
  async getMySwaps(): Promise<any> {
    return this.request('/swaps/me');
  }

  async getSwap(id: number): Promise<any> {
    return this.request(`/swaps/${id}`);
  }

  async createSwap(swapData: any): Promise<any> {
    return this.request('/swaps', {
      method: 'POST',
      body: JSON.stringify(swapData),
    });
  }

  async updateSwapStatus(id: number, status: string): Promise<any> {
    return this.request(`/swaps/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async deleteSwap(id: number): Promise<any> {
    return this.request(`/swaps/${id}`, {
      method: 'DELETE',
    });
  }

  async rateSwap(id: number, rating: number, comment?: string): Promise<any> {
    return this.request(`/swaps/${id}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
    });
  }

  // Users endpoints
  async getUsers(): Promise<any> {
    return this.request('/users');
  }

  async getUser(id: number): Promise<any> {
    return this.request(`/users/${id}`);
  }

  // Mock data endpoints (for development)
  async getMockData(): Promise<any> {
    return this.request('/mock/data');
  }

  // Notifications endpoints
  async getNotifications(): Promise<any> {
    return this.request('/notifications');
  }

  async markNotificationAsRead(id: number): Promise<any> {
    return this.request(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsAsRead(): Promise<any> {
    return this.request('/notifications/read-all', {
      method: 'PUT',
    });
  }

  // Admin endpoints
  async getAdminStats(): Promise<any> {
    return this.request('/admin/stats');
  }

  async getAdminUsers(): Promise<any> {
    return this.request('/admin/users');
  }

  async banUser(id: number, banned: boolean): Promise<any> {
    return this.request(`/admin/users/${id}/ban`, {
      method: 'PUT',
      body: JSON.stringify({ banned }),
    });
  }

  // Dashboard endpoint
  async getDashboard(): Promise<any> {
    return this.request('/dashboard');
  }

  // Health check
  async healthCheck(): Promise<any> {
    return this.request('/health');
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