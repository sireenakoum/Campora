import { supabase } from './supabase'
import * as pdfjsLib from 'pdfjs-dist'
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc

const CAMPORA_COLORS = [
  '#E1F2FF',
  '#FCE4EF',
  '#EEE2FF',
  '#FFDCD7',
  '#FFEACA',
  '#CDF7F8',
  '#D3F8E2',
  '#DCE6FF',
  '#002D62'
]

const MAX_IMPORT_ROWS = 400

const DAY_TO_ABBR = {
  0: 'SU',
  1: 'MO',
  2: 'TU',
  3: 'WE',
  4: 'TH',
  5: 'FR',
  6: 'SA'
}

const pad2 = (num) => String(num).padStart(2, '0')

export const formatImportDate = (date) =>
  [
    date.getFullYear(),
    pad2(date.getMonth() + 1),
    pad2(date.getDate())
  ].join('-')

export const getDefaultScheduleEndDate = () => {
  const date = new Date()
  date.setMonth(date.getMonth() + 3)
  return formatImportDate(date)
}

const toHHMM = (date) => `${pad2(date.getHours())}:${pad2(date.getMinutes())}`

const addMinutesToTime = (time, minutes) => {
  const [hours, mins] = String(time).split(':').map(Number)
  const total = (hours || 0) * 60 + (mins || 0) + minutes
  return `${pad2(Math.floor(total / 60) % 24)}:${pad2(total % 60)}`
}

const normalizeTime = (value) => {
  if (!value) return null
  const match = String(value)
    .trim()
    .toLowerCase()
    .match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/)
  if (!match) return null
  let hours = parseInt(match[1], 10)
  const minutes = parseInt(match[2], 10)
  if (minutes > 59) return null
  if (match[3] === 'pm' && hours < 12) hours += 12
  if (match[3] === 'am' && hours === 12) hours = 0
  if (hours > 23) return null
  return `${pad2(hours)}:${pad2(minutes)}`
}

const isDateLike = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || '')

const startDateFrom = (dateStr, fallback) => {
  if (!dateStr) return fallback
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return isNaN(date.getTime()) ? fallback : date
}

const cryptoUUID = () =>
  globalThis.crypto?.randomUUID?.() ||
  `planner-${Date.now()}-${Math.random().toString(16).slice(2)}`

// ---------------------------------------------------------------
// ICS parsing
// ---------------------------------------------------------------

const parseICSDateTime = (value) => {
  if (!value) return null
  const isUTC = /Z$/i.test(value)
  const clean = value.replace(/Z$/i, '')
  const datePart = clean.slice(0, 8)
  const timePart = clean.slice(9, 15)
  const year = parseInt(datePart.slice(0, 4), 10)
  const month = parseInt(datePart.slice(4, 6), 10) - 1
  const day = parseInt(datePart.slice(6, 8), 10)
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null
  if (isUTC && timePart.length === 6) {
    return new Date(
      Date.UTC(
        year,
        month,
        day,
        parseInt(timePart.slice(0, 2), 10) || 0,
        parseInt(timePart.slice(2, 4), 10) || 0
      )
    )
  }
  const date = new Date(year, month, day)
  if (timePart.length === 6) {
    date.setHours(
      parseInt(timePart.slice(0, 2), 10) || 0,
      parseInt(timePart.slice(2, 4), 10) || 0,
      0,
      0
    )
  }
  return date
}

const decodeICSValue = (value) =>
  String(value || '')
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')

const parseICS = (text) => {
  const unfolded = String(text).replace(/\r?\n[ \t]/g, '')
  const blocks = unfolded.split(/BEGIN:VEVENT/i)
  const events = []

  for (let i = 1; i < blocks.length; i++) {
    const endIndex = blocks[i].search(/END:VEVENT/i)
    const body =
      endIndex === -1 ? blocks[i] : blocks[i].slice(0, endIndex)
    const props = {}

    for (const line of body.split(/\r?\n/)) {
      if (!line.trim()) continue
      const colon = line.indexOf(':')
      if (colon === -1) continue
      const name = line.slice(0, colon).trim().toUpperCase().split(';')[0]
      const value = line.slice(colon + 1).trim()
      if (!props[name]) props[name] = []
      props[name].push(value)
    }

    const start = parseICSDateTime(props.DTSTART && props.DTSTART[0])
    if (!start) continue

    const end = parseICSDateTime(props.DTEND && props.DTEND[0])
    const startTime = toHHMM(start)
    const endTime = end ? toHHMM(end) : addMinutesToTime(startTime, 60)

    events.push({
      name:
        decodeICSValue((props.SUMMARY && props.SUMMARY[0]) || '') ||
        'Untitled Event',
      description: decodeICSValue(
        (props.DESCRIPTION && props.DESCRIPTION[0]) || ''
      ),
      date: formatImportDate(start),
      start_time: startTime,
      end_time: endTime,
      rrule: (props.RRULE && props.RRULE[0]) || ''
    })
  }

  return events
}

