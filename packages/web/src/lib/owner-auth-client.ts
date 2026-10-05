'use client'

import { passkeyClient } from '@better-auth/passkey/client'
import { createAuthClient } from 'better-auth/react'

export const ownerAuthClient = createAuthClient({ plugins: [passkeyClient()] })
