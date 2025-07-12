// User types
export interface User {
  id: number;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  profilePhoto?: string;
  bio?: string;
  location?: string;
  role: 'user' | 'admin' | 'moderator';
  isOnline: boolean;
  averageRating: number;
  completedSwaps: number;
  createdAt: string;
  updatedAt: string;
}

// Skill types
export interface Skill {
  id: number;
  userId: number;
  categoryId: number;
  name: string;
  description: string;
  type: 'offered' | 'wanted';
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  experienceYears: number;
  isActive: boolean;
  priority: number;
  tags: string[];
  verificationStatus: 'pending' | 'verified' | 'rejected';
  endorsementCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

// Category types
export interface Category {
  id: number;
  name: string;
  description: string;
  icon?: string;
  color?: string;
  parentId?: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// Swap types
export interface SwapRequest {
  id: number;
  fromUserId: number;
  toUserId: number;
  offeredSkillId: number;
  wantedSkillId: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';
  scheduledDate?: string;
  duration?: number;
  meetingType: 'online' | 'in-person' | 'both';
  meetingLocation?: string;
  meetingLink?: string;
  notes?: string;
  priority: 'low' | 'medium' | 'high';
  expiresAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Message types
export interface Message {
  id: number;
  swapId: number;
  fromUserId: number;
  toUserId: number;
  message: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  attachmentUrl?: string;
  read: boolean;
  createdAt: string;
}

// Notification types
export interface Notification {
  id: number;
  userId: number;
  type: 'swap_request' | 'swap_accepted' | 'swap_rejected' | 'swap_completed' | 'rating_received' | 'skill_endorsed' | 'system_message';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  expiresAt?: string;
  createdAt: string;
}

// Rating types
export interface Rating {
  id: number;
  swapId: number;
  fromUserId: number;
  toUserId: number;
  skillId: number;
  rating: number;
  comment?: string;
  isPublic: boolean;
  categories?: {
    communication: number;
    knowledge: number;
    punctuality: number;
  };
  wouldRecommend: boolean;
  createdAt: string;
}

// Search and filter types
export interface SearchFilters {
  query?: string;
  category?: number;
  location?: string;
  level?: string;
  type?: 'offered' | 'wanted';
  online?: boolean;
  rating?: number;
  sortBy?: 'name' | 'rating' | 'date' | 'experience';
  sortOrder?: 'asc' | 'desc';
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  name: string;
  location?: string;
  bio?: string;
}

export interface ProfileUpdateForm {
  firstName?: string;
  lastName?: string;
  name?: string;
  location?: string;
  bio?: string;
  profilePhoto?: string;
}

export interface SkillForm {
  name: string;
  description: string;
  categoryId: number;
  type: 'offered' | 'wanted';
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  experienceYears: number;
  tags: string[];
  priority: number;
}

export interface SwapRequestForm {
  toUserId: number;
  offeredSkillId: number;
  wantedSkillId: number;
  message?: string;
  scheduledDate?: string;
  duration?: number;
  meetingType: 'online' | 'in-person' | 'both';
  meetingLocation?: string;
  meetingLink?: string;
}

export interface MessageForm {
  message: string;
  messageType?: 'text' | 'image' | 'file';
  attachmentUrl?: string;
}

export interface RatingForm {
  rating: number;
  comment?: string;
  isPublic: boolean;
  categories?: {
    communication: number;
    knowledge: number;
    punctuality: number;
  };
  wouldRecommend: boolean;
}

// Component props types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Theme types
export interface ThemeMode {
  mode: 'light' | 'dark';
  toggleMode: () => void;
}

// WebSocket types
export interface WebSocketEvents {
  'swap:request': (data: SwapRequest) => void;
  'swap:accepted': (data: SwapRequest) => void;
  'swap:rejected': (data: SwapRequest) => void;
  'swap:completed': (data: SwapRequest) => void;
  'message:new': (data: Message) => void;
  'message:read': (data: { messageId: number }) => void;
  'notification:new': (data: Notification) => void;
  'notification:read': (data: { notificationId: number }) => void;
  'user:online': (data: { userId: number }) => void;
  'user:offline': (data: { userId: number }) => void;
  'user:updated': (data: { userId: number; updates: Partial<User> }) => void;
  'system:maintenance': (data: { message: string }) => void;
  'system:update': (data: { message: string }) => void;
}

// Error types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  message: string;
  errors?: ValidationError[];
  statusCode?: number;
}

// Analytics types
export interface UserAnalytics {
  totalSwaps: number;
  completedSwaps: number;
  averageRating: number;
  skillsOffered: number;
  skillsWanted: number;
  endorsements: number;
  profileViews: number;
  responseTime: number;
}

export interface PlatformAnalytics {
  totalUsers: number;
  activeUsers: number;
  totalSwaps: number;
  completedSwaps: number;
  totalSkills: number;
  popularCategories: Array<{
    category: string;
    count: number;
  }>;
  userGrowth: Array<{
    date: string;
    users: number;
  }>;
  swapTrends: Array<{
    date: string;
    swaps: number;
  }>;
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = 
  Pick<T, Exclude<keyof T, Keys>> & 
  { [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>> }[Keys];

// Export all types are defined above