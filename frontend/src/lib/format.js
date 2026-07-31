export function formatToday() {
  return new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

export function formatTimeRange(startsAt, endsAt) {
  const opts = { hour: 'numeric', minute: '2-digit' }
  const start = new Date(startsAt).toLocaleTimeString(undefined, opts)
  const end = new Date(endsAt).toLocaleTimeString(undefined, opts)
  return `${start} - ${end}`
}

export function formatClassBadge(startsAt) {
  const diffMs = new Date(startsAt).getTime() - Date.now()
  const diffMins = Math.round(diffMs / 60000)
  if (diffMins > 0 && diffMins <= 60) return `In ${diffMins} mins`
  return new Date(startsAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export function formatDueLabel(dueAt) {
  const due = new Date(dueAt)
  const now = new Date()
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const dayDiff = Math.round((startOfDay(due) - startOfDay(now)) / (1000 * 60 * 60 * 24))
  const time = due.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

  if (dayDiff === 0) return `Due Today, ${time}`
  if (dayDiff === 1) return `Tomorrow, ${time}`
  return `${due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${time}`
}

export function formatPrice(price) {
  return `$${Number(price).toLocaleString()}`
}