// ---------------------------------------------------------------
// CSV parsing (Name, Day(s)/Date, Start Time, End Time)
// ---------------------------------------------------------------

const splitCSVLine = (line) => {
  const values = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  values.push(current.trim())
  return values
}

const parseDaysField = (value) => {
  const fullNames = {
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
    SUNDAY: 0
  }
  const abbreviations = {
    MON: 1,
    TUE: 2,
    WED: 3,
    THU: 4,
    THUR: 4,
    TH: 4,
    FRI: 5,
    SAT: 6,
    SUN: 0
  }
  const singleLetters = { M: 1, T: 2, W: 3, F: 5, S: 6, R: 4 }
  const up = String(value || '').toUpperCase().trim()
  if (!up) return []

  const parts = up.split(/[^A-Z]+/).filter(Boolean)
  const days = []

  if (parts.length > 1) {
    for (const part of parts) {
      const day =
        fullNames[part] !== undefined
          ? fullNames[part]
          : abbreviations[part]
      if (day !== undefined) days.push(day)
    }
  } else {
    let i = 0
    while (i < up.length) {
      if (up.slice(i, i + 2) === 'TH') {
        days.push(4)
        i += 2
        continue
      }
      if (singleLetters[up[i]] !== undefined) days.push(singleLetters[up[i]])
      i++
    }
  }

  return [...new Set(days)]
}

