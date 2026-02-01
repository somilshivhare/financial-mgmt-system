import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAIAssistant } from '../contexts/AIAssistantContext'
import {
  MessageCircle,
  X,
  Send,
  Minimize2,
  Maximize2,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Info,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import '../styles/AIAssistant.css'

export default function AIAssistant() {
  const navigate = useNavigate()
  const {
    isOpen,
    setIsOpen,
    isLoading,
    conversation,
    handleQuery,
    clearConversation,
  } = useAIAssistant()

  const [input, setInput] = useState('')
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [conversation, isOpen, isMinimized])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, isMinimized])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    handleQuery(input)
    setInput('')
  }

  const handleQuickAction = (action) => {
    if (action.path) {
      navigate(action.path)
      setIsOpen(false)
    }
  }

  const formatMessage = (message) => {
    // Convert markdown-style formatting to HTML
    let formatted = message
      // Bold text (handle multiple occurrences per line)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Split by newlines
      .split('\n')
      .map((line) => {
        line = line.trim()
        if (!line) return '<br>'
        // Bullet points
        if (line.startsWith('•')) {
          return `<div class="ai-message-bullet">${line}</div>`
        }
        return `<div>${line}</div>`
      })
      .join('')
    
    return formatted
  }

  if (!isOpen) {
    return (
      <button
        className="ai-assistant-toggle"
        onClick={() => setIsOpen(true)}
        aria-label="Open AI Assistant"
        title="AI Assistant"
      >
        <Sparkles className="ai-assistant-toggle-icon" />
      </button>
    )
  }

  return (
    <div className={`ai-assistant ${isMinimized ? 'minimized' : ''}`}>
      {/* Header */}
      <div className="ai-assistant-header">
        <div className="ai-assistant-header-content">
          <Sparkles className="ai-assistant-header-icon" />
          <div className="ai-assistant-header-text">
            <h3>AI Assistant</h3>
            <p>Your business copilot</p>
          </div>
        </div>
        <div className="ai-assistant-header-actions">
          <button
            className="ai-assistant-header-button"
            onClick={() => setIsMinimized(!isMinimized)}
            aria-label={isMinimized ? 'Maximize' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 /> : <Minimize2 />}
          </button>
          <button
            className="ai-assistant-header-button"
            onClick={() => setIsOpen(false)}
            aria-label="Close"
          >
            <X />
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="ai-assistant-messages">
            {conversation.length === 0 ? (
              <div className="ai-assistant-empty">
                <Sparkles className="ai-assistant-empty-icon" />
                <p>Ask me anything about your business!</p>
                <div className="ai-assistant-suggestions">
                  <button
                    className="ai-assistant-suggestion"
                    onClick={() => handleQuery('Give me a summary')}
                  >
                    Give me a summary
                  </button>
                  <button
                    className="ai-assistant-suggestion"
                    onClick={() => handleQuery('What is overdue?')}
                  >
                    What's overdue?
                  </button>
                  <button
                    className="ai-assistant-suggestion"
                    onClick={() => handleQuery('How much is outstanding?')}
                  >
                    Total outstanding?
                  </button>
                  <button
                    className="ai-assistant-suggestion"
                    onClick={() => handleQuery('How do I create an invoice?')}
                  >
                    How to create invoice?
                  </button>
                  <button
                    className="ai-assistant-suggestion"
                    onClick={() => handleQuery('How do I record a payment?')}
                  >
                    How to record payment?
                  </button>
                  <button
                    className="ai-assistant-suggestion"
                    onClick={() => handleQuery('How do I create a PO?')}
                  >
                    How to create PO?
                  </button>
                  <button
                    className="ai-assistant-suggestion"
                    onClick={() => handleQuery('Take me to collection plan')}
                  >
                    Open Collection Plan
                  </button>
                  <button
                    className="ai-assistant-suggestion"
                    onClick={() => handleQuery('Take me to master data')}
                  >
                    Open Master Data
                  </button>
                  <button
                    className="ai-assistant-suggestion"
                    onClick={() => handleQuery('What can I do here?')}
                  >
                    What can I do here?
                  </button>
                  <button
                    className="ai-assistant-suggestion"
                    onClick={() => handleQuery('Show my alerts')}
                  >
                    Show my alerts
                  </button>
                  <button
                    className="ai-assistant-suggestion"
                    onClick={() => handleQuery('Open reports')}
                  >
                    Open Reports
                  </button>
                </div>
              </div>
            ) : (
              <div className="ai-assistant-messages-list">
                {conversation.map((msg) => (
                  <div key={msg.id} className={`ai-message ai-message-${msg.type}`}>
                    {msg.type === 'assistant' && (
                      <div className="ai-message-avatar">
                        <Sparkles />
                      </div>
                    )}
                    <div className="ai-message-content">
                      <div
                        className="ai-message-text"
                        dangerouslySetInnerHTML={{ __html: formatMessage(msg.message) }}
                      />
                      
                      {/* Insights */}
                      {msg.insights && msg.insights.length > 0 && (
                        <div className="ai-message-insights">
                          {msg.insights.map((insight, i) => (
                            <div
                              key={i}
                              className={`ai-insight ai-insight-${insight.type}`}
                            >
                              {insight.type === 'warning' && <AlertTriangle />}
                              {insight.type === 'success' && <CheckCircle2 />}
                              {insight.type === 'info' && <Info />}
                              <div>
                                <strong>{insight.title}</strong>
                                <p>{insight.message}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Recommendations */}
                      {msg.recommendations && msg.recommendations.length > 0 && (
                        <div className="ai-message-recommendations">
                          {msg.recommendations.map((rec, i) => (
                            <button
                              key={i}
                              className={`ai-recommendation ai-recommendation-${rec.priority}`}
                              onClick={() => handleQuickAction(rec)}
                            >
                              <div>
                                <strong>{rec.action}</strong>
                                <p>{rec.description}</p>
                              </div>
                              <ArrowRight />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="ai-message ai-message-assistant">
                    <div className="ai-message-avatar">
                      <Sparkles />
                    </div>
                    <div className="ai-message-content">
                      <div className="ai-message-loading">
                        <Loader2 className="ai-loading-spinner" />
                        <span>Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <form className="ai-assistant-input-form" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              className="ai-assistant-input"
              placeholder="Ask me anything about your business..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="submit"
              className="ai-assistant-send"
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
            >
              <Send />
            </button>
          </form>

          {/* Footer Actions */}
          {conversation.length > 0 && (
            <div className="ai-assistant-footer">
              <button
                className="ai-assistant-footer-button"
                onClick={clearConversation}
              >
                Clear conversation
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

