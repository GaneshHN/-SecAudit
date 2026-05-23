import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const CATEGORY_COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#8b5cf6', '#06b6d4']

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-lg px-3 py-2 shadow-xl">
      <span className="text-xs text-white font-semibold">{d.payload.name}: </span>
      <span className="text-xs font-bold text-white">{d.value}</span>
    </div>
  )
}

export default function CategoryBarChart({ data }) {
  const defaultData = [
    { name: 'Hardcoded Secrets', value: 21, color: '#ef4444' },
    { name: 'Code Injection', value: 14, color: '#f97316' },
    { name: 'Weak Crypto', value: 8, color: '#eab308' },
    { name: 'Security Headers', value: 6, color: '#3b82f6' },
    { name: 'Misconfigurations', value: 5, color: '#8b5cf6' },
    { name: 'Dependencies', value: 3, color: '#06b6d4' },
  ]

  const chartData = data || defaultData

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="w-full"
      style={{ height: 260 }}
    >
      <ResponsiveContainer>
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: '#64748b' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            width={120}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148,163,184,0.04)' }} />
          <Bar
            dataKey="value"
            radius={[0, 6, 6, 0]}
            animationDuration={1000}
            animationEasing="ease-out"
            barSize={20}
          >
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.color || CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
