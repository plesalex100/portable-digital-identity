import { useFormData } from '../App'
import { useNavigate } from 'react-router-dom'

function FlightDetails() {
  const { formData, updateFormData } = useFormData()
  const navigate = useNavigate()

  const isValid =
    formData.flightNumber.trim() &&
    formData.bookingReference.trim().length === 6 &&
    formData.flightDate

  const handleContinue = (e) => {
    e.preventDefault()
    if (isValid) navigate('/verification')
  }

  const handleScanBoardingPass = () => {
    // Placeholder: In production, this would use the camera to scan a barcode
    alert('Boarding pass scanner will be available in the full release. Please enter your details manually.')
  }

  // Calculate min date (today) and max date (today + 365 days)
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Flight Details</h1>
        <p className="page-subtitle">Enter your current flight information.</p>
      </div>

      <div className="info-banner">
        <span className="info-icon">ℹ️</span>
        <p>
          Enter your flight details below. You can generate an AirPass up to <strong style={{ color: 'var(--text-accent)' }}>24 hours</strong> before departure.
        </p>
      </div>

      <form onSubmit={handleContinue}>
        {/* Scan button */}
        <button type="button" className="scan-btn" onClick={handleScanBoardingPass}>
          📷 Scan Boarding Pass
        </button>

        <div className="glass-card">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="flightNumber">Flight Number</label>
              <input
                id="flightNumber"
                className="form-input"
                type="text"
                placeholder="RO621"
                value={formData.flightNumber}
                onChange={(e) => updateFormData({ flightNumber: e.target.value.toUpperCase() })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="bookingReference">Booking Reference</label>
              <input
                id="bookingReference"
                className="form-input"
                type="text"
                placeholder="ABC123"
                maxLength={6}
                value={formData.bookingReference}
                onChange={(e) => updateFormData({ bookingReference: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
                required
              />
              <span className="text-sm text-muted">
                {formData.bookingReference.length}/6 characters
              </span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="flightDate">Date of Flight</label>
            <input
              id="flightDate"
              className="form-input"
              type="date"
              min={today}
              value={formData.flightDate}
              onChange={(e) => updateFormData({ flightDate: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="page-actions">
          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={!isValid}
          >
            Continue to Verification →
          </button>
        </div>
      </form>
    </div>
  )
}

export default FlightDetails
