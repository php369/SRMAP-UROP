import { ApiResponse } from '../types';
import { API_BASE_URL, STORAGE_KEYS } from './constants';

// API Client Configuration
class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private pendingRequests: Map<string, Promise<any>> = new Map();

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  // Get auth token from localStorage or sessionStorage
  private getAuthToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) || 
           sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
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
        // Special handling for 429 rate limit
        if (response.status === 429) {
          throw new Error('Too many requests. Please wait a moment and try again.');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }

    const data: ApiResponse<T> = await response.json();

    if (!response.ok) {
      // Special handling for 429 rate limit
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? `${retryAfter} seconds` : 'a moment';
        throw new Error(`Rate limit reached. Please wait ${waitTime} and try again.`);
      }
      throw new Error(data.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return data;
  }

  // Check if error is retryable
  private isRetryableError(error: any): boolean {
    // Network errors
    if (error.message?.includes('network') || error.message?.includes('Failed to fetch')) {
      return true;
    }
    
    // Timeout errors
    if (error.message?.includes('timeout')) {
      return true;
    }
    
    // 5xx server errors (except 501 Not Implemented)
    if (error.status >= 500 && error.status !== 501) {
      return true;
    }
    
    // DO NOT retry 429 - rate limit errors need time to reset
    // Retrying immediately makes the problem worse
    
    return false;
  }

  // Delay helper
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Calculate exponential backoff delay
  private getBackoffDelay(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s
    return Math.min(1000 * Math.pow(2, attempt), 4000);
  }

  // Make API request with retry logic and deduplication
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    retries = 3
  ): Promise<ApiResponse<T>> {
    // Create unique key for request deduplication
    const requestKey = `${options.method || 'GET'}:${endpoint}:${
      options.body instanceof FormData ? 'FormData' : JSON.stringify(options.body || {})
    }`;

    // Check if identical request is already pending
    if (this.pendingRequests.has(requestKey)) {
      console.log(`🔄 Deduplicating request: ${requestKey.substring(0, 50)}...`);
      return this.pendingRequests.get(requestKey)!;
    }

    // Create new request promise
    const requestPromise = (async () => {
      try {
        const url = `${this.baseURL}${endpoint}`;

        // Check if body is FormData to skip Content-Type header
        const isFormData = options.body instanceof FormData;
        const headers = this.buildHeaders(options.headers as Record<string, string>, isFormData);

        const response = await fetch(url, {
          ...options,
          headers,
        });

        return await this.handleResponse<T>(response);
      } catch (error: any) {
        // If retries remaining and error is retryable, retry
        if (retries > 0 && this.isRetryableError(error)) {
          const attempt = 3 - retries;
          const delay = this.getBackoffDelay(attempt);
          
          console.warn(`Request failed, retrying in ${delay}ms... (${retries} retries left)`, {
            endpoint,
            error: error.message,
          });
          
          await this.delay(delay);
          // Remove from pending before retry
          this.pendingRequests.delete(requestKey);
          return this.makeRequest<T>(endpoint, options, retries - 1);
        }
        
        // No more retries or non-retryable error
        throw error;
      } finally {
        // Clean up pending request
        this.pendingRequests.delete(requestKey);
      }
    })();

    // Store pending request
    this.pendingRequests.set(requestKey, requestPromise);
    return requestPromise;
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
