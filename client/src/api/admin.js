import client from './client'

export const getAdminUsers = async () => {
  const response = await client.get('/admin/users')
  return response
}

export const getAdminLoginHistory = async (limit = 50) => {
  const response = await client.get(`/admin/login-history?limit=${limit}`)
  return response
}
