import assert from 'node:assert/strict'
import test from 'node:test'

import { ESLint } from 'eslint'

const eslint = new ESLint({ cwd: new URL('../..', import.meta.url).pathname })

async function lintReact(source) {
  const [result] = await eslint.lintText(source, {
    filePath: 'packages/web/src/components/LintContract.tsx',
  })
  return result.messages
}

test('React semantic lint rejects a list item without a key', async () => {
  const messages = await lintReact(`
    export function MissingKey({ values }: { values: string[] }) {
      return <ul>{values.map((value) => <li>{value}</li>)}</ul>
    }
  `)

  assert.ok(messages.some((message) => message.ruleId === '@eslint-react/no-missing-key'))
})

test('React semantic lint accepts the equivalent keyed list', async () => {
  const messages = await lintReact(`
    export function Keyed({ values }: { values: string[] }) {
      return <ul>{values.map((value) => <li key={value}>{value}</li>)}</ul>
    }
  `)

  assert.equal(
    messages.filter((message) => message.ruleId === '@eslint-react/no-missing-key').length,
    0,
  )
})
