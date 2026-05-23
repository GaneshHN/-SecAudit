import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

export default function SecurityScoreGauge({ score = 0, label = '' }) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const radius = 80
  const stroke = 10
  const circumference = 2 * Math.PI * radius
  const progress = (animatedScore / 100) * circumference

  useEffect(() => {
    let frame
    const duration = 1500
    const start = performance.now()
    const animate = (now) => {
      const elapsed = now - start
      const t = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3) // easeOutCubic
      setAnimatedScore(Math.round(score * eased))
      if (t < 1) frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [score])

  const getColor = (s) => {
    if (s >= 70) return { main: '#22c55e', glow: 'rgba(34,197,94,0.3)', label: 'Secure', bg: 'rgba(34,197,94,0.08)' }
    if (s >= 40) return { main: '#eab308', glow: 'rgba(234,179,8,0.3)', label: 'Medium Risk', bg: 'rgba(234,179,8,0.08)' }
    return { main: '#ef4444', glow: 'rgba(239,68,68,0.3)', label: 'High Risk', bg: 'rgba(239,68,68,0.08)' }
  }

  const color = getColor(animatedScore)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center p-8"
    >
      <div className="relative" style={{ width: radius * 2 + stroke * 2, height: radius * 2 + stroke * 2 }}>
        {/* Glow */}
        <div
          className="absolute inset-0 rounded-full blur-2xl transition-all duration-700"
          style={{ backgroundColor: color.glow, opacity: 0.4 }}
        />

        <svg
          width={radius * 2 + stroke * 2}
          height={radius * 2 + stroke * 2}
          className="transform -rotate-90"
        >
          {/* Track */}
          <circle
            cx={radius + stroke}
            cy={radius + stroke}
            r={radius}
            fill="none"
            stroke="rgba(148,163,184,0.08)"
            strokeWidth={stroke}
          />
          {/* Progress */}
          <circle
            cx={radius + stroke}
            cy={radius + stroke}
            r={radius}
            fill="none"
            stroke={color.main}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            className="transition-all duration-100"
            style={{
              filter: `drop-shadow(0 0 8px ${color.glow})`,
            }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-black text-white tabular-nums tracking-tight">
            {animatedScore}
          </span>
          <span className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: color.main }}>
            {color.label}
          </span>
        </div>
      </div>

      <p className="text-sm text-slate-400 mt-4 font-medium">{label || 'Security Score'}</p>
    </motion.div>
  )
}
