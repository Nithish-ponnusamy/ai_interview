"use client"

import { useState, useEffect } from "react"

function AdminHome({ onBack, clientName, setClientName, task, setTask, assigned, setAssigned }) {
  const [isFormFocused, setIsFormFocused] = useState(false)
  const [particles, setParticles] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Generate floating particles
  useEffect(() => {
    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 1 + 0.5,
      opacity: Math.random() * 0.3 + 0.1,
    }))
    setParticles(newParticles)
  }, [])

  // Animate particles
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles((prev) =>
        prev.map((particle) => ({
          ...particle,
          y: particle.y > 100 ? -5 : particle.y + particle.speed * 0.08,
          x: particle.x + Math.sin(Date.now() * 0.001 + particle.id) * 0.05,
        })),
      )
    }, 100)

    return () => clearInterval(interval)
  }, [])

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setAssigned(true)
    setIsSubmitting(false)

    setTimeout(() => setAssigned(false), 4000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-r from-blue-200/20 to-indigo-200/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div
          className="absolute bottom-32 left-16 w-80 h-80 bg-gradient-to-r from-indigo-200/20 to-purple-200/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-100/30 to-indigo-100/30 rounded-full mix-blend-multiply filter blur-xl animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      {/* Floating Particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-1 h-1 bg-blue-400/30 rounded-full animate-pulse"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
          }}
        />
      ))}

      {/* Geometric Shapes */}
      <div className="absolute top-20 left-20 w-24 h-24 border border-blue-300/20 rounded-full animate-spin-slow"></div>
      <div className="absolute bottom-32 right-16 w-20 h-20 border border-indigo-300/20 rounded-lg rotate-45 animate-pulse"></div>
      <div className="absolute top-1/3 right-20 w-16 h-16 border border-purple-300/20 rounded-full animate-bounce"></div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-8">
        <div className="w-full max-w-lg">
          {/* Professional Card */}
          <div
            className={`relative bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/50 transition-all duration-500 ${
              isFormFocused ? "scale-105 shadow-3xl" : ""
            }`}
          >
            {/* Card Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 rounded-3xl blur-xl"></div>

            <div className="relative z-10">
              {/* Header Section */}
              <div className="text-center mb-8">
                {/* Professional Logo */}
                <div className="relative mb-6">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center shadow-xl relative group hover:scale-105 transition-transform duration-300">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 animate-pulse opacity-20"></div>
                    <svg className="w-10 h-10 text-white z-10 relative" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  {/* Status Indicator */}
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center animate-pulse">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>

                <h2 className="text-3xl font-bold text-gray-800 mb-2">Admin Dashboard</h2>
                <p className="text-gray-600 text-lg">Assign interview tasks to candidates</p>
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>System Online</span>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-6" onFocus={() => setIsFormFocused(true)} onBlur={() => setIsFormFocused(false)}>
                {/* Client Name Field */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-gray-700 font-semibold text-sm">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Client Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter client's full name"
                    className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-blue-50/50 transition-all duration-300"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    required
                  />
                </div>

                {/* Task Field */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-gray-700 font-semibold text-sm">
                    <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Interview Task
                  </label>
                  <textarea
                    placeholder="Describe the interview task or questions..."
                    className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:bg-indigo-50/50 transition-all duration-300 resize-none"
                    value={task}
                    onChange={(e) => setTask(e.target.value)}
                    rows={4}
                    required
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!clientName || !task || isSubmitting}
                  className="w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 overflow-hidden disabled:cursor-not-allowed bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:opacity-50 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  <div className="relative flex items-center justify-center gap-3">
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Assigning Task...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>Assign Task</span>
                      </>
                    )}
                  </div>
                </button>

                {/* Success Message */}
                {assigned && (
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center animate-slide-in">
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <p className="text-green-800 font-bold text-lg">Task Successfully Assigned!</p>
                    </div>
                    <p className="text-green-700">
                      Client: <span className="font-semibold">{clientName}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Back Button */}
              <div className="mt-8 text-center">
                <button
                  onClick={onBack}
                  className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors duration-300 font-medium"
                >
                  <svg
                    className="w-4 h-4 transition-transform group-hover:-translate-x-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="underline">Back to Home</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminHome
