import React, { useEffect, useMemo, useState } from 'react';

import {
  Plus,
  BookOpen,
  FolderPlus,
  ArrowLeft,
  Save,
  Trash2,
  RefreshCw,
  ExternalLink,
  FolderCheck,
  Folder,
  FolderOpen,
  FileText,
  ChevronRight,
  Edit2,
  Check,
  X,
  Search,
  GraduationCap,
  CalendarDays,
  ClipboardCheck,
  Clock3,
  Bell,
  AlarmClock,
  ChevronDown
} from 'lucide-react';

import { supabase } from '../lib/supabase';

// =========================================================
// HELPERS
// =========================================================

function NotepadIcon({ size = 32, color = '#0B1A3F' }) {
 return (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: 'block', margin: '0 auto' }}
  >
    <rect
      x="24"
      y="22"
      width="58"

 height="66"
 rx="12"
 stroke={color}
 strokeWidth="6"
 fill="none"
/>
{[34, 43, 52, 61, 70].map((x, i) => (
 <g key={i}>
   <path
     d={`M ${x} 22 V 14 C ${x} 11, ${x + 6} 11, ${x + 6} 14 V 22`}
     stroke={color}
     strokeWidth="5"
     strokeLinecap="round"
     fill="none"
   />
   <circle cx={x + 3} cy="26" r="3.5" fill={color} />
 </g>
))}
{[32, 42, 52, 62, 72].map((y, i) => (
 <path
   key={i}
   d={`M 24 ${y} C 18 ${y}, 18 ${y + 4}, 24 ${y + 4}`}
   stroke={color}
   strokeWidth="4"
   strokeLinecap="round"
   fill="none"
 />
))}
<line
 x1="36"
 y1="38"
 x2="70"
 y2="38"
 stroke={color}
 strokeWidth="5"
 strokeLinecap="round"
/>
<line
 x1="38"
 y1="52"
 x2="68"
 y2="52"
 stroke={color}
 strokeWidth="5"
 strokeLinecap="round"
/>
<line

        x1="38"
        y1="62"
        x2="68"
        y2="68"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
       />
      </svg>
    );
}

const COURSE_COLORS = [
  { bg: '#E0F2FE', name: 'Blue' },
  { bg: '#FCE7F3', name: 'Pink' },
  { bg: '#F3E8FF', name: 'Purple' },
  { bg: '#FEE2E2', name: 'Red' },
  { bg: '#FFEDD5', name: 'Peach' },
  { bg: '#CFFAFE', name: 'Light Blue' },
  { bg: '#D1FAE5', name: 'Mint' },
  { bg: '#E0E7FF', name: 'Periwinkle' },
  { bg: '#0B1A3F', name: 'Navy' }
];

const DEFAULT_COURSE_COLOR = COURSE_COLORS[0].bg;

const normalizeHex = (hex) => {
 if (!hex) return DEFAULT_COURSE_COLOR;
 let clean = hex.replace('#', '').trim();

    if (clean.length === 3) {
      clean = clean
        .split('')
        .map((character) => character + character)
        .join('');
    }

  if (clean.length !== 6) return DEFAULT_COURSE_COLOR;
  return `#${clean}`;
};

const getContrastColor = (backgroundColor) => {
 const hex = normalizeHex(backgroundColor).replace('#', '');
 const red = parseInt(hex.substring(0, 2), 16);
 const green = parseInt(hex.substring(2, 4), 16);
 const blue = parseInt(hex.substring(4, 6), 16);
 const luminance =

  (0.299 * red + 0.587 * green + 0.114 * blue) / 255;

  return luminance < 0.58 ? '#FFFFFF' : '#0B1A3F';
};

const getMutedContrastColor = (backgroundColor) =>
 getContrastColor(backgroundColor) === '#FFFFFF'
  ? 'rgba(255,255,255,0.78)'
  : '#64748B';

const localKey = (userId, name) =>
 `campora-course-management:${userId || 'guest'}:${name}`;

const safeParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};



const COURSE_LINK_START = '[CAMPORA_COURSE_LINK]';
const COURSE_LINK_END = '[/CAMPORA_COURSE_LINK]';

const buildCourseLinkDescription = ({
 kind,
 courseItemId,
 courseId,
 visibleDescription = ''
}) => {
 const meta = JSON.stringify({
   kind,
   courseItemId,
   courseId
 });

 return `${visibleDescription || ''}

${COURSE_LINK_START}${meta}${COURSE_LINK_END}`.trim();
};

const plannerTypeForUpcoming = (type) => {
  if (type === 'Exam' || type === 'Quiz') return 'Exam';
  if (type === 'Lab') return 'Lab';
  return 'Task';
};

const todayStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const d = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

// =========================================================
// MAIN COMPONENT
// =========================================================


// =========================================================
// PLANNER SYNC NOTE
// =========================================================
// Two-way Course <-> Planner completion sync is supported conceptually,
// but it must use the SAME persisted task row/ID in both components.
// Do not create a duplicate planner task here with guessed column names.
// Once the Planner component/table schema is available, courseAssignments
// and courseEvents should either:
// 1) read/write the planner task table directly, OR
// 2) store planner_task_id and update the shared row.
// Then crossing out from either screen will update the same Supabase row.
// =========================================================

export default function CourseManagement() {
 const [courses, setCourses] = useState([]);
 const [loading, setLoading] = useState(true);
 const [selectedCourse, setSelectedCourse] = useState(null);
 const [selectedSemester, setSelectedSemester] = useState(null);
 const [editingSemesterName, setEditingSemesterName] = useState(null);
 const [editedSemesterValue, setEditedSemesterValue] = useState('');
 const [userId, setUserId] = useState(null);

 // Main page filters
 const [searchTerm, setSearchTerm] = useState('');

const [semesterFilter, setSemesterFilter] = useState('All Semesters');
const [dashboardView, setDashboardView] = useState(null);

// Add course
const [isModalOpen, setIsModalOpen] = useState(false);
const [editingCourse, setEditingCourse] = useState(null);
const [semesterMode, setSemesterMode] = useState('existing');
const [customSemester, setCustomSemester] = useState('');
const [newCourse, setNewCourse] = useState({
  name: '',
  professor: '',
  days: 'MWF',
  semester: '',
  color: DEFAULT_COURSE_COLOR,
  credits: '3',
  class_start_date: '',
  class_end_date: '',
  class_start_time: '09:00',
  class_end_time: '10:00'
});

// Local metadata so no new Supabase column is required
const [courseSemesters, setCourseSemesters] = useState({});
const [customSemesters, setCustomSemesters] = useState([]);
const [courseAssignments, setCourseAssignments] = useState([]);
const [courseEvents, setCourseEvents] = useState([]);
const [coursePlannerSchedules, setCoursePlannerSchedules] = useState({});
const [courseCredits, setCourseCredits] = useState({});
const [creditsHydrated, setCreditsHydrated] = useState(false);

// Course workspace tabs
const [workspaceTab, setWorkspaceTab] = useState('notes');

// Assignments
const [assignmentTitle, setAssignmentTitle] = useState('');
const [assignmentDue, setAssignmentDue] = useState('');
const [assignmentEditingId, setAssignmentEditingId] = useState(null);
const [assignmentReminder, setAssignmentReminder] = useState(false);
const [assignmentNotification, setAssignmentNotification] = useState(false);

// Exams / upcoming
const [eventTitle, setEventTitle] = useState('');
const [eventDate, setEventDate] = useState('');
const [eventType, setEventType] = useState('Exam');
const [eventEditingId, setEventEditingId] = useState(null);
const [eventReminder, setEventReminder] = useState(false);
const [eventNotification, setEventNotification] = useState(false);

// Notes
const [savedNotes, setSavedNotes] = useState([]);
const [noteTitle, setNoteTitle] = useState('');
const [activeNotes, setActiveNotes] = useState('');
const [editingNoteId, setEditingNoteId] = useState(null);
const [savingNote, setSavingNote] = useState(false);

// Resources
const [courseFiles, setCourseFiles] = useState([]);
const [allResources, setAllResources] = useState([]);
const [uploading, setUploading] = useState(false);
const [selectedFile, setSelectedFile] = useState(null);
const [customFileName, setCustomFileName] = useState('');
const [folderMode, setFolderMode] = useState('existing');
const [selectedFolder, setSelectedFolder] = useState('');
const [newFolderName, setNewFolderName] = useState('');
const [isFileModalOpen, setIsFileModalOpen] = useState(false);
const [saveBanner, setSaveBanner] = useState(null);
const [activeFolderView, setActiveFolderView] = useState(null);
const [customFolders, setCustomFolders] = useState([]);
const [editingFolderName, setEditingFolderName] = useState(null);
const [renamedFolderValue, setRenamedFolderValue] = useState('');

// ---------------------------------------------------------
// AUTH + LOCAL DATA
// ---------------------------------------------------------

useEffect(() => {
  supabase.auth.getUser().then(({ data: { user } }) => {
   if (user) setUserId(user.id);
  });
}, []);

useEffect(() => {
 if (!userId) return;

 setCreditsHydrated(false);

 setCourseSemesters(
   safeParse(localStorage.getItem(localKey(userId, 'semestersByCourse')), {})
 );
 setCustomSemesters(
   safeParse(localStorage.getItem(localKey(userId, 'customSemesters')), [])
 );
 setCourseAssignments(
   safeParse(localStorage.getItem(localKey(userId, 'assignments')), [])
 );
 setCourseEvents(
   safeParse(localStorage.getItem(localKey(userId, 'events')), [])
 );
 setCoursePlannerSchedules(
   safeParse(
     localStorage.getItem(localKey(userId, 'plannerSchedules')),
     {}
   )
 );
 setCourseCredits(
   safeParse(
     localStorage.getItem(localKey(userId, 'creditsByCourse')),
     {}
   )
 );
 setCreditsHydrated(true);

  fetchCourses();
  fetchAllResources();
}, [userId]);

useEffect(() => {
  if (!userId) return;
  localStorage.setItem(
    localKey(userId, 'semestersByCourse'),
    JSON.stringify(courseSemesters)
  );
}, [courseSemesters, userId]);

useEffect(() => {
  if (!userId) return;
  localStorage.setItem(
    localKey(userId, 'customSemesters'),
    JSON.stringify(customSemesters)
  );
}, [customSemesters, userId]);

useEffect(() => {
  if (!userId) return;
  localStorage.setItem(
    localKey(userId, 'assignments'),
    JSON.stringify(courseAssignments)
  );
}, [courseAssignments, userId]);

useEffect(() => {
  if (!userId) return;
  localStorage.setItem(
    localKey(userId, 'events'),
    JSON.stringify(courseEvents)
  );
}, [courseEvents, userId]);

useEffect(() => {
  if (!userId) return;
  localStorage.setItem(
    localKey(userId, 'plannerSchedules'),
    JSON.stringify(coursePlannerSchedules)
  );
}, [coursePlannerSchedules, userId]);

useEffect(() => {
  if (!userId || !creditsHydrated) return;
  localStorage.setItem(
    localKey(userId, 'creditsByCourse'),
    JSON.stringify(courseCredits)
  );
}, [courseCredits, userId, creditsHydrated]);

// ---------------------------------------------------------

 // DERIVED DATA
 // ---------------------------------------------------------

 const semesterOptions = useMemo(() => {
  const fromCourses = courses
   .map((course) => courseSemesters[course.id] || course.semester)
   .filter(Boolean);

   return Array.from(new Set([...customSemesters, ...fromCourses]));
 }, [customSemesters, courses, courseSemesters]);

 const courseSemester = (course) =>
  courseSemesters[course.id] ||
  course.semester ||
  'Semester';

 const filteredCourses = useMemo(() => {
  const search = searchTerm.trim().toLowerCase();

  return courses.filter((course) => {
   const semester = courseSemester(course);
   const matchesSemester =
     semesterFilter === 'All Semesters' || semester === semesterFilter;

   const matchesSearch =
    !search ||
    course.name?.toLowerCase().includes(search) ||
    course.professor?.toLowerCase().includes(search) ||
    course.days?.toLowerCase().includes(search) ||
    semester.toLowerCase().includes(search);

    return matchesSemester && matchesSearch;
   });
 }, [courses, courseSemesters, semesterFilter, searchTerm]);

 const groupedCourses = useMemo(() => {
   return filteredCourses.reduce((acc, course) => {
     const semester = courseSemester(course);
     if (!acc[semester]) acc[semester] = [];
     acc[semester].push(course);
     return acc;
   }, {});
 }, [filteredCourses, courseSemesters]);

 const sortedSemesterGroups = useMemo(() => {
  const known = semesterOptions.filter((semester) =>
groupedCourses[semester]);

  const remaining = Object.keys(groupedCourses).filter(
    (semester) => !known.includes(semester)
  );
  return [...known, ...remaining];
}, [groupedCourses, semesterOptions]);

const completedAssignments = courseAssignments.filter(
  (a) => a.completed
).length;

const activeAssignments = courseAssignments.filter(
  (a) => !a.completed
).length;

const upcomingEventsCount = courseEvents.filter((event) => {
 if (!event.date) return false;
 const eventDay = new Date(`${event.date}T00:00:00`);
 return eventDay >= todayStart();
}).length;

const totalCredits = courses.reduce(
 (sum, course) =>
  sum + Math.max(0, Number(courseCredits[course.id]) || 0),
 0
);

// ---------------------------------------------------------
// SUPABASE FETCH
// ---------------------------------------------------------

const fetchCourses = async () => {
 setLoading(true);
 try {
   let query = supabase.from('courses').select('*');
   if (userId) query = query.eq('user_id', userId);

  const { data, error } = await query.order('created_at', {
   ascending: false
  });

    if (error) throw error;
    setCourses(data || []);
  } catch (err) {
    console.error('Error fetching courses:', err);
  } finally {
    setLoading(false);
  }
};

const fetchAllResources = async () => {
 try {
   let query = supabase.from('course_resources').select('*');
   if (userId) query = query.eq('user_id', userId);

    const { data, error } = await query;
    if (error) throw error;
    setAllResources(data || []);
  } catch (err) {
    console.error('Error fetching all resources:', err);
  }
};

const fetchFiles = async (courseId) => {
 try {
   const { data, error } = await supabase
    .from('course_resources')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false });

    if (error) throw error;
    setCourseFiles(data || []);
  } catch (err) {
    console.error('Error fetching files:', err);
  }
};

const fetchNotes = async (courseId) => {
 try {
   const { data, error } = await supabase
    .from('course_notes')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false });

    if (error) throw error;
    setSavedNotes(data || []);
  } catch (err) {
    console.error('Error fetching notes:', err);
  }
};

// ---------------------------------------------------------
// COURSE ACTIONS
// ---------------------------------------------------------

const resetCourseForm = () => {
 const hasExistingSemester = semesterOptions.length > 0;

 setSemesterMode(hasExistingSemester ? 'existing' : 'new');

  setCustomSemester('');
  setNewCourse({
   name: '',
   professor: '',
   days: 'MWF',
   semester: semesterOptions[0] || '',
   color: DEFAULT_COURSE_COLOR,
   credits: '3',
   class_start_date: '',
   class_end_date: '',
   class_start_time: '09:00',
   class_end_time: '10:00'
  });
};

const openAddCourseModal = () => {
  setEditingCourse(null);
  resetCourseForm();
  setIsModalOpen(true);
};

const openEditCourseModal = () => {
 if (!selectedCourse) return;

 const schedule =
  coursePlannerSchedules[selectedCourse.id] || {};

 const semester = courseSemester(selectedCourse);

 setEditingCourse(selectedCourse);
 setSemesterMode('existing');
 setCustomSemester('');

 setNewCourse({
  name: selectedCourse.name || '',
  professor: selectedCourse.professor || '',
  days: selectedCourse.days || 'MWF',
  semester,
  color: selectedCourse.color || DEFAULT_COURSE_COLOR,
  credits: String(courseCredits[selectedCourse.id] ?? 3),
  class_start_date: schedule.startDate || '',
  class_end_date: schedule.endDate || '',
  class_start_time: schedule.startTime || '09:00',
  class_end_time: schedule.endTime || '10:00'
 });

  setIsModalOpen(true);
};

const weekdayTargetsForCourse = (days) => {
  if (days === 'MWF') return [1, 3, 5];
  if (days === 'TTH') return [2, 4];
  if (days === 'MW') return [1, 3];
  if (days === 'T') return [2];
  if (days === 'W') return [3];
  if (days === 'TH') return [4];
  return [];
};


const removeCourseScheduleFromPlanner = async (courseId) => {
 if (!userId || !courseId) return;

 const schedule = coursePlannerSchedules[courseId];

 if (schedule?.plannerIds?.length) {
   const { error } = await supabase
     .from('planner_courses')
     .delete()
     .eq('user_id', userId)
     .in('id', schedule.plannerIds);

   if (error) {
     console.error(
       'Could not remove old course schedule from Planner:',
       error
     );
   }
 } else if (schedule?.groupId) {
   const { error } = await supabase
     .from('planner_courses')
     .delete()
     .eq('user_id', userId)
     .eq('group_id', schedule.groupId);

     if (error) {
       console.error(
         'Could not remove old course schedule from Planner:',
         error
       );
     }
 }

 setCoursePlannerSchedules((prev) => {

   const next = { ...prev };
   delete next[courseId];
   return next;
  });
};

