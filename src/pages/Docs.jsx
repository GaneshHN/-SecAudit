import { BookOpen } from 'lucide-react'

export default function Docs() {
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto min-h-screen">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex items-center justify-center w-12 h-12 bg-brand-500/10 rounded-xl border border-brand-500/20 text-brand-400">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Documentation</h1>
          <p className="text-surface-400 text-sm">Learn how to integrate and use SecAudit.</p>
        </div>
      </div>
      <div className="glass-card p-8 text-surface-300">
        <h2 className="text-xl font-bold text-white mb-4">Getting Started</h2>
        <p className="mb-4 text-surface-400 leading-relaxed">
          Welcome to the SecAudit documentation. Here you will find guides and API references to help you secure your CI/CD pipelines. 
          SecAudit integrates seamlessly into your existing workflows, providing real-time security insights, vulnerability scanning, 
          and compliance monitoring.
        </p>
        <div className="bg-surface-800/50 border border-surface-700/50 p-4 rounded-lg">
          <h3 className="font-semibold text-white mb-2">Quick Start</h3>
          <p className="text-sm text-surface-400 mb-2">To connect your repository, navigate to the <span className="text-brand-400 font-mono">Integrations</span> page and follow the setup instructions for GitHub or GitLab.</p>
        </div>
        <p className="mt-6 text-sm text-surface-500">More updates and detailed API references coming soon...</p>
      </div>
    </div>
  )
}
