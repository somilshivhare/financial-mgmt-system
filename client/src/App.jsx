import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import MarketingLayout from './layouts/MarketingLayout'
import Home from './pages/Home'
import About from './pages/About'
import Pricing from './pages/Pricing'
import Contact from './pages/Contact'
import WhoWeAre from './pages/WhoWeAre'
import Dashboard from './pages/Dashboard'
import Finance from './pages/Finance'
import MasterData from './pages/MasterData'
import MasterDataIndex from './pages/MasterDataIndex'
import MasterDataForm from './pages/MasterDataForm'
import MasterDataReview from './pages/MasterDataReview'
import MasterDataView from './pages/MasterDataView'
import POEntry from './pages/POEntry'
import POEntryIndex from './pages/POEntryIndex'
import InvoiceEntry from './pages/InvoiceEntry'
import InvoiceIndex from './pages/InvoiceIndex'
import PaymentEntry from './pages/PaymentEntry'
import PaymentIndex from './pages/PaymentIndex'
import MoMEntry from './pages/MoMEntry'
import CollectionPlan from './pages/CollectionPlan'
import Subscription from './pages/Subscription'
import MyProfile from './pages/MyProfile'
import ContactSupport from './pages/ContactSupport'
import Alerts from './pages/Alerts'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'
import Meetings from './pages/Meetings'
import Reports from './pages/Reports'
import AppLayout from './layouts/AppLayout'
import { MasterDataProvider } from './contexts/MasterDataContext'
import { AIAssistantProvider } from './contexts/AIAssistantContext'
import ScrollToTop from './components/ScrollToTop'
import ErrorBoundary from './components/ErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'
import NotFoundRoute from './components/NotFoundRoute'
import './App.css'

function App() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Load user from localStorage on mount
    try {
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        setUser(JSON.parse(storedUser))
      }
    } catch (error) {
      console.error('[App] Error loading user from localStorage:', error)
    }
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  return (
    <ErrorBoundary>
      <MasterDataProvider>
        <Router>
          <AIAssistantProvider>
            <ScrollToTop />
            <Routes>
              {/* Public marketing site (shown when logged out) */}
              <Route
                element={
                  <PublicRoute>
                    <MarketingLayout />
                  </PublicRoute>
                }
              >
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/who-we-are" element={<WhoWeAre />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/contact" element={<Contact />} />
              </Route>

              <Route 
                path="/login" 
                element={
                  <PublicRoute>
                    <Login onLogin={handleLogin} />
                  </PublicRoute>
                } 
              />
              <Route
                path="/forgot-password"
                element={
                  <PublicRoute>
                    <ForgotPassword />
                  </PublicRoute>
                }
              />
              <Route
                path="/reset-password"
                element={
                  <PublicRoute>
                    <ResetPassword />
                  </PublicRoute>
                }
              />
              <Route 
                path="/register" 
                element={
                  <PublicRoute>
                    <Register onRegister={handleLogin} />
                  </PublicRoute>
                } 
              />
              
              {/* Protected routes - preserve current route on refresh */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
                <Route path="/finance" element={<ErrorBoundary><Finance /></ErrorBoundary>} />
                <Route path="/master-data" element={<ErrorBoundary><MasterData /></ErrorBoundary>} />
                <Route path="/master-data/new" element={<ErrorBoundary><MasterDataIndex /></ErrorBoundary>} />
                <Route path="/master-data/new/:type" element={<ErrorBoundary><MasterDataForm /></ErrorBoundary>} />
                <Route path="/master-data/review" element={<ErrorBoundary><MasterDataReview /></ErrorBoundary>} />
                <Route path="/master-data/view/:companyId?" element={<ErrorBoundary><MasterDataView /></ErrorBoundary>} />
                <Route path="/po-entry" element={<ErrorBoundary><POEntryIndex /></ErrorBoundary>} />
                <Route path="/po-entry/new" element={<ErrorBoundary><POEntry /></ErrorBoundary>} />
                <Route path="/invoices" element={<ErrorBoundary><InvoiceIndex /></ErrorBoundary>} />
                <Route path="/invoices/new" element={<ErrorBoundary><InvoiceEntry /></ErrorBoundary>} />
                <Route path="/payments" element={<ErrorBoundary><PaymentIndex /></ErrorBoundary>} />
                <Route path="/payments/new" element={<ErrorBoundary><PaymentEntry /></ErrorBoundary>} />
                <Route path="/collection" element={<ErrorBoundary><CollectionPlan /></ErrorBoundary>} />
                <Route path="/subscription" element={<ErrorBoundary><Subscription /></ErrorBoundary>} />
                <Route path="/profile" element={<ErrorBoundary><MyProfile /></ErrorBoundary>} />
                <Route path="/support" element={<ErrorBoundary><ContactSupport /></ErrorBoundary>} />
                <Route path="/alerts" element={<ErrorBoundary><Alerts /></ErrorBoundary>} />
                <Route path="/notifications" element={<ErrorBoundary><Notifications /></ErrorBoundary>} />
                <Route path="/settings" element={<ErrorBoundary><Settings /></ErrorBoundary>} />
                <Route path="/meetings" element={<ErrorBoundary><Meetings /></ErrorBoundary>} />
                <Route path="/reports" element={<ErrorBoundary><Reports /></ErrorBoundary>} />
                <Route path="/mom/new" element={<ErrorBoundary><MoMEntry /></ErrorBoundary>} />
                <Route path="/mom/edit/:id" element={<ErrorBoundary><MoMEntry /></ErrorBoundary>} />
              </Route>
              
              {/* Fallback: Only redirect if route doesn't exist and user is authenticated */}
              <Route 
                path="*" 
                element={
                  <NotFoundRoute />
                } 
              />
            </Routes>
          </AIAssistantProvider>
        </Router>
      </MasterDataProvider>
    </ErrorBoundary>
  )
}

export default App
