export const getWailsEventArg = <T = unknown>(event: any): T | null => {
  const data = event?.data
  if (Array.isArray(data)) {
    return (data[0] ?? null) as T | null
  }
  return (data ?? null) as T | null
}

export const parseWailsJson = <T = Record<string, any>>(value: unknown): T | null => {
  if (value == null) return null

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    try {
      return JSON.parse(trimmed) as T
    } catch {
      return null
    }
  }

  if (typeof value === 'object') {
    return value as T
  }

  return null
}
