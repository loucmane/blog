import type { Metadata } from 'next'

import { DesignLab } from '@/components/owner/design-lab'
import { requireOwnerPageSession } from '@/server/owner/session'

import './design-lab.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: 'Owner Studio Design Lab',
}

export default async function DesignLabPage() {
  await requireOwnerPageSession()
  return <DesignLab />
}
