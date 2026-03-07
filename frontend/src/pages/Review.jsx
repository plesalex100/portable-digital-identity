import { useFormData } from '../App'
import { useNavigate } from 'react-router-dom'

function Review() {
  const { formData, updateFormData } = useFormData()
  const navigate = useNavigate()

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const isValid = formData.gdprConsent

  const handleConfirm = (e) => {
    e.preventDefault()
    if (isValid) navigate('/airpass')
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Review & Confirm</h1>
        <p className="page-subtitle">Please review your details before generating your AirPass.</p>
      </div>

      <form onSubmit={handleConfirm}>
        {/* Personal Data */}
        <div className="glass-card">
          <div className="review-section">
            <div className="review-section-title">Personal Information</div>
            <div className="review-item">
              <span className="review-label">Full Name</span>
              <span className="review-value">{formData.firstName} {formData.lastName}</span>
            </div>
            <div className="review-item">
              <span className="review-label">Date of Birth</span>
              <span className="review-value">{formatDate(formData.dateOfBirth)}</span>
            </div>
            <div className="review-item">
              <span className="review-label">CNP</span>
              <span className="review-value">{formData.cnp}</span>
            </div>
            <div className="review-item">
              <span className="review-label">Nationality</span>
              <span className="review-value">{formData.nationality}</span>
            </div>
            <div className="review-item">
              <span className="review-label">
                {formData.documentType === 'passport' ? 'Passport' : 'ID Card'}
              </span>
              <span className="review-value">{formData.documentNumber}</span>
            </div>
          </div>

          <div className="divider" />

          {/* Flight Data */}
          <div className="review-section">
            <div className="review-section-title">Flight Details</div>
            <div className="review-item">
              <span className="review-label">Flight Number</span>
              <span className="review-value">{formData.flightNumber}</span>
            </div>
            <div className="review-item">
              <span className="review-label">Booking Reference</span>
              <span className="review-value">{formData.bookingReference}</span>
            </div>
            <div className="review-item">
              <span className="review-label">Flight Date</span>
              <span className="review-value">{formatDate(formData.flightDate)}</span>
            </div>
          </div>

          <div className="divider" />

          {/* Verification Status */}
          <div className="review-section">
            <div className="review-section-title">Verification</div>
            <div className="review-item">
              <span className="review-label">Phone</span>
              <span className="review-value">{formData.phoneNumber}</span>
            </div>
            <div className="review-item">
              <span className="review-label">Face Verification</span>
              <span className="review-value" style={{ color: formData.faceVerified ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                {formData.faceVerified ? '✓ Verified' : '✗ Not verified'}
              </span>
            </div>
          </div>
        </div>

        {/* GDPR Consent */}
        <div className="mt-lg">
          <label className="checkbox-wrapper" htmlFor="gdprConsent">
            <input
              type="checkbox"
              id="gdprConsent"
              className="checkbox-input"
              checked={formData.gdprConsent}
              onChange={(e) => updateFormData({ gdprConsent: e.target.checked })}
            />
            <span className="checkbox-label">
              I agree that my biometric data will be processed by Oradea Airport and automatically deleted 24 hours after the completion of my journey.
            </span>
          </label>
        </div>

        <div className="page-actions">
          <button
            type="submit"
            className="btn btn-success btn-full"
            disabled={!isValid}
          >
            Confirm & Generate AirPass ✓
          </button>
        </div>
      </form>
    </div>
  )
}

export default Review
