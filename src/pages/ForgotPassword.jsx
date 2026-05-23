import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react'
import BrandLogo from '../components/BrandLogo'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsSubmitted(true)
  }

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-brand-500/10 rounded-full blur-[150px]" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 mb-5">
            <BrandLogo className="w-9 h-9" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">Reset Password</h2>
          <p className="text-surface-400 text-sm">We'll send you instructions to reset your password.</p>
        </div>

        <div className="glass-card p-8">
          {isSubmitted ? (
            <div className="text-center">
              <div className="mb-4 text-emerald-400">
                <Mail className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Check your email</h3>
              <p className="text-surface-400 text-sm mb-6">
                We've sent a password reset link to {email}
              </p>
              <Link to="/login" className="flex items-center justify-center gap-2 text-brand-400 hover:text-brand-300">
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-surface-500">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-navy-900/50 border border-surface-700 rounded-lg text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-colors"
                    placeholder="you@company.com"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white rounded-lg text-sm font-bold transition-all duration-200"
              >
                Send Reset Link
                <ArrowRight className="w-4 h-4" />
              </button>
              
              <div className="mt-4 text-center">
                <Link to="/login" className="text-sm font-medium text-surface-400 hover:text-white transition-colors">
                  Back to login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
