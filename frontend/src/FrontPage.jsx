"use client"

import { useState, useEffect } from "react"

function FrontPage({ onSelect }) {
  const [hoveredButton, setHoveredButton] = useState(null)
  const [particles, setParticles] = useState([])

  // Generate floating particles
  useEffect(() => {
    const newParticles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 1.5 + 0.5,
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-r from-blue-200/30 to-indigo-200/30 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div
          className="absolute bottom-32 left-16 w-80 h-80 bg-gradient-to-r from-purple-200/30 to-pink-200/30 rounded-full mix-blend-multiply filter blur-xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-indigo-200/20 to-blue-200/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      {/* Floating Particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-1 h-1 bg-blue-400/40 rounded-full animate-pulse"
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
      <div className="absolute top-20 left-20 w-32 h-32 border border-blue-300/20 rounded-full animate-spin-slow"></div>
      <div className="absolute bottom-20 right-20 w-24 h-24 border border-indigo-300/20 rounded-lg rotate-45 animate-pulse"></div>
      <div className="absolute top-1/3 right-20 w-16 h-16 border border-purple-300/20 rounded-full animate-bounce"></div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md mx-auto animate-slide-in">
          {/* Professional Card */}
          <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/50 hover:shadow-3xl transition-all duration-500">
            {/* Card Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 rounded-3xl blur-xl"></div>

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
                        d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  {/* Status Indicator */}
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center animate-pulse">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>

                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2 tracking-tight">
                  AI Interview Platform
                </h1>
                <p className="text-gray-600 text-lg font-medium mb-2">Professional Recruitment Solution</p>
                <p className="text-gray-500 text-sm">Choose your role to access the platform</p>
              </div>

              {/* Navigation Buttons */}
              <div className="space-y-4">
                {/* Admin Button */}
                <button
                  className={`group relative w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 overflow-hidden ${
                    hoveredButton === "admin" ? "transform scale-105 shadow-xl" : "shadow-lg hover:shadow-xl"
                  }`}
                  onClick={() => onSelect("admin")}
                  onMouseEnter={() => setHoveredButton("admin")}
                  onMouseLeave={() => setHoveredButton(null)}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300 group-hover:from-blue-700 group-hover:to-indigo-700"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  <div className="relative flex items-center justify-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span className="text-white">Admin Dashboard</span>
                    <svg
                      className="w-5 h-5 text-white/70 group-hover:translate-x-1 transition-transform duration-300"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </button>

                {/* Client Button */}
                <button
                  className={`group relative w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 overflow-hidden ${
                    hoveredButton === "client" ? "transform scale-105 shadow-xl" : "shadow-lg hover:shadow-xl"
                  }`}
                  onClick={() => onSelect("client")}
                  onMouseEnter={() => setHoveredButton("client")}
                  onMouseLeave={() => setHoveredButton(null)}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 transition-all duration-300 group-hover:from-emerald-700 group-hover:to-teal-700"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  <div className="relative flex items-center justify-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span className="text-white">Client Portal</span>
                    <svg
                      className="w-5 h-5 text-white/70 group-hover:translate-x-1 transition-transform duration-300"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </button>
              </div>

              {/* Footer Info */}
              <div className="mt-8 text-center">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>System Online</span>
                </div>
                <p className="text-xs text-gray-400">Powered by AI • Secure • Professional</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FrontPage
