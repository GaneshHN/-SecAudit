import { motion } from 'framer-motion'

export default function DashboardCard({ title, subtitle, children, className = '', delay = 0, icon: Icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={`
        relative overflow-hidden rounded-2xl
        bg-gradient-to-br from-slate-900/90 to-slate-900/70
        border border-slate-800/60
        backdrop-blur-sm
        shadow-lg shadow-black/20
        hover:border-slate-700/60 hover:shadow-xl hover:shadow-black/30
        transition-all duration-300
        ${className}
      `}
    >
      {/* Subtle top edge glow */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />

      {/* Header */}
      {title && (
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide">{title}</h3>
            {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {Icon && (
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800/80 text-slate-400">
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="px-6 pb-5">
        {children}
      </div>
    </motion.div>
  )
}
