"use client"

const express = require("express")
const mongoose = require("mongoose")
const multer = require("multer")
const cors = require("cors")
const nodemailer = require("nodemailer")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const path = require("path")
const fs = require("fs")
const pdf = require("pdf-parse")
require("dotenv").config()

const app = express()

// CORS configuration
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  }),
)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads")
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// MongoDB connection
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://muralikarthickm22it:Murali%40123@cluster0.mongodb.net/cloudcomputing?retryWrites=true&w=majority"

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB connected successfully")
    console.log("Database:", mongoose.connection.db.databaseName)
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err)
    process.exit(1)
  })

// User schema for authentication
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"],
    },
    password: { type: String, required: true, minlength: 6 },
    hasApplication: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
)

const User = mongoose.model("User", userSchema)

// Enhanced Mongoose schema with interview results and analytics
const applicantSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"],
    },
    phone: { type: String, required: true, trim: true },
    institution: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    experience: { type: String, trim: true },
    education: { type: String, required: true, trim: true },
    linkedin: { type: String, trim: true },
    portfolio: { type: String, trim: true },
    github: { type: String, trim: true },
    role: { type: String, trim: true },
    skills: [{ type: String, trim: true }],
    resumeUrl: String,
    resumeFileName: String,
    status: {
      type: String,
      enum: ["pending", "under_review", "approved", "rejected", "interview_completed", "hired", "on_hold"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    tags: [String],
    notes: [
      {
        content: String,
        author: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    interviewCode: String,
    interviewCodeExpiry: Date,
    interviewSchedule: {
      scheduledDate: Date,
      scheduledTime: String,
      timezone: String,
      interviewer: String,
      meetingLink: String,
    },
    interviewResults: {
      aptitudeScore: { type: Number, default: 0 },
      codingScore: { type: Number, default: 0 },
      hrScore: { type: Number, default: 0 },
      totalScore: { type: Number, default: 0 },
      percentile: { type: Number, default: 0 },
      timeSpent: {
        aptitude: { type: Number, default: 0 },
        coding: { type: Number, default: 0 },
        hr: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
      },
      aptitudeAnswers: [
        {
          question: String,
          selectedAnswer: String,
          correctAnswer: String,
          isCorrect: Boolean,
          timeSpent: Number,
          difficulty: String,
        },
      ],
      codingAnswers: [
        {
          question: String,
          solution: String,
          score: Number,
          timeSpent: Number,
          testCasesPassed: Number,
          totalTestCases: Number,
          codeQuality: Number,
          complexity: String,
        },
      ],
      hrAnswers: [
        {
          question: String,
          answer: String,
          score: Number,
          timeSpent: Number,
          keywords: [String],
          sentiment: String,
        },
      ],
      violations: [
        {
          type: String,
          description: String,
          timestamp: Date,
          severity: String,
        },
      ],
      behaviorAnalysis: {
        eyeMovementPattern: String,
        facialExpressions: [String],
        confidenceLevel: Number,
        stressIndicators: [String],
      },
      completedAt: Date,
      deviceInfo: {
        browser: String,
        os: String,
        screenResolution: String,
        cameraQuality: String,
      },
    },
    feedback: {
      strengths: [String],
      weaknesses: [String],
      recommendations: [String],
      overallRating: Number,
      hiringRecommendation: String,
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  },
)

// Add indexes for better performance
applicantSchema.index({ email: 1 })
applicantSchema.index({ status: 1 })
applicantSchema.index({ role: 1 })
applicantSchema.index({ priority: 1 })
applicantSchema.index({ createdAt: -1 })
applicantSchema.index({ "interviewResults.totalScore": -1 })

const Applicant = mongoose.model("Applicant", applicantSchema, "client")

// Admin Analytics Schema
const analyticsSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  totalApplications: Number,
  approvedApplications: Number,
  rejectedApplications: Number,
  completedInterviews: Number,
  averageScore: Number,
  topSkills: [{ skill: String, count: Number }],
  roleDistribution: [{ role: String, count: Number }],
  institutionDistribution: [{ institution: String, count: Number }],
  violationStats: [{ type: String, count: Number }],
})

const Analytics = mongoose.model("Analytics", analyticsSchema)

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-here"

// Email configuration
let transporter

const createTransporter = async () => {
  try {
    console.log("🔧 Setting up Gmail transporter...")

    transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "m.muralikarthick123@gmail.com",
        pass: "xacb bqee eaai arkc",
      },
      tls: {
        rejectUnauthorized: false,
      },
      debug: true,
      logger: true,
    })

    console.log("🔍 Verifying Gmail connection...")
    const verification = await transporter.verify()
    console.log("✅ Gmail transporter verified successfully:", verification)

    console.log("📧 Sending test email...")
    const testInfo = await transporter.sendMail({
      from: '"AI Interview Platform" <m.muralikarthick123@gmail.com>',
      to: "m.muralikarthick123@gmail.com",
      subject: "Email Service Test - " + new Date().toISOString(),
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #2563eb;">Email Service Test</h2>
          <p>This is a test email to verify the email service is working correctly.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p><strong>Status:</strong> Email service is operational ✅</p>
        </div>
      `,
    })

    console.log("✅ Test email sent successfully!")
    console.log("Message ID:", testInfo.messageId)
    console.log("Response:", testInfo.response)
  } catch (error) {
    console.error("❌ Gmail setup failed:", error)
    console.error("Error details:", {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
    })

    transporter = {
      sendMail: async (mailOptions) => {
        console.log("📧 FALLBACK EMAIL LOG:")
        console.log("From:", mailOptions.from)
        console.log("To:", mailOptions.to)
        console.log("Subject:", mailOptions.subject)
        console.log("HTML Content Length:", mailOptions.html.length)
        console.log("---")

        return {
          messageId: "fallback-" + Date.now(),
          response: "250 OK (Fallback Mode)",
          accepted: [mailOptions.to],
          rejected: [],
        }
      },
    }
    console.log("⚠️ Using fallback email logger")
  }
}

createTransporter()

// Enhanced send email function with retry logic
const sendEmail = async (to, subject, html, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`📧 Sending email attempt ${attempt}/${retries}`)
      console.log(`To: ${to}`)
      console.log(`Subject: ${subject}`)

      const info = await transporter.sendMail({
        from: '"AI Interview Platform" <m.muralikarthick123@gmail.com>',
        to: to,
        subject: subject,
        html: html,
        headers: {
          "X-Priority": "1",
          "X-MSMail-Priority": "High",
          Importance: "high",
        },
      })

      console.log(`✅ Email sent successfully on attempt ${attempt}`)
      console.log("Message ID:", info.messageId)
      console.log("Response:", info.response)
      console.log("Accepted:", info.accepted)
      console.log("Rejected:", info.rejected)

      return {
        success: true,
        messageId: info.messageId,
        response: info.response,
        attempt: attempt,
      }
    } catch (error) {
      console.error(`❌ Email sending failed on attempt ${attempt}:`, error.message)

      if (attempt === retries) {
        console.error("❌ All email attempts failed")
        return {
          success: false,
          error: error.message,
          code: error.code,
          attempts: retries,
        }
      }

      const waitTime = Math.pow(2, attempt) * 1000
      console.log(`⏳ Waiting ${waitTime}ms before retry...`)
      await new Promise((resolve) => setTimeout(resolve, waitTime))
    }
  }
}

// Advanced Question Pools with varying difficulty levels
const ADVANCED_QUESTION_POOLS = {
  aptitude: {
    "Frontend Developer": [
      // Easy Questions
      {
        question: "What is the time complexity of accessing an element in an array by index?",
        options: ["O(1)", "O(n)", "O(log n)", "O(n²)"],
        correct: "O(1)",
        difficulty: "easy",
        explanation: "Array access by index is constant time as it directly calculates memory address.",
      },
      {
        question: "Which CSS property is used to create flexible layouts?",
        options: ["display: block", "display: flex", "display: inline", "display: table"],
        correct: "display: flex",
        difficulty: "easy",
        explanation: "Flexbox provides a flexible way to arrange elements in a container.",
      },
      // Medium Questions
      {
        question: "What happens when you use 'const' with objects in JavaScript?",
        options: [
          "The object becomes completely immutable",
          "The object reference is immutable but properties can be changed",
          "The object can be reassigned but properties cannot be changed",
          "It throws an error",
        ],
        correct: "The object reference is immutable but properties can be changed",
        difficulty: "medium",
        explanation: "const prevents reassignment of the variable but allows mutation of object properties.",
      },
      {
        question: "Which of the following is NOT a valid way to center a div horizontally and vertically?",
        options: [
          "display: flex; justify-content: center; align-items: center;",
          "position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);",
          "display: grid; place-items: center;",
          "margin: auto; text-align: center;",
        ],
        correct: "margin: auto; text-align: center;",
        difficulty: "medium",
        explanation: "margin: auto only centers horizontally, and text-align: center only affects inline content.",
      },
      // Hard Questions
      {
        question: "What is the output of: console.log(0.1 + 0.2 === 0.3) in JavaScript?",
        options: ["true", "false", "undefined", "NaN"],
        correct: "false",
        difficulty: "hard",
        explanation: "Due to floating-point precision issues, 0.1 + 0.2 equals 0.30000000000000004, not 0.3.",
      },
      {
        question: "Which React Hook would you use to optimize expensive calculations?",
        options: ["useState", "useEffect", "useMemo", "useCallback"],
        correct: "useMemo",
        difficulty: "hard",
        explanation: "useMemo memoizes expensive calculations and only recalculates when dependencies change.",
      },
      {
        question: "What is the difference between event.preventDefault() and event.stopPropagation()?",
        options: [
          "preventDefault stops bubbling, stopPropagation prevents default action",
          "preventDefault prevents default action, stopPropagation stops bubbling",
          "They do the same thing",
          "preventDefault is for forms, stopPropagation is for clicks",
        ],
        correct: "preventDefault prevents default action, stopPropagation stops bubbling",
        difficulty: "hard",
        explanation:
          "preventDefault stops the default browser action, stopPropagation stops event bubbling up the DOM.",
      },
      // Expert Questions
      {
        question: "In CSS, what does the 'contain' property do?",
        options: [
          "Contains overflow content",
          "Provides performance optimizations by isolating subtrees",
          "Contains floating elements",
          "Contains positioned elements",
        ],
        correct: "Provides performance optimizations by isolating subtrees",
        difficulty: "expert",
        explanation:
          "The contain property allows browsers to optimize rendering by isolating subtrees from the rest of the page.",
      },
      {
        question: "What is the purpose of React's Concurrent Mode?",
        options: [
          "To run multiple React apps simultaneously",
          "To enable time-slicing and interruptible rendering",
          "To handle concurrent API calls",
          "To manage concurrent state updates",
        ],
        correct: "To enable time-slicing and interruptible rendering",
        difficulty: "expert",
        explanation: "Concurrent Mode allows React to interrupt rendering work to handle high-priority updates.",
      },
    ],
    "Backend Developer": [
      // Easy Questions
      {
        question: "What HTTP status code indicates a successful POST request that created a resource?",
        options: ["200", "201", "204", "301"],
        correct: "201",
        difficulty: "easy",
        explanation: "201 Created indicates that a new resource has been successfully created.",
      },
      {
        question: "What does CRUD stand for in database operations?",
        options: [
          "Create, Read, Update, Delete",
          "Connect, Retrieve, Upload, Download",
          "Copy, Remove, Undo, Deploy",
          "Cache, Request, Update, Debug",
        ],
        correct: "Create, Read, Update, Delete",
        difficulty: "easy",
        explanation: "CRUD represents the four basic operations for persistent storage.",
      },
      // Medium Questions
      {
        question: "What is the main difference between SQL and NoSQL databases?",
        options: [
          "SQL is faster than NoSQL",
          "SQL uses structured schemas, NoSQL is schema-flexible",
          "SQL is newer than NoSQL",
          "SQL is only for small data, NoSQL for big data",
        ],
        correct: "SQL uses structured schemas, NoSQL is schema-flexible",
        difficulty: "medium",
        explanation: "SQL databases enforce rigid schemas while NoSQL databases offer flexible, dynamic schemas.",
      },
      {
        question: "In REST API design, what does idempotency mean?",
        options: [
          "The API can handle multiple requests simultaneously",
          "Multiple identical requests have the same effect as a single request",
          "The API returns the same response format",
          "The API uses the same authentication method",
        ],
        correct: "Multiple identical requests have the same effect as a single request",
        difficulty: "medium",
        explanation:
          "Idempotent operations can be called multiple times without changing the result beyond the initial application.",
      },
      // Hard Questions
      {
        question: "What is the CAP theorem in distributed systems?",
        options: [
          "Consistency, Availability, Partition tolerance - you can only guarantee two",
          "Create, Access, Process - the three phases of data handling",
          "Cache, API, Performance - the three pillars of scalability",
          "Concurrency, Atomicity, Persistence - database transaction properties",
        ],
        correct: "Consistency, Availability, Partition tolerance - you can only guarantee two",
        difficulty: "hard",
        explanation:
          "CAP theorem states that distributed systems can only guarantee two out of three: Consistency, Availability, and Partition tolerance.",
      },
      {
        question: "What is database sharding?",
        options: [
          "Encrypting database data",
          "Horizontally partitioning data across multiple databases",
          "Creating backup copies of data",
          "Compressing database files",
        ],
        correct: "Horizontally partitioning data across multiple databases",
        difficulty: "hard",
        explanation:
          "Sharding distributes data across multiple database instances to improve performance and scalability.",
      },
      // Expert Questions
      {
        question: "What is the difference between optimistic and pessimistic locking?",
        options: [
          "Optimistic assumes conflicts are rare, pessimistic locks immediately",
          "Optimistic is faster, pessimistic is more secure",
          "Optimistic is for reads, pessimistic is for writes",
          "They are the same thing with different names",
        ],
        correct: "Optimistic assumes conflicts are rare, pessimistic locks immediately",
        difficulty: "expert",
        explanation:
          "Optimistic locking assumes conflicts are rare and checks for conflicts before committing, while pessimistic locking prevents conflicts by locking resources immediately.",
      },
      {
        question: "In microservices architecture, what is the Saga pattern?",
        options: [
          "A way to manage distributed transactions across services",
          "A method for service discovery",
          "A pattern for API versioning",
          "A technique for load balancing",
        ],
        correct: "A way to manage distributed transactions across services",
        difficulty: "expert",
        explanation:
          "The Saga pattern manages distributed transactions by breaking them into a series of smaller, compensatable transactions.",
      },
    ],
    "Data Science": [
      // Easy Questions
      {
        question: "What is the difference between supervised and unsupervised learning?",
        options: [
          "Supervised uses labeled data, unsupervised uses unlabeled data",
          "Supervised is faster, unsupervised is more accurate",
          "Supervised is for classification, unsupervised is for regression",
          "There is no difference",
        ],
        correct: "Supervised uses labeled data, unsupervised uses unlabeled data",
        difficulty: "easy",
        explanation:
          "Supervised learning uses labeled training data, while unsupervised learning finds patterns in unlabeled data.",
      },
      // Medium Questions
      {
        question: "What is overfitting in machine learning?",
        options: [
          "When a model performs well on training data but poorly on new data",
          "When a model takes too long to train",
          "When a model uses too much memory",
          "When a model has too many features",
        ],
        correct: "When a model performs well on training data but poorly on new data",
        difficulty: "medium",
        explanation:
          "Overfitting occurs when a model learns the training data too well, including noise, and fails to generalize to new data.",
      },
      // Hard Questions
      {
        question: "What is the curse of dimensionality?",
        options: [
          "High-dimensional spaces become sparse, making analysis difficult",
          "Too many dimensions slow down computation",
          "Visualization becomes impossible in high dimensions",
          "Memory usage increases exponentially",
        ],
        correct: "High-dimensional spaces become sparse, making analysis difficult",
        difficulty: "hard",
        explanation:
          "In high-dimensional spaces, data points become sparse and distance metrics become less meaningful, making analysis challenging.",
      },
      // Expert Questions
      {
        question: "What is the difference between bagging and boosting ensemble methods?",
        options: [
          "Bagging trains models in parallel, boosting trains sequentially with error correction",
          "Bagging is for classification, boosting is for regression",
          "Bagging uses decision trees, boosting uses neural networks",
          "They are the same technique with different names",
        ],
        correct: "Bagging trains models in parallel, boosting trains sequentially with error correction",
        difficulty: "expert",
        explanation:
          "Bagging (Bootstrap Aggregating) trains models independently in parallel, while boosting trains models sequentially, with each model learning from the errors of previous ones.",
      },
    ],
    "General Position": [
      // Easy Questions
      {
        question: "If a train travels 120 km in 2 hours, what is its average speed?",
        options: ["50 km/h", "60 km/h", "70 km/h", "80 km/h"],
        correct: "60 km/h",
        difficulty: "easy",
        explanation: "Speed = Distance / Time = 120 km / 2 hours = 60 km/h",
      },
      {
        question: "What is 15% of 200?",
        options: ["25", "30", "35", "40"],
        correct: "30",
        difficulty: "easy",
        explanation: "15% of 200 = 0.15 × 200 = 30",
      },
      // Medium Questions
      {
        question: "A company's profit increased from $50,000 to $65,000. What is the percentage increase?",
        options: ["15%", "20%", "25%", "30%"],
        correct: "30%",
        difficulty: "medium",
        explanation: "Percentage increase = ((65,000 - 50,000) / 50,000) × 100 = 30%",
      },
      {
        question: "In a group of 100 people, 60 like coffee, 40 like tea, and 20 like both. How many like neither?",
        options: ["10", "20", "30", "40"],
        correct: "20",
        difficulty: "medium",
        explanation:
          "Using set theory: Total = Coffee only + Tea only + Both + Neither. 100 = 40 + 20 + 20 + Neither. Neither = 20",
      },
      // Hard Questions
      {
        question: "If log₂(x) = 3, what is the value of x?",
        options: ["6", "8", "9", "12"],
        correct: "8",
        difficulty: "hard",
        explanation: "log₂(x) = 3 means 2³ = x, so x = 8",
      },
      {
        question: "A sequence follows the pattern: 2, 6, 12, 20, 30, ... What is the next number?",
        options: ["40", "42", "44", "46"],
        correct: "42",
        difficulty: "hard",
        explanation: "The pattern is n(n+1): 1×2=2, 2×3=6, 3×4=12, 4×5=20, 5×6=30, 6×7=42",
      },
    ],
  },
  coding: {
    "Frontend Developer": [
      {
        id: 1,
        title: "Advanced React State Management",
        difficulty: "Hard",
        description:
          "Create a custom hook that manages complex form state with validation, debouncing, and error handling.",
        example: "Should handle nested objects, array fields, async validation, and provide optimistic updates.",
        template: `import { useState, useEffect, useCallback } from 'react';

// Create a custom hook useAdvancedForm
function useAdvancedForm(initialValues, validationRules, options = {}) {
  // Your implementation here
  // Should return: { values, errors, isValid, isSubmitting, handleChange, handleSubmit, reset }
}

// Example usage:
const MyForm = () => {
  const form = useAdvancedForm(
    { name: '', email: '', preferences: { theme: 'light', notifications: true } },
    {
      name: (value) => value.length < 2 ? 'Name must be at least 2 characters' : null,
      email: (value) => !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value) ? 'Invalid email' : null,
    },
    { debounceMs: 300 }
  );
  
  // Implement form JSX
  return <div>/* Your form implementation */</div>;
};`,
        testCases: [
          {
            input: "Initial form state",
            expected: "Should initialize with provided values",
            points: 20,
          },
          {
            input: "Field validation",
            expected: "Should validate fields according to rules",
            points: 25,
          },
          {
            input: "Debounced updates",
            expected: "Should debounce validation calls",
            points: 25,
          },
          {
            input: "Nested object handling",
            expected: "Should handle nested object updates correctly",
            points: 30,
          },
        ],
      },
      {
        id: 2,
        title: "Performance Optimization Challenge",
        difficulty: "Expert",
        description: "Optimize a React component that renders a large list with complex filtering and sorting.",
        example: "Handle 10,000+ items with real-time search, multiple filters, and smooth scrolling.",
        template: `import React, { useState, useMemo, useCallback } from 'react';

const LARGE_DATASET = Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  name: \`Item \${i}\`,
  category: ['A', 'B', 'C'][i % 3],
  price: Math.random() * 1000,
  rating: Math.random() * 5,
  tags: [\`tag\${i % 10}\`, \`tag\${(i + 1) % 10}\`],
}));

function OptimizedList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Implement optimized filtering, sorting, and rendering
  // Use techniques like: useMemo, useCallback, React.memo, virtualization
  
  return (
    <div>
      {/* Your optimized implementation */}
    </div>
  );
}`,
        testCases: [
          {
            input: "Large dataset rendering",
            expected: "Should render 10,000+ items efficiently",
            points: 30,
          },
          {
            input: "Real-time search performance",
            expected: "Search should be responsive with no lag",
            points: 25,
          },
          {
            input: "Memory usage optimization",
            expected: "Should not cause memory leaks or excessive re-renders",
            points: 25,
          },
          {
            input: "Smooth scrolling",
            expected: "Should implement virtual scrolling for performance",
            points: 20,
          },
        ],
      },
      {
        id: 3,
        title: "Advanced CSS Layout System",
        difficulty: "Hard",
        description:
          "Create a responsive grid system using CSS Grid and Flexbox that adapts to different screen sizes.",
        example: "Should support nested grids, dynamic column spans, and responsive breakpoints.",
        template: `/* Create a comprehensive grid system */
.grid-container {
  /* Your CSS implementation */
}

.grid-item {
  /* Grid item styles */
}

/* Responsive breakpoints */
@media (max-width: 768px) {
  /* Mobile styles */
}

@media (min-width: 769px) and (max-width: 1024px) {
  /* Tablet styles */
}

@media (min-width: 1025px) {
  /* Desktop styles */
}

/* Dynamic column spans */
.span-1 { /* 1 column */ }
.span-2 { /* 2 columns */ }
.span-3 { /* 3 columns */ }
/* ... up to 12 columns */

/* Example HTML structure:
<div class="grid-container">
  <div class="grid-item span-6">Item 1</div>
  <div class="grid-item span-3">Item 2</div>
  <div class="grid-item span-3">Item 3</div>
</div>
*/`,
        testCases: [
          {
            input: "12-column grid system",
            expected: "Should create flexible 12-column layout",
            points: 25,
          },
          {
            input: "Responsive breakpoints",
            expected: "Should adapt to mobile, tablet, and desktop",
            points: 25,
          },
          {
            input: "Dynamic column spans",
            expected: "Should support variable column widths",
            points: 25,
          },
          {
            input: "Nested grid support",
            expected: "Should allow grids within grid items",
            points: 25,
          },
        ],
      },
    ],
    "Backend Developer": [
      {
        id: 1,
        title: "Distributed Cache Implementation",
        difficulty: "Expert",
        description:
          "Design and implement a distributed caching system with Redis that handles cache invalidation, data consistency, and failover.",
        example: "Should support cache warming, TTL management, and handle network partitions gracefully.",
        template: `const redis = require('redis');
const { promisify } = require('util');

class DistributedCache {
  constructor(redisConfig) {
    // Initialize Redis clients (primary and backup)
    // Implement connection pooling and failover logic
  }

  async get(key, options = {}) {
    // Implement get with fallback strategies
    // Handle cache misses, network errors
  }

  async set(key, value, ttl = 3600) {
    // Implement set with replication
    // Handle write failures and consistency
  }

  async invalidate(pattern) {
    // Implement pattern-based cache invalidation
    // Handle distributed invalidation across nodes
  }

  async warmCache(dataLoader) {
    // Implement cache warming strategy
    // Handle bulk loading and error recovery
  }

  // Implement additional methods: mget, mset, exists, expire, etc.
}

// Usage example:
const cache = new DistributedCache({
  primary: { host: 'redis-primary', port: 6379 },
  backup: { host: 'redis-backup', port: 6379 },
  maxRetries: 3,
  retryDelay: 1000
});`,
        testCases: [
          {
            input: "Basic cache operations",
            expected: "Should handle get/set operations correctly",
            points: 20,
          },
          {
            input: "Failover handling",
            expected: "Should switch to backup when primary fails",
            points: 30,
          },
          {
            input: "Cache invalidation",
            expected: "Should invalidate cache entries by pattern",
            points: 25,
          },
          {
            input: "Performance optimization",
            expected: "Should handle high throughput efficiently",
            points: 25,
          },
        ],
      },
      {
        id: 2,
        title: "Advanced API Rate Limiting",
        difficulty: "Hard",
        description: "Implement a sophisticated rate limiting system with multiple algorithms and user tiers.",
        example: "Support token bucket, sliding window, and leaky bucket algorithms with Redis backend.",
        template: `class AdvancedRateLimiter {
  constructor(redisClient, config) {
    this.redis = redisClient;
    this.config = config;
    // Initialize different rate limiting algorithms
  }

  async checkLimit(userId, endpoint, algorithm = 'sliding_window') {
    // Implement multiple rate limiting algorithms:
    // 1. Token Bucket
    // 2. Sliding Window
    // 3. Leaky Bucket
    // 4. Fixed Window Counter
    
    switch (algorithm) {
      case 'token_bucket':
        return this.tokenBucket(userId, endpoint);
      case 'sliding_window':
        return this.slidingWindow(userId, endpoint);
      case 'leaky_bucket':
        return this.leakyBucket(userId, endpoint);
      default:
        return this.fixedWindow(userId, endpoint);
    }
  }

  async tokenBucket(userId, endpoint) {
    // Implement token bucket algorithm
    // Handle token refill rate and burst capacity
  }

  async slidingWindow(userId, endpoint) {
    // Implement sliding window log algorithm
    // Use Redis sorted sets for time-based tracking
  }

  // Implement other algorithms...

  async getUserTier(userId) {
    // Determine user's rate limit tier (free, premium, enterprise)
  }

  async getEndpointLimits(endpoint, userTier) {
    // Get rate limits based on endpoint and user tier
  }
}

// Express middleware usage:
const rateLimiter = new AdvancedRateLimiter(redisClient, config);

app.use(async (req, res, next) => {
  const result = await rateLimiter.checkLimit(req.user.id, req.path);
  if (!result.allowed) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: result.retryAfter
    });
  }
  next();
});`,
        testCases: [
          {
            input: "Token bucket implementation",
            expected: "Should implement token bucket correctly",
            points: 25,
          },
          {
            input: "Sliding window accuracy",
            expected: "Should track requests in sliding time window",
            points: 25,
          },
          {
            input: "User tier handling",
            expected: "Should apply different limits based on user tier",
            points: 25,
          },
          {
            input: "High concurrency",
            expected: "Should handle concurrent requests accurately",
            points: 25,
          },
        ],
      },
      {
        id: 3,
        title: "Database Connection Pool Optimization",
        difficulty: "Expert",
        description:
          "Create an intelligent database connection pool that adapts to load patterns and handles failover.",
        example:
          "Should monitor connection health, implement circuit breaker pattern, and optimize pool size dynamically.",
        template: `const { Pool } = require('pg');
const EventEmitter = require('events');

class IntelligentConnectionPool extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.pools = new Map(); // Multiple pools for read/write separation
    this.metrics = {
      activeConnections: 0,
      queuedRequests: 0,
      avgResponseTime: 0,
      errorRate: 0
    };
    this.circuitBreaker = {
      state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
      failures: 0,
      lastFailureTime: null
    };
    
    this.initializePools();
    this.startHealthMonitoring();
  }

  async initializePools() {
    // Initialize primary and replica pools
    // Implement read/write splitting logic
  }

  async getConnection(operation = 'read') {
    // Implement intelligent connection routing
    // Handle circuit breaker logic
    // Apply connection pooling strategies
    
    if (this.circuitBreaker.state === 'OPEN') {
      throw new Error('Circuit breaker is OPEN');
    }

    try {
      const pool = this.selectPool(operation);
      const connection = await this.acquireConnection(pool);
      return this.wrapConnection(connection);
    } catch (error) {
      this.handleConnectionError(error);
      throw error;
    }
  }

  selectPool(operation) {
    // Implement load balancing logic
    // Consider pool health, load, and operation type
  }

  async acquireConnection(pool) {
    // Implement connection acquisition with timeout
    // Handle pool exhaustion gracefully
  }

  wrapConnection(connection) {
    // Wrap connection with monitoring and auto-release
    // Track query performance and errors
  }

  startHealthMonitoring() {
    // Implement health checks for all pools
    // Monitor connection metrics and adjust pool sizes
    setInterval(() => {
      this.checkPoolHealth();
      this.adjustPoolSizes();
      this.updateCircuitBreaker();
    }, 30000); // Check every 30 seconds
  }

  async checkPoolHealth() {
    // Implement health checks for each pool
  }

  adjustPoolSizes() {
    // Dynamically adjust pool sizes based on load
  }

  updateCircuitBreaker() {
    // Update circuit breaker state based on error rates
  }
}

// Usage example:
const pool = new IntelligentConnectionPool({
  primary: { host: 'db-primary', port: 5432, database: 'myapp' },
  replicas: [
    { host: 'db-replica-1', port: 5432, database: 'myapp' },
    { host: 'db-replica-2', port: 5432, database: 'myapp' }
  ],
  poolSize: { min: 5, max: 20 },
  healthCheck: { interval: 30000, timeout: 5000 }
});`,
        testCases: [
          {
            input: "Connection pool management",
            expected: "Should manage connections efficiently",
            points: 25,
          },
          {
            input: "Circuit breaker implementation",
            expected: "Should implement circuit breaker pattern",
            points: 25,
          },
          {
            input: "Read/write splitting",
            expected: "Should route queries to appropriate pools",
            points: 25,
          },
          {
            input: "Dynamic pool sizing",
            expected: "Should adjust pool size based on load",
            points: 25,
          },
        ],
      },
    ],
    "Data Science": [
      {
        id: 1,
        title: "Advanced Feature Engineering Pipeline",
        difficulty: "Hard",
        description:
          "Create a comprehensive feature engineering pipeline that handles missing data, outliers, and creates advanced features.",
        example: "Should include automated feature selection, polynomial features, and time-based features.",
        template: `import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.pipeline import Pipeline
from sklearn.base import BaseEstimator, TransformerMixin

class AdvancedFeatureEngineer(BaseEstimator, TransformerMixin):
    def __init__(self, handle_missing='auto', outlier_method='iqr', 
                 create_polynomial=True, time_features=True):
        self.handle_missing = handle_missing
        self.outlier_method = outlier_method
        self.create_polynomial = create_polynomial
        self.time_features = time_features
        
    def fit(self, X, y=None):
        # Analyze data and determine optimal preprocessing strategies
        # Calculate statistics for missing value imputation
        # Determine outlier thresholds
        # Identify feature types (numerical, categorical, datetime)
        return self
        
    def transform(self, X):
        # Implement comprehensive feature engineering:
        # 1. Handle missing values intelligently
        # 2. Detect and handle outliers
        # 3. Create polynomial and interaction features
        # 4. Extract time-based features
        # 5. Encode categorical variables
        # 6. Scale numerical features
        # 7. Create domain-specific features
        
        X_transformed = X.copy()
        
        # Your implementation here
        
        return X_transformed
    
    def handle_missing_values(self, X):
        # Implement intelligent missing value handling
        # Use different strategies for different feature types
        pass
    
    def detect_outliers(self, X):
        # Implement multiple outlier detection methods
        # IQR, Z-score, Isolation Forest
        pass
    
    def create_polynomial_features(self, X):
        # Create polynomial and interaction features
        # Use feature selection to avoid curse of dimensionality
        pass
    
    def extract_time_features(self, X):
        # Extract features from datetime columns
        # Day of week, month, season, holidays, etc.
        pass

# Usage example:
feature_engineer = AdvancedFeatureEngineer(
    handle_missing='auto',
    outlier_method='isolation_forest',
    create_polynomial=True,
    time_features=True
)

# Create pipeline
pipeline = Pipeline([
    ('feature_engineering', feature_engineer),
    ('feature_selection', SelectKBest(f_classif, k=50)),
    ('scaling', StandardScaler())
])`,
        testCases: [
          {
            input: "Missing value handling",
            expected: "Should handle missing values appropriately",
            points: 25,
          },
          {
            input: "Outlier detection",
            expected: "Should detect and handle outliers correctly",
            points: 25,
          },
          {
            input: "Feature creation",
            expected: "Should create meaningful new features",
            points: 25,
          },
          {
            input: "Pipeline integration",
            expected: "Should work seamlessly in sklearn pipeline",
            points: 25,
          },
        ],
      },
      {
        id: 2,
        title: "Custom Neural Network Implementation",
        difficulty: "Expert",
        description:
          "Implement a neural network from scratch with backpropagation, different activation functions, and regularization.",
        example: "Should support multiple layers, different optimizers, and various regularization techniques.",
        template: `import numpy as np
import matplotlib.pyplot as plt

class NeuralNetwork:
    def __init__(self, layers, activation='relu', optimizer='adam', 
                 learning_rate=0.001, regularization=None, reg_lambda=0.01):
        """
        layers: list of integers representing neurons in each layer
        activation: activation function ('relu', 'sigmoid', 'tanh')
        optimizer: optimization algorithm ('sgd', 'adam', 'rmsprop')
        """
        self.layers = layers
        self.activation = activation
        self.optimizer = optimizer
        self.learning_rate = learning_rate
        self.regularization = regularization
        self.reg_lambda = reg_lambda
        
        # Initialize weights and biases
        self.weights = []
        self.biases = []
        self.initialize_parameters()
        
        # For Adam optimizer
        if optimizer == 'adam':
            self.m_weights = [np.zeros_like(w) for w in self.weights]
            self.v_weights = [np.zeros_like(w) for w in self.weights]
            self.m_biases = [np.zeros_like(b) for b in self.biases]
            self.v_biases = [np.zeros_like(b) for b in self.biases]
            self.t = 0  # time step
    
    def initialize_parameters(self):
        # Implement Xavier/He initialization
        # Different initialization strategies for different activations
        pass
    
    def forward_propagation(self, X):
        # Implement forward pass
        # Store activations for backpropagation
        # Apply dropout if specified
        pass
    
    def backward_propagation(self, X, y, cache):
        # Implement backpropagation algorithm
        # Calculate gradients for weights and biases
        # Apply regularization gradients
        pass
    
    def update_parameters(self, gradients):
        # Implement different optimizers
        if self.optimizer == 'sgd':
            self.sgd_update(gradients)
        elif self.optimizer == 'adam':
            self.adam_update(gradients)
        elif self.optimizer == 'rmsprop':
            self.rmsprop_update(gradients)
    
    def sgd_update(self, gradients):
        # Implement SGD with momentum
        pass
    
    def adam_update(self, gradients):
        # Implement Adam optimizer
        pass
    
    def compute_loss(self, y_true, y_pred):
        # Implement loss function with regularization
        # Support different loss functions (MSE, Cross-entropy)
        pass
    
    def fit(self, X, y, epochs=1000, batch_size=32, validation_split=0.2):
        # Implement training loop
        # Support mini-batch training
        # Track training and validation loss
        # Implement early stopping
        pass
    
    def predict(self, X):
        # Make predictions on new data
        pass
    
    def plot_training_history(self):
        # Plot training and validation loss curves
        pass

# Activation functions
def relu(x):
    return np.maximum(0, x)

def relu_derivative(x):
    return (x > 0).astype(float)

def sigmoid(x):
    return 1 / (1 + np.exp(-np.clip(x, -250, 250)))

def sigmoid_derivative(x):
    s = sigmoid(x)
    return s * (1 - s)

# Usage example:
nn = NeuralNetwork(
    layers=[784, 128, 64, 10],  # Input, hidden, output layers
    activation='relu',
    optimizer='adam',
    learning_rate=0.001,
    regularization='l2',
    reg_lambda=0.01
)

# Train the network
nn.fit(X_train, y_train, epochs=100, batch_size=32)

# Make predictions
predictions = nn.predict(X_test)`,
        testCases: [
          {
            input: "Forward propagation",
            expected: "Should correctly compute forward pass",
            points: 25,
          },
          {
            input: "Backpropagation",
            expected: "Should correctly compute gradients",
            points: 30,
          },
          {
            input: "Optimizer implementation",
            expected: "Should implement Adam optimizer correctly",
            points: 25,
          },
          {
            input: "Regularization",
            expected: "Should apply L2 regularization properly",
            points: 20,
          },
        ],
      },
    ],
    "General Position": [
      {
        id: 1,
        title: "Advanced Algorithm Implementation",
        difficulty: "Medium",
        description:
          "Implement a comprehensive sorting and searching library with multiple algorithms and performance analysis.",
        example: "Should include quicksort, mergesort, binary search, and performance benchmarking.",
        template: `class AlgorithmLibrary {
  constructor() {
    this.performanceMetrics = {
      comparisons: 0,
      swaps: 0,
      timeComplexity: '',
      spaceComplexity: ''
    };
  }

  // Sorting Algorithms
  quickSort(arr, low = 0, high = arr.length - 1) {
    // Implement quicksort with random pivot selection
    // Track performance metrics
    // Handle edge cases (empty array, single element)
  }

  mergeSort(arr) {
    // Implement merge sort
    // Optimize for space complexity
    // Track performance metrics
  }

  heapSort(arr) {
    // Implement heap sort
    // Build max heap and extract elements
  }

  // Searching Algorithms
  binarySearch(arr, target) {
    // Implement iterative and recursive versions
    // Handle edge cases
  }

  interpolationSearch(arr, target) {
    // Implement interpolation search for uniformly distributed data
  }

  // Advanced Data Structures
  implementTrie() {
    // Implement Trie data structure for string operations
    class TrieNode {
      constructor() {
        this.children = {};
        this.isEndOfWord = false;
      }
    }

    class Trie {
      constructor() {
        this.root = new TrieNode();
      }

      insert(word) {
        // Insert word into trie
      }

      search(word) {
        // Search for word in trie
      }

      startsWith(prefix) {
        // Check if any word starts with prefix
      }

      delete(word) {
        // Delete word from trie
      }
    }

    return new Trie();
  }

  // Performance Analysis
  benchmark(algorithm, data, iterations = 1000) {
    // Benchmark algorithm performance
    // Measure time complexity empirically
    // Generate performance report
  }

  generateTestData(size, type = 'random') {
    // Generate different types of test data
    // Random, sorted, reverse sorted, nearly sorted
  }

  analyzeComplexity(algorithm, dataSizes) {
    // Analyze time complexity by running algorithm on different data sizes
    // Plot complexity curve
  }
}

// Usage example:
const algLib = new AlgorithmLibrary();

// Test sorting algorithms
const testData = algLib.generateTestData(10000, 'random');
const sortedData = algLib.quickSort([...testData]);

// Benchmark performance
const results = algLib.benchmark('quickSort', testData, 100);
console.log('Performance Results:', results);

// Analyze complexity
const complexityAnalysis = algLib.analyzeComplexity('quickSort', [100, 1000, 10000, 100000]);`,
        testCases: [
          {
            input: "Sorting correctness",
            expected: "Should sort arrays correctly",
            points: 30,
          },
          {
            input: "Search algorithms",
            expected: "Should implement search algorithms correctly",
            points: 25,
          },
          {
            input: "Trie implementation",
            expected: "Should implement Trie data structure",
            points: 25,
          },
          {
            input: "Performance analysis",
            expected: "Should provide accurate performance metrics",
            points: 20,
          },
        ],
      },
      {
        id: 2,
        title: "System Design Problem",
        difficulty: "Hard",
        description: "Design a URL shortening service like bit.ly with high availability and scalability requirements.",
        example: "Should handle 100M URLs per day, provide analytics, and ensure 99.9% uptime.",
        template: `// Design a URL Shortening Service
// Requirements:
// - Shorten long URLs to 6-character codes
// - Handle 100M URLs per day (1000 requests/second)
// - Provide click analytics
// - 99.9% availability
// - Custom aliases support

class URLShortener {
  constructor(config) {
    this.config = config;
    this.database = new Database(config.db);
    this.cache = new Cache(config.cache);
    this.analytics = new Analytics(config.analytics);
    
    // Initialize base62 encoding
    this.base62Chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  }

  async shortenURL(longURL, customAlias = null, userId = null) {
    // 1. Validate input URL
    // 2. Check if URL already exists (optional deduplication)
    // 3. Generate short code or use custom alias
    // 4. Store in database with metadata
    // 5. Cache the mapping
    // 6. Return shortened URL
    
    try {
      // Input validation
      if (!this.isValidURL(longURL)) {
        throw new Error('Invalid URL format');
      }

      // Check for existing URL (optional)
      const existing = await this.findExistingURL(longURL, userId);
      if (existing && !customAlias) {
        return existing.shortURL;
      }

      // Generate or validate short code
      const shortCode = customAlias || await this.generateShortCode();
      
      // Check if short code is available
      if (await this.isShortCodeTaken(shortCode)) {
        if (customAlias) {
          throw new Error('Custom alias already taken');
        }
        return this.shortenURL(longURL, null, userId); // Retry with new code
      }

      // Store in database
      const urlData = {
        shortCode,
        longURL,
        userId,
        createdAt: new Date(),
        clickCount: 0,
        isActive: true
      };

      await this.database.store(shortCode, urlData);
      await this.cache.set(shortCode, urlData, 3600); // Cache for 1 hour

      return \`\${this.config.baseURL}/\${shortCode}\`;
    } catch (error) {
      console.error('Error shortening URL:', error);
      throw error;
    }
  }

  async expandURL(shortCode) {
    // 1. Check cache first
    // 2. If not in cache, query database
    // 3. Update cache
    // 4. Record analytics
    // 5. Return long URL
    
    try {
      // Check cache first
      let urlData = await this.cache.get(shortCode);
      
      if (!urlData) {
        // Query database
        urlData = await this.database.get(shortCode);
        if (!urlData) {
          throw new Error('URL not found');
        }
        
        // Update cache
        await this.cache.set(shortCode, urlData, 3600);
      }

      // Check if URL is active
      if (!urlData.isActive) {
        throw new Error('URL has been deactivated');
      }

      // Record analytics asynchronously
      this.recordClick(shortCode, urlData);

      return urlData.longURL;
    } catch (error) {
      console.error('Error expanding URL:', error);
      throw error;
    }
  }

  async generateShortCode() {
    // Implement base62 encoding with collision handling
    // Use counter-based approach for better performance
    
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const combined = timestamp * 1000 + random;
    
    return this.base62Encode(combined).substring(0, 6);
  }

  base62Encode(num) {
    if (num === 0) return this.base62Chars[0];
    
    let result = '';
    while (num > 0) {
      result = this.base62Chars[num % 62] + result;
      num = Math.floor(num / 62);
    }
    return result;
  }

  async recordClick(shortCode, urlData) {
    // Record click analytics
    // Update click count
    // Store click metadata (timestamp, IP, user agent, etc.)
    
    try {
      // Increment click count
      await this.database.incrementClickCount(shortCode);
      
      // Record detailed analytics
      await this.analytics.recordClick({
        shortCode,
        timestamp: new Date(),
        // Additional metadata can be added here
      });
    } catch (error) {
      console.error('Error recording click:', error);
      // Don't throw error to avoid breaking URL redirection
    }
  }

  async getAnalytics(shortCode, userId) {
    // Return analytics data for a short URL
    // Include click count, time series data, geographic data, etc.
    
    const urlData = await this.database.get(shortCode);
    if (!urlData || urlData.userId !== userId) {
      throw new Error('Unauthorized or URL not found');
    }

    const analytics = await this.analytics.getAnalytics(shortCode);
    
    return {
      shortCode,
      longURL: urlData.longURL,
      totalClicks: urlData.clickCount,
      createdAt: urlData.createdAt,
      clickHistory: analytics.clickHistory,
      // Additional analytics data
    };
  }

  isValidURL(url) {
    // Implement URL validation
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  async isShortCodeTaken(shortCode) {
    // Check if short code already exists
    const cached = await this.cache.get(shortCode);
    if (cached) return true;
    
    const stored = await this.database.get(shortCode);
    return !!stored;
  }
}

// Supporting classes (simplified interfaces)
class Database {
  constructor(config) {
    // Initialize database connection (MongoDB, PostgreSQL, etc.)
  }

  async store(shortCode, urlData) {
    // Store URL data in database
  }

  async get(shortCode) {
    // Retrieve URL data from database
  }

  async incrementClickCount(shortCode) {
    // Increment click count atomically
  }
}

class Cache {
  constructor(config) {
    // Initialize cache (Redis, Memcached, etc.)
  }

  async get(key) {
    // Get value from cache
  }

  async set(key, value, ttl) {
    // Set value in cache with TTL
  }
}

class Analytics {
  constructor(config) {
    // Initialize analytics storage
  }

  async recordClick(clickData) {
    // Record click event
  }

  async getAnalytics(shortCode) {
    // Get analytics data
  }
}

// Usage example:
const urlShortener = new URLShortener({
  baseURL: 'https://short.ly',
  db: { host: 'localhost', port: 27017, name: 'urlshortener' },
  cache: { host: 'localhost', port: 6379 },
  analytics: { host: 'localhost', port: 9200 }
});

// Shorten a URL
const shortURL = await urlShortener.shortenURL('https://www.example.com/very/long/url');

// Expand a URL
const longURL = await urlShortener.expandURL('abc123');

// Get analytics
const analytics = await urlShortener.getAnalytics('abc123', 'user123');`,
        testCases: [
          {
            input: "URL shortening",
            expected: "Should generate unique short codes",
            points: 25,
          },
          {
            input: "URL expansion",
            expected: "Should correctly expand short URLs",
            points: 25,
          },
          {
            input: "Analytics tracking",
            expected: "Should track clicks and provide analytics",
            points: 25,
          },
          {
            input: "System design considerations",
            expected: "Should address scalability and availability",
            points: 25,
          },
        ],
      },
    ],
  },
}