const parseCSV = (text) => {
  const lines = String(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  const events = []

  const isHeader = (cols) =>
    /^(name|course|class|title|subject)$/i.test(cols[0] || '') &&
    /(day|date)/i.test(cols[1] || '')

  lines.forEach((line, index) => {
    const cols = splitCSVLine(line)
    if (cols.length < 3) return
    const name = cols[0].trim()
    if (!name) return
    if (index === 0 && isHeader(cols)) return

    const start = normalizeTime(cols[2])
    if (!start) return
    const end = normalizeTime(cols[3]) || addMinutesToTime(start, 60)
    const second = cols[1].trim()

    events.push({
      name,
      description: '',
      date: isDateLike(second) ? second : '',
      start_time: start,
      end_time: end,
      dayField: isDateLike(second) ? '' : second,
      rrule: ''
    })
  })

  return events
}

// ---------------------------------------------------------------
// Conversion to planner rows
// ---------------------------------------------------------------

const parseRRULE = (rrule) => {
  const parts = {}
  for (const segment of String(rrule || '').split(';')) {
    const index = segment.indexOf('=')
    if (index === -1) continue
    parts[segment.slice(0, index).toUpperCase()] = segment.slice(index + 1)
  }
  return {
    freq: parts.FREQ || '',
    byDay: (parts.BYDAY || '')
      .split(',')
      .map((day) => day.trim().toUpperCase())
      .filter(Boolean),
    until: parseICSDateTime(parts.UNTIL),
    count: parts.COUNT ? parseInt(parts.COUNT, 10) : null
  }
}

const inferEntryType = (name) => {
  const lower = String(name || '').toLowerCase()
  if (/lab/i.test(lower)) return 'Lab'
  if (/(recit|tutorial|tut\b)/i.test(lower)) return 'Recitation'
  if (/(exam|quiz|midterm|final|test)/i.test(lower)) return 'Exam'
  return 'Class'
}

const colorForName = (name) => {
  let hash = 0
  const source = String(name || '')
  for (let i = 0; i < source.length; i++) {
    hash = (hash * 31 + source.charCodeAt(i)) >>> 0
  }
  return CAMPORA_COLORS[hash % CAMPORA_COLORS.length]
}

const resolveSeriesEnd = (rule, defaultEndDate) => {
  let end = new Date(defaultEndDate)
  if (rule.until) {
    const until = new Date(rule.until)
    if (until < end) end = until
  }
  return end
}

export const expandScheduleEvents = (events = [], options = {}) => {
  const endDate = new Date(
    `${options.endDate || getDefaultScheduleEndDate()}T00:00:00`
  )
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const rows = []
  const pushRow = (row) => {
    if (rows.length < MAX_IMPORT_ROWS) rows.push(row)
  }

  for (const event of events) {
    const base = {
      name: event.name,
      description: event.description || '',
      type: inferEntryType(event.name),
      color: colorForName(event.name),
      reminder: false,
      is_completed: false
    }

    if (event.dayField) {
      const days = parseDaysField(event.dayField)
      if (!days.length) continue
      const groupId = cryptoUUID()
      let current = new Date(today)
      while (current <= endDate) {
        if (days.includes(current.getDay())) {
          pushRow({
            ...base,
            date: formatImportDate(current),
            start_time: event.start_time,
            end_time: event.end_time,
            group_id: groupId
          })
        }
        current.setDate(current.getDate() + 1)
      }
      continue
    }

    const rule = parseRRULE(event.rrule)

    if (rule.freq === 'WEEKLY' || rule.freq === 'DAILY') {
      const groupId = cryptoUUID()
      const start = startDateFrom(event.date, today)
      const end = resolveSeriesEnd(rule, endDate)
      const firstOccurrence = new Date(
        Math.max(start.getTime(), today.getTime())
      )
      let generated = 0
      let current = new Date(firstOccurrence)

      while (current <= end) {
        if (rule.freq === 'WEEKLY' && rule.byDay.length) {
          if (!rule.byDay.includes(DAY_TO_ABBR[current.getDay()])) {
            current.setDate(current.getDate() + 1)
            continue
          }
        } else if (rule.freq === 'WEEKLY') {
          const diff = current.getTime() - start.getTime()
          if (diff % (7 * 86400000) !== 0) {
            current.setDate(current.getDate() + 1)
            continue
          }
        }

        pushRow({
          ...base,
          date: formatImportDate(current),
          start_time: event.start_time,
          end_time: event.end_time,
          group_id: groupId
        })
        generated++
        if (rule.count && generated >= rule.count) break
        current.setDate(current.getDate() + 1)
      }
      continue
    }

    const singleDate = startDateFrom(event.date, null)
    if (!singleDate || singleDate < today) continue

    pushRow({
      ...base,
      date: formatImportDate(singleDate),
      start_time: event.start_time,
      end_time: event.end_time,
      group_id: null
    })
  }

  return rows
}

export const parseScheduleFile = async (file) => {
  const lower = String(file?.name || '').toLowerCase()

  if (lower.endsWith('.pdf')) {
    const items = await extractPdfItems(file)
    const events = parseSchedulePdfItems(items)
    if (events.length) return events
    const text = items.map((item) => item.str).join('\n')
    return parseScheduleText(text)
  }

  const content = String((await file.text()) || '')

  if (lower.endsWith('.ics') || /BEGIN:VCALENDAR/i.test(content)) {
    return parseICS(content)
  }

  return parseCSV(content)
}

// ---------------------------------------------------------------
// PDF text extraction + parsing
// ---------------------------------------------------------------

export const extractPdfItems = async (file) => {
  if (!file) throw new Error('No file provided.')

  if (
    file.type &&
    file.type !== 'application/pdf' &&
    !String(file.name || '').toLowerCase().endsWith('.pdf')
  ) {
    throw new Error('Please select a PDF file.')
  }

  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  const items = []

  for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex++) {
    const page = await pdf.getPage(pageIndex)
    const content = await page.getTextContent()

    for (const item of content.items) {
      const str = String(item.str ?? '').trim()
      if (!str) continue
      const [, , , , e, f] = item.transform || []
      items.push({ str, x: e, y: f, page: pageIndex })
    }
  }

  return items
}

const PDF_DAY_NAMES = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 0,
}

