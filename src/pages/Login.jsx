import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../services/auth'
import './Login.css'

function Login({ onLogin }) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please fill in all fields.')
      return
    }

    setLoading(true)
    try {
      const result = await login(email, password)
      onLogin(result)
      navigate('/')
    } catch (err) {
      setError(err.message ?? 'Login failed. Check your credentials and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-shell">

      {/* left side - branding */}
      <div className="login-left">
        <div className="login-logo">
          <img src="/greenLogo.png" alt="Slyce" className="login-logo-img" />
          <span className="login-logo-name">Slyce</span>
        </div>

        <div style={{ marginTop: 'auto', marginBottom: '36px' }}>
          <h2 className="login-hero-text">
            Manage your platform with <span style={{ color: '#3DBF52' }}>confidence.</span>
          </h2>
          <p className="login-hero-sub">
            Restaurants, meals, approvals — all in one place.
          </p>
        </div>

        <div className="login-testimonial">
          <p className="login-quote">
            "Slyce helped us grow our delivery revenue by 40% in just three months."
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '14px' }}>
            <div className="login-author-avatar">A</div>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Admin</p>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>Slyce Administrator</p>
            </div>
          </div>
        </div>
      </div>

      {/* right side - login form */}
      <div className="login-right">
        <form className="login-form" onSubmit={handleSubmit}>

          <h1 className="login-title">Welcome back</h1>
          <p className="login-subtitle">Sign in to the admin dashboard</p>

          {error && (
            <div className="login-error">{error}</div>
          )}

          <div className="login-field">
            <label>Email address</label>
            <input
              type="email"
              placeholder="admin@slyce.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="login-input"
              autoComplete="email"
            />
          </div>

          <div className="login-field">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="login-input"
                style={{ paddingRight: '44px' }}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: 'absolute', right: '12px', top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', cursor: 'pointer', fontSize: '14px', color: '#9A9A9A'
                }}
              >
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'right', marginBottom: '22px', marginTop: '-4px' }}>
            <button type="button" className="login-forgot">Forgot password?</button>
          </div>

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="login-divider">
            <span /><p>or</p><span />
          </div>

          <button type="button" className="login-google" onClick={handleSubmit}>
            <img
              src="https://www.google.com/favicon.ico"
              width="16" height="16" alt="google"
              style={{ borderRadius: '2px' }}
            />
            Continue with Google
          </button>

        </form>
      </div>
    </div>
  )
}

export default Login
