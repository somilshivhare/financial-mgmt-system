import client from './client'

export const login = async (email, password) => {
  const { data } = await client.post('/auth/login', { email, password })
  localStorage.setItem('token', data.data.token)
  return data
}

export const register = async (email, password, name, additionalData = {}) => {
  const payload = {
    fullName: name,
    email,
    password,
    roleId: additionalData.roleId || 1,
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

import { clearAllLocalStorage } from '../utils/logout'

export const logout = () => {
  clearAllLocalStorage()
}
