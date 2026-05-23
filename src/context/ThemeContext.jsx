import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const useTheme = () => useContext(ThemeContext)

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true)

  useEffect(() => {
    const isDark = localStorage.getItem('secAuditTheme') !== 'light'
    setIsDarkMode(isDark)
    if (isDark) {
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.add('light')
    }
  }, [])

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const newDark = !prev
      if (newDark) {
        document.documentElement.classList.remove('light')
        localStorage.setItem('secAuditTheme', 'dark')
      } else {
        document.documentElement.classList.add('light')
        localStorage.setItem('secAuditTheme', 'light')
      }
      return newDark
    })
  }

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
