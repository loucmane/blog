import type { Page, TestInfo } from '@playwright/test'

type DiagnosticWindow = Window & {
  __llCaptureFonts?: {
    checkpoint: (stage: string) => void
    snapshots: unknown[]
  }
}

/** Capture-test evidence only: never loads a face or changes the page's layout. */
export async function observeCaptureFonts(page: Page) {
  await page.addInitScript(() => {
    const selector = '[data-reader-direction-fonts="literary-longread"]'
    const identities = new WeakMap<object, number>()
    let nextIdentity = 0
    const identity = (object: object) => {
      if (!identities.has(object)) identities.set(object, ++nextIdentity)
      return identities.get(object)!
    }
    const snapshots: unknown[] = []
    const checkpoint = (stage: string) => {
      snapshots.push({
        stage,
        time: performance.now(),
        readyState: document.readyState,
        dark: document.documentElement?.classList.contains('dark'),
        display: document.documentElement?.style.getPropertyValue('display'),
        styles: Array.from(document.querySelectorAll<HTMLStyleElement>(selector), (style) => ({
          id: identity(style),
          sheet: style.sheet ? identity(style.sheet) : null,
          textLength: style.textContent.length,
        })),
        faces: Array.from(document.fonts)
          .filter((face) => face.family.includes('reader-literary-longread__font-ll-'))
          .map((face) => ({
            id: identity(face),
            family: face.family,
            weight: face.weight,
            style: face.style,
            status: face.status,
          })),
      })
      if (snapshots.length > 100) snapshots.shift()
    }
    ;(window as DiagnosticWindow).__llCaptureFonts = { checkpoint, snapshots }
    const containsFontStyle = (node: Node) =>
      node instanceof Element
        ? node.matches(selector) || Boolean(node.querySelector(selector))
        : Boolean(node.parentElement?.closest(selector))
    new MutationObserver((mutations) => {
      if (
        mutations.some(
          (mutation) =>
            Boolean(
              (mutation.target instanceof Element
                ? mutation.target
                : mutation.target.parentElement
              )?.closest(selector),
            ) || [...mutation.addedNodes, ...mutation.removedNodes].some(containsFontStyle),
        )
      ) {
        checkpoint('font-style mutation')
      }
    }).observe(document, { childList: true, characterData: true, subtree: true })
    for (const event of ['loading', 'loadingdone', 'loadingerror']) {
      document.fonts.addEventListener(event, () => checkpoint(`fonts:${event}`))
    }
    document.addEventListener('DOMContentLoaded', () => checkpoint('DOMContentLoaded'))
    window.addEventListener('load', () => checkpoint('window load'))
  })

  return {
    checkpoint: (stage: string) =>
      page.evaluate((stage) => {
        ;(window as DiagnosticWindow).__llCaptureFonts?.checkpoint(stage)
      }, stage),
    async attach(testInfo: TestInfo, name: string) {
      const snapshots = await page.evaluate(
        () => (window as DiagnosticWindow).__llCaptureFonts?.snapshots ?? [],
      )
      await testInfo.attach(name, {
        body: JSON.stringify(snapshots, null, 2),
        contentType: 'application/json',
      })
    },
  }
}
