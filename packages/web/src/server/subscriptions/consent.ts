/**
 * The consent statement the subscription form shows, and its version. A submission names the version
 * the form showed, and its consent record keeps it, so every record says which words the person
 * agreed to. Changing the words means a new version; a form still showing the old one is refused
 * until it is reloaded, so nobody is recorded as agreeing to words they did not see.
 */
export const subscriptionConsent = {
  text: 'Send me the newsletter by email. I can unsubscribe at any time with the link in every email.',
  version: 'newsletter-2026-11-03',
} as const

/** Where consent was given when the form names no place of its own. */
export const defaultConsentSource = 'subscription-form'

const consentSourcePattern = /^[a-z0-9]+(?:[-/][a-z0-9]+)*$/
const maxConsentSourceLength = 64

/** A place a form may name as the source of a consent: a short lowercase path such as `home/footer`. */
export function isConsentSource(value: string): boolean {
  return value.length <= maxConsentSourceLength && consentSourcePattern.test(value)
}
