/** A deterministic pause for seed concurrency tests, without timer-based races. */
export function labSeedBarrier() {
  let resolve!: () => void
  const promise = new Promise<void>((done) => {
    resolve = done
  })
  return { promise, resolve }
}
