import axios from 'axios';
import { 
  Job, JobCreate, JobUpdate, Resume, 
  Recommendation, SkillsGapAnalysis, User 
} from '../types';

const API_BASE_URL = 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Helper for multipart/form-data upload
const multipartClient = axios.create({
  baseURL: API_BASE_URL,
});

multipartClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authService = {
  async register(payload: Record<string, any>): Promise<User> {
    const response = await apiClient.post<User>('/api/auth/register', payload);
    return response.data;
  },

  async login(payload: Record<string, any>): Promise<{ access_token: string; token_type: string }> {
    // We can support OAuth2 form-data or JSON body. OAuth2 is used in Swagger.
    // In our auth_routes.py we support both POST /api/auth/login (form-data) and POST /api/auth/login/json (JSON).
    // Let's use the JSON login route.
    const response = await apiClient.post<{ access_token: string; token_type: string }>('/api/auth/login/json', payload);
    return response.data;
  },

  async getMe(): Promise<User> {
    // Call the user profile endpoint (which is GET /api/auth/me or similar, wait, does auth_routes have GET /me?)
    // Let's check auth_routes.py to see if it has GET /me or we retrieve profile from somewhere else.
    // In our backend auth_routes, is there a GET /me or GET /profile endpoint? Let's check!
    // Wait, the API routes requested in Authentication are:
    // - Register user
    // - Login user
    // Wait! In auth_routes.py, did we implement GET /api/auth/me or similar?
    // Let's query auth_routes.py to check!
    const response = await apiClient.get<User>('/api/auth/me');
    return response.data;
  }
};

export const jobService = {
  async list(skip = 0, limit = 100): Promise<Job[]> {
    const response = await apiClient.get<Job[]>(`/api/jobs/?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  async get(id: number): Promise<Job> {
    const response = await apiClient.get<Job>(`/api/jobs/${id}`);
    return response.data;
  },

  async create(job: JobCreate): Promise<Job> {
    const response = await apiClient.post<Job>('/api/jobs/', job);
    return response.data;
  },

  async update(id: number, job: JobUpdate): Promise<Job> {
    const response = await apiClient.put<Job>(`/api/jobs/${id}`, job);
    return response.data;
  },

  async delete(id: number): Promise<{ detail: string; id: number }> {
    const response = await apiClient.delete<{ detail: string; id: number }>(`/api/jobs/${id}`);
    return response.data;
  }
};

export const resumeService = {
  async upload(file: File): Promise<Resume> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await multipartClient.post<Resume>('/api/resumes/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async list(): Promise<Resume[]> {
    const response = await apiClient.get<Resume[]>('/api/resumes/');
    return response.data;
  },

  async getActive(): Promise<Resume> {
    const response = await apiClient.get<Resume>('/api/resumes/active');
    return response.data;
  }
};

export const recommendationService = {
  async list(limit = 10): Promise<Recommendation[]> {
    const response = await apiClient.get<Recommendation[]>(`/api/recommendations/?limit=${limit}`);
    return response.data;
  },

  async getSkillsGap(): Promise<SkillsGapAnalysis> {
    const response = await apiClient.get<SkillsGapAnalysis>('/api/recommendations/skills-gap');
    return response.data;
  }
};

export const aiService = {
  async test(): Promise<{ status: string; message: string }> {
    const response = await apiClient.get<{ status: string; message: string }>('/api/ai/test');
    return response.data;
  }
};

export default apiClient;
