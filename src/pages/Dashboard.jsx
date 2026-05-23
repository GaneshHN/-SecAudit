import { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, ArrowLeft, Activity, PieChart, BarChart3, AlertTriangle,
  Clock, FileWarning, ChevronRight, TrendingDown, Zap, Eye, Download
} from 'lucide-react'

import SecurityScoreGauge from '../components/dashboard/SecurityScoreGauge'
import SeverityDonutChart from '../components/dashboard/SeverityDonutChart'
import TrendLineChart from '../components/dashboard/TrendLineChart'
import CategoryBarChart from '../components/dashboard/CategoryBarChart'
import RiskyProjectsList from '../components/dashboard/RiskyProjectsList'
import DashboardCard from '../components/dashboard/DashboardCard'
import { ChartSkeleton, ScoreSkeleton, ListSkeleton, StatsSkeleton } from '../components/dashboard/Skeletons'
import IssueDetailModal from '../components/IssueDetailModal'
import { getDashboardStats } from '../services/api'
import { timeAgo } from '../utils/helpers'

/* ─── Stat Mini-Cards ─── */
function StatBadge({ label, value, icon: Icon, color, bgColor }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className={`relative overflow-hidden rounded-xl border ${bgColor || 'border-slate-800/60 bg-slate-900/50'} p-4 group cursor-default`}
    >
      <div className={`absolute -top-3 -right-3 w-14 h-14 rounded-full ${bgColor || 'bg-slate-800/30'} blur-xl opacity-60 group-hover:opacity-100 transition-opacity`} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
          {Icon && <Icon className={`w-3.5 h-3.5 ${color || 'text-slate-500'}`} />}
        </div>
        <span className={`text-2xl font-black ${value > 0 ? 'text-white' : 'text-slate-600'} tabular-nums`}>{value}</span>
      </div>
    </motion.div>
  )
}

/* ─── Build category data from vulnerabilities ─── */
function buildCategoryData(vulnerabilities) {
  if (!vulnerabilities?.length) return null
  const cats = {}
  const colorMap = {
    'Hardcoded Secrets': '#ef4444', 'Security Headers': '#3b82f6', 'Code Injection': '#f97316',
    'Weak Crypto': '#eab308', 'Misconfigurations': '#8b5cf6', 'Dependencies': '#06b6d4',
    'Security': '#a78bfa', 'XSS': '#fb923c', 'SQL Injection': '#dc2626',
  }
  vulnerabilities.forEach(v => {
    const cat = v.category || 'Other'
    cats[cat] = (cats[cat] || 0) + 1
  })
  return Object.entries(cats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ name, value, color: colorMap[name] || '#64748b' }))
}

