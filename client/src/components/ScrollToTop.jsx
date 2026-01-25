import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * ScrollToTop Component
 * 
 * Ensures that the page scrolls to the top (0,0) on:
 * - Route changes (React Router navigation)
 * - Page navigation (links, buttons, programmatic routing)
 * - Page refresh/reload
 * - Browser back/forward navigation
 * 
 * Handles both window scroll (for marketing pages) and
 * scrollable containers like .app-main (for app layout pages)
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()

  // Helper function to scroll all containers to top
  const scrollToTop = () => {
    // Scroll window to top (for marketing pages and initial load)
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // Use 'instant' for immediate scroll on navigation
    })

    // Also scroll the app-main container to top (for app layout pages)
    // This handles the scrollable container in AppLayout
    const appMain = document.querySelector('.app-main')
    if (appMain) {
      appMain.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      })
    }

    // Handle marketing main container if it exists
    const marketingMain = document.querySelector('.mkt-main')
    if (marketingMain) {
      marketingMain.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      })
    }
  }

  // Handle route changes (React Router navigation)
  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM is ready after route change
    requestAnimationFrame(() => {
      scrollToTop()
    })
  }, [pathname])

  // Handle initial page load/refresh and browser navigation
  useEffect(() => {
    // Execute immediately on mount (handles page refresh)
    scrollToTop()

    // Handle browser back/forward navigation (popstate event)
    const handlePopState = () => {
      // Small delay to ensure DOM is updated after navigation
      requestAnimationFrame(() => {
        scrollToTop()
      })
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  return null
}

