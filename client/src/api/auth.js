import client from './client'
import { clearAllLocalStorage } from '../utils/logout'

export const login = async (email, password) => {
  const { data } = await client.post('/auth/login', { email, password })
  localStorage.setItem('token', data.data.token)
  return data
}

// Default role for new registrations: 5 = viewer (NOT admin).
// Roles: 1=admin, 2=finance, 3=operations, 4=sales, 5=viewer
const DEFAULT_REGISTRATION_ROLE_ID = 5

export const register = async (email, password, name, additionalData = {}) => {
  const payload = {
    fullName: name,
    email,
    password,
    roleId: additionalData.roleId ?? DEFAULT_REGISTRATION_ROLE_ID,
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
