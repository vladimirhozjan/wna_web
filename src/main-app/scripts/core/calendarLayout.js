/**
 * Lays out overlapping calendar items side by side.
 *
 * Takes items with { id, top, height } and returns them with added
 * { column, totalColumns } so the caller can compute left/width.
 */
export function layoutOverlappingItems(items) {
  if (items.length === 0) return []

  // Sort by start (top), then longest first
  const sorted = [...items].sort((a, b) => a.top - b.top || b.height - a.height)

  // Build connected groups of overlapping items
  const groups = []
  let group = [sorted[0]]
  let groupEnd = sorted[0].top + sorted[0].height

  for (let i = 1; i < sorted.length; i++) {
    const item = sorted[i]
    if (item.top < groupEnd) {
      group.push(item)
      groupEnd = Math.max(groupEnd, item.top + item.height)
    } else {
      groups.push(group)
      group = [item]
      groupEnd = item.top + item.height
    }
  }
  groups.push(group)

  // Assign columns within each group
  const layout = new Map()

  for (const group of groups) {
    const columns = [] // each column is an array of items placed in it

    for (const item of group) {
      let placed = false
      for (let col = 0; col < columns.length; col++) {
        const last = columns[col][columns[col].length - 1]
        if (item.top >= last.top + last.height) {
          columns[col].push(item)
          layout.set(item.id, { column: col })
          placed = true
          break
        }
      }
      if (!placed) {
        columns.push([item])
        layout.set(item.id, { column: columns.length - 1 })
      }
    }

    const totalColumns = columns.length
    for (const item of group) {
      layout.get(item.id).totalColumns = totalColumns
    }
  }

  return items.map(item => ({
    ...item,
    ...layout.get(item.id),
  }))
}