const createCourseScheduleInPlanner = async (
  courseRecord,
  scheduleForm = newCourse
) => {
  if (
    !userId ||
    !courseRecord?.id ||
    !scheduleForm.class_start_date ||
    !scheduleForm.class_end_date ||
    scheduleForm.days === 'None' ||
    scheduleForm.days === 'Lab'
  ){
    return;
  }

 const targetDays = weekdayTargetsForCourse(scheduleForm.days);
 if (!targetDays.length) return;

 const groupId = crypto.randomUUID();
 const rows = [];

 const current = new Date(`${scheduleForm.class_start_date}T00:00:00`);
 const limit = new Date(`${scheduleForm.class_end_date}T00:00:00`);

 while (current <= limit) {
  if (targetDays.includes(current.getDay())) {
    const date = [
      current.getFullYear(),
      String(current.getMonth() + 1).padStart(2, '0'),
      String(current.getDate()).padStart(2, '0')
    ].join('-');

   rows.push({
    user_id: userId,
    name: courseRecord.name,
    description: buildCourseLinkDescription({
     kind: 'course_schedule',
     courseItemId: courseRecord.id,
     courseId: courseRecord.id,
     visibleDescription: `Course class • ${courseRecord.name}`
    }),

           date,
           type: 'Class',
           start_time: scheduleForm.class_start_time,
           end_time: scheduleForm.class_end_time,
           color: courseRecord.color || DEFAULT_COURSE_COLOR,
           reminder: false,
           group_id: groupId,
           is_completed: false
          });
      }

      current.setDate(current.getDate() + 1);
  }

  if (!rows.length) return;

  const { data, error } = await supabase
   .from('planner_courses')
   .insert(rows)
   .select('id,group_id');

  if (error) {
    console.error('Course schedule planner sync error:', error);
    alert(
      `The course was created, but its class schedule could not be added to
Planner: ${error.message}`
    );
    return;
  }

   setCoursePlannerSchedules((prev) => ({
    ...prev,
    [courseRecord.id]: {
      groupId,
      plannerIds: (data || []).map((row) => row.id),
      days: scheduleForm.days,
      startDate: scheduleForm.class_start_date,
      endDate: scheduleForm.class_end_date,
      startTime: scheduleForm.class_start_time,
      endTime: scheduleForm.class_end_time
    }
   }));
 };


 const handleUpdateCourse = async (e) => {
  e.preventDefault();

if (!editingCourse) return;

const finalSemester =
 semesterOptions.length === 0 || semesterMode === 'new'
  ? customSemester.trim()
  : newCourse.semester;

if (!finalSemester) {
  alert('Please choose or create a semester.');
  return;
}

try {
  const courseData = {
    name: newCourse.name.trim(),
    professor: newCourse.professor.trim(),
    days: newCourse.days,
    color: newCourse.color
  };

 const { data, error } = await supabase
  .from('courses')
  .update(courseData)
  .eq('id', editingCourse.id)
  .select()
  .single();

 if (error) throw error;

 setCourseSemesters((prev) => ({
  ...prev,
  [editingCourse.id]: finalSemester
 }));

 setCourseCredits((prev) => ({
  ...prev,
  [editingCourse.id]: Math.max(
    0,
    Number(newCourse.credits) || 0
  )
 }));

 if (
   semesterMode === 'new' &&
   !customSemesters.includes(finalSemester)
 ){
   setCustomSemesters((prev) => [...prev, finalSemester]);
 }

 // Rebuild the linked Planner class schedule using the edited values.
 await removeCourseScheduleFromPlanner(editingCourse.id);

 if (
   newCourse.days !== 'None' &&

    newCourse.days !== 'Lab' &&
    newCourse.class_start_date &&
    newCourse.class_end_date
  ){
    await createCourseScheduleInPlanner(
      {
        ...data,
        id: editingCourse.id
      },
      newCourse
    );
  }

  setSelectedCourse((prev) => ({
   ...prev,
   ...data
  }));

  setSelectedSemester(finalSemester);
  setEditingCourse(null);
  setIsModalOpen(false);

    await fetchCourses();
  } catch (err) {
    alert('Error updating course: ' + err.message);
  }
};

const handleAddCourse = async (e) => {
 e.preventDefault();

 const finalSemester =
  semesterOptions.length === 0 || semesterMode === 'new'
   ? customSemester.trim()
   : newCourse.semester;

 if (!finalSemester) {
   alert('Please choose or create a semester.');
   return;
 }

 try {
   // IMPORTANT:
   // We intentionally do NOT send "semester" to Supabase, so this works
   // even if the courses table does not have a semester column.
   const courseData = {
     name: newCourse.name.trim(),

    professor: newCourse.professor.trim(),
    days: newCourse.days,
    color: newCourse.color
  };

  if (userId) courseData.user_id = userId;

  const { data, error } = await supabase
   .from('courses')
   .insert([courseData])
   .select()
   .single();

  if (error) throw error;

  if (data?.id) {
    setCourseSemesters((prev) => ({
      ...prev,
      [data.id]: finalSemester
    }));

    setCourseCredits((prev) => ({
      ...prev,
      [data.id]: Math.max(
        0,
        Number(newCourse.credits) || 0
      )
    }));

    await createCourseScheduleInPlanner(data);
  }

  if (
    (semesterOptions.length === 0 || semesterMode === 'new') &&
    !customSemesters.includes(finalSemester)
  ){
    setCustomSemesters((prev) => [...prev, finalSemester]);
  }

    setIsModalOpen(false);
    resetCourseForm();
    await fetchCourses();
  } catch (err) {
    alert('Error adding course: ' + err.message);
  }
};

const openCourse = (course) => {
 setDashboardView(null);
 setSelectedSemester(courseSemester(course));
 setSelectedCourse(course);
 setWorkspaceTab('notes');
 setActiveFolderView(null);
 setEditingNoteId(null);
 setNoteTitle('');
 setActiveNotes('');

  fetchNotes(course.id);
  fetchFiles(course.id);
};




const openEditSemester = (semesterName, event = null) => {
 if (event) event.stopPropagation();

  setEditingSemesterName(semesterName);
  setEditedSemesterValue(semesterName);
};

const closeEditSemester = () => {
  setEditingSemesterName(null);
  setEditedSemesterValue('');
};

const saveEditedSemester = () => {
 if (!editingSemesterName) return;

 const nextName = editedSemesterValue.trim();

 if (!nextName) {
   alert('Please enter a semester name.');
   return;
 }

 if (
   nextName !== editingSemesterName &&
   semesterOptions.includes(nextName)
 ){
   alert('A semester with that name already exists.');
   return;
 }

 setCourseSemesters((prev) => {
  const next = { ...prev };

  Object.keys(next).forEach((courseId) => {
   if (next[courseId] === editingSemesterName) {
      next[courseId] = nextName;
   }
  });

  return next;
 });

  setCustomSemesters((prev) =>
    Array.from(
      new Set(
        prev.map((semester) =>
          semester === editingSemesterName
           ? nextName
           : semester
        )
      )
    )
  );

  if (selectedSemester === editingSemesterName) {
    setSelectedSemester(nextName);
  }

  if (semesterFilter === editingSemesterName) {
    setSemesterFilter(nextName);
  }

  if (newCourse.semester === editingSemesterName) {
    setNewCourse((prev) => ({
      ...prev,
      semester: nextName
    }));
  }

   closeEditSemester();
 };

 const handleDeleteSemester = async (semesterName) => {
  const semesterCourses = courses.filter(
    (course) => courseSemester(course) === semesterName
  );

  const courseIds = semesterCourses.map((course) => course.id);

  const confirmed = window.confirm(
    semesterCourses.length > 0
     ? `Delete "${semesterName}" and all ${semesterCourses.length} course${
         semesterCourses.length === 1 ? '' : 's'
       } inside it? This will also remove their assignments, upcoming items,
notes, and resource records.`
     : `Delete "${semesterName}"?`
  );

if (!confirmed) return;

try {
  if (courseIds.length > 0) {
    // Delete notes/resources tied to the courses first.
    const { error: notesError } = await supabase
      .from('course_notes')
      .delete()
      .in('course_id', courseIds);

     if (notesError) throw notesError;

     const { error: resourcesError } = await supabase
      .from('course_resources')
      .delete()
      .in('course_id', courseIds);

     if (resourcesError) throw resourcesError;

     const { error: coursesError } = await supabase
      .from('courses')
      .delete()
      .in('id', courseIds);

     if (coursesError) throw coursesError;
 }

 const semesterSchedulePlannerIds = courseIds.flatMap(
  (courseId) =>

     coursePlannerSchedules[courseId]?.plannerIds || []
);

if (semesterSchedulePlannerIds.length > 0 && userId) {
  await supabase
    .from('planner_courses')
    .delete()
    .eq('user_id', userId)
    .in('id', semesterSchedulePlannerIds);
}

setCoursePlannerSchedules((prev) => {
 const next = { ...prev };
 courseIds.forEach((courseId) => {
    delete next[courseId];
 });
 return next;
});

const linkedPlannerIds = [
  ...courseAssignments
    .filter((assignment) => courseIds.includes(assignment.courseId))
    .map((assignment) => assignment.plannerId)
    .filter(Boolean),
  ...courseEvents
    .filter((event) => courseIds.includes(event.courseId))
    .map((event) => event.plannerId)
    .filter(Boolean)
];

if (linkedPlannerIds.length > 0 && userId) {
  await supabase
    .from('planner_courses')
    .delete()
    .eq('user_id', userId)
    .in('id', linkedPlannerIds);
}

setCourseAssignments((prev) =>
  prev.filter(
    (assignment) => !courseIds.includes(assignment.courseId)
  )
);

setCourseEvents((prev) =>
  prev.filter((event) => !courseIds.includes(event.courseId))
);

  setCourseSemesters((prev) => {
   const next = { ...prev };
   courseIds.forEach((courseId) => {
      delete next[courseId];
   });
   return next;
  });

  setCustomSemesters((prev) =>
    prev.filter((semester) => semester !== semesterName)
  );

  if (selectedSemester === semesterName) {
    setSelectedSemester(null);
  }

  if (
    selectedCourse &&
    courseIds.includes(selectedCourse.id)
  ) {
    setSelectedCourse(null);
  }

    setDashboardView(null);
    await fetchCourses();
    await fetchAllResources();
  } catch (err) {
    alert('Error deleting semester: ' + err.message);
  }
};

const handleDeleteCourse = async () => {
 if (!selectedCourse) return;
 if (!window.confirm(`Delete "${selectedCourse.name}"?`)) return;

 try {
   const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', selectedCourse.id);

  if (error) throw error;

  const linkedPlannerIds = [
    ...courseAssignments
      .filter((item) => item.courseId === selectedCourse.id)
      .map((item) => item.plannerId)
      .filter(Boolean),
    ...courseEvents
      .filter((item) => item.courseId === selectedCourse.id)
      .map((item) => item.plannerId)
      .filter(Boolean)
  ];

  if (linkedPlannerIds.length > 0 && userId) {
    await supabase
      .from('planner_courses')
      .delete()
      .eq('user_id', userId)
      .in('id', linkedPlannerIds);
  }

  setCourseAssignments((prev) =>
    prev.filter((a) => a.courseId !== selectedCourse.id)
  );
  setCourseEvents((prev) =>
    prev.filter((e) => e.courseId !== selectedCourse.id)
  );
  setCourseSemesters((prev) => {
    const next = { ...prev };
    delete next[selectedCourse.id];
    return next;
  });

  setCourseCredits((prev) => {
    const next = { ...prev };
    delete next[selectedCourse.id];
    return next;
  });

    setSelectedCourse(null);
    await fetchCourses();
    await fetchAllResources();
  } catch (err) {
    alert('Error deleting course: ' + err.message);
  }
};


const clearAllAssignments = async () => {
 if (!selectedCourse) return;

 const items = courseAssignments.filter(
   (assignment) => assignment.courseId === selectedCourse.id
 );

 if (items.length === 0) return;

 if (
   !window.confirm(
     `Clear all ${items.length} assignment${
       items.length === 1 ? '' : 's'
     } from ${selectedCourse.name}?`
   )
 ){
   return;

 }

 const plannerIds = items
  .map((item) => item.plannerId)
  .filter(Boolean);

 if (plannerIds.length > 0 && userId) {
   await supabase
     .from('planner_courses')
     .delete()
     .eq('user_id', userId)
     .in('id', plannerIds);
 }

 const notificationIds = items.map((item) => item.notificationId).filter(Boolean);
 if (notificationIds.length > 0 && userId) {
  await supabase.from('notifications').delete().eq('user_id', userId).in('id', notificationIds);
 }
 setCourseAssignments((prev) =>
   prev.filter(
     (assignment) => assignment.courseId !== selectedCourse.id
   )
 );

  resetAssignmentForm();
};

const clearAllUpcoming = async () => {
 if (!selectedCourse) return;

 const items = courseEvents.filter(
   (event) => event.courseId === selectedCourse.id
 );

 if (items.length === 0) return;

 if (
   !window.confirm(
     `Clear all ${items.length} upcoming item${
       items.length === 1 ? '' : 's'
     } from ${selectedCourse.name}?`
   )
 ){
   return;
 }

 const plannerIds = items
  .map((item) => item.plannerId)
  .filter(Boolean);

 if (plannerIds.length > 0 && userId) {

     await supabase
      .from('planner_courses')
      .delete()
      .eq('user_id', userId)
      .in('id', plannerIds);
 }

 const notificationIds = items.map((item) => item.notificationId).filter(Boolean);
 if (notificationIds.length > 0 && userId) {
  await supabase.from('notifications').delete().eq('user_id', userId).in('id', notificationIds);
 }
 setCourseEvents((prev) =>
   prev.filter((event) => event.courseId !== selectedCourse.id)
 );

  resetEventForm();
};

const clearAllNotes = async () => {
 if (!selectedCourse || savedNotes.length === 0) return;

 if (
   !window.confirm(
     `Clear all ${savedNotes.length} saved note${
       savedNotes.length === 1 ? '' : 's'
     } from ${selectedCourse.name}?`
   )
 ){
   return;
 }

 try {
   const { error } = await supabase
    .from('course_notes')
    .delete()
    .eq('course_id', selectedCourse.id);

     if (error) throw error;

    setSavedNotes([]);
    handleNewNote();
  } catch (err) {
    alert('Error clearing notes: ' + err.message);
  }
};

const clearAllResources = async () => {
 if (!selectedCourse || courseFiles.length === 0) return;

 if (
   !window.confirm(

   `Clear all ${courseFiles.length} resource${
     courseFiles.length === 1 ? '' : 's'
   } from ${selectedCourse.name}?`
   )
 ){
   return;
 }

 try {
   const { error } = await supabase
    .from('course_resources')
    .delete()
    .eq('course_id', selectedCourse.id);

  if (error) throw error;

    setCourseFiles([]);
    setCustomFolders([]);
    setActiveFolderView(null);
    await fetchAllResources();
  } catch (err) {
    alert('Error clearing resources: ' + err.message);
  }
};


// ---------------------------------------------------------
// COURSE <-> PLANNER SYNC
// ---------------------------------------------------------

const createPlannerEntryForCourseItem = async ({
 kind,
 itemId,
 title,
 date,
 type = 'Task',
 reminder = false
}) => {
 if (!userId || !selectedCourse || !date) return null;

 const plannerRow = {
  user_id: userId,
  name: title,
  description: buildCourseLinkDescription({
   kind,
   courseItemId: itemId,
   courseId: selectedCourse.id,
   visibleDescription:

      kind === 'assignment'
       ? `Course assignment • ${selectedCourse.name}`
       : `Course upcoming item • ${selectedCourse.name}`
    }),
    date,
    type,
    start_time: '09:00',
    end_time: '10:00',
    color: selectedCourse.color || DEFAULT_COURSE_COLOR,
    reminder: Boolean(reminder),
    group_id: null,
    is_completed: false
  };

  const { data, error } = await supabase
   .from('planner_courses')
   .insert([plannerRow])
   .select()
   .single();

  if (error) {
    console.error('Could not create linked planner entry:', error);
    alert(
      `The course item was saved, but it could not be added to Planner: ${error.message}`
    );
    return null;
  }

   return data;
 };

 const updateLinkedPlannerEntry = async ({
 plannerId,
 kind,
 itemId,
 title,
 date,
 type = 'Task',
 completed = false,
 reminder = false
}) => {
  if (!userId || !selectedCourse) return plannerId || null;

  if (!date) {
    if (plannerId) {
      await supabase
        .from('planner_courses')

       .delete()
       .eq('id', plannerId)
       .eq('user_id', userId);
     }
     return null;
 }

 if (!plannerId) {
   const created = await createPlannerEntryForCourseItem({
     kind,
     itemId,
     title,
     date,
     type,
     reminder
   });
   return created?.id || null;
 }

 const { error } = await supabase
  .from('planner_courses')
  .update({
    name: title,
    date,
    type,
    color: selectedCourse.color || DEFAULT_COURSE_COLOR,
    is_completed: completed,
    reminder: Boolean(reminder),
    description: buildCourseLinkDescription({
      kind,
      courseItemId: itemId,
      courseId: selectedCourse.id,
      visibleDescription:
       kind === 'assignment'
         ? `Course assignment • ${selectedCourse.name}`
         : `Course upcoming item • ${selectedCourse.name}`
    })
  })
  .eq('id', plannerId)
  .eq('user_id', userId);

 if (error) {
   console.error('Could not update linked planner entry:', error);
 }

  return plannerId;
};

const deleteLinkedPlannerEntry = async (plannerId) => {

 if (!plannerId || !userId) return;

 const { error } = await supabase
  .from('planner_courses')
  .delete()
  .eq('id', plannerId)
  .eq('user_id', userId);

  if (error) {
    console.error('Could not delete linked planner entry:', error);
  }
};

const syncCompletionFromPlanner = async () => {
 if (!userId) return;

 const linkedIds = [
   ...courseAssignments.map((item) => item.plannerId).filter(Boolean),
   ...courseEvents.map((item) => item.plannerId).filter(Boolean)
 ];

 if (linkedIds.length === 0) return;

 const { data, error } = await supabase
  .from('planner_courses')
  .select('id,is_completed,name,date,type')
  .eq('user_id', userId)
  .in('id', linkedIds);

 if (error) {
   console.error('Planner sync fetch error:', error);
   return;
 }

 const plannerMap = new Map((data || []).map((row) => [row.id, row]));

 setCourseAssignments((prev) =>
  prev.map((assignment) => {
   if (!assignment.plannerId) return assignment;
   const planner = plannerMap.get(assignment.plannerId);
   if (!planner) return assignment;

   return {
    ...assignment,
    title: planner.name || assignment.title,
    due: planner.date || assignment.due,
    completed: !!planner.is_completed

    };
   })
 );

 setCourseEvents((prev) =>
  prev.map((event) => {
   if (!event.plannerId) return event;
   const planner = plannerMap.get(event.plannerId);
   if (!planner) return event;

     return {
       ...event,
       title: planner.name || event.title,
       date: planner.date || event.date,
       completed: !!planner.is_completed
     };
    })
  );
};

