import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff, User, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import BrandLogo from '../components/BrandLogo'

/* ─── Password strength calculator ─── */
function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: '' }
  let score = 0
  if (password.length >= 6) score++
  if (password.length >= 10) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500' }
  if (score <= 2) return { score: 2, label: 'Fair', color: 'bg-orange-500' }
  if (score <= 3) return { score: 3, label: 'Good', color: 'bg-yellow-500' }
  if (score <= 4) return { score: 4, label: 'Strong', color: 'bg-emerald-500' }
  return { score: 5, label: 'Very Strong', color: 'bg-emerald-400' }
}

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

export default function SignUp() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, register, authError, clearAuthError } = useAuth()

  // Pre-fill email if redirected from login (account not found)
  const prefillEmail = location.state?.prefillEmail || ''
  const wasRedirected = !!location.state?.prefillEmail

  const [name, setName] = useState('')
  const [email, setEmail] = useState(prefillEmail)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

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

  const passwordStrength = getPasswordStrength(password)
  const passwordTooShort = password.length > 0 && password.length < 6
  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword

  const isFormValid = name && email && password.length >= 6 && password === confirmPassword && agreeToTerms

  const handleSubmit = (e) => {
    e.preventDefault()
    clearAuthError()

    if (password.length < 6) return
    if (password !== confirmPassword) return
    if (!agreeToTerms) return

    setIsLoading(true)

    setTimeout(() => {
      const success = register(name, email, password)
      if (success) {
        const from = location.state?.from?.pathname || '/'
        navigate(from, { replace: true })
      }
      setIsLoading(false)
    }, 400)
  }

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden py-8">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-accent-400/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-brand-500/5 rounded-full blur-[120px]" />
      </div>
      <Particles />

      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent-400/10 border border-accent-400/20 mb-5 shadow-lg shadow-accent-400/10">
            <BrandLogo className="w-9 h-9" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">
            Create your account
          </h2>
          <p className="text-surface-400 text-sm">
            Join SecAudit to secure your infrastructure.
          </p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          {/* Redirect notice from login page */}
          {wasRedirected && !authError && (
            <div className="mb-5 flex items-start gap-3 p-3.5 rounded-lg bg-blue-500/10 border border-blue-500/30 animate-fade-in-up">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-300 font-medium">No account found for <span className="text-white font-semibold">{prefillEmail}</span></p>
                <p className="text-xs text-blue-400/70 mt-1">Create an account below to get started.</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {authError && (
            <div className="mb-5 flex items-start gap-3 p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 animate-fade-in-up">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-300 font-medium">{authError}</p>
                {authError.includes('already exists') && (
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1 mt-2 text-sm font-semibold text-brand-400 hover:text-brand-300 transition-colors"
                  >
                    Sign in instead <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-surface-500">
                  <User className="w-5 h-5" />
                </div>
                <input
                  id="signup-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-navy-900/50 border border-surface-700 rounded-lg text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-colors"
                  placeholder="John Doe"
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-surface-500">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="signup-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-navy-900/50 border border-surface-700 rounded-lg text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-colors"
                  placeholder="you@company.com"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-surface-500">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-10 pr-11 py-2.5 bg-navy-900/50 border rounded-lg text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-colors ${
                    passwordTooShort ? 'border-amber-500/60' : 'border-surface-700'
                  }`}
                  placeholder="Min 6 characters"
                  autoComplete="new-password"
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

              {/* Password Strength Meter */}
              {password.length > 0 && (
                <div className="mt-2 animate-fade-in-up">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          level <= passwordStrength.score
                            ? passwordStrength.color
                            : 'bg-surface-700'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={`text-xs ${
                      passwordTooShort ? 'text-amber-400' : 'text-surface-500'
                    }`}>
                      {passwordTooShort ? (
                        <span className="flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Must be at least 6 characters
                        </span>
                      ) : (
                        `Strength: ${passwordStrength.label}`
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-surface-500">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="signup-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full pl-10 pr-11 py-2.5 bg-navy-900/50 border rounded-lg text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-colors ${
                    passwordMismatch ? 'border-red-500/60' : passwordsMatch ? 'border-emerald-500/60' : 'border-surface-700'
                  }`}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-surface-500 hover:text-surface-300 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
              {passwordMismatch && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1 animate-fade-in-up">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Passwords do not match
                </p>
              )}
              {passwordsMatch && (
                <p className="mt-1.5 text-xs text-emerald-400 flex items-center gap-1 animate-fade-in-up">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Passwords match
                </p>
              )}
            </div>

            {/* Terms agreement */}
            <div className="flex items-start gap-2">
              <input
                id="agree-terms"
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="w-4 h-4 rounded border-surface-600 bg-navy-900/50 text-brand-500 focus:ring-brand-500/50 focus:ring-offset-0 cursor-pointer mt-0.5"
              />
              <label htmlFor="agree-terms" className="text-sm text-surface-400 cursor-pointer select-none leading-snug">
                I agree to the{' '}
                <a href="#" className="underline text-brand-400 hover:text-brand-300">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="underline text-brand-400 hover:text-brand-300">Privacy Policy</a>
              </label>
            </div>

            <button
              id="signup-submit"
              type="submit"
              disabled={isLoading || !isFormValid}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-accent-500 to-brand-500 hover:from-accent-400 hover:to-brand-400 text-white rounded-lg text-sm font-bold shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 mt-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-brand-500/25"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle to Login */}
          <p className="mt-8 text-center text-sm text-surface-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-brand-400 hover:text-brand-300 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
