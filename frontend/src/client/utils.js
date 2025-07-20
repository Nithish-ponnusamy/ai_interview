// Webcam and monitoring utilities

// Format time in MM:SS format
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

// Initialize webcam with enhanced monitoring and face detection
export const initializeWebcam = async (
  videoRef,
  canvasRef,
  detectionIntervalRef,
  setViolations,
  setShowViolationAlert,
  setCurrentViolation,
  setIsWebcamActive,
  setFaceDetectionActive,
) => {
  try {
    console.log("🎥 Requesting camera permissions with enhanced constraints...")

    // Request camera permissions with high-quality constraints
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1920, min: 1280 },
        height: { ideal: 1080, min: 720 },
        frameRate: { ideal: 30, min: 20 },
        facingMode: "user",
        aspectRatio: { ideal: 16/9 }
      },
      audio: false,
    })

    if (videoRef.current) {
      videoRef.current.srcObject = stream
      
      // Enhanced video loading with better error handling
      videoRef.current.onloadedmetadata = () => {
        console.log("📹 Video metadata loaded, starting playback...")
        
        videoRef.current.play()
          .then(() => {
            console.log("✅ Video playback started successfully")
            setIsWebcamActive(true)
            
            // Start enhanced monitoring after video is fully loaded
            setTimeout(() => {
              startEnhancedMonitoring(
                videoRef,
                canvasRef,
                detectionIntervalRef,
                setViolations,
                setShowViolationAlert,
                setCurrentViolation,
                setFaceDetectionActive,
              )
            }, 1000) // Wait 1 second for video to stabilize
          })
          .catch((playError) => {
            console.error("❌ Video playback failed:", playError)
            throw new Error("Failed to start video playback")
          })
      }

      videoRef.current.onerror = (error) => {
        console.error("❌ Video element error:", error)
        throw new Error("Video element encountered an error")
      }
    }

    return stream
  } catch (error) {
    console.error("❌ Camera initialization failed:", error)

    // Enhanced error handling with specific error types
    const errorMessage = getDetailedErrorMessage(error)
    
    // Show detailed error alert
    alert(`Camera Error: ${errorMessage.title}\n\n${errorMessage.description}\n\nTroubleshooting:\n${errorMessage.solutions.join('\n')}`)

    setIsWebcamActive(false)
    return null
  }
}

// Get detailed error message with solutions
const getDetailedErrorMessage = (error) => {
  const errorMessages = {
    NotAllowedError: {
      title: "Camera Access Denied",
      description: "You denied camera access or your browser blocked it.",
      solutions: [
        "• Click the camera icon in your browser's address bar",
        "• Select 'Allow' for camera permissions",
        "• Refresh the page and try again",
        "• Check if another application is using your camera"
      ]
    },
    NotFoundError: {
      title: "No Camera Found",
      description: "No camera device was detected on your system.",
      solutions: [
        "• Connect a webcam to your computer",
        "• Check if your camera is properly connected",
        "• Try a different USB port",
        "• Restart your browser and try again"
      ]
    },
    NotReadableError: {
      title: "Camera In Use",
      description: "Your camera is being used by another application.",
      solutions: [
        "• Close other video applications (Zoom, Skype, etc.)",
        "• Close other browser tabs using the camera",
        "• Restart your browser",
        "• Restart your computer if the issue persists"
      ]
    },
    OverconstrainedError: {
      title: "Camera Specifications Not Met",
      description: "Your camera doesn't meet the required specifications.",
      solutions: [
        "• Try using a different camera",
        "• Update your camera drivers",
        "• Use a more recent browser version",
        "• Contact support if the issue continues"
      ]
    },
    SecurityError: {
      title: "Security Restriction",
      description: "Camera access is blocked due to security settings.",
      solutions: [
        "• Ensure you're using HTTPS (secure connection)",
        "• Check your browser's security settings",
        "• Disable any ad blockers temporarily",
        "• Try using a different browser"
      ]
    },
    AbortError: {
      title: "Camera Access Aborted",
      description: "Camera access was interrupted or cancelled.",
      solutions: [
        "• Try again and don't cancel the permission request",
        "• Refresh the page and retry",
        "• Check if your camera is working in other applications"
      ]
    }
  }

  return errorMessages[error.name] || {
    title: "Unknown Camera Error",
    description: error.message || "An unexpected camera error occurred.",
    solutions: [
      "• Refresh the page and try again",
      "• Try using a different browser",
      "• Check your camera in other applications",
      "• Contact technical support"
    ]
  }
}

