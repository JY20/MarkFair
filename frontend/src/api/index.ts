import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

// Central axios instance with sensible defaults.
// Base URL is configurable via Vite env; falls back to local docker api.
const baseURL = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE_URL) || "http://localhost:8000";

const apiClient: AxiosInstance = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: false,
});

// Optional auth token setter (kept minimal, does nothing unless used by callers)
export function setAuthToken(token: string | null): void {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
}

// Basic interceptors to normalize responses and errors.
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    // Forward the error as-is so callers can handle gracefully
    return Promise.reject(error);
  }
);

// Generic request wrapper returning typed response data (response.data by default)
export async function request<T = unknown>(config: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.request<T>(config);
  return response.data as T;
}

// Convenience helpers for common HTTP verbs
export const http = {
  get: async <T = unknown>(url: string, config?: AxiosRequestConfig) => request<T>({ ...config, method: "GET", url }),
  post: async <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => request<T>({ ...config, method: "POST", url, data }),
  put: async <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => request<T>({ ...config, method: "PUT", url, data }),
  patch: async <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => request<T>({ ...config, method: "PATCH", url, data }),
  delete: async <T = unknown>(url: string, config?: AxiosRequestConfig) => request<T>({ ...config, method: "DELETE", url }),
};

// Unified API surface for endpoint paths to enable easy mocking.
// Keep it minimal – callers can import { Api } and call Api.* with paths
// derived from the OpenAPI docs at http://localhost:8000/docs#/
export const Api = {
  // Example usages (unopinionated, adapt to your docs):
  // listTasks: () => http.get<Task[]>("/tasks"),
  // getTask: (id: string) => http.get<Task>(`/tasks/${id}`),
  // createTask: (payload: CreateTaskInput) => http.post<Task>("/tasks", payload),

  // Generic passthrough for quick mocking based on Swagger paths
  get: http.get,
  post: http.post,
  put: http.put,
  patch: http.patch,
  delete: http.delete,
};

export default apiClient;


