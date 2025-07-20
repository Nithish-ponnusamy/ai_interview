"use client"

import { useState } from "react"
import axios from "axios"

function InterviewCodeEntry({ user, onCodeVerified, onBack }) {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!code.trim()) {
      setError("Please enter the interview code")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await axios.post("http://localhost:5000/api/client/verify-interview-code", {
        email: user.email,
        code: code.trim(),
      })

      if (response.data.success) {
        onCodeVerified(response.data.interviewData)
      } else {
        setError("Invalid interview code. Please check your email and try again.")
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to verify code. Please try again.")
      console.error("Code verification error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/50">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Enter Interview Code</h2>
            <p className="text-gray-600">Please enter the interview code sent to your email</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Interview Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-digit code (e.g., ABC123)"
                className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-green-50/50 transition-all duration-300 text-center text-lg font-mono tracking-wider"
                maxLength={6}
                required
              />
              <p className="text-xs text-gray-500 mt-2">Check your email for the 6-character interview code</p>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
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

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:opacity-50 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Verifying Code...</span>
                </div>
              ) : (
                "Start Interview"
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={onBack}
                className="text-gray-500 hover:text-gray-700 underline font-medium transition-colors duration-300"
              >
                Back to Dashboard
              </button>
            </div>
          </form>

          {/* Interview Process Info */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h4 className="text-blue-800 font-semibold text-sm mb-1">Interview Process</h4>
                <div className="text-blue-700 text-xs space-y-1">
                  <p>
                    • <strong>Aptitude Round:</strong> 10 questions - 15 minutes
                  </p>
                  <p>
                    • <strong>Coding Round:</strong> 3 problems - 45 minutes
                  </p>
                  <p>
                    • <strong>HR Round:</strong> 5 questions - 20 minutes
                  </p>
                  <p className="font-semibold">Total Duration: 80 minutes</p>
                </div>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h4 className="text-amber-800 font-semibold text-sm mb-1">Can't find your code?</h4>
                <p className="text-amber-700 text-xs">
                  Check your email inbox and spam folder. The code was sent to{" "}
                  <span className="font-medium">{user?.email}</span>. If you still can't find it, contact support.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InterviewCodeEntry
