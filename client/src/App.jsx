import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Finance from './pages/Finance'
import MasterData from './pages/MasterData'
import MasterDataIndex from './pages/MasterDataIndex'
import MasterDataForm from './pages/MasterDataForm'
import MasterDataReview from './pages/MasterDataReview'
import POEntry from './pages/POEntry'
import POEntryIndex from './pages/POEntryIndex'
import InvoiceEntry from './pages/InvoiceEntry'
import InvoiceIndex from './pages/InvoiceIndex'
import PaymentEntry from './pages/PaymentEntry'
import PaymentIndex from './pages/PaymentIndex'
import CollectionPlan from './pages/CollectionPlan'
import AppLayout from './layouts/AppLayout'
import { MasterDataProvider } from './contexts/MasterDataContext'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setIsAuthenticated(true)
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    setIsAuthenticated(true)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('user')
  }

  return (
    <MasterDataProvider>
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={
            isAuthenticated ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />
          } 
        />
        <Route 
          path="/register" 
          element={
            isAuthenticated ? <Navigate to="/dashboard" /> : <Register onRegister={handleLogin} />
          } 
        />
        <Route
          element={isAuthenticated ? <AppLayout /> : <Navigate to="/login" />}
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/master-data" element={<MasterData />} />
          <Route path="/master-data/new" element={<MasterDataIndex />} />
          <Route path="/master-data/new/:type" element={<MasterDataForm />} />
          <Route path="/master-data/review" element={<MasterDataReview />} />
          <Route path="/po-entry" element={<POEntryIndex />} />
          <Route path="/po-entry/new" element={<POEntry />} />
          <Route path="/invoices" element={<InvoiceIndex />} />
          <Route path="/invoices/new" element={<InvoiceEntry />} />
          <Route path="/payments" element={<PaymentIndex />} />
          <Route path="/payments/new" element={<PaymentEntry />} />
          <Route path="/collection" element={<CollectionPlan />} />
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
    </MasterDataProvider>
  )
}

export default App
