import { useState, useEffect } from 'react'

/**
 * Custom hook to detect if the page has been scrolled past a threshold.
 * @param {number} threshold - Pixels scrolled before returning true (default: 10)
 * @returns {boolean} Whether the page is scrolled past the threshold
 */
export function useScrolled(threshold = 10) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > threshold)
    }

    // Check initial state
    handleScroll()

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [threshold])

  return scrolled
}
