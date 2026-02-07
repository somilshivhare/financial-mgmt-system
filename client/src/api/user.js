import client from './client'

export const getProfile = async () => {
  const response = await client.get('/user/profile')
  return response
}

export const updateProfile = async (profileData) => {
  const response = await client.put('/user/profile', profileData)
  return response
}

export const getSessions = async () => {
  const response = await client.get('/user/sessions')
  return response
}

export const revokeSession = async (sessionId) => {
  const response = await client.delete(`/user/sessions/${sessionId}`)
  return response
}

export const revokeAllSessions = async () => {
  const response = await client.delete('/user/sessions')
  return response
}

export const getLoginHistory = async (limit = 50) => {
  const response = await client.get(`/user/login-history?limit=${limit}`)
  return response
}

export const updatePassword = async (currentPassword, newPassword) => {
  const response = await client.put('/user/password', {
    currentPassword,
    newPassword,
  })
  return response
}

export const getPreferences = async () => {
  const response = await client.get('/user/preferences')
  return response
}

export const setPreference = async (key, value) => {
  const response = await client.put(`/user/preferences/${key}`, { value })
  return response
}

export const uploadProfilePhoto = async (photoFile) => {
  const formData = new FormData()
  formData.append('photo', photoFile)
  
  const response = await client.post('/user/profile/photo', formData, {
    headers: {
      'Content-Type': undefined, // Let browser set the Content-Type with boundary
    },
  })
  return response
}

