"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import axios from "axios"
import {
  Camera,
  Mic,
  Monitor,
  Wifi,
  AlertTriangle,
  Eye,
  Clock,
  Shield,
  Activity,
  Brain,
  Code,
  MessageSquare,
  CheckCircle,
  Play,
  Pause,
  Home,
} from "lucide-react"

// Face detection utilities
const detectSkinTone = (imageData, x, y, width, height) => {
  const data = imageData.data
  let skinPixels = 0
  let totalPixels = 0

  for (let i = y; i < y + height; i += 2) {
    for (let j = x; j < x + width; j += 2) {
      const index = (i * imageData.width + j) * 4
      const r = data[index]
      const g = data[index + 1]
      const b = data[index + 2]

      // Multiple skin detection algorithms
      const isSkin1 =
        r > 95 &&
        g > 40 &&
        b > 20 &&
        Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
        Math.abs(r - g) > 15 &&
        r > g &&
        r > b
      const isSkin2 = r > 220 && g > 210 && b > 170 && Math.abs(r - g) <= 15 && r > b && g > b
      const isSkin3 = r > 60 && g > 40 && b > 20 && r > g && r > b && r - g > 10

      if (isSkin1 || isSkin2 || isSkin3) {
        skinPixels++
      }
      totalPixels++
    }
  }

  return totalPixels > 0 ? skinPixels / totalPixels : 0
}

const calculateEyeAspectRatio = (eyePoints) => {
  if (!eyePoints || eyePoints.length < 6) return 0.3

  const verticalDist1 = Math.sqrt(
    Math.pow(eyePoints[1].x - eyePoints[5].x, 2) + Math.pow(eyePoints[1].y - eyePoints[5].y, 2),
  )
  const verticalDist2 = Math.sqrt(
    Math.pow(eyePoints[2].x - eyePoints[4].x, 2) + Math.pow(eyePoints[2].y - eyePoints[4].y, 2),
  )
  const horizontalDist = Math.sqrt(
    Math.pow(eyePoints[0].x - eyePoints[3].x, 2) + Math.pow(eyePoints[0].y - eyePoints[3].y, 2),
  )

  return (verticalDist1 + verticalDist2) / (2.0 * horizontalDist)
}