const findDayAnchors = (items) => {
  const rows = new Map()

  for (const item of items) {
    const day = PDF_DAY_NAMES[item.str.toLowerCase()]
    if (day === undefined) continue
    const key = Math.round(item.y)
    if (!rows.has(key)) rows.set(key, [])
    rows.get(key).push({ day, x: item.x, y: item.y })
  }

  let best = []
  for (const row of rows.values()) {
    row.sort((a, b) => a.x - b.x)
    if (row.length > best.length) best = row
  }

  return best
}

const assignDayByX = (x, anchors, avgGap) => {
  if (!anchors.length) return null
  const leftBound = anchors[0].x - avgGap / 2
  const rightBound = anchors[anchors.length - 1].x + avgGap / 2
  if (x < leftBound || x > rightBound) return null

  let nearest = null
  let nearestDist = Infinity
  for (const anchor of anchors) {
    const dist = Math.abs(anchor.x - x)
    if (dist < nearestDist) {
      nearestDist = dist
      nearest = anchor.day
    }
  }

  return nearest
}

const clusterCells = (dayItems) => {
  const cells = []
  let pendingNames = []
  let cell = null

  for (const item of [...dayItems].sort((a, b) => b.y - a.y)) {
    if (PDF_TIME_RANGE_RE.test(item.str)) {
      if (cell) cells.push(cell)
      cell = { lines: [...pendingNames, item], lastY: item.y }
      pendingNames = []
    } else if (PDF_LOCATION_RE.test(item.str)) {
      if (cell) {
        cell.lines.push(item)
        cell.lastY = item.y
      }
    } else {
      pendingNames.push(item)
    }
  }

  if (cell) cells.push(cell)

  return cells
}

const buildEventFromCell = (day, lines) => {
  let timeMatch = null
  let name = ''
  let location = ''

  for (const line of lines) {
    const text = line.str

    if (!timeMatch) {
      const match = text.match(PDF_TIME_RANGE_RE)
      if (match) {
        timeMatch = match
        const leftover = stripPdfTimeRange(text)
        if (leftover && !name) name = cleanPdfName(leftover)
        continue
      }
    }

    if (!location) {
      const locMatch = text.match(PDF_LOCATION_RE)
      if (locMatch) {
        location = cleanPdfName(locMatch[0])
        continue
      }
    }

    if (!name) name = cleanPdfName(text)
  }

  if (!timeMatch || !name) return null

  const start_time = pdfTime(timeMatch[1], timeMatch[2], timeMatch[3], timeMatch[6])
  const end_time = pdfTime(timeMatch[4], timeMatch[5], timeMatch[6], null)

  if (!start_time || !end_time) return null

  return { day, name, start_time, end_time, location }
}

const mergeCellsToEvents = (cells) => {
  const byKey = new Map()

  for (const cell of cells) {
    const key = `${cell.name}::${cell.start_time}::${cell.end_time}`
    const existing = byKey.get(key)

    if (existing) {
      if (cell.location && !existing.location) existing.location = cell.location
      if (!existing.days.includes(cell.day)) existing.days.push(cell.day)
    } else {
      byKey.set(key, { ...cell, days: [cell.day] })
    }
  }

  const events = []
  for (const item of byKey.values()) {
    const days = [...new Set(item.days)].sort((a, b) => a - b)
    events.push({
      name: item.name,
      description: item.location ? `Location: ${item.location}` : '',
      date: '',
      start_time: item.start_time,
      end_time: item.end_time,
      dayField: pdfDaysLabel(days),
      rrule: '',
    })
  }

  return events
}

export const parseSchedulePdfItems = (items) => {
  if (!items || !items.length) return []

  const anchors = findDayAnchors(items)
  if (anchors.length < 2) return []

  const avgGap =
    (anchors[anchors.length - 1].x - anchors[0].x) / (anchors.length - 1) || 1
  const anchorYs = new Set(anchors.map((anchor) => Math.round(anchor.y)))

  const byDay = new Map()
  let cellCount = 0

  for (const item of items) {
    if (anchorYs.has(Math.round(item.y)) && PDF_DAY_NAMES[item.str.toLowerCase()] !== undefined) {
      continue
    }
    const day = assignDayByX(item.x, anchors, avgGap)
    if (day === null) continue
    if (!byDay.has(day)) byDay.set(day, [])
    byDay.get(day).push(item)
  }

  const cells = []
  for (const [day, dayItems] of byDay) {
    for (const cluster of clusterCells(dayItems)) {
      const event = buildEventFromCell(day, cluster.lines)
      if (event) {
        cells.push(event)
        cellCount++
      }
    }
  }

  if (!cellCount) return []

  return mergeCellsToEvents(cells)
}

