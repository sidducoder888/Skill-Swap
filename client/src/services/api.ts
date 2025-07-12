const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(credentials: { email: string; password: string }): Promise<{ success: boolean; data: { token: string; user: any }; message?: string }> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData: { email: string; password: string; firstName: string; lastName: string }): Promise<{ success: boolean; data: { token: string; user: any }; message?: string }> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async refreshToken() {
    return this.request('/auth/refresh', {
      method: 'POST',
    });
  }

  // User endpoints
  async getProfile(): Promise<{ success: boolean; data: any; message?: string }> {
    return this.request('/users/profile');
  }

  async updateProfile(userData: any) {
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
}

export const apiService = new ApiService();
export const api = apiService; // For backward compatibility

// Add missing methods to the instance
(apiService as any).setAuthToken = (token: string) => {
  localStorage.setItem('token', token);
};

(apiService as any).removeAuthToken = () => {
  localStorage.removeItem('token');
};