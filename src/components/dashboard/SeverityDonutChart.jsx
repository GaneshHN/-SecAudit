import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const SEVERITY_COLORS = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#eab308',
  Low: '#3b82f6',
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-lg px-3 py-2 shadow-xl">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.payload.fill }} />
        <span className="text-sm font-semibold text-white">{d.name}</span>
        <span className="text-sm font-bold text-slate-300 ml-auto">{d.value}</span>
      </div>
    </div>
  )
}

export default function SeverityDonutChart({ data }) {
  const chartData = [
    { name: 'Critical', value: data?.critical || 0 },
    { name: 'High', value: data?.high || 0 },
    { name: 'Medium', value: data?.medium || 0 },
    { name: 'Low', value: data?.low || 0 },
  ].filter(d => d.value > 0)

  const total = chartData.reduce((s, d) => s + d.value, 0)

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 text-sm">
        No vulnerabilities detected
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="flex flex-col items-center"
    >
      <div className="relative w-full" style={{ height: 220 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
              animationBegin={200}
              animationDuration={1000}
              animationEasing="ease-out"
              stroke="none"
            >
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-black text-white">{total}</span>
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Issues</span>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-2">
        {chartData.map(d => (
          <div key={d.name} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: SEVERITY_COLORS[d.name] }} />
            <span className="text-xs text-slate-400">{d.name}</span>
            <span className="text-xs font-bold text-white ml-auto">{d.value}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
