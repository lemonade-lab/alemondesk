import { CommandItem } from '@/views/types'

export const normalizePackageName = (name: unknown) => {
  const value = String(name ?? '').trim()
  if (!value) return ''
  return value.startsWith('@alemonjs/') ? value.slice('@alemonjs/'.length) : value
}

export const matchPackageName = (left: unknown, right: unknown) => {
  const leftValue = String(left ?? '').trim()
  const rightValue = String(right ?? '').trim()
  if (!leftValue || !rightValue) return false
  return (
    leftValue === rightValue ||
    normalizePackageName(leftValue) === normalizePackageName(rightValue)
  )
}

export const getDesktopMenus = (item: any): CommandItem[] =>
  item?.alemonjs?.desktop?.menus?.map((menu: CommandItem) => ({
    ...menu,
    command: menu.command ?? menu.commond ?? '',
    expansions_name: item.name
  })) || []

export const getDesktopSidebars = (item: any): CommandItem[] =>
  item?.alemonjs?.desktop?.sidebars?.map((sidebar: CommandItem) => ({
    ...sidebar,
    command: sidebar.command ?? sidebar.commond ?? '',
    expansions_name: item.name
  })) || []

export const hasDesktopEntry = (item: any) =>
  getDesktopMenus(item).length > 0 || getDesktopSidebars(item).length > 0
