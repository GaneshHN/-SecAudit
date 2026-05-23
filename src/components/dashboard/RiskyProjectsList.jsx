import { motion } from 'framer-motion'
import { AlertTriangle, Shield, ChevronRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getUserHistory } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

const riskColor = (score) => {
  if (score >= 70) return { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', dot: 'bg-red-500' }
  if (score >= 40) return { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', dot: 'bg-orange-500' }
  return { text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', dot: 'bg-yellow-500' }
}

export default function RiskyProjectsList({ projects }) {
  const { user } = useAuth()
  const [historyProjects, setHistoryProjects] = useState(null)

  useEffect(() => {
    if (!projects && user?.email) {
      getUserHistory(user.email).then(history => {
        if (!history || history.length === 0) return
        
        const projectMap = {}
        history.forEach(scan => {
          const repoPath = scan.repoUrl || 'Unknown'
          const shortName = repoPath.split('/').pop() || repoPath
          
          if (!projectMap[repoPath] || new Date(scan.scanDate) > new Date(projectMap[repoPath].date)) {
            projectMap[repoPath] = {
              name: shortName,
              risk: scan.securityScore ? Math.max(0, 100 - scan.securityScore) : 0,
              critical: 0, // Not explicitly tracked in history summary yet
              high: scan.highCount || 0,
              lang: scan.scanType === 'url' ? 'Web' : 'Code',
              date: scan.scanDate
            }
          }
        })
        
        const sorted = Object.values(projectMap)
          .sort((a, b) => b.risk - a.risk)
          .slice(0, 5)
          
        if (sorted.length > 0) {
          setHistoryProjects(sorted)
        }
      }).catch(err => console.error("Failed to fetch history for risky projects:", err))
    }
  }, [projects, user])

  const defaultProjects = [
    { name: 'api-gateway', risk: 87, critical: 5, high: 12, lang: 'Node.js' },
    { name: 'payment-service', risk: 72, critical: 3, high: 8, lang: 'Python' },
    { name: 'auth-module', risk: 65, critical: 2, high: 6, lang: 'Java' },
    { name: 'frontend-app', risk: 45, critical: 1, high: 3, lang: 'React' },
    { name: 'data-pipeline', risk: 38, critical: 0, high: 4, lang: 'Python' },
  ]

  const items = projects || historyProjects || defaultProjects

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="space-y-2"
    >
      {items.map((project, i) => {
        const rc = riskColor(project.risk)
        return (
          <motion.div
            key={project.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * i, duration: 0.3 }}
            className={`group flex items-center gap-3 p-3 rounded-lg border ${rc.border} ${rc.bg} hover:bg-slate-800/60 transition-all duration-200 cursor-pointer`}
          >
            {/* Rank */}
            <div className="flex-shrink-0 w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center">
              <span className="text-[10px] font-bold text-slate-400">#{i + 1}</span>
            </div>

            {/* Project Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white truncate">{project.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">{project.lang}</span>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-[11px] text-red-400 font-medium">C: {project.critical}</span>
                <span className="text-[11px] text-orange-400 font-medium">H: {project.high}</span>
              </div>
            </div>

            {/* Risk Score */}
            <div className="flex items-center gap-2">
              <div className={`px-2.5 py-1 rounded-md ${rc.bg} border ${rc.border}`}>
                <span className={`text-sm font-bold ${rc.text} tabular-nums`}>{project.risk}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors" />
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
