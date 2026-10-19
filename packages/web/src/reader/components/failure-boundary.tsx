'use client'

import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react'

import type { LabFailurePageProps } from './lab-failure-page'
import { resolveErrorPresentation } from './resolve-error-presentation'

function KeepBaseline({ fallback }: LabFailurePageProps) {
  return fallback
}

// Module-level lazy keeps component identity stable and does not load until authorization succeeds.
const LabFailurePage = lazy(() =>
  import('./lab-failure-page').catch(() => ({ default: KeepBaseline })),
)

type FailureBoundaryProps = { readonly children: ReactNode } & (
  | { readonly kind: 'not-found' }
  | { readonly kind: 'error'; readonly error: Error; readonly reset: () => void }
)

/** Preserve the supplied fallback; only an authorized Lab selection loads presentation code. */
export function ReaderFailureBoundary(props: FailureBoundaryProps) {
  const identity = props.kind === 'error' ? props.error : props.kind
  // In not-found this is server-rendered content, carried as children rather than client code.
  const fallback = props.children
  const [resolved, setResolved] = useState<{
    identity: typeof identity
    directionId: string
  } | null>(null)

  // The Lab bar's actions change the selection and re-render the page from the server, which
  // brings new children: look the selection up again so Next, Previous and Exit take effect.
  useEffect(() => {
    let active = true
    async function resolve() {
      const selection = await resolveErrorPresentation()
      // Neither stale requests nor visitors load the registry or the Lab controls.
      if (!active) return
      setResolved(selection.lab ? { identity, directionId: selection.directionId } : null)
    }
    // A failed lookup leaves the fallback and its retry/home links usable.
    void resolve().catch(() => {})
    return () => {
      active = false
    }
  }, [identity, fallback])

  if (!resolved || resolved.identity !== identity) return fallback
  return (
    <Suspense fallback={fallback}>
      <LabFailurePage
        directionId={resolved.directionId}
        fallback={fallback}
        failure={
          props.kind === 'error' ? { kind: 'error', reset: props.reset } : { kind: 'not-found' }
        }
      />
    </Suspense>
  )
}
