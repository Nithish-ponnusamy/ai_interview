"use client"

import { useState } from "react"
import { GoogleOAuthProvider } from "@react-oauth/google"
import FrontPage from "./FrontPage"
import ClientHome from "./client/ClientHome"
import AdminLogin from "./admin/AdminLogin"
import AdminDashboard from "./admin/AdminDashboard"
import AdminHome from "./admin/AdminHome"

// Google OAuth Client ID - Replace with your actual client ID
const GOOGLE_CLIENT_ID = "522709859741-e1rcah5irttj8t9ug9urdib7of5dfnsi.apps.googleusercontent.com"

function App() {
  const [currentView, setCurrentView] = useState("home")
  const [adminLoggedIn, setAdminLoggedIn] = useState(false)
  const [adminView, setAdminView] = useState("dashboard") // 'dashboard' or 'assign'
  const [clientName, setClientName] = useState("")
  const [task, setTask] = useState("")
  const [assigned, setAssigned] = useState(false)

  // Handle front page selection (admin or client)
  const handleFrontPageSelect = (selection) => {
    if (selection === "admin") {
      setCurrentView("adminLogin")
    } else if (selection === "client") {
      setCurrentView("client")
    }
  }

  // Handle admin login
  const handleAdminLogin = () => {
    setAdminLoggedIn(true)
    setCurrentView("admin")
    setAdminView("dashboard")
  }

  // Handle admin logout
  const handleAdminLogout = () => {
    setAdminLoggedIn(false)
    setCurrentView("home")
    setAdminView("dashboard")
    setClientName("")
    setTask("")
    setAssigned(false)
  }

  // Handle client back to home
  const handleClientBack = () => {
    setCurrentView("home")
  }

  // Handle admin navigation
  const handleAdminNavigation = (view) => {
    setAdminView(view)
  }

  // Handle back to home from admin login
  const handleBackToHome = () => {
    setCurrentView("home")
  }

  // Render current view
  const renderCurrentView = () => {
    switch (currentView) {
      case "home":
        return <FrontPage onSelect={handleFrontPageSelect} />

      case "client":
        return (
          <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <ClientHome onBack={handleClientBack} task={task} />
          </GoogleOAuthProvider>
        )

      case "adminLogin":
        return (
          <div>
            <AdminLogin onLogin={handleAdminLogin} />
            <div className="fixed top-4 left-4">
              <button
                onClick={handleBackToHome}
                className="flex items-center space-x-2 px-4 py-2 bg-white/90 backdrop-blur-xl border border-gray-200 rounded-lg text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-all duration-300 shadow-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to Home</span>
              </button>
            </div>
          </div>
        )

      case "admin":
        if (!adminLoggedIn) {
          return <AdminLogin onLogin={handleAdminLogin} />
        }

        return (
          <div>
            {/* Admin Navigation Header */}
            <div className="bg-white/90 backdrop-blur-xl shadow-lg border-b border-white/50 sticky top-0 z-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                  <div className="flex items-center space-x-8">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <span className="text-xl font-bold text-gray-800">Admin Panel</span>
                    </div>

                    {/* Navigation Tabs */}
                    <nav className="flex space-x-1">
                      <button
                        onClick={() => handleAdminNavigation("dashboard")}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                          adminView === "dashboard"
                            ? "bg-blue-100 text-blue-700 shadow-sm"
                            : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                          </svg>
                          <span>Dashboard</span>
                        </div>
                      </button>
                      <button
                        onClick={() => handleAdminNavigation("assign")}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                          adminView === "assign"
                            ? "bg-indigo-100 text-indigo-700 shadow-sm"
                            : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>Assign Tasks</span>
                        </div>
                      </button>
                    </nav>
                  </div>

                  <button
                    onClick={handleAdminLogout}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition-all duration-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Admin Content */}
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
              {adminView === "dashboard" ? (
                <AdminDashboard onLogout={handleAdminLogout} />
              ) : (
                <AdminHome
                  onBack={() => handleAdminNavigation("dashboard")}
                  clientName={clientName}
                  setClientName={setClientName}
                  task={task}
                  setTask={setTask}
                  assigned={assigned}
                  setAssigned={setAssigned}
                />
              )}
            </div>
          </div>
        )

      default:
        return <FrontPage onSelect={handleFrontPageSelect} />
    }
  }

  return (
    <div className="min-h-screen">
      {renderCurrentView()}

      {/* Global Loading Overlay (if needed) */}
      {/* You can add a global loading state here if needed */}

      {/* Global Error Boundary (if needed) */}
      {/* You can add error boundary handling here if needed */}
    </div>
  )
}

export default App