useEffect(() => {
 const handleFocus = () => {
   syncCompletionFromPlanner();
 };

 window.addEventListener('focus', handleFocus);

  return () => {
    window.removeEventListener('focus', handleFocus);
  };
}, [userId, courseAssignments, courseEvents]);

// ---------------------------------------------------------
// COURSE NOTIFICATIONS
// ---------------------------------------------------------
const upsertCourseNotification = async ({ notificationId = null, enabled = false, title, message }) => {
 if (!userId) return notificationId || null;
 if (!enabled) {
  if (notificationId) {
   const { error } = await supabase.from('notifications').delete().eq('id', notificationId).eq('user_id', userId);
   if (error) console.error('Could not remove course notification:', error);
  }
  return null;
 }
 const payload = { user_id: userId, title, message, category: 'Courses', read: false };
 if (notificationId) {
  const { data, error } = await supabase.from('notifications').update(payload).eq('id', notificationId).eq('user_id', userId).select().maybeSingle();
  if (!error) return data?.id || notificationId;
  console.error('Could not update course notification:', error);
 }
 let result = await supabase.from('notifications').insert([payload]).select().single();
 if (result.error) {
  result = await supabase.from('notifications').insert([{ user_id: userId, title, message }]).select().single();
 }
 if (result.error) {
  console.error('Could not create course notification:', result.error);
  return null;
 }
 return result.data?.id || null;
};

const deleteCourseNotification = async (notificationId) => {
 if (!notificationId || !userId) return;
 const { error } = await supabase.from('notifications').delete().eq('id', notificationId).eq('user_id', userId);
 if (error) console.error('Could not delete course notification:', error);
};

// ---------------------------------------------------------
// ASSIGNMENTS
// ---------------------------------------------------------

const selectedAssignments = selectedCourse
 ? courseAssignments
    .filter((a) => a.courseId === selectedCourse.id)
    .sort((a, b) => (a.due || '').localeCompare(b.due || ''))
 : [];

const resetAssignmentForm = () => {
 setAssignmentTitle('');
 setAssignmentDue('');
 setAssignmentEditingId(null);
 setAssignmentReminder(false);
 setAssignmentNotification(false);
};

const saveAssignment = async (e) => {
 e.preventDefault();
 if (!selectedCourse || !assignmentTitle.trim()) return;

 if (assignmentEditingId) {
  const current = courseAssignments.find((assignment) => assignment.id === assignmentEditingId);
  if (!current) return;
  const plannerId = await updateLinkedPlannerEntry({
   plannerId: current.plannerId,
   kind: 'assignment',
   itemId: current.id,
   title: assignmentTitle.trim(),
   date: assignmentDue,
   type: 'Task',
   completed: !!current.completed,
   reminder: assignmentReminder
  });
  const notificationId = await upsertCourseNotification({
   notificationId: current.notificationId || null,
   enabled: assignmentNotification,
   title: `Assignment: ${assignmentTitle.trim()}`,
   message: `${selectedCourse.name}${assignmentDue ? ` • Due ${formatDate(assignmentDue)}` : ''}`
  });
  setCourseAssignments((prev) => prev.map((assignment) => assignment.id === assignmentEditingId ? {
   ...assignment,
   title: assignmentTitle.trim(),
   due: assignmentDue,
   plannerId,
   reminder: assignmentReminder,
   notification: assignmentNotification,
   notificationId
  } : assignment));
 } else {
  const id = `${Date.now()}-${Math.random()}`;
  const plannerEntry = assignmentDue ? await createPlannerEntryForCourseItem({
   kind: 'assignment', itemId: id, title: assignmentTitle.trim(), date: assignmentDue, type: 'Task', reminder: assignmentReminder
  }) : null;
  const notificationId = await upsertCourseNotification({
   enabled: assignmentNotification,
   title: `Assignment: ${assignmentTitle.trim()}`,
   message: `${selectedCourse.name}${assignmentDue ? ` • Due ${formatDate(assignmentDue)}` : ''}`
  });
  setCourseAssignments((prev) => [...prev, {
   id, courseId: selectedCourse.id, title: assignmentTitle.trim(), due: assignmentDue, completed: false,
   plannerId: plannerEntry?.id || null, reminder: assignmentReminder, notification: assignmentNotification,
   notificationId, createdAt: new Date().toISOString()
  }]);
 }
 resetAssignmentForm();
};

const editAssignment = (assignment) => {
 setAssignmentEditingId(assignment.id);
 setAssignmentTitle(assignment.title);
 setAssignmentDue(assignment.due || '');
 setAssignmentReminder(Boolean(assignment.reminder));
 setAssignmentNotification(Boolean(assignment.notification));
};

const toggleAssignment = async (id) => {
 const target = courseAssignments.find(
   (assignment) => assignment.id === id
 );

 if (!target) return;

 const nextCompleted = !target.completed;

 if (target.plannerId && userId) {
   const { error } = await supabase
     .from('planner_courses')
     .update({ is_completed: nextCompleted })
     .eq('id', target.plannerId)
     .eq('user_id', userId);

     if (error) {
       console.error('Could not sync completion to Planner:', error);
       return;
     }
 }

 setCourseAssignments((prev) =>

    prev.map((assignment) =>
      assignment.id === id
       ? { ...assignment, completed: nextCompleted }
       : assignment
    )
  );
};

const deleteAssignment = async (id) => {
 const target = courseAssignments.find((assignment) => assignment.id === id);
 if (target?.plannerId) await deleteLinkedPlannerEntry(target.plannerId);
 if (target?.notificationId) await deleteCourseNotification(target.notificationId);
 setCourseAssignments((prev) => prev.filter((assignment) => assignment.id !== id));
 if (assignmentEditingId === id) resetAssignmentForm();
};

// ---------------------------------------------------------
// UPCOMING / EXAMS
// ---------------------------------------------------------

const selectedEvents = selectedCourse
 ? courseEvents
    .filter((event) => event.courseId === selectedCourse.id)
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
 : [];

const resetEventForm = () => {
 setEventTitle('');
 setEventDate('');
 setEventType('Exam');
 setEventEditingId(null);
 setEventReminder(false);
 setEventNotification(false);
};

const saveEvent = async (e) => {
 e.preventDefault();
 if (!selectedCourse || !eventTitle.trim()) return;

 if (eventEditingId) {
  const current = courseEvents.find((event) => event.id === eventEditingId);
  if (!current) return;
  const plannerId = await updateLinkedPlannerEntry({
   plannerId: current.plannerId,
   kind: 'upcoming',
   itemId: current.id,
   title: eventTitle.trim(),
   date: eventDate,
   type: plannerTypeForUpcoming(eventType),
   completed: !!current.completed,
   reminder: eventReminder
  });
  const notificationId = await upsertCourseNotification({
   notificationId: current.notificationId || null,
   enabled: eventNotification,
   title: `${eventType}: ${eventTitle.trim()}`,
   message: `${selectedCourse.name}${eventDate ? ` • ${formatDate(eventDate)}` : ''}`
  });
  setCourseEvents((prev) => prev.map((event) => event.id === eventEditingId ? {
   ...event, title: eventTitle.trim(), date: eventDate, type: eventType, plannerId,
   reminder: eventReminder, notification: eventNotification, notificationId
  } : event));
 } else {
  const id = `${Date.now()}-${Math.random()}`;
  const plannerEntry = eventDate ? await createPlannerEntryForCourseItem({
   kind: 'upcoming', itemId: id, title: eventTitle.trim(), date: eventDate,
   type: plannerTypeForUpcoming(eventType), reminder: eventReminder
  }) : null;
  const notificationId = await upsertCourseNotification({
   enabled: eventNotification,
   title: `${eventType}: ${eventTitle.trim()}`,
   message: `${selectedCourse.name}${eventDate ? ` • ${formatDate(eventDate)}` : ''}`
  });
  setCourseEvents((prev) => [...prev, {
   id, courseId: selectedCourse.id, title: eventTitle.trim(), date: eventDate, type: eventType,
   completed: false, plannerId: plannerEntry?.id || null, reminder: eventReminder,
   notification: eventNotification, notificationId, createdAt: new Date().toISOString()
  }]);
 }
 resetEventForm();
};

const editEvent = (event) => {
 setEventEditingId(event.id);
 setEventTitle(event.title);
 setEventDate(event.date || '');
 setEventType(event.type || 'Exam');
 setEventReminder(Boolean(event.reminder));
 setEventNotification(Boolean(event.notification));
};

const toggleEventCompleted = async (id) => {
 const target = courseEvents.find((event) => event.id === id);

 if (!target) return;

 const nextCompleted = !target.completed;

 if (target.plannerId && userId) {
   const { error } = await supabase
     .from('planner_courses')
     .update({ is_completed: nextCompleted })
     .eq('id', target.plannerId)
     .eq('user_id', userId);

     if (error) {
       console.error(
         'Could not sync upcoming completion to Planner:',
         error
       );
       return;
     }
 }

 setCourseEvents((prev) =>
  prev.map((event) =>
   event.id === id
    ? { ...event, completed: nextCompleted }
    : event

    )
  );
};

const deleteEvent = async (id) => {
 const target = courseEvents.find((event) => event.id === id);
 if (target?.plannerId) await deleteLinkedPlannerEntry(target.plannerId);
 if (target?.notificationId) await deleteCourseNotification(target.notificationId);
 setCourseEvents((prev) => prev.filter((event) => event.id !== id));
 if (eventEditingId === id) resetEventForm();
};

// ---------------------------------------------------------
// NOTES
// ---------------------------------------------------------

const handleSaveNotes = async () => {
 if (!selectedCourse) return;

 if (!noteTitle.trim()) {
   alert('Please enter a title for your note!');
   return;
 }

 try {
   setSavingNote(true);

   const payload = {
     course_id: selectedCourse.id,
     title: noteTitle.trim(),
     content: activeNotes
   };

   if (userId) payload.user_id = userId;

   if (editingNoteId) {
     const { error } = await supabase
       .from('course_notes')
       .update(payload)
       .eq('id', editingNoteId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('course_notes')
          .insert([payload]);

          if (error) throw error;
      }

    setNoteTitle('');
    setActiveNotes('');
    setEditingNoteId(null);
    fetchNotes(selectedCourse.id);
  } catch (err) {
    alert('Error saving note: ' + err.message);
  } finally {
    setSavingNote(false);
  }
};

const handleSelectNote = (note) => {
  setEditingNoteId(note.id);
  setNoteTitle(note.title);
  setActiveNotes(note.content || '');
};

const handleNewNote = () => {
  setEditingNoteId(null);
  setNoteTitle('');
  setActiveNotes('');
};

const handleDeleteNote = async (id, e) => {
 e.stopPropagation();

 if (window.confirm('Delete this note?')) {
   await supabase.from('course_notes').delete().eq('id', id);

      if (editingNoteId === id) handleNewNote();
      fetchNotes(selectedCourse.id);
  }
};

// ---------------------------------------------------------
// RESOURCES
// ---------------------------------------------------------

const existingFolders = Array.from(
  new Set([
   ...customFolders,
   ...courseFiles.map((f) => f.folder_name).filter(Boolean)
  ])
);

const handleFileSelect = (e) => {
 if (e.target.files && e.target.files[0]) {
   const file = e.target.files[0];
   setSelectedFile(file);

     const nameWithoutExt =
      file.name.substring(0, file.name.lastIndexOf('.')) || file.name;

     setCustomFileName(nameWithoutExt);

     if (existingFolders.length === 0) {
       setFolderMode('new');
       setSelectedFolder('');
     } else {
       setFolderMode('existing');
       setSelectedFolder(existingFolders[0]);
     }

     setIsFileModalOpen(true);
 }

  e.target.value = '';
};

const uploadFile = async (e) => {
 e.preventDefault();
 if (!selectedFile || !selectedCourse) return;

 try {
   setUploading(true);

     const targetFolder =
      folderMode === 'new'
       ? newFolderName.trim() || 'General Resources'
       : selectedFolder || 'General Resources';

     const extension = selectedFile.name.includes('.')
      ? selectedFile.name.split('.').pop()
      : '';

   const finalFileName = customFileName.trim()
    ? extension
      ? `${customFileName.trim()}.${extension}`
      : customFileName.trim()
    : selectedFile.name;

   const sanitizedFileName = finalFileName.replace(
     /[^a-zA-Z0-9.-]/g,
     '_'
   );

   const safePath = `${userId || 'public'}/${selectedCourse.id}/${Date.now()}
_${sanitizedFileName}`;

   const { error: uploadError } = await supabase.storage
    .from('course-files')
    .upload(safePath, selectedFile, {
      cacheControl: '3600',
      upsert: false
    });

   if (uploadError) throw uploadError;

   const { data: urlData } = supabase.storage
    .from('course-files')
    .getPublicUrl(safePath);

   const resourceData = {
     course_id: selectedCourse.id,
     file_name: finalFileName,
     file_url: urlData.publicUrl,
     folder_name: targetFolder,
     user_id: userId
   };

   const { error: dbError } = await supabase
    .from('course_resources')
    .insert([resourceData]);

   if (dbError) throw dbError;

   if (folderMode === 'new' && !customFolders.includes(targetFolder)) {
     setCustomFolders((prev) => [...prev, targetFolder]);
   }

   setSaveBanner({

   fileName: finalFileName,
   folderName: targetFolder
  });

  setTimeout(() => setSaveBanner(null), 5000);

  setIsFileModalOpen(false);
  setSelectedFile(null);
  setCustomFileName('');
  setNewFolderName('');

    await fetchFiles(selectedCourse.id);
    await fetchAllResources();
  } catch (error) {
    console.error('Upload error details:', error);
    alert(
      'Upload failed: ' +
       (error.message || 'Security or schema error.')
    );
  } finally {
    setUploading(false);
  }
};

const handleDeleteFile = async (fileId, e) => {
 e.stopPropagation();

  if (window.confirm('Remove this file?')) {
    await supabase.from('course_resources').delete().eq('id', fileId);
    await fetchFiles(selectedCourse.id);
    await fetchAllResources();
  }
};

const handleRenameFolder = async (oldFolderName, e) => {
 e.stopPropagation();

 if (
   !renamedFolderValue.trim() ||
   renamedFolderValue.trim() === oldFolderName
 ){
   setEditingFolderName(null);
   return;
 }

 try {
   const nextName = renamedFolderValue.trim();

  const { error } = await supabase
   .from('course_resources')
   .update({ folder_name: nextName })
   .eq('course_id', selectedCourse.id)
   .eq('folder_name', oldFolderName);

  if (error) throw error;

  setCustomFolders((prev) =>
    prev.map((folder) =>
      folder === oldFolderName ? nextName : folder
    )
  );

  if (activeFolderView === oldFolderName) {
    setActiveFolderView(nextName);
  }

    setEditingFolderName(null);
    await fetchFiles(selectedCourse.id);
    await fetchAllResources();
  } catch (err) {
    alert('Error renaming folder: ' + err.message);
  }
};

const handleDeleteFolder = async (folderName, e) => {
 e.stopPropagation();

 if (
   window.confirm(
     `Delete folder "${folderName}" and all files inside it?`
   )
 ){
   try {
     const { error } = await supabase
      .from('course_resources')
      .delete()
      .eq('course_id', selectedCourse.id)
      .eq('folder_name', folderName);

   if (error) throw error;

   setCustomFolders((prev) =>
     prev.filter((folder) => folder !== folderName)
   );

       if (activeFolderView === folderName) {
         setActiveFolderView(null);
       }

        await fetchFiles(selectedCourse.id);
        await fetchAllResources();
      } catch (err) {
        alert('Error deleting folder: ' + err.message);
      }
  }
};

// =========================================================
// SELECTED SEMESTER
// =========================================================

if (selectedSemester && !selectedCourse) {
  const semesterCourses = courses.filter(
    (course) => courseSemester(course) === selectedSemester
  );

 const semesterCourseIds = new Set(
   semesterCourses.map((course) => course.id)
 );

 const semesterAssignments = courseAssignments.filter(
   (assignment) =>
    semesterCourseIds.has(assignment.courseId) &&
    !assignment.completed
 );

 const semesterUpcoming = courseEvents.filter((event) => {
  if (
    !semesterCourseIds.has(event.courseId) ||
    !event.date ||
    event.completed
  ){
    return false;
  }

  return new Date(`${event.date}T00:00:00`) >= todayStart();
 });

 const semesterResources = allResources.filter((resource) =>
   semesterCourseIds.has(resource.course_id)
 );

 const semesterCredits = semesterCourses.reduce(
  (sum, course) =>
   sum + Math.max(0, Number(courseCredits[course.id]) || 0),
  0
 );

const semesterSearch = searchTerm.trim().toLowerCase();

const visibleSemesterCourses = semesterCourses.filter((course) => {
 if (!semesterSearch) return true;

 return (
    course.name?.toLowerCase().includes(semesterSearch) ||
    course.professor?.toLowerCase().includes(semesterSearch) ||
    course.days?.toLowerCase().includes(semesterSearch)
 );
});

return (
 <div
   style={{
    width: '100%',
    maxWidth: '1250px',
    margin: '0 auto',
    animation: 'fadeIn 0.35s ease'
   }}
 >
   <button
    onClick={() => {
      setSelectedSemester(null);
      setSearchTerm('');
    }}
    style={backBtnStyle}
   >
    <ArrowLeft size={20} strokeWidth={3} />
    <span>Back to Semesters</span>
   </button>

  <div
   style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '20px',
    flexWrap: 'wrap',
    marginBottom: '28px'
   }}
  >
   <div>
    <div style={semesterPillStyle}>
      <CalendarDays size={14} />
      Semester Workspace

 </div>

 <h1
  style={{
   fontSize: '42px',
   fontWeight: '900',
   color: '#0B1A3F',
   margin: '10px 0 0'
  }}
 >
  {selectedSemester}
 </h1>

 <p
  style={{
    margin: '7px 0 0',
    color: '#7C8AB8',
    fontWeight: '700',
    fontSize: '14px'
  }}
 >
  {semesterCourses.length}{' '}
  {semesterCourses.length === 1 ? 'course' : 'courses'} in this semester
  {' • '}
  {semesterCredits} {semesterCredits === 1 ? 'credit' : 'credits'}
 </p>
</div>

<div
 style={{
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  flexWrap: 'wrap'
 }}
>
 <button
  type="button"
  onClick={() => openEditSemester(selectedSemester)}
  style={editSemesterBtnStyle}
 >
  <Edit2 size={16} />
  Edit Semester
 </button>

 <button
  type="button"
  onClick={() => handleDeleteSemester(selectedSemester)}
  style={deleteSemesterBtnStyle}

  >
   <Trash2 size={16} />
   Delete Semester
  </button>

  <button
    type="button"
    onClick={() => {
     setSemesterMode('existing');
     setCustomSemester('');
     setNewCourse({
       name: '',
       professor: '',
       days: 'MWF',
       semester: selectedSemester,
       color: DEFAULT_COURSE_COLOR,
       credits: '3',
       class_start_date: '',
       class_end_date: '',
       class_start_time: '09:00',
       class_end_time: '10:00'
     });
     setIsModalOpen(true);
    }}
    style={addBtnStyle}
  >
    <Plus size={19} strokeWidth={3} />
    Add Course
  </button>
 </div>
</div>

{/* EXACT SAME FOUR SUMMARY BOXES AS THE MAIN PAGE */}
<div style={statsGridStyle}>
  <StatCard
   icon={<BookOpen size={24} />}
   label="Total Courses"
   value={semesterCourses.length}
   bg="#F7F4FC"
   iconColor="#8B78B8"
  />

 <StatCard
  icon={<ClipboardCheck size={24} />}
  label="Assignments"
  value={semesterAssignments.length}
  bg="#F3F7FD"
  iconColor="#648CCB"
 />

 <StatCard
  icon={<Clock3 size={24} />}

  label="Upcoming"
  value={semesterUpcoming.length}
  bg="#FFF6F2"
  iconColor="#D9896A"
 />

 <StatCard
  icon={<FolderOpen size={24} />}
  label="Resources"
  value={semesterResources.length}
  bg="#F2F9F7"
  iconColor="#5E9A8B"
 />

 <StatCard
  icon={<GraduationCap size={24} />}
  label="Credits"
  value={semesterCredits}
  bg="#FFF9F1"
  iconColor="#C99758"
 />
</div>

<div
 style={{
  ...searchBoxStyle,
  marginBottom: '24px'
 }}
>
 <Search size={21} color="#95A4C7" />

 <input
  type="text"
  placeholder={`Search courses in ${selectedSemester}...`}
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  style={searchInputStyle}
 />

 {searchTerm && (
  <button
    type="button"
    onClick={() => setSearchTerm('')}
    style={clearSearchBtn}
  >
    <X size={16} />
  </button>
 )}
</div>

{visibleSemesterCourses.length === 0 ? (
 <div style={emptyCoursesCard}>
   <EmptyState
    text={
      semesterCourses.length === 0

     ? 'No courses in this semester yet.'
     : 'No courses match your search.'
    }
    subtext={
      semesterCourses.length === 0
       ? 'Use Add Course to create the first course.'
       : 'Try another course or professor name.'
    }
  />
 </div>
):(
 <div style={courseGridStyle}>
  {visibleSemesterCourses.map((course) => {
    const assignmentCount = courseAssignments.filter(
      (assignment) =>
       assignment.courseId === course.id &&
       !assignment.completed
    ).length;

   const eventCount = courseEvents.filter((event) => {
    if (
      event.courseId !== course.id ||
      !event.date ||
      event.completed
    ){
      return false;
    }

    return (
      new Date(`${event.date}T00:00:00`) >= todayStart()
    );
   }).length;

   const resourceCount = allResources.filter(
     (resource) => resource.course_id === course.id
   ).length;

   const creditCount = Math.max(
     0,
     Number(courseCredits[course.id]) || 0
   );

   const courseColor =
    course.color || DEFAULT_COURSE_COLOR;

   return (
    <div
      key={course.id}
      onClick={() => openCourse(course)}
      style={{
       ...courseCardStyle,
       background: '#FFFFFF',

  border: `1.8px solid ${courseColor}`,
  borderTop: `7px solid ${courseColor}`,
  boxShadow: `0 10px 26px rgba(11,26,63,0.045)`
 }}
>
 <div style={courseCardTopRow}>
  <div
    style={{
     ...courseIconWrap,
     background: courseColor
    }}
  >
    <BookOpen
     size={22}
     color={getContrastColor(courseColor)}
    />
  </div>

  <ChevronRight size={21} color="#9AA7C6" />
 </div>

 <h3 style={courseNameStyle}>
  {course.name}
 </h3>

 <div style={courseMetaWrap}>
  {course.professor && (
   <span style={courseMetaPill}>
     Prof. {course.professor}
   </span>
  )}

  {course.days && (
   <span style={courseMetaPill}>
     {course.days}
   </span>
  )}

  <span style={courseMetaPill}>
   {creditCount} {creditCount === 1 ? 'credit' : 'credits'}
  </span>
 </div>

 <div style={courseCountsRow}>
  <CourseCount
   label="Assignments"
   value={assignmentCount}
   color="#648CCB"
   muted="#648CCB"
   bg="#F3F7FD"
  />

      <CourseCount
       label="Upcoming"
       value={eventCount}
       color="#D9896A"
       muted="#D9896A"
       bg="#FFF6F2"
      />
      <CourseCount
       label="Resources"
       value={resourceCount}
       color="#5E9A8B"
       muted="#5E9A8B"
       bg="#F2F9F7"
      />
      <CourseCount
       label="Credits"
       value={creditCount}
       color="#C99758"
       muted="#C99758"
       bg="#FFF9F1"
      />
     </div>

       <div style={openWorkspaceText}>
        Open Workspace →
       </div>
      </div>
    );
   })}
 </div>
)}


{editingSemesterName && (
 <EditSemesterModal
   value={editedSemesterValue}
   setValue={setEditedSemesterValue}
   onSave={saveEditedSemester}
   onClose={closeEditSemester}
 />
)}

{isModalOpen && (
  <CourseModal
   semesterOptions={semesterOptions}
   semesterMode={semesterMode}
   setSemesterMode={setSemesterMode}
   customSemester={customSemester}
   setCustomSemester={setCustomSemester}
   newCourse={newCourse}
   setNewCourse={setNewCourse}
   handleAddCourse={handleAddCourse}
   handleUpdateCourse={handleUpdateCourse}
   editingCourse={editingCourse}

          setIsModalOpen={setIsModalOpen}
        />
       )}
      </div>
    );
}

