import { useState, createContext, useContext } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import './App.css'

import Welcome from './pages/Welcome'
import PersonalInfo from './pages/PersonalInfo'
import AccountSecurity from './pages/AccountSecurity'
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
  { path: '/verification', label: 'Verify', num: 3 },
  { path: '/review', label: 'Review', num: 4 },
  { path: '/airpass', label: 'AirPass', num: 5 },
]

// Steps for returning users who skip registration
const LOGIN_STEPS = [
  { path: '/verification', label: 'Verify', num: 1 },
  { path: '/review', label: 'Review', num: 2 },
  { path: '/airpass', label: 'AirPass', num: 3 },
]

function ProgressStepper({ steps, currentStep }) {
  return (
    <div className="progress-container">
      {steps.map((step, i) => (
        <div className="step-item" key={step.num}>
          <div
            className={`step-circle ${
              step.num === currentStep ? 'active' : step.num < currentStep ? 'completed' : ''
            }`}
          >
            {step.num < currentStep ? '✓' : step.num}
          </div>
          {i < steps.length - 1 && (
            <div className={`step-line ${step.num < currentStep ? 'completed' : ''}`} />
          )}
        </div>
      ))}
    </div>
  )
}

function AppShell({ children, steps, currentStep, showBack, onBack, isWelcome, isFinal }) {
  return (
    <div className="app-shell">
      {/* Brand */}
      <div className="brand-header">
        <div className="brand-logo">
          ✈ AirPass
        </div>
      </div>

      {/* Progress — hidden on welcome screen and final screen */}
      {!isWelcome && !isFinal && <ProgressStepper steps={steps} currentStep={currentStep} />}

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
    // Page 3: Verification
    phoneNumber: '',
    faceVerified: false,
    faceImage: null,
    // Page 4: Review
    gdprConsent: false,
  })

  // Track which flow the user is in
  const [userFlow, setUserFlow] = useState('new') // 'new' or 'returning'

  const updateFormData = (updates) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const location = useLocation()
  const navigate = useNavigate()

  const isWelcome = location.pathname === '/'
  const isFinal = location.pathname === '/airpass'

  // Pick the right steps based on user flow
  const activeSteps = userFlow === 'returning' ? LOGIN_STEPS : STEPS
  const currentStep = activeSteps.find(s => s.path === location.pathname)?.num || 1
  const lastStepNum = activeSteps[activeSteps.length - 1].num
  const showBack = !isWelcome && !isFinal && currentStep <= lastStepNum

  const goBack = () => {
    // If on the first step of the current flow, go back to Welcome
    if (currentStep === 1) {
      navigate('/')
      return
    }
    const prevStep = activeSteps.find(s => s.num === currentStep - 1)
    if (prevStep) navigate(prevStep.path)
  }

  return (
    <FormDataContext.Provider value={{ formData, updateFormData, userFlow, setUserFlow }}>
      <AppShell
        steps={activeSteps}
        currentStep={currentStep}
        showBack={showBack}
        onBack={goBack}
        isWelcome={isWelcome}
        isFinal={isFinal}
      >
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/personal-info" element={<PersonalInfo />} />
          <Route path="/security" element={<AccountSecurity />} />
          <Route path="/verification" element={<Verification />} />
          <Route path="/review" element={<Review />} />
          <Route path="/airpass" element={<AirPass />} />
        </Routes>
      </AppShell>
    </FormDataContext.Provider>
  )
}

export default App
