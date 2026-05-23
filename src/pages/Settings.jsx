import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings as SettingsIcon,
  Shield,
  Users,
  Save,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  Trash2,
  Lock,
  Search,
  Mail
} from 'lucide-react'

// Mock Data
const MOCK_POLICIES = [
  { id: 'fail_critical', name: 'Fail build on Critical issues', description: 'Automatically break the CI/CD pipeline if any critical severity vulnerability is detected.', enabled: true },
  { id: 'fail_high', name: 'Fail build on High issues', description: 'Break the build if high severity vulnerabilities are found.', enabled: false },
  { id: 'block_secrets', name: 'Block Hardcoded Secrets', description: 'Reject any pull requests that contain leaked API keys or passwords.', enabled: true },
  { id: 'enforce_sast', name: 'Enforce SAST Scanning', description: 'Require Static Application Security Testing on all main branches.', enabled: true },
  { id: 'auto_remediate', name: 'AI Auto-Remediation', description: 'Automatically generate pull requests with code fixes for supported vulnerabilities.', enabled: false },
]

const MOCK_USERS = [
  { id: 1, name: 'Alex Developer', email: 'alex@company.com', role: 'DevSecOps Admin', status: 'Active', avatar: 'AD' },
  { id: 2, name: 'Sarah Engineer', email: 'sarah@company.com', role: 'Developer', status: 'Active', avatar: 'SE' },
  { id: 3, name: 'Mike Auditor', email: 'mike@company.com', role: 'Auditor', status: 'Pending', avatar: 'MA' },
]

export default function Settings() {
  const [activeTab, setActiveTab] = useState('Policies')
  const [policies, setPolicies] = useState(MOCK_POLICIES)
  const [users, setUsers] = useState(MOCK_USERS)
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleTogglePolicy = (id) => {
    setPolicies(policies.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p))
  }

  const handleDeleteUser = (id) => {
    setUsers(users.filter(u => u.id !== id))
  }

  const handleSave = () => {
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    }, 800)
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 bg-surface-800 rounded-xl border border-surface-700">
            <SettingsIcon className="w-6 h-6 text-surface-300" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Organization Settings
            </h1>
            <p className="text-surface-400 text-sm">
              Manage security policies and team access.
            </p>
          </div>
        </div>

        {activeTab === 'Policies' && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            {isSaving ? <span className="animate-spin text-lg">↻</span> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-surface-800 mb-8">
        {[
          { name: 'Policies', icon: Shield },
          { name: 'Access Control', icon: Users },
        ].map(tab => (
          <button
            key={tab.name}
            onClick={() => setActiveTab(tab.name)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.name
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-surface-400 hover:text-white hover:border-surface-600'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.name}
          </button>
        ))}
      </div>

      {/* Success Notification */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-400"
          >
            <CheckCircle2 className="w-5 h-5" />
            <p className="text-sm font-medium">Settings saved successfully.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Content */}
      <div className="glass-card overflow-hidden">
        {activeTab === 'Policies' ? (
          <div className="divide-y divide-surface-800">
            <div className="p-6 bg-surface-800/30">
              <h2 className="text-lg font-bold text-white mb-1">CI/CD Security Gates</h2>
              <p className="text-sm text-surface-400">Configure global rules that apply to all automated pipeline scans.</p>
            </div>
            
            <div className="p-6 space-y-6">
              {policies.map(policy => (
                <div key={policy.id} className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{policy.name}</h3>
                    <p className="text-sm text-surface-400 mt-1 max-w-2xl">{policy.description}</p>
                  </div>
                  <button
                    onClick={() => handleTogglePolicy(policy.id)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      policy.enabled ? 'bg-brand-500' : 'bg-surface-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        policy.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="p-6 bg-orange-500/5 border-t border-orange-500/10">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-orange-400">Warning: Pipeline Blocking</h4>
                  <p className="text-sm text-surface-400 mt-1 leading-relaxed max-w-3xl">
                    Enabling "Fail build" policies may interrupt active developer workflows. Ensure your team is aware of these security gates before enforcing them globally.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="p-6 border-b border-surface-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-bold text-white mb-1">Role-Based Access Control (RBAC)</h2>
                <p className="text-sm text-surface-400">Manage who has access to view reports or configure policies.</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-white text-navy-900 hover:bg-gray-200 rounded-lg text-sm font-bold transition-colors">
                <UserPlus className="w-4 h-4" />
                Invite Member
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-surface-800 bg-surface-900/50">
                    <th className="px-6 py-4 text-xs font-semibold text-surface-500 uppercase">User</th>
                    <th className="px-6 py-4 text-xs font-semibold text-surface-500 uppercase">Role</th>
                    <th className="px-6 py-4 text-xs font-semibold text-surface-500 uppercase">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-surface-500 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-800/50">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-surface-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-surface-700 to-surface-600 flex items-center justify-center text-xs font-bold text-white">
                            {u.avatar}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-white">{u.name}</div>
                            <div className="text-xs text-surface-500">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-surface-700 bg-surface-800 text-xs font-medium text-surface-300">
                          {u.role === 'DevSecOps Admin' && <Lock className="w-3 h-3 text-brand-400" />}
                          {u.role}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          u.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1.5 text-surface-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors" 
                          title="Remove User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
