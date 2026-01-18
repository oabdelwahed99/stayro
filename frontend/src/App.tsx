import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'

// Pages
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Properties from './pages/Properties'
import PropertyDetail from './pages/PropertyDetail'
import OwnerDashboard from './pages/OwnerDashboard'
import CustomerDashboard from './pages/CustomerDashboard'
import AdminDashboard from './pages/AdminDashboard'
import CreateProperty from './pages/CreateProperty'
import EditProperty from './pages/EditProperty'
import AboutUs from './pages/AboutUs'
import Contact from './pages/Contact'
import Support from './pages/Support'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import CookiePolicy from './pages/CookiePolicy'
import Wishlist from './pages/Wishlist'
import PropertyComparison from './pages/PropertyComparison'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<div className="container mx-auto px-4 py-8"><Login /></div>} />
            <Route path="/register" element={<div className="container mx-auto px-4 py-8"><Register /></div>} />
            <Route path="/properties" element={<div className="container mx-auto px-4 py-8"><Properties /></div>} />
            <Route path="/properties/:id" element={<div className="container mx-auto px-4 py-8"><PropertyDetail /></div>} />
            <Route path="/compare" element={<div className="container mx-auto px-4 py-8"><PropertyComparison /></div>} />
            
            {/* Company Pages */}
            <Route path="/about" element={<AboutUs />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/support" element={<Support />} />
            
            {/* Legal Pages */}
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/cookie-policy" element={<CookiePolicy />} />
            
            {/* Protected Routes */}
            <Route
              path="/owner/dashboard"
              element={
                <ProtectedRoute allowedRoles={['OWNER']}>
                  <div className="container mx-auto px-4 py-8"><OwnerDashboard /></div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/properties/new"
              element={
                <ProtectedRoute allowedRoles={['OWNER']}>
                  <div className="container mx-auto px-4 py-8"><CreateProperty /></div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/properties/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['OWNER']}>
                  <div className="container mx-auto px-4 py-8"><EditProperty /></div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/dashboard"
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER']}>
                  <div className="container mx-auto px-4 py-8"><CustomerDashboard /></div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/wishlist"
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER']}>
                  <div className="container mx-auto px-4 py-8"><Wishlist /></div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <div className="container mx-auto px-4 py-8"><AdminDashboard /></div>
                </ProtectedRoute>
              }
            />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster position="top-right" />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
