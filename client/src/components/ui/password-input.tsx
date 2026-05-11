import * as React from 'react'
import { Eye, EyeOff } from 'lucide-react'

import { cn } from '@/lib/utils'

import { Input } from './input'

export type PasswordInputProps = Omit<React.ComponentProps<typeof Input>, 'type'>

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ className, disabled, ...props }, ref) {
    const [visible, setVisible] = React.useState(false)

    return (
      <div className="relative w-full">
        <Input
          ref={ref}
          type={visible ? 'text' : 'password'}
          disabled={disabled}
          className={cn(className, 'pr-11')}
          {...props}
        />
        <button
          type="button"
          disabled={disabled}
          tabIndex={-1}
          className={cn(
            'absolute top-1/2 right-2 z-1 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
            'disabled:pointer-events-none disabled:opacity-40'
          )}
          aria-label={visible ? 'Нууц үг нуух' : 'Нууц үг харуулах'}
          aria-pressed={visible}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOff className="size-[18px]" strokeWidth={2} aria-hidden /> : <Eye className="size-[18px]" strokeWidth={2} aria-hidden />}
        </button>
      </div>
    )
  }
)

export { PasswordInput }