/* ═══════════════════════════════════════════════════ */
/*  DASHBOARD PAGE                                     */
/* ═══════════════════════════════════════════════════ */
export default function Dashboard() {
  const location = useLocation()
  const [data, setData] = useState(location.state?.scanResult || null)
  const [loading, setLoading] = useState(!data)
  const [selectedIssue, setSelectedIssue] = useState(null)

  useEffect(() => {
    if (!data) {
      const fetchData = async () => {
        const result = await getDashboardStats()
        setData(result)
        setLoading(false)
      }
      // Simulate loading for skeleton effect
      setTimeout(fetchData, 800)
    }
  }, [data])

  /* ─── Skeleton Loading ─── */
  if (loading) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-slate-800/60 animate-pulse" />
          <div className="space-y-2">
            <div className="h-5 w-48 bg-slate-800/60 rounded animate-pulse" />
            <div className="h-3 w-32 bg-slate-800/60 rounded animate-pulse" />
          </div>
        </div>
        <StatsSkeleton />
        <div className="grid lg:grid-cols-2 gap-5 mt-5">
          <ScoreSkeleton />
          <ChartSkeleton />
          <ChartSkeleton />
          <ListSkeleton />
        </div>
      </div>
    )
  }

  const summary = data?.summary || {}
  const score = data?.score ?? 100
  const vulns = data?.vulnerabilities || []
  const categoryData = buildCategoryData(vulns)

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

      {/* ─── Header ─── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8"
      >
        <div>
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white mb-4 transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Scanner
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 bg-indigo-500/15 text-indigo-400 rounded-xl border border-indigo-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {data?.repository || 'Security Dashboard'}
              </h1>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-sm text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {data?.timestamp ? timeAgo(data.timestamp) : 'Just now'}
                </span>
                {data?.scanTime && (
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {data.scanTime}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* PDF Export Action */}
        <div className="flex items-center gap-3 self-start sm:self-end mt-4 sm:mt-0 print:hidden">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-brand-500/5 hover:shadow-brand-500/10"
          >
            <Download className="w-4 h-4" />
            Export PDF Report
          </button>
        </div>
      </motion.div>

      {/* ─── Severity Stats Row ─── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6"
      >
        <StatBadge label="Total" value={summary.totalIssues || 0} icon={FileWarning} color="text-slate-400" bgColor="bg-slate-800/30 border-slate-700/40" />
        <StatBadge label="Critical" value={summary.critical || 0} icon={AlertTriangle} color="text-red-400" bgColor="bg-red-500/5 border-red-500/15" />
        <StatBadge label="High" value={summary.high || 0} icon={AlertTriangle} color="text-orange-400" bgColor="bg-orange-500/5 border-orange-500/15" />
        <StatBadge label="Medium" value={summary.medium || 0} icon={AlertTriangle} color="text-yellow-400" bgColor="bg-yellow-500/5 border-yellow-500/15" />
        <StatBadge label="Low" value={summary.low || 0} icon={AlertTriangle} color="text-blue-400" bgColor="bg-blue-500/5 border-blue-500/15" />
      </motion.div>

      {/* ─── Top Row: Score + Donut ─── */}
      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        <DashboardCard title="Security Score" subtitle="Overall security posture" icon={Shield} delay={0.15}>
          <SecurityScoreGauge score={score} label={data?.repository || ''} />
        </DashboardCard>

        <DashboardCard title="Severity Distribution" subtitle="Issues by severity level" icon={PieChart} delay={0.2}>
          <SeverityDonutChart data={summary} />
        </DashboardCard>
      </div>

      {/* ─── Bottom Row: Trend + Categories ─── */}
      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        <DashboardCard title="Findings Trend" subtitle="14-day discovery vs resolution" icon={Activity} delay={0.25}>
          <TrendLineChart />
        </DashboardCard>

        <DashboardCard title="Issue Categories" subtitle="Top vulnerability types found" icon={BarChart3} delay={0.3}>
          <CategoryBarChart data={categoryData} />
        </DashboardCard>
      </div>

      {/* ─── Risky Projects ─── */}
      <DashboardCard title="Top Risky Projects" subtitle="Projects ranked by risk score" icon={AlertTriangle} delay={0.35} className="mb-5">
        <RiskyProjectsList />
      </DashboardCard>

      {/* ─── Vulnerability List ─── */}
      {vulns.length > 0 && (
        <DashboardCard title={`Detected Issues (${vulns.length})`} subtitle="Click any issue for details" icon={Eye} delay={0.4}>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
            {vulns.map((vuln, i) => {
              const sevColors = {
                Critical: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', dot: 'bg-red-500' },
                High: { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', dot: 'bg-orange-500' },
                Medium: { text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', dot: 'bg-yellow-500' },
                Low: { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', dot: 'bg-blue-500' },
              }
              const sc = sevColors[vuln.severity] || sevColors.Low
              
              // Map category to compliance framework
              const getComplianceBadge = (category) => {
                if (['SQL Injection', 'XSS', 'Code Injection'].includes(category)) return 'OWASP Top 10'
                if (['Hardcoded Secrets', 'Weak Crypto'].includes(category)) return 'SOC2 Type II'
                if (['Misconfigurations', 'Security Headers'].includes(category)) return 'PCI-DSS'
                if (['Dependencies'].includes(category)) return 'NIST CSF'
                return 'ISO 27001'
              }
              const compliance = getComplianceBadge(vuln.category)

              return (
                <motion.div
                  key={vuln.id || i}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.02 * Math.min(i, 20), duration: 0.3 }}
                  onClick={() => setSelectedIssue(vuln)}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${sc.border} ${sc.bg} hover:bg-slate-800/50 cursor-pointer transition-all group`}
                >
                  <div className={`flex-shrink-0 px-2 py-1 rounded-md text-[11px] font-bold ${sc.text} ${sc.bg} border ${sc.border}`}>
                    {vuln.severity}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-white truncate block">{vuln.title}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      {vuln.file && <span className="text-[11px] text-slate-500 truncate">{vuln.file}{vuln.line ? `:${vuln.line}` : ''}</span>}
                      {vuln.category && <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">{vuln.category}</span>}
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                        {compliance}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0" />
                </motion.div>
              )
            })}
          </div>
        </DashboardCard>
      )}

      {/* ─── Issue Detail Modal ─── */}
      <AnimatePresence>
        {selectedIssue && (
          <IssueDetailModal
            issue={selectedIssue}
            onClose={() => setSelectedIssue(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
