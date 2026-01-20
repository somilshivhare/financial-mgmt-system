import client from './client'

// Mock data for development
const mockUsers = {
  'test@example.com': { password: 'password123', id: '1', name: 'Test User' },
}

export const login = async (email, password) => {
  try {
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const user = mockUsers[email]
    if (!user || user.password !== password) {
      throw new Error('Invalid credentials')
    }
    
    const token = 'mock-jwt-token-' + Date.now()
    localStorage.setItem('token', token)
    
    return {
      data: {
        token,
        user: { id: user.id, email, name: user.name },
      },
    }
  } catch (error) {
    throw error
  }
}

export const register = async (email, password, name, additionalData = {}) => {
  try {
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 500))
    
    if (mockUsers[email]) {
      throw new Error('Email already exists')
    }
    
    const userId = Math.random().toString(36).substr(2, 9)
    mockUsers[email] = { 
      password, 
      id: userId, 
      name,
      ...additionalData,
    }
    
    const token = 'mock-jwt-token-' + Date.now()
    localStorage.setItem('token', token)
    
    return {
      data: {
        token,
        user: { 
          id: userId, 
          email, 
          name,
          companyName: additionalData.companyName,
          mobileNumber: additionalData.mobileNumber,
          role: additionalData.role,
        },
      },
    }
  } catch (error) {
    throw error
  }
}

export const logout = () => {
  localStorage.removeItem('token')
}
