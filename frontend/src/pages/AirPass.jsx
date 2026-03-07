import { useEffect, useRef, useState, useCallback } from 'react'
import { useFormData } from '../App'

// Simple QR Code generator using canvas
// Generates a deterministic pattern based on the input data
function generateQRCode(canvas, data, size = 200) {
  const ctx = canvas.getContext('2d')
  canvas.width = size
  canvas.height = size

  const moduleCount = 25
  const moduleSize = size / moduleCount

  // Create a deterministic pattern from the data string
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }

  // Seed random with hash
  let seed = Math.abs(hash)
  const seededRandom = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }

  // Generate grid
  const grid = []
  for (let row = 0; row < moduleCount; row++) {
    grid[row] = []
    for (let col = 0; col < moduleCount; col++) {
      grid[row][col] = false
    }
  }

  // Finder patterns (top-left, top-right, bottom-left)
  const drawFinder = (startRow, startCol) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (r === 0 || r === 6 || c === 0 || c === 6 ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
          grid[startRow + r][startCol + c] = true
        }
      }
    }
  }

  drawFinder(0, 0)
  drawFinder(0, moduleCount - 7)
  drawFinder(moduleCount - 7, 0)

  // Fill data area with seeded pattern
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      // Skip finder patterns
      const inFinder1 = row < 8 && col < 8
      const inFinder2 = row < 8 && col >= moduleCount - 8
      const inFinder3 = row >= moduleCount - 8 && col < 8

      if (!inFinder1 && !inFinder2 && !inFinder3) {
        grid[row][col] = seededRandom() > 0.5
      }
    }
  }

  // Timing patterns
  for (let i = 8; i < moduleCount - 8; i++) {
    grid[6][i] = i % 2 === 0
    grid[i][6] = i % 2 === 0
  }

  // Draw
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, size, size)

  ctx.fillStyle = '#000000'
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (grid[row][col]) {
        ctx.fillRect(
          col * moduleSize,
          row * moduleSize,
          moduleSize,
          moduleSize
        )
      }
    }
  }
}

function AirPass() {
  const { formData } = useFormData()
  const canvasRef = useRef(null)
  const [timeLeft, setTimeLeft] = useState('')

  // Generate QR code on mount
  useEffect(() => {
    if (canvasRef.current) {
      const qrData = JSON.stringify({
        name: `${formData.firstName} ${formData.lastName}`,
        flight: formData.flightNumber,
        pnr: formData.bookingReference,
        date: formData.flightDate,
        doc: formData.documentNumber,
        verified: formData.faceVerified,
        ts: Date.now(),
      })
      generateQRCode(canvasRef.current, qrData, 200)
    }
  }, [formData])

  // 24h countdown timer
  const updateTimer = useCallback(() => {
    // Calculate time remaining until flight date + 24h
    const flightDate = new Date(formData.flightDate + 'T00:00:00')
    const expiresAt = new Date(flightDate.getTime() + 24 * 60 * 60 * 1000)
    const now = new Date()
    const diff = expiresAt - now

    if (diff <= 0) {
      setTimeLeft('Expired')
      return
    }

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
  }, [formData.flightDate])

  useEffect(() => {
    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [updateTimer])

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="page-container">
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
        <div className="success-icon">✓</div>
        <h1 className="page-title" style={{ textAlign: 'center' }}>
          Your AirPass is Ready!
        </h1>
        <p className="page-subtitle" style={{ textAlign: 'center' }}>
          Present this QR code at security checkpoints and boarding gates.
        </p>
      </div>

      {/* AirPass Card */}
      <div className="airpass-card">
        <div className="airpass-badge">
          🟢 Active AirPass
        </div>

        {/* QR Code */}
        <div className="airpass-qr">
          <canvas ref={canvasRef} />
        </div>

        {/* Passenger Info */}
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <div style={{ fontSize: 'var(--font-lg)', fontWeight: '700', color: 'var(--text-primary)' }}>
            {formData.firstName} {formData.lastName}
          </div>
          <div className="text-sm text-muted" style={{ marginTop: '4px' }}>
            {formData.documentType === 'passport' ? 'Passport' : 'ID Card'}: {formData.documentNumber}
          </div>
        </div>

        <div className="divider" />

        {/* Flight Info */}
        <div className="flight-info-row">
          <div className="flight-airport">
            <div className="code">OMR</div>
            <div className="name">Oradea</div>
          </div>
          <div className="flight-route-line">
            <div className="line" />
            <span className="plane-icon">✈</span>
            <div className="line" />
          </div>
          <div className="flight-airport">
            <div className="code">DST</div>
            <div className="name">Destination</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
          <div>
            <div className="text-sm text-muted">Flight</div>
            <div style={{ fontWeight: '600' }}>{formData.flightNumber}</div>
          </div>
          <div>
            <div className="text-sm text-muted">PNR</div>
            <div style={{ fontWeight: '600' }}>{formData.bookingReference}</div>
          </div>
          <div>
            <div className="text-sm text-muted">Date</div>
            <div style={{ fontWeight: '600', fontSize: 'var(--font-sm)' }}>{formatDate(formData.flightDate)}</div>
          </div>
          <div>
            <div className="text-sm text-muted">Biometric</div>
            <div style={{ fontWeight: '600', color: 'var(--accent-green)' }}>✓ Verified</div>
          </div>
        </div>

        {/* Timer */}
        <div className="airpass-timer">
          Valid for <span>{timeLeft}</span>
        </div>
      </div>

      {/* Bottom note */}
      <div className="mt-lg text-center">
        <p className="text-sm text-muted">
          🔒 Your biometric data will be automatically deleted 24 hours after your flight.
        </p>
      </div>
    </div>
  )
}

export default AirPass
