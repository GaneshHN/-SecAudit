import { getSeverityColor } from '../utils/helpers'

export default function SeverityBadge({ level }) {
  const colors = getSeverityColor(level)

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} shadow-[0_0_8px_currentColor]`} />
      {level}
    </span>
  )
}