// Function to generate unique questions for each user with varying difficulty
const generateAdvancedQuestions = (role, userId, difficulty = "mixed") => {
  const roleQuestions = ADVANCED_QUESTION_POOLS.aptitude[role] || ADVANCED_QUESTION_POOLS.aptitude["General Position"]

  // Use userId as seed for consistent randomization per user
  const seed = Number.parseInt(userId.slice(-8), 16) || 12345

  // Simple seeded random function
  const seededRandom = (seed) => {
    const x = Math.sin(seed) * 10000
    return x - Math.floor(x)
  }

  // Filter questions by difficulty if specified
  let filteredQuestions = roleQuestions
  if (difficulty !== "mixed") {
    filteredQuestions = roleQuestions.filter((q) => q.difficulty === difficulty)
  }

  // Shuffle questions based on user seed
  const shuffled = [...filteredQuestions]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i) * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  // Return questions with balanced difficulty distribution
  const easyQuestions = shuffled.filter((q) => q.difficulty === "easy").slice(0, 3)
  const mediumQuestions = shuffled.filter((q) => q.difficulty === "medium").slice(0, 4)
  const hardQuestions = shuffled.filter((q) => q.difficulty === "hard").slice(0, 2)
  const expertQuestions = shuffled.filter((q) => q.difficulty === "expert").slice(0, 1)

  const balancedQuestions = [...easyQuestions, ...mediumQuestions, ...hardQuestions, ...expertQuestions]

  // Shuffle the final selection
  for (let i = balancedQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i + 100) * (i + 1))
    ;[balancedQuestions[i], balancedQuestions[j]] = [balancedQuestions[j], balancedQuestions[i]]
  }

  return balancedQuestions.slice(0, 10).map((q, index) => ({
    ...q,
    id: index + 1,
  }))
}

// Generate coding questions based on role and difficulty
const generateCodingQuestions = (role, userId) => {
  const roleQuestions = ADVANCED_QUESTION_POOLS.coding[role] || ADVANCED_QUESTION_POOLS.coding["General Position"]
  const seed = Number.parseInt(userId.slice(-8), 16) || 12345

  const seededRandom = (seed) => {
    const x = Math.sin(seed) * 10000
    return x - Math.floor(x)
  }

  const shuffled = [...roleQuestions]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i) * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  return shuffled.slice(0, 3)
}

// Enhanced endpoint to get unique questions for a user
app.get("/api/client/interview-questions", async (req, res) => {
  try {
    const { email, role, difficulty = "mixed" } = req.query

    if (!email) {
      return res.status(400).json({ error: "Email is required" })
    }

    // Find user to get their ID
    const user = await User.findOne({ email: email.toLowerCase().trim() })
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    const userRole = role || "General Position"
    const aptitudeQuestions = generateAdvancedQuestions(userRole, user._id.toString(), difficulty)
    const codingQuestions = generateCodingQuestions(userRole, user._id.toString())

    console.log(
      `✅ Generated ${aptitudeQuestions.length} aptitude and ${codingQuestions.length} coding questions for ${email} (${userRole})`,
    )

    res.json({
      aptitudeQuestions,
      codingQuestions,
      role: userRole,
      userId: user._id,
      difficulty: difficulty,
    })
  } catch (err) {
    console.error("❌ Generate questions error:", err)
    res.status(500).json({ error: "Failed to generate questions" })
  }
})

