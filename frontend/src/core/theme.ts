import { ThemeSetMode } from "@wailsjs/go/windowtheme/App"

/**
 *
 * @param select
 * @returns
 */
export const updateTheme = (select: boolean) => {
  if (select === true) {
    document.documentElement.classList.add('dark')
  ThemeSetMode('dark')
    return
  } else if (select === false) {
    document.documentElement.classList.remove('dark')
    ThemeSetMode('light')
    return
  }
  // 如果是暗黑模式 则添加 dark 类
  if (document.documentElement.classList.contains('dark')) {
    document.documentElement.classList.remove('dark')
   ThemeSetMode('light')
  } else {
    document.documentElement.classList.add('dark')
    ThemeSetMode('dark')
  }
}
