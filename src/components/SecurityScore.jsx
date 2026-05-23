import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'

export default function SecurityScore() {
  const [animatedScore, setAnimatedScore] = useState(0)
  const score = 94
  const circumference = 2 * Math.PI * 45 // radius = 45
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference

  useEffect(() => {
    const timer = setTimeout(() => {
      let current = 0
      const interval = setInterval(() => {
        current += 1
        if (current >= score) {
          setAnimatedScore(score)
          clearInterval(interval)
        } else {
          setAnimatedScore(current)
        }
      }, 15)
      return () => clearInterval(interval)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="glass-card p-6 w-full max-w-xs">
      <h3 className="text-sm font-semibold text-surface-400 mb-4 tracking-wide">
        Security Score
      </h3>

      {/* Circular gauge */}
      <div className="flex items-center justify-center mb-5">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full score-ring" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle
              cx="50" cy="50" r="45"
              fill="none"
              stroke="rgba(99, 102, 241, 0.1)"
              strokeWidth="6"
            />
            {/* Score arc */}
            <circle
              cx="50" cy="50" r="45"
              fill="none"
              stroke="url(#scoreGradient)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="50%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
          </svg>
          {/* Score text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-white tabular-nums">
              {animatedScore}
            </span>
            <span className="text-xs font-medium text-emerald-400 mt-0.5">
              Excellent
            </span>
          </div>
        </div>
      </div>

      {/* Status items */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm text-surface-300">Critical Vulnerabilities</span>
          </div>
          <div className="w-2 h-2 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
        </div>
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-surface-300">Dependencies Updated</span>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
        </div>
      </div>
    </div>
  )
}
