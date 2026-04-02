import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import * as dashboardApi from '../api/dashboard'
import { generateResponse, generateBusinessSummary, generatePageContext } from '../services/aiAssistantService'

const AIAssistantContext = createContext(null)

export const useAIAssistant = () => {
  const context = useContext(AIAssistantContext)
  if (!context) {
    throw new Error('useAIAssistant must be used within AIAssistantProvider')
  }
  return context
}

export const AIAssistantProvider = ({ children }) => {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [hasSeenIntroduction, setHasSeenIntroduction] = useState(() => {
    try {
      return localStorage.getItem('aiAssistant_introductionSeen') === 'true'
    } catch {
      return false
    }
  })
  const [isLoading, setIsLoading] = useState(false)
  const [dashboardData, setDashboardData] = useState(null)
  const [pageData, setPageData] = useState(null)
  const [conversation, setConversation] = useState([])

  const loadDashboardData = useCallback(async () => {
    if (isLoading) return
    
    try {
      setIsLoading(true)
      const response = await dashboardApi.getDashboardData({})
      
      if (response && typeof response === 'object') {
        setDashboardData(response.data || response)
      } else {
        console.warn('[AIAssistant] Invalid dashboard data response:', response)
      }
    } catch (error) {
      console.error('[AIAssistant] Failed to load dashboard data (non-critical):', error)
      setDashboardData(null)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading])

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (!user) return

    let mounted = true
    let intervalId = null
    
    const loadWithRetry = async (attempt = 0) => {
      if (!mounted) return
      
      try {
        await loadDashboardData()
        if (mounted && attempt === 0) {
          intervalId = setInterval(() => {
            if (mounted) {
              loadDashboardData().catch(err => {
                console.error('[AIAssistant] Periodic dashboard data load failed:', err)
              })
            }
          }, 5 * 60 * 1000) // Refresh every 5 minutes
        }
      } catch (error) {
        console.error('[AIAssistant] Failed to load dashboard data:', error)
      }
    }
    
    loadWithRetry()
    
    return () => {
      mounted = false
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, []) // Empty deps - only run on mount

  useEffect(() => {
    if (location.pathname === '/dashboard' && !hasSeenIntroduction) {
      const timer = setTimeout(() => {
        setHasSeenIntroduction(true)
        try {
          localStorage.setItem('aiAssistant_introductionSeen', 'true')
        } catch {
        }
        setConversation([{
          id: 'welcome',
          type: 'assistant',
          message: "Hello! I'm your AI business assistant. I'm here to help you understand your finances, navigate the system, and make informed decisions. You can ask me things like 'Give me a summary' or 'What's overdue?' at any time.",
          timestamp: new Date(),
        }])
      }, 2000) // Show after 2 seconds
      return () => clearTimeout(timer)
    }
  }, [location.pathname, hasSeenIntroduction])

  const handleQuery = useCallback(async (query) => {
    if (!query.trim()) return

    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      message: query,
      timestamp: new Date(),
    }
    setConversation(prev => [...prev, userMessage])

    setIsLoading(true)
    try {
      const context = {
        pathname: location.pathname,
        dashboardData,
        pageData,
      }

      const response = generateResponse(query, context)
      
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        message: response.response,
        insights: response.insights || [],
        recommendations: response.recommendations || [],
        timestamp: new Date(),
      }
      
      setConversation(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error generating AI response:', error)
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        message: "I apologize, but I encountered an error processing your request. Please try again or rephrase your question.",
        timestamp: new Date(),
      }
      setConversation(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [location.pathname, dashboardData, pageData])

  const getQuickSummary = useCallback(() => {
    if (!dashboardData) {
      return {
        summary: "Loading your business data...",
        insights: [],
        recommendations: [],
      }
    }
    return generateBusinessSummary(dashboardData, location.pathname)
  }, [dashboardData, location.pathname])

  const getPageGuidance = useCallback(() => {
    return generatePageContext(location.pathname, pageData)
  }, [location.pathname, pageData])

  const clearConversation = useCallback(() => {
    setConversation([])
  }, [])

  const value = {
    isOpen,
    setIsOpen,
    isLoading,
    dashboardData,
    pageData,
    setPageData,
    conversation,
    handleQuery,
    getQuickSummary,
    getPageGuidance,
    clearConversation,
    hasSeenIntroduction,
  }

  return (
    <AIAssistantContext.Provider value={value}>
      {children}
    </AIAssistantContext.Provider>
  )
}

