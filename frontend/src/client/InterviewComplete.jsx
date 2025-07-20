"use client"

import { useState } from "react"

function InterviewComplete({ user, results, onBackToDashboard }) {
  const [showDetails, setShowDetails] = useState(false)

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBg = (score) => {
    if (score >= 80) return "bg-green-100 border-green-200"
    if (score >= 60) return "bg-yellow-100 border-yellow-200"
    return "bg-red-100 border-red-200"
  }

  const getGrade = (score) => {
    if (score >= 90) return "A+"
    if (score >= 80) return "A"
    if (score >= 70) return "B+"
    if (score >= 60) return "B"
    if (score >= 50) return "C"
    return "D"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-xl shadow-lg border-b border-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Interview Complete!</h1>
                <p className="text-gray-600">Thank you, {user?.name}</p>
              </div>
            </div>
            <button
              onClick={onBackToDashboard}
              className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium transition-colors duration-300"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Congratulations!</h2>
          <p className="text-gray-600 text-lg">
            You have successfully completed all rounds of the AI interview process.
          </p>
        </div>

        {/* Overall Score */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/50 mb-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Overall Performance</h3>
            <div className="flex items-center justify-center space-x-8">
              <div className="text-center">
                <div className={`text-6xl font-bold ${getScoreColor(results.totalScore)} mb-2`}>
                  {results.totalScore}%
                </div>
                <div className="text-gray-600 font-medium">Total Score</div>
              </div>
              <div className="text-center">
                <div className={`text-4xl font-bold ${getScoreColor(results.totalScore)} mb-2`}>
                  {getGrade(results.totalScore)}
                </div>
                <div className="text-gray-600 font-medium">Grade</div>
              </div>
            </div>
          </div>
        </div>

        {/* Round-wise Scores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Aptitude Score */}
          <div className={`p-6 rounded-xl border-2 ${getScoreBg(results.aptitudeScore)}`}>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="font-bold text-gray-800 mb-2">Aptitude Round</h4>
              <div className={`text-3xl font-bold ${getScoreColor(results.aptitudeScore)} mb-1`}>
                {results.aptitudeScore}%
              </div>
              <div className="text-sm text-gray-600">
                {results.aptitudeAnswers?.filter((a) => a.isCorrect).length || 0} / 10 correct
              </div>
            </div>
          </div>

          {/* Coding Score */}
          <div className={`p-6 rounded-xl border-2 ${getScoreBg(results.codingScore)}`}>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h4 className="font-bold text-gray-800 mb-2">Coding Round</h4>
              <div className={`text-3xl font-bold ${getScoreColor(results.codingScore)} mb-1`}>
                {results.codingScore}%
              </div>
              <div className="text-sm text-gray-600">{results.codingAnswers?.length || 0} / 3 problems attempted</div>
            </div>
          </div>

          {/* HR Score */}
          <div className={`p-6 rounded-xl border-2 ${getScoreBg(results.hrScore)}`}>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h4 className="font-bold text-gray-800 mb-2">HR Round</h4>
              <div className={`text-3xl font-bold ${getScoreColor(results.hrScore)} mb-1`}>{results.hrScore}%</div>
              <div className="text-sm text-gray-600">{results.hrAnswers?.length || 0} / 5 questions answered</div>
            </div>
          </div>
        </div>

        {/* Detailed Results Toggle */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50 mb-8">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-300"
          >
            <span className="font-semibold text-gray-800">View Detailed Results</span>
            <svg
              className={`w-5 h-5 text-gray-600 transform transition-transform duration-300 ${
                showDetails ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showDetails && (
            <div className="mt-6 space-y-6">
              {/* Aptitude Details */}
              <div>
                <h4 className="font-bold text-gray-800 mb-3">Aptitude Round Details</h4>
                <div className="space-y-2">
                  {results.aptitudeAnswers?.map((answer, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        answer.isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-800">
                          Q{index + 1}: {answer.question.substring(0, 50)}...
                        </span>
                        <span
                          className={`text-sm font-semibold ${answer.isCorrect ? "text-green-600" : "text-red-600"}`}
                        >
                          {answer.isCorrect ? "Correct" : "Incorrect"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coding Details */}
              <div>
                <h4 className="font-bold text-gray-800 mb-3">Coding Round Details</h4>
                <div className="space-y-2">
                  {results.codingAnswers?.map((answer, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-800">{answer.question}</span>
                        <span className="text-sm font-semibold text-blue-600">Score: {answer.score}/10</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        Solution length: {answer.solution?.length || 0} characters
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* HR Details */}
              <div>
                <h4 className="font-bold text-gray-800 mb-3">HR Round Details</h4>
                <div className="space-y-2">
                  {results.hrAnswers?.map((answer, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-800">
                          Q{index + 1}: {answer.question.substring(0, 40)}...
                        </span>
                        <span className="text-sm font-semibold text-purple-600">Score: {answer.score}/10</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        Answer length: {answer.answer?.length || 0} characters
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-blue-800 mb-2">What's Next?</h4>
              <div className="text-blue-700 space-y-2">
                <p>• Your interview results have been submitted to our recruitment team</p>
                <p>• You will receive an email confirmation shortly</p>
                <p>• Our team will review your performance and contact you within 3-5 business days</p>
                <p>• Keep an eye on your email for further updates</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="text-center mt-8 space-y-4">
          <button
            onClick={onBackToDashboard}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Return to Dashboard
          </button>
          <p className="text-sm text-gray-500">Thank you for participating in our AI interview process!</p>
        </div>
      </main>
    </div>
  )
}

export default InterviewComplete