// Enhanced monitoring system with advanced face detection
const startEnhancedMonitoring = (
  videoRef,
  canvasRef,
  detectionIntervalRef,
  setViolations,
  setShowViolationAlert,
  setCurrentViolation,
  setFaceDetectionActive,
) => {
  console.log("🔍 Starting enhanced monitoring with advanced face detection...")

  // Monitoring state variables
  let lastFaceDetection = Date.now()
  let consecutiveNoFaceFrames = 0
  let lastPersonCount = 1
  let tabSwitchCount = 0
  let lastActiveTime = Date.now()
  let lookAwayCount = 0
  let previousFrameData = null
  let motionlessFrames = 0
  let suspiciousActivityCount = 0

  // Enhanced violation tracking
  const violationThresholds = {
    noFaceTimeout: 3000, // 3 seconds
    multiplePeopleTimeout: 2000, // 2 seconds
    lookAwayTimeout: 5000, // 5 seconds
    motionlessTimeout: 15000, // 15 seconds
    inactivityTimeout: 30000, // 30 seconds
  }

  // Monitor tab visibility with enhanced detection
  const handleVisibilityChange = () => {
    if (document.hidden) {
      tabSwitchCount++
      const violation = `🚫 Tab switched away from interview (Violation #${tabSwitchCount})`
      console.log("⚠️ VIOLATION:", violation)

      addViolation(violation, setViolations, setCurrentViolation, setShowViolationAlert)
      
      // Escalate if too many tab switches
      if (tabSwitchCount >= 3) {
        const escalatedViolation = `🚨 CRITICAL: Multiple tab switches detected (${tabSwitchCount} times) - Interview integrity compromised`
        addViolation(escalatedViolation, setViolations, setCurrentViolation, setShowViolationAlert)
      }
    } else {
      lastActiveTime = Date.now()
    }
  }

  // Monitor window focus
  const handleWindowBlur = () => {
    const violation = `🚫 Window lost focus - Possible external assistance`
    addViolation(violation, setViolations, setCurrentViolation, setShowViolationAlert)
  }

  // Monitor key combinations that might indicate cheating
  const handleKeyDown = (event) => {
    const suspiciousKeys = [
      { key: 'F12', description: 'Developer tools' },
      { key: 'F5', description: 'Page refresh' },
      { ctrlKey: true, key: 'c', description: 'Copy operation' },
      { ctrlKey: true, key: 'v', description: 'Paste operation' },
      { ctrlKey: true, key: 't', description: 'New tab' },
      { ctrlKey: true, key: 'w', description: 'Close tab' },
      { altKey: true, key: 'Tab', description: 'Alt+Tab switching' },
    ]

    const suspicious = suspiciousKeys.find(s => 
      s.key === event.key && 
      (!s.ctrlKey || event.ctrlKey) && 
      (!s.altKey || event.altKey)
    )

    if (suspicious) {
      event.preventDefault()
      suspiciousActivityCount++
      const violation = `🚫 Suspicious key combination detected: ${suspicious.description} (Count: ${suspiciousActivityCount})`
      addViolation(violation, setViolations, setCurrentViolation, setShowViolationAlert)
    }
  }

  // Add event listeners
  document.addEventListener("visibilitychange", handleVisibilityChange)
  window.addEventListener("blur", handleWindowBlur)
  document.addEventListener("keydown", handleKeyDown)

  // Enhanced face detection interval with multiple checks
  detectionIntervalRef.current = setInterval(() => {
    if (!videoRef.current || !canvasRef.current) return

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")

      // Ensure video is playing and has dimensions
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.log("⚠️ Video not ready, skipping frame analysis")
        return
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw current frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Get image data for analysis
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const currentFrameData = new Uint8Array(imageData.data)

      // Advanced face detection
      const faceAnalysis = performAdvancedFaceDetection(imageData, canvas.width, canvas.height)
      
      if (faceAnalysis.faceDetected) {
        lastFaceDetection = Date.now()
        consecutiveNoFaceFrames = 0
        setFaceDetectionActive(true)

        // Check for multiple people with improved accuracy
        if (faceAnalysis.personCount > 1) {
          if (lastPersonCount === 1) { // First detection of multiple people
            const violation = `🚫 Multiple people detected in frame (${faceAnalysis.personCount} people) - External assistance suspected`
            addViolation(violation, setViolations, setCurrentViolation, setShowViolationAlert)
          }
          lastPersonCount = faceAnalysis.personCount
        } else {
          lastPersonCount = 1
        }

        // Check if person is looking away from screen
        if (!faceAnalysis.lookingAtScreen) {
          lookAwayCount++
          if (lookAwayCount > 10) { // Looking away for more than 5 seconds
            const violation = `🚫 Looking away from screen for extended period (${Math.floor(lookAwayCount * 0.5)}s)`
            addViolation(violation, setViolations, setCurrentViolation, setShowViolationAlert)
            lookAwayCount = 0 // Reset counter
          }
        } else {
          lookAwayCount = 0
        }

        // Check for suspicious lack of movement (possible photo)
        if (previousFrameData) {
          const motionLevel = calculateMotionLevel(currentFrameData, previousFrameData)
          if (motionLevel < 0.01) { // Very little motion
            motionlessFrames++
            if (motionlessFrames > 30) { // 15 seconds of no motion
              const violation = `🚫 Suspicious lack of movement detected - Possible photo or video substitution`
              addViolation(violation, setViolations, setCurrentViolation, setShowViolationAlert)
              motionlessFrames = 0
            }
          } else {
            motionlessFrames = 0
          }
        }

      } else {
        consecutiveNoFaceFrames++
        setFaceDetectionActive(false)

        // Alert if no face detected for extended period
        if (consecutiveNoFaceFrames > 6) { // 3 seconds
          const violation = `🚫 No face detected for ${Math.floor(consecutiveNoFaceFrames * 0.5)} seconds - Please ensure face is visible`
          addViolation(violation, setViolations, setCurrentViolation, setShowViolationAlert)
          consecutiveNoFaceFrames = 0 // Reset to avoid spam
        }
      }

      // Check for prolonged inactivity
      const inactiveTime = Date.now() - lastActiveTime
      if (inactiveTime > violationThresholds.inactivityTimeout) {
        const violation = `🚫 Prolonged inactivity detected (${Math.floor(inactiveTime / 1000)}s) - Please remain active`
        addViolation(violation, setViolations, setCurrentViolation, setShowViolationAlert)
        lastActiveTime = Date.now()
      }

      // Store current frame for next comparison
      previousFrameData = currentFrameData.slice()

    } catch (error) {
      console.error("❌ Monitoring error:", error)
    }
  }, 500) // Check every 500ms for better responsiveness

  // Cleanup function
  return () => {
    document.removeEventListener("visibilitychange", handleVisibilityChange)
    window.removeEventListener("blur", handleWindowBlur)
    document.removeEventListener("keydown", handleKeyDown)
  }
}