// =========================================================
// SELECTED COURSE WORKSPACE
// =========================================================

if (selectedCourse) {
  const themeColor = selectedCourse.color || DEFAULT_COURSE_COLOR;
  const themeTextColor = getContrastColor(themeColor);
  const themeMutedTextColor =
    themeTextColor === '#FFFFFF'
     ? 'rgba(255,255,255,0.78)'
     : '#64748B';
  const themeSoft = `${themeColor}14`;
  const themeBorder = `${themeColor}55`;
  const semester = courseSemester(selectedCourse);

    const filesByFolder = existingFolders.reduce((acc, folder) => {
      acc[folder] = courseFiles.filter(
        (file) => file.folder_name === folder
      );
      return acc;
    }, {});

    const courseResourceCount = courseFiles.length;
    const courseUpcomingCount = selectedEvents.filter((event) => {
     if (!event.date) return false;
     return new Date(`${event.date}T00:00:00`) >= todayStart();
    }).length;

    const tabs = [
     {
       id: 'notes',
       label: 'Notes',
       count: savedNotes.length,
       icon: <FileText size={17} />
     },
     {
       id: 'assignments',
       label: 'Assignments',
       count: selectedAssignments.length,
       icon: <ClipboardCheck size={17} />
     },
     {
       id: 'upcoming',
       label: 'Upcoming',
       count: courseUpcomingCount,
       icon: <Clock3 size={17} />
     },
     {
       id: 'resources',
       label: 'Resources',
       count: courseResourceCount,
       icon: <FolderOpen size={17} />
     }
    ];

return (
 <div
   style={{
    width: '100%',
    maxWidth: '1250px',
    margin: '0 auto',
    animation: 'fadeIn 0.35s ease'
   }}
 >
   <button
    onClick={() => {
      setSelectedCourse(null);
      setActiveFolderView(null);
    }}
    style={backBtnStyle}
   >
    <ArrowLeft size={20} strokeWidth={3} />
    <span>Back to Courses</span>
   </button>

  {/* COURSE HEADER */}
  <div
    style={{
     background: '#FFFFFF',
     border: `2.5px solid ${themeColor}`,
     borderRadius: '26px',
     padding: '26px 28px',
     marginBottom: '22px',
     boxShadow: '0 12px 30px rgba(11,26,63,0.04)',
     display: 'flex',
     justifyContent: 'space-between',
     alignItems: 'center',
     gap: '20px',
     flexWrap: 'wrap'

 }}
>
 <div>
  <div style={semesterPillStyle}>
    <CalendarDays size={14} />
    {semester}
  </div>

  <h1
   style={{
    fontSize: '40px',
    fontWeight: '900',
    color: '#0B1A3F',
    margin: '10px 0 0'
   }}
  >
   {selectedCourse.name}
  </h1>

  <div
   style={{
     display: 'flex',
     gap: '16px',
     flexWrap: 'wrap',
     marginTop: '8px',
     fontSize: '14px',
     fontWeight: '800',
     color: '#64748B'
   }}
  >
   {selectedCourse.professor && (
     <span>Prof. {selectedCourse.professor}</span>
   )}
   {selectedCourse.days && (
     <span>{selectedCourse.days}</span>
   )}
  </div>
 </div>

 <div
  style={{
   width: '70px',
   height: '70px',
   borderRadius: '20px',
   background: themeColor,
   display: 'flex',
   alignItems: 'center',

    justifyContent: 'center'
  }}
 >
  <BookOpen size={30} color={themeTextColor} />
 </div>
</div>

{/* WORKSPACE TABS */}
<div style={workspaceTabsWrap}>
  {tabs.map((tab) => (
   <button
     key={tab.id}
     type="button"
     onClick={() => {
       setWorkspaceTab(tab.id);
       setActiveFolderView(null);
     }}
     style={{
      ...workspaceTabBase,
      background: workspaceTab === tab.id ? themeColor : themeSoft,
      color: workspaceTab === tab.id ? themeTextColor : '#0B1A3F',
      border: `1.5px solid ${workspaceTab === tab.id ? themeColor : themeBorder}`,
      boxShadow: workspaceTab === tab.id ? `0 6px 15px ${themeColor}28` : 'none'
     }}
   >
     {tab.icon}
     <span>{tab.label}</span>
     <span
       style={{
        ...(workspaceTab === tab.id ? activeCountBubble : countBubble),
        background: workspaceTab === tab.id
          ? (themeTextColor === '#FFFFFF' ? 'rgba(255,255,255,0.18)' : 'rgba(11,26,63,0.10)')
          : '#FFFFFF',
        color: workspaceTab === tab.id ? themeTextColor : '#0B1A3F'
       }}
     >
       {tab.count}
     </span>
   </button>
  ))}
</div>

{saveBanner && (
 <div style={bannerStyle}>
  <FolderCheck size={28} color="#15803D" />
  <div>
   <div
     style={{
      fontWeight: '900',
      color: '#15803D',
      fontSize: '15px'

     }}
    >
     Saved to Folder!
    </div>
    <div
     style={{
       fontSize: '13px',
       color: '#166534'
     }}
    >
     <strong>{saveBanner.fileName}</strong> stored inside{' '}
     <strong>{saveBanner.folderName}</strong>
    </div>
   </div>
 </div>
)}

{/* NOTES */}
{workspaceTab === 'notes' && (
  <div
   style={{
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.45fr) minmax(280px, 0.75fr)',
    gap: '24px',
    alignItems: 'start'
   }}
  >
   <div
    style={{
      ...notepadCardStyle,
      background: themeSoft,
      border: `2px solid ${themeColor}`
    }}
   >
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '15px',
        flexWrap: 'wrap'
      }}
    >
      <span
        style={{
          ...notepadTag,
          color: themeColor,
          background: '#FFFFFF',
          border: `1px solid ${themeBorder}`
 }}
>
 <NotepadIcon
  size={20}
  color={themeColor}
 />
 {editingNoteId ? 'Editing Note' : 'New Note'}
</span>

<div
 style={{
  display: 'flex',
  gap: '10px'
 }}
>
 {editingNoteId && (
  <button
    onClick={handleNewNote}
    style={{
     ...smallNoteBtn,
     color: themeColor,
     background: '#FFFFFF',
     border: `1px solid ${themeBorder}`
    }}
  >
    + New Page
  </button>
 )}

 <button
  onClick={handleSaveNotes}
  disabled={savingNote}
  style={{ ...saveNotepadBtn, background: themeColor, color: themeTextColor }}
 >
  {savingNote ? (
   <RefreshCw
     className="animate-spin"

      size={16}
    />
   ):(
    <Save size={16} />
   )}

    <span>
     {savingNote ? 'Saving...' : 'Save Note'}
    </span>
  </button>
 </div>
</div>

<input
 type="text"
 placeholder="Note Title..."
 value={noteTitle}
 onChange={(e) => setNoteTitle(e.target.value)}
 style={{
   ...notepadTitleInput,
   color: '#0B1A3F',
   background: '#FFFFFF',
   border: `1.5px solid ${themeBorder}`
 }}
/>

<textarea
 value={activeNotes}
 onChange={(e) => setActiveNotes(e.target.value)}
 style={{
  ...notepadTextArea,
  color: '#0B1A3F',
  background: '#FFFFFF',
  border: `1.5px solid ${themeBorder}`
  }}
  placeholder="Write your note contents here..."
 />
</div>

<div style={whitePanelStyle}>
 <div style={panelHeaderRowStyle}>
  <h3
   style={{
     ...panelTitleStyle,
     marginBottom: 0
   }}
  >
   <NotepadIcon size={21} color="#0B1A3F" />
   Saved Notes
   <span style={titleCountStyle}>
     {savedNotes.length}
   </span>
  </h3>

  {savedNotes.length > 0 && (
   <button
     type="button"
     onClick={clearAllNotes}
     style={clearAllBtnStyle}
   >
     <Trash2 size={13} />
     Clear All
   </button>
  )}
 </div>

 <div style={{ height: '16px' }} />
 {savedNotes.length === 0 ? (
  <EmptyState
   text="No saved notes yet."
   subtext="Write your first note on the left."
  />
 ):(
  <div
   style={{
     display: 'flex',
     flexDirection: 'column',
     gap: '10px'
   }}

>
 {savedNotes.map((note) => (
  <div
   key={note.id}
   onClick={() => handleSelectNote(note)}
   style={{
    ...savedNoteRow,
    background:
      editingNoteId === note.id
        ? themeColor
        : '#F8FAFC',
    border:
      editingNoteId === note.id
        ? '1.5px solid #0B1A3F'
        : '1px solid #E8EDF5'
   }}
  >
   <div
    style={{
      minWidth: 0,
      flex: 1
    }}
   >
    <div
      style={{
        ...savedNoteTitle,
        color:
          editingNoteId === note.id
            ? themeTextColor
            : '#0B1A3F'
      }}
    >
      {note.title || 'Untitled Note'}
    </div>
    <div
      style={{
        ...savedNotePreview,
        color:
          editingNoteId === note.id
            ? themeMutedTextColor
            : '#8996B5'
      }}
    >
      {note.content || 'Empty note'}
    </div>
   </div>

          <button
           onClick={(e) =>
             handleDeleteNote(note.id, e)
           }
           style={iconActionBtn}
          >
           <Trash2 size={14} color="#EE5D50" />
          </button>
        </div>
       ))}
     </div>
    )}
   </div>
 </div>
)}

{/* ASSIGNMENTS */}
{workspaceTab === 'assignments' && (
  <div style={twoColumnWorkspace}>
   <div style={whitePanelStyle}>
    <h3 style={panelTitleStyle}>
     <ClipboardCheck size={20} />
     {assignmentEditingId
       ? 'Edit Assignment'
       : 'Add Assignment'}
    </h3>

   <form
    onSubmit={saveAssignment}
    style={{
     display: 'flex',
     flexDirection: 'column',
     gap: '15px'
    }}
   >
    <div>
     <label style={fieldLabel}>
       Assignment Name
     </label>
     <input
       value={assignmentTitle}
       onChange={(e) =>
         setAssignmentTitle(e.target.value)
       }
       placeholder="e.g. Problem Set 3"
       style={modalInput}

    required
   />
  </div>

  <div>
   <label style={fieldLabel}>Due Date</label>
   <input
    type="date"
    value={assignmentDue}
    onChange={(e) =>
      setAssignmentDue(e.target.value)
    }
    style={modalInput}
   />
  </div>

  <div style={alertOptionsGridStyle}>
   <AlertOption
    icon={<AlarmClock size={17} />}
    title="Reminder"
    text="Show this under Reminders and in Planner."
    active={assignmentReminder}
    onClick={() => setAssignmentReminder((value) => !value)}
    accent="#8A75D6"
    soft="#F6F3FF"
   />
   <AlertOption
    icon={<Bell size={17} />}
    title="Notification"
    text="Add this to your Courses notifications."
    active={assignmentNotification}
    onClick={() => setAssignmentNotification((value) => !value)}
    accent="#5B8DEF"
    soft="#F1F6FF"
   />
  </div>

  <button
   type="submit"
   style={saveBtnStyle}
  >
   {assignmentEditingId
    ? 'Save Changes'
    : 'Add Assignment'}
  </button>

  {assignmentEditingId && (
    <button
     type="button"
     onClick={resetAssignmentForm}
     style={cancelBtnStyle}
    >
     Cancel Edit
    </button>
  )}
 </form>
</div>

<div style={whitePanelStyle}>
 <div style={panelHeaderRowStyle}>
  <h3
   style={{
     ...panelTitleStyle,
     marginBottom: 0
   }}
  >
   Assignment List
   <span style={titleCountStyle}>

   {selectedAssignments.length}
  </span>
 </h3>

 {selectedAssignments.length > 0 && (
  <button
    type="button"
    onClick={clearAllAssignments}
    style={clearAllBtnStyle}
  >
    <Trash2 size={13} />
    Clear All
  </button>
 )}
</div>

<div style={{ height: '16px' }} />
{selectedAssignments.length === 0 ? (
 <EmptyState
  text="No assignments yet."
  subtext="Add one from the form."
 />
):(
 <div
  style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  }}
 >
  {selectedAssignments.map((assignment) => (
    <div
      key={assignment.id}
      style={taskRowStyle}
    >
      <button
       type="button"
       onClick={() =>
         toggleAssignment(assignment.id)
       }
       style={{
         ...completionButtonStyle,
         background: assignment.completed
           ? '#0B1A3F'
           : '#FFFFFF',
         color: assignment.completed
           ? '#FFFFFF'

   : '#0B1A3F'
 }}
>
 {assignment.completed && (
  <Check size={14} />
 )}
</button>

<div
 style={{
  flex: 1,
  minWidth: 0
 }}
>
 <div
  style={{
    fontWeight: '900',
    color: '#0B1A3F',
    textDecoration:
     assignment.completed
      ? 'line-through'
      : 'none',
    opacity: assignment.completed
     ? 0.55
     :1
  }}
 >
  {assignment.title}
 </div>

 <div style={metaTextStyle}>
  {assignment.due
    ? `Due ${formatDate(assignment.due)}`
    : 'No due date'}
 </div>
 <div style={miniAlertBadgeRowStyle}>
  {assignment.reminder && <MiniAlertBadge icon={<AlarmClock size={10} />} label="Reminder" />}
  {assignment.notification && <MiniAlertBadge icon={<Bell size={10} />} label="Notification" />}
 </div>
</div>

<button
 type="button"
 onClick={() => editAssignment(assignment)}
 style={iconActionBtn}
>
 <Edit2 size={14} color="#3B82F6" />
</button>

<button
 type="button"

           onClick={() =>
             deleteAssignment(assignment.id)
           }
           style={iconActionBtn}
          >
           <Trash2 size={14} color="#EE5D50" />
          </button>
        </div>
       ))}
     </div>
    )}
   </div>
 </div>
)}

