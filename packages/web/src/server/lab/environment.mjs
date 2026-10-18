/**
 * Hosted seeds require explicit Preview intent. Provider signals can veto that intent;
 * NODE_ENV describes the runtime, so it cannot distinguish a hosted Preview from production.
 * Unmarked local labs keep their existing development/test behavior.
 * @param {Readonly<Record<string, string | undefined>>} environment
 */
export function labSeedAllowed(environment = process.env) {
  const providerSignals = [environment.VERCEL_ENV, environment.VERCEL_TARGET_ENV]
  if (providerSignals.some((value) => value !== undefined && value !== 'preview')) return false

  const deployment = environment.MAGAZINE_DEPLOYMENT_ENVIRONMENT
  if (deployment !== undefined) return deployment === 'preview'

  return (
    environment.NODE_ENV !== 'production' &&
    environment.VERCEL !== '1' &&
    providerSignals.every((value) => value === undefined)
  )
}
