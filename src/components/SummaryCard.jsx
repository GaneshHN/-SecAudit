import { ShieldAlert, AlertTriangle, Info, AlertOctagon } from 'lucide-react'

export default function SummaryCard({ summary }) {
  if (!summary) return null

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
      {/* Total Issues Card */}
      <div className="glass-card p-5 border-brand-500/20 md:col-span-1 col-span-2">
        <h3 className="text-sm font-semibold text-surface-400 mb-2">Total Issues</h3>
        <div className="text-3xl font-bold text-white">{summary.totalIssues}</div>
      </div>

      {/* Severity Breakdown Cards */}
      {[
        { label: 'Critical', value: summary.critical, icon: AlertOctagon, color: 'text-red-400', bg: 'bg-red-500/10' },
        { label: 'High', value: summary.high, icon: ShieldAlert, color: 'text-orange-400', bg: 'bg-orange-500/10' },
        { label: 'Medium', value: summary.medium, icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
        { label: 'Low', value: summary.low, icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10' }
      ].map((stat) => {
        const Icon = stat.icon
        return (
          <div key={stat.label} className="glass-card p-5 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-16 h-16 -mt-4 -mr-4 rounded-full ${stat.bg} blur-xl group-hover:scale-150 transition-transform duration-500`} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-surface-400">{stat.label}</h3>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div className={`text-3xl font-bold ${stat.value > 0 ? 'text-white' : 'text-surface-600'}`}>
                {stat.value}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
