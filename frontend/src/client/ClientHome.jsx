"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import ClientAuth from "./ClientAuth"
import ClientDashboard from "./ClientDashboard"
import InterviewCodeEntry from "./InterviewCodeEntry"
import InterviewPlatform from "./InterviewPlatform"
import InterviewComplete from "./InterviewComplete"

// Debounce utility to limit API calls
const debounce = (func, wait) => {
  let timeout
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

function ClientHome({ onBack, task }) {
  const [stage, setStage] = useState("auth")
  const [user, setUser] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    institution: "",
    address: "",
    experience: "",
    education: "",
    linkedin: "",
    portfolio: "",
    github: "",
    role: "",
    skills: [],
  })
  const [resumeFile, setResumeFile] = useState(null)
  const [resumeAnalysis, setResumeAnalysis] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState("")
  const [uploadBlocked, setUploadBlocked] = useState(false)
  const [interviewData, setInterviewData] = useState(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [interviewResults, setInterviewResults] = useState(null)
  const [hasApplication, setHasApplication] = useState(false)

  // Check for existing user session on component mount
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const savedUser = localStorage.getItem("clientUser")
        console.log("Checking saved session:", { savedUser: !!savedUser })

        if (savedUser) {
          const parsedUser = JSON.parse(savedUser)
          console.log("Found saved user:", parsedUser)

          setUser(parsedUser)
          setFormData({
            name: parsedUser.name || "",
            email: parsedUser.email || "",
            phone: parsedUser.phone || "",
            institution: parsedUser.institution || "",
            address: parsedUser.address || "",
            experience: parsedUser.experience || "",
            education: parsedUser.education || "",
            linkedin: parsedUser.linkedin || "",
            portfolio: parsedUser.portfolio || "",
            github: parsedUser.github || "",
            role: parsedUser.role || "",
            skills: parsedUser.skills || [],
          })

          // Check if user has an application in the database
          if (parsedUser.email) {
            try {
              const response = await axios.get(
                `http://localhost:5000/api/client/application?email=${encodeURIComponent(parsedUser.email)}`,
                { timeout: 10000 },
              )
              console.log("Found existing application:", response.data)
              setHasApplication(true)
              setStage("dashboard")
            } catch (err) {
              console.log("No existing application found or server error:", err.response?.status)
              if (err.response?.status === 404) {
                setHasApplication(false)
                setStage("details")
              } else {
                setHasApplication(false)
                setStage("details")
              }
            }
          } else {
            setStage("details")
          }
        }
      } catch (err) {
        console.error("Error checking existing session:", err)
        localStorage.removeItem("clientUser")
      } finally {
        setInitialLoading(false)
      }
    }

    checkExistingSession()
  }, [])

  // Save user session whenever user changes
  useEffect(() => {
    if (!initialLoading && user) {
      console.log("Saving session:", { user: user.email })
      localStorage.setItem("clientUser", JSON.stringify(user))
    }
  }, [user, initialLoading])

  // Progress calculation
  useEffect(() => {
    const fields = [formData.name, formData.email, formData.phone, formData.institution, formData.education, resumeFile]
    const completed = fields.filter((field) => field).length
    setProgress((completed / fields.length) * 100)
  }, [formData, resumeFile])

  const handleLogin = (userData) => {
    console.log("🔐 User logged in:", userData)
    setUser(userData)

    // Update form data with user information
    setFormData((prevData) => ({
      ...prevData,
      name: userData.name || prevData.name,
      email: userData.email || prevData.email,
      phone: userData.phone || prevData.phone,
      institution: userData.institution || prevData.institution,
      address: userData.address || prevData.address,
      experience: userData.experience || prevData.experience,
      education: userData.education || prevData.education,
      linkedin: userData.linkedin || prevData.linkedin,
      portfolio: userData.portfolio || prevData.portfolio,
      github: userData.github || prevData.github,
      role: userData.role || prevData.role,
      skills: userData.skills || prevData.skills,
    }))

    // Check if user has application
    if (userData.hasApplication) {
      setHasApplication(true)
      setStage("dashboard")
    } else {
      setHasApplication(false)
      setStage("details")
    }
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  // Enhanced resume parsing with backend API
  const handleUpload = async (e) => {
    if (uploadBlocked) return
    const file = e.target.files?.[0] || e.dataTransfer?.files?.[0]
    if (!file) return

    setIsLoading(true)
    setResumeFile(file)
    setError("")

    try {
      console.log("📄 Processing resume file:", file.name, "Type:", file.type)

      // Create FormData for file upload
      const uploadFormData = new FormData()
      uploadFormData.append("resume", file)

      // Send to backend for parsing
      const response = await axios.post("http://localhost:5000/api/client/parse-resume", uploadFormData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 30000, // 30 seconds timeout for file processing
      })

      console.log("✅ Resume parsed successfully:", response.data)

      const parsedData = response.data.data

      // Update form data with parsed information - Keep existing email from logged in user
      setFormData((prevData) => ({
        name: parsedData.full_name || prevData.name,
        email: prevData.email, // Keep existing email from user login
        phone: parsedData.phone || prevData.phone,
        institution: parsedData.institution || prevData.institution,
        address: parsedData.address || prevData.address,
        experience: parsedData.experience || prevData.experience,
        education: parsedData.education || prevData.education,
        linkedin: parsedData.linkedin || prevData.linkedin,
        portfolio: parsedData.portfolio || prevData.portfolio,
        github: parsedData.github || prevData.github,
        role: parsedData.role || prevData.role,
        skills: Array.isArray(parsedData.skills) ? parsedData.skills : prevData.skills,
      }))

      setResumeAnalysis({
        role: parsedData.role || "General Position",
        skills: Array.isArray(parsedData.skills) ? parsedData.skills : [],
      })

      setIsLoading(false)
      console.log("✅ Resume processing completed successfully")
    } catch (err) {
      console.error("❌ Resume parsing error:", err)
      setError(err.response?.data?.error || "Failed to process resume. Please check the file format and try again.")
      setIsLoading(false)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleUpload(e)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Validate user is logged in
    if (!user || !user.email) {
      setError("Please log in first before submitting your application.")
      setIsLoading(false)
      return
    }

    console.log("📝 Submitting application for user:", user.email)

    const submitData = new FormData()

    // Use the logged-in user's email
    submitData.append("email", user.email)

    // Add all other form data
    Object.keys(formData).forEach((key) => {
      if (key === "skills") {
        submitData.append(key, JSON.stringify(formData[key]))
      } else if (key !== "email") {
        // Skip email since we're using user.email
        submitData.append(key, formData[key])
      }
    })

    if (resumeFile) {
      submitData.append("resume", resumeFile)
    }

    try {
      console.log("Submitting application...")
      const response = await axios.post("http://localhost:5000/api/client/apply", submitData, {
        timeout: 15000,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      console.log("Application submitted successfully:", response.data)
      setHasApplication(true)
      setStage("dashboard")
    } catch (err) {
      console.error("Submit error:", err)
      if (err.code === "ECONNREFUSED") {
        setError("Cannot connect to server. Please ensure the backend server is running on http://localhost:5000")
      } else {
        setError(err?.response?.data?.error || "Failed to submit application. Please try again.")
      }
    }
    setIsLoading(false)
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await axios.put("http://localhost:5000/api/client/update-profile", {
        email: user.email,
        ...formData,
      })

      setUser({ ...user, ...formData })
      setEditMode(false)
      alert("Profile updated successfully!")
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to update profile. Please try again.")
    }
    setIsLoading(false)
  }

  const handleLogout = () => {
    console.log("Logging out...")
    setUser(null)
    setFormData({
      name: "",
      email: "",
      phone: "",
      institution: "",
      address: "",
      experience: "",
      education: "",
      linkedin: "",
      portfolio: "",
      github: "",
      role: "",
      skills: [],
    })
    setResumeFile(null)
    setResumeAnalysis(null)
    setStage("auth")
    setHasApplication(false)
    setEditMode(false)
    localStorage.removeItem("clientUser")
  }

  const handleCodeVerified = (data) => {
    setInterviewData(data)
    setStage("interview")
  }

  // Show loading during initial session check
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/50">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-700 font-medium">Loading your session...</span>
          </div>
        </div>
      </div>
    )
  }

  // Render different stages
  if (stage === "auth") {
    return <ClientAuth onLogin={handleLogin} />
  }

  if (stage === "dashboard") {
    return <ClientDashboard user={user} onLogout={handleLogout} onInterviewCodeEntry={() => setStage("codeEntry")} />
  }

  if (stage === "codeEntry") {
    return <InterviewCodeEntry user={user} onCodeVerified={handleCodeVerified} onBack={() => setStage("dashboard")} />
  }

  if (stage === "interview") {
    return (
      <InterviewPlatform
        user={user}
        interviewData={interviewData}
        onComplete={(results) => {
          setInterviewResults(results)
          setStage("interviewComplete")
        }}
        onBack={() => setStage("dashboard")}
      />
    )
  }

  if (stage === "interviewComplete") {
    return <InterviewComplete user={user} results={interviewResults} onBackToDashboard={() => setStage("dashboard")} />
  }

  // Details/Profile editing stage
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-r from-blue-200/20 to-indigo-200/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div
          className="absolute bottom-32 left-16 w-80 h-80 bg-gradient-to-r from-indigo-200/20 to-purple-200/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-4xl mx-auto animate-slide-in">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4 tracking-tight">
              {hasApplication ? "Edit Profile" : "Complete Your Profile"}
            </h1>
            <p className="text-gray-600 text-lg">
              {hasApplication ? "Update your professional information" : "Fill in your details to apply"}
            </p>
            {user && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm">
                  <span className="font-semibold">Logged in as:</span> {user.name} ({user.email})
                </p>
              </div>
            )}
            {!hasApplication && (
              <div className="mt-6 max-w-md mx-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Profile Completion</span>
                  <span className="text-sm text-blue-600 font-semibold">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Main Card */}
          <div className="relative mx-auto w-full">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 rounded-3xl blur-xl"></div>
            <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/50">
              <form onSubmit={hasApplication ? handleUpdateProfile : handleSubmit} className="space-y-8">
                {/* Resume Upload Section - At the top */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-lg font-bold text-gray-800">Resume Upload</label>
                    {resumeFile && (
                      <button
                        type="button"
                        onClick={() => {
                          setResumeFile(null)
                          setResumeAnalysis(null)
                        }}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove Resume
                      </button>
                    )}
                  </div>

                  {!resumeFile ? (
                    <div
                      className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer ${
                        dragActive
                          ? "border-blue-400 bg-blue-50 scale-105"
                          : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <input
                        type="file"
                        accept=".txt,.md,.pdf,.doc,.docx"
                        onChange={handleUpload}
                        required={!hasApplication}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      {isLoading ? (
                        <div className="space-y-4">
                          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                            <svg
                              className="w-8 h-8 text-blue-600 animate-spin"
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
                          </div>
                          <div>
                            <p className="text-blue-600 font-semibold">Processing your resume...</p>
                            <p className="text-gray-500 text-sm">This may take a few moments</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                            <svg
                              className="w-8 h-8 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="text-gray-700 font-semibold">
                              Drop your resume here or <span className="text-blue-600 underline">browse files</span>
                            </p>
                            <p className="text-gray-500 text-sm">Supports PDF, TXT, DOC, DOCX (max 5MB)</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-green-800">{resumeFile.name}</p>
                          <p className="text-green-600 text-sm">
                            {(resumeFile.size / 1024 / 1024).toFixed(2)} MB • Uploaded successfully
                          </p>
                        </div>
                      </div>
                      {resumeAnalysis && (
                        <div className="mt-4 p-4 bg-white rounded-lg border border-green-200">
                          <h4 className="font-semibold text-gray-800 mb-2">Resume Analysis</h4>
                          <div className="space-y-2">
                            <p className="text-sm">
                              <span className="font-medium">Suggested Role:</span>{" "}
                              <span className="text-blue-600">{resumeAnalysis.role}</span>
                            </p>
                            {resumeAnalysis.skills.length > 0 && (
                              <div>
                                <span className="font-medium text-sm">Extracted Skills:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {resumeAnalysis.skills.slice(0, 8).map((skill, index) => (
                                    <span
                                      key={index}
                                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                  {resumeAnalysis.skills.length > 8 && (
                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                      +{resumeAnalysis.skills.length - 8} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Personal Information */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-2">
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        disabled={!!user} // Disable if user is logged in
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Enter your email address"
                      />
                      {user && <p className="text-xs text-gray-500 mt-1">Email cannot be changed after login</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                        placeholder="Enter your phone number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Institution *</label>
                      <input
                        type="text"
                        name="institution"
                        value={formData.institution}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                        placeholder="Your college/university"
                      />
                    </div>
                  </div>
                </div>

                {/* Professional Information */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-2">
                    Professional Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Education *</label>
                      <input
                        type="text"
                        name="education"
                        value={formData.education}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                        placeholder="e.g., B.Tech Computer Science"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Role/Position</label>
                      <input
                        type="text"
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                        placeholder="e.g., Frontend Developer"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Experience</label>
                      <textarea
                        name="experience"
                        value={formData.experience}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm resize-none"
                        placeholder="Describe your work experience..."
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        rows={2}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm resize-none"
                        placeholder="Your current address..."
                      />
                    </div>
                  </div>
                </div>

                {/* Links Section */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-2">Professional Links</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">LinkedIn Profile</label>
                      <input
                        type="url"
                        name="linkedin"
                        value={formData.linkedin}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                        placeholder="https://linkedin.com/in/yourprofile"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Portfolio Website</label>
                      <input
                        type="url"
                        name="portfolio"
                        value={formData.portfolio}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                        placeholder="https://yourportfolio.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">GitHub Profile</label>
                      <input
                        type="url"
                        name="github"
                        value={formData.github}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                        placeholder="https://github.com/yourusername"
                      />
                    </div>
                  </div>
                </div>

                {/* Skills Section */}
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-gray-700">Skills</label>
                  <input
                    type="text"
                    value={formData.skills.join(", ")}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        skills: e.target.value
                          .split(",")
                          .map((skill) => skill.trim())
                          .filter(Boolean),
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                    placeholder="e.g., JavaScript, React, Node.js, Python"
                  />
                  <p className="text-sm text-gray-500">Separate skills with commas</p>
                  {formData.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full border border-blue-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="text-red-800 font-medium">{error}</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <button
                    type="button"
                    onClick={onBack}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                  >
                    Back to Home
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-6 py-3 border border-red-300 text-red-700 rounded-xl hover:bg-red-50 transition-all duration-200 font-medium"
                  >
                    Logout
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || (!resumeFile && !hasApplication)}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-8 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>{hasApplication ? "Updating..." : "Submitting..."}</span>
                      </div>
                    ) : hasApplication ? (
                      "Update Profile"
                    ) : (
                      "Submit Application"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClientHome
