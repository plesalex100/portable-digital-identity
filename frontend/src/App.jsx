import { useState, createContext, useContext } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import './App.css'

import Welcome from './pages/Welcome'
import PersonalInfo from './pages/PersonalInfo'
import AccountSecurity from './pages/AccountSecurity'
import FlightDetails from './pages/FlightDetails'
import Verification from './pages/Verification'
import Review from './pages/Review'
import AirPass from './pages/AirPass'

// Context for sharing form data across pages
const FormDataContext = createContext()

export function useFormData() {
  return useContext(FormDataContext)
}

const STEPS = [
  { path: '/personal-info', label: 'Personal', num: 1 },
  { path: '/security', label: 'Security', num: 2 },
  { path: '/flight-details', label: 'Flight', num: 3 },
  { path: '/verification', label: 'Verify', num: 4 },
  { path: '/review', label: 'Review', num: 5 },
  { path: '/airpass', label: 'AirPass', num: 6 },
]

function ProgressStepper({ currentStep }) {
  return (
    <div className="progress-container">
      {STEPS.map((step, i) => (
        <div className="step-item" key={step.num}>
          <div
            className={`step-circle ${
              step.num === currentStep ? 'active' : step.num < currentStep ? 'completed' : ''
            }`}
          >
            {step.num < currentStep ? '✓' : step.num}
          </div>
          {i < STEPS.length - 1 && (
            <div className={`step-line ${step.num < currentStep ? 'completed' : ''}`} />
          )}
        </div>
      ))}
    </div>
  )
}

function AppShell({ children, currentStep, showBack, onBack, isWelcome }) {
  return (
    <div className="app-shell">
      {/* Brand */}
      <div className="brand-header">
        <div className="brand-logo">
          ✈ AirPass
        </div>
      </div>

      {/* Progress — hidden on welcome screen */}
      {!isWelcome && <ProgressStepper currentStep={currentStep} />}

      {/* Header with back */}
      {showBack && (
        <div className="app-header">
          <button className="back-btn" onClick={onBack} aria-label="Go back">
            ←
          </button>
        </div>
      )}

      {/* Page content */}
      {children}
    </div>
  )
}

function App() {
  const [formData, setFormData] = useState({
    // Page 1: Personal Info
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    cnp: '',
    nationality: '',
    documentType: 'id_card',
    documentNumber: '',
    // Page 2: Account Security
    email: '',
    password: '',
    confirmPassword: '',
    // Page 3: Flight Details
    flightNumber: '',
    bookingReference: '',
    flightDate: '',
    // Page 4: Verification
    phoneNumber: '',
    faceVerified: false,
    faceImage: null,
    // Page 5: Review
    gdprConsent: false,
  })

  const updateFormData = (updates) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const location = useLocation()
  const navigate = useNavigate()

  const isWelcome = location.pathname === '/'
  const currentStep = STEPS.find(s => s.path === location.pathname)?.num || 1
  const showBack = !isWelcome && currentStep > 1 && currentStep < 6

  const goBack = () => {
    if (currentStep === 1) {
      navigate('/')
      return
    }
    const prevStep = STEPS.find(s => s.num === currentStep - 1)
    if (prevStep) navigate(prevStep.path)
  }

  return (
    <FormDataContext.Provider value={{ formData, updateFormData }}>
      <AppShell currentStep={currentStep} showBack={showBack} onBack={goBack} isWelcome={isWelcome}>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/personal-info" element={<PersonalInfo />} />
          <Route path="/security" element={<AccountSecurity />} />
          <Route path="/flight-details" element={<FlightDetails />} />
          <Route path="/verification" element={<Verification />} />
          <Route path="/review" element={<Review />} />
          <Route path="/airpass" element={<AirPass />} />
        </Routes>
      </AppShell>
    </FormDataContext.Provider>
  )
}

export default App
