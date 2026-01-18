import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold text-primary-600">
            PropertyRental
          </Link>

          <div className="flex items-center space-x-4">
            <Link to="/properties" className="text-gray-700 hover:text-primary-600">
              Browse Properties
            </Link>
            <Link 
              to="/compare" 
              className="text-gray-700 hover:text-primary-600 relative"
              title="Compare selected properties (2-5)"
            >
              Compare
              {(() => {
                try {
                  const stored = localStorage.getItem('comparison_selections')
                  const count = stored ? JSON.parse(stored).length : 0
                  return count > 0 ? (
                    <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {count}
                    </span>
                  ) : null
                } catch {
                  return null
                }
              })()}
            </Link>

            {user ? (
              <>
                {user.role === 'OWNER' && (
                  <Link
                    to="/owner/dashboard"
                    className="text-gray-700 hover:text-primary-600"
                  >
                    Owner Dashboard
                  </Link>
                )}
                {user.role === 'CUSTOMER' && (
                  <>
                    <Link
                      to="/customer/dashboard"
                      className="text-gray-700 hover:text-primary-600"
                    >
                      My Bookings
                    </Link>
                    <Link
                      to="/wishlist"
                      className="text-gray-700 hover:text-primary-600"
                    >
                      Wishlist
                    </Link>
                  </>
                )}
                {user.role === 'ADMIN' && (
                  <Link
                    to="/admin/dashboard"
                    className="text-gray-700 hover:text-primary-600"
                  >
                    Admin Dashboard
                  </Link>
                )}
                <div className="flex items-center space-x-2">
                  <span className="text-gray-700">Hello, {user.username}</span>
                  <button
                    onClick={handleLogout}
                    className="btn btn-secondary text-sm"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-primary-600">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
