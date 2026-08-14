function valuesEqual(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, i) => item === b[i])
  }
  return a === b
}

/** Which top-level keys differ between two field objects — used to track what a student has actually typed. */
export function changedKeys<T extends object>(prev: T, next: T): (keyof T)[] {
  const prevRecord = prev as Record<string, unknown>
  const nextRecord = next as Record<string, unknown>
  const allKeys = Array.from(new Set([...Object.keys(prevRecord), ...Object.keys(nextRecord)]))
  return allKeys.filter((key) => !valuesEqual(prevRecord[key], nextRecord[key])) as (keyof T)[]
}

/**
 * Builds a source type's fields from scratch for a fresh autofill result: a field the student
 * has personally edited (`protectedKeys`) always keeps its current value; anything else is
 * taken from the new autofill result if provided, or reset to `blank` otherwise. This is a
 * full rebuild rather than a same-object merge specifically so that fields left over from a
 * *previous, different* autofill (and not addressed by the new one) don't linger — pasting a
 * new URL for the same source type should read as "start over", except for what the student
 * typed themselves.
 */
export function mergeAutofillFields<T extends object>(
  blank: T,
  current: T,
  autofillFields: Partial<T>,
  protectedKeys: ReadonlySet<string> = new Set(),
): T {
  const blankRecord = blank as Record<string, unknown>
  const currentRecord = current as Record<string, unknown>
  const autofillRecord = autofillFields as Record<string, unknown>

  const allKeys = Array.from(
    new Set([...Object.keys(blankRecord), ...Object.keys(currentRecord), ...Object.keys(autofillRecord)]),
  )

  const merged: Record<string, unknown> = { ...blankRecord }
  for (const key of allKeys) {
    if (protectedKeys.has(key)) {
      merged[key] = currentRecord[key]
      continue
    }
    const autofillValue = autofillRecord[key]
    if (autofillValue !== undefined) {
      merged[key] = autofillValue
    }
  }
  return merged as T
}