const WORD_DAYS = {
  monday: 1,
  mon: 1,
  tuesday: 2,
  tues: 2,
  tue: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thur: 4,
  thurs: 4,
  thu: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
  sunday: 0,
  sun: 0,
}

const DAY_LETTERS = new Set(['m', 't', 'w', 'r', 'f', 's', 'u', 'h'])

const parsePdfDayCode = (token) => {
  if (!token) return []

  const lower = token.toLowerCase()

  if (WORD_DAYS[lower]) return [WORD_DAYS[lower]]

  if (token.length < 2) return []

  if (![...lower].every((char) => DAY_LETTERS.has(char))) return []

  const days = new Set()
  let index = 0

  while (index < lower.length) {
    const char = lower[index]
    const pair = lower.slice(index, index + 2)

    if (char === 'm') { days.add(1); index += 1 }
    else if (char === 'w') { days.add(3); index += 1 }
    else if (char === 'f') { days.add(5); index += 1 }
    else if (char === 'r') { days.add(4); index += 1 }
    else if (char === 'h') { days.add(4); index += 1 }
    else if (char === 't') {
      if (pair === 'th') { days.add(4); index += 2 }
      else { days.add(2); index += 1 }
    } else if (char === 's') {
      if (pair === 'su') { days.add(0); index += 2 }
      else if (pair === 'sa') { days.add(6); index += 2 }
      else { index += 1 }
    } else {
      index += 1
    }
  }

  return [...days].sort((a, b) => a - b)
}

const parsePdfDays = (input) => {
  if (!input) return []

  const text = String(input).trim()
  if (!text) return []

  const found = new Set()
  const lower = text.toLowerCase()

  for (const [word, day] of Object.entries(WORD_DAYS)) {
    if (new RegExp(`\\b${word}\\b`, 'g').test(lower)) found.add(day)
  }

  const letterRuns = text.match(/[A-Za-z]+/g) || []

  letterRuns.forEach((run) => {
    const remainder = text.slice(text.indexOf(run) + run.length)
    if (/^\s*\d/.test(remainder)) return
    parsePdfDayCode(run).forEach((day) => found.add(day))
  })

  return [...found].sort((a, b) => a - b)
}

const PDF_DAY_LABELS = {
  0: 'Sun',
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
}

const pdfDaysLabel = (days) =>
  (days || []).map((day) => PDF_DAY_LABELS[day]).join(', ')

const PDF_TIME_RANGE_RE =
  /(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.|a\.m|p\.m|AM|PM)?\s*(?:-|–|—|to)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.|a\.m|p\.m|AM|PM)?/i

const PDF_LOCATION_RE =
  /(?:[a-z]+ )?(?:room|rm|bldg|building|hall|level|floor)\s*[a-z0-9][a-z0-9 ./-]{0,20}/i

const PDF_DAY_HEADER_RE =
  /^(?:\s*)(monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s*)$/i

const PDF_DAY_HEADER_SHORT_RE =
  /^(?:\s*)(mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)(?:day)?(?:\s*)$/i

const isPdfDayHeader = (line) =>
  PDF_DAY_HEADER_RE.test(line) || PDF_DAY_HEADER_SHORT_RE.test(line)

const stripPdfTimeRange = (line) =>
  line.replace(PDF_TIME_RANGE_RE, ' ').replace(/\s+/g, ' ').trim()

const cleanPdfName = (raw) => {
  if (!raw) return ''
  return raw
    .replace(/\s+/g, ' ')
    .replace(/^[\s\-–—|•:;,.]+/, '')
    .replace(/[\s\-–—|•:;,]+$/, '')
    .trim()
}

