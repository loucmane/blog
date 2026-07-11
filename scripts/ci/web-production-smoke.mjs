import fs from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import { once } from 'node:events'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { pathToFileURL } from 'node:url'

export function validateHtmlResponse({ body, contentType, status }) {
  const errors = []
  if (status !== 200) {
    errors.push(`expected HTTP 200, received ${status}`)
  }
  if (!contentType.toLowerCase().startsWith('text/html')) {
    errors.push(`expected text/html, received ${contentType || '<missing>'}`)
  }
  if (body.length < 512) {
    errors.push(`expected a rendered document, received ${body.length} bytes`)
  }
  if (!/<html[\s>]/i.test(body) || !/<\/html>/i.test(body)) {
    errors.push('response is missing a complete HTML document')
  }
  return errors
}

async function reservePort() {
  const server = net.createServer()
  server.unref()
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  const port = typeof address === 'object' && address ? address.port : null
  await new Promise((resolve, reject) => server.close(error =>
    error ? reject(error) : resolve(),
  ))
  if (!port) {
    throw new Error('failed to allocate a production smoke-test port')
  }
  return port
}

function signalProcessGroup(child, signal) {
  if (process.platform === 'win32') {
    child.kill(signal)
    return
  }
  try {
    process.kill(-child.pid, signal)
  } catch {
    child.kill(signal)
  }
}

async function stopProcess(child, exitPromise) {
  if (child.exitCode !== null) {
    return
  }
  signalProcessGroup(child, 'SIGTERM')
  await Promise.race([exitPromise, delay(5_000)])
  if (child.exitCode === null) {
    signalProcessGroup(child, 'SIGKILL')
    await exitPromise
  }
}

async function main() {
  const port = Number(process.env.WEB_SMOKE_PORT) || await reservePort()
  const url = `http://127.0.0.1:${port}/`
  const webRoot = path.join(process.cwd(), 'packages/web')
  const nextCli = path.join(webRoot, 'node_modules/next/dist/bin/next')
  if (!fs.existsSync(nextCli)) {
    throw new Error(`Next CLI is missing at ${nextCli}; run the frozen install first`)
  }
  const child = spawn(
    process.execPath,
    [nextCli, 'start', '--hostname', '127.0.0.1', '--port', String(port)],
    {
      cwd: webRoot,
      detached: process.platform !== 'win32',
      env: { ...process.env, NODE_ENV: 'production' },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  )
  const exitPromise = once(child, 'exit')
  let stdout = ''
  let stderr = ''
  child.stdout.on('data', chunk => { stdout = `${stdout}${chunk}`.slice(-20_000) })
  child.stderr.on('data', chunk => { stderr = `${stderr}${chunk}`.slice(-20_000) })

  const deadline = Date.now() + 45_000
  let response
  let lastError
  try {
    while (Date.now() < deadline) {
      if (child.exitCode !== null) {
        throw new Error(`Next server exited ${child.exitCode}: ${stderr || stdout}`)
      }
      try {
        response = await fetch(url, { signal: AbortSignal.timeout(3_000) })
        break
      } catch (error) {
        lastError = error
        await delay(250)
      }
    }
    if (!response) {
      throw new Error(`Next server did not become ready: ${lastError?.message ?? 'timeout'}`)
    }

    const body = await response.text()
    const contentType = response.headers.get('content-type') ?? ''
    const errors = validateHtmlResponse({ body, contentType, status: response.status })
    const report = {
      bodyBytes: Buffer.byteLength(body),
      contentType,
      errors,
      generatedAt: new Date().toISOString(),
      status: errors.length === 0 ? 'passed' : 'failed',
      statusCode: response.status,
      url,
    }
    const artifactDirectory = path.join(process.cwd(), 'ci-artifacts')
    fs.mkdirSync(artifactDirectory, { recursive: true })
    fs.writeFileSync(
      path.join(artifactDirectory, 'web-production-smoke.json'),
      `${JSON.stringify(report, null, 2)}\n`,
    )
    console.log(JSON.stringify(report, null, 2))
    if (errors.length > 0) {
      process.exitCode = 1
    }
  } finally {
    await stopProcess(child, exitPromise)
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null
if (invokedPath && import.meta.url === pathToFileURL(invokedPath).href) {
  main().catch(error => {
    console.error(error.stack ?? error.message)
    process.exitCode = 1
  })
}
