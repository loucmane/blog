import { Temporal } from '@js-temporal/polyfill'

import { InvalidContentTransitionError } from '@/server/content/errors'

const localDateTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/

export function validateTimeZone(value: string): string {
  try {
    return Temporal.Now.zonedDateTimeISO(value).timeZoneId
  } catch {
    throw new InvalidContentTransitionError('Choose a valid publication time zone.')
  }
}

export function resolveScheduledPublication(input: {
  readonly localDateTime: string
  readonly now?: string
  readonly timeZone: string
}): string {
  if (!localDateTimePattern.test(input.localDateTime)) {
    throw new InvalidContentTransitionError('Choose a complete publication date and time.')
  }
  const [date, time] = input.localDateTime.split('T')
  const [year, month, day] = date!.split('-').map(Number)
  const [hour, minute] = time!.split(':').map(Number)
  let scheduled: Temporal.ZonedDateTime
  try {
    scheduled = Temporal.ZonedDateTime.from(
      {
        day: day!,
        hour: hour!,
        minute: minute!,
        month: month!,
        second: 0,
        timeZone: validateTimeZone(input.timeZone),
        year: year!,
      },
      { disambiguation: 'reject', overflow: 'reject' },
    )
  } catch {
    throw new InvalidContentTransitionError(
      'That local time does not exist or is ambiguous. Choose a different time.',
    )
  }
  const now = input.now ? Temporal.Instant.from(input.now) : Temporal.Now.instant()
  if (Temporal.Instant.compare(scheduled.toInstant(), now) <= 0) {
    throw new InvalidContentTransitionError('Choose a publication time in the future.')
  }
  return scheduled.toInstant().toString()
}