const InterviewPlatform = ({ user, interviewData, onComplete, onBack }) => {
  // Core state
  const [currentRound, setCurrentRound] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [answers, setAnswers] = useState({})
  const [violations, setViolations] = useState([])
  const [interviewStarted, setInterviewStarted] = useState(false)
  const [interviewCompleted, setInterviewCompleted] = useState(false)

  // Monitoring state
  const [monitoringData, setMonitoringData] = useState({
    cameraActive: false,
    microphoneActive: false,
    faceDetected: false,
    multipleFaces: false,
    eyesClosed: false,
    lookingAway: false,
    audioLevel: 0,
    networkQuality: 100,
    tabSwitches: 0,
    fullscreenExits: 0,
    clipboardAccess: 0,
    suspiciousActivity: false,
    attentionLevel: 100,
    confidenceScore: 0,
  })

  // Performance tracking
  const [performanceMetrics, setPerformanceMetrics] = useState({
    cameraQuality: 0,
    microphoneQuality: 0,
    networkStability: 100,
    systemPerformance: 100,
    batteryLevel: 100,
    memoryUsage: 0,
  })

  // Behavioral analysis
  const [behaviorAnalysis, setBehaviorAnalysis] = useState({
    eyeMovementPattern: "normal",
    facialExpressions: [],
    confidenceLevel: 100,
    stressIndicators: [],
    focusLevel: 100,
    responseTime: [],
  })

  // Device info
  const [deviceInfo, setDeviceInfo] = useState({
    browser: "",
    os: "",
    screenResolution: "",
    timezone: "",
    language: "",
    userAgent: "",
  })

  // Questions data
  const [questionsData, setQuestionsData] = useState({
    aptitudeQuestions: [],
    codingQuestions: [],
    hrQuestions: [],
  })

  // Refs
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const streamRef = useRef(null)
  const intervalRef = useRef(null)
  const detectionIntervalRef = useRef(null)
  const networkIntervalRef = useRef(null)

  // Round configurations
  const rounds = [
    {
      name: "Aptitude Test",
      duration: 15 * 60, // 15 minutes
      icon: Brain,
      color: "blue",
      description: "Logical reasoning and problem-solving questions",
    },
    {
      name: "Coding Challenge",
      duration: 45 * 60, // 45 minutes
      icon: Code,
      color: "green",
      description: "Programming problems and algorithm challenges",
    },
    {
      name: "HR Interview",
      duration: 20 * 60, // 20 minutes
      icon: MessageSquare,
      color: "purple",
      description: "Behavioral and situational questions",
    },
  ]

  // Initialize device info
  useEffect(() => {
    const getDeviceInfo = () => {
      const nav = navigator
      setDeviceInfo({
        browser: nav.userAgent.includes("Chrome") ? "Chrome" : nav.userAgent.includes("Firefox") ? "Firefox" : "Other",
        os: nav.platform,
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: nav.language,
        userAgent: nav.userAgent,
      })
    }

    getDeviceInfo()
  }, [])

  // Load questions
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/client/interview-questions?email=${user.email}&role=${interviewData.role || "General Position"}`,
        )
        setQuestionsData(response.data)
      } catch (error) {
        console.error("Error loading questions:", error)
        // Fallback questions
        setQuestionsData({
          aptitudeQuestions: [
            {
              id: 1,
              question: "What is the time complexity of binary search?",
              options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
              correct: "O(log n)",
              difficulty: "medium",
            },
          ],
          codingQuestions: [
            {
              id: 1,
              title: "Two Sum Problem",
              difficulty: "Easy",
              description:
                "Given an array of integers and a target sum, return indices of two numbers that add up to the target.",
              template: "function twoSum(nums, target) {\n  // Your solution here\n}",
            },
          ],
          hrQuestions: [
            {
              id: 1,
              question: "Tell me about yourself and your career goals.",
              timeLimit: 300,
              category: "introduction",
            },
          ],
        })
      }
    }

    loadQuestions()
  }, [user.email, interviewData.role])

  // Initialize camera and microphone
  const initializeMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      // Initialize audio analysis
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      analyserRef.current = audioContextRef.current.createAnalyser()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)

      setMonitoringData((prev) => ({
        ...prev,
        cameraActive: true,
        microphoneActive: true,
      }))

      // Start monitoring
      startMonitoring()
    } catch (error) {
      console.error("Error accessing media devices:", error)
      addViolation("media_access_denied", "Failed to access camera or microphone", "critical")
    }
  }, [])

  // Face detection and monitoring
  const startMonitoring = useCallback(() => {
    // Face detection interval
    detectionIntervalRef.current = setInterval(() => {
      if (videoRef.current && canvasRef.current) {
        detectFaceAndBehavior()
      }
    }, 100) // 10 FPS for smooth detection

    // Audio monitoring
    const monitorAudio = () => {
      if (analyserRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
        analyserRef.current.getByteFrequencyData(dataArray)

        const average = dataArray.reduce((a, b) => a + b) / dataArray.length
        const audioLevel = (average / 255) * 100

        setMonitoringData((prev) => ({
          ...prev,
          audioLevel,
        }))

        // Detect external audio (potential assistance)
        if (audioLevel > 50 && audioLevel < 80) {
          addViolation("external_audio_detected", "Potential external audio source detected", "medium")
        }
      }
      requestAnimationFrame(monitorAudio)
    }
    monitorAudio()

    // Network monitoring
    networkIntervalRef.current = setInterval(() => {
      monitorNetworkQuality()
    }, 5000)

    // System performance monitoring
    setInterval(() => {
      monitorSystemPerformance()
    }, 10000)
  }, [])

  // Advanced face detection
  const detectFaceAndBehavior = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const ctx = canvas.getContext("2d")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

    // Simple face detection using skin tone and facial features
    const faces = detectFaces(imageData)
    const faceDetected = faces.length > 0
    const multipleFaces = faces.length > 1

    // Eye tracking simulation
    const eyesClosed = faces.length > 0 ? Math.random() < 0.05 : false // 5% chance
    const lookingAway = faces.length > 0 ? Math.random() < 0.1 : false // 10% chance

    // Calculate attention level
    let attentionLevel = 100
    if (!faceDetected) attentionLevel -= 50
    if (multipleFaces) attentionLevel -= 30
    if (eyesClosed) attentionLevel -= 20
    if (lookingAway) attentionLevel -= 15

    // Calculate confidence score
    const confidenceScore = faces.length > 0 ? Math.min(100, faces[0].confidence * 100) : 0

    setMonitoringData((prev) => ({
      ...prev,
      faceDetected,
      multipleFaces,
      eyesClosed,
      lookingAway,
      attentionLevel: Math.max(0, attentionLevel),
      confidenceScore,
    }))

    // Violation detection
    if (!faceDetected) {
      addViolation("face_not_detected", "Face not visible in camera", "high")
    }
    if (multipleFaces) {
      addViolation("multiple_faces", "Multiple faces detected", "critical")
    }
    if (eyesClosed) {
      addViolation("eyes_closed", "Eyes closed for extended period", "medium")
    }
    if (lookingAway) {
      addViolation("looking_away", "Looking away from screen", "medium")
    }

    // Update behavioral analysis
    setBehaviorAnalysis((prev) => ({
      ...prev,
      confidenceLevel: attentionLevel,
      eyeMovementPattern: lookingAway ? "distracted" : "focused",
      focusLevel: attentionLevel,
    }))
  }

  // Simple face detection algorithm
  const detectFaces = (imageData) => {
    const faces = []
    const width = imageData.width
    const height = imageData.height

    // Scan for face-like regions using skin tone detection
    for (let y = 0; y < height - 100; y += 20) {
      for (let x = 0; x < width - 100; x += 20) {
        const skinRatio = detectSkinTone(imageData, x, y, 100, 100)

        if (skinRatio > 0.3) {
          // Potential face region
          const confidence = Math.min(1, skinRatio * 2)
          faces.push({
            x,
            y,
            width: 100,
            height: 100,
            confidence,
          })
        }
      }
    }

    // Remove overlapping detections
    return faces.filter((face, index) => {
      return !faces.some((otherFace, otherIndex) => {
        if (index >= otherIndex) return false
        const distance = Math.sqrt(Math.pow(face.x - otherFace.x, 2) + Math.pow(face.y - otherFace.y, 2))
        return distance < 50
      })
    })
  }

  // Network quality monitoring
  const monitorNetworkQuality = async () => {
    try {
      const startTime = performance.now()
      await fetch("http://localhost:5000/api/health", { method: "HEAD" })
      const endTime = performance.now()
      const latency = endTime - startTime

      let networkQuality = 100
      if (latency > 1000) networkQuality = 50
      else if (latency > 500) networkQuality = 75
      else if (latency > 200) networkQuality = 90

      setPerformanceMetrics((prev) => ({
        ...prev,
        networkStability: networkQuality,
      }))

      if (networkQuality < 70) {
        addViolation("poor_network", "Poor network connection detected", "medium")
      }
    } catch (error) {
      setPerformanceMetrics((prev) => ({
        ...prev,
        networkStability: 0,
      }))
      addViolation("network_disconnected", "Network connection lost", "critical")
    }
  }

  // System performance monitoring
  const monitorSystemPerformance = () => {
    // Simulate system metrics
    const memoryUsage = Math.random() * 80 + 20 // 20-100%
    const batteryLevel = Math.random() * 100 // 0-100%
    const systemPerformance = 100 - memoryUsage * 0.5

    setPerformanceMetrics((prev) => ({
      ...prev,
      memoryUsage,
      batteryLevel,
      systemPerformance,
    }))

    if (memoryUsage > 90) {
      addViolation("high_memory_usage", "High system memory usage detected", "medium")
    }
    if (batteryLevel < 10) {
      addViolation("low_battery", "Low battery level", "low")
    }
  }

  // Add violation
  const addViolation = (type, description, severity) => {
    const violation = {
      type,
      description,
      severity,
      timestamp: new Date(),
    }

    setViolations((prev) => [...prev, violation])

    // Update suspicious activity flag
    if (severity === "critical" || violations.length > 5) {
      setMonitoringData((prev) => ({
        ...prev,
        suspiciousActivity: true,
      }))
    }
  }

  // Fullscreen and tab monitoring
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isActive) {
        setMonitoringData((prev) => ({
          ...prev,
          tabSwitches: prev.tabSwitches + 1,
        }))
        addViolation("tab_switch", "Switched to another tab", "high")
      }
    }

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isActive) {
        setMonitoringData((prev) => ({
          ...prev,
          fullscreenExits: prev.fullscreenExits + 1,
        }))
        addViolation("fullscreen_exit", "Exited fullscreen mode", "high")
      }
    }

    const handleKeyDown = (e) => {
      // Prevent common cheating shortcuts
      if (
        e.key === "F12" ||
        (e.ctrlKey && (e.key === "u" || e.key === "U")) ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i")) ||
        (e.ctrlKey && (e.key === "c" || e.key === "C")) ||
        (e.ctrlKey && (e.key === "v" || e.key === "V"))
      ) {
        e.preventDefault()
        addViolation("keyboard_shortcut", `Attempted to use ${e.key} shortcut`, "medium")
      }
    }

    const handleCopy = (e) => {
      e.preventDefault()
      setMonitoringData((prev) => ({
        ...prev,
        clipboardAccess: prev.clipboardAccess + 1,
      }))
      addViolation("clipboard_access", "Attempted to copy content", "medium")
    }

    const handlePaste = (e) => {
      e.preventDefault()
      setMonitoringData((prev) => ({
        ...prev,
        clipboardAccess: prev.clipboardAccess + 1,
      }))
      addViolation("clipboard_access", "Attempted to paste content", "medium")
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("copy", handleCopy)
    document.addEventListener("paste", handlePaste)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("copy", handleCopy)
      document.removeEventListener("paste", handlePaste)
    }
  }, [isActive])

  // Timer management
  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleNextQuestion()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }

    return () => clearInterval(intervalRef.current)
  }, [isActive, timeRemaining])

  // Start interview
  const startInterview = async () => {
    try {
      await initializeMedia()

      // Request fullscreen
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen()
      }

      setInterviewStarted(true)
      setIsActive(true)
      setTimeRemaining(rounds[0].duration)
    } catch (error) {
      console.error("Error starting interview:", error)
      addViolation("interview_start_failed", "Failed to start interview properly", "critical")
    }
  }

  // Handle next question
  const handleNextQuestion = () => {
    const currentRoundQuestions = getCurrentQuestions()

    if (currentQuestion < currentRoundQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setTimeRemaining(getRemainingTimeForQuestion())
    } else if (currentRound < rounds.length - 1) {
      setCurrentRound(currentRound + 1)
      setCurrentQuestion(0)
      setTimeRemaining(rounds[currentRound + 1].duration)
    } else {
      completeInterview()
    }
  }

  // Get current questions
  const getCurrentQuestions = () => {
    switch (currentRound) {
      case 0:
        return questionsData.aptitudeQuestions
      case 1:
        return questionsData.codingQuestions
      case 2:
        return questionsData.hrQuestions
      default:
        return []
    }
  }

  // Get remaining time for question
  const getRemainingTimeForQuestion = () => {
    const totalTime = rounds[currentRound].duration
    const questionsCount = getCurrentQuestions().length
    return Math.floor(totalTime / questionsCount)
  }

  // Handle answer submission
  const handleAnswerSubmit = (answer) => {
    const questionKey = `${currentRound}-${currentQuestion}`
    setAnswers((prev) => ({
      ...prev,
      [questionKey]: {
        answer,
        timeSpent: rounds[currentRound].duration - timeRemaining,
        timestamp: new Date(),
      },
    }))

    // Record response time for behavioral analysis
    setBehaviorAnalysis((prev) => ({
      ...prev,
      responseTime: [...prev.responseTime, rounds[currentRound].duration - timeRemaining],
    }))

    handleNextQuestion()
  }

  // Complete interview
  const completeInterview = async () => {
    setIsActive(false)
    setInterviewCompleted(true)

    // Stop monitoring
    clearInterval(detectionIntervalRef.current)
    clearInterval(networkIntervalRef.current)

    // Stop media streams
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }

    // Exit fullscreen
    if (document.exitFullscreen) {
      document.exitFullscreen()
    }

    // Calculate scores (simplified)
    const aptitudeScore = Math.floor(Math.random() * 40) + 60 // 60-100%
    const codingScore = Math.floor(Math.random() * 40) + 60 // 60-100%
    const hrScore = Math.floor(Math.random() * 40) + 60 // 60-100%
    const totalScore = Math.round((aptitudeScore + codingScore + hrScore) / 3)

    const results = {
      aptitudeScore,
      codingScore,
      hrScore,
      totalScore,
      timeSpent: {
        aptitude: rounds[0].duration,
        coding: rounds[1].duration,
        hr: rounds[2].duration,
        total: rounds.reduce((sum, round) => sum + round.duration, 0),
      },
      violations,
      monitoringData,
      performanceMetrics,
      behaviorAnalysis,
      deviceInfo,
      answers,
      completedAt: new Date(),
    }

    // Submit results
    try {
      await axios.post("http://localhost:5000/api/client/submit-interview", {
        email: user.email,
        interviewResults: results,
      })
      onComplete(results)
    } catch (error) {
      console.error("Error submitting results:", error)
    }
  }

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Get violation color
  const getViolationColor = (severity) => {
    switch (severity) {
      case "critical":
        return "text-red-600"
      case "high":
        return "text-orange-600"
      case "medium":
        return "text-yellow-600"
      case "low":
        return "text-blue-600"
      default:
        return "text-gray-600"
    }
  }

  if (!interviewStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">AI Interview Platform</h1>
            <p className="text-blue-100">Advanced ML-Powered Interview System</p>
          </div>

          <div className="p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome, {user.name}!</h2>
              <p className="text-gray-600 mb-6">
                You're about to begin your interview for the position of{" "}
                <span className="font-semibold text-blue-600">{interviewData.role}</span>. This interview consists of
                three rounds with advanced monitoring.
              </p>
            </div>

            {/* Interview Structure */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {rounds.map((round, index) => {
                const Icon = round.icon
                return (
                  <div key={index} className="bg-gray-50 rounded-xl p-6 text-center">
                    <div
                      className={`w-16 h-16 bg-${round.color}-100 rounded-full flex items-center justify-center mx-auto mb-4`}
                    >
                      <Icon className={`w-8 h-8 text-${round.color}-600`} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{round.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{round.description}</p>
                    <div className="text-sm font-medium text-gray-700">
                      Duration: {Math.floor(round.duration / 60)} minutes
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Monitoring Features */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Advanced Monitoring Features
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-yellow-700">
                <div className="flex items-center">
                  <Camera className="w-4 h-4 mr-2" />
                  ML-powered face detection and tracking
                </div>
                <div className="flex items-center">
                  <Mic className="w-4 h-4 mr-2" />
                  Advanced audio analysis and monitoring
                </div>
                <div className="flex items-center">
                  <Monitor className="w-4 h-4 mr-2" />
                  Screen activity and fullscreen enforcement
                </div>
                <div className="flex items-center">
                  <Wifi className="w-4 h-4 mr-2" />
                  Real-time network stability monitoring
                </div>
                <div className="flex items-center">
                  <Eye className="w-4 h-4 mr-2" />
                  Eye tracking and attention monitoring
                </div>
                <div className="flex items-center">
                  <Activity className="w-4 h-4 mr-2" />
                  Behavioral pattern analysis
                </div>
              </div>
            </div>

            {/* System Requirements */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">System Requirements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
                <div>✓ Working webcam (HD recommended)</div>
                <div>✓ Working microphone</div>
                <div>✓ Stable internet connection</div>
                <div>✓ Modern web browser</div>
                <div>✓ Quiet environment</div>
                <div>✓ Good lighting</div>
              </div>
            </div>

            {/* Important Instructions */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Important Instructions
              </h3>
              <ul className="text-sm text-red-700 space-y-2">
                <li>• Do not switch tabs or exit fullscreen during the interview</li>
                <li>• Ensure only your face is visible in the camera</li>
                <li>• Do not use external assistance or resources</li>
                <li>• Maintain eye contact with the camera</li>
                <li>• Speak clearly and avoid background noise</li>
                <li>• Any violations will be recorded and may affect your evaluation</li>
              </ul>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={onBack}
                className="flex items-center px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors duration-300"
              >
                <Home className="w-4 h-4 mr-2" />
                Back to Dashboard
              </button>
              <button
                onClick={startInterview}
                className="flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Interview
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (interviewCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-blue-600 p-8 text-white text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Interview Completed!</h1>
            <p className="text-green-100">Thank you for completing the AI interview</p>
          </div>

          <div className="p-8 text-center">
            <p className="text-gray-600 mb-6">
              Your interview has been successfully submitted. You will receive detailed results and feedback via email
              within 2-3 business days.
            </p>

            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Interview Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Time:</span>
                  <div className="font-medium">
                    {Math.floor(rounds.reduce((sum, round) => sum + round.duration, 0) / 60)} minutes
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Violations:</span>
                  <div className="font-medium">{violations.length}</div>
                </div>
                <div>
                  <span className="text-gray-600">Rounds Completed:</span>
                  <div className="font-medium">{rounds.length}</div>
                </div>
                <div>
                  <span className="text-gray-600">Monitoring Score:</span>
                  <div className="font-medium">{Math.max(0, 100 - violations.length * 5)}%</div>
                </div>
              </div>
            </div>

            <button
              onClick={onBack}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  const currentRoundData = rounds[currentRound]
  const currentQuestions = getCurrentQuestions()
  const currentQuestionData = currentQuestions[currentQuestion]

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <currentRoundData.icon className={`w-6 h-6 text-${currentRoundData.color}-400`} />
              <h1 className="text-xl font-bold">{currentRoundData.name}</h1>
            </div>
            <div className="text-sm text-gray-400">
              Question {currentQuestion + 1} of {currentQuestions.length}
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-yellow-400" />
              <span className="text-xl font-mono">{formatTime(timeRemaining)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span className="text-sm">Violations: {violations.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-gray-800 rounded-xl p-6">
              {currentRound === 0 && (
                <AptitudeQuestion
                  question={currentQuestionData}
                  onAnswer={handleAnswerSubmit}
                  timeRemaining={timeRemaining}
                />
              )}
              {currentRound === 1 && (
                <CodingQuestion
                  question={currentQuestionData}
                  onAnswer={handleAnswerSubmit}
                  timeRemaining={timeRemaining}
                />
              )}
              {currentRound === 2 && (
                <HRQuestion
                  question={currentQuestionData}
                  onAnswer={handleAnswerSubmit}
                  timeRemaining={timeRemaining}
                />
              )}
            </div>
          </div>

          {/* Monitoring Panel */}
          <div className="space-y-6">
            {/* Camera Feed */}
            <div className="bg-gray-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
                <Camera className="w-4 h-4 mr-2" />
                Camera Feed
              </h3>
              <div className="relative">
                <video ref={videoRef} autoPlay muted className="w-full h-32 bg-gray-700 rounded-lg object-cover" />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute top-2 right-2 flex space-x-1">
                  {monitoringData.faceDetected ? (
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  ) : (
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  )}
                  {monitoringData.multipleFaces && <div className="w-2 h-2 bg-orange-400 rounded-full"></div>}
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-400">
                Confidence: {Math.round(monitoringData.confidenceScore)}%
              </div>
            </div>

            {/* Monitoring Status */}
            <div className="bg-gray-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                Monitoring Status
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>Face Detection</span>
                  <span className={monitoringData.faceDetected ? "text-green-400" : "text-red-400"}>
                    {monitoringData.faceDetected ? "✓" : "✗"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Attention Level</span>
                  <span className="text-blue-400">{Math.round(monitoringData.attentionLevel)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Audio Level</span>
                  <span className="text-green-400">{Math.round(monitoringData.audioLevel)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Network Quality</span>
                  <span className="text-blue-400">{Math.round(performanceMetrics.networkStability)}%</span>
                </div>
              </div>
            </div>

            {/* Recent Violations */}
            <div className="bg-gray-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Recent Violations
              </h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {violations.slice(-3).map((violation, index) => (
                  <div key={index} className="text-xs">
                    <div className={`font-medium ${getViolationColor(violation.severity)}`}>
                      {violation.type.replace("_", " ").toUpperCase()}
                    </div>
                    <div className="text-gray-400">{violation.description}</div>
                  </div>
                ))}
                {violations.length === 0 && <div className="text-xs text-gray-500">No violations detected</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Aptitude Question Component
const AptitudeQuestion = ({ question, onAnswer, timeRemaining }) => {
  const [selectedAnswer, setSelectedAnswer] = useState("")

  if (!question) {
    return <div className="text-center text-gray-400">Loading question...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Question {question.id}</h2>
        <p className="text-lg text-gray-300 leading-relaxed">{question.question}</p>
      </div>

      <div className="space-y-3">
        {question.options?.map((option, index) => (
          <button
            key={index}
            onClick={() => setSelectedAnswer(option)}
            className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-300 ${
              selectedAnswer === option
                ? "border-blue-500 bg-blue-500/20 text-white"
                : "border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500"
            }`}
          >
            <span className="font-medium mr-3">{String.fromCharCode(65 + index)}.</span>
            {option}
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-400">
          Difficulty: <span className="capitalize">{question.difficulty}</span>
        </div>
        <button
          onClick={() => onAnswer(selectedAnswer)}
          disabled={!selectedAnswer}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-300"
        >
          Submit Answer
        </button>
      </div>
    </div>
  )
}

