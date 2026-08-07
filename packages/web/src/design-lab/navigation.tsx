import type { MouseEvent } from 'react'

import type { DesignLabDirection, DesignLabView } from './types'

const designLabViews = new Set<DesignLabView>(['desk', 'reader', 'write'])

export interface DesignLabDirectionGroup {
  readonly directions: readonly DesignLabDirection[]
  readonly key: string
  readonly label: string
}

export interface DesignLabNavigationState {
  readonly directionId: string | null
  readonly notice: string | null
  readonly view: DesignLabView
}

export type DesignLabNavigationDestination =
  | { readonly kind: 'index' }
  | {
      readonly directionId: string
      readonly kind: 'direction'
      readonly view: DesignLabView
    }

function roundNumber(collection: string): number {
  const match = /^Round (\d+)/.exec(collection)
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER
}

function groupLabel(collection: string): string {
  const round = roundNumber(collection)
  return round >= 1 && round <= 3 ? `Round ${round} · Archive` : collection
}

function isDesignLabView(value: string | null): value is DesignLabView {
  return value !== null && designLabViews.has(value as DesignLabView)
}

export function groupDesignLabDirections(
  directions: readonly DesignLabDirection[],
): readonly DesignLabDirectionGroup[] {
  const ordered = [...directions].sort((left, right) => {
    const roundDifference =
      roundNumber(left.metadata.collection) - roundNumber(right.metadata.collection)
    return (
      roundDifference ||
      left.metadata.order.localeCompare(right.metadata.order, undefined, { numeric: true })
    )
  })
  const groups = new Map<string, DesignLabDirectionGroup>()
  for (const direction of ordered) {
    const key = direction.metadata.collection
    const current = groups.get(key)
    groups.set(key, {
      directions: [...(current?.directions ?? []), direction],
      key,
      label: groupLabel(key),
    })
  }
  return [...groups.values()]
}

export function orderedDesignLabDirections(
  groups: readonly DesignLabDirectionGroup[],
): readonly DesignLabDirection[] {
  return groups.flatMap(({ directions }) => directions)
}

export function adjacentDesignLabDirections(
  directions: readonly DesignLabDirection[],
  directionId: string,
): Readonly<{ next: DesignLabDirection; previous: DesignLabDirection }> {
  const index = directions.findIndex(({ id }) => id === directionId)
  if (index < 0 || directions.length === 0) {
    throw new RangeError(`Unknown design-lab direction "${directionId}"`)
  }
  return {
    next: directions[(index + 1) % directions.length]!,
    previous: directions[(index - 1 + directions.length) % directions.length]!,
  }
}

export function resolveDesignLabNavigation(
  search: string,
  knownDirectionIds: ReadonlySet<string>,
): DesignLabNavigationState {
  const parameters = new URLSearchParams(search)
  const requestedDirection = parameters.get('direction')
  const requestedView = parameters.get('view')

  if (requestedDirection === null) {
    return {
      directionId: null,
      notice:
        requestedView === null
          ? null
          : `“${requestedView}” needs a direction. Showing all directions.`,
      view: 'desk',
    }
  }
  if (!knownDirectionIds.has(requestedDirection)) {
    return {
      directionId: null,
      notice: `“${requestedDirection}” isn’t a direction. Showing all directions.`,
      view: 'desk',
    }
  }
  if (requestedView !== null && !isDesignLabView(requestedView)) {
    return {
      directionId: requestedDirection,
      notice: `“${requestedView}” isn’t a view. Showing the desk view.`,
      view: 'desk',
    }
  }
  return {
    directionId: requestedDirection,
    notice: null,
    view: requestedView ?? 'desk',
  }
}

export function createDesignLabNavigationHref(
  currentHref: string,
  destination: DesignLabNavigationDestination,
): string {
  const location = new URL(currentHref)
  location.hash = ''
  if (destination.kind === 'index') {
    location.searchParams.delete('direction')
    location.searchParams.delete('view')
  } else {
    location.searchParams.set('direction', destination.directionId)
    location.searchParams.set('view', destination.view)
  }
  return `${location.pathname}${location.search}`
}

export function normalizeLegacyDesignLabHash(currentHref: string): string | null {
  const location = new URL(currentHref)
  const match = /^#([^/]+)\/([^/]+)$/.exec(location.hash)
  if (!match) return null
  if (!location.searchParams.has('direction')) location.searchParams.set('direction', match[1]!)
  if (!location.searchParams.has('view')) location.searchParams.set('view', match[2]!)
  location.hash = ''
  return `${location.pathname}${location.search}`
}

interface DesignLabIndexProps {
  readonly groups: readonly DesignLabDirectionGroup[]
  readonly hrefForDirection: (directionId: string) => string
  readonly notice: string | null
  readonly onDirection: (direction: DesignLabDirection) => void
}

