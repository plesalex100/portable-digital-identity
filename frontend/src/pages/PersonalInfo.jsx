import { useFormData } from '../App'
import { useNavigate } from 'react-router-dom'

function PersonalInfo() {
  const { formData, updateFormData } = useFormData()
  const navigate = useNavigate()

  const isValid =
    formData.firstName.trim() &&
    formData.lastName.trim() &&
    formData.dateOfBirth &&
    formData.cnp.trim() &&
    formData.nationality.trim() &&
    formData.documentNumber.trim()

  const handleContinue = (e) => {
    e.preventDefault()
    if (isValid) navigate('/security')
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Personal Information</h1>
        <p className="page-subtitle">Enter your identification details to get started.</p>
      </div>

      <form onSubmit={handleContinue}>
        <div className="glass-card">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                className="form-input"
                type="text"
                placeholder="John"
                value={formData.firstName}
                onChange={(e) => updateFormData({ firstName: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                className="form-input"
                type="text"
                placeholder="Doe"
                value={formData.lastName}
                onChange={(e) => updateFormData({ lastName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="dateOfBirth">Date of Birth</label>
              <input
                id="dateOfBirth"
                className="form-input"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => updateFormData({ dateOfBirth: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="cnp">CNP</label>
              <input
                id="cnp"
                className="form-input"
                type="text"
                placeholder="1234567890123"
                maxLength={13}
                value={formData.cnp}
                onChange={(e) => updateFormData({ cnp: e.target.value.replace(/\D/g, '') })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="nationality">Nationality</label>
            <input
              id="nationality"
              className="form-input"
              type="text"
              placeholder="Romania"
              value={formData.nationality}
              onChange={(e) => updateFormData({ nationality: e.target.value })}
              required
            />
          </div>

          <div className="divider" />

          <div className="form-group">
            <label className="form-label" htmlFor="documentType">Document Type</label>
            <select
              id="documentType"
              className="form-select"
              value={formData.documentType}
              onChange={(e) => updateFormData({ documentType: e.target.value })}
            >
              <option value="id_card">Identity Card (Carte de Identitate)</option>
              <option value="passport">Passport (Pașaport)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="documentNumber">
              {formData.documentType === 'passport' ? 'Passport Number' : 'Document Number'}
            </label>
            <input
              id="documentNumber"
              className="form-input"
              type="text"
              placeholder={formData.documentType === 'passport' ? 'AB1234567' : 'RR123456'}
              value={formData.documentNumber}
              onChange={(e) => updateFormData({ documentNumber: e.target.value.toUpperCase() })}
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
            Continue to Security →
          </button>
        </div>
      </form>
    </div>
  )
}

export default PersonalInfo
