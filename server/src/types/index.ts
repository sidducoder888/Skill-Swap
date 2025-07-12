export interface User {
  id: number;
  email: string;
  name: string;
  location?: string;
  profilePhoto?: string;
  isPublic: boolean;
  availability: string;
  createdAt: Date;
  updatedAt: Date;
  role: 'user' | 'admin';
}

export interface Skill {
  id: number;
  userId: number;
  name: string;
  description: string;
  type: 'offered' | 'wanted';
  level: 'beginner' | 'intermediate' | 'advanced';
  createdAt: Date;
  updatedAt: Date;
}

export interface SwapRequest {
  id: number;
  fromUserId: number;
  toUserId: number;
  offeredSkillId: number;
  wantedSkillId: number;
  message: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface Rating {
  id: number;
  swapId: number;
  fromUserId: number;
  toUserId: number;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface AuthRequest extends Request {
  user?: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  location?: string;
  availability?: string;
}

export interface UpdateProfileRequest {
  name?: string;
  location?: string;
  availability?: string;
  isPublic?: boolean;
  profilePhoto?: string;
}

export interface CreateSkillRequest {
  name: string;
  description: string;
  type: 'offered' | 'wanted';
  level: 'beginner' | 'intermediate' | 'advanced';
}

export interface CreateSwapRequest {
  toUserId: number;
  offeredSkillId: number;
  wantedSkillId: number;
  message: string;
}

export interface UpdateSwapRequest {
  status: 'accepted' | 'rejected' | 'cancelled';
}

export interface CreateRatingRequest {
  swapId: number;
  rating: number;
  comment: string;
} 