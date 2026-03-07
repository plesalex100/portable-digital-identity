import { useState } from 'react'
import { useFormData } from '../App'
import { useNavigate } from 'react-router-dom'

function AccountSecurity() {
  const { formData, updateFormData } = useFormData()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)

  const passwordStrength = (() => {
    const p = formData.password
    if (!p) return 0
    let score = 0
    if (p.length >= 8) score++
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++
    if (/\d/.test(p)) score++
    if (/[^A-Za-z0-9]/.test(p)) score++
    return score
  })()

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][passwordStrength] || ''
  const strengthClass = passwordStrength <= 1 ? 'weak' : passwordStrength <= 2 ? 'medium' : 'strong'

  const passwordsMatch = formData.password && formData.password === formData.confirmPassword
  const isValid =
    formData.email.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) &&
    formData.password.length >= 8 &&
    passwordsMatch

  const handleCreateAccount = (e) => {
    e.preventDefault()
    if (isValid) navigate('/flight-details')
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Account Security</h1>
        <p className="page-subtitle">Set up your login credentials. You'll use these to access your account for future flights.</p>
      </div>

      <form onSubmit={handleCreateAccount}>
        <div className="glass-card">
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              className="form-input"
              type="email"
              placeholder="john.doe@email.com"
              value={formData.email}
              onChange={(e) => updateFormData({ email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                className="form-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                value={formData.password}
                onChange={(e) => updateFormData({ password: e.target.value })}
                required
                minLength={8}
                style={{ paddingRight: '48px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: 'var(--font-sm)',
                  padding: '4px',
                }}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
            {formData.password && (
              <>
                <div className="password-strength">
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className={`strength-bar ${i <= passwordStrength ? `active ${strengthClass}` : ''}`}
                    />
                  ))}
                </div>
                <span className="text-sm" style={{ color: strengthClass === 'weak' ? 'var(--accent-red)' : strengthClass === 'medium' ? 'var(--accent-amber)' : 'var(--accent-green)' }}>
                  {strengthLabel}
                </span>
              </>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              className="form-input"
              type={showPassword ? 'text' : 'password'}
              placeholder="Repeat your password"
              value={formData.confirmPassword}
              onChange={(e) => updateFormData({ confirmPassword: e.target.value })}
              required
            />
            {formData.confirmPassword && !passwordsMatch && (
              <span className="text-sm" style={{ color: 'var(--accent-red)' }}>
                Passwords do not match
              </span>
            )}
            {passwordsMatch && (
              <span className="text-sm" style={{ color: 'var(--accent-green)' }}>
                ✓ Passwords match
              </span>
            )}
          </div>
        </div>

        <div className="page-actions">
          <button
            type="submit"
            className="btn btn-success btn-full"
            disabled={!isValid}
          >
            Create Account ✓
          </button>
        </div>
      </form>
    </div>
  )
}

export default AccountSecurity