export function DesignLabIndex({
  groups,
  hrefForDirection,
  notice,
  onDirection,
}: DesignLabIndexProps) {
  const directionCount = orderedDesignLabDirections(groups).length

  return (
    <section className="design-lab-index" aria-labelledby="design-lab-index-title">
      <header className="design-lab-index-header">
        <p className="design-lab-mono-label">The Index · {directionCount} directions</p>
        <h1 id="design-lab-index-title">All directions</h1>
        <p>
          One protected publishing journey, arranged as an index of the visual systems explored so
          far.
        </p>
      </header>
      {notice ? (
        <p className="design-lab-state-notice" role="status">
          {notice}
        </p>
      ) : null}
      <div className="design-lab-index-groups">
        {groups.map((group) => (
          <section className="design-lab-index-group" key={group.key}>
            <h2>{group.label}</h2>
            <div className="design-lab-index-list">
              {group.directions.map((direction) => (
                <a
                  aria-label={`${direction.metadata.name} — ${direction.metadata.collection}`}
                  className="design-lab-index-card"
                  data-testid={`design-lab-card-${direction.id}`}
                  href={hrefForDirection(direction.id)}
                  key={direction.id}
                  onClick={(event: MouseEvent<HTMLAnchorElement>) => {
                    event.preventDefault()
                    onDirection(direction)
                  }}
                >
                  <span className="design-lab-index-order">{direction.metadata.order}</span>
                  <span className="design-lab-index-copy">
                    <small>{direction.metadata.collection}</small>
                    <strong>{direction.metadata.name}</strong>
                    <span>{direction.metadata.thesis}</span>
                  </span>
                  <span aria-hidden="true" className="design-lab-index-arrow">
                    ↗
                  </span>
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  )
}

interface DesignLabNavigationProps {
  readonly announcement: string
  readonly connection: string
  readonly direction: DesignLabDirection | null
  readonly groups: readonly DesignLabDirectionGroup[]
  readonly indexHref: string
  readonly onDirection: (direction: DesignLabDirection) => void
  readonly onIndex: () => void
  readonly onNotes: () => void
  readonly onView: (view: DesignLabView) => void
  readonly view: DesignLabView
}

export function DesignLabNavigation({
  announcement,
  connection,
  direction,
  groups,
  indexHref,
  onDirection,
  onIndex,
  onNotes,
  onView,
  view,
}: DesignLabNavigationProps) {
  const directions = orderedDesignLabDirections(groups)
  const adjacent = direction ? adjacentDesignLabDirections(directions, direction.id) : null

  return (
    <nav className="design-lab-controls" aria-label="Design lab directions">
      <div className="design-lab-nav-identity">
        <a aria-label="Owner workspace" className="design-lab-home-mark" href="/owner">
          NH
        </a>
        <div className="design-lab-current">
          <a
            className="design-lab-index-link"
            href={indexHref}
            onClick={(event) => {
              event.preventDefault()
              onIndex()
            }}
          >
            Index
          </a>
          <span>
            <small>
              {direction
                ? `${direction.metadata.order} · ${direction.metadata.collection}`
                : `${directions.length} registered directions`}
            </small>
            <strong>{direction?.metadata.name ?? 'All directions'}</strong>
          </span>
        </div>
      </div>

      <div className="design-lab-nav-traverse">
        <div className="design-lab-stepper">
          <button
            aria-label={
              adjacent
                ? `Previous direction: ${adjacent.previous.metadata.name}`
                : 'Previous direction'
            }
            disabled={!adjacent}
            onClick={() => adjacent && onDirection(adjacent.previous)}
            type="button"
          >
            <span aria-hidden="true">←</span>
            <span>Previous</span>
          </button>
          <button
            aria-label={
              adjacent ? `Next direction: ${adjacent.next.metadata.name}` : 'Next direction'
            }
            disabled={!adjacent}
            onClick={() => adjacent && onDirection(adjacent.next)}
            type="button"
          >
            <span>Next</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
        <label className="design-lab-direction-picker">
          <span>
            <b>{direction?.metadata.order ?? '—'}</b>
            <small>{directions.length} directions</small>
          </span>
          <select
            aria-label="Visual direction"
            onChange={(event) => {
              const candidate = directions.find(({ id }) => id === event.target.value)
              if (candidate) onDirection(candidate)
              else onIndex()
            }}
            value={direction?.id ?? ''}
          >
            <option value="">All directions</option>
            {groups.map((group) => (
              <optgroup key={group.key} label={group.label}>
                {group.directions.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.metadata.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
      </div>

      <div className="design-lab-nav-actions">
        <div className="design-lab-segment" aria-label="Experience view">
          {(['desk', 'write', 'reader'] as const).map((candidate) => (
            <button
              aria-pressed={direction ? candidate === view : false}
              className={direction && candidate === view ? 'active' : ''}
              disabled={!direction}
              key={candidate}
              onClick={() => onView(candidate)}
              type="button"
            >
              {candidate}
            </button>
          ))}
        </div>
        <div className="design-lab-nav-utility">
          <span
            aria-label={connection}
            className="design-lab-connection"
            data-testid="design-lab-connection"
            role="status"
          >
            <i className="size-2 rounded-full bg-emerald-400" />
            <span>{connection}</span>
          </span>
          <button
            className="design-lab-control-button"
            disabled={!direction}
            onClick={onNotes}
            type="button"
          >
            Direction notes +
          </button>
        </div>
      </div>
      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
    </nav>
  )
}