// Advanced face detection with multiple algorithms
const performAdvancedFaceDetection = (imageData, width, height) => {
  const data = imageData.data
  
  // Initialize analysis results
  const analysis = {
    faceDetected: false,
    personCount: 0,
    lookingAtScreen: false,
    facePosition: null,
    confidence: 0
  }

  // Skin tone detection in multiple regions
  const regions = [
    { x: width * 0.3, y: height * 0.2, w: width * 0.4, h: height * 0.3 }, // Upper center (face area)
    { x: width * 0.1, y: height * 0.2, w: width * 0.3, h: height * 0.3 }, // Left side
    { x: width * 0.6, y: height * 0.2, w: width * 0.3, h: height * 0.3 }, // Right side
  ]

  let totalFacePixels = 0
  let detectedRegions = 0

  regions.forEach((region, index) => {
    const facePixels = analyzeSkinToneInRegion(data, width, height, region)
    const regionFaceRatio = facePixels.count / facePixels.total
    
    if (regionFaceRatio > 0.15) { // Threshold for face detection
      detectedRegions++
      totalFacePixels += facePixels.count
      
      if (index === 0) { // Main face region
        analysis.faceDetected = true
        analysis.facePosition = { x: region.x + region.w/2, y: region.y + region.h/2 }
        analysis.confidence = regionFaceRatio
      }
    }
  })

  // Estimate person count based on detected regions
  analysis.personCount = Math.max(1, Math.floor(detectedRegions / 1.5))
  
  // Check if looking at screen (simplified - based on face position)
  if (analysis.facePosition) {
    const centerX = width / 2
    const centerY = height / 2
    const distanceFromCenter = Math.sqrt(
      Math.pow(analysis.facePosition.x - centerX, 2) + 
      Math.pow(analysis.facePosition.y - centerY, 2)
    )
    const maxDistance = Math.min(width, height) * 0.3
    analysis.lookingAtScreen = distanceFromCenter < maxDistance
  }

  // Enhanced multiple person detection using edge detection
  const edgeCount = detectEdges(data, width, height)
  if (edgeCount > 800) { // High edge count might indicate multiple people
    analysis.personCount = Math.max(analysis.personCount, 2)
  }

  return analysis
}

