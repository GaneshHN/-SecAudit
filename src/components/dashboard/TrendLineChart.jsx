import { motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-[11px] text-slate-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.stroke }} />
          <span className="text-xs text-slate-300">{p.name}:</span>
          <span className="text-xs font-bold text-white">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function TrendLineChart({ data }) {
  const defaultData = [
    { day: 'Day 1', findings: 12, resolved: 2 },
    { day: 'Day 2', findings: 15, resolved: 5 },
    { day: 'Day 3', findings: 11, resolved: 7 },
    { day: 'Day 4', findings: 18, resolved: 9 },
    { day: 'Day 5', findings: 14, resolved: 10 },
    { day: 'Day 6', findings: 22, resolved: 13 },
    { day: 'Day 7', findings: 19, resolved: 16 },
    { day: 'Day 8', findings: 16, resolved: 14 },
    { day: 'Day 9', findings: 25, resolved: 18 },
    { day: 'Day 10', findings: 20, resolved: 17 },
    { day: 'Day 11', findings: 17, resolved: 15 },
    { day: 'Day 12', findings: 14, resolved: 13 },
    { day: 'Day 13', findings: 10, resolved: 9 },
    { day: 'Day 14', findings: 8, resolved: 7 },
  ]

  const chartData = data || defaultData

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full"
      style={{ height: 260 }}
    >
      <ResponsiveContainer>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gradFindings" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818cf8" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradResolved" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 10, fill: '#64748b' }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(148,163,184,0.1)' }}
            interval={2}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#64748b' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="findings"
            name="Findings"
            stroke="#818cf8"
            strokeWidth={2.5}
            fill="url(#gradFindings)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: '#818cf8', fill: '#1e1b4b' }}
            animationDuration={1200}
            animationEasing="ease-out"
          />
          <Area
            type="monotone"
            dataKey="resolved"
            name="Resolved"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#gradResolved)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: '#22c55e', fill: '#052e16' }}
            animationDuration={1400}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
