import { useCallback, useEffect, useState } from "react"

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
        },
        light() {
            document.documentElement.classList.remove(dark)
            setMode(light)
        }
    }
    return [mode, controller] as const
}