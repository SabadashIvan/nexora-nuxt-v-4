/**
 * Menu types for site navigation
 */

import { LinkTarget } from './enums'

export interface MenuItem {
  id: number
  title: string
  link: string
  target: LinkTarget | string
  css_class: string | null
  icon: string | null
  banner_desktop: string | null
  banner_mobile: string | null
  children: MenuItem[]
}

export interface MenuTreeResponse {
  data: MenuItem[]
}

