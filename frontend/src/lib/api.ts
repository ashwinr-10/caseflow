const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
  };
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (token && typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    } else if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            message: data.error?.message || 'An error occurred',
          },
        };
      }

      return {
        success: true,
        data: data.data || data,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Network error',
        },
      };
    }
  }

  // Auth
  async login(email: string, password: string) {
    const response = await this.request<{
      user: any;
      token: string;
      refreshToken: string;
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async register(email: string, password: string, name?: string, role?: string) {
    const response = await this.request<{
      user: any;
      token: string;
      refreshToken: string;
    }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, role }),
    });

    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async getCurrentUser() {
    return this.request<any>('/api/auth/me');
  }

  // Import
  async uploadCSV(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${this.baseUrl}/api/import/upload`;
    const headers: HeadersInit = {};

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: {
          message: data.error?.message || 'Upload failed',
        },
      };
    }

    return {
      success: true,
      data: data.data,
    };
  }

  async batchCreateCases(rows: any[], fileName: string) {
    return this.request<{
      importJobId: string;
      results: {
        success: any[];
        failed: any[];
      };
      summary: {
        total: number;
        success: number;
        failed: number;
      };
    }>('/api/import/batch', {
      method: 'POST',
      body: JSON.stringify({ rows, fileName }),
    });
  }

  // Cases
  async getCases(params?: {
    cursor?: string;
    limit?: number;
    status?: string;
    category?: string;
    priority?: string;
    assigneeId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    const queryString = queryParams.toString();
    return this.request<{
      cases: any[];
      pagination: {
        nextCursor: string | null;
        hasMore: boolean;
      };
    }>(`/api/cases${queryString ? `?${queryString}` : ''}`);
  }

  async getCase(id: string) {
    return this.request<any>(`/api/cases/${id}`);
  }

  async updateCase(id: string, updates: any) {
    return this.request<any>(`/api/cases/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async addCaseNote(id: string, content: string) {
    return this.request<any>(`/api/cases/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }
}

export const apiClient = new ApiClient(API_URL);