// Analyze skin tone in a specific region
const analyzeSkinToneInRegion = (data, width, height, region) => {
  let skinPixels = 0
  let totalPixels = 0

  const startX = Math.max(0, Math.floor(region.x))
  const endX = Math.min(width, Math.floor(region.x + region.w))
  const startY = Math.max(0, Math.floor(region.y))
  const endY = Math.min(height, Math.floor(region.y + region.h))

  for (let y = startY; y < endY; y += 2) { // Sample every 2nd pixel for performance
    for (let x = startX; x < endX; x += 2) {
      const index = (y * width + x) * 4
      const r = data[index]
      const g = data[index + 1]
      const b = data[index + 2]

      // Enhanced skin tone detection
      if (isSkinTone(r, g, b)) {
        skinPixels++
      }
      totalPixels++
    }
  }

  return { count: skinPixels, total: totalPixels }
}

// Improved skin tone detection algorithm
const isSkinTone = (r, g, b) => {
  // Multiple skin tone ranges for better detection
  const skinRanges = [
    // Light skin tones
    { rMin: 95, rMax: 255, gMin: 40, gMax: 100, bMin: 20, bMax: 95 },
    // Medium skin tones  
    { rMin: 80, rMax: 220, gMin: 50, gMax: 150, bMin: 30, bMax: 120 },
    // Dark skin tones
    { rMin: 45, rMax: 255, gMin: 34, gMax: 200, bMin: 14, bMax: 180 },
  ]

  // Additional checks for skin tone characteristics
  const isValidSkin = skinRanges.some(range => 
    r >= range.rMin && r <= range.rMax &&
    g >= range.gMin && g <= range.gMax &&
    b >= range.bMin && b <= range.bMax
  )

  // Additional heuristics
  const rg = r - g
  const rb = r - b
  const gb = g - b

  const skinHeuristic = (
    r > 95 && g > 40 && b > 20 &&
    Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
    Math.abs(rg) > 15 && r > g && r > b
  )

  return isValidSkin || skinHeuristic
}

// Edge detection for multiple person detection
const detectEdges = (data, width, height) => {
  let edgeCount = 0
  
  for (let y = 1; y < height - 1; y += 4) { // Sample every 4th row for performance
    for (let x = 1; x < width - 1; x += 4) { // Sample every 4th column
      const index = (y * width + x) * 4
      
      // Get current pixel brightness
      const current = (data[index] + data[index + 1] + data[index + 2]) / 3
      
      // Get neighboring pixels
      const right = (data[index + 4] + data[index + 5] + data[index + 6]) / 3
      const bottom = (data[(y + 1) * width * 4 + x * 4] + 
                     data[(y + 1) * width * 4 + x * 4 + 1] + 
                     data[(y + 1) * width * 4 + x * 4 + 2]) / 3

      // Calculate edge strength
      const horizontalEdge = Math.abs(current - right)
      const verticalEdge = Math.abs(current - bottom)
      
      if (horizontalEdge > 30 || verticalEdge > 30) {
        edgeCount++
      }
    }
  }
  
  return edgeCount
}

// Calculate motion level between frames
const calculateMotionLevel = (currentFrame, previousFrame) => {
  let totalDifference = 0
  const sampleSize = Math.min(currentFrame.length, previousFrame.length)
  
  // Sample every 16th pixel for performance (RGBA = 4 bytes per pixel)
  for (let i = 0; i < sampleSize; i += 16) {
    const diff = Math.abs(currentFrame[i] - previousFrame[i])
    totalDifference += diff
  }
  
  return totalDifference / (sampleSize / 16) / 255 // Normalize to 0-1
}

