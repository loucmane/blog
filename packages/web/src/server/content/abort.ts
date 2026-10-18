/** Bound even an adapter that ignores cancellation; always observe its eventual rejection. */
export async function abortable<T>(
  signal: AbortSignal | undefined,
  work: () => Promise<T>,
): Promise<T> {
  if (!signal) return work()
  signal.throwIfAborted()
  let onAbort!: () => void
  const aborted = new Promise<never>((_resolve, reject) => {
    onAbort = () => reject(signal.reason)
    signal.addEventListener('abort', onAbort, { once: true })
  })
  try {
    return await Promise.race([aborted, work()])
  } finally {
    signal.removeEventListener('abort', onAbort)
  }
}
