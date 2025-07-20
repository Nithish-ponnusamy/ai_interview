import React, { useState } from 'react'
import ClientHome from './src/client/ClientHome'
import AdminLogin from './src/admin/AdminLogin'
import AdminDashboard from './src/admin/AdminDashboard'

function App() {
  const [adminLoggedIn, setAdminLoggedIn] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)

  const handleAdminLogin = () => {
    setAdminLoggedIn(true)
  }

  const handleAdminLogout = () => {
    setAdminLoggedIn(false)
    setShowAdmin(false)
  }

  return (
    <div>
      {!showAdmin && (
        <div>
          <div className="fixed top-4 right-4 z-50">
            <button
              onClick={() => setShowAdmin(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg font-semibold shadow hover:from-purple-600 hover:to-pink-600 transition"
            >
              Admin Login
            </button>
          </div>
          <ClientHome onBack={() => {}} />
        </div>
      )}
      {showAdmin && !adminLoggedIn && (
        <AdminLogin onLogin={handleAdminLogin} />
      )}
      {showAdmin && adminLoggedIn && (
        <AdminDashboard onLogout={handleAdminLogout} />
      )}
    </div>
  )
}

export default App
