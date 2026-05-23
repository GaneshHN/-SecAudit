import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Trash2, ExternalLink, Shield, Clock, AlertTriangle } from 'lucide-react'
import { getUserHistory, deleteScanHistory } from '../services/api'
import { useAuth } from '../context/AuthContext'
import SeverityBadge from '../components/SeverityBadge'

export default function HistoryPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (user) {
      loadHistory()
    }
  }, [user])

  const loadHistory = async () => {
    try {
      setLoading(true)
      const data = await getUserHistory(user.email)
      setHistory(data)
    } catch (err) {
      setError('Failed to load scan history.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation() // Prevent row click
    if (window.confirm('Are you sure you want to delete this scan record?')) {
      try {
        await deleteScanHistory(id)
        setHistory(history.filter(scan => scan._id !== id))
      } catch (err) {
        alert('Failed to delete scan.')
      }
    }
  }

  const handleRowClick = (scan) => {
    // Transform backend DB format to match what Dashboard expects
    const dashboardData = {
      repository: scan.repoUrl,
      timestamp: scan.scanDate,
      score: scan.securityScore,
      summary: {
        totalIssues: scan.totalIssues,
        critical: 0,
        high: scan.highCount,
        medium: scan.mediumCount,
        low: scan.lowCount,
      },
      vulnerabilities: scan.results,
    }
    navigate('/dashboard', { state: { scanResult: dashboardData } })
  }

  const filteredHistory = history.filter(scan =>
    scan.repoUrl.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-brand-400" />
            Scan History
          </h1>
          <p className="text-sm text-surface-400 mt-1">
            Review and manage your previous security audits.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-surface-500" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-surface-700 rounded-lg leading-5 bg-surface-900 text-surface-200 placeholder-surface-500 focus:outline-none focus:bg-surface-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 sm:text-sm transition-colors"
            placeholder="Search repositories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400">
          <AlertTriangle className="w-5 h-5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-surface-800/50">
              <thead className="bg-surface-900/50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-surface-400 uppercase tracking-wider">Repository</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-surface-400 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-surface-400 uppercase tracking-wider">Score</th>
                  <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-surface-400 uppercase tracking-wider">Issues</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-surface-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-800/50 bg-transparent">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-surface-500 text-sm">
                      {searchQuery ? 'No scans found matching your search.' : 'No scan history found. Run your first scan!'}
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((scan, index) => (
                    <motion.tr
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      key={scan._id}
                      onClick={() => handleRowClick(scan)}
                      className="hover:bg-surface-800/30 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Shield className="flex-shrink-0 h-5 w-5 text-brand-400 mr-3" />
                          <div className="text-sm font-medium text-white truncate max-w-[200px] sm:max-w-xs">
                            {scan.repoUrl}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-400">
                        {new Date(scan.scanDate).toLocaleDateString(undefined, { 
                          year: 'numeric', month: 'short', day: 'numeric', 
                          hour: '2-digit', minute: '2-digit' 
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          scan.securityScore >= 80 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          scan.securityScore >= 50 ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                          'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {scan.securityScore}/100
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm text-white font-medium">{scan.totalIssues}</div>
                        <div className="text-xs text-surface-500 mt-0.5 space-x-2">
                          {scan.highCount > 0 && <span className="text-orange-400">{scan.highCount} H</span>}
                          {scan.mediumCount > 0 && <span className="text-yellow-400">{scan.mediumCount} M</span>}
                          {scan.lowCount > 0 && <span className="text-blue-400">{scan.lowCount} L</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            className="text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1"
                          >
                            Details <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, scan._id)}
                            className="text-surface-500 hover:text-red-400 transition-colors p-1"
                            title="Delete record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
