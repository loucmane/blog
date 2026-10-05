// Seeds the Reader Lab sample magazine (North House) into the content store of a running web
// server, through the server's content services. Start the server first, with the same
// MAGAZINE_LAB_SEED_TOKEN in its environment, then run `pnpm --filter web lab:seed`.

const environment = process.env
const minimumTokenBytes = 32

async function main() {
  if (environment.NODE_ENV === 'production') {
    throw new Error('lab:seed refuses to run when NODE_ENV=production.')
  }
  const token = environment.MAGAZINE_LAB_SEED_TOKEN
  if (!token || Buffer.byteLength(token, 'utf8') < minimumTokenBytes) {
    throw new Error(
      `Set MAGAZINE_LAB_SEED_TOKEN (at least ${minimumTokenBytes} bytes) for both the web server and this command.`,
    )
  }
  const origin =
    environment.MAGAZINE_LAB_SEED_URL ??
    environment.MAGAZINE_RUNTIME_SITE_URL ??
    'http://localhost:3000'
  const endpoint = new URL('/api/internal/lab-seed', origin)

  let response
  try {
    response = await fetch(endpoint, {
      headers: { authorization: `Bearer ${token}` },
      method: 'POST',
    })
  } catch (error) {
    throw new Error(
      `Could not reach the web server at ${endpoint.origin}. Start it first (pnpm --filter web dev). ${error.message}`,
      { cause: error },
    )
  }
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(
      `The server refused the lab seed (HTTP ${response.status}): ${body?.error ?? 'no details'}. ` +
        'Check that the server runs outside production with the same MAGAZINE_LAB_SEED_TOKEN.',
    )
  }
  console.log(JSON.stringify(body, null, 2))
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
