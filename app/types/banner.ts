/**
 * Banner types for homepage slideshow
 */

export interface Banner {
  id: number
  type: number
  title: string
  url: string
  desktop_image: string
  mobile_image: string
  position: number
}

export interface BannersResponse {
  data: Banner[]
}
