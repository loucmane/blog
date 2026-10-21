'use client'

import {
  Children,
  cloneElement,
  isValidElement,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

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

// Next keeps reset stable while replacing the failed subtree. A weak key isolates boundaries.
const pendingRetries = new WeakMap<() => void, object>()

// The app supplies an already-built fallback tree, so preserve its components and replace
// only the matching reset prop. A render-prop API would also require changing the app page.
/* eslint-disable @eslint-react/no-children-map, @eslint-react/no-clone-element -- Adapt the supplied fallback without rebuilding its presentation. */
function withRetry(children: ReactNode, reset: () => void, retry: () => void): ReactNode {
  return Children.map(children, (child) => {
    if (!isValidElement<{ children?: ReactNode; reset?: () => void }>(child)) return child
    if (child.props.reset === reset) return cloneElement(child, { reset: retry })
    if (child.props.children === undefined) return child
    return cloneElement(child, { children: withRetry(child.props.children, reset, retry) })
  })
}
/* eslint-enable @eslint-react/no-children-map, @eslint-react/no-clone-element */

function useRetryFocus(reset: (() => void) | undefined) {
  const rootRef = useRef<HTMLDivElement>(null)
  const ownerRef = useRef({})
  const restoringRef = useRef(false)
  const focusedMainRef = useRef<HTMLElement | null>(null)
  const retry = useCallback(() => {
    if (!reset) return
    pendingRetries.set(reset, ownerRef.current)
    reset()
  }, [reset])

  useLayoutEffect(() => {
    if (!reset || !rootRef.current) return
    const container = rootRef.current
    if (pendingRetries.has(reset)) {
      pendingRetries.delete(reset)
      restoringRef.current = true
    }
    const restore = () => {
      if (!restoringRef.current) return
      const document = container.ownerDocument
      if (
        document.activeElement !== document.body &&
        document.activeElement !== focusedMainRef.current
      ) {
        restoringRef.current = false
        return
      }
      const main = container.querySelector('main')
      if (!main || main === focusedMainRef.current) return
      main.tabIndex = -1
      focusedMainRef.current = main
      main.focus()
    }
    restore()
    // A lazy authorized Lab view can replace the focused baseline after the mount effect.
    const observer = new MutationObserver(restore)
    if (restoringRef.current) observer.observe(container, { childList: true, subtree: true })
    const retryOwner = ownerRef.current
    return () => {
      observer.disconnect()
      // A failed retry consumes this during the replacement mount's layout effect. If it
      // succeeded, discard it after this commit rather than focusing a later unrelated error.
      queueMicrotask(() => {
        if (pendingRetries.get(reset) === retryOwner) pendingRetries.delete(reset)
      })
    }
  }, [reset])

  return { rootRef, retry }
}

/** Preserve the supplied fallback; only an authorized Lab selection loads presentation code. */
export function ReaderFailureBoundary(props: FailureBoundaryProps) {
  const identity = props.kind === 'error' ? props.error : props.kind
  const { rootRef, retry } = useRetryFocus(props.kind === 'error' ? props.reset : undefined)
  // In not-found this is server-rendered content, carried as children rather than client code.
  const children = props.children
  const fallback = props.kind === 'error' ? withRetry(children, props.reset, retry) : children
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
  }, [identity, children])

  const view =
    !resolved || resolved.identity !== identity ? (
      fallback
    ) : (
      <Suspense fallback={fallback}>
        <LabFailurePage
          directionId={resolved.directionId}
          fallback={fallback}
          failure={props.kind === 'error' ? { kind: 'error', reset: retry } : { kind: 'not-found' }}
        />
      </Suspense>
    )

  return props.kind === 'error' ? (
    <div className="contents" ref={rootRef}>
      {view}
    </div>
  ) : (
    view
  )
}
