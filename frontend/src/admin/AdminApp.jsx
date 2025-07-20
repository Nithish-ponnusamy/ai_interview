import React, { useState } from 'react'
import AdminLogin from './AdminLogin'
import AdminDashboard from './AdminDashboard'

function AdminApp() {
  const [loggedIn, setLoggedIn] = useState(false)

  return loggedIn
    ? <AdminDashboard onLogout={() => setLoggedIn(false)} />
    : <AdminLogin onLogin={() => setLoggedIn(true)} />
}

export default AdminApp
