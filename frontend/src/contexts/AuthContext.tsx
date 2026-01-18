import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api } from '../services/api'
import type { User } from '../types'
import toast from 'react-hot-toast'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<AuthResponse>
  register: (data: RegisterData) => Promise<AuthResponse>
  logout: () => void
  updateUser: (data: Partial<User>) => Promise<void>
}

interface AuthResponse {
  user: User
  tokens: {
    access: string
    refresh: string
  }
}

interface RegisterData {
  username: string
  email: string
  password: string
  password2: string
  first_name?: string
  last_name?: string
  phone_number?: string
  role: 'OWNER' | 'CUSTOMER'
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    setUser(null)
    toast.success('Logged out successfully')
  }

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user')
    const accessToken = localStorage.getItem('access_token')

    if (storedUser && accessToken) {
      try {
        setUser(JSON.parse(storedUser))
        // Verify token is still valid by fetching profile
        api.getProfile()
          .then((userData) => {
            setUser(userData)
            localStorage.setItem('user', JSON.stringify(userData))
          })
          .catch(() => {
            // Token invalid, logout
            logout()
          })
          .finally(() => setLoading(false))
      } catch {
        logout()
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (username: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await api.login(username, password)
      if (response && response.tokens && response.user) {
        localStorage.setItem('access_token', response.tokens.access)
        localStorage.setItem('refresh_token', response.tokens.refresh)
        localStorage.setItem('user', JSON.stringify(response.user))
        setUser(response.user)
        toast.success('Login successful!')
        return response
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.error || 
                          error.message || 
                          'Login failed'
      toast.error(errorMessage)
      throw error
    }
  }

  const register = async (data: RegisterData): Promise<AuthResponse> => {
    try {
      const response = await api.register(data)
      if (response && response.tokens && response.user) {
        localStorage.setItem('access_token', response.tokens.access)
        localStorage.setItem('refresh_token', response.tokens.refresh)
        localStorage.setItem('user', JSON.stringify(response.user))
        setUser(response.user)
        toast.success('Registration successful!')
        return response
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail || 
                          error.message || 
                          'Registration failed'
      toast.error(errorMessage)
      throw error
    }
  }

  const updateUser = async (data: Partial<User>) => {
    try {
      const updatedUser = await api.updateProfile(data)
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
      toast.success('Profile updated successfully!')
    } catch (error) {
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
