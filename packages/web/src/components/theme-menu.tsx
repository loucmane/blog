'use client'

import { Menu } from '@base-ui/react/menu'
import { Check, Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

const themeOptions = [
  {
    description: 'Follow the color preference set on this device.',
    icon: Monitor,
    label: 'System',
    value: 'system',
  },
  {
    description: 'Use the light editorial palette.',
    icon: Sun,
    label: 'Light',
    value: 'light',
  },
  {
    description: 'Use the dark editorial palette.',
    icon: Moon,
    label: 'Dark',
    value: 'dark',
  },
] as const

export interface ThemeMenuProps {
  className?: string
}

export function ThemeMenu({ className }: ThemeMenuProps) {
  const { resolvedTheme, setTheme, theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const selectedTheme = mounted && theme ? theme : 'system'
  const TriggerIcon = mounted && resolvedTheme === 'dark' ? Moon : Sun

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label="Choose color theme"
        className={cn(
          'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-semibold text-foreground shadow-sm',
          'transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          'disabled:cursor-wait disabled:opacity-70',
          className,
        )}
        data-slot="theme-menu-trigger"
        disabled={!mounted}
      >
        <TriggerIcon aria-hidden="true" className="size-4" />
        <span>Theme</span>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner align="end" className="z-50 outline-none" sideOffset={8}>
          <Menu.Popup
            aria-label="Color theme"
            className="w-64 origin-[var(--transform-origin)] rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl outline-none transition-[transform,scale,opacity] data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0"
            data-slot="theme-menu-content"
          >
            <Menu.Group>
              <Menu.GroupLabel className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Appearance
              </Menu.GroupLabel>
              <Menu.RadioGroup value={selectedTheme} onValueChange={setTheme}>
                {themeOptions.map((option) => {
                  const Icon = option.icon
                  return (
                    <Menu.RadioItem
                      aria-label={`${option.label} theme`}
                      className="grid cursor-default grid-cols-[1.25rem_1fr_1.25rem] items-center gap-2 rounded-lg px-3 py-2.5 text-sm outline-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                      key={option.value}
                      value={option.value}
                    >
                      <Icon aria-hidden="true" className="size-4" />
                      <span>
                        <span className="block font-semibold">{option.label}</span>
                        <span className="block text-xs leading-5 text-muted-foreground">
                          {option.description}
                        </span>
                      </span>
                      <Menu.RadioItemIndicator>
                        <Check aria-hidden="true" className="size-4" />
                      </Menu.RadioItemIndicator>
                    </Menu.RadioItem>
                  )
                })}
              </Menu.RadioGroup>
            </Menu.Group>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
