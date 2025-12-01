import { ApiResponse } from '../types';
import { API_BASE_URL, STORAGE_KEYS } from './constants';

// API Client Configuration
class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  // Get auth token from localStorage
  private getAuthToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  // Build request headers
  private buildHeaders(customHeaders?: Record<string, string>, skipContentType = false): Record<string, string> {
    const headers: Record<string, string> = {};

    // Only add default headers if not skipping content type (for FormData)
    if (!skipContentType) {
      Object.assign(headers, this.defaultHeaders);
    }

    // Add custom headers
    if (customHeaders) {
      Object.assign(headers, customHeaders);
    }

    const token = this.getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  // Handle API response
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');

    // Handle non-JSON responses (like CSV downloads)
    if (!contentType?.includes('application/json')) {
      if (response.ok) {
        return {
          success: true,
          data: response as any, // For file downloads
        };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }

    const data: ApiResponse<T> = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return data;
  }

  // Make API request
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    // Check if body is FormData to skip Content-Type header
    const isFormData = options.body instanceof FormData;
    const headers = this.buildHeaders(options.headers as Record<string, string>, isFormData);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    return await this.handleResponse<T>(response);
  }

  // HTTP Methods
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    let url = endpoint;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url = `${endpoint}?${queryString}`;
      }
    }

    return this.makeRequest<T>(url, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    const requestOptions: RequestInit = {
      method: 'POST',
      ...options,
    };

    // Handle FormData (for file uploads)
    if (data instanceof FormData) {
      requestOptions.body = data;
      // Don't set Content-Type for FormData, let browser set it with boundary
    } else if (data) {
      requestOptions.body = JSON.stringify(data);
    }

    return this.makeRequest<T>(endpoint, requestOptions);
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

// Create API client instance
export const apiClient = new ApiClient(`${API_BASE_URL}/api/v1`);

// Export as 'api' for backward compatibility
export const api = apiClient;