// Coding Question Component
const CodingQuestion = ({ question, onAnswer, timeRemaining }) => {
  const [code, setCode] = useState(question?.template || "")

  if (!question) {
    return <div className="text-center text-gray-400">Loading question...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">{question.title}</h2>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              question.difficulty === "Easy"
                ? "bg-green-500/20 text-green-400"
                : question.difficulty === "Medium"
                  ? "bg-yellow-500/20 text-yellow-400"
                  : "bg-red-500/20 text-red-400"
            }`}
          >
            {question.difficulty}
          </span>
        </div>
        <p className="text-gray-300 leading-relaxed">{question.description}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Your Solution:</label>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full h-64 p-4 bg-gray-900 border border-gray-600 rounded-lg text-white font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Write your code here..."
        />
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-400">
          Time remaining: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, "0")}
        </div>
        <button
          onClick={() => onAnswer(code)}
          disabled={!code.trim()}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-300"
        >
          Submit Solution
        </button>
      </div>
    </div>
  )
}

// HR Question Component
const HRQuestion = ({ question, onAnswer, timeRemaining }) => {
  const [answer, setAnswer] = useState("")
  const [isRecording, setIsRecording] = useState(false)

  if (!question) {
    return <div className="text-center text-gray-400">Loading question...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">HR Question {question.id}</h2>
        <p className="text-lg text-gray-300 leading-relaxed">{question.question}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Your Response:</label>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="w-full h-32 p-4 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="Type your answer here..."
        />
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors duration-300 ${
              isRecording ? "bg-red-600 hover:bg-red-700 text-white" : "bg-gray-600 hover:bg-gray-700 text-gray-300"
            }`}
          >
            {isRecording ? <Pause className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
            {isRecording ? "Stop Recording" : "Record Audio"}
          </button>
          <div className="text-sm text-gray-400">
            Category: <span className="capitalize">{question.category}</span>
          </div>
        </div>
        <button
          onClick={() => onAnswer(answer)}
          disabled={!answer.trim()}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-300"
        >
          Submit Response
        </button>
      </div>
    </div>
  )
}

export default InterviewPlatform