{/* UPCOMING */}
{workspaceTab === 'upcoming' && (
  <div style={twoColumnWorkspace}>
   <div style={whitePanelStyle}>
    <h3 style={panelTitleStyle}>
     <Clock3 size={20} />
     {eventEditingId
       ? 'Edit Upcoming Item'
       : 'Add Upcoming Item'}
    </h3>

   <form
    onSubmit={saveEvent}
    style={{
     display: 'flex',
     flexDirection: 'column',
     gap: '15px'
    }}
   >
    <div>
     <label style={fieldLabel}>Title</label>
     <input
       value={eventTitle}
       onChange={(e) =>
         setEventTitle(e.target.value)
       }
       placeholder="e.g. Midterm 1"
       style={modalInput}
       required
     />
    </div>

 <div>
  <label style={fieldLabel}>Type</label>
  <select
   value={eventType}
   onChange={(e) =>
     setEventType(e.target.value)
   }
   style={modalInput}
  >
   <option>Exam</option>
   <option>Quiz</option>
   <option>Presentation</option>
   <option>Project</option>
   <option>Lab</option>
   <option>Other</option>
  </select>
 </div>

 <div>
  <label style={fieldLabel}>Date</label>
  <input
   type="date"
   value={eventDate}
   onChange={(e) =>
     setEventDate(e.target.value)
   }
   style={modalInput}
  />
 </div>

 <div style={alertOptionsGridStyle}>
  <AlertOption
   icon={<AlarmClock size={17} />}
   title="Reminder"
   text="Show this under Reminders and in Planner."
   active={eventReminder}
   onClick={() => setEventReminder((value) => !value)}
   accent={themeColor}
   soft={themeSoft}
  />
  <AlertOption
   icon={<Bell size={17} />}
   title="Notification"
   text="Add this to your Courses notifications."
   active={eventNotification}
   onClick={() => setEventNotification((value) => !value)}
   accent={themeColor}
   soft={themeSoft}
  />
 </div>

 <button type="submit" style={saveBtnStyle}>
  {eventEditingId
   ? 'Save Changes'
   : 'Add Upcoming Item'}
 </button>

 {eventEditingId && (
   <button
    type="button"
    onClick={resetEventForm}
    style={cancelBtnStyle}
   >
    Cancel Edit
   </button>
 )}
</form>

</div>

<div style={whitePanelStyle}>
 <div style={panelHeaderRowStyle}>
  <h3
   style={{
     ...panelTitleStyle,
     marginBottom: 0
   }}
  >
   Upcoming
   <span style={titleCountStyle}>
     {
       selectedEvents.filter(
         (event) => !event.completed
       ).length
     }
   </span>
  </h3>

  {selectedEvents.length > 0 && (
   <button
     type="button"
     onClick={clearAllUpcoming}
     style={clearAllBtnStyle}
   >
     <Trash2 size={13} />
     Clear All
   </button>
  )}
 </div>

 <div style={{ height: '16px' }} />

 {selectedEvents.filter((event) => !event.completed)
  .length === 0 ? (
  <EmptyState
    text="Nothing upcoming."
    subtext="Add an exam, quiz, project, or other date."
  />
 ):(
  <div
    style={{
     display: 'flex',
     flexDirection: 'column',
     gap: '10px'
    }}

>
 {selectedEvents
  .filter((event) => !event.completed)
  .map((event) => {
    const isPast =
      event.date &&
      new Date(`${event.date}T00:00:00`) <
       todayStart();

   return (
    <div
      key={event.id}
      style={{
       ...taskRowStyle,
       opacity: isPast ? 0.7 : 1
      }}
    >
      <button
       type="button"
       onClick={() =>
         toggleEventCompleted(event.id)
       }
       style={{
         ...completionButtonStyle,
         background: '#FFFFFF',
         color: '#0B1A3F'
       }}
      />

     <div style={eventTypeBadgeStyle}>
      {event.type}
     </div>

     <div style={{ flex: 1, minWidth: 0 }}>
      <div
       style={{
        fontWeight: '900',
        color: '#0B1A3F'
       }}
      >
       {event.title}
      </div>

      <div style={metaTextStyle}>
       {event.date
        ? formatDate(event.date)
        : 'No date'}

         {isPast ? ' • Past' : ''}
        </div>
        <div style={miniAlertBadgeRowStyle}>
         {event.reminder && <MiniAlertBadge icon={<AlarmClock size={10} />} label="Reminder" />}
         {event.notification && <MiniAlertBadge icon={<Bell size={10} />} label="Notification" />}
        </div>
       </div>

       <button
        type="button"
        onClick={() => editEvent(event)}
        style={iconActionBtn}
       >
        <Edit2 size={14} color="#3B82F6" />
       </button>

        <button
         type="button"
         onClick={() => deleteEvent(event.id)}
         style={iconActionBtn}
        >
         <Trash2 size={14} color="#EE5D50" />
        </button>
       </div>
     );
   })}
 </div>
)}

<div style={doneSectionDividerStyle} />

<div style={panelHeaderRowStyle}>
 <h3
  style={{
    ...panelTitleStyle,
    marginBottom: 0
  }}
 >
  Done
  <span style={titleCountStyle}>
    {
      selectedEvents.filter(
        (event) => event.completed
      ).length
    }
  </span>
 </h3>
</div>

<div style={{ height: '12px' }} />

{selectedEvents.filter((event) => event.completed)
 .length === 0 ? (
 <div style={doneEmptyStyle}>
   Completed items will move here.
 </div>
):(
 <div
   style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
   }}
 >
   {selectedEvents
    .filter((event) => event.completed)
    .map((event) => (
      <div
        key={event.id}
        style={{
         ...taskRowStyle,
         background: '#F8FAFC'
        }}
      >
        <button
         type="button"
         onClick={() =>
           toggleEventCompleted(event.id)
         }
         style={{
           ...completionButtonStyle,
           background: '#0B1A3F',
           color: '#FFFFFF'
         }}
        >
         <Check size={14} />
        </button>

     <div
      style={{
       ...eventTypeBadgeStyle,
       opacity: 0.65
      }}
     >
      {event.type}
     </div>

         <div style={{ flex: 1, minWidth: 0 }}>
          <div
           style={{
            fontWeight: '900',
            color: '#64748B',
            textDecoration: 'line-through'
           }}
          >
           {event.title}
          </div>

          <div style={metaTextStyle}>
           {event.date
             ? formatDate(event.date)
             : 'No date'}
          </div>
         </div>

           <button
            type="button"
            onClick={() => deleteEvent(event.id)}
            style={iconActionBtn}
           >
            <Trash2 size={14} color="#EE5D50" />
           </button>
         </div>
        ))}
     </div>
    )}
   </div>
 </div>
)}

{/* RESOURCES */}
{workspaceTab === 'resources' && (
  <div style={whitePanelStyle}>
   <div
    style={{
     display: 'flex',
     justifyContent: 'space-between',
     alignItems: 'center',
     marginBottom: '20px',
     gap: '14px',
     flexWrap: 'wrap'
    }}
   >

<h3 style={{ ...panelTitleStyle, marginBottom: 0 }}>
 {activeFolderView ? (
  <>
    <button
     onClick={() => setActiveFolderView(null)}
     style={iconBackBtn}
    >
     <ArrowLeft size={16} />
    </button>
    <FolderOpen color="#3B82F6" size={20} />
    <span>{activeFolderView}</span>
  </>
 ):(
  <>
    <Folder color="#0B1A3F" size={20} />
    <span>Course Folders</span>
    <span style={titleCountStyle}>
     {existingFolders.length}
    </span>
  </>
 )}
</h3>

<div
 style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
 }}
>
 {courseFiles.length > 0 && (
  <button
    type="button"
    onClick={clearAllResources}
    style={clearAllBtnStyle}
  >
    <Trash2 size={13} />
    Clear All
  </button>
 )}

 <label style={uploadIconLabel}>
  <input
   type="file"
   hidden
   onChange={handleFileSelect}
   disabled={uploading}

               />
               <FolderPlus size={18} color="#0B1A3F" />
               <span
                style={{
                  fontSize: '13px',
                  fontWeight: '800'
                }}
               >
                Add File
               </span>
             </label>
            </div>
           </div>

           {!activeFolderView ? (
             existingFolders.length === 0 ? (
              <EmptyState
               text="No folders created yet."
               subtext='Click "Add File" to upload something and create your first
folder.'
             />
            ):(
             <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '14px'
              }}
             >
              {existingFolders.map((folderName) => {
                const count =
                 filesByFolder[folderName]?.length || 0;
                const isEditing =
                 editingFolderName === folderName;

               return (
                <div
                  key={folderName}
                  onClick={() =>
                    !isEditing &&
                    setActiveFolderView(folderName)
                  }
                  style={folderCardStyle}
                >
                  <div
                    style={{

  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  flex: 1,
  minWidth: 0
 }}
>
 <div style={folderIconWrap}>
  <Folder
    size={23}
    color="#3B82F6"
    fill="#DCEBFF"
  />
 </div>

 {isEditing ? (
   <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      flex: 1
    }}
    onClick={(e) =>
      e.stopPropagation()
    }
   >
    <input
      type="text"
      value={renamedFolderValue}
      onChange={(e) =>
        setRenamedFolderValue(
          e.target.value
        )
      }
      style={{
        ...modalInput,
        padding: '7px 9px',
        fontSize: '13px'
      }}
      autoFocus
    />

   <button
    onClick={(e) =>
     handleRenameFolder(
      folderName,

         e
     )
   }
   style={iconActionBtn}
  >
   <Check
     size={14}
     color="#15803D"
   />
  </button>

  <button
    onClick={(e) => {
      e.stopPropagation();
      setEditingFolderName(null);
    }}
    style={iconActionBtn}
  >
    <X
      size={14}
      color="#EE5D50"
    />
  </button>
 </div>
):(
 <div
  style={{
    minWidth: 0,
    flex: 1
  }}
 >
  <div
    style={{
      fontWeight: '900',
      color: '#0B1A3F',
      fontSize: '15px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }}
  >
    {folderName}
  </div>
  <div style={metaTextStyle}>
    {count}{' '}
    {count === 1 ? 'file' : 'files'}
  </div>

  </div>
 )}
</div>

{!isEditing && (
  <div
   style={{
    display: 'flex',
    alignItems: 'center',
    gap: '5px'
   }}
  >
   <button
    onClick={(e) => {
      e.stopPropagation();
      setEditingFolderName(
        folderName
      );
      setRenamedFolderValue(
        folderName
      );
    }}
    style={iconActionBtn}
    title="Rename folder"
   >
    <Edit2
      size={14}
      color="#3B82F6"
    />
   </button>

  <button
   onClick={(e) =>
     handleDeleteFolder(
       folderName,
       e
     )
   }
   style={iconActionBtn}
   title="Delete folder"
  >
   <Trash2
     size={14}
     color="#EE5D50"
   />
  </button>

          <ChevronRight
           size={18}
           color="#A3AED0"
          />
        </div>
       )}
      </div>
    );
   })}
  </div>
 )
):(
 <div
   style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
   }}
 >
   {(filesByFolder[activeFolderView] || []).length ===
   0?(
    <EmptyState
      text="This folder is empty."
      subtext='Click "Add File" to save a file here.'
    />
   ):(
    filesByFolder[activeFolderView].map((file) => (
      <div key={file.id} style={fileRowStyle}>
        <a
         href={file.file_url}
         target="_blank"
         rel="noreferrer"
         style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flex: 1,
          textDecoration: 'none',
          overflow: 'hidden'
         }}
        >
         <FileText
          size={18}
          color="#0B1A3F"
         />
         <div

           style={{
             overflow: 'hidden',
             textOverflow: 'ellipsis',
             whiteSpace: 'nowrap',
             fontWeight: '800',
             color: '#0B1A3F'
           }}
          >
           {file.file_name}
          </div>

          <ExternalLink
           size={14}
           color="#3B82F6"
           style={{ flexShrink: 0 }}
          />
         </a>

          <button
           onClick={(e) =>
             handleDeleteFile(file.id, e)
           }
           style={iconActionBtn}
          >
           <Trash2
             size={14}
             color="#EE5D50"
           />
          </button>
         </div>
       ))
      )}
    </div>
   )}
 </div>
)}

<div
 style={{
  display: 'flex',
  justifyContent: 'flex-end',
  marginTop: '24px'
 }}
>
 <div
  style={{
    display: 'flex',

       alignItems: 'center',
       gap: '10px',
       flexWrap: 'wrap'
      }}
     >
      <button
       type="button"
       onClick={openEditCourseModal}
       style={editCourseBtnStyle}
      >
       <Edit2 size={16} />
       Edit Course
      </button>

      <button
        onClick={handleDeleteCourse}
        style={deleteCourseBtnStyle}
      >
        <Trash2 size={16} />
        Delete Course
      </button>
     </div>
    </div>

    {/* FILE MODAL */}

    {isModalOpen && (
      <CourseModal
       semesterOptions={semesterOptions}
       semesterMode={semesterMode}
       setSemesterMode={setSemesterMode}
       customSemester={customSemester}
       setCustomSemester={setCustomSemester}
       newCourse={newCourse}
       setNewCourse={setNewCourse}
       handleAddCourse={handleAddCourse}
       handleUpdateCourse={handleUpdateCourse}
       editingCourse={editingCourse}
       setIsModalOpen={setIsModalOpen}
      />
    )}

