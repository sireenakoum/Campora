import React, { useState, useEffect } from 'react';

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
  AlarmClock
} from 'lucide-react';

import { supabase } from '../lib/supabase';

import {
  PageShell,
  IconChip,
  ProgressRing,
  EmptyState
} from '../components/luminous';

// =========================================================
// AUTOMATIC TEXT CONTRAST
// =========================================================

const getContrastText = (hexColor) => {
  if (!hexColor) return '#002D62';

  let hex = hexColor.replace('#', '');

  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('');
  }

  if (hex.length !== 6) {
    return '#002D62';
  }

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness < 145 ? '#FFFFFF' : '#002D62';
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
  const [viewType, setViewType] = useState('Week');
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [editSeriesConfirmation, setEditSeriesConfirmation] = useState(null);
  const [showEntryCustomColor, setShowEntryCustomColor] = useState(false);
  const [showStickyCustomColor, setShowStickyCustomColor] = useState(false);

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
    '#002D62'
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
    setStickyColor('#E1F2FF');
    localStorage.removeItem(
      `campora_sticky_text_${selectedDateStr}`
    );
    localStorage.removeItem(
      `campora_sticky_color_${selectedDateStr}`
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
        type: alertType,
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

  useEffect(() => {
    const init = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (user) {
        setUser(user);
        await fetchCourses(user.id);
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
  const endPadding =
    viewType === 'Month'
      ? (7 - ((startPadding + dateArray.length) % 7)) % 7
      : 0;

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
      alertType:
        readPlannerAlertLinks()[entry.id]?.type ||
        (entry.reminder ? 'reminder' : 'none')
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


  const insertPlannerEntries = async (entries) => {
    let result = await supabase
      .from('planner_courses')
      .insert(entries)
      .select();

    const missingGroupId =
      result.error &&
      /group_id/i.test(result.error.message || '') &&
      /(column|schema|does not exist|not found)/i.test(result.error.message || '');

    if (missingGroupId) {
      const compatibleEntries = entries.map(({ group_id, ...entry }) => entry);
      result = await supabase
        .from('planner_courses')
        .insert(compatibleEntries)
        .select();
    }

    return result;
  };

  const confirmDuplicatePlannerEntries = async (entries = []) => {
    if (!user || !entries.length) return true;

    const dates = [...new Set(entries.map((entry) => entry.date).filter(Boolean))];
    if (!dates.length) return true;

    const { data: existing, error } = await supabase
      .from('planner_courses')
      .select('id, name, date, start_time, end_time')
      .eq('user_id', user.id)
      .in('date', dates);

    if (error) {
      console.warn('Duplicate check skipped:', error);
      return true;
    }

    const normalizedName = newEntry.name.trim().toLowerCase();
    const hasExactDuplicate = (existing || []).some((item) =>
      String(item.name || '').trim().toLowerCase() === normalizedName &&
      entries.some((entry) =>
        entry.date === item.date &&
        entry.start_time === item.start_time &&
        entry.end_time === item.end_time
      )
    );

    if (!hasExactDuplicate) return true;

    return window.confirm(
      'You already have an entry with the same title, date, and time. Add it anyway?'
    );
  };

  const createEntryOrSeries = async () => {
    const groupId =
      newEntry.repeat === 'none'
        ? null
        : (globalThis.crypto?.randomUUID?.() ||
          `planner-${Date.now()}-${Math.random().toString(16).slice(2)}`);

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

    const { data: savedEntries, error } =
      await insertPlannerEntries(entriesToSave);

    if (error) {
      console.error('Create entry error:', error);
      alert(`Could not save entry: ${error.message}`);
      return false;
    }

    if (savedEntries?.length) {
      if (newEntry.alertType === 'reminder') {
        await saveRemindersForEntries(savedEntries);
        savePlannerAlertChoice(savedEntries, 'reminder');
      }

      if (newEntry.alertType === 'notification') {
        savePlannerAlertChoice(savedEntries, 'notification');
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
      reminder: newEntry.alertType === 'reminder'
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

      if (newEntry.alertType === 'reminder') {
        await saveRemindersForEntries([data]);
      }

      if (newEntry.alertType === 'notification') {
        savePlannerAlertChoice([data], 'notification');
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

    const { data: savedEntries, error: insertError } =
      await insertPlannerEntries(entriesToSave);

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
      if (newEntry.alertType === 'reminder') {
        await saveRemindersForEntries(savedEntries);
        savePlannerAlertChoice(savedEntries, 'reminder');
      }

      if (newEntry.alertType === 'notification') {
        savePlannerAlertChoice(savedEntries, 'notification');
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
        reminder: newEntry.alertType === 'reminder',
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
        if (newEntry.alertType === 'reminder') {
          await saveRemindersForEntries([data]);
          savePlannerAlertChoice([data], 'reminder');
        }

        if (newEntry.alertType === 'notification') {
          savePlannerAlertChoice([data], 'notification');
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
      if (newEntry.alertType === 'reminder') {
        await saveRemindersForEntries(savedEntries);
        savePlannerAlertChoice(savedEntries, 'reminder');
      }

      if (newEntry.alertType === 'notification') {
        savePlannerAlertChoice(savedEntries, 'notification');
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
        `Something went wrong while saving: ${error?.message || 'Unknown error'}`
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

    const { error } = await supabase
      .from('planner_courses')
      .update({
        is_completed: nextCompleted
      })
      .eq('id', entry.id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Complete entry error:', error);
      return;
    }

    updateLinkedCourseLocalItem(entry, {
      is_completed: nextCompleted
    });

    await fetchCourses(user.id);
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
                  ? '2.5px solid #002D62'
                  : '1px solid #CCD5E6',
              boxShadow:
                selectedColor === color
                  ? '0 0 0 2px white, 0 0 0 3px #002D6218'
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
            fontSize: '12px',
            color: '#1A1B1F',
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
              color: '#717786',
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
    <PageShell>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '25px',
          alignItems: 'flex-start',
          width: '100%'
        }}
      >
        <div
          style={{
            flex: '999 1 520px',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          <div
            className="panel"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'nowrap',
              minHeight: '72px'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap'
              }}
            >
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => {
                  const now = new Date();
                  setViewDate(now);
                  setSelectedDate(now);
                }}
              >
                Today
              </button>

              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={handlePrev}
                aria-label="Previous"
                style={{ width: '36px', padding: 0 }}
              >
                <ChevronLeft size={18} />
              </button>

              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={handleNext}
                aria-label="Next"
                style={{ width: '36px', padding: 0 }}
              >
                <ChevronRight size={18} />
              </button>

              <h2
                style={{
                  margin: '0 0 0 8px',
                  minWidth: '190px',
                  fontSize: '20px',
                  fontWeight: '800',
                  color: 'var(--campora-text)',
                  letterSpacing: '-0.02em'
                }}
              >
                {viewType === 'Month'
                  ? viewDate.toLocaleString('default', {
                      month: 'long',
                      year: 'numeric'
                    })
                  : viewType === 'Week'
                  ? `Week of ${dateArray[0].toLocaleDateString()}`
                  : selectedDate.toDateString()}
              </h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'nowrap', flexShrink: 0 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  padding: '3px',
                  borderRadius: '12px',
                  background: '#FCFDFE',
                  border: '1px solid #F0F2F5'
                }}
              >
                {['Month', 'Week', 'Day'].map((option) => {
                  const active = viewType === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setViewType(option)}
                      style={{
                        border: 'none',
                        borderRadius: '9px',
                        padding: '7px 11px',
                        background: active ? '#FFFFFF' : 'transparent',
                        color: active ? 'var(--campora-navy)' : 'var(--campora-muted)',
                        fontSize: '12px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        boxShadow: active ? '0 1px 3px rgba(0,45,98,0.08)' : 'none'
                      }}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => handleOpenModal(selectedDateStr)}
                style={{ height: '38px', paddingInline: '14px' }}
              >
                <Plus size={15} />
                Add Entry
              </button>
            </div>
          </div>

        <div
            className="panel"
            style={{
              position: 'relative',
              padding: 0,
              overflow: 'hidden'
            }}
          >
            {loading && (
              <RefreshCw
                className="animate-spin"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  color: 'var(--campora-text)',
                  zIndex: 20
                }}
              />
            )}

            {viewType !== 'Day' && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: '6px',
                  background: '#FFFFFF',
                  borderBottom: '1px solid #F1F3F5',
                  padding: '8px 8px 6px'
                }}
              >
                {days.map((day) => (
                  <div
                    key={day}
                    className="label-caps"
                    style={{
                      padding: '10px 8px',
                      textAlign: 'center',
                      background: '#FCFDFE',
                      borderRadius: '10px'
                    }}
                  >
                    {day.toUpperCase()}
                  </div>
                ))}
              </div>
            )}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  viewType === 'Day'
                    ? '1fr'
                    : 'repeat(7, minmax(0, 1fr))',
                gap: '6px',
                background: '#FFFFFF',
                alignItems: 'stretch',
                padding: '8px'
              }}
            >
              {viewType === 'Month' &&
                [...Array(startPadding)].map((_, index) => (
                  <div
                    key={`pad-${index}`}
                    style={{
                      minHeight: '120px',
                      background: 'var(--surface-container-low)',
                      borderRadius: '14px'
                    }}
                  />
                ))}

              {dateArray.map((dateObj, index) => {
                const dateStr = formatDate(dateObj);
                const isSelected = dateStr === selectedDateStr;
                const isToday = dateStr === todayStr;
                const dayEvents = courses.filter(
                  (course) => course.date === dateStr
                );

                return (
                  <div
                    key={index}
                    onClick={() => {
                      setSelectedDate(dateObj);
                      setViewDate(dateObj);
                    }}
                    style={{
                      minHeight:
                        viewType === 'Month' ? '120px' : '480px',
                      padding: '8px',
                      cursor: 'pointer',
                      background: isSelected
                        ? 'var(--campora-navy-tint-alpha)'
                        : 'var(--surface-container-low)',
                      border: isSelected
                        ? '1px solid var(--campora-navy)'
                        : '1px solid var(--hairline)',
                      borderRadius: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      boxSizing: 'border-box',
                      transition: 'background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                      boxShadow: isSelected
                        ? 'var(--shadow-soft)'
                        : 'none'
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
                            type="button"
                            title="Add entry"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleOpenModal(dateStr);
                            }}
                            style={{
                              width: '22px',
                              height: '22px',
                              borderRadius: '50%',
                              background: 'var(--campora-navy-solid)',
                              color: '#ffffff',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: 'none',
                              cursor: 'pointer',
                              boxShadow:
                                '0 2px 6px rgba(0,45,98,0.2)'
                            }}
                          >
                            <Plus size={12} strokeWidth={3} />
                          </button>
                        )}
                      </div>

                      <span
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '800',
                          lineHeight: 1,
                          fontSize:
                            viewType === 'Day' ? '22px' : '13px',
                          background: isToday
                            ? 'var(--campora-navy)'
                            : 'transparent',
                          color: isToday
                            ? '#ffffff'
                            : 'var(--campora-text)',
                          boxShadow:
                            isSelected && !isToday
                              ? '0 0 0 1px rgba(0,45,98,0.16)'
                              : 'none'
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
                        gap: '5px',
                        paddingRight: '2px'
                      }}
                    >
                      {dayEvents.map((event) => {
                        const eventColor = darkModeColor(
                          event.color || '#E1F2FF'
                        );

                        const eventFg = getContrastText(eventColor);

                        return (
                          <div
                            key={event.id}
                            title={event.name}
                            onClick={(clickEvent) => {
                              clickEvent.stopPropagation();
                              handleOpenEditModal(event);
                            }}
                            style={{
                              background: event.is_completed
                                ? 'var(--surface-container-low)'
                                : eventColor,
                              color: event.is_completed
                                ? 'var(--campora-muted)'
                                : eventFg,
                              fontSize:
                                viewType === 'Month'
                                  ? '10px'
                                  : '12px',
                              fontWeight: '700',
                              padding: '4px 8px',
                              borderRadius: 'var(--radius-pill)',
                              textDecoration: event.is_completed
                                ? 'line-through'
                                : 'none',
                              wordBreak: 'break-word',
                              border: event.is_completed
                                ? '1px solid var(--hairline)'
                                : `1px solid ${eventColor}`,
                              boxShadow: event.is_completed
                                ? 'none'
                                : `0 2px 8px ${eventColor}33`,
                              cursor: 'pointer'
                            }}
                          >
                            {viewType !== 'Month' && (
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
                                    opacity: 0.75,
                                    fontSize: '9px',
                                    fontWeight: '700'
                                  }}
                                >
                                  {event.start_time?.substring(0, 5)}{' '}
                                  - {event.end_time?.substring(0, 5)}
                                </span>

                                <Edit3
                                  size={11}
                                  style={{
                                    opacity: 0.65,
                                    flexShrink: 0
                                  }}
                                />
                              </div>
                            )}

                            <div
                              style={{
                                fontWeight: '800',
                                marginTop:
                                  viewType !== 'Month' ? '1px' : 0,
                                lineHeight: '1.2',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {event.name}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {viewType === 'Month' &&
                [...Array(endPadding)].map((_, index) => (
                  <div
                    key={`end-pad-${index}`}
                    style={{
                      minHeight: '120px',
                      background: '#FCFDFE',
                      borderRadius: '14px'
                    }}
                  />
                ))}
            </div>
          </div>
        </div>

        <div
          style={{
            flex: '1 1 320px',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          <div className="panel">
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
                        background: dayIsToday
                          ? 'var(--campora-navy)'
                          : dayIsSelected
                          ? '#EAF4FC'
                          : 'transparent',
                        color: dayIsToday
                          ? '#ffffff'
                          : dayIsSelected
                          ? 'var(--campora-navy)'
                          : 'var(--campora-body)',
                        boxShadow:
                          dayIsSelected && !dayIsToday
                            ? '0 0 0 1px rgba(0,45,98,0.22), 0 2px 6px rgba(0,45,98,0.06)'
                            : 'none'
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
            className="panel"
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '470px',
              minHeight: '470px',
              overflow: 'hidden'
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
                <ProgressRing
                  value={upNextProgress}
                  size={34}
                  stroke={4}
                >
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: '800',
                      color: 'var(--campora-text)'
                    }}
                  >
                    {upNextDone}
                  </span>
                </ProgressRing>

                <h3
                  style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: '800',
                    color: 'var(--campora-text)'
                  }}
                >
                  Up Next
                </h3>
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
                    color: 'var(--campora-navy)',
                    background: 'var(--campora-navy-tint-alpha)',
                    border: '1px solid var(--outline-variant)',
                    height: '32px'
                  }}
                >
                  Erase All
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
                gap: '14px',
                overflowY: 'auto',
                overflowX: 'hidden',
                overscrollBehaviorY: 'contain',
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-y',
                paddingRight: '10px',
                paddingBottom: '12px',
                scrollbarGutter: 'stable',
                scrollbarWidth: 'thin',
                scrollbarColor: '#AAB4C4 #F4F3F8'
              }}
            >
              {upNextEvents.length > 0 ? (
                upNextEvents.map((event) => {
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
                        borderRadius: '16px',
                        padding: '20px 18px 18px',
                        background: event.is_completed
                          ? 'var(--surface-container-low)'
                          : `${barColor}18`,
                        border: '1px solid var(--hairline)',
                        boxShadow: '0 6px 18px rgba(0, 45, 98, 0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        gap: '14px',
                        height: '220px',
                        minHeight: '220px',
                        maxHeight: '220px',
                        cursor: 'pointer',
                        outline: 'none',
                        transition:
                          'box-shadow 0.18s ease, border-color 0.18s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow =
                          '0 10px 24px rgba(0, 45, 98, 0.10)';
                        e.currentTarget.style.borderColor =
                          'rgba(0,45,98,0.16)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow =
                          '0 6px 18px rgba(0, 45, 98, 0.05)';
                        e.currentTarget.style.borderColor =
                          'var(--hairline)';
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          top: 0,
                          height: '5px',
                          background: barColor
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
                                    ? 'var(--campora-muted)'
                                    : 'var(--campora-text)',
                                  textDecoration: event.is_completed
                                    ? 'line-through'
                                    : 'none',
                                  lineHeight: '1.3',
                                  wordBreak: 'break-word'
                                }}
                              >
                                {event.name}
                              </span>

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

                              {event.reminder && <Bell size={11} />}
                            </div>
                          </div>
                        </div>

                        {visiblePlannerDescription(event.description || '') && (
                          <div
                            style={{
                              marginTop: '10px',
                              padding: '12px 13px',
                              borderRadius: '12px',
                              background: 'rgba(255,255,255,0.62)',
                              border: '1px solid rgba(0,45,98,0.06)'
                            }}
                          >
                            <div
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
                              style={{
                                fontSize: '13px',
                                lineHeight: '1.55',
                                fontWeight: '600',
                                color: 'var(--campora-body)',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                maxHeight: '62px',
                                overflowY: 'auto',
                                paddingRight: '4px',
                                scrollbarWidth: 'thin'
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
                          paddingTop: '8px',
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
                          title={event.is_completed ? 'Mark incomplete' : 'Mark complete'}
                          onClick={(clickEvent) => {
                            clickEvent.stopPropagation();
                            toggleCompleted(event);
                          }}
                          style={{
                            width: '30px',
                            height: '30px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '999px',
                            border: '1px solid rgba(0,45,98,0.08)',
                            background: event.is_completed
                              ? 'var(--campora-navy-tint-alpha)'
                              : 'rgba(255,255,255,0.72)',
                            color: event.is_completed
                              ? 'var(--campora-navy)'
                              : 'var(--campora-muted)',
                            cursor: 'pointer'
                          }}
                        >
                          <CheckCircle2 size={15} />
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
                            border: '1px solid rgba(186,26,26,0.08)',
                            background: 'rgba(255,255,255,0.72)',
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
                    background: 'var(--surface-container-low)',
                    border: '1px solid var(--hairline)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '18px'
                  }}
                >
                  <EmptyState
                    icon={CalIcon}
                    title="Free Day"
                    text="Nothing on the horizon yet. Use the button above to plan something."
                  />
                </div>
              )}
            </div>
          </div>

          <div
            className="panel"
            style={{ display: 'flex', flexDirection: 'column' }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px'
              }}
            >
              <div style={{ minWidth: 0 }}>
                <h4
                  className="label-caps"
                  style={{
                    margin: 0,
                    fontSize: '12px',
                    color: 'var(--campora-text)',
                    letterSpacing: '0.5px'
                  }}
                >
                  STICKIES
                </h4>

                <span
                  className="muted"
                  style={{ fontSize: '11px', fontWeight: '700' }}
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
                  className="btn btn-sm btn-ghost"
                  style={{
                    color: 'var(--campora-urgent)',
                    height: '32px',
                    padding: '0 10px',
                    fontSize: '11px'
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
                gap: '6px',
                marginBottom: '10px',
                flexWrap: 'wrap'
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
                    background: darkModeColor(color),
                    cursor: 'pointer',
                    border:
                      stickyColor === color
                        ? '2px solid var(--campora-navy)'
                        : '1px solid var(--outline-variant)',
                    boxShadow:
                      stickyColor === color
                        ? '0 0 0 2px #ffffff'
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
                  className="btn btn-sm btn-outline"
                  style={{
                    height: '24px',
                    padding: '0 8px',
                    fontSize: '9px'
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
                      background: 'var(--surface-container-lowest)',
                      padding: '8px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--divider)',
                      boxShadow: 'var(--shadow-lift)'
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
                background: darkModeColor(stickyColor),
                flex: 1,
                minHeight: '150px',
                padding: '14px',
                borderRadius: '2px 2px var(--radius-secondary) 2px',
                boxShadow: 'var(--shadow-soft)',
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
                  color: getContrastText(darkModeColor(stickyColor)),
                  caretColor: getContrastText(
                    darkModeColor(stickyColor)
                  ),
                  fontSize: '12px',
                  lineHeight: '1.4',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {deleteConfirmation && (
        <div style={overlay}>
          <div
            className="panel"
            style={{
              width: '380px',
              maxWidth: '100%',
              padding: '24px',
              textAlign: 'center'
            }}
          >
            <IconChip icon={AlertCircle} tone="error" lg />

            <h2
              style={{
                margin: '14px 0 8px',
                fontWeight: '900',
                color: 'var(--campora-text)',
                fontSize: '20px'
              }}
            >
              Series Options
            </h2>

            <p
              className="muted"
              style={{
                fontWeight: '700',
                margin: '0 0 22px',
                fontSize: '13px',
                lineHeight: '1.5'
              }}
            >
              Delete only this occurrence or the entire repeating
              series?
            </p>

            <div className="stack">
              <button
                type="button"
                onClick={() =>
                  executeDelete(deleteConfirmation.id, false)
                }
                className="btn btn-primary"
              >
                Only this instance
              </button>

              <button
                type="button"
                onClick={() =>
                  executeDelete(
                    deleteConfirmation.id,
                    true,
                    deleteConfirmation.group_id
                  )
                }
                className="btn btn-danger"
              >
                Delete Entire Series
              </button>

              <button
                type="button"
                onClick={() => setDeleteConfirmation(null)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {editSeriesConfirmation && (
        <div style={{ ...overlay, zIndex: 1200 }}>
          <div
            className="panel"
            style={{
              width: '390px',
              maxWidth: '100%',
              padding: '24px',
              textAlign: 'center'
            }}
          >
            <IconChip icon={Edit3} tone="primary" lg />

            <h2
              style={{
                margin: '14px 0 8px',
                fontWeight: '900',
                color: 'var(--campora-text)',
                fontSize: '20px'
              }}
            >
              Update Series
            </h2>

            <p
              className="muted"
              style={{
                fontWeight: '700',
                margin: '0 0 22px',
                fontSize: '13px',
                lineHeight: '1.5'
              }}
            >
              Do you want these changes to apply only to this
              occurrence or to the entire repeating schedule?
            </p>

            <div className="stack">
              <button
                type="button"
                onClick={confirmEditSingle}
                disabled={saving}
                className="btn btn-primary"
                style={{
                  opacity: saving ? 0.65 : 1,
                  cursor: saving ? 'not-allowed' : 'pointer'
                }}
              >
                {saving ? 'Saving...' : 'Only this instance'}
              </button>

              <button
                type="button"
                onClick={confirmEditSeries}
                disabled={saving}
                className="btn btn-outline"
                style={{
                  opacity: saving ? 0.65 : 1,
                  cursor: saving ? 'not-allowed' : 'pointer'
                }}
              >
                {saving ? 'Saving...' : 'Entire series'}
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() => setEditSeriesConfirmation(null)}
                className="btn btn-ghost"
                style={{ opacity: saving ? 0.6 : 1 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div style={overlay}>
          <div
            className="panel"
            style={{
              width: '610px',
              maxWidth: '94vw',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '26px 28px 24px',
              background: '#FFFFFF',
              border: '1px solid #EEF1F4',
              boxShadow: '0 20px 60px rgba(0,45,98,0.16)',
              borderRadius: '26px'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '18px',
                paddingBottom: '16px',
                borderBottom: '1px solid #F0F2F5'
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontWeight: '900',
                    color: 'var(--campora-text)',
                    fontSize: '22px',
                    letterSpacing: '-0.02em'
                  }}
                >
                  {editingEntry ? 'Edit Entry' : 'New Entry'}
                </h2>
                <div
                  className="muted"
                  style={{ marginTop: '4px', fontSize: '11px', fontWeight: '700' }}
                >
                  Keep it simple — add what you need and save.
                </div>
              </div>

              {editingEntry && (
                <button
                  type="button"
                  title="Delete Entry"
                  onClick={handleDeleteFromEdit}
                  disabled={saving}
                  className="btn btn-sm btn-danger"
                  style={{
                    width: '36px',
                    height: '36px',
                    padding: 0,
                    opacity: saving ? 0.5 : 1
                  }}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            <form
              onSubmit={handleSaveEntry}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              <div>
                <label style={modalLabel}>Title</label>
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
              </div>

              <div>
                <label style={modalLabel}>Details</label>
                <textarea
                  placeholder="Add details, notes, room, instructions..."
                  style={{
                    ...modalInput,
                    resize: 'vertical',
                    minHeight: '88px',
                    fontFamily: 'inherit',
                    lineHeight: '1.45'
                  }}
                  value={newEntry.description}
                  onChange={(event) =>
                    setNewEntry({
                      ...newEntry,
                      description: event.target.value
                    })
                  }
                />
              </div>

              <div
                className="label-caps"
                style={{
                  marginTop: '2px',
                  marginBottom: '-5px',
                  color: 'var(--campora-navy)',
                  fontSize: '10px',
                  letterSpacing: '0.08em'
                }}
              >
                SCHEDULE
              </div>

              <div>
                <label style={modalLabel}>Type</label>
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
                </select>
              </div>

              <div>
                <label style={modalLabel}>Date</label>
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

              <div>
                <label style={modalLabel}>Start time</label>
                <input
                  type="time"
                  style={modalInput}
                  value={newEntry.start_time}
                  onChange={(event) =>
                    setNewEntry({
                      ...newEntry,
                      start_time: event.target.value
                    })
                  }
                />
              </div>

              <div>
                <label style={modalLabel}>End time</label>
                <input
                  type="time"
                  style={modalInput}
                  value={newEntry.end_time}
                  onChange={(event) =>
                    setNewEntry({
                      ...newEntry,
                      end_time: event.target.value
                    })
                  }
                />
              </div>

              {isRepeatableType(newEntry.type) && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '9px'
                  }}
                >
                  <label style={modalLabel}>Repeat</label>

                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px'
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
                        className={
                          newEntry.repeat === repeatOption.value
                            ? 'filter-chip active'
                            : 'filter-chip'
                        }
                      >
                        {repeatOption.label}
                      </button>
                    ))}
                  </div>

                  {newEntry.repeat !== 'none' && (
                    <div style={{ marginTop: '2px' }}>
                      <label style={modalLabel}>Repeat until</label>
                      <input
                        type="date"
                        min={newEntry.date}
                        style={modalInput}
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
                className="label-caps"
                style={{
                  marginTop: '2px',
                  marginBottom: '-5px',
                  color: 'var(--campora-navy)',
                  fontSize: '10px',
                  letterSpacing: '0.08em'
                }}
              >
                OPTIONS
              </div>

              <div>
                <label style={modalLabel}>Alert</label>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}
                >
                  {[
                    { value: 'none', label: 'None', icon: BellOff },
                    { value: 'notification', label: 'Notification', icon: Bell },
                    { value: 'reminder', label: 'Reminder', icon: AlarmClock }
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
                            reminder: option.value === 'reminder'
                          })
                        }
                        className={active ? 'filter-chip active' : 'filter-chip'}
                      >
                        <AlertIcon size={14} />
                        {option.label}
                      </button>
                    );
                  })}
                </div>

                {newEntry.alertType !== 'none' && (
                  <div
                    className="muted"
                    style={{
                      marginTop: '7px',
                      fontSize: '10px',
                      fontWeight: '800',
                      lineHeight: 1.45
                    }}
                  >
                    {newEntry.alertType === 'reminder'
                      ? 'This entry will appear under Reminders in Notifications & Reminders.'
                      : 'This entry will be added to the Notifications section.'}
                  </div>
                )}
              </div>

              <div>
                <div className="label-caps" style={{ marginBottom: '8px' }}>
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

              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  justifyContent: 'flex-end',
                  flexWrap: 'wrap',
                  paddingTop: '16px',
                  marginTop: '2px',
                  borderTop: '1px solid #F0F2F5'
                }}
              >
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingEntry(null);
                  }}
                  className="btn btn-ghost"
                  style={{
                    color: 'var(--campora-muted)',
                    opacity: saving ? 0.5 : 1,
                    minWidth: '110px'
                  }}
                >
                  Cancel
                </button>

                {editingEntry && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleDeleteFromEdit}
                    className="btn btn-danger"
                    style={{
                      opacity: saving ? 0.5 : 1,
                      cursor: saving ? 'not-allowed' : 'pointer',
                      minWidth: '130px'
                    }}
                  >
                    <Trash2 size={14} />
                    Delete Entry
                  </button>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                  style={{
                    opacity: saving ? 0.65 : 1,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    minWidth: '140px'
                  }}
                >
                  {saving
                    ? 'Saving...'
                    : editingEntry
                    ? 'Save Changes'
                    : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
}

const overlay = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 45, 98, 0.24)',
  backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
  padding: '20px'
};

const modalLabel = {
  display: 'block',
  marginBottom: '7px',
  fontSize: '11px',
  fontWeight: '800',
  color: 'var(--campora-muted)'
};

const modalInput = {
  width: '100%',
  padding: '12px 13px',
  borderRadius: '14px',
  border: '1px solid #E9EDF1',
  fontWeight: '700',
  outline: 'none',
  fontSize: '13px',
  flex: 1,
  color: 'var(--campora-text)',
  background: '#FCFDFE',
  boxSizing: 'border-box'
};