// Generate random interview code
const generateInterviewCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Multer setup for file upload with better error handling
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, `${uniqueSuffix}-${file.originalname}`)
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "text/plain",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error("Invalid file type. Only TXT, PDF, DOC, and DOCX are allowed."))
    }
  },
})

// Enhanced resume parsing endpoint with PDF support
app.post("/api/client/parse-resume", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" })
    }

    console.log("📄 Processing resume file:", req.file.originalname, "Type:", req.file.mimetype)

    let resumeText = ""

    // Handle different file types
    if (req.file.mimetype === "application/pdf") {
      // Parse PDF file
      const dataBuffer = fs.readFileSync(req.file.path)
      const pdfData = await pdf(dataBuffer)
      resumeText = pdfData.text
      console.log("✅ PDF parsed successfully, text length:", resumeText.length)
    } else if (req.file.mimetype === "text/plain") {
      // Read text file
      resumeText = fs.readFileSync(req.file.path, "utf8")
      console.log("✅ Text file read successfully, text length:", resumeText.length)
    } else {
      // For DOC/DOCX files, we'll need additional parsing
      return res.status(400).json({
        error: "DOC/DOCX files require additional setup. Please use PDF or TXT files.",
      })
    }

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({
        error: "Could not extract sufficient text from the resume. Please check the file format.",
      })
    }

    // Use Gemini API to parse the resume text
    const GEMINI_API_KEY = "AIzaSyBe2gAXouTuPzR0HuqY6cSLL40OWjblklw"

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a professional resume parser. Extract information from the following resume text and return ONLY a valid JSON object with these exact fields:

