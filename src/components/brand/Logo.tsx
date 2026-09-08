import { cn } from '@/lib/utils'

// Vector approximation of the Mindshift mark (chevron "M" + diagonal "S" swoosh)
// in the brand colors, sized for compact UI use (sidebar badge, login badge,
// favicon-scale contexts). Swap for the exact exported asset when available.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={cn('size-8', className)} aria-hidden="true">
      <path
        d="M10 62 L34 20 L50 46 L66 20 L90 62"
        fill="none"
        stroke="#712c30"
        strokeWidth="13"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M27 47 L74 90" fill="none" stroke="#010101" strokeWidth="13" strokeLinecap="round" />
    </svg>
  )
}

export function LogoWordmark({ className, tagline = true }: { className?: string; tagline?: boolean }) {
  return (
    <div className={cn('flex flex-col', className)}>
      <p className="text-xl leading-none font-extrabold tracking-tight">
        <span className="text-[#010101]">MIND</span>
        <span className="text-[#712c30]">SHIFT</span>
      </p>
      {tagline && (
        <p className="mt-1 text-[10px] font-medium tracking-[0.2em] text-[#010101] uppercase">
          Consultancy and Services
        </p>
      )}
    </div>
  )
}
