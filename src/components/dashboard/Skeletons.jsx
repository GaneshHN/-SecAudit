import { motion } from 'framer-motion'

function SkeletonPulse({ className = '' }) {
  return (
    <div className={`animate-pulse rounded-lg bg-slate-800/60 ${className}`} />
  )
}

export function ChartSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <SkeletonPulse className="h-4 w-32" />
      <SkeletonPulse className="h-48 w-full rounded-xl" />
      <div className="flex gap-3">
        <SkeletonPulse className="h-3 w-16" />
        <SkeletonPulse className="h-3 w-16" />
        <SkeletonPulse className="h-3 w-16" />
      </div>
    </div>
  )
}

export function ScoreSkeleton() {
  return (
    <div className="flex flex-col items-center p-8 space-y-4">
      <div className="w-44 h-44 rounded-full animate-pulse bg-slate-800/60" />
      <SkeletonPulse className="h-3 w-24" />
    </div>
  )
}

export function ListSkeleton({ rows = 5 }) {
  return (
    <div className="p-6 space-y-3">
      <SkeletonPulse className="h-4 w-40 mb-4" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <SkeletonPulse className="h-8 w-8 rounded-md" />
          <div className="flex-1 space-y-1.5">
            <SkeletonPulse className="h-3 w-3/4" />
            <SkeletonPulse className="h-2.5 w-1/2" />
          </div>
          <SkeletonPulse className="h-6 w-12 rounded-md" />
        </div>
      ))}
    </div>
  )
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-3 p-2">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="p-4 rounded-xl bg-slate-800/30 space-y-2">
          <SkeletonPulse className="h-3 w-16" />
          <SkeletonPulse className="h-7 w-10" />
        </div>
      ))}
    </div>
  )
}