{
  "full_name": "candidate's full name",
  "email": "email address if found, otherwise empty string",
  "phone": "phone number in any format",
  "institution": "most recent educational institution name",
  "address": "full address or city, state if available",
  "experience": "work experience description or years",
  "education": "highest degree and field of study",
  "linkedin": "LinkedIn profile URL if found",
  "portfolio": "portfolio website URL if found", 
  "github": "GitHub profile URL if found",
  "role": "suggested job role based on skills and experience",
  "skills": ["array", "of", "key", "skills", "extracted"]
}

Important rules:
- Return ONLY the JSON object, no other text
- If a field is not found, use empty string "" or empty array [] for skills
- Extract actual values from the resume text
- For role, suggest based on the candidate's experience and skills
- For skills, extract technical skills, programming languages, tools, etc.

Resume text:
${resumeText}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 1,
            maxOutputTokens: 1024,
          },
        }),
      },
    )

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const geminiData = await response.json()
    console.log("🤖 Gemini raw response:", geminiData)

    let parsedData
    const responseText = geminiData.candidates[0].content.parts[0].text.trim()

    // Try to extract JSON from the response
    try {
      // Remove any markdown formatting
      const cleanedResponse = responseText.replace(/```json\n?|\n?```/g, "").trim()
      parsedData = JSON.parse(cleanedResponse)
    } catch (parseError) {
      console.error("JSON parse error:", parseError)
      // Try to find JSON within the text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("Could not extract valid JSON from response")
      }
    }

    console.log("✅ Parsed resume data:", parsedData)

    // Clean up the uploaded file
    fs.unlinkSync(req.file.path)

    res.json({
      success: true,
      data: parsedData,
      message: "Resume parsed successfully",
    })
  } catch (err) {
    console.error("❌ Resume parsing error:", err)

    // Clean up the uploaded file in case of error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path)
    }

    res.status(500).json({
      error: "Failed to parse resume. Please check the file format and try again.",
      details: err.message,
    })
  }
})

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  })
})

// Client signup endpoint
app.post("/api/client/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body
    console.log(`📝 User signup attempt: ${email}`)

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() })
    if (existingUser) {
      return res.status(400).json({ error: "User already exists with this email" })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    })

    await user.save()
    console.log(`✅ User created successfully: ${email}`)

    res.json({ success: true, message: "Account created successfully" })
  } catch (err) {
    console.error("❌ Signup error:", err)
    res.status(500).json({ error: "Failed to create account" })
  }
})

// Client login endpoint
app.post("/api/client/login", async (req, res) => {
  try {
    const { email, password } = req.body
    console.log(`🔐 Login attempt: ${email}`)

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" })
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase().trim() })
    if (!user) {
      console.log(`❌ User not found: ${email}`)
      return res.status(400).json({ error: "Invalid email or password" })
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      console.log(`❌ Invalid password for: ${email}`)
      return res.status(400).json({ error: "Invalid email or password" })
    }

    // Check if user has application
    const application = await Applicant.findOne({ email: email.toLowerCase().trim() })
    const hasApplication = !!application

    // Update user's hasApplication status
    await User.findByIdAndUpdate(user._id, { hasApplication })

    // Generate JWT token
    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: "7d" })

    console.log(`✅ Login successful: ${email}`)

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        hasApplication,
        ...(application && {
          phone: application.phone,
          institution: application.institution,
          address: application.address,
          experience: application.experience,
          education: application.education,
          linkedin: application.linkedin,
          portfolio: application.portfolio,
          github: application.github,
          role: application.role,
          skills: application.skills,
        }),
      },
      token,
    })
  } catch (err) {
    console.error("❌ Login error:", err)
    res.status(500).json({ error: "Login failed" })
  }
})

// Endpoint to get application data
app.get("/api/client/application", async (req, res) => {
  try {
    const { email } = req.query
    console.log(`🔍 Fetching application for email: ${email}`)

    if (!email) {
      return res.status(400).json({ error: "Email is required" })
    }

    const application = await Applicant.findOne({ email: email.toLowerCase().trim() })
    console.log(`📋 Application found for ${email}: ${!!application}`)

    if (!application) {
      return res.status(404).json({ error: "Application not found" })
    }

    res.json(application)
  } catch (err) {
    console.error("❌ Get application error:", err)
    res.status(500).json({ error: "Server error" })
  }
})

