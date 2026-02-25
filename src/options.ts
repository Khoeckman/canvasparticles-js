/** Helper functions for options parsing */

export function defaultIfNaN(value: number, defaultValue: number): number {
  return isNaN(+value) ? defaultValue : +value
}

export function parseNumericOption(
  name: string,
  value: number | undefined,
  defaultValue: number,
  clamp?: { min?: number; max?: number }
): number {
  if (value == undefined) return defaultValue

  const { min = -Infinity, max = Infinity } = clamp ?? {}

  if (value < min) {
    console.warn(`option.${name} was clamped to ${min} as ${value} is too low`)
  } else if (value > max) {
    console.warn(`option.${name} was clamped to ${max} as ${value} is too high`)
  }

  return defaultIfNaN(Math.min(Math.max(value ?? defaultValue, min), max), defaultValue)
}
