import client from './client'
import { clearAllLocalStorage } from '../utils/logout'

export const login = async (email, password) => {
  const { data } = await client.post('/auth/login', { email, password })
  return data
}

export const register = async (email, password, name, additionalData = {}) => {
  const payload = {
    fullName: name,
    email,
    password,
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

export const logout = async () => {
  try {
    await client.post('/auth/logout')
  } catch (_) {
    // Ignore network errors; cookie may already be cleared
  }
  clearAllLocalStorage()
}