// Endpoint to receive client application
app.post("/api/client/apply", upload.single("resume"), async (req, res) => {
  try {
    console.log("📝 Received application submission")
    console.log("Body:", req.body)
    console.log("File:", req.file ? req.file.filename : "No file")

    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: "Email is required" })
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim()
    console.log(`🔍 Looking for user with email: ${normalizedEmail}`)

    // Check if application already exists
    const existingApplication = await Applicant.findOne({ email: normalizedEmail })
    if (existingApplication) {
      console.log(`⚠️ Application already exists for email: ${normalizedEmail}`)
      return res.status(400).json({ error: "Application already submitted for this email." })
    }

    // Find user
    const user = await User.findOne({ email: normalizedEmail })
    if (!user) {
      console.log(`❌ User not found for email: ${normalizedEmail}`)
      const allUsers = await User.find({}, { email: 1, name: 1 })
      console.log("📋 All users in database:", allUsers)
      return res.status(400).json({
        error: "User not found. Please ensure you are logged in with the correct account.",
        debug: `Looking for: ${normalizedEmail}`,
      })
    }

    console.log(`✅ User found: ${user.name} (${user.email})`)

    const { name, phone, institution, address, experience, education, linkedin, portfolio, github, role, skills } =
      req.body

    // Validate required fields
    if (!name || !phone || !institution || !education || !req.file) {
      return res.status(400).json({ error: "Required fields and resume file are missing" })
    }

    const resumeUrl = `/uploads/${req.file.filename}`

    const applicant = new Applicant({
      userId: user._id,
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      institution: institution.trim(),
      address: address?.trim() || "",
      experience: experience?.trim() || "",
      education: education.trim(),
      linkedin: linkedin?.trim() || "",
      portfolio: portfolio?.trim() || "",
      github: github?.trim() || "",
      role: role?.trim() || "",
      skills: skills ? JSON.parse(skills) : [],
      resumeUrl,
      resumeFileName: req.file.originalname,
      status: "pending",
      priority: "medium",
      tags: [],
      notes: [],
    })

    await applicant.save()
    console.log(`✅ Application saved for: ${normalizedEmail}`)

    // Update user's hasApplication status
    await User.findByIdAndUpdate(user._id, { hasApplication: true })

    // Send confirmation email to applicant
    const confirmationHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=width, initial-scale=1.0">
        <title>Application Received</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
          <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #2563eb;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">AI Interview Platform</h1>
          </div>
          
          <div style="padding: 30px 0;">
            <h2 style="color: #059669; margin-bottom: 20px;">Application Received Successfully! ✅</h2>
            
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">Dear <strong>${name}</strong>,</p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              Thank you for submitting your application to our AI Interview Platform. We have successfully received your details and resume.
            </p>
            
            <div style="background-color: #f3f4f6; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2563eb;">
              <h3 style="color: #374151; margin-top: 0; margin-bottom: 15px;">📋 Application Summary:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Name:</td>
                  <td style="padding: 8px 0; color: #374151;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Email:</td>
                  <td style="padding: 8px 0; color: #374151;">${normalizedEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Role:</td>
                  <td style="padding: 8px 0; color: #374151;">${role || "General Position"}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Institution:</td>
                  <td style="padding: 8px 0; color: #374151;">${institution}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Submitted:</td>
                  <td style="padding: 8px 0; color: #374151;">${new Date().toLocaleString()}</td>
                </tr>
              </table>
            </div>
            
            <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #10b981;">
              <h3 style="color: #065f46; margin-top: 0; margin-bottom: 15px;">🚀 What's Next?</h3>
              <ol style="color: #047857; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>Our team will review your application within <strong>2-3 business days</strong></li>
                <li>If selected, you'll receive an interview code via email</li>
                <li>Use the code to access our AI-powered interview platform</li>
                <li>Complete the interview rounds (Aptitude, Coding, HR)</li>
                <li>Receive your results and feedback</li>
              </ol>
            </div>
            
            <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #f59e0b;">
              <h3 style="color: #92400e; margin-top: 0; margin-bottom: 15px;">💡 Pro Tips:</h3>
              <ul style="color: #b45309; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>Keep checking your email (including spam folder)</li>
                <li>Ensure you have a working webcam and stable internet</li>
                <li>Practice coding problems relevant to your role</li>
                <li>Prepare for behavioral questions</li>
              </ul>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              If you have any questions or concerns, please don't hesitate to contact our support team.
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              Best regards,<br>
              <strong>The AI Interview Platform Team</strong>
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
            <p style="margin: 0;">© 2024 AI Interview Platform. All rights reserved.</p>
            <p style="margin: 5px 0 0 0;">This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `

    console.log("📧 Sending confirmation email...")
    const emailResult = await sendEmail(
      normalizedEmail,
      "✅ Application Received Successfully - AI Interview Platform",
      confirmationHtml,
    )

    console.log("📧 Email result:", emailResult)

    res.json({
      success: true,
      message: "Application submitted successfully",
      emailSent: emailResult.success,
    })
  } catch (err) {
    console.error("❌ Apply error:", err)
    if (err.code === 11000) {
      res.status(400).json({ error: "Application already exists for this email" })
    } else {
      res.status(500).json({ error: "Failed to save application data", details: err.message })
    }
  }
})

// Endpoint to update client profile
app.put("/api/client/update-profile", async (req, res) => {
  try {
    const { email, ...updateData } = req.body
    console.log(`📝 Updating profile for: ${email}`)

    const applicant = await Applicant.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      {
        ...updateData,
        updatedAt: new Date(),
      },
      { new: true },
    )

    if (!applicant) {
      return res.status(404).json({ error: "Application not found" })
    }

    console.log(`✅ Profile updated for: ${email}`)
    res.json({ success: true, message: "Profile updated successfully", applicant })
  } catch (err) {
    console.error("❌ Update profile error:", err)
    res.status(500).json({ error: "Failed to update profile" })
  }
})

// Debug endpoint to check users
app.get("/api/debug/users", async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }).limit(10)
    res.json({ users, count: users.length })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Enhanced Admin endpoint to get all applicants with advanced filtering and analytics
app.get("/api/admin/applicants", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      role,
      priority,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      dateFrom,
      dateTo,
    } = req.query

    console.log("🔍 Fetching applicants with filters:", req.query)

    // Build filter object
    const filter = {}

    if (status && status !== "all") {
      filter.status = status
    }

    if (role && role !== "all") {
      filter.role = new RegExp(role, "i")
    }

    if (priority && priority !== "all") {
      filter.priority = priority
    }

    if (search) {
      filter.$or = [
        { name: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
        { institution: new RegExp(search, "i") },
        { skills: { $in: [new RegExp(search, "i")] } },
      ]
    }

    if (dateFrom || dateTo) {
      filter.createdAt = {}
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom)
      if (dateTo) filter.createdAt.$lte = new Date(dateTo)
    }

    // Build sort object
    const sort = {}
    sort[sortBy] = sortOrder === "desc" ? -1 : 1

    // Calculate pagination
    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    // Fetch applicants with pagination
    const applicants = await Applicant.find(filter)
      .populate("userId", "name email")
      .sort(sort)
      .skip(skip)
      .limit(Number.parseInt(limit))

    // Get total count for pagination
    const totalCount = await Applicant.countDocuments(filter)

    // Calculate analytics
    const analytics = await calculateAnalytics(filter)

    console.log(`📋 Found ${applicants.length} applicants (${totalCount} total)`)

    res.json({
      applicants,
      pagination: {
        currentPage: Number.parseInt(page),
        totalPages: Math.ceil(totalCount / Number.parseInt(limit)),
        totalCount,
        hasNext: skip + applicants.length < totalCount,
        hasPrev: Number.parseInt(page) > 1,
      },
      analytics,
    })
  } catch (err) {
    console.error("❌ Get applicants error:", err)
    res.status(500).json({ error: "Failed to fetch applicants" })
  }
})

// Function to calculate analytics
const calculateAnalytics = async (filter = {}) => {
  try {
    const totalApplicants = await Applicant.countDocuments(filter)

    const statusDistribution = await Applicant.aggregate([
      { $match: filter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ])

    const roleDistribution = await Applicant.aggregate([
      { $match: filter },
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ])

    const priorityDistribution = await Applicant.aggregate([
      { $match: filter },
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ])

    const averageScore = await Applicant.aggregate([
      { $match: { ...filter, "interviewResults.totalScore": { $exists: true, $gt: 0 } } },
      { $group: { _id: null, avgScore: { $avg: "$interviewResults.totalScore" } } },
    ])

    const topSkills = await Applicant.aggregate([
      { $match: filter },
      { $unwind: "$skills" },
      { $group: { _id: "$skills", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ])

    const institutionDistribution = await Applicant.aggregate([
      { $match: filter },
      { $group: { _id: "$institution", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ])

    const violationStats = await Applicant.aggregate([
      { $match: { ...filter, "interviewResults.violations": { $exists: true, $ne: [] } } },
      { $unwind: "$interviewResults.violations" },
      { $group: { _id: "$interviewResults.violations.type", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ])

    const applicationTrend = await Applicant.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
      { $limit: 30 },
    ])

    return {
      totalApplicants,
      statusDistribution: statusDistribution.map((item) => ({ status: item._id, count: item.count })),
      roleDistribution: roleDistribution.map((item) => ({ role: item._id || "Not Specified", count: item.count })),
      priorityDistribution: priorityDistribution.map((item) => ({ priority: item._id, count: item.count })),
      averageScore: averageScore.length > 0 ? Math.round(averageScore[0].avgScore * 100) / 100 : 0,
      topSkills: topSkills.map((item) => ({ skill: item._id, count: item.count })),
      institutionDistribution: institutionDistribution.map((item) => ({
        institution: item._id,
        count: item.count,
      })),
      violationStats: violationStats.map((item) => ({ type: item._id, count: item.count })),
      applicationTrend: applicationTrend.map((item) => ({
        date: `${item._id.year}-${String(item._id.month).padStart(2, "0")}-${String(item._id.day).padStart(2, "0")}`,
        count: item.count,
      })),
    }
  } catch (error) {
    console.error("❌ Analytics calculation error:", error)
    return {}
  }
}

// Admin endpoint to view resume
app.get("/api/admin/resume/:applicantId", async (req, res) => {
  try {
    const { applicantId } = req.params
    console.log(`📄 Fetching resume for applicant: ${applicantId}`)

    const applicant = await Applicant.findById(applicantId)
    if (!applicant || !applicant.resumeUrl) {
      return res.status(404).json({ error: "Resume not found" })
    }

    const resumePath = path.join(__dirname, applicant.resumeUrl)
    if (!fs.existsSync(resumePath)) {
      return res.status(404).json({ error: "Resume file not found on server" })
    }

    res.json({
      resumeUrl: applicant.resumeUrl,
      fileName: applicant.resumeFileName,
      downloadUrl: `http://localhost:5000${applicant.resumeUrl}`,
    })
  } catch (err) {
    console.error("❌ Get resume error:", err)
    res.status(500).json({ error: "Failed to fetch resume" })
  }
})