{isFileModalOpen && (
       <div style={overlayStyle}>
        <div style={modalCardStyle}>
         <div
          style={{

  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  marginBottom: '20px'
 }}
>
 <FolderPlus size={26} color="#0B1A3F" />
 <h3
  style={{
    margin: 0,
    fontWeight: '900',
    color: '#0B1A3F',
    fontSize: '20px'
  }}
 >
  Upload & Organize File
 </h3>
</div>

<form
 onSubmit={uploadFile}
 style={{
  display: 'flex',
  flexDirection: 'column',
  gap: '18px'
 }}
>
 <div>
  <label style={fieldLabel}>
    1. Rename File Title
  </label>

  <input
   type="text"
   required
   placeholder="Enter file display name..."
   value={customFileName}
   onChange={(e) =>
     setCustomFileName(e.target.value)
   }
   style={modalInput}
  />

  <div
   style={{
    fontSize: '11px',
    color: '#64748B',

    marginTop: '5px',
    fontWeight: '600'
  }}
 >
  Original: {selectedFile?.name}
 </div>
</div>

<div>
 <label style={fieldLabel}>
  2. Destination Folder
 </label>

 {existingFolders.length > 0 && (
  <div
   style={{
     display: 'flex',
     gap: '10px',
     marginBottom: '12px'
   }}
  >
   <button
     type="button"
     onClick={() =>
       setFolderMode('existing')
     }
     style={
       folderMode === 'existing'
        ? activeTabBtn
        : inactiveTabBtn
     }
   >
     Existing Folder
   </button>

   <button
    type="button"
    onClick={() => setFolderMode('new')}
    style={
      folderMode === 'new'
       ? activeTabBtn
       : inactiveTabBtn
    }
   >
    + Create New Folder
   </button>
  </div>

 )}

 {folderMode === 'existing' &&
 existingFolders.length > 0 ? (
   <select
    value={selectedFolder}
    onChange={(e) =>
      setSelectedFolder(e.target.value)
    }
    style={modalInput}
   >
    {existingFolders.map((folder) => (
      <option key={folder} value={folder}>
       {folder}
      </option>
    ))}
   </select>
 ):(
   <input
    type="text"
    required
    placeholder="e.g. Lecture Notes, Midterms, Lab Work..."
    value={newFolderName}
    onChange={(e) =>
      setNewFolderName(e.target.value)
    }
    style={modalInput}
   />
 )}
</div>

<button
 type="submit"
 disabled={uploading}
 style={saveBtnStyle}
>
 {uploading ? (
  <RefreshCw
    className="animate-spin"
    size={18}
    style={{ margin: '0 auto' }}
  />
 ):(
  'Save to Folder'
 )}
</button>

            <button
              type="button"
              onClick={() => {
               setIsFileModalOpen(false);
               setSelectedFile(null);
              }}
              style={cancelBtnStyle}
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

const dashboardItems = (() => {
 if (!dashboardView) return [];

    if (dashboardView === 'courses') {
      return courses.map((course) => ({
        id: course.id,
        type: 'course',
        title: course.name,
        subtitle: [
          courseSemester(course),
          course.professor ? `Prof. ${course.professor}` : '',
          course.days || ''
        ]
          .filter(Boolean)
          .join(' • '),
        course
      }));
    }

    if (dashboardView === 'assignments') {
      return courseAssignments
        .filter((assignment) => !assignment.completed)
        .map((assignment) => {
          const course = courses.find(
            (item) => item.id === assignment.courseId
          );

       return {

        id: assignment.id,
        type: 'assignment',
        title: assignment.title,
        subtitle: [
          course?.name || 'Course',
          assignment.due
            ? `Due ${formatDate(assignment.due)}`
            : 'No due date'
        ]
          .filter(Boolean)
          .join(' • '),
        assignment,
        course
     };
    });
}

if (dashboardView === 'upcoming') {
  return courseEvents
    .filter((event) => {
      if (!event.date || event.completed) return false;
      return (
        new Date(`${event.date}T00:00:00`) >= todayStart()
      );
    })
    .map((event) => {
      const course = courses.find(
        (item) => item.id === event.courseId
      );

     return {
        id: event.id,
        type: 'upcoming',
        title: event.title,
        subtitle: [
          course?.name || 'Course',
          event.type || 'Upcoming',
          event.date ? formatDate(event.date) : ''
        ]
          .filter(Boolean)
          .join(' • '),
        event,
        course
     };
    });
}

 if (dashboardView === 'resources') {
   return allResources.map((resource) => {
     const course = courses.find(
       (item) => item.id === resource.course_id
     );

      return {
         id: resource.id,
         type: 'resource',
         title: resource.file_name,
         subtitle: [
           course?.name || 'Course',
           resource.folder_name || 'Resources'
         ]
           .filter(Boolean)
           .join(' • '),
         resource,
         course
      };
     });
 }

 if (dashboardView === 'credits') {
   return courses.map((course) => ({
     id: course.id,
     type: 'credit',
     title: course.name,
     subtitle: [
       courseSemester(course),
       `${Math.max(0, Number(courseCredits[course.id]) || 0)} ${
         Math.max(0, Number(courseCredits[course.id]) || 0) === 1
           ? 'credit'
           : 'credits'
       }`
     ].join(' • '),
     course
   }));
 }

 return [];
})();

const dashboardViewMeta = {
 courses: {
   title: 'All Courses',
   subtitle: 'Every course across all semesters.',
   icon: <BookOpen size={21} />,
   accent: '#8B78B8',
   bg: '#F7F4FC'
 },
 assignments: {
   title: 'All Assignments',
   subtitle: 'Every active assignment across your courses.',
   icon: <ClipboardCheck size={21} />,
   accent: '#648CCB',
   bg: '#F3F7FD'
 },
 upcoming: {
   title: 'All Upcoming',
   subtitle: 'Every upcoming exam, quiz, project, and event.',
   icon: <Clock3 size={21} />,
   accent: '#D9896A',
   bg: '#FFF6F2'

  },
  resources: {
    title: 'All Resources',
    subtitle: 'Every uploaded course resource.',
    icon: <FolderOpen size={21} />,
    accent: '#5E9A8B',
    bg: '#F2F9F7'
  },
  credits: {
    title: 'Credits',
    subtitle: 'Credits added across all of your courses.',
    icon: <GraduationCap size={21} />,
    accent: '#C99758',
    bg: '#FFF9F1'
  }
};

// =========================================================
// MAIN COURSES PAGE
// =========================================================

return (
 <div
   style={{
     width: '100%',
     maxWidth: '1250px',
     margin: '0 auto'
   }}
 >
   {/* HEADER */}
   <div
     style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '34px',
      gap: '20px',
      flexWrap: 'wrap'
     }}
   >
     <div>
      <h1
        style={{
         fontSize: '48px',
         fontWeight: '900',
         color: '#0B1A3F',
         margin: 0
        }}
      >
        Courses
      </h1>

     <p
      style={{

     margin: '8px 0 0',
     color: '#7C8AB8',
     fontWeight: '700',
     fontSize: '15px'
   }}
  >
   Organize every semester, course, assignment, exam,
   note, and resource in one place.
  </p>
 </div>

 <button
  onClick={openAddCourseModal}
  style={addBtnStyle}
 >
  <Plus size={20} strokeWidth={3} />
  <span>Add Course</span>
 </button>
</div>

{/* STATS */}
<div style={statsGridStyle}>
  <StatCard
   icon={<BookOpen size={24} />}
   label="Total Courses"
   value={courses.length}
   bg="#F7F4FC"
   iconColor="#8B78B8"
   active={dashboardView === 'courses'}
   onClick={() =>
     setDashboardView((current) =>
       current === 'courses' ? null : 'courses'
     )
   }
  />

 <StatCard
  icon={<ClipboardCheck size={24} />}
  label="Assignments"
  value={activeAssignments}
  bg="#F3F7FD"
  iconColor="#648CCB"
  helper={
    completedAssignments > 0
     ? `${completedAssignments} completed`
     : ''
  }

  active={dashboardView === 'assignments'}
  onClick={() =>
    setDashboardView((current) =>
      current === 'assignments'
       ? null
       : 'assignments'
    )
  }
 />

 <StatCard
  icon={<Clock3 size={24} />}
  label="Upcoming"
  value={upcomingEventsCount}
  bg="#FFF6F2"
  iconColor="#D9896A"
  active={dashboardView === 'upcoming'}
  onClick={() =>
    setDashboardView((current) =>
      current === 'upcoming' ? null : 'upcoming'
    )
  }
 />

 <StatCard
  icon={<FolderOpen size={24} />}
  label="Resources"
  value={allResources.length}
  bg="#F2F9F7"
  iconColor="#5E9A8B"
  active={dashboardView === 'resources'}
  onClick={() =>
    setDashboardView((current) =>
      current === 'resources' ? null : 'resources'
    )
  }
 />

 <StatCard
  icon={<GraduationCap size={24} />}
  label="Credits"
  value={totalCredits}
  bg="#FFF9F1"
  iconColor="#C99758"
  active={dashboardView === 'credits'}
  onClick={() =>
    setDashboardView((current) =>
      current === 'credits' ? null : 'credits'
    )
  }
 />
</div>

{dashboardView && (
 <div style={dashboardDetailCardStyle}>
  <div style={dashboardDetailHeaderStyle}>
   <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',

   minWidth: 0
  }}
 >
  <div
   style={{
     ...dashboardDetailIconStyle,
     background:
       dashboardViewMeta[dashboardView].bg,
     color:
       dashboardViewMeta[dashboardView].accent
   }}
  >
   {dashboardViewMeta[dashboardView].icon}
  </div>

  <div style={{ minWidth: 0 }}>
   <h3 style={dashboardDetailTitleStyle}>
     {dashboardViewMeta[dashboardView].title}
   </h3>
   <div style={dashboardDetailSubtitleStyle}>
     {dashboardViewMeta[dashboardView].subtitle}
   </div>
  </div>
 </div>

 <button
  type="button"
  onClick={() => setDashboardView(null)}
  style={dashboardCloseBtnStyle}
 >
  <X size={17} />
 </button>
</div>

{dashboardItems.length === 0 ? (
 <div style={dashboardEmptyStyle}>
  Nothing here yet.
 </div>
):(
 <div style={dashboardItemsGridStyle}>
  {dashboardItems.map((item) => (
    <div
     key={`${item.type}-${item.id}`}
     style={dashboardItemStyle}
     onClick={() => {
      if (item.course) {
        openCourse(item.course);

       if (item.type === 'assignment') {
         setWorkspaceTab('assignments');
       } else if (item.type === 'upcoming') {
         setWorkspaceTab('upcoming');
       } else if (item.type === 'resource') {
         setWorkspaceTab('resources');
       }
     }
    }}
   >
    <div
     style={{
       minWidth: 0,
       flex: 1
     }}
    >
     <div style={dashboardItemTitleStyle}>
       {item.title}
     </div>
     <div style={dashboardItemSubtitleStyle}>
       {item.subtitle}
     </div>
    </div>

      {item.type === 'resource' ? (
        <a
         href={item.resource.file_url}
         target="_blank"
         rel="noreferrer"
         onClick={(event) =>
           event.stopPropagation()
         }
         style={dashboardOpenFileBtnStyle}
        >
         <ExternalLink size={15} />
        </a>
      ):(
        <ChevronRight
         size={18}
         color="#A3AED0"
        />
      )}
    </div>
   ))}
 </div>
)}

 </div>
)}

{/* SEARCH / FILTER */}
<div style={searchFilterGrid}>
  <div style={searchBoxStyle}>
   <Search size={21} color="#95A4C7" />

  <input
   type="text"
   placeholder="Search courses, professors, semesters..."
   value={searchTerm}
   onChange={(e) => setSearchTerm(e.target.value)}
   style={searchInputStyle}
  />

  {searchTerm && (
   <button
     type="button"
     onClick={() => setSearchTerm('')}
     style={clearSearchBtn}
   >
     <X size={16} />
   </button>
  )}
 </div>

 <select
  value={semesterFilter}
  onChange={(e) => setSemesterFilter(e.target.value)}
  style={semesterFilterStyle}
 >
  <option>All Semesters</option>
  {semesterOptions.map((semester) => (
    <option key={semester} value={semester}>
     {semester}
    </option>
  ))}
 </select>
</div>

{/* CONTENT */}
{loading ? (
  <div style={loadingWrap}>
   <RefreshCw
    className="animate-spin"
    size={28}

     color="#0B1A3F"
    />
  </div>
) : courses.length === 0 ? (
  <div style={emptyCoursesCard}>
    <div style={{ textAlign: 'center', maxWidth: '430px' }}>
     <div style={emptyIconCircle}>
       <GraduationCap size={46} color="#0B1A3F" />
     </div>

   <h2 style={emptyCoursesTitle}>No courses yet</h2>

   <p style={emptyCoursesText}>
    Start by choosing a semester, then create your first
    course workspace.
   </p>

     <button
      type="button"
      onClick={openAddCourseModal}
      style={addBtnStyle}
     >
      <Plus size={19} strokeWidth={3} />
      Add Course
     </button>
    </div>
  </div>
) : semesterOptions.length === 0 ? (
  <div style={emptyCoursesCard}>
    <div style={{ textAlign: 'center', maxWidth: '430px' }}>
     <div style={emptyIconCircle}>
      <GraduationCap size={46} color="#0B1A3F" />
     </div>

   <h2 style={emptyCoursesTitle}>No semesters yet</h2>

   <p style={emptyCoursesText}>
    Create your first semester, then add courses inside it.
   </p>

   <button
    type="button"
    onClick={openAddCourseModal}
    style={addBtnStyle}
   >
    <Plus size={19} strokeWidth={3} />
    Add Course

    </button>
  </div>
 </div>
):(
 <div
  style={{
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fill, minmax(330px, 1fr))',
    gap: '20px'
  }}
 >
  {semesterOptions
    .filter((semester) => {
      if (
        semesterFilter !== 'All Semesters' &&
        semester !== semesterFilter
      ){
        return false;
      }

     const term = searchTerm.trim().toLowerCase();
     if (!term) return true;

     const semesterCourses = courses.filter(
       (course) => courseSemester(course) === semester
     );

    return (
      semester.toLowerCase().includes(term) ||
      semesterCourses.some(
        (course) =>
         course.name?.toLowerCase().includes(term) ||
         course.professor?.toLowerCase().includes(term)
      )
    );
   })
   .map((semester) => {
    const semesterCourses = courses.filter(
      (course) => courseSemester(course) === semester
    );

     const ids = new Set(
       semesterCourses.map((course) => course.id)
     );

     const assignmentCount = courseAssignments.filter(

  (assignment) =>
   ids.has(assignment.courseId) &&
   !assignment.completed
).length;

const upcomingCount = courseEvents.filter((event) => {
 if (
   !ids.has(event.courseId) ||
   !event.date ||
   event.completed
 ){
   return false;
 }

 return (
   new Date(`${event.date}T00:00:00`) >= todayStart()
 );
}).length;

const resourceCount = allResources.filter(
  (resource) => ids.has(resource.course_id)
).length;

const creditCount = semesterCourses.reduce(
  (sum, course) =>
   sum + Math.max(0, Number(courseCredits[course.id]) || 0),
  0
);

return (
 <button
   key={semester}
   type="button"
   onClick={() => {
    setSelectedSemester(semester);
    setSearchTerm('');
   }}
   style={semesterFolderCardStyle}
 >
   <div style={semesterFolderTopStyle}>
    <div style={semesterFolderIconStyle}>
      <CalendarDays size={23} color="#0B1A3F" />
    </div>

   <div
    style={{
     display: 'flex',
     alignItems: 'center',
     gap: '5px'
    }}
   >
    <span
     role="button"

   tabIndex={0}
   title="Edit semester"
   onClick={(event) =>
     openEditSemester(semester, event)
   }
   onKeyDown={(event) => {
     if (event.key === 'Enter' || event.key === ' ') {
       event.preventDefault();
       event.stopPropagation();
       openEditSemester(semester);
     }
   }}
   style={semesterEditIconStyle}
  >
   <Edit2 size={14} />
  </span>

  <span
   role="button"
   tabIndex={0}
   title="Delete semester"
   onClick={(event) => {
     event.stopPropagation();
     handleDeleteSemester(semester);
   }}
   onKeyDown={(event) => {
     if (event.key === 'Enter' || event.key === ' ') {
       event.preventDefault();
       event.stopPropagation();
       handleDeleteSemester(semester);
     }
   }}
   style={semesterDeleteIconStyle}
  >
   <Trash2 size={14} />
  </span>

  <ChevronRight size={22} color="#9AA7C6" />
 </div>
</div>

<div style={semesterFolderTitleStyle}>
 {semester}
</div>

<div style={semesterFolderSubtitleStyle}>
 {semesterCourses.length}{' '}

        {semesterCourses.length === 1
         ? 'course'
         : 'courses'}
       </div>

        <div style={semesterFolderStatsStyle}>
         <SemesterMiniCount
          label="Assignments"
          value={assignmentCount}
          color="#648CCB"
          bg="#F3F7FD"
         />
         <SemesterMiniCount
          label="Upcoming"
          value={upcomingCount}
          color="#D9896A"
          bg="#FFF6F2"
         />
         <SemesterMiniCount
          label="Resources"
          value={resourceCount}
          color="#5E9A8B"
          bg="#F2F9F7"
         />
         <SemesterMiniCount
          label="Credits"
          value={creditCount}
          color="#C99758"
          bg="#FFF9F1"
         />
        </div>
       </button>
     );
   })}
 </div>
)}


{editingSemesterName && (
 <EditSemesterModal
   value={editedSemesterValue}
   setValue={setEditedSemesterValue}
   onSave={saveEditedSemester}
   onClose={closeEditSemester}
 />
)}

{/* ADD COURSE MODAL */}
{isModalOpen && (
  <CourseModal
   semesterOptions={semesterOptions}
   semesterMode={semesterMode}
   setSemesterMode={setSemesterMode}

          customSemester={customSemester}
          setCustomSemester={setCustomSemester}
          newCourse={newCourse}
          setNewCourse={setNewCourse}
          handleAddCourse={handleAddCourse}
          handleUpdateCourse={handleUpdateCourse}
          editingCourse={editingCourse}
          setIsModalOpen={setIsModalOpen}
        />
       )}
      </div>
    );
}

// =========================================================
// SMALL COMPONENTS
// =========================================================




function EditSemesterModal({
 value,
 setValue,
 onSave,
 onClose
}) {
 return (
   <div style={overlayStyle}>
     <div style={semesterEditModalStyle}>
      <div style={semesterEditModalHeaderStyle}>
       <div>
        <h2 style={semesterEditModalTitleStyle}>
          Edit Semester
        </h2>
        <p style={semesterEditModalSubtitleStyle}>
          Rename this semester everywhere it appears.
        </p>
       </div>

        <button
         type="button"
         onClick={onClose}
         style={modalCloseButton}
        >
         <X size={18} />
        </button>
       </div>

       <div>
        <label style={fieldLabel}>Semester Name</label>

        <input
         autoFocus
         type="text"
         value={value}
         onChange={(event) => setValue(event.target.value)}
         onKeyDown={(event) => {
           if (event.key === 'Enter') {
             event.preventDefault();
             onSave();
           }
         }}
         style={modalInput}
         placeholder="e.g. Fall 2026-2027"
        />
       </div>

       <div style={semesterEditActionsStyle}>
        <button
         type="button"
         onClick={onClose}
         style={semesterEditCancelBtnStyle}
        >
         Cancel
        </button>

          <button
           type="button"
           onClick={onSave}
           style={semesterEditSaveBtnStyle}
          >
           Save Changes
          </button>
        </div>
       </div>
      </div>
    );
}

