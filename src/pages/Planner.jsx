import React, { useState, useEffect, useRef } from 'react';

import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Bell,
  BellOff,
  Edit3,
  Calendar as CalIcon,
  RefreshCw,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Palette,
  AlarmClock,
  Upload,
  X
} from 'lucide-react';

import { supabase } from '../lib/supabase';

import { ProgressRing } from '../components/luminous';

import {
  parseScheduleFile,
  expandScheduleEvents,
  importScheduleRows
} from '../lib/scheduleImport';

// =========================================================
// AUTOMATIC TEXT CONTRAST
// =========================================================

const getContrastText = (hexColor) => {
  if (!hexColor) return '#0B1A3F';

  let hex = hexColor.replace('#', '');

  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('');
  }

  if (hex.length !== 6) {
    return '#0B1A3F';
  }

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness < 145 ? '#FFFFFF' : '#0B1A3F';
};

// =========================================================
// DARK-MODE COLOR ADAPTATION
// =========================================================

const isDarkTheme = () =>
  typeof document !== 'undefined' &&
  document.documentElement.dataset.theme === 'dark';

const darkModeColor = (hexColor) => {
  if (!isDarkTheme()) return hexColor;

  if (!hexColor) return '#E1F2FF';

  let hex = hexColor.replace('#', '');

  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('');
  }

  if (hex.length !== 6) return hexColor;

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  const mix = (a, b, t) => Math.round(a * (1 - t) + b * t);

  let nextR;
  let nextG;
  let nextB;

  if (brightness >= 145) {
    nextR = mix(r, 16, 0.68);
    nextG = mix(g, 23, 0.68);
    nextB = mix(b, 35, 0.68);
  } else {
    nextR = mix(r, 203, 0.38);
    nextG = mix(g, 214, 0.38);
    nextB = mix(b, 232, 0.38);
  }

  return `#${[nextR, nextG, nextB]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')}`;
};


// =========================================================
// COURSE LINK HELPERS
// =========================================================

const COURSE_LINK_START = '[CAMPORA_COURSE_LINK]';
const COURSE_LINK_END = '[/CAMPORA_COURSE_LINK]';