// Enhanced Admin endpoint to approve applicant with scheduling
app.post("/api/admin/approve-applicant", async (req, res) => {
  try {
    const { applicantId, email, name, scheduleInterview = false, interviewDate, interviewTime, interviewer } = req.body
    console.log(`✅ Approving applicant: ${email}`)

    // Generate interview code
    const interviewCode = generateInterviewCode()
    const interviewCodeExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now

    const updateData = {
      status: "approved",
      interviewCode,
      interviewCodeExpiry,
      updatedAt: new Date(),
    }

    // Add interview schedule if provided
    if (scheduleInterview && interviewDate && interviewTime) {
      updateData.interviewSchedule = {
        scheduledDate: new Date(interviewDate),
        scheduledTime: interviewTime,
        interviewer: interviewer || "AI System",
        timezone: "UTC",
      }
    }

    // Update applicant status
    await Applicant.findByIdAndUpdate(applicantId, updateData)

    // Send approval email with interview code
    const approvalHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Interview Approved</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
          <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #059669;">
            <h1 style="color: #059669; margin: 0; font-size: 28px;">🎉 Congratulations!</h1>
          </div>
          
          <div style="padding: 30px 0;">
            <h2 style="color: #059669; margin-bottom: 20px;">You've Been Approved for Interview! ✅</h2>
            
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">Dear <strong>${name}</strong>,</p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              Great news! Your application has been reviewed and <strong>approved</strong>. You are now eligible to take the AI-powered interview.
            </p>
            
            <div style="background-color: #ecfdf5; border: 3px solid #10b981; padding: 30px; border-radius: 12px; margin: 30px 0; text-align: center;">
              <h3 style="color: #065f46; margin-top: 0; margin-bottom: 20px; font-size: 20px;">🔑 Your Interview Code</h3>
              <div style="font-size: 36px; font-weight: bold; color: #059669; letter-spacing: 8px; font-family: 'Courier New', monospace; background-color: #ffffff; padding: 20px; border-radius: 8px; border: 2px dashed #10b981; margin: 20px 0;">
                ${interviewCode}
              </div>
              <p style="color: #047857; margin-bottom: 0; font-size: 14px; font-weight: bold;">⚠️ Keep this code safe - you'll need it to access your interview</p>
            </div>
            
            ${
              scheduleInterview
                ? `
            <div style="background-color: #dbeafe; border: 2px solid #3b82f6; padding: 25px; border-radius: 8px; margin: 25px 0;">
              <h3 style="color: #1e40af; margin-top: 0; margin-bottom: 15px;">📅 Interview Schedule</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #1e40af; font-weight: bold;">Date:</td>
                  <td style="padding: 8px 0; color: #1e3a8a;">${new Date(interviewDate).toLocaleDateString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #1e40af; font-weight: bold;">Time:</td>
                  <td style="padding: 8px 0; color: #1e3a8a;">${interviewTime}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #1e40af; font-weight: bold;">Interviewer:</td>
                  <td style="padding: 8px 0; color: #1e3a8a;">${interviewer || "AI System"}</td>
                </tr>
              </table>
            </div>
            `
                : ""
            }
            
            <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #3b82f6;">
              <h3 style="color: #1e40af; margin-top: 0; margin-bottom: 15px;">📋 Interview Structure</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px; background-color: #dbeafe; border-radius: 6px; margin-bottom: 8px; display: block;">
                    <strong style="color: #1e40af;">Round 1: Advanced Aptitude Test</strong><br>
                    <span style="color: #64748b; font-size: 14px;">10 questions • 15 minutes • Adaptive difficulty</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px; background-color: #dcfce7; border-radius: 6px; margin-bottom: 8px; display: block;">
                    <strong style="color: #166534;">Round 2: Advanced Coding Challenge</strong><br>
                    <span style="color: #64748b; font-size: 14px;">3 problems • 45 minutes • Real-world scenarios</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px; background-color: #fae8ff; border-radius: 6px; display: block;">
                    <strong style="color: #7c2d12;">Round 3: Behavioral Interview</strong><br>
                    <span style="color: #64748b; font-size: 14px;">5 questions • 20 minutes • AI-powered analysis</span>
                  </td>
                </tr>
              </table>
              <p style="color: #dc2626; font-weight: bold; text-align: center; margin: 15px 0 0 0; font-size: 16px;">
                ⏱️ Total Duration: 80 minutes
              </p>
            </div>
            
            <div style="background-color: #fef3c7; padding: 25px; border-radius: 8px; margin: 25px 0; border: 1px solid #f59e0b;">
              <h3 style="color: #92400e; margin-top: 0; margin-bottom: 15px;">🚀 How to Start Your Interview</h3>
              <ol style="color: #b45309; line-height: 2; margin: 0; padding-left: 20px; font-size: 15px;">
                <li><strong>Log in</strong> to your client dashboard</li>
                <li>Click on <strong>"Enter Interview Code"</strong></li>
                <li>Enter your code: <strong style="background-color: #ffffff; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${interviewCode}</strong></li>
                <li><strong>Allow camera access</strong> when prompted</li>
                <li><strong>Complete all three rounds</strong> of the interview</li>
              </ol>
            </div>
            
            <div style="background-color: #fef2f2; padding: 25px; border-radius: 8px; margin: 25px 0; border: 1px solid #f87171;">
              <h3 style="color: #dc2626; margin-top: 0; margin-bottom: 15px;">⚠️ Enhanced Monitoring Guidelines</h3>
              <ul style="color: #b91c1c; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li><strong>Advanced AI monitoring</strong> will track your behavior throughout</li>
                <li><strong>Face detection</strong> using ML models ensures identity verification</li>
                <li><strong>Eye tracking</strong> monitors attention and focus patterns</li>
                <li><strong>Audio analysis</strong> detects external assistance attempts</li>
                <li><strong>Screen monitoring</strong> prevents tab switching and external resources</li>
                <li><strong>Complete within 7 days</strong> - code expires on ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="font-size: 18px; color: #374151; margin-bottom: 10px;">Ready to showcase your advanced skills?</p>
              <p style="font-size: 16px; color: #059669; font-weight: bold;">Good luck with your interview! 🍀</p>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              If you encounter any technical issues during the interview, please contact our support team immediately.
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              Best regards,<br>
              <strong>The AI Interview Platform Team</strong>
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
            <p style="margin: 0;">© 2024 AI Interview Platform. All rights reserved.</p>
            <p style="margin: 5px 0 0 0;">This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `

    console.log("📧 Sending approval email...")
    const emailResult = await sendEmail(email, "🎉 Interview Approved - Your Interview Code Inside", approvalHtml)

    console.log("📧 Approval email result:", emailResult)

    res.json({
      success: true,
      message: "Applicant approved and interview code sent",
      emailSent: emailResult.success,
      interviewCode: interviewCode,
      scheduled: scheduleInterview,
    })
  } catch (err) {
    console.error("❌ Approve applicant error:", err)
    res.status(500).json({ error: "Failed to approve applicant" })
  }
})

// Admin endpoint to reject applicant
app.post("/api/admin/reject-applicant", async (req, res) => {
  try {
    const { applicantId, email, reason = "Application does not meet current requirements" } = req.body
    console.log(`❌ Rejecting applicant: ${email}`)

    // Update applicant status
    const applicant = await Applicant.findByIdAndUpdate(applicantId, {
      status: "rejected",
      updatedAt: new Date(),
      notes: [
        {
          content: `Application rejected: ${reason}`,
          author: "System",
          timestamp: new Date(),
        },
      ],
    })

    // Send rejection email
    const rejectionHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Application Status Update</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
          <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #dc2626;">
            <h1 style="color: #dc2626; margin: 0; font-size: 28px;">Application Update</h1>
          </div>
          
          <div style="padding: 30px 0;">
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">Dear <strong>${applicant.name}</strong>,</p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              Thank you for your interest in our position and for taking the time to submit your application to our AI Interview Platform.
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              After careful consideration of all applications, we have decided not to move forward with your application at this time. ${reason}
            </p>
            
            <div style="background-color: #f3f4f6; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #6b7280;">
              <p style="color: #4b5563; margin: 0; line-height: 1.6;">
                We encourage you to continue developing your skills and apply for future opportunities that match your experience and interests. We will keep your information on file for consideration for other suitable positions that may arise.
              </p>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              We appreciate your interest in our company and wish you the best of luck in your job search and career endeavors.
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              Best regards,<br>
              <strong>The AI Interview Platform Team</strong>
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
            <p style="margin: 0;">© 2024 AI Interview Platform. All rights reserved.</p>
            <p style="margin: 5px 0 0 0;">This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `

    console.log("📧 Sending rejection email...")
    const emailResult = await sendEmail(email, "Application Status Update - AI Interview Platform", rejectionHtml)

    console.log("📧 Rejection email result:", emailResult)

    res.json({
      success: true,
      message: "Applicant rejected and notification sent",
      emailSent: emailResult.success,
    })
  } catch (err) {
    console.error("❌ Reject applicant error:", err)
    res.status(500).json({ error: "Failed to reject applicant" })
  }
})

// Admin endpoint to update applicant status and priority
app.put("/api/admin/applicant/:applicantId", async (req, res) => {
  try {
    const { applicantId } = req.params
    const { status, priority, tags, notes } = req.body

    console.log(`📝 Updating applicant ${applicantId}:`, req.body)

    const updateData = {
      updatedAt: new Date(),
    }

    if (status) updateData.status = status
    if (priority) updateData.priority = priority
    if (tags) updateData.tags = tags

    if (notes) {
      updateData.$push = {
        notes: {
          content: notes,
          author: "Admin",
          timestamp: new Date(),
        },
      }
    }

    const applicant = await Applicant.findByIdAndUpdate(applicantId, updateData, { new: true })

    if (!applicant) {
      return res.status(404).json({ error: "Applicant not found" })
    }

    res.json({
      success: true,
      message: "Applicant updated successfully",
      applicant,
    })
  } catch (err) {
    console.error("❌ Update applicant error:", err)
    res.status(500).json({ error: "Failed to update applicant" })
  }
})

// Admin endpoint to add feedback to applicant
app.post("/api/admin/applicant/:applicantId/feedback", async (req, res) => {
  try {
    const { applicantId } = req.params
    const { strengths, weaknesses, recommendations, overallRating, hiringRecommendation } = req.body

    console.log(`📝 Adding feedback for applicant ${applicantId}`)

    const applicant = await Applicant.findByIdAndUpdate(
      applicantId,
      {
        feedback: {
          strengths: strengths || [],
          weaknesses: weaknesses || [],
          recommendations: recommendations || [],
          overallRating: overallRating || 0,
          hiringRecommendation: hiringRecommendation || "pending",
        },
        updatedAt: new Date(),
      },
      { new: true },
    )

    if (!applicant) {
      return res.status(404).json({ error: "Applicant not found" })
    }

    res.json({
      success: true,
      message: "Feedback added successfully",
      applicant,
    })
  } catch (err) {
    console.error("❌ Add feedback error:", err)
    res.status(500).json({ error: "Failed to add feedback" })
  }
})

// Admin endpoint to get detailed analytics
app.get("/api/admin/analytics", async (req, res) => {
  try {
    const { period = "30d", role, status } = req.query

    console.log("📊 Generating analytics for period:", period)

    // Calculate date range
    const now = new Date()
    const startDate = new Date()

    switch (period) {
      case "7d":
        startDate.setDate(now.getDate() - 7)
        break
      case "30d":
        startDate.setDate(now.getDate() - 30)
        break
      case "90d":
        startDate.setDate(now.getDate() - 90)
        break
      case "1y":
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }

    const filter = {
      createdAt: { $gte: startDate, $lte: now },
    }

    if (role && role !== "all") {
      filter.role = new RegExp(role, "i")
    }

    if (status && status !== "all") {
      filter.status = status
    }

    const analytics = await calculateAnalytics(filter)

    // Additional advanced analytics
    const performanceMetrics = await Applicant.aggregate([
      {
        $match: {
          ...filter,
          "interviewResults.totalScore": { $exists: true, $gt: 0 },
        },
      },
      {
        $group: {
          _id: null,
          avgAptitudeScore: { $avg: "$interviewResults.aptitudeScore" },
          avgCodingScore: { $avg: "$interviewResults.codingScore" },
          avgHrScore: { $avg: "$interviewResults.hrScore" },
          avgTotalScore: { $avg: "$interviewResults.totalScore" },
          maxScore: { $max: "$interviewResults.totalScore" },
          minScore: { $min: "$interviewResults.totalScore" },
          totalInterviews: { $sum: 1 },
        },
      },
    ])

    const conversionFunnel = await Applicant.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ])

    const timeToComplete = await Applicant.aggregate([
      {
        $match: {
          ...filter,
          "interviewResults.timeSpent.total": { $exists: true, $gt: 0 },
        },
      },
      {
        $group: {
          _id: null,
          avgTimeToComplete: { $avg: "$interviewResults.timeSpent.total" },
          minTime: { $min: "$interviewResults.timeSpent.total" },
          maxTime: { $max: "$interviewResults.timeSpent.total" },
        },
      },
    ])

    res.json({
      ...analytics,
      performanceMetrics: performanceMetrics[0] || {},
      conversionFunnel,
      timeToComplete: timeToComplete[0] || {},
      period,
      dateRange: {
        start: startDate,
        end: now,
      },
    })
  } catch (err) {
    console.error("❌ Analytics error:", err)
    res.status(500).json({ error: "Failed to generate analytics" })
  }
})

