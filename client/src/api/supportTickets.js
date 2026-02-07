import client from './client'

export const createTicket = async (ticketData) => {
  const formData = new FormData()
  
  formData.append('category', ticketData.category)
  formData.append('priority', ticketData.priority)
  formData.append('subject', ticketData.subject)
  formData.append('description', ticketData.description)
  
  if (ticketData.attachments && ticketData.attachments.length > 0) {
    ticketData.attachments.forEach((file, index) => {
      formData.append(`attachments[${index}]`, file)
    })
  }
  
  const response = await client.post('/support-tickets', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

export const createTicketJSON = async (ticketData) => {
  const response = await client.post('/support-tickets', ticketData)
  return response.data
}

export const listTickets = async (filters = {}) => {
  const params = new URLSearchParams()
  
  if (filters.status) params.append('status', filters.status)
  if (filters.priority) params.append('priority', filters.priority)
  if (filters.category) params.append('category', filters.category)
  if (filters.assignedTo) params.append('assignedTo', filters.assignedTo)
  if (filters.limit) params.append('limit', filters.limit)
  if (filters.offset) params.append('offset', filters.offset)
  
  const response = await client.get(`/support-tickets?${params.toString()}`)
  return response.data
}

export const getTicket = async (ticketId) => {
  const response = await client.get(`/support-tickets/${ticketId}`)
  return response.data
}

export const addReply = async (ticketId, message, isInternal = false) => {
  const response = await client.post(`/support-tickets/${ticketId}/replies`, {
    message,
    isInternal,
  })
  return response.data
}

export const updateStatus = async (ticketId, status, notes = null) => {
  const response = await client.patch(`/support-tickets/${ticketId}/status`, {
    status,
    notes,
  })
  return response.data
}

export const assignTicket = async (ticketId, assignedTo) => {
  const response = await client.patch(`/support-tickets/${ticketId}/assign`, {
    assignedTo,
  })
  return response.data
}

export const updatePriority = async (ticketId, priority) => {
  const response = await client.patch(`/support-tickets/${ticketId}/priority`, {
    priority,
  })
  return response.data
}

