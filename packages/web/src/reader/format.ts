const publishedDateFormat = new Intl.DateTimeFormat('en', { dateStyle: 'long', timeZone: 'UTC' })

export function formatPublishedDate(isoTimestamp: string): string {
  return publishedDateFormat.format(new Date(isoTimestamp))
}

export function formatReadingTime(minutes: number): string {
  return `${minutes} min read`
}
