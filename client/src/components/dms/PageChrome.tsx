import { Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function PageHeaderDms({
  title,
  sub,
  crumbs,
  action,
}: {
  title: string
  sub?: string
  crumbs?: string[]
  action?: ReactNode
}) {
  return (
    <div className="page-hd-dms">
      {crumbs?.length ? (
        <div className="crumbs-dms">
          {crumbs.map((c, i) => (
            <span key={i}>
              {i > 0 ? <span className="crumbs-sep">·</span> : null}
              {c}
            </span>
          ))}
        </div>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1>{title}</h1>
          {sub ? <p className="sub">{sub}</p> : null}
        </div>
        {action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}
      </div>
    </div>
  )
}

export function DmsStatCard({
  label,
  value,
  delta,
  deltaTone,
  featured,
}: {
  label: string
  value: ReactNode
  delta?: string
  deltaTone?: 'up' | 'down'
  featured?: boolean
}) {
  return (
    <div className={cn('stat-card', featured && 'feat')}>
      <div className="lbl">{label}</div>
      <div className="val">{value}</div>
      {delta ? (
        <div className={cn('delta', deltaTone === 'up' && 'up', deltaTone === 'down' && 'down')}>
          {delta}
        </div>
      ) : null}
    </div>
  )
}

export function DmsBanner({
  variant = 'info',
  className,
  children,
}: {
  variant?: 'info' | 'warn' | 'ok'
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'banner',
        variant === 'warn' && 'warn',
        variant === 'ok' && 'ok',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function SectionTitleDms({ children }: { children: ReactNode }) {
  return <h2 className="section-title">{children}</h2>
}

export function QuickCardDms({
  to,
  icon,
  title,
  desc,
  cta,
}: {
  to: string
  icon: ReactNode
  title: string
  desc: string
  cta: string
}) {
  return (
    <Link to={to} className="quick-card-dms">
      <div className="quick-card-dms-icon">{icon}</div>
      <div className="quick-card-dms-title">{title}</div>
      <div className="quick-card-dms-desc">{desc}</div>
      <div className="quick-card-dms-cta">
        {cta} <span aria-hidden>→</span>
      </div>
    </Link>
  )
}

export type StepperLabel = { key?: string; label: string }

export function DmsStepper({ steps, currentIndex }: { steps: StepperLabel[]; currentIndex: number }) {
  return (
    <div className="stepper">
      {steps.map((s, i) => (
        <div
          key={s.key ?? i}
          className={cn('step', i < currentIndex && 'done', i === currentIndex && 'active')}
        >
          <div className="num">
            {i < currentIndex ? <Check className="size-3.5" strokeWidth={2.5} /> : i + 1}
          </div>
          <div>{s.label}</div>
          {i < steps.length - 1 ? <div className="bar" /> : null}
        </div>
      ))}
    </div>
  )
}
