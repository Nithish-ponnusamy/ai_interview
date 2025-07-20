"use client"

import { useState, useEffect } from "react"
import { googleLogout } from "@react-oauth/google"
import axios from "axios"

function ClientDashboard({ user, onLogout, onInterviewCodeEntry }) {
  const [applicationData, setApplicationData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [refreshing, setRefreshing] = useState(false)

  // Fetch application data
  const fetchApplicationData = async () => {
    try {
      setRefreshing(true)
      setError("")

      console.log("🔍 Fetching application data for:", user.email)

      // Use the correct backend URL with proper timeout
      const response = await axios.get(
        `http://localhost:5000/api/client/application?email=${encodeURIComponent(user.email)}`,
        {
          timeout: 10000,
          headers: {
            "Content-Type": "application/json",
          },
        },
      )

      setApplicationData(response.data)
      console.log("✅ Application data fetched:", response.data)
    } catch (err) {
      console.error("❌ Fetch error:", err)

      if (err.response?.status === 404) {
        setError("No application found. Please complete your application first.")
      } else if (err.code === "ECONNREFUSED" || err.code === "ERR_NETWORK") {
        setError("Cannot connect to server. Please ensure the backend server is running on http://localhost:5000")
      } else if (err.code === "ECONNABORTED") {
        setError("Request timeout. Please check your connection and try again.")
      } else {
        setError(`Failed to fetch application data: ${err.response?.data?.error || err.message}`)
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (user?.email) {
      console.log("🔄 Component mounted, fetching data for:", user.email)
      fetchApplicationData()
    } else {
      console.log("❌ No user email found")
      setLoading(false)
      setError("User information not found. Please sign in again.")
    }
  }, [user])

  const handleLogout = () => {
    console.log("🚪 Logging out user")
    googleLogout()
    // Clear saved session
    localStorage.removeItem("clientUser")
    localStorage.removeItem("clientStage")
    onLogout()
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200"
      case "under_review":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-amber-100 text-amber-800 border-amber-200"
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case "approved":
        return "Approved for Interview"
      case "rejected":
        return "Application Rejected"
      case "under_review":
        return "Under Review"
      default:
        return "Pending Review"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/50">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-700 font-medium">Loading your dashboard...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-xl shadow-lg border-b border-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Client Dashboard</h1>
                <p className="text-gray-600">Welcome back, {user?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchApplicationData}
                disabled={refreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium transition-colors duration-300 disabled:opacity-50"
              >
                <svg
                  className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>Refresh</span>
              </button>
              <button
                onClick={handleLogout}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-5 py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </div>
            {error.includes("server") && (
              <div className="mt-3 p-3 bg-red-100 rounded-lg">
                <p className="text-red-800 text-sm font-medium">Troubleshooting Steps:</p>
                <ul className="text-red-700 text-sm mt-2 space-y-1">
                  <li>• Make sure the backend server is running on port 5000</li>
                  <li>• Check if MongoDB is connected</li>
                  <li>• Verify your network connection</li>
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Application Status Card */}
          <div className="lg:col-span-1">
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Application Status</h3>
              </div>

              {applicationData ? (
                <div className="space-y-4">
                  <div
                    className={`px-4 py-3 rounded-xl border-2 text-center font-semibold ${getStatusColor(
                      applicationData.status,
                    )}`}
                  >
                    {getStatusText(applicationData.status)}
                  </div>

                  <div className="text-sm text-gray-600 space-y-2">
                    <div className="flex justify-between">
                      <span>Submitted:</span>
                      <span className="font-medium">{new Date(applicationData.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Application ID:</span>
                      <span className="font-mono text-xs">{applicationData._id?.slice(-8)}</span>
                    </div>
                  </div>

                  {applicationData.status === "approved" && (
                    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                      <div className="flex items-center space-x-2 mb-3">
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                        <span className="text-green-800 font-semibold">Interview Ready!</span>
                      </div>
                      <p className="text-green-700 text-sm mb-4">
                        Congratulations! You've been approved for the interview. Check your email for the interview
                        code.
                      </p>
                      <button
                        onClick={onInterviewCodeEntry}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 px-4 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        Enter Interview Code
                      </button>
                    </div>
                  )}

                  {applicationData.status === "rejected" && (
                    <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                      <div className="flex items-center space-x-2 mb-2">
                        <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-red-800 font-semibold">Application Not Selected</span>
                      </div>
                      <p className="text-red-700 text-sm">
                        Thank you for your interest. Unfortunately, we won't be moving forward with your application at
                        this time.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <svg
                    className="w-12 h-12 text-gray-400 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p>No application data found</p>
                  <p className="text-sm text-gray-400 mt-2">Please complete your application first</p>
                </div>
              )}
            </div>
          </div>

          {/* Profile Information Card */}
          <div className="lg:col-span-2">
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Profile Information</h3>
                  <p className="text-gray-600">Your submitted application details</p>
                </div>
              </div>

              {applicationData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <span className="text-gray-800">{applicationData.name}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <span className="text-gray-800">{applicationData.email}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <span className="text-gray-800">{applicationData.phone}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Institution</label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <span className="text-gray-800">{applicationData.institution}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Education</label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <span className="text-gray-800">{applicationData.education}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Suggested Role</label>
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <span className="text-blue-800 font-medium">{applicationData.role || "General Position"}</span>
                      </div>
                    </div>

                    {applicationData.linkedin && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">LinkedIn Profile</label>
                        <div className="p-3 bg-gray-50 rounded-lg border">
                          <a
                            href={applicationData.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            View Profile
                          </a>
                        </div>
                      </div>
                    )}

                    {applicationData.github && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">GitHub Profile</label>
                        <div className="p-3 bg-gray-50 rounded-lg border">
                          <a
                            href={applicationData.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            View Profile
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Skills Section */}
                  {applicationData.skills && applicationData.skills.length > 0 && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Key Skills</label>
                      <div className="flex flex-wrap gap-2">
                        {applicationData.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Resume Section */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Resume</label>
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-green-800 font-medium">Resume uploaded successfully</p>
                          <p className="text-green-600 text-sm">
                            Submitted on {new Date(applicationData.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <svg
                    className="w-12 h-12 text-gray-400 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p>No profile information available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-white/90 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Need Help?</h3>
              <p className="text-gray-600">Get assistance with your application</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Application Status</h4>
              <p className="text-blue-700">
                Your application is currently being reviewed by our team. You'll receive updates via email.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-2">Interview Process</h4>
              <p className="text-green-700">
                Once approved, you'll receive an interview code via email to access the interview portal.
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-800 mb-2">Contact Support</h4>
              <p className="text-purple-700">
                Have questions? Contact our support team at{" "}
                <a href="mailto:support@company.com" className="underline">
                  support@company.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ClientDashboard
