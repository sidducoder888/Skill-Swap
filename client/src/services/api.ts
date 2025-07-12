import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

// Types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  error?: string;
  details?: any;
  statusCode?: number;
}

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error: AxiosError) => {
        this.handleError(error);
        return Promise.reject(error);
      }
    );
  }

  private handleError(error: AxiosError): void {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          break;
        case 403:
          toast.error('Access denied');
          break;
        case 404:
          toast.error('Resource not found');
          break;
        case 429:
          toast.error('Too many requests. Please try again later.');
          break;
        case 500:
          toast.error('Internal server error. Please try again.');
          break;
        default:
          const errorMessage = (data as any)?.message || 'An error occurred';
          toast.error(errorMessage);
      }
    } else if (error.request) {
      toast.error('Network error. Please check your connection.');
    } else {
      toast.error('An unexpected error occurred');
    }
  }

  // Generic request methods
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    url: string,
    data?: any,
    config?: any
  ): Promise<T> {
    try {
      const response = await this.api.request({
        method,
        url,
        data,
        ...config,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<ApiResponse<{ token: string; user: any }>> {
    return this.request('POST', '/auth/login', { email, password });
  }

  async register(userData: any): Promise<ApiResponse<{ token: string; user: any }>> {
    return this.request('POST', '/auth/register', userData);
  }

  async logout(): Promise<ApiResponse> {
    return this.request('POST', '/auth/logout');
  }

  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    return this.request('POST', '/auth/refresh');
  }

  // User endpoints
  async getProfile(): Promise<ApiResponse<any>> {
    return this.request('GET', '/users/profile');
  }

  async updateProfile(userData: any): Promise<ApiResponse<any>> {
    return this.request('PUT', '/users/profile', userData);
  }

  async getUsers(params?: any): Promise<PaginatedResponse<any>> {
    return this.request('GET', '/users', null, { params });
  }

  async getUserById(id: number): Promise<ApiResponse<any>> {
    return this.request('GET', `/users/${id}`);
  }

  // Skills endpoints
  async getSkills(params?: any): Promise<PaginatedResponse<any>> {
    return this.request('GET', '/skills', null, { params });
  }

  async createSkill(skillData: any): Promise<ApiResponse<any>> {
    return this.request('POST', '/skills', skillData);
  }

  async updateSkill(id: number, skillData: any): Promise<ApiResponse<any>> {
    return this.request('PUT', `/skills/${id}`, skillData);
  }

  async deleteSkill(id: number): Promise<ApiResponse> {
    return this.request('DELETE', `/skills/${id}`);
  }

  async getSkillsByUserId(userId: number): Promise<ApiResponse<any[]>> {
    return this.request('GET', `/skills/user/${userId}`);
  }

  // Swap endpoints
  async getSwaps(params?: any): Promise<PaginatedResponse<any>> {
    return this.request('GET', '/swaps', null, { params });
  }

  async createSwapRequest(swapData: any): Promise<ApiResponse<any>> {
    return this.request('POST', '/swaps', swapData);
  }

  async updateSwapStatus(id: number, status: string): Promise<ApiResponse<any>> {
    return this.request('PATCH', `/swaps/${id}/status`, { status });
  }

  async getSwapById(id: number): Promise<ApiResponse<any>> {
    return this.request('GET', `/swaps/${id}`);
  }

  async getMySwaps(): Promise<ApiResponse<any[]>> {
    return this.request('GET', '/swaps/my');
  }

  // Message endpoints
  async getMessages(swapId: number): Promise<ApiResponse<any[]>> {
    return this.request('GET', `/messages/${swapId}`);
  }

  async sendMessage(swapId: number, message: string): Promise<ApiResponse<any>> {
    return this.request('POST', `/messages/${swapId}`, { message });
  }

  async markMessagesAsRead(swapId: number): Promise<ApiResponse> {
    return this.request('PATCH', `/messages/${swapId}/read`);
  }

  // Notification endpoints
  async getNotifications(params?: any): Promise<PaginatedResponse<any>> {
    return this.request('GET', '/notifications', null, { params });
  }

  async markNotificationAsRead(id: number): Promise<ApiResponse> {
    return this.request('PATCH', `/notifications/${id}/read`);
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse> {
    return this.request('PATCH', '/notifications/read-all');
  }

  // Rating endpoints
  async createRating(ratingData: any): Promise<ApiResponse<any>> {
    return this.request('POST', '/ratings', ratingData);
  }

  async getRatingsByUserId(userId: number): Promise<ApiResponse<any[]>> {
    return this.request('GET', `/ratings/user/${userId}`);
  }

  // Search endpoints
  async searchSkills(query: string, filters?: any): Promise<ApiResponse<any[]>> {
    return this.request('GET', '/skills/search', null, { 
      params: { q: query, ...filters } 
    });
  }

  async searchUsers(query: string, filters?: any): Promise<ApiResponse<any[]>> {
    return this.request('GET', '/users/search', null, { 
      params: { q: query, ...filters } 
    });
  }

  // Categories endpoints
  async getCategories(): Promise<ApiResponse<any[]>> {
    return this.request('GET', '/categories');
  }

  // Analytics endpoints
  async getAnalytics(): Promise<ApiResponse<any>> {
    return this.request('GET', '/analytics');
  }

  async getUserAnalytics(): Promise<ApiResponse<any>> {
    return this.request('GET', '/analytics/user');
  }

  // File upload endpoints
  async uploadFile(file: File, type: 'profile' | 'skill' | 'attachment'): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return this.request('POST', '/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    return this.request('GET', '/health');
  }

  // Utility methods
  setAuthToken(token: string): void {
    localStorage.setItem('token', token);
  }

  removeAuthToken(): void {
    localStorage.removeItem('token');
  }

  getAuthToken(): string | null {
    return localStorage.getItem('token');
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;