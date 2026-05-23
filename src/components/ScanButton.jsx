import { Loader2, Search } from 'lucide-react'

export default function ScanButton({ loading, disabled, onClick, children, className = '' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        relative flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all duration-300
        ${disabled || loading 
          ? 'bg-surface-800 text-surface-500 cursor-not-allowed border border-surface-700' 
          : 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] hover:-translate-y-0.5 active:translate-y-0 border border-brand-400/30'
        }
        ${className}
      `}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Analyzing...
        </>
      ) : (
        <>
          <Search className="w-4 h-4" />
          {children || 'Start Scan'}
        </>
      )}
    </button>
  )
}
