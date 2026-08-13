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
  const [viewType, setViewType] = useState('Month');
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
          await saveNotificationsForEntries([data]);
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
            {viewType === 'Month'
              ? viewDate.toLocaleString('default', {
                  month: 'long',
                  year: 'numeric'
                })
              : viewType === 'Week'
              ? `Week of ${dateArray[0].toLocaleDateString()}`
              : selectedDate.toDateString()}
          </h1>

          <div
            style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'center'
            }}
          >
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

            <button
              onClick={() => {
                const now = new Date();
                setViewDate(now);
                setSelectedDate(now);
              }}
              style={navBtn}
            >
              Today
            </button>

            <button onClick={handlePrev} style={navBtn}>
              <ChevronLeft size={18} />
            </button>

            <button onClick={handleNext} style={navBtn}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

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
                    border: isSelected
                      ? '2px solid #0B1A3F'
                      : '1px solid #F1F4F9',
                    background: isSelected ? '#F8FAFF' : 'white',
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
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          flexShrink: 0
        }}
      >
        <div
          className="card"
          style={{
            flex: 1,
            maxHeight: '55%',
            display: 'flex',
            flexDirection: 'column',
            border: '1.5px solid #E9EDF7',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: '17px',
                fontWeight: '900',
                color: '#0B1A3F'
              }}
            >
              Agenda
            </h3>

            <button
              onClick={eraseAll}
              style={{
                color: '#EE5D50',
                background: 'none',
                border: 'none',
                fontSize: '11px',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              Erase All
            </button>
          </div>

          <p
            style={{
              fontSize: '12px',
              fontWeight: '700',
              color: '#A3AED0',
              marginBottom: '12px'
            }}
          >
            {selectedDate.toDateString()}
          </p>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              paddingRight: '2px'
            }}
          >
            {selectedDayEvents.length > 0 ? (
              selectedDayEvents.map((event) => {
                const agendaBackground = event.is_completed
                  ? '#F8FAFF'
                  : event.color || '#E1F2FF';

                const agendaTextColor = event.is_completed
                  ? '#0B1A3F'
                  : getContrastText(agendaBackground);

                return (
                  <div
                    key={event.id}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '12px',
                      background: agendaBackground,
                      color: agendaTextColor,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      border: '1px solid rgba(0,0,0,0.04)'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {event.reminder && (
                            <Bell size={10} color={agendaTextColor} />
                          )}

                          <span
                            style={{
                              fontWeight: '900',
                              fontSize: '13px',
                              color: agendaTextColor,
                              textDecoration: event.is_completed
                                ? 'line-through'
                                : 'none'
                            }}
                          >
                            {event.name}
                          </span>
                        </div>

                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: '700',
                            opacity: 0.7,
                            color: agendaTextColor
                          }}
                        >
                          {event.start_time?.substring(0, 5)} -{' '}
                          {event.end_time?.substring(0, 5)}
                        </span>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          gap: '8px',
                          alignItems: 'center'
                        }}
                      >
                        <Edit3
                          size={15}
                          onClick={() => handleOpenEditModal(event)}
                          color={agendaTextColor}
                          style={{ cursor: 'pointer' }}
                        />

                        <CheckCircle2
                          size={15}
                          onClick={() => toggleCompleted(event)}
                          style={{
                            cursor: 'pointer',
                            color: event.is_completed
                              ? '#05CD99'
                              : agendaTextColor,
                            opacity: event.is_completed ? 1 : 0.7
                          }}
                        />

                        <Trash2
                          size={15}
                          onClick={() => {
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
                            color: '#EE5D50',
                            cursor: 'pointer'
                          }}
                        />
                      </div>
                    </div>

                    {visiblePlannerDescription(
                      event.description || ''
                    ) && (
                      <p
                        style={{
                          margin: 0,
                          fontSize: '11px',
                          fontWeight: '600',
                          color: agendaTextColor,
                          opacity: 0.9,
                          background:
                            agendaTextColor === '#FFFFFF'
                              ? 'rgba(255,255,255,0.10)'
                              : 'rgba(255,255,255,0.5)',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          lineHeight: '1.3'
                        }}
                      >
                        {visiblePlannerDescription(
                          event.description || ''
                        )}
                      </p>
                    )}
                  </div>
                );
              })
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  marginTop: '30px',
                  opacity: 0.3
                }}
              >
                <CalIcon size={36} />
                <p
                  style={{
                    fontSize: '12px',
                    fontWeight: '700'
                  }}
                >
                  Free Day
                </p>
              </div>
            )}
          </div>
        </div>

        <div
          className="card"
          style={{
            flex: 1,
            border: '1.5px solid #E9EDF7',
            display: 'flex',
            flexDirection: 'column',
            padding: '16px',
            minHeight: 0
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
              minHeight: '150px',
              padding: '14px',
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
                fontSize: '12px',
                lineHeight: '1.4',
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

      {isModalOpen && (
        <div style={overlay}>
          <div
            className="card"
            style={{
              width: '430px',
              maxHeight: '88vh',
              overflowY: 'auto',
              border: '1.5px solid #0B1A3F',
              padding: '30px'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontWeight: '900',
                  color: '#0B1A3F',
                  fontSize: '20px'
                }}
              >
                {editingEntry ? 'Edit Entry' : 'New Entry'}
              </h2>

              {editingEntry && (
                <button
                  type="button"
                  title="Delete Entry"
                  onClick={handleDeleteFromEdit}
                  disabled={saving}
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '9px',
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
            </div>

            <form
              onSubmit={handleSaveEntry}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
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
                    padding: '12px',
                    background: '#F8FAFF',
                    borderRadius: '10px',
                    border: '1px solid #E9EDF7'
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
                  display: 'flex',
                  gap: '10px'
                }}
              >
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

              <div
                style={{
                  padding: '12px',
                  background: '#F8FAFF',
                  border: '1px solid #E9EDF7',
                  borderRadius: '12px'
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
                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
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
                            reminder: option.value === 'reminder'
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
                        newEntry.alertType === 'reminder'
                          ? '#8B78B8'
                          : '#648CCB',
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
  background: '#F4F7FE',
  padding: '4px',
  borderRadius: '12px'
};

const toggleStyle = {
  background: 'none',
  border: 'none',
  padding: '6px 12px',
  fontSize: '11px',
  fontWeight: '900',
  color: '#A3AED0',
  cursor: 'pointer',
  borderRadius: '8px'
};

const activeToggle = {
  ...toggleStyle,
  background: 'white',
  color: '#0B1A3F',
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
};

const navBtn = {
  background: 'white',
  border: '1.5px solid #E2E8F0',
  padding: '6px 12px',
  borderRadius: '10px',
  fontWeight: '900',
  color: '#0B1A3F',
  cursor: 'pointer',
  fontSize: '12px'
};

const saveBtn = {
  background: '#0B1A3F',
  border: 'none',
  color: 'white',
  padding: '11px',
  borderRadius: '10px',
  fontWeight: '900',
  cursor: 'pointer',
  fontSize: '13px',
  marginTop: '3px'
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
  padding: '10px',
  borderRadius: '8px',
  border: '1.5px solid #E2E8F0',
  fontWeight: '800',
  outline: 'none',
  fontSize: '12px',
  flex: 1,
  color: '#0B1A3F',
  boxSizing: 'border-box'
};

const overlay = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(11,26,57,0.4)',
  backdropFilter: 'blur(6px)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000
};
