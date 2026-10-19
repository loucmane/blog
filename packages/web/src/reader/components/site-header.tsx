import { ThemeMenu } from '@/components/theme-menu'

import { SiteHeaderFrame, type SiteHeaderFrameProps } from './site-header-frame'

export { siteName } from './site-header-frame'

export function SiteHeader(props: Omit<SiteHeaderFrameProps, 'children'>) {
  return (
    <SiteHeaderFrame {...props}>
      <ThemeMenu />
    </SiteHeaderFrame>
  )
}
