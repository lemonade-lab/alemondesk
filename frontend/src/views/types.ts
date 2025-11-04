export type PackageInfoType = {
  [key: string]: any
  'name': string
  'description': string
  'author':
    | string
    | {
        name: string
        email: string
        url: string
      }
    | null
  'dist-tags': { latest: string }
  'version': string
  'readme': string
  '__logo'?: string | null
  '__logo_url'?: string | null
  '__icon'?: string | null
}

export interface CommandItem {
  expansions_name: string
  name: string
  icon: string
  commond?: string
  command: string
}

export interface ControllerItem {
  position: 'left' | 'right'
  icon: string
  commond?: string
  command: string
}