// Enhanced violation management
const addViolation = (violation, setViolations, setCurrentViolation, setShowViolationAlert) => {
  const timestamp = new Date().toLocaleTimeString()
  const timestampedViolation = `[${timestamp}] ${violation}`
  
  console.log("🚨 VIOLATION DETECTED:", timestampedViolation)
  
  setViolations((prev) => [...prev, timestampedViolation])
  setCurrentViolation(violation)
  setShowViolationAlert(true)

  // Auto-hide alert after 7 seconds (longer for critical violations)
  const hideDelay = violation.includes('CRITICAL') ? 10000 : 7000
  setTimeout(() => setShowViolationAlert(false), hideDelay)
}

// Stop webcam and cleanup with enhanced cleanup
export const stopWebcam = (detectionIntervalRef) => {
  console.log("🛑 Stopping webcam and cleaning up monitoring...")

  // Clear monitoring interval
  if (detectionIntervalRef.current) {
    clearInterval(detectionIntervalRef.current)
    detectionIntervalRef.current = null
  }

  // Stop all video tracks
  const videos = document.querySelectorAll("video")
  videos.forEach(video => {
    if (video.srcObject) {
      const tracks = video.srcObject.getTracks()
      tracks.forEach((track) => {
        track.stop()
        console.log("🛑 Stopped video track:", track.kind, track.label)
      })
      video.srcObject = null
    }
  })

  // Remove event listeners
  document.removeEventListener("visibilitychange", () => {})
  window.removeEventListener("blur", () => {})
  document.removeEventListener("keydown", () => {})

  console.log("✅ Webcam and monitoring cleanup completed")
}

// Enhanced camera testing with detailed diagnostics
export const testCamera = async () => {
  try {
    console.log("🧪 Running comprehensive camera test...")

    // Test basic camera access
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
      },
      audio: false,
    })

    // Test video track capabilities
    const videoTrack = stream.getVideoTracks()[0]
    const capabilities = videoTrack.getCapabilities ? videoTrack.getCapabilities() : {}
    const settings = videoTrack.getSettings()

    console.log("📹 Camera capabilities:", capabilities)
    console.log("📹 Current settings:", settings)

    // Test video element creation and playback
    const testVideo = document.createElement('video')
    testVideo.srcObject = stream
    testVideo.muted = true
    
    await new Promise((resolve, reject) => {
      testVideo.onloadedmetadata = () => {
        testVideo.play()
          .then(resolve)
          .catch(reject)
      }
      testVideo.onerror = reject
      
      // Timeout after 5 seconds
      setTimeout(() => reject(new Error('Video test timeout')), 5000)
    })

    // Stop test stream
    stream.getTracks().forEach((track) => track.stop())

    console.log("✅ Comprehensive camera test successful")

    return {
      success: true,
      message: "Camera is working perfectly",
      details: {
        resolution: `${settings.width}x${settings.height}`,
        frameRate: settings.frameRate,
        deviceId: settings.deviceId,
        facingMode: settings.facingMode
      }
    }

  } catch (error) {
    console.error("❌ Comprehensive camera test failed:", error)
    const errorInfo = getDetailedErrorMessage(error)
    
    return {
      success: false,
      message: errorInfo.title,
      description: errorInfo.description,
      solutions: errorInfo.solutions,
      error: error.name,
    }
  }
}

// Get available cameras with detailed information
export const getAvailableCameras = async () => {
  try {
    // Request permission first
    await navigator.mediaDevices.getUserMedia({ video: true })
    
    const devices = await navigator.mediaDevices.enumerateDevices()
    const cameras = devices.filter((device) => device.kind === "videoinput")

    console.log("📹 Available cameras:", cameras.length)
    
    const cameraDetails = cameras.map(camera => ({
      deviceId: camera.deviceId,
      label: camera.label || `Camera ${cameras.indexOf(camera) + 1}`,
      groupId: camera.groupId
    }))

    return cameraDetails
  } catch (error) {
    console.error("❌ Failed to get cameras:", error)
    return []
  }
}

// Performance monitoring for the detection system
export const getPerformanceMetrics = () => {
  return {
    memory: performance.memory ? {
      used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
      total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
      limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
    } : null,
    timing: performance.timing ? {
      loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
      domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart
    } : null
  }
}
