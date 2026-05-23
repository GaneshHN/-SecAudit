import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Webhook,
  MessageSquare,
  Hash,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  ExternalLink
} from 'lucide-react'

const GithubIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
)

// Dummy data for integrations
const INTEGRATION_OPTIONS = [
  {
    id: 'github',
    name: 'GitHub Webhooks',
    description: 'Automatically scan pull requests and commits for vulnerabilities.',
    icon: GithubIcon,
    color: 'bg-gray-800 text-white border-gray-700',
    type: 'CI/CD'
  },
  {
    id: 'gitlab',
    name: 'GitLab CI',
    description: 'Integrate security gates directly into your GitLab pipelines.',
    icon: Webhook,
    color: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    type: 'CI/CD'
  },
  {
    id: 'slack',
    name: 'Slack Alerts',
    description: 'Receive real-time notifications for critical security events.',
    icon: Hash,
    color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    type: 'Notifications'
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    description: 'Push audit summaries and alerts to your Teams channels.',
    icon: MessageSquare,
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    type: 'Notifications'
  }
]

export default function Integrations() {
  // state for connected integrations: { id: status } (status: 'disconnected', 'verifying', 'connected', 'failed')
  const [connections, setConnections] = useState({})
  const [activeTab, setActiveTab] = useState('All')

  const handleConnect = (id) => {
    // 1. Set to verifying (Security Check phase)
    setConnections(prev => ({ ...prev, [id]: 'verifying' }))
    
    // 2. Simulate security verification delay
    setTimeout(() => {
      // 90% chance of success, 10% chance of failing security check for realism
      const isSecure = Math.random() > 0.1
      setConnections(prev => ({ ...prev, [id]: isSecure ? 'connected' : 'failed' }))
    }, 2500)
  }

  const handleDisconnect = (id) => {
    setConnections(prev => {
      const newConns = { ...prev }
      delete newConns[id]
      return newConns
    })
  }

  const filteredIntegrations = activeTab === 'All' 
    ? INTEGRATION_OPTIONS 
    : INTEGRATION_OPTIONS.filter(i => i.type === activeTab)

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen">
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-12 h-12 bg-brand-500/10 rounded-xl border border-brand-500/20 text-brand-400">
            <Webhook className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Integrations Hub
            </h1>
            <p className="text-surface-400 text-sm">
              Connect third-party services. All connections undergo strict security verification.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Security Notice */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-8 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl flex items-start gap-3 text-blue-400"
      >
        <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-sm">Zero-Trust Verification Enabled</h4>
          <p className="text-xs opacity-80 mt-1 leading-relaxed max-w-3xl">
            To maintain compliance, all third-party integrations are subjected to an automated security check before connection is allowed. We verify webhook payloads, OAuth scopes, and endpoint authenticity.
          </p>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-surface-800 mb-6">
        {['All', 'CI/CD', 'Notifications'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-surface-400 hover:text-white hover:border-surface-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence>
          {filteredIntegrations.map((integration, index) => {
            const Icon = integration.icon
            const status = connections[integration.id] || 'disconnected'

            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                key={integration.id}
                className="glass-card p-6 flex flex-col h-full border border-surface-800/60 relative overflow-hidden group hover:border-brand-500/30 transition-colors"
              >
                {/* Status Indicator Bar */}
                {status === 'connected' && <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />}
                {status === 'failed' && <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />}
                {status === 'verifying' && <div className="absolute top-0 left-0 w-full h-1 bg-brand-500 animate-pulse" />}

                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-xl border ${integration.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{integration.name}</h3>
                      <span className="text-xs font-medium text-surface-500 px-2 py-0.5 bg-surface-800 rounded-full mt-1 inline-block border border-surface-700">
                        {integration.type}
                      </span>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  {status === 'connected' && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Connected
                    </span>
                  )}
                  {status === 'failed' && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20" title="Failed security verification">
                      <XCircle className="w-3.5 h-3.5" />
                      Blocked
                    </span>
                  )}
                </div>

                <p className="text-sm text-surface-400 flex-grow mb-6 leading-relaxed">
                  {integration.description}
                </p>

                {/* Verification UI / Action Button */}
                <div className="mt-auto pt-4 border-t border-surface-800/50 flex items-center justify-between">
                  {status === 'verifying' ? (
                    <div className="flex items-center gap-2 text-brand-400 text-sm font-medium w-full bg-brand-500/5 p-2 rounded-lg border border-brand-500/10">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Running Security Check...
                    </div>
                  ) : status === 'connected' ? (
                    <div className="flex items-center justify-between w-full">
                      <button className="text-xs text-surface-400 hover:text-white flex items-center gap-1 transition-colors">
                        Configure <ExternalLink className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => handleDisconnect(integration.id)}
                        className="text-sm font-medium text-surface-500 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10"
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : status === 'failed' ? (
                     <div className="flex items-center justify-between w-full">
                      <div className="text-xs text-red-400 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Security check failed.
                      </div>
                      <button 
                        onClick={() => handleConnect(integration.id)}
                        className="text-sm font-medium text-surface-300 hover:text-white transition-colors"
                      >
                        Retry
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleConnect(integration.id)}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-surface-800 hover:bg-surface-700 text-white rounded-lg text-sm font-semibold transition-colors border border-surface-700 hover:border-brand-500/50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-navy-900"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