// Admin endpoint to export data
app.get("/api/admin/export", async (req, res) => {
  try {
    const { format = "json", status, role, dateFrom, dateTo } = req.query

    console.log("📤 Exporting data in format:", format)

    // Build filter
    const filter = {}
    if (status && status !== "all") filter.status = status
    if (role && role !== "all") filter.role = new RegExp(role, "i")
    if (dateFrom || dateTo) {
      filter.createdAt = {}
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom)
      if (dateTo) filter.createdAt.$lte = new Date(dateTo)
    }

    const applicants = await Applicant.find(filter).populate("userId", "name email").lean()

    if (format === "csv") {
      // Convert to CSV format
      const csvHeaders = [
        "Name",
        "Email",
        "Phone",
        "Institution",
        "Role",
        "Status",
        "Priority",
        "Total Score",
        "Aptitude Score",
        "Coding Score",
        "HR Score",
        "Violations",
        "Created At",
        "Updated At",
      ]

      const csvRows = applicants.map((applicant) => [
        applicant.name,
        applicant.email,
        applicant.phone,
        applicant.institution,
        applicant.role || "",
        applicant.status,
        applicant.priority,
        applicant.interviewResults?.totalScore || 0,
        applicant.interviewResults?.aptitudeScore || 0,
        applicant.interviewResults?.codingScore || 0,
        applicant.interviewResults?.hrScore || 0,
        applicant.interviewResults?.violations?.length || 0,
        applicant.createdAt,
        applicant.updatedAt,
      ])

      const csvContent = [csvHeaders, ...csvRows].map((row) => row.map((field) => `"${field}"`).join(",")).join("\n")

      res.setHeader("Content-Type", "text/csv")
      res.setHeader("Content-Disposition", `attachment; filename="applicants-${Date.now()}.csv"`)
      res.send(csvContent)
    } else {
      // Return JSON format
      res.json({
        data: applicants,
        count: applicants.length,
        exportedAt: new Date(),
        filters: { status, role, dateFrom, dateTo },
      })
    }
  } catch (err) {
    console.error("❌ Export error:", err)
    res.status(500).json({ error: "Failed to export data" })
  }
})

// Endpoint to verify interview code
app.post("/api/client/verify-interview-code", async (req, res) => {
  try {
    const { email, code } = req.body
    console.log(`🔍 Verifying interview code for: ${email}`)

    const applicant = await Applicant.findOne({
      email: email.toLowerCase().trim(),
      interviewCode: code.toUpperCase().trim(),
      status: "approved",
      interviewCodeExpiry: { $gt: new Date() },
    })

    if (!applicant) {
      console.log(`❌ Invalid or expired code for: ${email}`)
      return res.status(400).json({
        success: false,
        error: "Invalid or expired interview code",
      })
    }

    console.log(`✅ Valid interview code for: ${email}`)
    res.json({
      success: true,
      interviewData: {
        name: applicant.name,
        role: applicant.role,
        applicantId: applicant._id,
        email: applicant.email,
        scheduledDate: applicant.interviewSchedule?.scheduledDate,
        scheduledTime: applicant.interviewSchedule?.scheduledTime,
        interviewer: applicant.interviewSchedule?.interviewer,
      },
    })
  } catch (err) {
    console.error("❌ Verify code error:", err)
    res.status(500).json({ error: "Failed to verify interview code" })
  }
})

// Enhanced endpoint to submit interview results with detailed analytics
app.post("/api/client/submit-interview", async (req, res) => {
  try {
    const { email, interviewResults } = req.body
    console.log(`📝 Submitting interview results for: ${email}`)

    // Calculate percentile based on all completed interviews
    const allScores = await Applicant.find(
      { "interviewResults.totalScore": { $exists: true, $gt: 0 } },
      { "interviewResults.totalScore": 1 },
    )

    const scores = allScores.map((a) => a.interviewResults.totalScore).sort((a, b) => a - b)
    const currentScore = interviewResults.totalScore
    const percentile = scores.length > 0 ? (scores.filter((s) => s <= currentScore).length / scores.length) * 100 : 50

    const applicant = await Applicant.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      {
        status: "interview_completed",
        interviewResults: {
          ...interviewResults,
          percentile: Math.round(percentile),
          completedAt: new Date(),
        },
        updatedAt: new Date(),
      },
      { new: true },
    )

    if (!applicant) {
      return res.status(404).json({ error: "Applicant not found" })
    }

    console.log(`✅ Interview results saved for: ${email} (Percentile: ${Math.round(percentile)}%)`)

    // Send completion email with results
    const completionHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Interview Completed</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
          <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #059669;">
            <h1 style="color: #059669; margin: 0; font-size: 28px;">🎉 Interview Completed!</h1>
          </div>
          
          <div style="padding: 30px 0;">
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">Dear <strong>${applicant.name}</strong>,</p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              Congratulations on completing your AI interview! Here's a summary of your performance:
            </p>
            
            <div style="background-color: #f0f9ff; border: 2px solid #0ea5e9; padding: 25px; border-radius: 12px; margin: 25px 0;">
              <h3 style="color: #0c4a6e; margin-top: 0; margin-bottom: 20px; text-align: center;">📊 Your Results</h3>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                <div style="text-align: center; padding: 15px; background-color: #ffffff; border-radius: 8px;">
                  <div style="font-size: 24px; font-weight: bold; color: #0ea5e9;">${interviewResults.aptitudeScore}%</div>
                  <div style="font-size: 14px; color: #64748b;">Aptitude</div>
                </div>
                <div style="text-align: center; padding: 15px; background-color: #ffffff; border-radius: 8px;">
                  <div style="font-size: 24px; font-weight: bold; color: #10b981;">${interviewResults.codingScore}%</div>
                  <div style="font-size: 14px; color: #64748b;">Coding</div>
                </div>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div style="text-align: center; padding: 15px; background-color: #ffffff; border-radius: 8px;">
                  <div style="font-size: 24px; font-weight: bold; color: #8b5cf6;">${interviewResults.hrScore}%</div>
                  <div style="font-size: 14px; color: #64748b;">HR</div>
                </div>
                <div style="text-align: center; padding: 15px; background-color: #ffffff; border-radius: 8px;">
                  <div style="font-size: 24px; font-weight: bold; color: #f59e0b;">${interviewResults.totalScore}%</div>
                  <div style="font-size: 14px; color: #64748b;">Total</div>
                </div>
              </div>
              
              <div style="text-align: center; margin-top: 20px; padding: 15px; background-color: #ecfdf5; border-radius: 8px;">
                <div style="font-size: 18px; font-weight: bold; color: #059669;">Percentile: ${Math.round(percentile)}%</div>
                <div style="font-size: 14px; color: #047857;">You performed better than ${Math.round(percentile)}% of candidates</div>
              </div>
            </div>
            
            <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #f59e0b;">
              <h3 style="color: #92400e; margin-top: 0; margin-bottom: 15px;">⏱️ Time Analysis</h3>
              <ul style="color: #b45309; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>Aptitude: ${Math.round(interviewResults.timeSpent.aptitude / 60)} minutes</li>
                <li>Coding: ${Math.round(interviewResults.timeSpent.coding / 60)} minutes</li>
                <li>HR: ${Math.round(interviewResults.timeSpent.hr / 60)} minutes</li>
                <li><strong>Total: ${Math.round(interviewResults.timeSpent.total / 60)} minutes</strong></li>
              </ul>
            </div>
            
            ${
              interviewResults.violations && interviewResults.violations.length > 0
                ? `
            <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #f87171;">
              <h3 style="color: #dc2626; margin-top: 0; margin-bottom: 15px;">⚠️ Monitoring Alerts</h3>
              <p style="color: #b91c1c; margin: 0;">${interviewResults.violations.length} monitoring alert(s) were recorded during your interview.</p>
            </div>
            `
                : ""
            }
            
            <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #3b82f6;">
              <h3 style="color: #1e40af; margin-top: 0; margin-bottom: 15px;">🔄 What's Next?</h3>
              <ol style="color: #1e3a8a; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>Our team will review your complete interview performance</li>
                <li>You'll receive detailed feedback within 3-5 business days</li>
                <li>If selected, we'll contact you for the next round</li>
                <li>Keep an eye on your email for updates</li>
              </ol>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              Thank you for taking the time to complete our interview process. We appreciate your interest in joining our team.
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              Best regards,<br>
              <strong>The AI Interview Platform Team</strong>
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
            <p style="margin: 0;">© 2024 AI Interview Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `

    console.log("📧 Sending completion email...")
    const emailResult = await sendEmail(email, "🎉 Interview Completed - Results Inside", completionHtml)

    res.json({
      success: true,
      message: "Interview results submitted successfully",
      percentile: Math.round(percentile),
      emailSent: emailResult.success,
    })
  } catch (err) {
    console.error("❌ Submit interview error:", err)
    res.status(500).json({ error: "Failed to submit interview results" })
  }
})

// Serve uploaded files
app.use("/uploads", express.static(uploadsDir))

// Admin login endpoint
app.post("/api/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body
    console.log(`🔐 Admin login attempt: ${username}`)

    // Simple admin credentials (in production, use proper authentication)
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin"
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123"

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const token = jwt.sign({ role: "admin", username }, JWT_SECRET, { expiresIn: "24h" })

      console.log(`✅ Admin login successful: ${username}`)
      res.json({
        success: true,
        token,
        user: { username, role: "admin" },
      })
    } else {
      console.log(`❌ Invalid admin credentials: ${username}`)
      res.status(401).json({ error: "Invalid credentials" })
    }
  } catch (err) {
    console.error("❌ Admin login error:", err)
    res.status(500).json({ error: "Login failed" })
  }
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err)
  res.status(500).json({ error: "Internal server error", details: err.message })
})

// Start server
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📊 Admin Dashboard: http://localhost:${PORT}/admin`)
  console.log(`👥 Client Portal: http://localhost:${PORT}/client`)
  console.log(`🔧 Health Check: http://localhost:${PORT}/api/health`)
})

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down server...")
  await mongoose.connection.close()
  console.log("✅ Database connection closed")
  process.exit(0)
})
