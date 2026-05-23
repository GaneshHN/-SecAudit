import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import BrandLogo from '../components/BrandLogo'

const GithubIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
)

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

/* ─── Floating particles for background ─── */
function Particles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${6 + Math.random() * 8}s`,
            width: `${2 + Math.random() * 3}px`,
            height: `${2 + Math.random() * 3}px`,
          }}
        />
      ))}
    </div>
  )
}

/*
 * TWO-STEP LOGIN FLOW:
 *   Step 1 — Enter email → we check if an account exists
 *     • Account found   → go to Step 2 (enter password)
 *     • No account      → redirect to /signup with email pre-filled
 *   Step 2 — Enter password → authenticate
 */
export default function Login() {
  const [step, setStep] = useState(1)            // 1 = email, 2 = password
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const passwordRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, login, accountExists, clearAuthError } = useAuth()

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/'
      navigate(from, { replace: true })
    }
  }, [user, navigate, location])

  // Clear errors on mount
  useEffect(() => {
    clearAuthError()
  }, [])

  // Auto-focus password field when entering step 2
  useEffect(() => {
    if (step === 2 && passwordRef.current) {
      passwordRef.current.focus()
    }
  }, [step])

  /* ─── Step 1: Check if email has an account ─── */
  const handleEmailContinue = (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.')
      return
    }

    setIsLoading(true)
    setTimeout(() => {
      const exists = accountExists(email)
      setIsLoading(false)

      if (exists) {
        // Account found — move to password step
        setStep(2)
      } else {
        // No account — redirect to sign up with email pre-filled
        navigate('/signup', { state: { prefillEmail: email, from: location.state?.from } })
      }
    }, 300)
  }

  /* ─── Step 2: Authenticate with password ─── */
  const handleLogin = (e) => {
    e.preventDefault()
    setError('')

    if (!password) {
      setError('Please enter your password.')
      return
    }

    setIsLoading(true)
    setTimeout(() => {
      const success = login(email, password, rememberMe)
      if (success) {
        const from = location.state?.from?.pathname || '/'
        navigate(from, { replace: true })
      } else {
        setError('Incorrect password. Please try again.')
      }
      setIsLoading(false)
    }, 400)
  }

  /* ─── Go back to email step ─── */
  const handleBack = () => {
    setStep(1)
    setPassword('')
    setError('')
  }

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-brand-500/10 rounded-full blur-[150px]" />
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-accent-400/5 rounded-full blur-[120px]" />
      </div>
      <Particles />

      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 mb-5 shadow-lg shadow-brand-500/10">
            <BrandLogo className="w-9 h-9" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">
            {step === 1 ? 'Welcome to SecAudit' : 'Enter your password'}
          </h2>
          <p className="text-surface-400 text-sm">
            {step === 1
              ? 'Enter your email to sign in or create an account.'
              : (
                <span className="flex items-center justify-center gap-2">
                  Signing in as <span className="text-white font-medium">{email}</span>
                </span>
              )
            }
          </p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-5 flex items-start gap-3 p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 animate-fade-in-up">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300 font-medium">{error}</p>
            </div>
          )}

          {/* Redirected notice */}
          {location.state?.from && !error && step === 1 && (
            <div className="mb-5 flex items-start gap-3 p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 animate-fade-in-up">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-300 font-medium">
                Please sign in to access that page.
              </p>
            </div>
          )}

          {/* ════════════ STEP 1: EMAIL ════════════ */}
          {step === 1 && (
            <>
              {/* OAuth Buttons */}
              <div className="space-y-3 mb-6">
                <button className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white text-gray-900 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 focus:ring-offset-navy-900">
                  <GoogleIcon />
                  Continue with Google
                </button>
                <button className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-surface-800 text-white rounded-lg text-sm font-semibold hover:bg-surface-700 transition-colors border border-surface-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 focus:ring-offset-navy-900">
                  <GithubIcon className="w-5 h-5" />
                  Continue with GitHub
                </button>
              </div>

              <div className="flex items-center mb-6">
                <div className="flex-grow border-t border-surface-700/60"></div>
                <span className="flex-shrink-0 mx-4 text-xs font-medium text-surface-500 uppercase tracking-wider">
                  Or continue with email
                </span>
                <div className="flex-grow border-t border-surface-700/60"></div>
              </div>

              {/* Email form */}
              <form onSubmit={handleEmailContinue} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-surface-500">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      id="login-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError('') }}
                      className="w-full pl-10 pr-4 py-2.5 bg-navy-900/50 border border-surface-700 rounded-lg text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-colors"
                      placeholder="you@company.com"
                      autoComplete="email"
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  id="email-continue"
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-brand-500/25"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Checking...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Hint */}
              <p className="mt-6 text-center text-xs text-surface-500">
                If you don't have an account yet, we'll redirect you to sign up.
              </p>

              {/* Direct signup link */}
              <p className="mt-4 text-center text-sm text-surface-400">
                New to SecAudit?{' '}
                <Link
                  to="/signup"
                  className="font-semibold text-brand-400 hover:text-brand-300 transition-colors"
                >
                  Create an account
                </Link>
              </p>
            </>
          )}

          {/* ════════════ STEP 2: PASSWORD ════════════ */}
          {step === 2 && (
            <>
              {/* User pill */}
              <div className="mb-6 flex items-center gap-3 p-3 rounded-lg bg-surface-800/50 border border-surface-700/50">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-accent-400 flex items-center justify-center text-xs font-bold text-white shadow-lg">
                  {email.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{email}</p>
                  <p className="text-xs text-surface-500">Account found</p>
                </div>
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-1 text-xs font-medium text-surface-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-surface-700/50"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Change
                </button>
              </div>

              {/* Password form */}
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-surface-300">
                      Password
                    </label>
                    <Link to="/forgot-password" className="text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-surface-500">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      ref={passwordRef}
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError('') }}
                      className="w-full pl-10 pr-11 py-2.5 bg-navy-900/50 border border-surface-700 rounded-lg text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-colors"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-surface-500 hover:text-surface-300 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center gap-2">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-surface-600 bg-navy-900/50 text-brand-500 focus:ring-brand-500/50 focus:ring-offset-0 cursor-pointer"
                  />
                  <label htmlFor="remember-me" className="text-sm text-surface-400 cursor-pointer select-none">
                    Remember me for 30 days
                  </label>
                </div>

                <button
                  id="login-submit"
                  type="submit"
                  disabled={isLoading || !password}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-brand-500/25"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Signing In...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-surface-500 mt-6">
          By signing in, you agree to our <a href="#" className="underline hover:text-surface-300">Terms of Service</a> and <a href="#" className="underline hover:text-surface-300">Privacy Policy</a>.
        </p>
      </div>
    </div>
  )
}
