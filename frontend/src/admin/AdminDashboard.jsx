"use client"

import { useState, useEffect } from "react"
import axios from "axios"

function AdminDashboard({ onLogout }) {
  const [applicants, setApplicants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [processingId, setProcessingId] = useState(null)
  const [selectedApplicant, setSelectedApplicant] = useState(null)
  const [showResumeModal, setShowResumeModal] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [analytics, setAnalytics] = useState({})
  const [pagination, setPagination] = useState({})

  // Filter states
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: "all",
    role: "all",
    priority: "all",
    search: "",
    sortBy: "createdAt",
    sortOrder: "desc",
    dateFrom: "",
    dateTo: "",
  })

  // Feedback form state
  const [feedback, setFeedback] = useState({
    strengths: [],
    weaknesses: [],
    recommendations: [],
    overallRating: 0,
    hiringRecommendation: "pending",
  })

  // Fetch applicants data with filters
  const fetchApplicants = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams()

      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "all" && value !== "") {
          queryParams.append(key, value)
        }
      })

      const response = await axios.get(`http://localhost:5000/api/admin/applicants?${queryParams}`)

      // Handle the new API response structure
      if (response.data.applicants) {
        setApplicants(response.data.applicants)
        setPagination(response.data.pagination)
        setAnalytics(response.data.analytics)
      } else {
        // Fallback for old API structure
        setApplicants(Array.isArray(response.data) ? response.data : [])
      }

      setError("")
    } catch (err) {
      setError("Failed to fetch applicants data")
      console.error("Fetch error:", err)
      setApplicants([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApplicants()
  }, [filters])

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key !== "page" ? 1 : value, // Reset to page 1 when changing filters
    }))
  }

  const handleViewResume = async (applicant) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/admin/resume/${applicant._id}`)
      setSelectedApplicant({
        ...applicant,
        resumeData: response.data,
      })
      setShowResumeModal(true)
    } catch (err) {
      console.error("Resume fetch error:", err)
      alert("Failed to fetch resume")
    }
  }

  const handleApprove = async (applicantId, applicantEmail, applicantName) => {
    setProcessingId(applicantId)
    try {
      await axios.post("http://localhost:5000/api/admin/approve-applicant", {
        applicantId,
        email: applicantEmail,
        name: applicantName,
      })

      // Refresh the applicants list
      fetchApplicants()
      alert(`Interview code sent to ${applicantEmail}`)
    } catch (err) {
      console.error("Approval error:", err)
      alert("Failed to approve applicant. Please try again.")
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (applicantId, applicantEmail, reason = "") => {
    setProcessingId(applicantId)
    try {
      await axios.post("http://localhost:5000/api/admin/reject-applicant", {
        applicantId,
        email: applicantEmail,
        reason,
      })

      // Refresh the applicants list
      fetchApplicants()
      alert(`Rejection email sent to ${applicantEmail}`)
    } catch (err) {
      console.error("Rejection error:", err)
      alert("Failed to reject applicant. Please try again.")
    } finally {
      setProcessingId(null)
    }
  }

  const handleUpdateStatus = async (applicantId, status, priority = null, notes = "") => {
    try {
      await axios.put(`http://localhost:5000/api/admin/applicant/${applicantId}`, {
        status,
        priority,
        notes,
      })

      fetchApplicants()
      alert("Applicant updated successfully")
    } catch (err) {
      console.error("Update error:", err)
      alert("Failed to update applicant")
    }
  }

  const handleAddFeedback = async (applicantId) => {
    try {
      await axios.post(`http://localhost:5000/api/admin/applicant/${applicantId}/feedback`, feedback)

      setShowFeedbackModal(false)
      setFeedback({
        strengths: [],
        weaknesses: [],
        recommendations: [],
        overallRating: 0,
        hiringRecommendation: "pending",
      })
      fetchApplicants()
      alert("Feedback added successfully")
    } catch (err) {
      console.error("Feedback error:", err)
      alert("Failed to add feedback")
    }
  }

  const handleExport = async (format = "json") => {
    try {
      const queryParams = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "all" && value !== "" && key !== "page" && key !== "limit") {
          queryParams.append(key, value)
        }
      })
      queryParams.append("format", format)

      const response = await axios.get(`http://localhost:5000/api/admin/export?${queryParams}`, {
        responseType: format === "csv" ? "blob" : "json",
      })

      if (format === "csv") {
        const blob = new Blob([response.data], { type: "text/csv" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `applicants-${Date.now()}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
      } else {
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: "application/json" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `applicants-${Date.now()}.json`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error("Export error:", err)
      alert("Failed to export data")
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200"
      case "under_review":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "interview_completed":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "hired":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "on_hold":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-amber-100 text-amber-800 border-amber-200"
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "medium":
        return "bg-blue-100 text-blue-800"
      case "low":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case "approved":
        return "Approved"
      case "rejected":
        return "Rejected"
      case "under_review":
        return "Under Review"
      case "interview_completed":
        return "Interview Completed"
      case "hired":
        return "Hired"
      case "on_hold":
        return "On Hold"
      default:
        return "Pending"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/50">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-700 font-medium">Loading applicants...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-xl shadow-lg border-b border-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Manage candidates and interview processes</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium transition-colors duration-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <span>Analytics</span>
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg font-medium transition-colors duration-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"
                  />
                </svg>
                <span>Filters</span>
              </button>
              <div className="relative">
                <button
                  onClick={() => document.getElementById("exportMenu").classList.toggle("hidden")}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg font-medium transition-colors duration-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span>Export</span>
                </button>
                <div id="exportMenu" className="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                  <div className="py-1">
                    <button
                      onClick={() => handleExport("json")}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      Export as JSON
                    </button>
                    <button
                      onClick={() => handleExport("csv")}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      Export as CSV
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition-colors duration-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      </div>

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
          </div>
        )}

        {/* Analytics Panel */}
        {showAnalytics && analytics && (
          <div className="mb-8 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Analytics Overview</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100">Total Applications</p>
                      <p className="text-3xl font-bold">{analytics.totalApplicants || 0}</p>
                    </div>
                    <svg className="w-8 h-8 text-blue-200" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100">Average Score</p>
                      <p className="text-3xl font-bold">{analytics.averageScore || 0}%</p>
                    </div>
                    <svg className="w-8 h-8 text-green-200" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100">Completed Interviews</p>
                      <p className="text-3xl font-bold">
                        {analytics.statusDistribution?.find((s) => s.status === "interview_completed")?.count || 0}
                      </p>
                    </div>
                    <svg className="w-8 h-8 text-purple-200" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100">Pending Review</p>
                      <p className="text-3xl font-bold">
                        {analytics.statusDistribution?.find((s) => s.status === "pending")?.count || 0}
                      </p>
                    </div>
                    <svg className="w-8 h-8 text-orange-200" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Top Skills */}
              {analytics.topSkills && analytics.topSkills.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {analytics.topSkills.slice(0, 10).map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                      >
                        {skill.skill} ({skill.count})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-8 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Filters & Search</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                    placeholder="Search by name, email, institution..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange("status", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="under_review">Under Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="interview_completed">Interview Completed</option>
                    <option value="hired">Hired</option>
                    <option value="on_hold">On Hold</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
                    value={filters.role}
                    onChange={(e) => handleFilterChange("role", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Roles</option>
                    <option value="Frontend Developer">Frontend Developer</option>
                    <option value="Backend Developer">Backend Developer</option>
                    <option value="Full Stack Developer">Full Stack Developer</option>
                    <option value="Data Science">Data Science</option>
                    <option value="DevOps Engineer">DevOps Engineer</option>
                    <option value="General Position">General Position</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={filters.priority}
                    onChange={(e) => handleFilterChange("priority", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Priorities</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <select
                    value={`${filters.sortBy}-${filters.sortOrder}`}
                    onChange={(e) => {
                      const [sortBy, sortOrder] = e.target.value.split("-")
                      handleFilterChange("sortBy", sortBy)
                      handleFilterChange("sortOrder", sortOrder)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="createdAt-desc">Newest First</option>
                    <option value="createdAt-asc">Oldest First</option>
                    <option value="name-asc">Name A-Z</option>
                    <option value="name-desc">Name Z-A</option>
                    <option value="interviewResults.totalScore-desc">Highest Score</option>
                    <option value="interviewResults.totalScore-asc">Lowest Score</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() =>
                    setFilters({
                      page: 1,
                      limit: 20,
                      status: "all",
                      role: "all",
                      priority: "all",
                      search: "",
                      sortBy: "createdAt",
                      sortOrder: "desc",
                      dateFrom: "",
                      dateTo: "",
                    })
                  }
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors duration-300"
                >
                  Clear Filters
                </button>
                <button
                  onClick={fetchApplicants}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-300"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white/90 backdrop-blur-xl rounded-xl p-6 shadow-lg border border-white/50">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Applications</p>
                <p className="text-2xl font-bold text-gray-900">{applicants.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-xl rounded-xl p-6 shadow-lg border border-white/50">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">
                  {applicants.filter((app) => app.status === "pending").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-xl rounded-xl p-6 shadow-lg border border-white/50">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {applicants.filter((app) => app.status === "approved").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-xl rounded-xl p-6 shadow-lg border border-white/50">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">
                  {applicants.filter((app) => app.status === "rejected").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-xl rounded-xl p-6 shadow-lg border border-white/50">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Interviews Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {applicants.filter((app) => app.status === "interview_completed").length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Applicants Table */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Candidate Applications</h2>
                <p className="text-gray-600">
                  {pagination.totalCount
                    ? `Showing ${applicants.length} of ${pagination.totalCount} candidates`
                    : `${applicants.length} candidates`}
                </p>
              </div>
              <button
                onClick={fetchApplicants}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium transition-colors duration-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Candidate</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Contact & Education</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Role & Skills</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Status & Priority</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Interview Results</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Resume</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {applicants.map((applicant) => (
                  <tr key={applicant._id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="py-4 px-6">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{applicant.name}</div>
                        <div className="text-sm text-gray-500">{applicant.email}</div>
                        <div className="text-xs text-gray-400">
                          Applied: {new Date(applicant.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-900">{applicant.phone}</div>
                      <div className="text-sm text-gray-500">{applicant.institution}</div>
                      <div className="text-xs text-gray-400">{applicant.education}</div>
                      {applicant.address && <div className="text-xs text-gray-400">{applicant.address}</div>}
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm font-medium text-blue-600 mb-2">
                        {applicant.role || "General Position"}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {applicant.skills?.slice(0, 3).map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                        {applicant.skills?.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs">
                            +{applicant.skills.length - 3}
                          </span>
                        )}
                      </div>
                      {applicant.experience && (
                        <div className="text-xs text-gray-500 mt-1">Exp: {applicant.experience}</div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                            applicant.status,
                          )}`}
                        >
                          {getStatusText(applicant.status)}
                        </span>
                        <div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                              applicant.priority,
                            )}`}
                          >
                            {applicant.priority || "medium"}
                          </span>
                        </div>
                      </div>
                      {applicant.interviewCode && (
                        <div className="text-xs text-gray-500 mt-1 font-mono">Code: {applicant.interviewCode}</div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {applicant.status === "interview_completed" && applicant.interviewResults ? (
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-900">
                            Total: {applicant.interviewResults.totalScore}%
                          </div>
                          <div className="text-xs text-gray-500 space-y-0.5">
                            <div>Aptitude: {applicant.interviewResults.aptitudeScore}%</div>
                            <div>Coding: {applicant.interviewResults.codingScore}%</div>
                            <div>HR: {applicant.interviewResults.hrScore}%</div>
                          </div>
                          {applicant.interviewResults.percentile && (
                            <div className="text-xs text-blue-600 font-medium">
                              Percentile: {applicant.interviewResults.percentile}%
                            </div>
                          )}
                          <div className="text-xs text-gray-400">
                            Completed: {new Date(applicant.interviewResults.completedAt).toLocaleDateString()}
                          </div>
                          {applicant.interviewResults.violations &&
                            applicant.interviewResults.violations.length > 0 && (
                              <div className="text-xs text-red-600">
                                Violations: {applicant.interviewResults.violations.length}
                              </div>
                            )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Not available</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleViewResume(applicant)}
                        className="flex items-center space-x-2 px-3 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg text-sm font-medium transition-colors duration-300"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>View</span>
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col space-y-2">
                        {applicant.status === "pending" || applicant.status === "under_review" ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApprove(applicant._id, applicant.email, applicant.name)}
                              disabled={processingId === applicant._id}
                              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-3 py-1 rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {processingId === applicant._id ? (
                                <div className="flex items-center space-x-1">
                                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                                  <span>Approving...</span>
                                </div>
                              ) : (
                                "Approve"
                              )}
                            </button>
                            <button
                              onClick={() => handleReject(applicant._id, applicant.email)}
                              disabled={processingId === applicant._id}
                              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-1 rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {processingId === applicant._id ? "Processing..." : "Reject"}
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">
                            {applicant.status === "approved" ? "Interview Sent" : "Completed"}
                          </span>
                        )}

                        {/* Quick Status Update */}
                        <div className="flex space-x-1">
                          <select
                            onChange={(e) => handleUpdateStatus(applicant._id, e.target.value)}
                            className="text-xs px-2 py-1 border border-gray-300 rounded"
                            defaultValue={applicant.status}
                          >
                            <option value="pending">Pending</option>
                            <option value="under_review">Under Review</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="interview_completed">Interview Completed</option>
                            <option value="hired">Hired</option>
                            <option value="on_hold">On Hold</option>
                          </select>
                        </div>

                        {/* Add Feedback Button */}
                        {applicant.status === "interview_completed" && (
                          <button
                            onClick={() => {
                              setSelectedApplicant(applicant)
                              setShowFeedbackModal(true)
                            }}
                            className="text-xs px-2 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded transition-colors duration-300"
                          >
                            Add Feedback
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {(pagination.currentPage - 1) * filters.limit + 1} to{" "}
                  {Math.min(pagination.currentPage * filters.limit, pagination.totalCount)} of {pagination.totalCount}{" "}
                  results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleFilterChange("page", pagination.currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded">
                    {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handleFilterChange("page", pagination.currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {applicants.length === 0 && (
            <div className="text-center py-12">
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
              <p className="text-gray-500">No applications found</p>
            </div>
          )}
        </div>
      </main>

      {/* Resume Modal */}
      {showResumeModal && selectedApplicant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Complete Profile - {selectedApplicant.name}</h3>
                <p className="text-gray-600">{selectedApplicant.email}</p>
              </div>
              <button
                onClick={() => setShowResumeModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-300"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Personal Information */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Full Name</label>
                        <p className="text-gray-900">{selectedApplicant.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Email</label>
                        <p className="text-gray-900">{selectedApplicant.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Phone</label>
                        <p className="text-gray-900">{selectedApplicant.phone}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Institution</label>
                        <p className="text-gray-900">{selectedApplicant.institution}</p>
                      </div>
                      {selectedApplicant.address && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Address</label>
                          <p className="text-gray-900">{selectedApplicant.address}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Professional Information */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Professional Information</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Education</label>
                        <p className="text-gray-900">{selectedApplicant.education}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Desired Role</label>
                        <p className="text-gray-900">{selectedApplicant.role || "General Position"}</p>
                      </div>
                      {selectedApplicant.experience && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Experience</label>
                          <p className="text-gray-900">{selectedApplicant.experience}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Professional Links & Skills */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Professional Links</h4>
                    <div className="space-y-3">
                      {selectedApplicant.linkedin && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">LinkedIn</label>
                          <a
                            href={selectedApplicant.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline block"
                          >
                            View Profile
                          </a>
                        </div>
                      )}
                      {selectedApplicant.github && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">GitHub</label>
                          <a
                            href={selectedApplicant.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline block"
                          >
                            View Profile
                          </a>
                        </div>
                      )}
                      {selectedApplicant.portfolio && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Portfolio</label>
                          <a
                            href={selectedApplicant.portfolio}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline block"
                          >
                            View Portfolio
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Skills */}
                  {selectedApplicant.skills && selectedApplicant.skills.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedApplicant.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Resume Download */}
                  {selectedApplicant.resumeData && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Resume</h4>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{selectedApplicant.resumeData.fileName}</p>
                            <p className="text-sm text-gray-500">Resume Document</p>
                          </div>
                        </div>
                        <a
                          href={selectedApplicant.resumeData.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-300"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <span>Download</span>
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Application Status */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Application Status</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Current Status</label>
                        <div className="mt-1">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(
                              selectedApplicant.status,
                            )}`}
                          >
                            {getStatusText(selectedApplicant.status)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Priority</label>
                        <div className="mt-1">
                          <span
                            className={`px-2 py-1 rounded-full text-sm font-medium ${getPriorityColor(
                              selectedApplicant.priority,
                            )}`}
                          >
                            {selectedApplicant.priority || "medium"}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Applied Date</label>
                        <p className="text-gray-900">{new Date(selectedApplicant.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interview Results */}
              {selectedApplicant.status === "interview_completed" && selectedApplicant.interviewResults && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Interview Results</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-medium text-gray-700 mb-3">Scores</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Aptitude:</span>
                          <span className="font-medium">{selectedApplicant.interviewResults.aptitudeScore}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Coding:</span>
                          <span className="font-medium">{selectedApplicant.interviewResults.codingScore}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>HR:</span>
                          <span className="font-medium">{selectedApplicant.interviewResults.hrScore}%</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="font-semibold">Total:</span>
                          <span className="font-bold text-lg">{selectedApplicant.interviewResults.totalScore}%</span>
                        </div>
                        {selectedApplicant.interviewResults.percentile && (
                          <div className="flex justify-between">
                            <span>Percentile:</span>
                            <span className="font-medium text-blue-600">
                              {selectedApplicant.interviewResults.percentile}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-700 mb-3">Monitoring</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Violations:</span>
                          <span
                            className={`font-medium ${
                              selectedApplicant.interviewResults.violations?.length > 0
                                ? "text-red-600"
                                : "text-green-600"
                            }`}
                          >
                            {selectedApplicant.interviewResults.violations?.length || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Completed:</span>
                          <span className="font-medium">
                            {new Date(selectedApplicant.interviewResults.completedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedApplicant.notes && selectedApplicant.notes.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Notes</h4>
                  <div className="space-y-2">
                    {selectedApplicant.notes.map((note, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-800">{note.content}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          By {note.author} on {new Date(note.timestamp).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowResumeModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors duration-300"
              >
                Close
              </button>
              {(selectedApplicant.status === "pending" || selectedApplicant.status === "under_review") && (
                <>
                  <button
                    onClick={() => {
                      setShowResumeModal(false)
                      handleApprove(selectedApplicant._id, selectedApplicant.email, selectedApplicant.name)
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-300"
                  >
                    Approve Candidate
                  </button>
                  <button
                    onClick={() => {
                      setShowResumeModal(false)
                      handleReject(selectedApplicant._id, selectedApplicant.email)
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-300"
                  >
                    Reject Candidate
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && selectedApplicant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Add Feedback - {selectedApplicant.name}</h3>
                <p className="text-gray-600">Provide detailed feedback for the candidate</p>
              </div>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-300"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Strengths</label>
                <textarea
                  value={feedback.strengths.join("\n")}
                  onChange={(e) =>
                    setFeedback((prev) => ({ ...prev, strengths: e.target.value.split("\n").filter((s) => s.trim()) }))
                  }
                  placeholder="Enter candidate strengths (one per line)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Weaknesses</label>
                <textarea
                  value={feedback.weaknesses.join("\n")}
                  onChange={(e) =>
                    setFeedback((prev) => ({ ...prev, weaknesses: e.target.value.split("\n").filter((s) => s.trim()) }))
                  }
                  placeholder="Enter areas for improvement (one per line)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recommendations</label>
                <textarea
                  value={feedback.recommendations.join("\n")}
                  onChange={(e) =>
                    setFeedback((prev) => ({
                      ...prev,
                      recommendations: e.target.value.split("\n").filter((s) => s.trim()),
                    }))
                  }
                  placeholder="Enter recommendations (one per line)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Overall Rating</label>
                  <select
                    value={feedback.overallRating}
                    onChange={(e) => setFeedback((prev) => ({ ...prev, overallRating: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={0}>Select Rating</option>
                    <option value={1}>1 - Poor</option>
                    <option value={2}>2 - Below Average</option>
                    <option value={3}>3 - Average</option>
                    <option value={4}>4 - Good</option>
                    <option value={5}>5 - Excellent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hiring Recommendation</label>
                  <select
                    value={feedback.hiringRecommendation}
                    onChange={(e) => setFeedback((prev) => ({ ...prev, hiringRecommendation: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="pending">Pending</option>
                    <option value="strongly_recommend">Strongly Recommend</option>
                    <option value="recommend">Recommend</option>
                    <option value="neutral">Neutral</option>
                    <option value="not_recommend">Not Recommend</option>
                    <option value="strongly_not_recommend">Strongly Not Recommend</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAddFeedback(selectedApplicant._id)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-300"
                >
                  Save Feedback
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
