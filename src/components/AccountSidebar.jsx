import { 
  X, User, Settings, LogOut, Shield, Bell, CreditCard,
  Building, ChevronDown, Moon, Sun, Activity, CheckCircle2,
  Plus, HelpCircle, BookOpen, MessageSquare, Webhook,
  Zap, Sparkles, ExternalLink, Command, ChevronRight,
  Clock, Fingerprint, Globe
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import BrandLogo from './BrandLogo'
import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Stagger container for child animations
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.15 }
  }
}

const staggerItem = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

export default function AccountSidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth()
  const { isDarkMode, toggleTheme } = useTheme()
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false)
  const [hoveredNav, setHoveredNav] = useState(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const location = useLocation()
  const sidebarRef = useRef(null)
  
  const platform = typeof navigator !== 'undefined' ? 
    (navigator.platform.toLowerCase().includes('mac') ? 'Mac OS' : 
     navigator.platform.toLowerCase().includes('win') ? 'Windows' : 'Linux') 
    : 'Unknown'

  // Live clock
  useEffect(() => {
    if (!isOpen) return
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [isOpen])

  // Escape key and body lock
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handleEsc)
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = 'unset'
    return () => {
      window.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Dynamic quota
  const quotaUsed = 85
  const quotaTotal = 100
  const quotaPercent = (quotaUsed / quotaTotal) * 100
  const isQuotaWarning = quotaPercent >= 80

  const navItems = [
    { name: 'Dashboard', icon: Activity, path: '/dashboard', desc: 'Overview & metrics' },
    { name: 'Scan History', icon: Bell, path: '/history', desc: 'Past audit results' },
    { name: 'Integrations', icon: Webhook, path: '/integrations', badge: 'New', desc: 'CI/CD pipelines' },
    { name: 'Settings', icon: User, path: '/settings', desc: 'Profile & account' },
    { name: 'Billing', icon: CreditCard, path: '/billing', desc: 'Plans & invoices' },
    { name: 'Security', icon: Shield, path: '/security', desc: 'Auth & access' },
  ]

  const supportItems = [
    { name: 'Documentation', icon: BookOpen, path: '/docs' },
    { name: 'Changelog', icon: Sparkles, badge: 'v2.4', path: '/changelog' },
    { name: 'Contact Support', icon: MessageSquare, path: '/support' },
  ]

  if (!user) return null

  const timeString = currentTime.toLocaleTimeString('en-US', { 
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false 
  })

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60]"
            onClick={onClose}
            style={{
              background: 'radial-gradient(ellipse at 0% 50%, rgba(99,102,241,0.08) 0%, rgba(3,7,18,0.85) 60%)',
              backdropFilter: 'blur(8px)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Panel */}
      <motion.div 
        ref={sidebarRef}
        initial={{ x: '-100%' }}
        animate={{ x: isOpen ? 0 : '-100%' }}
        transition={{ type: "spring", stiffness: 350, damping: 32 }}
        className="fixed top-0 left-0 h-full w-full sm:w-[400px] z-[70] overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #030712 0%, #0f172a 50%, #030712 100%)',
          borderRight: '1px solid rgba(99,102,241,0.12)',
          boxShadow: '20px 0 80px rgba(0,0,0,0.8), 4px 0 20px rgba(0,0,0,0.5)',
        }}
      >
        {/* Animated mesh gradient background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-64 h-64 rounded-full opacity-[0.04]"
            style={{ background: 'radial-gradient(circle, #6366f1, transparent 70%)', animation: 'float 8s ease-in-out infinite' }} />
          <div className="absolute top-1/2 -right-20 w-48 h-48 rounded-full opacity-[0.03]"
            style={{ background: 'radial-gradient(circle, #22d3ee, transparent 70%)', animation: 'float 10s ease-in-out infinite reverse' }} />
          <div className="absolute -bottom-20 left-1/4 w-56 h-56 rounded-full opacity-[0.03]"
            style={{ background: 'radial-gradient(circle, #a78bfa, transparent 70%)', animation: 'float 12s ease-in-out infinite 2s' }} />
          {/* Subtle grid overlay */}
          <div className="absolute inset-0 opacity-[0.02]" 
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        </div>

        <div className="flex flex-col h-full relative z-10">
          
          {/* ─── Header ─── */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={isOpen ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <BrandLogo className="w-7 h-7" />
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-navy-950" />
              </div>
              <div>
                <span className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-surface-300 to-brand-400">SecAudit</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-surface-500 font-medium tracking-wide">ENTERPRISE</span>
                  <span className="text-[10px] text-surface-600">•</span>
                  <span className="text-[10px] text-emerald-500 font-mono font-medium">{timeString}</span>
                </div>
              </div>
            </div>
            <motion.button 
              whileHover={{ scale: 1.05, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              onClick={onClose}
              className="p-2 text-surface-500 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </motion.div>

          {/* ─── Holographic Profile Card ─── */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isOpen ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 25 }}
            className="mx-4 mt-4 rounded-2xl p-[1px] overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(34,211,238,0.15), rgba(167,139,250,0.2))' }}
          >
            <div className="rounded-2xl p-4 relative overflow-hidden" 
              style={{ background: 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,41,59,0.9))' }}>
              {/* Holographic shimmer */}
              <div className="absolute inset-0 opacity-[0.06]"
                style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.4) 45%, transparent 50%)', backgroundSize: '200% 100%', animation: 'shimmer 3s ease-in-out infinite' }} />
              
              <div className="flex items-center gap-4 relative z-10">
                <div className="relative group">
                  <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 via-accent-500 to-brand-400 shadow-lg shadow-brand-500/20 transition-shadow group-hover:shadow-brand-500/40">
                    <span className="text-lg font-bold text-white">{user.avatar}</span>
                  </div>
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-[2.5px] border-navy-950 flex items-center justify-center"
                  >
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  </motion.div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[15px] font-bold text-white leading-tight truncate">{user.name}</h3>
                  <p className="text-xs text-surface-500 mt-0.5 truncate">{user.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-brand-500/15 to-accent-500/10 text-brand-400 border border-brand-500/20">
                      <Shield className="w-2.5 h-2.5" />
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick stats row */}
              <div className="flex items-center gap-3 mt-4 pt-3 relative z-10" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {[
                  { label: 'Scans', value: '247', icon: Activity },
                  { label: 'Uptime', value: '99.9%', icon: Globe },
                  { label: 'Session', value: platform, icon: Fingerprint },
                ].map((stat) => (
                  <div key={stat.label} className="flex-1 text-center">
                    <div className="text-xs font-bold text-white">{stat.value}</div>
                    <div className="text-[10px] text-surface-500 mt-0.5 flex items-center justify-center gap-1">
                      <stat.icon className="w-2.5 h-2.5" />
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ─── Scrollable Content ─── */}
          <div className="flex-1 overflow-y-auto mt-3 custom-scrollbar" style={{ scrollbarGutter: 'stable' }}>
            
            {/* Organization Switcher */}
            <div className="px-4 mb-2">
              <motion.button 
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-white/[0.06] hover:border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-200 group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand-500/10 text-brand-400 group-hover:bg-brand-500/15 transition-colors">
                    <Building className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left">
                    <div className="text-[13px] font-semibold text-white leading-tight">Personal Workspace</div>
                    <div className="text-[10px] text-surface-500">Pro Plan</div>
                  </div>
                </div>
                <motion.div animate={{ rotate: isOrgDropdownOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="w-3.5 h-3.5 text-surface-500" />
                </motion.div>
              </motion.button>
              
              <AnimatePresence>
                {isOrgDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-1 rounded-xl border border-white/[0.06] overflow-hidden" style={{ background: 'rgba(15,23,42,0.8)' }}>
                      <button className="w-full text-left px-3 py-2.5 text-[13px] text-white hover:bg-white/5 transition-colors flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <span>Personal Workspace</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      </button>
                      <button className="w-full text-left px-3 py-2.5 text-[13px] text-surface-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2">
                        <Plus className="w-3.5 h-3.5" />
                        Create Workspace
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Command Palette CTA */}
            <div className="px-4 mb-4">
              <Link to="/" onClick={onClose}>
                <motion.div
                  whileHover={{ scale: 1.01, y: -1 }}
                  whileTap={{ scale: 0.99 }}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-300 group cursor-pointer"
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(34,211,238,0.05))',
                    border: '1px solid rgba(99,102,241,0.15)',
                  }}
                >
                  <div className="flex items-center gap-2 text-brand-400 group-hover:text-white transition-colors">
                    <Command className="w-4 h-4" />
                    Command Palette
                  </div>
                  <div className="flex items-center gap-1 opacity-50 group-hover:opacity-80 transition-opacity">
                    <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/30 border border-white/10 text-surface-400">{platform === 'Mac OS' ? '⌘' : 'Ctrl'}</kbd>
                    <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/30 border border-white/10 text-surface-400">K</kbd>
                  </div>
                </motion.div>
              </Link>
            </div>

            {/* ─── Navigation ─── */}
            <div className="px-4 mb-2">
              <div className="px-2 mb-2 text-[10px] uppercase tracking-[0.15em] text-surface-600 font-semibold flex items-center gap-2">
                <div className="h-px flex-1 bg-gradient-to-r from-white/5 to-transparent" />
                Platform
                <div className="h-px flex-1 bg-gradient-to-l from-white/5 to-transparent" />
              </div>
              <motion.nav 
                variants={staggerContainer}
                initial="hidden"
                animate={isOpen ? "show" : "hidden"}
                className="space-y-0.5"
              >
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path
                  const isHovered = hoveredNav === item.name
                  return (
                    <motion.div key={item.name} variants={staggerItem}>
                      <Link
                        to={item.path}
                        onClick={onClose}
                        onMouseEnter={() => setHoveredNav(item.name)}
                        onMouseLeave={() => setHoveredNav(null)}
                        className="relative flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group"
                        style={{
                          background: isActive ? 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(34,211,238,0.06))' : 'transparent',
                          border: isActive ? '1px solid rgba(99,102,241,0.15)' : '1px solid transparent',
                        }}
                      >
                        {/* Active glow bar */}
                        {isActive && (
                          <motion.div
                            layoutId="navGlow"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full"
                            style={{ background: 'linear-gradient(180deg, #6366f1, #22d3ee)', boxShadow: '0 0 8px rgba(99,102,241,0.5)' }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          />
                        )}
                        
                        <div className="flex items-center gap-3 relative z-10">
                          <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${
                            isActive 
                              ? 'bg-brand-500/15 text-brand-400 shadow-sm shadow-brand-500/10' 
                              : 'bg-white/[0.03] text-surface-500 group-hover:bg-white/[0.06] group-hover:text-surface-300'
                          }`}>
                            <item.icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className={`leading-tight transition-colors ${isActive ? 'text-white' : 'text-surface-400 group-hover:text-white'}`}>
                              {item.name}
                            </div>
                            {(isHovered || isActive) && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="text-[10px] text-surface-500 mt-0.5"
                              >
                                {item.desc}
                              </motion.div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {item.badge && (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-gradient-to-r from-brand-500/20 to-accent-500/15 text-brand-300 border border-brand-500/20">
                              {item.badge}
                            </span>
                          )}
                          <ChevronRight className={`w-3.5 h-3.5 transition-all duration-200 ${
                            isActive ? 'text-brand-400 opacity-100' : 'text-surface-600 opacity-0 group-hover:opacity-60 translate-x-0 group-hover:translate-x-0.5'
                          }`} />
                        </div>
                      </Link>
                    </motion.div>
                  )
                })}
              </motion.nav>
            </div>

            {/* ─── API Telemetry ─── */}
            <div className="px-4 mb-4">
              <div className="rounded-xl p-3.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[10px] uppercase tracking-[0.12em] text-surface-500 font-semibold flex items-center gap-1.5">
                    <Zap className={`w-3 h-3 ${isQuotaWarning ? 'text-orange-400' : 'text-brand-400'}`} />
                    API Telemetry
                  </span>
                  <span className={`text-xs font-bold font-mono ${isQuotaWarning ? 'text-orange-400' : 'text-white'}`}>
                    {quotaUsed}/{quotaTotal}
                  </span>
                </div>
                <div className="relative h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${quotaPercent}%` }}
                    transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="relative h-full rounded-full"
                    style={{ 
                      background: isQuotaWarning 
                        ? 'linear-gradient(90deg, #f97316, #ef4444)' 
                        : 'linear-gradient(90deg, #6366f1, #22d3ee)',
                      boxShadow: isQuotaWarning 
                        ? '0 0 12px rgba(239,68,68,0.4)' 
                        : '0 0 12px rgba(99,102,241,0.4)',
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent rounded-full" />
                  </motion.div>
                </div>
                <p className={`text-[10px] mt-2 flex items-center gap-1 ${isQuotaWarning ? 'text-orange-400/70' : 'text-surface-600'}`}>
                  {isQuotaWarning ? '⚠ Approaching rate limits' : '✓ Systems nominal'}
                </p>
              </div>
            </div>

            {/* ─── Support ─── */}
            <div className="px-4 mb-4">
              <div className="px-2 mb-2 text-[10px] uppercase tracking-[0.15em] text-surface-600 font-semibold flex items-center gap-2">
                <div className="h-px flex-1 bg-gradient-to-r from-white/5 to-transparent" />
                Support
                <div className="h-px flex-1 bg-gradient-to-l from-white/5 to-transparent" />
              </div>
              <nav className="space-y-0.5">
                {supportItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={onClose}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium text-surface-500 hover:text-surface-300 hover:bg-white/[0.03] transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4 text-surface-600 group-hover:text-surface-400 transition-colors" />
                      {item.name}
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-accent-500/10 text-accent-400 border border-accent-500/15">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          {/* ─── Footer ─── */}
          <div className="px-4 py-4 flex items-center gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92, rotate: 15 }}
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-white/[0.06] hover:border-white/10 hover:bg-white/[0.04] text-surface-500 hover:text-white transition-all"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { logout(); onClose() }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-surface-400 hover:text-red-400 border border-white/[0.06] hover:border-red-500/20 hover:bg-red-500/[0.06] transition-all duration-300 group"
            >
              <LogOut className="w-4 h-4 group-hover:text-red-400 transition-colors" />
              Sign Out
            </motion.button>
          </div>

        </div>
      </motion.div>

      {/* Shimmer keyframe injection */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </>
  )
}