const parseCourseLink = (description = '') => {
  const start = description.indexOf(COURSE_LINK_START);
  const end = description.indexOf(COURSE_LINK_END);

  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  try {
    const jsonStart = start + COURSE_LINK_START.length;
    const raw = description.substring(jsonStart, end);
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const visiblePlannerDescription = (description = '') => {
  const start = description.indexOf(COURSE_LINK_START);

  if (start === -1) return description;

  return description.substring(0, start).trim();
};

const courseLocalKey = (userId, name) =>
  `campora-course-management:${userId || 'guest'}:${name}`;

const scheduleImportKey = (userId) =>
  `campora-planner:schedule-import:${userId || 'guest'}`;

const startOfWeekMonday = (date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - ((copy.getDay() + 6) % 7));
  return copy;
};

const nextMondayDate = () => {
  const today = new Date();
  const diff = today.getDay() === 0 ? 1 : 8 - today.getDay();
  return startOfWeekMonday(new Date(today.getTime() + diff * 86400000));
};

// =========================================================
// COMPONENT
// =========================================================

export default function Planner() {
  const [user, setUser] = useState(null);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [viewType, setViewType] = useState('Month');
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [editSeriesConfirmation, setEditSeriesConfirmation] = useState(null);
  const [showEntryCustomColor, setShowEntryCustomColor] = useState(false);
  const [showStickyCustomColor, setShowStickyCustomColor] = useState(false);
  const scheduleInputRef = useRef(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleFile, setScheduleFile] = useState(null);
  const [scheduleEvents, setScheduleEvents] = useState(null);
  const [scheduleStartDate, setScheduleStartDate] = useState('');
  const [scheduleImporting, setScheduleImporting] = useState(false);
  const [scheduleNotice, setScheduleNotice] = useState(null);
  const [scheduleError, setScheduleError] = useState(null);
  const [scheduleImportIds, setScheduleImportIds] = useState([]);

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseDate = (dateString) => {
    if (!dateString) return new Date();
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const selectedDateStr = formatDate(selectedDate);

  const getDefaultEndDate = () => {
    const date = new Date();
    date.setMonth(date.getMonth() + 3);
    return formatDate(date);
  };

  const camporaColors = [
    '#E1F2FF',
    '#FCE4EF',
    '#EEE2FF',
    '#FFDCD7',
    '#FFEACA',
    '#CDF7F8',
    '#D3F8E2',
    '#DCE6FF',
    '#0B1A3F'
  ];

  const [stickyText, setStickyText] = useState('');
  const [stickyColor, setStickyColor] = useState('#E1F2FF');

  useEffect(() => {
    const savedText = localStorage.getItem(
      `campora_sticky_text_${selectedDateStr}`
    );
    const savedColor = localStorage.getItem(
      `campora_sticky_color_${selectedDateStr}`
    );

    setStickyText(savedText ?? '');
    setStickyColor(savedColor || '#E1F2FF');
    setShowStickyCustomColor(false);
  }, [selectedDateStr]);

  const handleStickyTextChange = (text) => {
    setStickyText(text);
    localStorage.setItem(
      `campora_sticky_text_${selectedDateStr}`,
      text
    );
  };

  const handleStickyColorChange = (color) => {
    setStickyColor(color);
    localStorage.setItem(
      `campora_sticky_color_${selectedDateStr}`,
      color
    );
  };

  const clearSticky = () => {
    setStickyText('');
    localStorage.removeItem(
      `campora_sticky_text_${selectedDateStr}`
    );
  };

  const initialEntryState = {
    name: '',
    description: '',
    date: '',
    until_date: getDefaultEndDate(),
    type: 'Class',
    start_time: '09:00',
    end_time: '10:00',
    color: '#E1F2FF',
    repeat: 'none',
    reminder: false,
    alertType: 'none'
  };

  const [newEntry, setNewEntry] = useState(initialEntryState);

  // =========================================================
  // TWO-WAY COURSE SYNC
  // =========================================================

  const updateLinkedCourseLocalItem = (plannerEntry, changes = {}) => {
    if (!user || !plannerEntry) return;

    const link = parseCourseLink(plannerEntry.description || '');
    if (!link?.kind || !link?.courseItemId) return;
    if (link.kind === 'course_schedule') return;

    const storageName =
      link.kind === 'assignment' ? 'assignments' : 'events';

    const key = courseLocalKey(user.id, storageName);

    let items = [];
    try {
      items = JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
      items = [];
    }

    const nextItems = items.map((item) => {
      if (item.id !== link.courseItemId) return item;

      if (link.kind === 'assignment') {
        return {
          ...item,
          title:
            changes.name !== undefined
              ? changes.name
              : plannerEntry.name || item.title,
          due:
            changes.date !== undefined
              ? changes.date
              : plannerEntry.date || item.due,
          completed:
            changes.is_completed !== undefined
              ? !!changes.is_completed
              : !!plannerEntry.is_completed,
          plannerId: plannerEntry.id
        };
      }

      return {
        ...item,
        title:
          changes.name !== undefined
            ? changes.name
            : plannerEntry.name || item.title,
        date:
          changes.date !== undefined
            ? changes.date
            : plannerEntry.date || item.date,
        completed:
          changes.is_completed !== undefined
            ? !!changes.is_completed
            : !!plannerEntry.is_completed,
        plannerId: plannerEntry.id
      };
    });

    localStorage.setItem(key, JSON.stringify(nextItems));
    window.dispatchEvent(
      new CustomEvent('campora-course-sync', {
        detail: { kind: link.kind }
      })
    );
  };

  const removeLinkedCourseLocalItem = (plannerEntry) => {
    if (!user || !plannerEntry) return;

    const link = parseCourseLink(plannerEntry.description || '');
    if (!link?.kind || !link?.courseItemId) return;
    if (link.kind === 'course_schedule') return;

    const storageName =
      link.kind === 'assignment' ? 'assignments' : 'events';

    const key = courseLocalKey(user.id, storageName);

    let items = [];
    try {
      items = JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
      items = [];
    }

    localStorage.setItem(
      key,
      JSON.stringify(
        items.filter((item) => item.id !== link.courseItemId)
      )
    );

    window.dispatchEvent(
      new CustomEvent('campora-course-sync', {
        detail: { kind: link.kind }
      })
    );
  };

  // =========================================================
  // PLANNER NOTIFICATION LINKS
  // =========================================================

  const plannerAlertKey = (userId) =>
    `campora-planner-alert-links-${userId}`;

  const hasReminderAlert = (alertType) =>
    alertType === 'reminder' || alertType === 'both';

  const hasNotificationAlert = (alertType) =>
    alertType === 'notification' || alertType === 'both';

  const readPlannerAlertLinks = () => {
    if (!user) return {};

    try {
      return JSON.parse(
        localStorage.getItem(plannerAlertKey(user.id)) || '{}'
      );
    } catch {
      return {};
    }
  };

  const writePlannerAlertLinks = (links) => {
    if (!user) return;

    localStorage.setItem(
      plannerAlertKey(user.id),
      JSON.stringify(links || {})
    );
  };

  const savePlannerAlertChoice = (entries = [], alertType = 'none') => {
    if (!user || !entries.length) return;

    const links = readPlannerAlertLinks();

    entries.forEach((entry) => {
      if (!entry?.id) return;

      if (alertType === 'none') {
        delete links[entry.id];
        return;
      }

      links[entry.id] = {
        type: alertType === 'both' ? 'notification' : alertType,
        alertMode: alertType,
        notification: hasNotificationAlert(alertType),
        reminder: hasReminderAlert(alertType),
        title: entry.name || 'Planner entry',
        entryType: entry.type || '',
        date: entry.date || '',
        time: entry.start_time || '',
        description: visiblePlannerDescription(entry.description || ''),
        created_at: new Date().toISOString(),
      };
    });

    writePlannerAlertLinks(links);
  };

  const deletePlannerAlertChoices = (entryIds = []) => {
    if (!user || !entryIds.length) return;

    const links = readPlannerAlertLinks();

    entryIds.forEach((entryId) => {
      delete links[entryId];
    });

    writePlannerAlertLinks(links);
  };

  // =========================================================
  // DATABASE
  // =========================================================

  const fetchCourses = async (userId) => {
    if (!userId) return;

    setLoading(true);

    const { data, error } = await supabase
      .from('planner_courses')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Planner fetch error:', error);
    }

    setCourses(data || []);
    setLoading(false);
  };

  const handleUploadClick = () => scheduleInputRef.current?.click();

  const handleScheduleInputChange = async (e) => {
    const file = e.target.files?.[0];
    if (e.target.value) e.target.value = '';
    if (!file) return;

    setScheduleError(null);
    setScheduleNotice(null);

    try {
      const events = await parseScheduleFile(file);

      if (!events || !events.length) {
        setScheduleError(
          'No events were found in that file. Try a .pdf, .ics or .csv class schedule.'
        );
        return;
      }

      setScheduleFile(file.name);
      setScheduleEvents(events);
      setScheduleStartDate(formatDate(nextMondayDate()));
      setScheduleModalOpen(true);
    } catch (err) {
      console.error('Schedule parse error:', err);
      const msg = String(err?.message || err || 'Unknown error');
      if (/password|encrypted/i.test(msg)) {
        setScheduleError(
          'That PDF is password-protected. Please upload an unlocked copy.'
        );
      } else if (/pdf/i.test(msg)) {
        setScheduleError(`PDF error: ${msg}`);
      } else {
        setScheduleError(
          `Could not read that file: ${msg}`
        );
      }
    }
  };

  const presetDateForOffset = (offset) => {
    const base = startOfWeekMonday(new Date());
    base.setDate(base.getDate() + offset * 7);
    return formatDate(base);
  };

  const setStartFromWeekOffset = (offset) => {
    setScheduleStartDate(presetDateForOffset(offset));
  };

  const confirmScheduleImport = async () => {
    if (
      !user ||
      !scheduleEvents ||
      !scheduleStartDate ||
      scheduleImporting
    ) {
      return;
    }

    setScheduleImporting(true);
    setScheduleError(null);

    try {
      const rows = expandScheduleEvents(scheduleEvents, {
        startDate: scheduleStartDate
      });

      if (!rows.length) {
        setScheduleError(
          'No schedule entries fall on or after the week you picked.'
        );
        return;
      }

      const { inserted, ids, error } = await importScheduleRows({
        userId: user.id,
        rows
      });

      if (error) throw new Error(error.message);

      if (!inserted) {
        setScheduleNotice('That schedule is already in your planner.');
        setScheduleModalOpen(false);
        setScheduleFile(null);
        setScheduleEvents(null);
        return;
      }

      const key = scheduleImportKey(user.id);
      let existing = [];
      try {
        existing = JSON.parse(localStorage.getItem(key) || '[]');
        if (!Array.isArray(existing)) existing = [];
      } catch {
        existing = [];
      }
      const nextIds = [...existing, ...(ids || [])];
      localStorage.setItem(key, JSON.stringify(nextIds));
      setScheduleImportIds(nextIds);

      setScheduleModalOpen(false);
      setScheduleFile(null);
      setScheduleEvents(null);

      setScheduleNotice(
        `Imported ${inserted} schedule entries starting the week of ${new Date(
          `${scheduleStartDate}T00:00:00`
        ).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        })}.`
      );

      const start = parseDate(scheduleStartDate);
      setViewDate(start);
      setSelectedDate(start);
      setViewType('Week');

      await fetchCourses(user.id);
    } catch (err) {
      console.error('Schedule import error:', err);
      setScheduleError(`Could not import schedule: ${err.message}`);
    } finally {
      setScheduleImporting(false);
    }
  };

  const handleClearSchedule = async () => {
    if (!user || scheduleImporting) return;

    let ids = [];
    try {
      const parsed = JSON.parse(
        localStorage.getItem(scheduleImportKey(user.id)) || '[]'
      );
      if (Array.isArray(parsed)) ids = parsed;
    } catch {
      ids = [];
    }

    if (!ids.length) return;

    if (
      !window.confirm(
        'Remove all entries imported from your uploaded schedule?'
      )
    ) {
      return;
    }

    setScheduleImporting(true);
    setScheduleError(null);

    try {
      await deleteRemindersForEntries(ids);
      deletePlannerAlertChoices(ids);

      const { error } = await supabase
        .from('planner_courses')
        .delete()
        .eq('user_id', user.id)
        .in('id', ids);

      if (error) throw new Error(error.message);

      localStorage.removeItem(scheduleImportKey(user.id));
      setScheduleImportIds([]);
      setScheduleNotice('Uploaded schedule cleared from your planner.');
      await fetchCourses(user.id);
    } catch (err) {
      console.error('Clear schedule error:', err);
      setScheduleError(`Could not clear schedule: ${err.message}`);
    } finally {
      setScheduleImporting(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (user) {
        setUser(user);
        await fetchCourses(user.id);

        try {
          const parsed = JSON.parse(
            localStorage.getItem(scheduleImportKey(user.id)) || '[]'
          );
          if (Array.isArray(parsed)) setScheduleImportIds(parsed);
        } catch {
          setScheduleImportIds([]);
        }
      } else {
        setLoading(false);
      }
    };

    init();
  }, []);

  const isRepeatableType = (type) => {
    return ['Class', 'Lab', 'Recitation'].includes(type);
  };

  const getSeriesEntries = (entry) => {
    if (!entry?.group_id) return [];

    return courses
      .filter((item) => item.group_id === entry.group_id)
      .sort((a, b) => parseDate(a.date) - parseDate(b.date));
  };

  const detectRepeatPattern = (entry) => {
    if (!entry?.group_id) return 'none';

    const seriesEntries = getSeriesEntries(entry);

    if (seriesEntries.length < 2) return 'Weekly';

    const weekdaySet = new Set(
      seriesEntries.map((item) => parseDate(item.date).getDay())
    );

    const onlyMWF = [...weekdaySet].every((day) =>
      [1, 3, 5].includes(day)
    );
    const onlyTTH = [...weekdaySet].every((day) =>
      [2, 4].includes(day)
    );
    const hasMWF =
      weekdaySet.has(1) && weekdaySet.has(3) && weekdaySet.has(5);
    const hasTTH = weekdaySet.has(2) && weekdaySet.has(4);

    if (onlyMWF && hasMWF) return 'MWF';
    if (onlyTTH && hasTTH) return 'TTH';

    let weekly = true;

    for (let i = 1; i < seriesEntries.length; i++) {
      const previous = parseDate(seriesEntries[i - 1].date);
      const current = parseDate(seriesEntries[i].date);
      const difference = Math.round(
        (current - previous) / (1000 * 60 * 60 * 24)
      );

      if (difference !== 7) {
        weekly = false;
        break;
      }
    }

    if (weekly) return 'Weekly';

    return 'Weekly';
  };

  const getSeriesEndDate = (entry) => {
    if (!entry?.group_id) return getDefaultEndDate();

    const seriesEntries = getSeriesEntries(entry);

    if (!seriesEntries.length) return getDefaultEndDate();

    return seriesEntries[seriesEntries.length - 1].date;
  };

  const getDatesToDisplay = () => {
    if (viewType === 'Month') {
      const start = new Date(
        viewDate.getFullYear(),
        viewDate.getMonth(),
        1
      ).getDay();

      const count = new Date(
        viewDate.getFullYear(),
        viewDate.getMonth() + 1,
        0
      ).getDate();

      const dateArray = Array.from(
        { length: count },
        (_, index) =>
          new Date(
            viewDate.getFullYear(),
            viewDate.getMonth(),
            index + 1
          )
      );

      return { startPadding: start, dateArray };
    }

    if (viewType === 'Week') {
      const current = new Date(selectedDate);
      const first = current.getDate() - current.getDay();

      const dateArray = Array.from(
        { length: 7 },
        (_, index) =>
          new Date(
            current.getFullYear(),
            current.getMonth(),
            first + index
          )
      );

      return { startPadding: 0, dateArray };
    }

    return { startPadding: 0, dateArray: [selectedDate] };
  };

  const { startPadding, dateArray } = getDatesToDisplay();

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handlePrev = () => {
    if (viewType === 'Month') {
      setViewDate(
        new Date(
          viewDate.getFullYear(),
          viewDate.getMonth() - 1,
          1
        )
      );
      return;
    }

    if (viewType === 'Week') {
      const nextDate = new Date(selectedDate);
      nextDate.setDate(nextDate.getDate() - 7);
      setSelectedDate(nextDate);
      setViewDate(nextDate);
      return;
    }

    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() - 1);
    setSelectedDate(nextDate);
    setViewDate(nextDate);
  };

  const handleNext = () => {
    if (viewType === 'Month') {
      setViewDate(
        new Date(
          viewDate.getFullYear(),
          viewDate.getMonth() + 1,
          1
        )
      );
      return;
    }

    if (viewType === 'Week') {
      const nextDate = new Date(selectedDate);
      nextDate.setDate(nextDate.getDate() + 7);
      setSelectedDate(nextDate);
      setViewDate(nextDate);
      return;
    }

    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);
    setSelectedDate(nextDate);
    setViewDate(nextDate);
  };

  const handleOpenModal = (dateStr) => {
    setEditingEntry(null);
    setShowEntryCustomColor(false);

    setNewEntry({
      ...initialEntryState,
      date: dateStr,
      until_date: getDefaultEndDate()
    });

    setIsModalOpen(true);
  };

  const handleOpenEditModal = (entry) => {
    const repeatPattern = detectRepeatPattern(entry);

    setEditingEntry(entry);

    setShowEntryCustomColor(!camporaColors.includes(entry.color));

    setNewEntry({
      name: entry.name || '',
      description: visiblePlannerDescription(entry.description || ''),
      date: entry.date || '',
      until_date: getSeriesEndDate(entry),
      type: entry.type || 'Class',
      start_time: entry.start_time
        ? entry.start_time.substring(0, 5)
        : '09:00',
      end_time: entry.end_time
        ? entry.end_time.substring(0, 5)
        : '10:00',
      color: entry.color || '#E1F2FF',
      repeat: repeatPattern,
      reminder: !!entry.reminder,
      alertType: (() => {
        const savedAlert = readPlannerAlertLinks()[entry.id];

        if (savedAlert?.alertMode === 'both') return 'both';
        if (entry.reminder && savedAlert?.type === 'notification') return 'both';

        return savedAlert?.type ||
          (entry.reminder ? 'reminder' : 'none');
      })()
    });

    setIsModalOpen(true);
  };

  const buildSeriesEntries = ({ entryData, groupId }) => {
    const entries = [];
    const { repeat, until_date, alertType, ...dbEntry } = entryData;

    const makeEntry = (date) => ({
      ...dbEntry,
      date,
      group_id: repeat === 'none' ? null : groupId,
      user_id: user.id
    });

    if (repeat === 'none' || !isRepeatableType(entryData.type)) {
      entries.push(makeEntry(entryData.date));
      return entries;
    }

    const current = parseDate(entryData.date);
    const limit = parseDate(until_date);

    if (repeat === 'Weekly') {
      while (current <= limit) {
        entries.push(makeEntry(formatDate(current)));
        current.setDate(current.getDate() + 7);
      }
      return entries;
    }

    const targetDays = repeat === 'MWF' ? [1, 3, 5] : [2, 4];

    while (current <= limit) {
      if (targetDays.includes(current.getDay())) {
        entries.push(makeEntry(formatDate(current)));
      }
      current.setDate(current.getDate() + 1);
    }

    return entries;
  };

  const deleteRemindersForEntries = async (entryIds = []) => {
    if (!user || !entryIds.length) return;

    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('profile_id', user.id)
      .in('source_id', entryIds);

    if (error) {
      console.error('Reminder delete error:', error);
    }
  };

  const saveRemindersForEntries = async (entries = []) => {
    if (!user || !entries.length) return;

    const reminderRows = entries.map((entry) => ({
      profile_id: user.id,
      title: entry.name,
      source_id: entry.id,
      remind_at: new Date(
        `${entry.date}T${entry.start_time}`
      ).toISOString()
    }));

    const { error } = await supabase
      .from('reminders')
      .upsert(reminderRows);

    if (error) {
      console.error('Reminder save error:', error);
    }
  };



  const confirmDuplicatePlannerEntries = async (entries = []) => {
    if (!user || !entries.length) return true;

    const dates = [...new Set(entries.map((entry) => entry.date).filter(Boolean))];

    if (!dates.length) return true;

    const { data: existingEntries, error } = await supabase
      .from('planner_courses')
      .select('id, name, date, start_time, end_time, type')
      .eq('user_id', user.id)
      .in('date', dates);

    if (error) {
      console.error('Duplicate planner check error:', error);

      // Do not block saving just because the duplicate check failed.
      return true;
    }

    const duplicates = entries.filter((entry) =>
      (existingEntries || []).some((existing) => {
        const sameName =
          String(existing.name || '').trim().toLowerCase() ===
          String(entry.name || '').trim().toLowerCase();

        const sameDate = existing.date === entry.date;
        const sameStart =
          String(existing.start_time || '').slice(0, 5) ===
          String(entry.start_time || '').slice(0, 5);

        const sameEnd =
          String(existing.end_time || '').slice(0, 5) ===
          String(entry.end_time || '').slice(0, 5);

        return sameName && sameDate && sameStart && sameEnd;
      })
    );

    if (!duplicates.length) {
      return true;
    }

    return window.confirm(
      duplicates.length === 1
        ? 'A very similar planner entry already exists at this time. Add it anyway?'
        : `${duplicates.length} similar planner entries already exist. Add them anyway?`
    );
  };

  const createEntryOrSeries = async () => {
    const groupId = crypto.randomUUID();

    const entriesToSave = buildSeriesEntries({
      entryData: newEntry,
      groupId
    });

    if (!entriesToSave.length) {
      alert('No dates were generated for this schedule.');
      return false;
    }

    const shouldAdd =
      await confirmDuplicatePlannerEntries(entriesToSave);

    if (!shouldAdd) {
      return false;
    }

    const { data: savedEntries, error } = await supabase
      .from('planner_courses')
      .insert(entriesToSave)
      .select();

    if (error) {
      console.error('Create entry error:', error);
      alert(`Could not save entry: ${error.message}`);
      return false;
    }

    if (savedEntries?.length) {
      if (hasReminderAlert(newEntry.alertType)) {
        await saveRemindersForEntries(savedEntries);
        savePlannerAlertChoice(savedEntries, newEntry.alertType);
      }

      if (hasNotificationAlert(newEntry.alertType)) {
        savePlannerAlertChoice(savedEntries, newEntry.alertType);
      }
    }

    return true;
  };

  const updateOnlyThisEntry = async () => {
    if (!editingEntry || !user) return false;

    const linked = parseCourseLink(editingEntry.description || '');

    const updatedData = {
      name: newEntry.name,
      description: linked
        ? `${newEntry.description || ''}

${COURSE_LINK_START}${JSON.stringify(linked)}${COURSE_LINK_END}`.trim()
        : newEntry.description,
      type: newEntry.type,
      date: newEntry.date,
      start_time: newEntry.start_time,
      end_time: newEntry.end_time,
      color: newEntry.color,
      reminder: hasReminderAlert(newEntry.alertType)
    };

    const { data, error } = await supabase
      .from('planner_courses')
      .update(updatedData)
      .eq('id', editingEntry.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Update entry error:', error);
      alert(`Could not update entry: ${error.message}`);
      return false;
    }

    await deleteRemindersForEntries([editingEntry.id]);
    deletePlannerAlertChoices([editingEntry.id]);

    if (data) {
      if (newEntry.alertType === 'none') {
        deletePlannerAlertChoices([data.id]);
      }

      if (hasReminderAlert(newEntry.alertType)) {
        await saveRemindersForEntries([data]);
      }

      if (hasNotificationAlert(newEntry.alertType)) {
        savePlannerAlertChoice([data], newEntry.alertType);
      }
    }

    if (data) {
      updateLinkedCourseLocalItem(data, {
        name: data.name,
        date: data.date
      });
    }

    return true;
  };

  const convertSingleEntryToSeries = async () => {
    if (!editingEntry || !user) return false;

    // Linked course items must remain a single planner row so they keep
    // one stable two-way link.
    if (parseCourseLink(editingEntry.description || '')) {
      alert(
        'Course-linked assignments and upcoming items cannot be converted into a repeating series.'
      );
      return false;
    }

    const groupId = crypto.randomUUID();

    const entriesToSave = buildSeriesEntries({
      entryData: newEntry,
      groupId
    });

    if (!entriesToSave.length) {
      alert('No dates were generated for this repeating schedule.');
      return false;
    }

    const { data: savedEntries, error: insertError } = await supabase
      .from('planner_courses')
      .insert(entriesToSave)
      .select();

    if (insertError) {
      console.error('Create series error:', insertError);
      alert(
        `Could not create repeating schedule: ${insertError.message}`
      );
      return false;
    }

    await deleteRemindersForEntries([editingEntry.id]);
    deletePlannerAlertChoices([editingEntry.id]);

    const { error: deleteError } = await supabase
      .from('planner_courses')
      .delete()
      .eq('id', editingEntry.id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Delete old entry error:', deleteError);
    }

    if (savedEntries?.length) {
      if (hasReminderAlert(newEntry.alertType)) {
        await saveRemindersForEntries(savedEntries);
        savePlannerAlertChoice(savedEntries, newEntry.alertType);
      }

      if (hasNotificationAlert(newEntry.alertType)) {
        savePlannerAlertChoice(savedEntries, newEntry.alertType);
      }
    }

    return true;
  };

  const updateEntireSeries = async () => {
    if (!editingEntry || !user) return false;

    if (!editingEntry.group_id) {
      if (
        newEntry.repeat !== 'none' &&
        isRepeatableType(newEntry.type)
      ) {
        return await convertSingleEntryToSeries();
      }

      return await updateOnlyThisEntry();
    }

    const oldSeriesEntries = courses.filter(
      (entry) => entry.group_id === editingEntry.group_id
    );

    const oldIds = oldSeriesEntries.map((entry) => entry.id);

    if (newEntry.repeat === 'none') {
      const singleEntryData = {
        name: newEntry.name,
        description: newEntry.description,
        type: newEntry.type,
        date: newEntry.date,
        start_time: newEntry.start_time,
        end_time: newEntry.end_time,
        color: newEntry.color,
        reminder: hasReminderAlert(newEntry.alertType),
        group_id: null,
        user_id: user.id
      };

      const { data, error: insertError } = await supabase
        .from('planner_courses')
        .insert(singleEntryData)
        .select()
        .single();

      if (insertError) {
        console.error('Single replacement error:', insertError);
        alert(`Could not update series: ${insertError.message}`);
        return false;
      }

      await deleteRemindersForEntries(oldIds);
      deletePlannerAlertChoices(oldIds);

      const { error: deleteError } = await supabase
        .from('planner_courses')
        .delete()
        .eq('user_id', user.id)
        .eq('group_id', editingEntry.group_id);

      if (deleteError) {
        console.error('Old series delete error:', deleteError);
      }

      if (data) {
        if (hasReminderAlert(newEntry.alertType)) {
          await saveRemindersForEntries([data]);
          savePlannerAlertChoice([data], newEntry.alertType);
        }

        if (hasNotificationAlert(newEntry.alertType)) {
          savePlannerAlertChoice([data], newEntry.alertType);
        }
      }

      return true;
    }

    const newGroupId = crypto.randomUUID();

    const entriesToSave = buildSeriesEntries({
      entryData: newEntry,
      groupId: newGroupId
    });

    if (!entriesToSave.length) {
      alert('No dates were generated for this schedule.');
      return false;
    }

    const { data: savedEntries, error: insertError } = await supabase
      .from('planner_courses')
      .insert(entriesToSave)
      .select();

    if (insertError) {
      console.error('Series insert error:', insertError);
      alert(`Could not update series: ${insertError.message}`);
      return false;
    }

    await deleteRemindersForEntries(oldIds);
    deletePlannerAlertChoices(oldIds);

    const { error: deleteError } = await supabase
      .from('planner_courses')
      .delete()
      .eq('user_id', user.id)
      .eq('group_id', editingEntry.group_id);

    if (deleteError) {
      console.error('Series delete error:', deleteError);
    }

    if (savedEntries?.length) {
      if (hasReminderAlert(newEntry.alertType)) {
        await saveRemindersForEntries(savedEntries);
        savePlannerAlertChoice(savedEntries, newEntry.alertType);
      }

      if (hasNotificationAlert(newEntry.alertType)) {
        savePlannerAlertChoice(savedEntries, newEntry.alertType);
      }
    }

    return true;
  };

  const handleSaveEntry = async (event) => {
    event.preventDefault();

    if (!user || saving) return;

    if (!newEntry.name.trim()) {
      alert('Please enter a title.');
      return;
    }

    if (!newEntry.date) {
      alert('Please choose a date.');
      return;
    }

    if (newEntry.repeat !== 'none' && !newEntry.until_date) {
      alert('Please choose an end date.');
      return;
    }

    if (editingEntry && editingEntry.group_id) {
      setEditSeriesConfirmation(editingEntry);
      return;
    }

    setSaving(true);

    try {
      if (editingEntry) {
        if (
          newEntry.repeat !== 'none' &&
          isRepeatableType(newEntry.type)
        ) {
          const success = await convertSingleEntryToSeries();
          if (!success) return;

          setIsModalOpen(false);
          setEditingEntry(null);
          await fetchCourses(user.id);
          return;
        }

        const success = await updateOnlyThisEntry();
        if (!success) return;

        setIsModalOpen(false);
        setEditingEntry(null);
        await fetchCourses(user.id);
        return;
      }

      const success = await createEntryOrSeries();
      if (!success) return;

      setIsModalOpen(false);
      await fetchCourses(user.id);
    } catch (error) {
      console.error('Planner save error:', error);
      alert(
        'Something went wrong while saving. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmEditSingle = async () => {
    if (saving) return;

    setSaving(true);

    try {
      const success = await updateOnlyThisEntry();
      if (!success) return;

      setEditSeriesConfirmation(null);
      setIsModalOpen(false);
      setEditingEntry(null);
      await fetchCourses(user.id);
    } finally {
      setSaving(false);
    }
  };

  const confirmEditSeries = async () => {
    if (saving) return;

    setSaving(true);

    try {
      const success = await updateEntireSeries();
      if (!success) return;

      setEditSeriesConfirmation(null);
      setIsModalOpen(false);
      setEditingEntry(null);
      await fetchCourses(user.id);
    } finally {
      setSaving(false);
    }
  };

  const executeDelete = async (
    id,
    deleteAllInSeries,
    groupId = null
  ) => {
    if (!user) return;

    try {
      if (deleteAllInSeries && groupId) {
        const seriesItems = courses.filter(
          (entry) => entry.group_id === groupId
        );

        const seriesIds = seriesItems.map((entry) => entry.id);

        await deleteRemindersForEntries(seriesIds);
        deletePlannerAlertChoices(seriesIds);

        const { error } = await supabase
          .from('planner_courses')
          .delete()
          .eq('user_id', user.id)
          .eq('group_id', groupId);

        if (error) {
          console.error('Delete series error:', error);
          alert(`Could not delete series: ${error.message}`);
          return;
        }

        seriesItems.forEach(removeLinkedCourseLocalItem);
      } else {
        const plannerEntry = courses.find((entry) => entry.id === id);

        await deleteRemindersForEntries([id]);
        deletePlannerAlertChoices([id]);

        const { error } = await supabase
          .from('planner_courses')
          .delete()
          .eq('user_id', user.id)
          .eq('id', id);

        if (error) {
          console.error('Delete entry error:', error);
          alert(`Could not delete entry: ${error.message}`);
          return;
        }

        if (plannerEntry) {
          removeLinkedCourseLocalItem(plannerEntry);
        }
      }

      setDeleteConfirmation(null);
      setIsModalOpen(false);
      setEditingEntry(null);

      await fetchCourses(user.id);
    } catch (error) {
      console.error('Planner delete error:', error);
      alert('Something went wrong while deleting.');
    }
  };

  const handleDeleteFromEdit = () => {
    if (!editingEntry || saving) return;

    if (editingEntry.group_id) {
      setIsModalOpen(false);
      setDeleteConfirmation(editingEntry);
      return;
    }

    const confirmed = window.confirm(
      `Delete "${editingEntry.name}"?`
    );

    if (!confirmed) return;

    executeDelete(editingEntry.id, false);
  };

  const toggleCompleted = async (entry) => {
    const nextCompleted = !entry.is_completed;

    // Update immediately so the Agenda visibly crosses out/restores the item.
    setCourses((current) =>
      current.map((item) =>
        item.id === entry.id
          ? { ...item, is_completed: nextCompleted }
          : item
      )
    );

    const { error } = await supabase
      .from('planner_courses')
      .update({
        is_completed: nextCompleted
      })
      .eq('id', entry.id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Complete entry error:', error);

      // Roll back if saving fails.
      setCourses((current) =>
        current.map((item) =>
          item.id === entry.id
            ? { ...item, is_completed: entry.is_completed }
            : item
        )
      );
      return;
    }

    updateLinkedCourseLocalItem(entry, {
      is_completed: nextCompleted
    });
  };

  const eraseAll = async () => {
    if (!user) return;

    const confirmed = window.confirm(
      'Erase every planner entry?'
    );

    if (!confirmed) return;

    const allIds = courses.map((entry) => entry.id);

    await deleteRemindersForEntries(allIds);
    deletePlannerAlertChoices(allIds);

    const linkedEntries = courses.filter((entry) =>
      parseCourseLink(entry.description || '')
    );

    const { error } = await supabase
      .from('planner_courses')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error('Erase all error:', error);
      alert(`Could not erase entries: ${error.message}`);
      return;
    }

    linkedEntries.forEach(removeLinkedCourseLocalItem);

    await fetchCourses(user.id);
  };

  const selectedDayEvents = courses.filter(
    (course) => course.date === selectedDateStr
  );

  const todayStr = formatDate(new Date());

  const upNextAll = courses
    .filter((course) => course.date >= todayStr)
    .sort((a, b) =>
      (a.date + (a.start_time || '')).localeCompare(
        b.date + (b.start_time || '')
      )
    );

  const upNextDone = upNextAll.filter(
    (course) => course.is_completed
  ).length;

  const upNextEvents = upNextAll.slice(0, 6);

  const upNextProgress = upNextAll.length
    ? Math.round((upNextDone / upNextAll.length) * 100)
    : 0;

  const ColorPalette = ({
    selectedColor,
    onChange,
    showCustom,
    setShowCustom
  }) => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '9px'
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          alignItems: 'center'
        }}
      >
        {camporaColors.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => {
              onChange(color);
              setShowCustom(false);
            }}
            style={{
              width: '28px',
              height: '28px',
              padding: 0,
              borderRadius: '50%',
              background: color,
              cursor: 'pointer',
              border:
                selectedColor === color
                  ? '2.5px solid #0B1A3F'
                  : '1px solid #CCD5E6',
              boxShadow:
                selectedColor === color
                  ? '0 0 0 2px white, 0 0 0 3px #0B1A3F18'
                  : 'none'
            }}
          />
        ))}
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowCustom(!showCustom)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
            background: 'white',
            border: '1.5px solid #CCD7EA',
            padding: '7px 11px',
            borderRadius: '9px',
            fontWeight: '900',
            fontSize: '11px',
            color: '#0B1A3F',
            cursor: 'pointer'
          }}
        >
          <Palette size={13} />
          Custom Color
          <Plus size={12} />
        </button>
      </div>

      {showCustom && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <input
            type="color"
            value={selectedColor}
            onChange={(event) => onChange(event.target.value)}
            style={{
              width: '40px',
              height: '32px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer'
            }}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              color: '#64748B',
              fontWeight: '800',
              fontSize: '11px'
            }}
          >
            <div
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '5px',
                background: selectedColor,
                border: '1px solid #CBD5E1'
              }}
            />
            Current color
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div
      style={{
        display: 'flex',
        gap: '25px',
        width: '100%',
        height: 'calc(100vh - 120px)',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}
        >
          <h1
            style={{
              fontSize: '28px',
              fontWeight: '900',
              color: '#0B1A3F',
              margin: 0
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{
                fontSize: '13px',
                fontWeight: '700',
                color: 'var(--campora-muted)',
                letterSpacing: '0.02em'
              }}>
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '9px', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '32px',
                  fontWeight: '800',
                  color: 'var(--campora-text)',
                  lineHeight: 1.08,
                  letterSpacing: '-0.025em'
                }}>
                  {selectedDate.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
                <span style={{
                  fontSize: '15px',
                  fontWeight: '700',
                  color: 'var(--campora-muted)'
                }}>
                  {selectedDate.getFullYear()}
                </span>
              </div>
            </div>
          </h1>

          <div
            style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
              flexWrap: 'wrap'
            }}
          >
            <button onClick={handleUploadClick} style={uploadScheduleBtn}>
              <Upload size={16} />
              <span style={{ whiteSpace: 'nowrap' }}>Upload schedule</span>
            </button>

            {scheduleImportIds.length > 0 && (
              <button
                onClick={handleClearSchedule}
                style={clearScheduleBtn}
                disabled={scheduleImporting}
              >
                <Trash2 size={16} />
                <span style={{ whiteSpace: 'nowrap' }}>Clear schedule</span>
              </button>
            )}

            <div style={switcherGroup}>
              {['Month', 'Week', 'Day'].map((view) => (
                <button
                  key={view}
                  onClick={() => setViewType(view)}
                  style={
                    viewType === view ? activeToggle : toggleStyle
                  }
                >
                  {view}
                </button>
              ))}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px',
                borderRadius: '12px',
                background: '#FFFFFF',
                border: '1px solid #E7EBF1'
              }}
            >
              <button onClick={handlePrev} style={navArrowBtn}>
                <ChevronLeft size={18} />
              </button>

              <button
                onClick={() => {
                  const now = new Date();
                  setViewDate(now);
                  setSelectedDate(now);
                }}
                style={todayNavBtn}
              >
                Today
              </button>

              <button onClick={handleNext} style={navArrowBtn}>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        <input
          ref={scheduleInputRef}
          type="file"
          accept=".pdf,.ics,.csv,application/pdf,text/calendar,text/csv"
          style={{ display: 'none' }}
          onChange={handleScheduleInputChange}
        />

        {scheduleNotice && (
          <div style={scheduleBannerStyle}>
            <CheckCircle2 size={16} color="#1E9E63" />
            <span style={{ flex: 1 }}>{scheduleNotice}</span>
            <button
              onClick={() => setScheduleNotice(null)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#1E6B45',
                display: 'flex'
              }}
              aria-label="Dismiss"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {scheduleError && (
          <div
            style={{
              ...scheduleBannerStyle,
              background: '#FDF2F1',
              border: '1px solid #F0C4BF',
              color: '#B3392F'
            }}
          >
            <AlertCircle size={16} color="#EE5D50" />
            <span style={{ flex: 1 }}>{scheduleError}</span>
            <button
              onClick={() => setScheduleError(null)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#B3392F',
                display: 'flex'
              }}
              aria-label="Dismiss"
            >
              <X size={15} />
            </button>
          </div>
        )}

        <div
          className="card"
          style={{
            flex: 1,
            padding: '20px',
            position: 'relative',
            border: '1.5px solid #E9EDF7',
            overflowY: 'auto'
          }}
        >
          {loading && (
            <RefreshCw
              className="animate-spin"
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                color: '#0B1A3F',
                zIndex: 20
              }}
            />
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                viewType === 'Day'
                  ? '1fr'
                  : 'repeat(7, minmax(0, 1fr))',
              gridTemplateRows:
                viewType !== 'Day' ? 'auto 1fr' : '1fr',
              gap: '10px',
              alignItems: 'start'
            }}
          >
            {viewType !== 'Day' &&
              days.map((day) => (
                <div key={day} style={dayHeader}>
                  {day.toUpperCase()}
                </div>
              ))}

            {viewType === 'Month' &&
              [...Array(startPadding)].map((_, index) => (
                <div key={`pad-${index}`} />
              ))}

            {dateArray.map((dateObj, index) => {
              const dateStr = formatDate(dateObj);
              const isSelected = dateStr === selectedDateStr;
              const dayEvents = courses.filter(
                (course) => course.date === dateStr
              );

              return (
                <div
                  key={index}
                  onClick={() => setSelectedDate(dateObj)}
                  style={{
                    height:
                      viewType === 'Month' ? '130px' : '480px',
                    padding: '10px',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    transition: '0.2s',
                    border: '1px solid #F1F4F9',
                    background: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    boxSizing: 'border-box'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '6px'
                    }}
                  >
                    <div style={{ minWidth: '24px' }}>
                      {isSelected && (
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            handleOpenModal(dateStr);
                          }}
                          style={cellAddIcon}
                        >
                          <Plus size={12} strokeWidth={3} />
                        </button>
                      )}
                    </div>

                    <span
                      style={{
                        fontWeight: '900',
                        color: '#0B1A3F',
                        fontSize:
                          viewType === 'Day' ? '28px' : '14px'
                      }}
                    >
                      {dateObj.getDate()}
                    </span>
                  </div>

                  <div
                    style={{
                      flex: 1,
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      paddingRight: '2px'
                    }}
                  >
                    {dayEvents.map((event) => {
                      const eventBackground = event.is_completed
                        ? '#F1F5F9'
                        : event.color || '#E1F2FF';

                      const eventTextColor = event.is_completed
                        ? '#0B1A3F'
                        : getContrastText(eventBackground);

                      return (
                        <div
                          key={event.id}
                          onClick={(clickEvent) => {
                            clickEvent.stopPropagation();
                            handleOpenEditModal(event);
                          }}
                          style={{
                            background: eventBackground,
                            fontSize:
                              viewType === 'Month' ? '10px' : '12px',
                            fontWeight: '800',
                            padding: '6px 8px',
                            borderRadius: '8px',
                            color: eventTextColor,
                            textDecoration: event.is_completed
                              ? 'line-through'
                              : 'none',
                            wordBreak: 'break-word',
                            boxShadow:
                              '0 1px 3px rgba(0,0,0,0.04)',
                            border:
                              '1px solid rgba(0,0,0,0.05)'
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <span
                              style={{
                                opacity: 0.78,
                                fontSize: '9px',
                                fontWeight: '700',
                                color: eventTextColor
                              }}
                            >
                              {event.start_time?.substring(0, 5)} -{' '}
                              {event.end_time?.substring(0, 5)}
                            </span>

                            <Edit3
                              size={11}
                              color={eventTextColor}
                              style={{
                                opacity: 0.65,
                                flexShrink: 0
                              }}
                            />
                          </div>

                          <div
                            style={{
                              fontWeight: '900',
                              marginTop: '2px',
                              lineHeight: '1.2',
                              color: eventTextColor
                            }}
                          >
                            {event.name}
                          </div>

                          {viewType !== 'Month' &&
                            visiblePlannerDescription(
                              event.description || ''
                            ) && (
                              <div
                                style={{
                                  fontSize: '10px',
                                  opacity: 0.88,
                                  marginTop: '4px',
                                  borderTop:
                                    eventTextColor === '#FFFFFF'
                                      ? '1px solid rgba(255,255,255,0.25)'
                                      : '1px solid rgba(11,26,57,0.12)',
                                  paddingTop: '4px',
                                  fontWeight: '500',
                                  lineHeight: '1.3',
                                  color: eventTextColor
                                }}
                              >
                                {visiblePlannerDescription(
                                  event.description || ''
                                )}
                              </div>
                            )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div
        style={{
          width: '330px',
          height: '100%',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          flexShrink: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingRight: '6px',
          paddingBottom: '18px',
          boxSizing: 'border-box',
          scrollbarWidth: 'thin',
          scrollbarColor: '#C9D2DF transparent'
        }}
      >
        <div
          className="card"
          style={{
            border: '1.5px solid #E9EDF7',
            padding: '16px'
          }}
        >
            <div
              className="label-caps"
              style={{ marginBottom: '10px' }}
            >
              Quick Jump
            </div>

            <div
              className="label-caps"
              style={{
                fontSize: '13px',
                fontWeight: '800',
                letterSpacing: 0,
                textTransform: 'none',
                color: 'var(--campora-text)',
                marginBottom: '8px'
              }}
            >
              {selectedDate.toLocaleString('default', {
                month: 'long',
                year: 'numeric'
              })}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '4px'
              }}
            >
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(
                (dayLabel) => (
                  <div
                    key={dayLabel}
                    className="label-caps"
                    style={{
                      textAlign: 'center',
                      fontSize: '10px',
                      paddingBottom: '4px'
                    }}
                  >
                    {dayLabel}
                  </div>
                )
              )}

              {[
                ...Array(
                  new Date(
                    selectedDate.getFullYear(),
                    selectedDate.getMonth(),
                    1
                  ).getDay()
                )
              ].map((_, padIndex) => (
                <div key={`qj-pad-${padIndex}`} />
              ))}

              {Array.from(
                {
                  length: new Date(
                    selectedDate.getFullYear(),
                    selectedDate.getMonth() + 1,
                    0
                  ).getDate()
                },
                (_, dayIndex) => {
                  const dayObject = new Date(
                    selectedDate.getFullYear(),
                    selectedDate.getMonth(),
                    dayIndex + 1
                  );
                  const dayString = formatDate(dayObject);
                  const dayIsToday = dayString === todayStr;
                  const dayIsSelected =
                    dayString === selectedDateStr;

                  return (
                    <button
                      key={dayIndex}
                      type="button"
                      onClick={() => {
                        setSelectedDate(dayObject);
                        setViewDate(dayObject);
                      }}
                      style={{
                        width: '26px',
                        height: '26px',
                        margin: '0 auto',
                        borderRadius: '50%',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight:
                          dayIsToday || dayIsSelected ? 800 : 600,
                        background:
                          dayIsSelected && !dayIsToday
                            ? 'var(--campora-navy)'
                            : dayIsToday
                            ? '#FFFFFF'
                            : 'transparent',
                        color:
                          dayIsSelected && !dayIsToday
                            ? '#FFFFFF'
                            : dayIsToday
                            ? 'var(--campora-navy)'
                            : 'var(--campora-body)',
                        boxShadow:
                          dayIsSelected && !dayIsToday
                            ? '0 4px 12px rgba(11,26,63,0.18)'
                            : dayIsToday
                            ? '0 3px 10px rgba(11,26,63,0.10)'
                            : 'none',
                        border:
                          dayIsSelected && !dayIsToday
                            ? '1px solid var(--campora-navy)'
                            : dayIsToday
                            ? '1px solid rgba(11,26,63,0.14)'
                            : '1px solid transparent'
                      }}
                    >
                      {dayObject.getDate()}
                    </button>
                  );
                }
              )}
            </div>
          </div>

        <div
          className="card"
          style={{
            border: '1.5px solid #E9EDF7',
              display: 'flex',
              flexDirection: 'column',
              height: '390px',
              minHeight: '390px',
              maxHeight: '390px',
              overflow: 'hidden',
              flexShrink: 0
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '14px',
                gap: '10px',
                flexShrink: 0
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  minWidth: 0
                }}
              >
                

                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '18px',
                      fontWeight: '700',
                      color: 'var(--campora-text)',
                      letterSpacing: '-0.01em'
                    }}
                  >
                    Agenda
                  </h3>


                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  alignItems: 'center'
                }}
              >
                <button
                  type="button"
                  onClick={eraseAll}
                  className="btn btn-sm btn-ghost"
                  style={{
                    color: 'var(--campora-urgent)',
                    background: 'var(--tone-error-soft)',
                    border: 'none',
                    padding: '7px 10px',
                    borderRadius: '9px',
                    fontSize: '11px',
                    fontWeight: '650',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'opacity 0.18s ease'
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.opacity = '0.82';
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.opacity = '1';
                  }}
                >
                  <span>Erase All</span>
                  <Trash2 size={14} strokeWidth={2} />
                </button>

                <button
                  type="button"
                  title="Add entry"
                  onClick={() => handleOpenModal(selectedDateStr)}
                  className="btn btn-sm btn-primary"
                  style={{ width: '36px', height: '36px', padding: 0 }}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div
              style={{
                flex: 1,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                overflowY: 'auto',
                overflowX: 'hidden',
                paddingRight: '6px',
                paddingBottom: '10px',
                scrollbarWidth: 'thin',
                scrollbarColor: '#C9D2DF transparent'
              }}
            >
              {upNextEvents.length > 0 ? (
                upNextEvents.map((event) => {
                  const savedAlert =
                    readPlannerAlertLinks()[event.id] || {};

                  const agendaAlertMode =
                    savedAlert.alertMode ||
                    savedAlert.type ||
                    (event.reminder ? 'reminder' : 'none');

                  const barColor = event.is_completed
                    ? 'var(--surface-container-highest)'
                    : darkModeColor(event.color || '#E1F2FF');

                  const eventDate = new Date(
                    `${event.date}T00:00:00`
                  );

                  return (
                    <div
                      key={event.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleOpenEditModal(event)}
                      onKeyDown={(eventKey) => {
                        if (eventKey.key === 'Enter' || eventKey.key === ' ') {
                          eventKey.preventDefault();
                          handleOpenEditModal(event);
                        }
                      }}
                      style={{
                        position: 'relative',
                        overflow: 'hidden',
                        borderRadius: '18px',
                        padding: '16px 16px 15px 20px',
                        background: event.is_completed
                          ? '#FFFFFF'
                          : `${darkModeColor(event.color || '#E1F2FF')}24`,
                        border: event.is_completed
                          ? '1px solid #E7ECF3'
                          : `1px solid ${darkModeColor(event.color || '#E1F2FF')}55`,
                        boxShadow: '0 4px 14px rgba(11,26,63,0.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        gap: '10px',
                        minHeight: '168px',
                        height: 'auto',
                        boxSizing: 'border-box',
                        flexShrink: 0,
                        cursor: 'pointer',
                        outline: 'none',
                        transition:
                          'box-shadow 0.18s ease, border-color 0.18s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow =
                          '0 9px 22px rgba(11,26,63,0.085)';
                        e.currentTarget.style.borderColor =
                          'rgba(0,45,98,0.16)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow =
                          '0 3px 12px rgba(11, 26, 63, 0.045)';
                        e.currentTarget.style.borderColor =
                          'var(--hairline)';
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: '13px',
                          bottom: '13px',
                          width: '5px',
                          borderRadius: '0 5px 5px 0',
                          background: event.is_completed
                            ? '#E5EAF0'
                            : darkModeColor(event.color || '#0B1A3F'),
                          opacity: 0.75
                        }}
                      />

                                            <div style={{ width: '100%', minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: '10px'
                          }}
                        >
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                flexWrap: 'wrap'
                              }}
                            >
                              <span
                                style={{
                                  width: '11px',
                                  height: '11px',
                                  borderRadius: '50%',
                                  background: event.is_completed
                                    ? 'var(--surface-container-highest)'
                                    : darkModeColor(
                                        event.color || '#E1F2FF'
                                      ),
                                  border: '1px solid rgba(0,45,98,0.10)',
                                  flexShrink: 0
                                }}
                              />

                              <span
                                style={{
                                  fontSize: '16px',
                                  fontWeight: '900',
                                  color: event.is_completed
                                    ? '#7B8798'
                                    : '#0B1A3F',
                                  textDecoration: event.is_completed
                                    ? 'line-through'
                                    : 'none',
                                  lineHeight: '1.3',
                                  wordBreak: 'break-word',
                                  flex: 1,
                                  minWidth: 0
                                }}
                              >
                                {event.name}
                              </span>

                              <button
                                type="button"
                                title={event.is_completed ? 'Mark incomplete' : 'Mark complete'}
                                onClick={(clickEvent) => {
                                  clickEvent.stopPropagation();
                                  toggleCompleted(event);
                                }}
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '50%',
                                  border: event.is_completed
                                    ? '1px solid #0B1A3F'
                                    : '1.5px solid #CBD5E1',
                                  background: event.is_completed
                                    ? '#0B1A3F'
                                    : '#FFFFFF',
                                  color: event.is_completed
                                    ? '#FFFFFF'
                                    : '#7B8798',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  flexShrink: 0,
                                  padding: 0
                                }}
                              >
                                <CheckCircle2 size={15} strokeWidth={2.2} />
                              </button>

                              {event.is_completed && (
                                <span
                                  className="label-caps"
                                  style={{
                                    fontSize: '9px',
                                    color: 'var(--campora-muted)'
                                  }}
                                >
                                  Completed
                                </span>
                              )}
                            </div>

                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                flexWrap: 'wrap',
                                marginTop: '6px'
                              }}
                            >
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  height: '24px',
                                  padding: '0 8px',
                                  borderRadius: '999px',
                                  background: 'rgba(255,255,255,0.72)',
                                  border: '1px solid rgba(0,45,98,0.08)',
                                  fontSize: '11px',
                                  fontWeight: '800',
                                  color: 'var(--campora-navy)'
                                }}
                              >
                                {event.type || 'Entry'}
                              </span>

                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  color: 'var(--campora-muted)'
                                }}
                              >
                                <CalIcon size={11} />
                                {eventDate.toLocaleDateString('default', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>

                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  color: 'var(--campora-muted)'
                                }}
                              >
                                {event.start_time?.substring(0, 5) || ''}
                                {event.end_time
                                  ? ` – ${event.end_time.substring(0, 5)}`
                                  : ''}
                              </span>

                              {agendaAlertMode === 'notification' && (
                                <span
                                  title="Notification"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#648CCB'
                                  }}
                                >
                                  <Bell size={13} strokeWidth={2.2} />
                                </span>
                              )}

                              {agendaAlertMode === 'reminder' && (
                                <span
                                  title="Reminder"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#8B78B8'
                                  }}
                                >
                                  <AlarmClock size={13} strokeWidth={2.2} />
                                </span>
                              )}

                              {agendaAlertMode === 'both' && (
                                <span
                                  title="Notification + Reminder"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px'
                                  }}
                                >
                                  <Bell
                                    size={13}
                                    strokeWidth={2.2}
                                    color="#648CCB"
                                  />
                                  <AlarmClock
                                    size={13}
                                    strokeWidth={2.2}
                                    color="#8B78B8"
                                  />
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {visiblePlannerDescription(event.description || '') && (
                          <div
                            className="planner-upnext-details"
                            style={{
                              marginTop: '10px',
                              padding: '14px 14px',
                              minHeight: '88px',
                              borderRadius: '12px',
                              background: event.is_completed
                                ? '#FAFBFC'
                                : `${darkModeColor(event.color || '#E1F2FF')}18`,
                              border: event.is_completed
                                ? '1px solid #E7ECF3'
                                : `1px solid ${darkModeColor(event.color || '#E1F2FF')}38`,
                              width: '100%',
                              maxWidth: '100%',
                              boxSizing: 'border-box',
                              overflow: 'hidden'
                            }}
                          >
                            <div
                              className="planner-upnext-details-label"
                              style={{
                                fontSize: '9px',
                                fontWeight: '900',
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                                color: 'var(--campora-muted)',
                                marginBottom: '4px'
                              }}
                            >
                              Details
                            </div>

                            <div
                              className="planner-upnext-details-text"
                              style={{
                                fontSize: '13px',
                                lineHeight: '1.65',
                                fontWeight: '600',
                                color: 'var(--campora-body)',
                                textDecoration: event.is_completed
                                  ? 'line-through'
                                  : 'none',
                                opacity: event.is_completed ? 0.55 : 1,
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                overflow: 'visible',
                                maxHeight: 'none',
                                minHeight: '52px',
                                width: '100%',
                                boxSizing: 'border-box',
                                paddingRight: 0,
                                paddingBottom: '2px'
                              }}
                            >
                              {visiblePlannerDescription(event.description || '')}
                            </div>
                          </div>
                        )}
                      </div>

                      <div
                        style={{
                          width: '100%',
                          display: 'flex',
                          gap: '8px',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          flexShrink: 0,
                          paddingTop: '9px',
                          marginTop: '2px',
                          borderTop: '1px solid rgba(0,45,98,0.08)'
                        }}
                      >
                        <button
                          type="button"
                          title="Edit entry"
                          onClick={(clickEvent) => {
                            clickEvent.stopPropagation();
                            handleOpenEditModal(event);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            height: '30px',
                            padding: '0 10px',
                            borderRadius: '999px',
                            border: '1px solid rgba(0,45,98,0.10)',
                            background: 'rgba(255,255,255,0.78)',
                            color: 'var(--campora-navy)',
                            fontSize: '10px',
                            fontWeight: '800',
                            cursor: 'pointer'
                          }}
                        >
                          <Edit3 size={12} />
                          Edit
                        </button>

                        <button
                          type="button"
                          title="Delete entry"
                          onClick={(clickEvent) => {
                            clickEvent.stopPropagation();
                            if (event.group_id) {
                              setDeleteConfirmation(event);
                            } else {
                              const confirmed = window.confirm(
                                'Delete this entry?'
                              );

                              if (confirmed) {
                                executeDelete(event.id, false);
                              }
                            }
                          }}
                          style={{
                            width: '30px',
                            height: '30px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '999px',
                            border: 'none',
                            background: 'var(--tone-error-soft)',
                            color: 'var(--campora-urgent)',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div
                  style={{
                    flex: 1,
                    minHeight: '250px',
                    borderRadius: '18px',
                    background: '#FFFFFF',
                    border: '1px solid #E5EAF2',
                    boxShadow: '0 6px 18px rgba(11,26,63,0.035)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '18px'
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center'
                    }}
                  >
                    <div
                      style={{
                        width: '62px',
                        height: '62px',
                        borderRadius: '50%',
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 5px 16px rgba(11,26,63,0.08)',
                        color: '#0B1A3F',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '14px'
                      }}
                    >
                      <CalIcon size={27} strokeWidth={1.9} />
                    </div>

                    <h3
                      style={{
                        margin: 0,
                        color: '#0B1A3F',
                        fontSize: '16px',
                        fontWeight: '900'
                      }}
                    >
                      Free Day
                    </h3>

                    <p
                      style={{
                        margin: '7px 0 0',
                        color: '#7A879A',
                        fontSize: '11px',
                        fontWeight: '700',
                        lineHeight: 1.5
                      }}
                    >
                      Nothing coming up yet. Use the button above to plan something.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

        <div
          className="card"
          style={{
            flex: '0 0 auto',
            border: '1.5px solid #E9EDF7',
            display: 'flex',
            flexDirection: 'column',
            padding: '16px',
            minHeight: '335px',
            height: '335px',
            flexShrink: 0,
            overflow: 'visible'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '7px'
            }}
          >
            <div>
              <h4
                style={{
                  fontSize: '12px',
                  fontWeight: '900',
                  color: '#0B1A3F',
                  margin: 0,
                  letterSpacing: '0.5px'
                }}
              >
                STICKIES
              </h4>

              <span
                style={{
                  fontSize: '9px',
                  color: '#A3AED0',
                  fontWeight: '700'
                }}
              >
                {selectedDateStr}
              </span>
            </div>

            {stickyText && (
              <button
                type="button"
                onClick={() => {
                  const confirmed = window.confirm(
                    'Clear this sticky?'
                  );

                  if (confirmed) clearSticky();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#EE5D50',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: '900'
                }}
              >
                Clear
              </button>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              marginBottom: '8px',
              flexWrap: 'nowrap'
            }}
          >
            {camporaColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  handleStickyColorChange(color);
                  setShowStickyCustomColor(false);
                }}
                style={{
                  width: '18px',
                  height: '18px',
                  minWidth: '18px',
                  padding: 0,
                  borderRadius: '50%',
                  background: color,
                  cursor: 'pointer',
                  border:
                    stickyColor === color
                      ? '2px solid #0B1A3F'
                      : '1px solid #CCD5E6',
                  boxShadow:
                    stickyColor === color
                      ? '0 0 0 2px white'
                      : 'none'
                }}
              />
            ))}

            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                minWidth: 0
              }}
            >
              <button
                type="button"
                title="Custom Color"
                onClick={() =>
                  setShowStickyCustomColor(!showStickyCustomColor)
                }
                style={{
                  height: '24px',
                  padding: '0 6px',
                  borderRadius: '7px',
                  background: 'white',
                  border: '1.5px solid #CCD5E6',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '3px',
                  color: '#0B1A3F',
                  fontSize: '9px',
                  fontWeight: '900',
                  whiteSpace: 'nowrap'
                }}
              >
                <Plus size={10} strokeWidth={3} />
                Custom
              </button>

              {showStickyCustomColor && (
                <div
                  style={{
                    position: 'absolute',
                    top: '30px',
                    right: 0,
                    zIndex: 30,
                    background: 'white',
                    padding: '8px',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    boxShadow:
                      '0 8px 20px rgba(11,26,57,0.12)'
                  }}
                >
                  <input
                    type="color"
                    value={stickyColor}
                    onChange={(event) =>
                      handleStickyColorChange(event.target.value)
                    }
                    style={{
                      width: '42px',
                      height: '34px',
                      padding: 0,
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer'
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              background: stickyColor,
              flex: 1,
              minHeight: '225px',
              padding: '16px',
              borderRadius: '2px 2px 25px 2px',
              boxShadow:
                '0 8px 16px -8px rgba(0,0,0,0.15)',
              display: 'flex'
            }}
          >
            <textarea
              placeholder="Sticky memo..."
              value={stickyText}
              onChange={(event) =>
                handleStickyTextChange(event.target.value)
              }
              style={{
                width: '100%',
                height: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                resize: 'none',
                fontWeight: '800',
                color: getContrastText(stickyColor),
                caretColor: getContrastText(stickyColor),
                fontSize: '13px',
                lineHeight: '1.45',
                fontFamily: 'inherit'
              }}
            />
          </div>
        </div>
      </div>

      {deleteConfirmation && (
        <div style={overlay}>
          <div
            className="card"
            style={{
              width: '380px',
              border: '2px solid #0B1A3F',
              padding: '30px',
              textAlign: 'center'
            }}
          >
            <AlertCircle
              size={36}
              color="#EE5D50"
              style={{ marginBottom: '16px' }}
            />

            <h2
              style={{
                marginBottom: '8px',
                fontWeight: '900',
                color: '#0B1A3F',
                fontSize: '20px'
              }}
            >
              Series Options
            </h2>

            <p
              style={{
                color: '#A3AED0',
                fontWeight: '800',
                marginBottom: '24px',
                fontSize: '13px'
              }}
            >
              Delete only this occurrence or the entire repeating
              series?
            </p>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <button
                onClick={() =>
                  executeDelete(deleteConfirmation.id, false)
                }
                style={seriesBtnStyle}
              >
                Only this instance
              </button>

              <button
                onClick={() =>
                  executeDelete(
                    deleteConfirmation.id,
                    true,
                    deleteConfirmation.group_id
                  )
                }
                style={{
                  ...seriesBtnStyle,
                  background: '#EE5D50'
                }}
              >
                Delete Entire Series
              </button>

              <button
                onClick={() => setDeleteConfirmation(null)}
                style={cancelButtonStyle}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {editSeriesConfirmation && (
        <div
          style={{
            ...overlay,
            zIndex: 1200
          }}
        >
          <div
            className="card"
            style={{
              width: '390px',
              border: '2px solid #0B1A3F',
              padding: '30px',
              textAlign: 'center'
            }}
          >
            <Edit3
              size={34}
              color="#0B1A3F"
              style={{ marginBottom: '14px' }}
            />

            <h2
              style={{
                margin: '0 0 8px',
                fontWeight: '900',
                color: '#0B1A3F',
                fontSize: '20px'
              }}
            >
              Update Series
            </h2>

            <p
              style={{
                color: '#A3AED0',
                fontWeight: '800',
                margin: '0 0 24px',
                fontSize: '13px',
                lineHeight: '1.5'
              }}
            >
              Do you want these changes to apply only to this
              occurrence or to the entire repeating schedule?
            </p>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <button
                onClick={confirmEditSingle}
                disabled={saving}
                style={{
                  ...seriesBtnStyle,
                  opacity: saving ? 0.65 : 1,
                  cursor: saving ? 'not-allowed' : 'pointer'
                }}
              >
                {saving ? 'Saving...' : 'Only this instance'}
              </button>

              <button
                onClick={confirmEditSeries}
                disabled={saving}
                style={{
                  ...seriesBtnStyle,
                  opacity: saving ? 0.65 : 1,
                  cursor: saving ? 'not-allowed' : 'pointer'
                }}
              >
                {saving ? 'Saving...' : 'Entire series'}
              </button>

              <button
                disabled={saving}
                onClick={() => setEditSeriesConfirmation(null)}
                style={{
                  ...cancelButtonStyle,
                  opacity: saving ? 0.6 : 1
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {scheduleModalOpen && (
        <div style={overlay}>
          <div
            className="card"
            style={{
              width: 'min(460px, calc(100vw - 32px))',
              border: '2px solid #0B1A3F',
              padding: '30px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '6px'
              }}
            >
              <Upload size={20} color="#0B1A3F" />
              <h2
                style={{
                  margin: 0,
                  fontWeight: '900',
                  color: '#0B1A3F',
                  fontSize: '20px'
                }}
              >
                Import schedule
              </h2>
            </div>

            <p
              style={{
                color: '#A3AED0',
                fontWeight: '700',
                fontSize: '13px',
                margin: '0 0 20px',
                wordBreak: 'break-word'
              }}
            >
              {scheduleFile} · {scheduleEvents?.length ?? 0} event
              {scheduleEvents?.length === 1 ? '' : 's'} found
            </p>

            <label
              style={{
                display: 'block',
                fontWeight: '800',
                color: '#0B1A3F',
                fontSize: '13px',
                marginBottom: '8px'
              }}
            >
              Choose the week your schedule starts
            </label>

            <div
              style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                marginBottom: '12px'
              }}
            >
              {[
                { label: 'This week', offset: 0 },
                { label: 'Next week', offset: 1 },
                { label: 'Following week', offset: 2 }
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setStartFromWeekOffset(preset.offset)}
                  style={
                    scheduleStartDate === presetDateForOffset(preset.offset)
                      ? weekPresetActive
                      : weekPreset
                  }
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <input
              type="date"
              value={scheduleStartDate}
              min={formatDate(new Date())}
              onChange={(e) => setScheduleStartDate(e.target.value)}
              style={scheduleDateInput}
            />

            <p
              style={{
                color: '#A3AED0',
                fontWeight: '700',
                fontSize: '13px',
                margin: '14px 0 0',
                lineHeight: '1.5'
              }}
            >
              {scheduleEvents && scheduleStartDate
                ? `${expandScheduleEvents(scheduleEvents, {
                    startDate: scheduleStartDate
                  }).length} entries will be added from ${new Date(
                    `${scheduleStartDate}T00:00:00`
                  ).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}.`
                : ''}
            </p>

            {scheduleError && (
              <p
                style={{
                  color: '#B3392F',
                  fontWeight: '700',
                  fontSize: '13px',
                  margin: '12px 0 0'
                }}
              >
                {scheduleError}
              </p>
            )}

            <div
              style={{
                display: 'flex',
                gap: '10px',
                justifyContent: 'flex-end',
                marginTop: '24px'
              }}
            >
              <button
                onClick={() => {
                  setScheduleModalOpen(false);
                  setScheduleFile(null);
                  setScheduleEvents(null);
                  setScheduleError(null);
                }}
                style={cancelButtonStyle}
                disabled={scheduleImporting}
              >
                Cancel
              </button>

              <button
                onClick={confirmScheduleImport}
                disabled={scheduleImporting || !scheduleStartDate}
                style={{
                  ...saveBtn,
                  minWidth: '158px',
                  opacity:
                    scheduleImporting || !scheduleStartDate ? 0.55 : 1,
                  cursor:
                    scheduleImporting || !scheduleStartDate
                      ? 'not-allowed'
                      : 'pointer'
                }}
              >
                {scheduleImporting ? (
                  <>
                    <RefreshCw
                      size={15}
                      style={{
                        animation: 'camporaSpin 0.9s linear infinite',
                        marginRight: '6px',
                        verticalAlign: 'middle'
                      }}
                    />
                    Importing...
                  </>
                ) : (
                  'Import schedule'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div style={overlay}>
          <div
            className="card"
            style={{
              width: 'min(540px, calc(100vw - 32px))',
              maxHeight: '90vh',
              overflowY: 'auto',
              border: '1px solid #DCE4F0',
              borderRadius: '24px',
              padding: '0',
              background: '#FFFFFF',
              boxShadow: '0 28px 80px rgba(11, 26, 63, 0.22)'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '24px 28px 18px',
                borderBottom: '1px solid #EEF2F7',
                position: 'sticky',
                top: 0,
                zIndex: 3,
                background: 'rgba(255,255,255,0.96)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontWeight: '900',
                    color: '#0B1A3F',
                    fontSize: '24px',
                    letterSpacing: '-0.5px'
                  }}
                >
                  {editingEntry ? 'Edit Entry' : 'New Entry'}
                </h2>
                <div
                  style={{
                    marginTop: '4px',
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#94A3B8'
                  }}
                >
                  {editingEntry
                    ? 'Update the details for this planner entry.'
                    : 'Add a class, task, exam, or event to your planner.'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {editingEntry && (
                  <button
                    type="button"
                    title="Delete Entry"
                    onClick={handleDeleteFromEdit}
                    disabled={saving}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '11px',
                      background: '#FFF5F5',
                      border: '1px solid #FECACA',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#EE5D50',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      opacity: saving ? 0.5 : 1
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}

                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => {
                    if (!saving) {
                      setIsModalOpen(false);
                      setEditingEntry(null);
                    }
                  }}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '11px',
                    border: '1px solid #E2E8F0',
                    background: '#F8FAFC',
                    color: '#0B1A3F',
                    fontSize: '22px',
                    lineHeight: 1,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            <form
              onSubmit={handleSaveEntry}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                padding: '22px 28px 28px'
              }}
            >
              <input
                type="text"
                placeholder="Title"
                required
                style={modalInput}
                value={newEntry.name}
                onChange={(event) =>
                  setNewEntry({
                    ...newEntry,
                    name: event.target.value
                  })
                }
              />

              <textarea
                placeholder="Add small notes..."
                style={{
                  ...modalInput,
                  resize: 'none',
                  height: '55px',
                  fontFamily: 'inherit'
                }}
                value={newEntry.description}
                onChange={(event) =>
                  setNewEntry({
                    ...newEntry,
                    description: event.target.value
                  })
                }
              />

              <div
                style={{
                  display: 'flex',
                  gap: '10px'
                }}
              >
                <select
                  style={modalInput}
                  value={newEntry.type}
                  onChange={(event) => {
                    const type = event.target.value;

                    setNewEntry({
                      ...newEntry,
                      type,
                      repeat: isRepeatableType(type)
                        ? newEntry.repeat
                        : 'none'
                    });
                  }}
                >
                  <option value="Class">Class</option>
                  <option value="Lab">Lab</option>
                  <option value="Recitation">Recitation</option>
                  <option value="Task">Task</option>
                  <option value="Exam">Exam</option>
                  <option value="Event">Event</option>
                </select>

                <input
                  type="date"
                  style={modalInput}
                  value={newEntry.date}
                  onChange={(event) =>
                    setNewEntry({
                      ...newEntry,
                      date: event.target.value
                    })
                  }
                />
              </div>

              {isRepeatableType(newEntry.type) && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    padding: '16px',
                    background: '#F8FAFC',
                    borderRadius: '16px',
                    border: '1px solid #E7EDF5'
                  }}
                >
                  <div
                    style={{
                      fontSize: '10px',
                      fontWeight: '900',
                      color: '#0B1A3F'
                    }}
                  >
                    REPEAT
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '7px'
                    }}
                  >
                    {[
                      { value: 'none', label: 'None' },
                      { value: 'MWF', label: 'MWF' },
                      { value: 'TTH', label: 'TTH' },
                      { value: 'Weekly', label: 'Weekly' }
                    ].map((repeatOption) => (
                      <button
                        type="button"
                        key={repeatOption.value}
                        onClick={() =>
                          setNewEntry({
                            ...newEntry,
                            repeat: repeatOption.value
                          })
                        }
                        style={{
                          padding: '6px 12px',
                          borderRadius: '7px',
                          border:
                            newEntry.repeat === repeatOption.value
                              ? '1.5px solid #0B1A3F'
                              : '1px solid #D8E0EE',
                          fontSize: '10px',
                          fontWeight: '900',
                          cursor: 'pointer',
                          background:
                            newEntry.repeat === repeatOption.value
                              ? '#0B1A3F'
                              : 'white',
                          color:
                            newEntry.repeat === repeatOption.value
                              ? 'white'
                              : '#0B1A3F'
                        }}
                      >
                        {repeatOption.label}
                      </button>
                    ))}
                  </div>

                  {newEntry.repeat !== 'none' && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: '900',
                          color: '#0B1A3F',
                          minWidth: '42px'
                        }}
                      >
                        UNTIL
                      </span>

                      <input
                        type="date"
                        min={newEntry.date}
                        style={{
                          ...modalInput,
                          padding: '6px 8px',
                          fontSize: '11px'
                        }}
                        value={newEntry.until_date}
                        onChange={(event) =>
                          setNewEntry({
                            ...newEntry,
                            until_date: event.target.value
                          })
                        }
                      />
                    </div>
                  )}
                </div>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: '10px'
                }}
              >
                {[
                  { key: 'start_time', label: 'START TIME' },
                  { key: 'end_time', label: 'END TIME' }
                ].map(({ key, label }) => {
                  const timeValue = newEntry[key] || '09:00';
                  const hour = Number(timeValue.split(':')[0] || 0);
                  const period = hour >= 12 ? 'PM' : 'AM';

                  return (
                    <div
                      key={key}
                      style={{
                        padding: '11px 13px',
                        background: '#FFFFFF',
                        border: '1px solid #DCE4EF',
                        borderRadius: '14px'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginBottom: '6px',
                          color: '#94A3B8',
                          fontSize: '9px',
                          fontWeight: '900',
                          letterSpacing: '0.05em'
                        }}
                      >
                        <AlarmClock size={13} strokeWidth={2.3} />
                        {label}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <input
                          type="time"
                          value={timeValue}
                          onChange={(event) =>
                            setNewEntry({
                              ...newEntry,
                              [key]: event.target.value
                            })
                          }
                          style={{
                            flex: 1,
                            minWidth: 0,
                            border: 'none',
                            outline: 'none',
                            background: 'transparent',
                            color: '#0B1A3F',
                            fontSize: '16px',
                            fontWeight: '850',
                            fontFamily: 'inherit',
                            padding: 0
                          }}
                        />

                        <span
                          style={{
                            flexShrink: 0,
                            padding: '5px 8px',
                            borderRadius: '9px',
                            background: '#F1F5F9',
                            color: '#0B1A3F',
                            fontSize: '10px',
                            fontWeight: '900'
                          }}
                        >
                          {period}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div
                style={{
                  padding: '16px',
                  background: '#F8FAFC',
                  border: '1px solid #E7EDF5',
                  borderRadius: '16px'
                }}
              >
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: '900',
                    color: '#94A3B8',
                    marginBottom: '9px'
                  }}
                >
                  ALERT
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    gap: '8px'
                  }}
                >
                  {[
                    {
                      value: 'none',
                      label: 'None',
                      icon: BellOff,
                      color: '#75839A',
                      soft: '#F6F8FB',
                      border: '#E4E8EF'
                    },
                    {
                      value: 'notification',
                      label: 'Notification',
                      icon: Bell,
                      color: '#648CCB',
                      soft: '#F3F7FD',
                      border: '#DDE7F5'
                    },
                    {
                      value: 'reminder',
                      label: 'Reminder',
                      icon: AlarmClock,
                      color: '#8B78B8',
                      soft: '#F7F4FC',
                      border: '#E7E0F2'
                    },
                    {
                      value: 'both',
                      label: 'Both',
                      icon: Bell,
                      color: '#0B1A3F',
                      soft: '#F4F6FA',
                      border: '#DCE2EC'
                    }
                  ].map((option) => {
                    const AlertIcon = option.icon;
                    const active = newEntry.alertType === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setNewEntry({
                            ...newEntry,
                            alertType: option.value,
                            reminder: option.value === 'reminder' || option.value === 'both'
                          })
                        }
                        style={{
                          minHeight: '43px',
                          borderRadius: '10px',
                          border: active
                            ? `1.5px solid ${option.color}`
                            : `1px solid ${option.border}`,
                          background: active
                            ? option.color
                            : option.soft,
                          color: active
                            ? '#FFFFFF'
                            : option.color,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          fontSize: '10px',
                          fontWeight: '900'
                        }}
                      >
                        <AlertIcon size={14} />
                        {option.label}
                      </button>
                    );
                  })}
                </div>

                {newEntry.alertType !== 'none' && (
                  <div
                    style={{
                      marginTop: '9px',
                      color:
                        newEntry.alertType === 'both'
                          ? '#0B1A3F'
                          : newEntry.alertType === 'reminder'
                          ? '#8B78B8'
                          : '#648CCB',
                      fontSize: '10px',
                      fontWeight: '800',
                      lineHeight: 1.45
                    }}
                  >
                    {newEntry.alertType === 'both'
                      ? 'This entry will appear as both a Notification and a Reminder.'
                      : newEntry.alertType === 'reminder'
                      ? 'This entry will appear under Reminders in Notifications & Reminders.'
                      : 'This entry will be added to the Notifications section.'}
                  </div>
                )}
              </div>

              <div style={{ paddingTop: '4px' }}>
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: '900',
                    color: '#94A3B8',
                    marginBottom: '8px'
                  }}
                >
                  COLOR
                </div>

                <ColorPalette
                  selectedColor={newEntry.color}
                  onChange={(color) =>
                    setNewEntry({
                      ...newEntry,
                      color
                    })
                  }
                  showCustom={showEntryCustomColor}
                  setShowCustom={setShowEntryCustomColor}
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                style={{
                  ...saveBtn,
                  opacity: saving ? 0.65 : 1,
                  cursor: saving ? 'not-allowed' : 'pointer'
                }}
              >
                {saving
                  ? 'Saving...'
                  : editingEntry
                  ? 'Save Changes'
                  : 'Confirm'}
              </button>

              {editingEntry && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleDeleteFromEdit}
                  style={{
                    background: '#FFF5F5',
                    border: '1.5px solid #FECACA',
                    color: '#EE5D50',
                    padding: '10px',
                    borderRadius: '10px',
                    fontWeight: '900',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '7px',
                    opacity: saving ? 0.5 : 1
                  }}
                >
                  <Trash2 size={14} />
                  Delete Entry
                </button>
              )}

              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingEntry(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontWeight: '900',
                  color: '#A3AED0',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  marginTop: '4px',
                  opacity: saving ? 0.5 : 1
                }}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const switcherGroup = {
  display: 'flex',
  background: '#FFFFFF',
  padding: '4px',
  borderRadius: '12px',
  border: '1px solid #E7EBF1'
};