function CourseModal({
 semesterOptions,
 semesterMode,
 setSemesterMode,
 customSemester,

 setCustomSemester,
 newCourse,
 setNewCourse,
 handleAddCourse,
 handleUpdateCourse,
 editingCourse,
 setIsModalOpen
}) {
 const hasExistingSemester = semesterOptions.length > 0;

 return (
  <div style={overlayStyle}>
    <div style={modalCardStyle}>
     <div
      style={{
       display: 'flex',
       justifyContent: 'space-between',
       alignItems: 'center',
       gap: '12px',
       marginBottom: '24px'
      }}
     >
      <div>
       <h2
         style={{
          margin: 0,
          fontWeight: '900',
          color: '#0B1A3F',
          fontSize: '24px'
         }}
       >
         {editingCourse ? 'Edit Course' : 'Add Course'}
       </h2>

      <p
       style={{
         margin: '5px 0 0',
         color: '#8A98B8',
         fontWeight: '700',
         fontSize: '13px'
       }}
      >
       {editingCourse
         ? 'Update the course details and synced Planner schedule.'
         : 'Choose an existing semester or create a new one.'}
      </p>
     </div>

 <button
  type="button"
  onClick={() => {
    setIsModalOpen(false);
    setEditingCourse(null);
  }}
  style={modalCloseButton}
 >
  <X size={18} />
 </button>
</div>

<form
 onSubmit={editingCourse ? handleUpdateCourse : handleAddCourse}
 style={{
  display: 'flex',
  flexDirection: 'column',
  gap: '18px'
 }}
>
 <div style={modalSectionStyle}>
  <div style={stepTitleStyle}>
    <span style={stepBubble}>1</span>
    Semester
  </div>

  {hasExistingSemester ? (
   <>
    <div
     style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '10px',
      marginBottom: '12px'
     }}
    >
     <button
      type="button"
      onClick={() => setSemesterMode('existing')}
      style={
        semesterMode === 'existing'
         ? activeTabBtn
         : inactiveTabBtn
      }
     >
      Existing Semester

 </button>

 <button
  type="button"
  onClick={() => setSemesterMode('new')}
  style={
    semesterMode === 'new'
     ? activeTabBtn
     : inactiveTabBtn
  }
 >
  + Create New
 </button>
</div>

{semesterMode === 'existing' ? (
 <select
  value={
    newCourse.semester ||
    semesterOptions[0] ||
    ''
  }
  onChange={(e) =>
    setNewCourse({
      ...newCourse,
      semester: e.target.value
    })
  }
  style={modalInput}
 >
  {semesterOptions.map((semester) => (
    <option key={semester} value={semester}>
      {semester}
    </option>
  ))}
 </select>
):(
 <input
  type="text"
  placeholder="e.g. Fall 2026-2027"
  value={customSemester}
  onChange={(e) =>
    setCustomSemester(e.target.value)
  }
  style={modalInput}
  required
 />

   )}
  </>
 ):(
  <>
   <div
     style={{
       fontSize: '12px',
       color: '#7D8BAA',
       fontWeight: '800',
       marginBottom: '10px'
     }}
   >
     You do not have any semesters yet. Create your
     first one below.
   </div>

    <input
     type="text"
     placeholder="e.g. Fall 2026-2027"
     value={customSemester}
     onChange={(e) =>
       setCustomSemester(e.target.value)
     }
     style={modalInput}
     required
    />
  </>
 )}
</div>

<div style={modalSectionStyle}>
 <div style={stepTitleStyle}>
  <span style={stepBubble}>2</span>
  Course Details
 </div>

 <div
  style={{
   display: 'flex',
   flexDirection: 'column',
   gap: '13px'
  }}
 >
  <div>
   <label style={fieldLabel}>Course Name</label>
   <input
     type="text"

  placeholder="e.g. MECH 310"
  required
  style={modalInput}
  value={newCourse.name}
  onChange={(e) =>
    setNewCourse({
     ...newCourse,
     name: e.target.value
    })
  }
 />
</div>

<div>
 <label style={fieldLabel}>
  Professor Name
 </label>
 <input
  type="text"
  placeholder="e.g. Dr. Smith"
  style={modalInput}
  value={newCourse.professor}
  onChange={(e) =>
    setNewCourse({
     ...newCourse,
     professor: e.target.value
    })
  }
 />
</div>

<div>
 <label style={fieldLabel}>
  Credits
 </label>
 <input
  type="number"
  min="0"
  step="0.5"
  placeholder="e.g. 3"
  style={modalInput}
  value={newCourse.credits ?? ''}
  onChange={(e) =>
    setNewCourse({
     ...newCourse,
     credits: e.target.value
    })
  }
 />
 <div
  style={{
   marginTop: '5px',
   color: '#8A98B8',
   fontSize: '10px',
   fontWeight: '700'
  }}
 >
  These credits are added to your semester and overall total automatically.
 </div>
</div>

<div>
 <label style={fieldLabel}>
  Schedule / Days
 </label>
 <select
  value={newCourse.days}
  onChange={(e) =>
    setNewCourse({
     ...newCourse,
     days: e.target.value
    })
  }
  style={modalInput}
 >
  <option value="MWF">MWF</option>
  <option value="TTH">TTH</option>

  <option value="MW">MW</option>
  <option value="T">Tuesday</option>
  <option value="W">Wednesday</option>
  <option value="TH">Thursday</option>
  <option value="Lab">Lab</option>
  <option value="None">None / Online</option>
 </select>
</div>

{newCourse.days !== 'None' &&
 newCourse.days !== 'Lab' && (
  <div
   style={{
    background: '#F6F8FC',
    border: '1px solid #E4EAF2',
    borderRadius: '14px',
    padding: '13px'
   }}
  >
   <div
    style={{
      fontSize: '11px',
      fontWeight: '900',
      color: '#0B1A3F',
      marginBottom: '10px'
    }}
   >
    Sync Class Schedule to Planner
   </div>

   <div
    style={{
     display: 'grid',
     gridTemplateColumns: '1fr 1fr',
     gap: '10px'
    }}
   >
    <div>
     <label style={fieldLabel}>
       First Class Date
     </label>
     <input
       type="date"
       value={newCourse.class_start_date}
       onChange={(e) =>
        setNewCourse({
          ...newCourse,

    class_start_date: e.target.value
   })
  }
  style={modalInput}
 />
</div>

<div>
 <label style={fieldLabel}>
  Last Class Date
 </label>
 <input
  type="date"
  min={newCourse.class_start_date}
  value={newCourse.class_end_date}
  onChange={(e) =>
    setNewCourse({
     ...newCourse,
     class_end_date: e.target.value
    })
  }
  style={modalInput}
 />
</div>

<div>
 <label style={fieldLabel}>Start Time</label>
 <input
  type="time"
  value={newCourse.class_start_time}
  onChange={(e) =>
    setNewCourse({
     ...newCourse,
     class_start_time: e.target.value
    })
  }
  style={modalInput}
 />
</div>

<div>
 <label style={fieldLabel}>End Time</label>
 <input
  type="time"
  value={newCourse.class_end_time}
  onChange={(e) =>
   setNewCourse({

            ...newCourse,
            class_end_time: e.target.value
           })
          }
          style={modalInput}
        />
       </div>
      </div>

       <div
        style={{
         marginTop: '9px',
         fontSize: '10px',
         fontWeight: '700',
         color: '#8A98B8',
         lineHeight: 1.4
        }}
       >
        Fill these in and the {newCourse.days} class
        schedule will be created in Planner automatically.
       </div>
     </div>
    )}
 </div>
</div>

<div style={modalSectionStyle}>
 <div style={stepTitleStyle}>
  <span style={stepBubble}>3</span>
  Course Color
 </div>

 <div style={colorGridStyle}>
  {COURSE_COLORS.map((color) => (
   <button
    key={color.bg}
    type="button"
    aria-label={`Choose ${color.name}`}
    title={color.name}
    onClick={() =>
      setNewCourse({
        ...newCourse,
        color: color.bg
      })
    }
    style={{
      ...colorCircleStyle,

      background: color.bg,
      boxShadow:
        newCourse.color === color.bg
         ? '0 0 0 3px #FFFFFF, 0 0 0 5px #0B1A3F'
         : 'none'
     }}
   />
  ))}
 </div>

 <div style={customColorRow}>
  <div>
   <div
    style={{
      fontSize: '13px',
      fontWeight: '900',
      color: '#0B1A3F'
    }}
   >
    + Custom Color
   </div>
   <div
    style={{
      fontSize: '11px',
      color: '#8A98B8',
      fontWeight: '700',
      marginTop: '2px'
    }}
   >
    Pick any shade you want.
   </div>
  </div>

  <input
    type="color"
    value={newCourse.color}
    onChange={(e) =>
      setNewCourse({
       ...newCourse,
       color: e.target.value
      })
    }
    style={customColorInput}
  />
 </div>
</div>

        <button type="submit" style={saveBtnStyle}>
         {editingCourse
          ? 'Save Course Changes'
          : 'Create Course Workspace'}
        </button>

          <button
           type="button"
           onClick={() => {
            setIsModalOpen(false);
            setEditingCourse(null);
           }}
           style={cancelBtnStyle}
          >
           Cancel
          </button>
        </form>
       </div>
      </div>
    );
}

function StatCard({
 icon,
 label,
 value,
 bg,
 iconColor,
 helper = '',
 onClick,
 active = false
}) {
 return (
   <button
     type="button"
     onClick={onClick}
     disabled={!onClick}
     style={{
      ...statCardStyle,
      cursor: onClick ? 'pointer' : 'default',
      textAlign: 'left',
      width: '100%',
      fontFamily: 'inherit',
      outline: 'none',
      boxShadow: active
        ? `0 0 0 2px ${iconColor}, 0 12px 28px rgba(11,26,63,0.07)`

        : statCardStyle.boxShadow
      }}
     >
      <div
       style={{
         ...statIconStyle,
         background: bg,
         color: iconColor
       }}
      >
       {icon}
      </div>

       <div>
        <div style={statValueStyle}>{value}</div>
        <div style={statLabelStyle}>{label}</div>
        {helper && (
         <div style={statHelperStyle}>{helper}</div>
        )}
       </div>
      </button>
    );
}

function MiniStat({ label, value, icon }) {
  return (
    <div style={miniStatCardStyle}>
     <div style={miniStatIconStyle}>{icon}</div>
     <div>
      <div style={miniStatValueStyle}>{value}</div>
      <div style={miniStatLabelStyle}>{label}</div>
     </div>
    </div>
  );
}

function CourseCount({
 label,
 value,
 color = '#0B1A3F',
 muted = '#8997B8',
 bg = '#F7F9FC'
}) {
 return (
   <div
     style={{
      ...courseCountItem,

        color: muted,
        background: bg
       }}
      >
       <strong
        style={{
          color,
          fontSize: '16px',
          lineHeight: 1
        }}
       >
        {value}
       </strong>
       <span
        style={{
          marginTop: '7px',
          lineHeight: 1.15
        }}
       >
        {label}
       </span>
      </div>
    );
}

function SemesterMiniCount({
 label,
 value,
 color,
 bg
}) {
 return (
   <div
     style={{
      ...semesterMiniCountStyle,
      background: bg
     }}
   >
     <strong
      style={{
        color,
        fontSize: '16px',
        lineHeight: 1
      }}
     >
      {value}
     </strong>

       <span
        style={{
          color,
          marginTop: '7px',
          fontSize: '10px',
          fontWeight: '900',
          lineHeight: 1.15
        }}
       >
        {label}
       </span>
      </div>
    );
}

function AlertOption({ icon, title, text, active, onClick, accent, soft }) {
 return (
  <button
   type="button"
   onClick={onClick}
   style={{
    border: `1.5px solid ${active ? accent : '#E5EAF2'}`,
    background: active ? accent : soft,
    color: active ? '#FFFFFF' : accent,
    borderRadius: '14px',
    padding: '12px 13px',
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: active ? `0 6px 15px ${accent}24` : 'none'
   }}
  >
   <span style={{ display: 'flex', flexShrink: 0 }}>{icon}</span>
   <span style={{ minWidth: 0 }}>
    <strong style={{ display: 'block', fontSize: '12px', fontWeight: '900' }}>{title}</strong>
    <span style={{ display: 'block', marginTop: '2px', fontSize: '10px', lineHeight: 1.35, opacity: active ? 0.82 : 0.72 }}>{text}</span>
   </span>
  </button>
 );
}

function MiniAlertBadge({ icon, label }) {
 return (
  <span style={{
   display: 'inline-flex', alignItems: 'center', gap: '4px',
   padding: '3px 7px', borderRadius: '999px', background: '#F4F7FE',
   color: '#64748B', fontSize: '9px', fontWeight: '850'
  }}>
   {icon}{label}
  </span>
 );
}

function EmptyState({ text, subtext }) {
 return (
  <div style={emptyStateStyle}>
    <div
     style={{
       fontWeight: '900',
       color: '#0B1A3F',
       fontSize: '15px'
     }}
    >
     {text}
    </div>

       {subtext && (
        <div
          style={{
           color: '#95A2BF',
           fontSize: '13px',
           fontWeight: '700',
           marginTop: '5px',
           lineHeight: 1.5
          }}
        >
          {subtext}
        </div>
       )}
      </div>
    );
}

// =========================================================
// STYLES

// =========================================================




const editSemesterBtnStyle = {
  background: '#F2F6FC',
  color: '#0B1A3F',
  border: '1.5px solid #DDE4EF',
  padding: '11px 14px',
  borderRadius: '13px',
  fontWeight: '900',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '7px',
  fontSize: '12px'
};

const semesterEditIconStyle = {
  width: '30px',
  height: '30px',
  borderRadius: '9px',
  background: '#F2F6FC',
  color: '#3B82F6',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  flexShrink: 0
};

const semesterEditModalStyle = {
  width: '100%',
  maxWidth: '430px',
  background: '#FFFFFF',
  border: '1.5px solid #DDE4EF',
  borderRadius: '24px',
  padding: '26px',
  boxShadow: '0 25px 70px rgba(11,26,63,0.18)'
};

const semesterEditModalHeaderStyle = {
 display: 'flex',
 justifyContent: 'space-between',
 alignItems: 'flex-start',
 gap: '14px',

  marginBottom: '20px'
};

const semesterEditModalTitleStyle = {
  margin: 0,
  color: '#0B1A3F',
  fontSize: '22px',
  fontWeight: '900'
};

const semesterEditModalSubtitleStyle = {
  margin: '5px 0 0',
  color: '#8A98B8',
  fontSize: '12px',
  fontWeight: '700'
};

const semesterEditActionsStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '10px',
  marginTop: '20px'
};

const semesterEditCancelBtnStyle = {
  background: '#F3F6FA',
  color: '#64748B',
  border: 'none',
  borderRadius: '11px',
  padding: '10px 15px',
  fontSize: '12px',
  fontWeight: '900',
  cursor: 'pointer'
};

const semesterEditSaveBtnStyle = {
  background: '#0B1A3F',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '11px',
  padding: '10px 15px',
  fontSize: '12px',
  fontWeight: '900',
  cursor: 'pointer'
};

const deleteSemesterBtnStyle = {

  background: '#FFFFFF',
  color: '#D84C41',
  border: '1.5px solid #F2C7C2',
  padding: '11px 14px',
  borderRadius: '13px',
  fontWeight: '900',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '7px',
  fontSize: '12px'
};

const semesterDeleteIconStyle = {
  width: '30px',
  height: '30px',
  borderRadius: '9px',
  background: '#FFF3F1',
  color: '#D84C41',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  flexShrink: 0
};

const panelHeaderRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '12px',
  flexWrap: 'wrap'
};

const clearAllBtnStyle = {
 background: '#FFF5F4',
 color: '#D84C41',
 border: '1px solid #F3D3CF',
 borderRadius: '10px',
 padding: '7px 10px',
 fontSize: '11px',
 fontWeight: '900',
 cursor: 'pointer',
 display: 'inline-flex',
 alignItems: 'center',
 justifyContent: 'center',

  gap: '5px',
  fontFamily: 'inherit'
};

const addBtnStyle = {
  background: '#0B1A3F',
  color: '#FFFFFF',
  border: 'none',
  padding: '14px 24px',
  borderRadius: '16px',
  fontWeight: '900',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '9px',
  fontSize: '15px',
  boxShadow: '0 10px 22px rgba(11, 26, 63, 0.14)'
};

const statsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
  gap: '18px',
  marginBottom: '24px'
};

const statCardStyle = {
  background: '#FFFFFF',
  border: '1.5px solid #EDF1F7',
  appearance: 'none',
  borderRadius: '20px',
  padding: '19px',
  display: 'flex',
  alignItems: 'center',
  gap: '15px',
  minHeight: '92px',
  boxShadow: '0 10px 25px rgba(11, 26, 63, 0.04)'
};

const statIconStyle = {
 width: '50px',
 height: '50px',
 borderRadius: '15px',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',

  flexShrink: 0
};

const statValueStyle = {
  color: '#0B1A3F',
  fontSize: '24px',
  fontWeight: '900',
  lineHeight: 1,
  marginBottom: '6px'
};

const statLabelStyle = {
  color: '#7180AA',
  fontSize: '13px',
  fontWeight: '800'
};

const statHelperStyle = {
  color: '#9AA6C1',
  fontSize: '10px',
  fontWeight: '800',
  marginTop: '3px'
};


const dashboardDetailCardStyle = {
  background: '#FFFFFF',
  border: '1.5px solid #E7EBF4',
  borderRadius: '22px',
  padding: '20px',
  marginBottom: '24px',
  boxShadow: '0 10px 28px rgba(11,26,63,0.04)'
};

const dashboardDetailHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '14px',
  marginBottom: '16px'
};

const dashboardDetailIconStyle = {
 width: '42px',
 height: '42px',
 borderRadius: '13px',
 display: 'flex',

  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0
};

const dashboardDetailTitleStyle = {
  margin: 0,
  color: '#0B1A3F',
  fontSize: '17px',
  fontWeight: '900'
};

const dashboardDetailSubtitleStyle = {
  marginTop: '3px',
  color: '#8A98B8',
  fontSize: '12px',
  fontWeight: '700'
};

const dashboardCloseBtnStyle = {
  width: '34px',
  height: '34px',
  borderRadius: '10px',
  border: 'none',
  background: '#F3F6FA',
  color: '#64748B',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0
};

const dashboardItemsGridStyle = {
  display: 'grid',
  gridTemplateColumns:
   'repeat(auto-fill, minmax(260px, 1fr))',
  gap: '10px'
};

const dashboardItemStyle = {
 display: 'flex',
 alignItems: 'center',
 gap: '10px',
 padding: '13px 14px',
 background: '#FAFBFD',
 border: '1px solid #E8EDF5',

  borderRadius: '14px',
  cursor: 'pointer',
  minWidth: 0
};

const dashboardItemTitleStyle = {
  color: '#0B1A3F',
  fontSize: '13px',
  fontWeight: '900',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
};

const dashboardItemSubtitleStyle = {
  color: '#8A98B8',
  fontSize: '11px',
  fontWeight: '700',
  marginTop: '4px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
};

const dashboardOpenFileBtnStyle = {
  width: '32px',
  height: '32px',
  borderRadius: '9px',
  background: '#E8F2FF',
  color: '#3B82F6',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  textDecoration: 'none'
};

const dashboardEmptyStyle = {
  padding: '30px 15px',
  textAlign: 'center',
  color: '#97A4BF',
  fontSize: '13px',
  fontWeight: '800'
};

const searchFilterGrid = {
 display: 'grid',

  gridTemplateColumns: '1fr 275px',
  gap: '18px',
  marginBottom: '26px'
};

const searchBoxStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  background: '#FFFFFF',
  border: '1.5px solid #E2E8F0',
  borderRadius: '18px',
  padding: '0 17px',
  minHeight: '58px'
};

const searchInputStyle = {
  border: 'none',
  outline: 'none',
  width: '100%',
  fontSize: '15px',
  fontWeight: '700',
  color: '#0B1A3F',
  background: 'transparent'
};

const clearSearchBtn = {
  border: 'none',
  background: '#F1F5F9',
  width: '30px',
  height: '30px',
  borderRadius: '9px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  color: '#64748B'
};

const semesterFilterStyle = {
 width: '100%',
 minHeight: '58px',
 padding: '0 42px 0 18px',
 borderRadius: '24px',
 border: '1.5px solid #E2E8F0',
 background: '#FFFFFF',
 color: '#0B1A3F',

  fontWeight: '800',
  fontSize: '14px',
  outline: 'none',
  textAlign: 'center',
  textAlignLast: 'center'
};

const loadingWrap = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '360px'
};

const emptyCoursesCard = {
  background: '#FFFFFF',
  border: '1.5px solid #E7EBF4',
  borderRadius: '26px',
  minHeight: '400px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '40px',
  boxShadow: '0 16px 40px rgba(11, 26, 63, 0.05)'
};

const emptyIconCircle = {
  width: '94px',
  height: '94px',
  borderRadius: '50%',
  background: '#DCEBFF',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 22px'
};

const emptyCoursesTitle = {
  margin: '0 0 9px',
  color: '#0B1A3F',
  fontSize: '27px',
  fontWeight: '900'
};

const emptyCoursesText = {
 margin: '0 0 25px',
 color: '#8C9BC0',

  fontSize: '15px',
  fontWeight: '700',
  lineHeight: '1.6'
};

const semesterSectionStyle = {
  background: '#FFFFFF',
  border: '1.5px solid #E7EBF4',
  borderRadius: '25px',
  padding: '22px',
  boxShadow: '0 10px 28px rgba(11,26,63,0.035)'
};

const semesterHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '14px',
  marginBottom: '19px'
};

const semesterIconStyle = {
  width: '36px',
  height: '36px',
  borderRadius: '12px',
  background: '#DCEBFF',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const semesterAddButton = {
  border: '1.5px solid #DDE4EF',
  background: '#FFFFFF',
  color: '#0B1A3F',
  borderRadius: '12px',
  padding: '9px 13px',
  fontWeight: '900',
  fontSize: '12px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '6px'
};

const courseGridStyle = {
 display: 'grid',

  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: '16px'
};

const courseCardStyle = {
  background: '#FFFFFF',
  border: '1.5px solid #E8EDF5',
  padding: '21px',
  borderRadius: '20px',
  cursor: 'pointer',
  boxShadow: '0 8px 20px rgba(11,26,63,0.035)',
  display: 'flex',
  flexDirection: 'column',
  minHeight: '230px',
  transition: 'transform 0.18s ease, box-shadow 0.18s ease'
};

const courseCardTopRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '16px'
};

const courseIconWrap = {
  width: '46px',
  height: '46px',
  borderRadius: '14px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const courseNameStyle = {
  fontSize: '23px',
  fontWeight: '900',
  color: '#0B1A3F',
  margin: '0 0 11px'
};

const courseMetaWrap = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '7px',
  marginBottom: '18px'
};

const courseMetaPill = {
  background: '#F7F9FC',
  border: '1px solid #E8EDF5',
  color: '#5F6F94',
  borderRadius: '999px',
  padding: '6px 9px',
  fontSize: '11px',
  fontWeight: '800'
};

const courseCountsRow = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: '10px',
  marginTop: 'auto',
  paddingTop: '16px',
  borderTop: '1px solid #EDF1F7'
};

const courseCountItem = {
  minWidth: 0,
  minHeight: '66px',
  padding: '11px 8px',
  borderRadius: '12px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  color: '#8997B8',
  fontSize: '10px',
  fontWeight: '900',
  boxSizing: 'border-box'
};

const openWorkspaceText = {
  marginTop: '16px',
  fontWeight: '900',
  color: '#0B1A3F',
  fontSize: '12px'
};


const semesterFolderCardStyle = {
 textAlign: 'center',
 width: '100%',

  background: '#FFFFFF',
  border: '1.5px solid #E7EBF4',
  borderRadius: '24px',
  padding: '22px',
  cursor: 'pointer',
  boxShadow: '0 10px 26px rgba(11,26,63,0.04)',
  color: '#0B1A3F',
  fontFamily: 'inherit',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
};

const semesterFolderTopStyle = {
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',
  marginBottom: '20px'
};

const semesterFolderIconStyle = {
  width: '48px',
  height: '48px',
  borderRadius: '15px',
  background: '#F3F6FB',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const semesterFolderTitleStyle = {
  width: '100%',
  fontSize: '21px',
  fontWeight: '900',
  color: '#0B1A3F',
  marginBottom: '5px',
  textAlign: 'center'
};

const semesterFolderSubtitleStyle = {
 width: '100%',
 fontSize: '12px',
 fontWeight: '800',
 color: '#8795B4',
 marginBottom: '18px',

  textAlign: 'center'
};

const semesterFolderStatsStyle = {
  width: '100%',
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: '10px',
  paddingTop: '16px',
  borderTop: '1px solid #EDF1F7',
  alignItems: 'stretch',
  justifyItems: 'center'
};

const semesterMiniCountStyle = {
  width: '100%',
  minWidth: 0,
  minHeight: '66px',
  padding: '11px 8px',
  borderRadius: '12px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  boxSizing: 'border-box'
};

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(11,26,57,0.42)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
  padding: '20px',
  overflowY: 'auto'
};

const modalCardStyle = {
 width: '100%',
 maxWidth: '500px',
 border: '1.5px solid #DDE4EF',
 padding: '28px',
 borderRadius: '24px',

  background: '#FFFFFF',
  boxShadow: '0 25px 70px rgba(11,26,63,0.18)',
  maxHeight: '90vh',
  overflowY: 'auto'
};

const modalCloseButton = {
  border: 'none',
  background: '#F3F6FA',
  color: '#0B1A3F',
  width: '36px',
  height: '36px',
  borderRadius: '11px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  flexShrink: 0
};

const modalSectionStyle = {
  background: '#FAFBFD',
  border: '1px solid #E9EEF5',
  borderRadius: '18px',
  padding: '16px'
};

const stepTitleStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  color: '#0B1A3F',
  fontSize: '14px',
  fontWeight: '900',
  marginBottom: '13px'
};

const stepBubble = {
  width: '25px',
  height: '25px',
  borderRadius: '8px',
  background: '#DCEBFF',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '12px'
};

const activeTabBtn = {
  flex: 1,
  padding: '10px',
  borderRadius: '11px',
  border: '1.5px solid #0B1A3F',
  background: '#0B1A3F',
  color: '#FFFFFF',
  fontWeight: '900',
  fontSize: '12px',
  cursor: 'pointer'
};

const inactiveTabBtn = {
  flex: 1,
  padding: '10px',
  borderRadius: '11px',
  border: '1.5px solid #DDE4EF',
  background: '#FFFFFF',
  color: '#667695',
  fontWeight: '900',
  fontSize: '12px',
  cursor: 'pointer'
};

const fieldLabel = {
  fontSize: '12px',
  fontWeight: '900',
  color: '#0B1A3F',
  marginBottom: '6px',
  display: 'block'
};

const modalInput = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '12px',
  borderRadius: '12px',
  border: '1.5px solid #DDE4EF',
  background: '#FFFFFF',
  fontWeight: '800',
  outline: 'none',
  fontSize: '14px',
  color: '#0B1A3F'
};

const colorGridStyle = {

  display: 'flex',
  gap: '12px',
  flexWrap: 'wrap',
  padding: '5px 4px 14px'
};

const colorCircleStyle = {
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  border: '1px solid rgba(11,26,63,0.10)',
  cursor: 'pointer',
  padding: 0
};

const customColorRow = {
  borderTop: '1px solid #E7EBF4',
  paddingTop: '13px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '15px'
};

const customColorInput = {
  width: '54px',
  height: '38px',
  border: '1.5px solid #DDE4EF',
  borderRadius: '11px',
  padding: '3px',
  background: '#FFFFFF',
  cursor: 'pointer'
};

const saveBtnStyle = {
  background: '#0B1A3F',
  color: '#FFFFFF',
  border: 'none',
  padding: '14px',
  borderRadius: '13px',
  fontWeight: '900',
  fontSize: '14px',
  cursor: 'pointer'
};

const cancelBtnStyle = {
 background: 'none',

  border: 'none',
  fontWeight: '900',
  color: '#96A3BF',
  cursor: 'pointer',
  padding: '4px'
};

const backBtnStyle = {
  background: '#FFFFFF',
  border: '1.5px solid #E2E8F0',
  padding: '10px 16px',
  borderRadius: '13px',
  fontWeight: '900',
  color: '#0B1A3F',
  cursor: 'pointer',
  marginBottom: '18px',
  display: 'flex',
  alignItems: 'center',
  gap: '9px',
  fontSize: '13px'
};

const semesterPillStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 10px',
  borderRadius: '999px',
  background: '#F2F6FC',
  color: '#667695',
  fontSize: '11px',
  fontWeight: '900'
};

const courseMiniStatsGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: '14px',
  marginBottom: '20px'
};

const miniStatCardStyle = {
 background: '#FFFFFF',
 border: '1.5px solid #E7EBF4',
 borderRadius: '17px',
 padding: '14px',
 display: 'flex',

  alignItems: 'center',
  gap: '11px'
};

const miniStatIconStyle = {
  width: '38px',
  height: '38px',
  borderRadius: '12px',
  background: '#F2F6FC',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#0B1A3F'
};

const miniStatValueStyle = {
  fontSize: '18px',
  fontWeight: '900',
  color: '#0B1A3F',
  lineHeight: 1
};

const miniStatLabelStyle = {
  fontSize: '11px',
  fontWeight: '800',
  color: '#8190B2',
  marginTop: '4px'
};

const alertOptionsGridStyle = {
 display: 'grid',
 gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
 gap: '9px'
};

const miniAlertBadgeRowStyle = {
 display: 'flex',
 alignItems: 'center',
 gap: '5px',
 flexWrap: 'wrap',
 marginTop: '6px'
};

const workspaceTabsWrap = {
  background: '#FFFFFF',
  border: '1.5px solid #E7EBF4',
  borderRadius: '18px',
  padding: '7px',
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '7px',
  marginBottom: '20px'
};

const workspaceTabBase = {
 minHeight: '46px',
 borderRadius: '13px',
 fontWeight: '900',
 fontSize: '12px',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 gap: '7px',
 cursor: 'pointer',
 fontFamily: 'inherit',
 transition: 'all 0.18s ease'
};

const workspaceTabActive = {
 border: 'none',
 background: '#0B1A3F',
 color: '#FFFFFF',
 minHeight: '46px',
 borderRadius: '13px',
 fontWeight: '900',

  fontSize: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '7px',
  cursor: 'pointer'
};

const workspaceTabInactive = {
  border: 'none',
  background: '#FFFFFF',
  color: '#6E7DA0',
  minHeight: '46px',
  borderRadius: '13px',
  fontWeight: '900',
  fontSize: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '7px',
  cursor: 'pointer'
};

const activeCountBubble = {
  minWidth: '22px',
  height: '22px',
  padding: '0 6px',
  borderRadius: '999px',
  background: 'rgba(255,255,255,0.16)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '10px'
};

const countBubble = {
  minWidth: '22px',
  height: '22px',
  padding: '0 6px',
  borderRadius: '999px',
  background: '#F2F5F9',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '10px',
  color: '#6E7DA0'
};

const notepadCardStyle = {
  borderRadius: '22px',
  padding: '24px',
  boxShadow: '0 10px 25px rgba(0,0,0,0.035)',
  backgroundImage:
   'linear-gradient(transparent 95%, rgba(11,26,57,0.065) 95%)',
  backgroundSize: '100% 28px',
  border: '1px solid rgba(11,26,57,0.08)'
};

const notepadTag = {
  fontSize: '12px',
  fontWeight: '900',
  color: '#0B1A3F',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  background: 'rgba(255,255,255,0.78)',
  padding: '5px 10px',
  borderRadius: '9px'
};

const notepadTitleInput = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '11px 13px',
  borderRadius: '12px',
  border: '1.5px solid rgba(11,26,57,0.12)',
  background: '#FFFFFF',
  fontSize: '17px',
  fontWeight: '900',
  color: '#0B1A3F',
  outline: 'none',
  marginBottom: '13px'
};

const notepadTextArea = {
 width: '100%',
 boxSizing: 'border-box',
 minHeight: '320px',
 background: 'rgba(255,255,255,0.40)',
 border: '1px solid rgba(255,255,255,0.55)',
 borderRadius: '14px',
 outline: 'none',
 resize: 'vertical',
 fontSize: '15px',

  fontWeight: '700',
  color: '#0B1A3F',
  lineHeight: '28px',
  fontFamily: 'inherit',
  padding: '13px'
};

const saveNotepadBtn = {
  background: '#0B1A3F',
  color: '#FFFFFF',
  border: 'none',
  padding: '8px 13px',
  borderRadius: '10px',
  fontWeight: '900',
  fontSize: '12px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '6px'
};

const smallNoteBtn = {
  background: '#FFFFFF',
  border: '1px solid rgba(11,26,57,0.14)',
  padding: '7px 11px',
  borderRadius: '10px',
  fontSize: '11px',
  fontWeight: '900',
  color: '#0B1A3F',
  cursor: 'pointer'
};

const whitePanelStyle = {
  background: '#FFFFFF',
  border: '1.5px solid #E7EBF4',
  borderRadius: '22px',
  padding: '22px',
  boxShadow: '0 8px 22px rgba(11,26,63,0.035)'
};

const panelTitleStyle = {
 margin: '0 0 17px',
 fontWeight: '900',
 color: '#0B1A3F',
 fontSize: '17px',
 display: 'flex',
 alignItems: 'center',

  gap: '8px'
};

const titleCountStyle = {
  minWidth: '24px',
  height: '24px',
  padding: '0 7px',
  borderRadius: '999px',
  background: '#F2F5F9',
  color: '#6D7B9A',
  fontSize: '10px',
  fontWeight: '900',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const savedNoteRow = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '12px',
  borderRadius: '14px',
  cursor: 'pointer'
};

const savedNoteTitle = {
  fontWeight: '900',
  color: '#0B1A3F',
  fontSize: '13px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
};

const savedNotePreview = {
  color: '#8996B5',
  fontSize: '11px',
  fontWeight: '700',
  marginTop: '3px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
};

const twoColumnWorkspace = {
 display: 'grid',

  gridTemplateColumns: 'minmax(300px, 0.72fr) minmax(0, 1.28fr)',
  gap: '20px',
  alignItems: 'start'
};


const doneSectionDividerStyle = {
  height: '1px',
  background: '#E7EBF4',
  margin: '22px 0 18px'
};

const doneEmptyStyle = {
  padding: '18px 12px',
  textAlign: 'center',
  color: '#A3AED0',
  fontSize: '11px',
  fontWeight: '800',
  background: '#FAFBFD',
  borderRadius: '12px',
  border: '1px dashed #E2E8F0'
};

const taskRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '11px',
  padding: '13px',
  borderRadius: '14px',
  border: '1px solid #E8EDF5',
  background: '#FAFBFD'
};

const completionButtonStyle = {
  width: '26px',
  height: '26px',
  borderRadius: '8px',
  border: '1.5px solid #CDD6E5',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  flexShrink: 0
};

const eventTypeBadgeStyle = {
 minWidth: '54px',

  textAlign: 'center',
  borderRadius: '999px',
  background: '#DCEBFF',
  color: '#0B1A3F',
  padding: '6px 9px',
  fontSize: '10px',
  fontWeight: '900'
};

const metaTextStyle = {
  fontSize: '11px',
  color: '#8794B3',
  fontWeight: '700',
  marginTop: '3px'
};

const emptyStateStyle = {
  textAlign: 'center',
  padding: '45px 20px'
};

const bannerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  background: '#DCFCE7',
  border: '1px solid #B7EBC8',
  padding: '12px 18px',
  borderRadius: '15px',
  marginBottom: '18px'
};

const iconBackBtn = {
  background: '#F1F5F9',
  border: 'none',
  padding: '6px',
  borderRadius: '8px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  color: '#0B1A3F'
};

const iconActionBtn = {
 background: 'none',
 border: 'none',
 cursor: 'pointer',

  padding: '5px',
  borderRadius: '7px',
  display: 'flex',
  alignItems: 'center',
  flexShrink: 0
};

const uploadIconLabel = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  cursor: 'pointer',
  background: '#F2F6FC',
  border: '1px solid #E4EAF2',
  padding: '9px 13px',
  borderRadius: '12px',
  color: '#0B1A3F'
};

const folderCardStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '14px',
  background: '#FFFFFF',
  borderRadius: '16px',
  cursor: 'pointer',
  border: '1px solid #E5EAF2',
  boxShadow: '0 5px 14px rgba(11,26,63,0.025)',
  minWidth: 0
};

const folderIconWrap = {
  width: '40px',
  height: '40px',
  borderRadius: '12px',
  background: '#F2F6FC',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0
};

const fileRowStyle = {
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'space-between',

  padding: '12px 14px',
  background: '#FAFBFD',
  borderRadius: '14px',
  fontSize: '14px',
  border: '1px solid #E8EDF5'
};


const editCourseBtnStyle = {
  background: '#F2F6FC',
  border: '1.5px solid #DDE4EF',
  color: '#0B1A3F',
  borderRadius: '12px',
  padding: '10px 14px',
  fontWeight: '900',
  fontSize: '12px',
  display: 'flex',
  alignItems: 'center',
  gap: '7px',
  cursor: 'pointer'
};

const deleteCourseBtnStyle = {
  background: '#FFFFFF',
  border: '1.5px solid #F2C7C2',
  color: '#D84C41',
  borderRadius: '12px',
  padding: '10px 14px',
  fontWeight: '900',
  fontSize: '12px',
  display: 'flex',
  alignItems: 'center',
  gap: '7px',
  cursor: 'pointer'
};