const pdfTime = (hour, minute, period, fallbackPeriod) => {
  let hours = parseInt(hour, 10)
  if (Number.isNaN(hours)) return null

  const minutes =
    minute !== undefined && minute !== null && minute !== ''
      ? parseInt(minute, 10)
      : 0

  const periodText = (period || fallbackPeriod || '')
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\s/g, '')

  if (periodText === 'pm' && hours < 12) hours += 12
  if (periodText === 'am' && hours === 12) hours = 0

  if (hours > 23 || minutes > 59) return null

  return `${pad2(hours)}:${pad2(minutes)}`
}

export const parseScheduleText = (rawText) => {
  if (!rawText) return []

  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)

  const events = []
  let currentDay = null

  lines.forEach((line) => {
    if (isPdfDayHeader(line)) {
      currentDay = parsePdfDays(line)[0] ?? null
      return
    }

    const timeMatch = line.match(PDF_TIME_RANGE_RE)
    if (!timeMatch) return

    const start_time = pdfTime(timeMatch[1], timeMatch[2], timeMatch[3], timeMatch[6])
    const end_time = pdfTime(timeMatch[4], timeMatch[5], timeMatch[6], null)

    if (!start_time || !end_time) return

    const lineDays = parsePdfDays(line)
    const weekdays =
      lineDays.length > 0 ? lineDays : currentDay !== null ? [currentDay] : []

    if (!weekdays.length) return

    let name = cleanPdfName(stripPdfTimeRange(line))
    let location = ''

    const locationMatch = name.match(PDF_LOCATION_RE)
    if (locationMatch) {
      location = cleanPdfName(locationMatch[0])
      name = cleanPdfName(name.replace(locationMatch[0], ' '))
    }

    if (!name) return

    const dayLabel = pdfDaysLabel(weekdays)

    const duplicate = events.find(
      (event) =>
        event.name === name &&
        event.start_time === start_time &&
        event.end_time === end_time &&
        event.dayField === dayLabel
    )

    if (duplicate) {
      if (location && !duplicate.description) {
        duplicate.description = `Location: ${location}`
      }
      return
    }

    events.push({
      name,
      description: location ? `Location: ${location}` : '',
      date: '',
      start_time,
      end_time,
      dayField: dayLabel,
      rrule: '',
    })
  })

  return events
}

// ---------------------------------------------------------------
// Database insert
// ---------------------------------------------------------------

const existingEntryKey = (item) =>
  `${String(item.name || '').trim().toLowerCase()}::${item.date}::${item.start_time}::${item.end_time}`

const dedupeAgainstExisting = async (userId, rows) => {
  const dates = [...new Set(rows.map((row) => row.date).filter(Boolean))]
  if (!dates.length) return rows

  const existingKeys = new Set()
  const chunkSize = 50

  for (let i = 0; i < dates.length; i += chunkSize) {
    const { data, error } = await supabase
      .from('planner_courses')
      .select('name, date, start_time, end_time')
      .eq('user_id', userId)
      .in('date', dates.slice(i, i + chunkSize))

    if (error) {
      console.warn('Schedule dedupe check skipped:', error)
      continue
    }

    for (const item of data || []) existingKeys.add(existingEntryKey(item))
  }

  if (!existingKeys.size) return rows

  return rows.filter((row) => !existingKeys.has(existingEntryKey(row)))
}

export const importScheduleRows = async ({ userId, rows = [] }) => {
  if (!userId || !rows.length) return { inserted: 0, error: null }

  const uniqueRows = await dedupeAgainstExisting(userId, rows)
  if (!uniqueRows.length) return { inserted: 0, error: null }

  let inserted = 0
  const chunkSize = 50

  for (let i = 0; i < uniqueRows.length; i += chunkSize) {
    const chunk = uniqueRows
      .slice(i, i + chunkSize)
      .map((row) => ({ ...row, user_id: userId }))

    let result = await supabase.from('planner_courses').insert(chunk)

    const missingGroupId =
      result.error &&
      /group_id/i.test(result.error.message || '') &&
      /(column|schema|does not exist|not found)/i.test(
        result.error.message || ''
      )

    if (missingGroupId) {
      const compatibleChunk = chunk.map(({ group_id: _groupId, ...row }) => row)
      result = await supabase.from('planner_courses').insert(compatibleChunk)
    }

    if (result.error) {
      console.error('Schedule import error:', result.error)
      return { inserted, error: result.error }
    }

    inserted += chunk.length
  }

  return { inserted, error: null }
}
