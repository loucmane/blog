import type { BrowserContext } from '@playwright/test'

import { labIntroductionKeys } from '../../../packages/web/src/reader-lab/use-lab-introduction'

/** Exercise the existing comparison flows as a returning owner; tour specs keep fresh storage. */
export async function dismissReaderLabIntroductions(context: BrowserContext) {
  await context.addInitScript((keys) => {
    for (const key of Object.values(keys)) localStorage.setItem(key, 'dismissed')
  }, labIntroductionKeys)
}
