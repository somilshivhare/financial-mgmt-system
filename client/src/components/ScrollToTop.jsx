import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const scrollOptions = { top: 0, left: 0, behavior: 'instant' }

function scrollToTop() {
  window.scrollTo(scrollOptions)
  document.documentElement.scrollTo(scrollOptions)
  document.body.scrollTo(scrollOptions)

  const appMain = document.querySelector('.app-main')
  if (appMain) appMain.scrollTo(scrollOptions)

  const mktPage = document.querySelector('.mkt-page')
  if (mktPage) mktPage.scrollTo(scrollOptions)

  const mktMain = document.querySelector('.mkt-main')
  if (mktMain) mktMain.scrollTo(scrollOptions)
}

export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    scrollToTop()
    requestAnimationFrame(() => scrollToTop())
  }, [pathname])

  useEffect(() => {
    const handlePopState = () => {
      requestAnimationFrame(scrollToTop)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  return null
}

