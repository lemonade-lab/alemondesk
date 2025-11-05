import { useCallback, useEffect, useState } from "react"
import { ThemeSetMode } from "@wailsjs/window/theme/app"

/**
 * 主题切换 Hook
 * @returns 
 */
export const useTheme = () => {
    const dark = 'dark'
    const light = 'light'
    const [mode, setMode] = useState(document.documentElement.classList.contains(dark) ? dark : light)
    const handleClassChange = useCallback(() => {
        const isDark = document.documentElement.classList.contains(dark)
        setMode(
            isDark ? dark : light
        )
    }, [])
    useEffect(() => {
        const observer = new MutationObserver(handleClassChange)
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        })
        // 首次同步
        handleClassChange()
        return () => observer.disconnect()
    }, [handleClassChange])
    const controller = {
        dark() {
            document.documentElement.classList.add(dark)
            setMode(dark)
            // TODO 同步向 webview 发送主题变更消息
            ThemeSetMode(dark)
        },
        light() {
            document.documentElement.classList.remove(dark)
            setMode(light)
            ThemeSetMode(light)
        }
    }
    return [mode, controller] as const
}