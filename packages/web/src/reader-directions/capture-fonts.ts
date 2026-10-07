import { expect, type Page } from '@playwright/test'

/** Screenshot-only first-layout gate. Never used by performance or visitor tests. */
export async function prepareFontCapture(
  page: Page,
  root: string,
  families: Readonly<Record<`--${string}`, string>>,
) {
  // optional fonts cannot replace a painted fallback. A reload also revalidates
  // public fonts (max-age=0), so fonts.ready + reload is not a warm-cache guarantee.
  // Hold layout in each capture document, load its real CSS faces, then reveal it.
  await page.addInitScript(() => {
    const hide = () => {
      if (!document.documentElement) return false
      document.documentElement.style.setProperty('display', 'none', 'important')
      return true
    }
    if (hide()) return
    const observer = new MutationObserver(() => {
      if (hide()) observer.disconnect()
    })
    observer.observe(document, { childList: true })
  })

  const cdp = await page.context().newCDPSession(page)
  await cdp.send('DOM.enable')
  await cdp.send('CSS.enable')

  return {
    async goto(route: string) {
      await page.goto(route)
      await page.locator(root).waitFor({ state: 'attached' })
      await page.evaluate(
        async ({ root, variables }) => {
          if (document.documentElement.style.getPropertyValue('display') !== 'none') {
            throw new Error('Capture font loading must precede the first layout')
          }
          const element = document.querySelector(root)!
          const style = getComputedStyle(element)
          const names = variables.map((variable) =>
            style.getPropertyValue(variable).split(',')[0]!.trim().replaceAll('"', ''),
          )
          const faces = Array.from(document.fonts).filter((face) =>
            names.includes(face.family.replaceAll('"', '')),
          )
          for (const name of names) {
            if (!name || !faces.some((face) => face.family.replaceAll('"', '') === name)) {
              throw new Error(`Missing capture font face: ${name}`)
            }
          }
          await Promise.all(faces.map((face) => face.load()))
          await document.fonts.ready
          document.documentElement.style.removeProperty('display')
        },
        { root, variables: Object.keys(families) },
      )
      await expect(page.locator(root)).toBeVisible()
    },

    async assertFonts() {
      const probes = await page.evaluate(
        async ({ root, families }) => {
          await document.fonts.ready
          const element = document.querySelector(root)!
          const style = getComputedStyle(element)
          const names = Object.entries(families).map(([variable, nativeName]) => ({
            family: style.getPropertyValue(variable).split(',')[0]!.trim().replaceAll('"', ''),
            nativeName,
          }))
          for (const { family } of names) {
            const faces = Array.from(document.fonts).filter(
              (face) => face.family.replaceAll('"', '') === family,
            )
            if (!faces.length) throw new Error(`Missing capture font family: ${family}`)
            for (const face of faces) {
              const spec = `${face.style} ${face.weight} 16px "${family}"`
              if (face.status !== 'loaded' || !document.fonts.check(spec)) {
                throw new Error(`Capture font is not loaded: ${spec}`)
              }
            }
          }

          // Inspect real text in every used family/weight/style, not synthetic probes.
          const probes = new Map<string, { selector: string; nativeName: string }>()
          for (const node of element.querySelectorAll('[data-capture-font-probe]')) {
            node.removeAttribute('data-capture-font-probe')
          }
          for (const node of element.querySelectorAll<HTMLElement>('*')) {
            if (
              !node.checkVisibility() ||
              !Array.from(node.childNodes).some(
                (child) =>
                  child.nodeType === Node.TEXT_NODE && /[a-z]/i.test(child.textContent ?? ''),
              )
            )
              continue
            const computed = getComputedStyle(node)
            const family = computed.fontFamily.split(',')[0]!.trim().replaceAll('"', '')
            const name = names.find((name) => name.family === family)
            if (!name) {
              if (node.closest('h1, h2, h3, h4, h5, h6')) {
                throw new Error(`Heading inherits an unexpected font: ${computed.fontFamily}`)
              }
              continue // The lab bar and intentionally generic code fonts are outside this check.
            }
            const spec = `${family} ${computed.fontWeight} ${computed.fontStyle}`
            if (probes.has(spec)) continue
            const id = String(probes.size)
            node.setAttribute('data-capture-font-probe', id)
            probes.set(spec, {
              selector: `${root} [data-capture-font-probe="${id}"]`,
              nativeName: name.nativeName,
            })
          }
          for (const { nativeName } of names) {
            if (!Array.from(probes.values()).some((probe) => probe.nativeName === nativeName)) {
              throw new Error(`No rendered text uses capture font: ${nativeName}`)
            }
          }
          return Array.from(probes.values())
        },
        { root, families },
      )

      // fonts.check() proves availability, not which face painted the text. CDP
      // catches a latched optional fallback, including metric-adjusted local faces.
      const { root: documentNode } = await cdp.send('DOM.getDocument')
      for (const { selector, nativeName } of probes) {
        const { nodeId } = await cdp.send('DOM.querySelector', {
          nodeId: documentNode.nodeId,
          selector,
        })
        const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId })
        const normalize = (name: string) => name.replace(/[^a-z]/gi, '').toLowerCase()
        expect(
          fonts.some(
            (font) =>
              font.isCustomFont &&
              font.glyphCount > 0 &&
              normalize(font.familyName).startsWith(normalize(nativeName)),
          ),
          `${selector} must render ${nativeName}, received ${JSON.stringify(fonts)}`,
        ).toBe(true)
      }
    },
  }
}
