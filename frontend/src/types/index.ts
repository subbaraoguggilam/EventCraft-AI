// ─── Enums ────────────────────────────────────────────────────────────────────

export type EventType = 'wedding' | 'birthday' | 'community'

export type EventStatus = 'planning' | 'confirmed' | 'completed' | 'cancelled'

export type Priority = 'low' | 'medium' | 'high'

export type VendorStatus = 'pending' | 'contacted' | 'confirmed' | 'cancelled'

export type VendorType =
  | 'catering'
  | 'photography'
  | 'venue'
  | 'music'
  | 'decoration'
  | 'transportation'
  | 'other'

// ─── Core Models ──────────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  full_name: string
  created_at: string
}

export interface Event {
  id: string
  title: string
  event_type: EventType
  date: string
  venue: string
  guest_count: number
  budget: number
  description: string
  status: EventStatus
  ai_ideas: string[]
  owner_id: string
  created_at: string
  updated_at: string
}

export interface BudgetItem {
  id: string
  event_id: string
  category: string
  description: string
  estimated_cost: number
  actual_cost: number | null
  paid: boolean
  created_at: string
  updated_at: string
}

export interface TimelineItem {
  id: string
  event_id: string
  title: string
  description: string
  due_date: string
  priority: Priority
  completed: boolean
  created_at: string
  updated_at: string
}

export interface VendorItem {
  id: string
  event_id: string
  vendor_type: VendorType
  name: string
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  status: VendorStatus
  price: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  event_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

// ─── API Payloads ─────────────────────────────────────────────────────────────

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  full_name: string
  email: string
  password: string
}

export interface CreateEventPayload {
  title: string
  event_type: EventType
  date: string
  venue: string
  guest_count: number
  budget: number
  description: string
}

export interface CreateBudgetItemPayload {
  category: string
  description: string
  estimated_cost: number
  actual_cost?: number | null
  paid?: boolean
}

export interface UpdateBudgetItemPayload extends Partial<CreateBudgetItemPayload> {}

export interface CreateTimelineItemPayload {
  title: string
  description: string
  due_date: string
  priority: Priority
  completed?: boolean
}

export interface UpdateTimelineItemPayload extends Partial<CreateTimelineItemPayload> {}

export interface CreateVendorPayload {
  vendor_type: VendorType
  name: string
  contact_name?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  status?: VendorStatus
  price?: number | null
  notes?: string | null
}

export interface UpdateVendorPayload extends Partial<CreateVendorPayload> {}

export interface SendChatMessagePayload {
  message: string
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export interface ApiError {
  detail: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
}

export interface GenerateIdeasResponse {
  ideas: string[]
}

export interface GenerateBudgetResponse {
  items: Omit<BudgetItem, 'id' | 'event_id' | 'created_at' | 'updated_at'>[]
}

export interface GenerateTimelineResponse {
  items: Omit<TimelineItem, 'id' | 'event_id' | 'created_at' | 'updated_at'>[]
}

export interface GenerateVendorsResponse {
  vendors: Omit<VendorItem, 'id' | 'event_id' | 'created_at' | 'updated_at'>[]
}

export interface ChatResponse {
  message: ChatMessage
  response: ChatMessage
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────

export interface NavItem {
  label: string
  href: string
  icon?: string
}

export interface TabItem {
  id: string
  label: string
}

export interface StatsCard {
  label: string
  value: string | number
  icon: string
  color: string
}