const toggleStyle = {
  background: 'transparent',
  border: 'none',
  padding: '7px 13px',
  fontSize: '11px',
  fontWeight: '700',
  color: '#7E899B',
  cursor: 'pointer',
  borderRadius: '8px'
};

const activeToggle = {
  ...toggleStyle,
  background: '#0B1A3F',
  color: '#FFFFFF',
  boxShadow: '0 3px 8px rgba(11,26,63,0.14)'
};

const navArrowBtn = {
  width: '34px',
  height: '34px',
  border: 'none',
  borderRadius: '9px',
  background: '#F7F9FC',
  color: '#0B1A3F',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const todayNavBtn = {
  minWidth: '62px',
  height: '34px',
  border: 'none',
  borderRadius: '9px',
  background: '#FFFFFF',
  color: '#0B1A3F',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: '700',
  padding: '0 12px'
};

const saveBtn = {
  background: '#0B1A3F',
  border: 'none',
  color: 'white',
  minHeight: '48px',
  padding: '12px 16px',
  borderRadius: '13px',
  fontWeight: '900',
  cursor: 'pointer',
  fontSize: '13px',
  marginTop: '4px',
  boxShadow: '0 8px 18px rgba(11,26,63,0.16)'
};

const seriesBtnStyle = {
  background: '#0B1A3F',
  color: 'white',
  border: 'none',
  padding: '12px',
  borderRadius: '10px',
  fontWeight: '900',
  cursor: 'pointer',
  fontSize: '12px'
};

const cancelButtonStyle = {
  background: '#F1F5F9',
  border: 'none',
  padding: '10px',
  borderRadius: '10px',
  fontWeight: '900',
  cursor: 'pointer',
  color: '#0B1A3F'
};

const dayHeader = {
  textAlign: 'center',
  fontWeight: '900',
  color: '#94A3B8',
  fontSize: '11px',
  paddingBottom: '6px'
};

const cellAddIcon = {
  width: '22px',
  height: '22px',
  borderRadius: '50%',
  background: '#0B1A3F',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  cursor: 'pointer',
  transition: '0.2s',
  boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
};

const modalInput = {
  minHeight: '46px',
  padding: '11px 13px',
  borderRadius: '12px',
  border: '1.5px solid #DCE4EF',
  background: '#FFFFFF',
  fontWeight: '800',
  outline: 'none',
  fontSize: '12px',
  flex: 1,
  color: '#0B1A3F',
  boxSizing: 'border-box',
  boxShadow: '0 1px 2px rgba(11,26,63,0.02)'
};

const overlay = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(11,26,57,0.28)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '16px',
  zIndex: 1000
};

