import { useState, useEffect } from 'react'

function AirPass() {
  const [phase, setPhase] = useState('loading') // loading -> checkmark -> text -> complete

  useEffect(() => {
    // Phase 1: Circle loading animation plays for 2s
    const t1 = setTimeout(() => setPhase('checkmark'), 2000)
    // Phase 2: Checkmark appears, then after 0.8s show text
    const t2 = setTimeout(() => setPhase('text'), 2800)
    // Phase 3: Full complete state with subtitle
    const t3 = setTimeout(() => setPhase('complete'), 3600)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [])

  return (
    <div className="page-container" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>

      {/* Animated circle + checkmark */}
      <div className="final-check-container">
        <svg className="final-check-svg" viewBox="0 0 120 120" width="140" height="140">
          {/* Background circle (subtle) */}
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="4"
          />
          {/* Animated progress circle */}
          <circle
            className={`final-check-circle ${phase !== 'loading' ? 'done' : ''}`}
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="url(#circleGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
          />
          {/* Success fill */}
          <circle
            className={`final-check-fill ${phase !== 'loading' ? 'visible' : ''}`}
            cx="60"
            cy="60"
            r="50"
            fill="rgba(16, 185, 129, 0.12)"
          />
          {/* Checkmark */}
          <path
            className={`final-check-mark ${phase !== 'loading' ? 'visible' : ''}`}
            d="M38 62 L52 76 L82 46"
            fill="none"
            stroke="#10b981"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <defs>
            <linearGradient id="circleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Title text */}
      <h1
        className={`final-title ${phase === 'text' || phase === 'complete' ? 'visible' : ''}`}
      >
        Your digital passport is ready
      </h1>

      {/* Subtitle */}
      <p
        className={`final-subtitle ${phase === 'complete' ? 'visible' : ''}`}
      >
        We're looking forward to seeing you at the airport.
        <br />
        Have a safe and pleasant flight! ✈️
      </p>

      {/* Bottom decorative badge */}
      <div className={`final-badge ${phase === 'complete' ? 'visible' : ''}`}>
        <span style={{ color: 'var(--accent-green)' }}>●</span> AirPass Activated
      </div>
    </div>
  )
}

export default AirPass
