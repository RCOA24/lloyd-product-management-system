import axios from 'axios'

export interface LoginCredentials {
  username: string
  password: string
}

export interface LoginUser {
  id: number
  username: string
  fullName: string
  role: string
}

export interface LoginResponse {
  accessToken: string
  expiresAtUtc: string
  user: LoginUser
}

export interface Category {
  id: number
  name: string
  description?: string
}

export interface Product {
  id: number
  productName: string
  genericName?: string
  categoryId: number
  categoryName: string
  dosageForm: string
  strength?: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt?: string
}

export interface ProductWriteRequest {
  productName: string
  genericName?: string
  categoryId: number
  dosageForm: string
  strength?: string
  description?: string
}

export interface NamedCount {
  name: string
  count: number
}

export interface ProductSummaryReport {
  totalProducts: number
  activeProducts: number
  inactiveProducts: number
  productsByCategory: NamedCount[]
  productsByDosageForm: NamedCount[]
}

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('lloyd_access_token') ?? localStorage.getItem('lloyd_access_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const responseMessage = error.response?.data?.message

    if (typeof responseMessage === 'string') {
      return responseMessage
    }
  }

  return fallback
}

export async function login(credentials: LoginCredentials) {
  const response = await api.post<LoginResponse>('/auth/login', credentials)
  return response.data
}

export async function getCategories() {
  const response = await api.get<Category[]>('/categories')
  return response.data
}

export async function getProducts(params?: {
  search?: string
  categoryId?: number
}) {
  const response = await api.get<Product[]>('/products', { params })
  return response.data
}

export async function createProduct(payload: ProductWriteRequest) {
  const response = await api.post<Product>('/products', payload)
  return response.data
}

export async function updateProduct(id: number, payload: ProductWriteRequest) {
  const response = await api.put<Product>(`/products/${id}`, payload)
  return response.data
}

export async function deleteProduct(id: number) {
  await api.delete(`/products/${id}`)
}

export async function getProductSummary() {
  const response = await api.get<ProductSummaryReport>('/reports/products/summary')
  return response.data
}
