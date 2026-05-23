import { createContext, useContext, useState } from 'react'

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

// Simple hash function for password storage (not cryptographically secure, but suitable for local demo)
function simpleHash(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0 // Convert to 32bit integer
  }
  return hash.toString(36)
}

// Get all registered accounts from localStorage
function getAccounts() {
  try {
    const accounts = localStorage.getItem('secAuditAccounts')
    return accounts ? JSON.parse(accounts) : {}
  } catch {
    return {}
  }
}

// Save accounts to localStorage
function saveAccounts(accounts) {
  localStorage.setItem('secAuditAccounts', JSON.stringify(accounts))
}

// Check both storage locations for existing session
function getStoredUser() {
  try {
    // Check localStorage first (remember me), then sessionStorage (session-only)
    const persistent = localStorage.getItem('secAuditUser')
    if (persistent) return JSON.parse(persistent)

    const session = sessionStorage.getItem('secAuditUser')
    if (session) return JSON.parse(session)

    return null
  } catch {
    return null
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getStoredUser())
  const [authError, setAuthError] = useState('')

  // Register a new account
  const register = (name, email, password) => {
    setAuthError('')
    const accounts = getAccounts()

    // Check if account already exists
    if (accounts[email.toLowerCase()]) {
      setAuthError('An account with this email already exists. Please sign in instead.')
      return false
    }

    // Create the account
    const hashedPassword = simpleHash(password)
    const now = new Date().toISOString()
    const userObj = {
      name: name || email.split('@')[0],
      email: email.toLowerCase(),
      role: 'DevSecOps Admin',
      avatar: (name || email).substring(0, 2).toUpperCase(),
      lastLogin: now,
      createdAt: now,
    }

    accounts[email.toLowerCase()] = {
      ...userObj,
      passwordHash: hashedPassword,
    }
    saveAccounts(accounts)

    // Auto-login after registration (persist to localStorage by default)
    setUser(userObj)
    localStorage.setItem('secAuditUser', JSON.stringify(userObj))
    return true
  }

  // Login with existing account
  const login = (email, password, rememberMe = false) => {
    setAuthError('')
    const accounts = getAccounts()
    const account = accounts[email.toLowerCase()]

    // Check if account exists
    if (!account) {
      setAuthError('No account found with this email. Please sign up first.')
      return false
    }

    // Validate password
    const hashedPassword = simpleHash(password)
    if (account.passwordHash !== hashedPassword) {
      setAuthError('Incorrect password. Please try again.')
      return false
    }

    // Update last login timestamp
    const now = new Date().toISOString()
    accounts[email.toLowerCase()].lastLogin = now
    saveAccounts(accounts)

    // Login successful
    const userObj = {
      name: account.name,
      email: account.email,
      role: account.role,
      avatar: account.avatar,
      lastLogin: now,
      createdAt: account.createdAt,
    }
    setUser(userObj)

    // Persist based on remember me preference
    if (rememberMe) {
      localStorage.setItem('secAuditUser', JSON.stringify(userObj))
    } else {
      // Session-only: clear any persistent token and use sessionStorage
      localStorage.removeItem('secAuditUser')
      sessionStorage.setItem('secAuditUser', JSON.stringify(userObj))
    }

    return true
  }

  // Update the user's profile
  const updateProfile = (updates) => {
    if (!user) return false

    const accounts = getAccounts()
    const account = accounts[user.email]
    if (!account) return false

    // If email changed, move the account entry
    if (updates.email && updates.email.toLowerCase() !== user.email) {
      delete accounts[user.email]
      accounts[updates.email.toLowerCase()] = {
        ...account,
        ...updates,
        email: updates.email.toLowerCase(),
      }
    } else {
      accounts[user.email] = { ...account, ...updates }
    }
    saveAccounts(accounts)

    const updatedUser = { ...user, ...updates }
    setUser(updatedUser)

    // Update whichever storage is being used
    if (localStorage.getItem('secAuditUser')) {
      localStorage.setItem('secAuditUser', JSON.stringify(updatedUser))
    } else {
      sessionStorage.setItem('secAuditUser', JSON.stringify(updatedUser))
    }

    return true
  }

  // Check if an account exists for a given email (used by two-step login)
  const accountExists = (email) => {
    if (!email) return false
    const accounts = getAccounts()
    return !!accounts[email.toLowerCase()]
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('secAuditUser')
    sessionStorage.removeItem('secAuditUser')
  }

  const clearAuthError = () => setAuthError('')

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateProfile, accountExists, authError, clearAuthError }}>
      {children}
    </AuthContext.Provider>
  )
}
