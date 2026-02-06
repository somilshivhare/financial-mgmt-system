import client from './client'
import { clearAllLocalStorage } from '../utils/logout'

export const login = async (email, password) => {
  const { data } = await client.post('/auth/login', { email, password })
  localStorage.setItem('token', data.data.token)
  return data
}

// All new registrations automatically get 'user' role (role_id=2)
// Admin role cannot be assigned via public registration
// Backend will assign default role if roleId is not provided
export const register = async (email, password, name, additionalData = {}) => {
  const payload = {
    fullName: name,
    email,
    password,
    // roleId is not sent - backend will default to 'user' role (role_id=2)
  }
  const { data } = await client.post('/auth/register', payload)
  return data
}

export const me = async () => {
  const { data } = await client.get('/auth/me')
  return data
}

export const requestPasswordReset = async (email) => {
  const { data } = await client.post('/auth/request-password-reset', { email })
  return data
}

export const resetPassword = async (token, newPassword) => {
  const { data } = await client.post('/auth/reset-password', { token, newPassword })
  return data
}

export const logout = () => {
  clearAllLocalStorage()
}
