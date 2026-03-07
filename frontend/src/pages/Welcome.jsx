import { useNavigate } from 'react-router-dom'

function Welcome() {
  const navigate = useNavigate()

  return (
    <div className="page-container" style={{ justifyContent: 'center', textAlign: 'center' }}>
      {/* Hero */}
      <div style={{ marginBottom: 'var(--space-2xl)' }}>
        <div style={{
          fontSize: '64px',
          marginBottom: 'var(--space-lg)',
          animation: 'successPop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}>
          ✈️
        </div>
        <h1 className="page-title" style={{ fontSize: 'var(--font-3xl)', textAlign: 'center' }}>
          Welcome to AirPass
        </h1>
        <p className="page-subtitle" style={{ textAlign: 'center', maxWidth: '320px', margin: '0 auto', marginTop: 'var(--space-sm)' }}>
          Your seamless digital airport identity. Fast-track security and boarding with biometric verification.
        </p>
      </div>

      {/* Features */}
      <div className="glass-card" style={{ textAlign: 'left', marginBottom: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <span style={{ fontSize: '20px', flexShrink: 0 }}>🔒</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>Biometric Security</div>
              <div className="text-sm text-muted">Face verification for seamless check-in</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <span style={{ fontSize: '20px', flexShrink: 0 }}>⚡</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>Fast-Track Boarding</div>
              <div className="text-sm text-muted">Skip the queues with your digital pass</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <span style={{ fontSize: '20px', flexShrink: 0 }}>🛡️</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>Privacy First</div>
              <div className="text-sm text-muted">Biometric data auto-deleted after 24h</div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <button
          className="btn btn-primary btn-full"
          onClick={() => navigate('/personal-info')}
        >
          Create New Account
        </button>
        <button
          className="btn btn-secondary btn-full"
          onClick={() => navigate('/flight-details')}
        >
          I Already Have an Account →
        </button>
      </div>
    </div>
  )
}

export default Welcome
