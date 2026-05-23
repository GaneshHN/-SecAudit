import { useState, useEffect, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Shield,
  Home,
  LayoutDashboard,
  ScanSearch,
  Menu,
  X,
  User,
  History
} from 'lucide-react'
import { useScrolled } from '../hooks/useScrolled'
import { useAuth } from '../context/AuthContext'
import AccountSidebar from './AccountSidebar'
import BrandLogo from './BrandLogo'

function GithubIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  )
}


const NAV_LINKS = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'History', href: '/history', icon: History },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuAnimating, setMenuAnimating] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const scrolled = useScrolled(10)
  const location = useLocation()
  const activePath = location.pathname
  const isAuthPage = activePath === '/login' || activePath === '/signup'
  const { user } = useAuth()
  const navigate = useNavigate()

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileOpen(false)
        setMenuAnimating(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Close mobile menu on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileOpen) {
        closeMobileMenu()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mobileOpen])

  const closeMobileMenu = useCallback(() => {
    setMenuAnimating(true)
    setTimeout(() => {
      setMobileOpen(false)
      setMenuAnimating(false)
    }, 200)
  }, [])

  const handleNavClick = useCallback(() => {
    if (mobileOpen) closeMobileMenu()
  }, [mobileOpen, closeMobileMenu])

  const toggleMobile = useCallback(() => {
    if (mobileOpen) {
      closeMobileMenu()
    } else {
      setMobileOpen(true)
    }
  }, [mobileOpen, closeMobileMenu])

  return (
    <>
    <nav
      className={`
        fixed top-0 left-0 right-0 z-50
        animate-navbar-enter
        transition-all duration-300 ease-in-out
        ${scrolled
          ? 'bg-navy-900/90 shadow-lg shadow-black/20 backdrop-blur-xl border-b border-brand-500/10'
          : 'bg-navy-900/60 backdrop-blur-md border-b border-transparent'
        }
      `}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ─── LEFT: Logo + Brand ─── */}
          <div className="flex items-center gap-3 shrink-0">
            {user && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full border border-surface-700/50 hover:border-brand-500/50 hover:bg-surface-800/50 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/50 mr-2 group"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-accent-400 flex items-center justify-center text-sm font-bold text-white shadow-lg group-hover:scale-105 transition-transform">
                  {user.avatar}
                </div>
              </button>
            )}
            
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-brand-500 to-accent-400 rounded-full opacity-20 group-hover:opacity-40 blur-lg transition-all duration-500" />
              <div className="relative flex items-center justify-center w-10 h-10 transition-transform duration-500 group-hover:scale-110">
                <BrandLogo className="w-full h-full" />
              </div>
            </div>
            
            <div className="flex flex-col justify-center">
              <span className="text-xl font-black tracking-tighter text-white leading-none">
                Sec<span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-accent-400">Audit</span>
              </span>
            </div>
            {/* Status Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                Secure
              </span>
            </div>
          </div>

          {/* ─── CENTER: Desktop Nav Links ─── */}
          {!isAuthPage && (
            <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = activePath === link.href
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={handleNavClick}
                  className={`
                    nav-link-underline relative px-4 py-2 text-sm font-medium
                    transition-all duration-200 ease-in-out
                    ${isActive
                      ? 'text-white active'
                      : 'text-surface-400 hover:text-white'
                    }
                  `}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {link.name}
                </Link>
              )
            })}
          </div>
          )}

          {/* ─── RIGHT: Actions ─── */}
          {!isAuthPage && (
            <div className="flex items-center gap-4">
            
            {!user && (
              <Link
                to="/login"
                className="hidden sm:block text-sm font-medium text-surface-400 hover:text-white transition-colors duration-200 mr-1"
              >
                Sign In
              </Link>
            )}

            {/* GitHub Icon */}
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="
                hidden sm:flex items-center justify-center w-9 h-9
                rounded-lg text-surface-400
                hover:text-white hover:bg-white/5
                hover:scale-110
                transition-all duration-200 ease-in-out
              "
              aria-label="View on GitHub"
              id="github-link"
            >
              <GithubIcon className="w-[18px] h-[18px]" />
            </a>

            {/* Scan Repo CTA */}
            <button
              onClick={() => navigate('/')}
              className="
                hidden sm:inline-flex items-center gap-2 px-5 py-2
                bg-gradient-to-r from-brand-500 to-brand-600
                hover:from-brand-400 hover:to-brand-500
                text-white text-sm font-semibold
                rounded-lg shadow-lg shadow-brand-500/25
                hover:shadow-brand-500/40 hover:scale-[1.03]
                active:scale-[0.98]
                transition-all duration-200 ease-in-out
                cta-glow
              "
              aria-label="Scan repository"
              id="scan-repo-btn"
            >
              <ScanSearch className="w-4 h-4" />
              Scan Repo
            </button>

            {/* Mobile Hamburger */}
            <button
              onClick={toggleMobile}
              className="
                md:hidden flex items-center justify-center w-9 h-9
                rounded-lg text-surface-400
                hover:text-white hover:bg-white/5
                transition-all duration-200 ease-in-out
              "
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              id="mobile-menu-toggle"
            >
              <div className="relative w-5 h-5">
                <Menu
                  className={`
                    absolute inset-0 w-5 h-5 transition-all duration-300
                    ${mobileOpen ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}
                  `}
                />
                <X
                  className={`
                    absolute inset-0 w-5 h-5 transition-all duration-300
                    ${mobileOpen ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}
                  `}
                />
              </div>
            </button>
          </div>
          )}
        </div>
      </div>

      {/* ─── Mobile Menu Panel ─── */}
      {!isAuthPage && (mobileOpen || menuAnimating) && (
        <div
          className={`
            md:hidden overflow-hidden
            border-t border-brand-500/10
            bg-navy-900/95 backdrop-blur-xl
            ${menuAnimating && !mobileOpen ? 'mobile-menu-exit' : 'mobile-menu-enter'}
          `}
          role="menu"
          id="mobile-menu"
        >
          <div className="px-4 py-4 space-y-1">
            {NAV_LINKS.map((link, index) => {
              const Icon = link.icon
              const isActive = activePath === link.href
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={handleNavClick}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
                    transition-all duration-200 ease-in-out
                    animate-fade-in-down
                    ${isActive
                      ? 'text-white bg-brand-500/10 border border-brand-500/20'
                      : 'text-surface-400 hover:text-white hover:bg-white/5'
                    }
                  `}
                  style={{ animationDelay: `${index * 50}ms` }}
                  role="menuitem"
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4" />
                  {link.name}
                </Link>
              )
            })}

            {/* Mobile CTA */}
            <div className="pt-4 mt-2 border-t border-surface-800/50 flex flex-col gap-3">
              {user ? (
                <button
                  onClick={() => {
                    handleNavClick()
                    setSidebarOpen(true)
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold text-white bg-surface-800 hover:bg-surface-700 border border-surface-700/50 transition-colors animate-fade-in-down"
                  style={{ animationDelay: `${NAV_LINKS.length * 50}ms` }}
                >
                  <User className="w-4 h-4" />
                  My Account
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={handleNavClick}
                  className="w-full flex justify-center py-2 px-4 rounded-lg text-sm font-semibold text-surface-300 hover:text-white hover:bg-white/5 transition-colors animate-fade-in-down"
                  style={{ animationDelay: `${NAV_LINKS.length * 50}ms` }}
                >
                  Sign In
                </Link>
              )}
              <button
                onClick={() => {
                  handleNavClick()
                  navigate('/')
                }}
                className="
                  w-full flex items-center justify-center gap-2 px-5 py-3
                  bg-gradient-to-r from-brand-500 to-brand-600
                  text-white text-sm font-semibold
                  rounded-lg shadow-lg shadow-brand-500/25
                  active:scale-[0.98]
                  transition-all duration-200 ease-in-out
                  animate-fade-in-down
                "
                style={{ animationDelay: `${(NAV_LINKS.length + 1) * 50}ms` }}
                aria-label="Scan repository"
                role="menuitem"
              >
                <ScanSearch className="w-4 h-4" />
                Scan Repo
              </button>
            </div>
          </div>
        </div>
      )}

    </nav>

      {/* Account Sidebar - outside nav to prevent height clipping */}
      <AccountSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
    </>
  )
}
