import axios, { AxiosError } from 'axios'
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  User,
  Event,
  CreateEventPayload,
  BudgetItem,
  CreateBudgetItemPayload,
  UpdateBudgetItemPayload,
  TimelineItem,
  CreateTimelineItemPayload,
  UpdateTimelineItemPayload,
  VendorItem,
  CreateVendorPayload,
  UpdateVendorPayload,
  ChatMessage,
  SendChatMessagePayload,
  ChatResponse,
} from '../types'

// ─── Axios Instance ───────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

// Request interceptor: attach Bearer token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor: handle 401
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    // FastAPI OAuth2 expects form data
    const formData = new URLSearchParams()
    formData.append('username', payload.email)
    formData.append('password', payload.password)
    const { data } = await apiClient.post<AuthResponse>('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    return data
  },

  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/register', payload)
    return data
  },

  me: async (): Promise<User> => {
    const { data } = await apiClient.get<User>('/auth/me')
    return data
  },
}

// ─── Events ───────────────────────────────────────────────────────────────────

export const eventsApi = {
  list: async (): Promise<Event[]> => {
    const { data } = await apiClient.get<Event[]>('/events')
    return data
  },

  get: async (id: string): Promise<Event> => {
    const { data } = await apiClient.get<Event>(`/events/${id}`)
    return data
  },

  create: async (payload: CreateEventPayload): Promise<Event> => {
    const { data } = await apiClient.post<Event>('/events', payload)
    return data
  },

  update: async (id: string, payload: Partial<CreateEventPayload>): Promise<Event> => {
    const { data } = await apiClient.put<Event>(`/events/${id}`, payload)
    return data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/events/${id}`)
  },

  generateIdeas: async (id: string): Promise<string[]> => {
    const { data } = await apiClient.post<{ ideas: string[] }>(`/events/${id}/generate-ideas`)
    return data.ideas
  },
}

// ─── Budget ───────────────────────────────────────────────────────────────────

export const budgetApi = {
  list: async (eventId: string): Promise<BudgetItem[]> => {
    const { data } = await apiClient.get<BudgetItem[]>(`/events/${eventId}/budget`)
    return data
  },

  create: async (eventId: string, payload: CreateBudgetItemPayload): Promise<BudgetItem> => {
    const { data } = await apiClient.post<BudgetItem>(`/events/${eventId}/budget`, payload)
    return data
  },

  update: async (eventId: string, itemId: string, payload: UpdateBudgetItemPayload): Promise<BudgetItem> => {
    const { data } = await apiClient.put<BudgetItem>(`/events/${eventId}/budget/${itemId}`, payload)
    return data
  },

  delete: async (eventId: string, itemId: string): Promise<void> => {
    await apiClient.delete(`/events/${eventId}/budget/${itemId}`)
  },

  generate: async (eventId: string): Promise<BudgetItem[]> => {
    const { data } = await apiClient.post<BudgetItem[]>(`/events/${eventId}/budget/generate`)
    return data
  },
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

export const timelineApi = {
  list: async (eventId: string): Promise<TimelineItem[]> => {
    const { data } = await apiClient.get<TimelineItem[]>(`/events/${eventId}/timeline`)
    return data
  },

  create: async (eventId: string, payload: CreateTimelineItemPayload): Promise<TimelineItem> => {
    const { data } = await apiClient.post<TimelineItem>(`/events/${eventId}/timeline`, payload)
    return data
  },

  update: async (eventId: string, itemId: string, payload: UpdateTimelineItemPayload): Promise<TimelineItem> => {
    const { data } = await apiClient.put<TimelineItem>(`/events/${eventId}/timeline/${itemId}`, payload)
    return data
  },

  delete: async (eventId: string, itemId: string): Promise<void> => {
    await apiClient.delete(`/events/${eventId}/timeline/${itemId}`)
  },

  generate: async (eventId: string): Promise<TimelineItem[]> => {
    const { data } = await apiClient.post<TimelineItem[]>(`/events/${eventId}/timeline/generate`)
    return data
  },
}

// ─── Vendors ──────────────────────────────────────────────────────────────────

export const vendorsApi = {
  list: async (eventId: string): Promise<VendorItem[]> => {
    const { data } = await apiClient.get<VendorItem[]>(`/events/${eventId}/vendors`)
    return data
  },

  create: async (eventId: string, payload: CreateVendorPayload): Promise<VendorItem> => {
    const { data } = await apiClient.post<VendorItem>(`/events/${eventId}/vendors`, payload)
    return data
  },

  update: async (eventId: string, vendorId: string, payload: UpdateVendorPayload): Promise<VendorItem> => {
    const { data } = await apiClient.put<VendorItem>(`/events/${eventId}/vendors/${vendorId}`, payload)
    return data
  },

  delete: async (eventId: string, vendorId: string): Promise<void> => {
    await apiClient.delete(`/events/${eventId}/vendors/${vendorId}`)
  },

  generate: async (eventId: string): Promise<VendorItem[]> => {
    const { data } = await apiClient.post<VendorItem[]>(`/events/${eventId}/vendors/generate`)
    return data
  },
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export const chatApi = {
  getHistory: async (eventId: string): Promise<ChatMessage[]> => {
    const { data } = await apiClient.get<ChatMessage[]>(`/events/${eventId}/chat`)
    return data
  },

  sendMessage: async (eventId: string, payload: SendChatMessagePayload): Promise<ChatResponse> => {
    const { data } = await apiClient.post<ChatResponse>(`/events/${eventId}/chat`, payload)
    return data
  },

  clearHistory: async (eventId: string): Promise<void> => {
    await apiClient.delete(`/events/${eventId}/chat`)
  },
}

// ─── Error Helper ─────────────────────────────────────────────────────────────

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) return detail.map((d: { msg: string }) => d.msg).join(', ')
  }
  if (error instanceof Error) return error.message
  return 'An unexpected error occurred'
}