const uploadScheduleBtn = {
  display: 'flex',
  alignItems: 'center',
  gap: '7px',
  padding: '9px 14px',
  borderRadius: '12px',
  background: '#0B1A3F',
  color: '#FFFFFF',
  border: 'none',
  fontWeight: '800',
  fontSize: '13px',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'all 0.15s ease'
};

const clearScheduleBtn = {
  display: 'flex',
  alignItems: 'center',
  gap: '7px',
  padding: '9px 14px',
  borderRadius: '12px',
  background: '#FFFFFF',
  color: '#EE5D50',
  border: '1.5px solid #F3CDC8',
  fontWeight: '800',
  fontSize: '13px',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'all 0.15s ease'
};

const scheduleBannerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '12px 14px',
  borderRadius: '12px',
  background: '#EFF8F3',
  border: '1px solid #CDEBD9',
  color: '#1E6B45',
  fontWeight: '700',
  fontSize: '13px',
  marginBottom: '14px'
};

const weekPreset = {
  padding: '7px 12px',
  borderRadius: '10px',
  border: '1.5px solid #E7EBF1',
  background: '#FFFFFF',
  color: '#0B1A3F',
  fontWeight: '700',
  fontSize: '12px',
  cursor: 'pointer'
};

const weekPresetActive = {
  ...weekPreset,
  border: '1.5px solid #0B1A3F',
  background: '#0B1A3F',
  color: '#FFFFFF'
};

const scheduleDateInput = {
  width: '100%',
  padding: '11px 12px',
  borderRadius: '12px',
  border: '1.5px solid #E7EBF1',
  background: '#F7F9FC',
  fontWeight: '700',
  color: '#0B1A3F',
  fontSize: '14px',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box'
};
