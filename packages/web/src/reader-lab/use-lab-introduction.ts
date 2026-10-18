'use client'

import { useEffect, useState } from 'react'

export const labIntroductionKeys = {
  tour: 'magazine:reader-lab:tour:v1',
  bar: 'magazine:reader-lab:bar-help:v1',
} as const

/** Read only after hydration; a blocked storage API must never break the lab. */
export function useLabIntroduction(kind: keyof typeof labIntroductionKeys) {
  const [open, setOpen] = useState(false)
  const key = labIntroductionKeys[kind]

  useEffect(() => {
    try {
      if (window.localStorage.getItem(key)) return
      window.localStorage.setItem(key, 'seen')
    } catch {
      // Still offer help when this browser cannot persist preferences.
    }
    setOpen(true)
  }, [key])

  function changeOpen(next: boolean) {
    setOpen(next)
    try {
      window.localStorage.setItem(key, next ? 'seen' : 'dismissed')
    } catch {
      // Dismissal still works for this visit.
    }
  }

  return { open, changeOpen }
}
