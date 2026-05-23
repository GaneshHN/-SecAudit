import { useState, useEffect, useCallback } from 'react'

/**
 * Custom hook for dark/light theme management using Tailwind's class strategy.
 * Persists preference to localStorage and respects system preference on first visit.
 * @returns {{ isDark: boolean, toggleTheme: () => void }}
 */
export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false
    const stored = localStorage.getItem('theme')
    if (stored) return stored === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const toggleTheme = useCallback(() => {
    setIsDark(prev => !prev)
  }, [])

  return { isDark, toggleTheme }
}
