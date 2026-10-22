'use client'

import { usePathname } from 'next/navigation'
import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  lazy,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
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

interface RecoveryScope {
  readonly pathname: string | null
  pending: WeakSet<() => void>
}

const RecoveryContext = createContext<RecoveryScope | null>(null)
const FailureContext = createContext(false)

/** Lives above Next's error/loading boundary without adding DOM or changing its children. */
export function ReaderRecoveryScope({ children }: { readonly children: ReactNode }) {
  const pathname = usePathname()
  const scope = useMemo<RecoveryScope>(() => ({ pathname, pending: new WeakSet() }), [pathname])

  useLayoutEffect(() => {
    // This listener survives a committed loading fallback. Moving focus cancels the
    // request even if that control is removed before the next error commits.
    const clear = () => {
      scope.pending = new WeakSet()
    }
    document.addEventListener('focusin', clear, true)
    return () => {
      document.removeEventListener('focusin', clear, true)
      clear()
    }
  }, [scope])

  return <RecoveryContext value={scope}>{children}</RecoveryContext>
}

/** A resolved reader commit confirms recovery; failure presentations cannot confirm it. */
export function ReaderRecoveryMarker() {
  const scope = useContext(RecoveryContext)
  const failure = useContext(FailureContext)
  useLayoutEffect(() => {
    if (scope && !failure) scope.pending = new WeakSet()
  }, [scope, failure])
  return null
}

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
  const scope = useContext(RecoveryContext)
  const rootRef = useRef<HTMLDivElement>(null)
  const restoringRef = useRef<RecoveryScope | null>(null)
  const focusedMainRef = useRef<HTMLElement | null>(null)
  const retry = useCallback(() => {
    if (!reset) return
    scope?.pending.add(reset)
    reset()
  }, [reset, scope])

  useLayoutEffect(() => {
    if (!scope || !reset || !rootRef.current) return
    const container = rootRef.current
    const document = container.ownerDocument
    if (scope.pending.has(reset)) {
      scope.pending.delete(reset)
      restoringRef.current = scope
    }
    const restore = () => {
      if (restoringRef.current !== scope) return
      if (
        document.activeElement !== document.body &&
        document.activeElement !== focusedMainRef.current
      ) {
        restoringRef.current = null
        return
      }
      const main = container.querySelector('main')
      if (!main || main === focusedMainRef.current) return
      main.tabIndex = -1
      focusedMainRef.current = main
      main.focus()
    }
    // A lazy authorized Lab view can replace the focused baseline after the mount effect.
    const observer = new MutationObserver(restore)
    const cancelOnFocusMove = (event: FocusEvent) => {
      if (event.target === focusedMainRef.current) return
      // Remember reader intent before a later replacement removes the focused control.
      restoringRef.current = null
      observer.disconnect()
      document.removeEventListener('focusin', cancelOnFocusMove, true)
    }
    if (restoringRef.current === scope) {
      document.addEventListener('focusin', cancelOnFocusMove, true)
      observer.observe(container, { childList: true, subtree: true })
      restore()
    }
    return () => {
      observer.disconnect()
      document.removeEventListener('focusin', cancelOnFocusMove, true)
    }
  }, [reset, scope])

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

  return (
    <FailureContext value={true}>
      {props.kind === 'error' ? (
        <div className="contents" ref={rootRef}>
          {view}
        </div>
      ) : (
        view
      )}
    </FailureContext>
  )
}
