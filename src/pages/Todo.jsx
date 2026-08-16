import React, { useEffect, useMemo, useState } from 'react';

import {
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Sparkles,
  ListTodo,
  Target,
  Trophy,
  X,
  Flag,
  ChevronDown,
  Pencil,
  CheckCheck,
  Bell,
  AlarmClock,
} from 'lucide-react';

import { supabase } from '../lib/supabase';
import { toast } from '../lib/toast';

import {
  getTodosForCurrentUser,
  toggleTodo,
  deleteTodo,
} from '../lib/queries';

import {
  SectionHeader,
} from '../components/luminous';

const todoPageShellStyle = {
  width: '100%',
  minHeight: '100%',
  boxSizing: 'border-box',
  background: 'transparent',
  padding: '8px 4px 28px',
  display: 'flex',
  flexDirection: 'column',
  gap: '22px',
};

const NAVY = 'var(--campora-navy)';

const PRIORITY_CONFIG = {
  high: {
    label: 'High Priority',
    shortLabel: 'High',
    background: '#FFF5F6',
    headerBackground: '#FBEAEC',
    border: '#F0DDE1',
    color: '#C76E7D',
    badge: '#F7E4E8',
  },

  medium: {
    label: 'Medium Priority',
    shortLabel: 'Medium',
    background: '#FFF9F1',
    headerBackground: '#F9EEDC',
    border: '#F0E2CB',
    color: '#C99758',
    badge: '#F6E9D3',
  },

  low: {
    label: 'Low Priority',
    shortLabel: 'Low',
    background: '#F3F7FD',
    headerBackground: '#E8F0FA',
    border: '#DDE7F5',
    color: '#648CCB',
    badge: '#E3ECF8',
  },
};

export default function Todo() {
 const [tasks, setTasks] = useState([]);
 const [showTaskModal, setShowTaskModal] = useState(false);
 const [editingTask, setEditingTask] = useState(null);
 const [formError, setFormError] = useState('');
 const [saving, setSaving] = useState(false);

 const [newTask, setNewTask] = useState({
  title: '',
  details: '',
  priority: '',
  alertType: '',
  alertDate: '',
  alertTime: '',
 });

 useEffect(() => {
  loadTasks();
 }, []);

 const loadTasks = async () => {
  try {
    const data = await getTodosForCurrentUser();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const links = user
      ? readTodoAlertLinks(user.id)
      : {};

    setTasks(
      (data || []).map((task) => ({
        ...task,
        _alertType: links[task.id]?.type || '',
        _alertDate: links[task.id]?.date || '',
        _alertTime: links[task.id]?.time || '',
      }))
    );
  } catch (error) {
    console.error('Error loading tasks:', error);
  }
 };

 const openAddTask = () => {
  setEditingTask(null);

  setNewTask({
   title: '',
   details: '',
   priority: '',
   alertType: '',
   alertDate: '',
   alertTime: '',
  });

  setFormError('');
  setShowTaskModal(true);
 };

const openEditTask = (task) => {
 setEditingTask(task);

 setNewTask({
  title: task.title || '',
  details: task.details || '',
  priority: String(task.priority || '')
     .trim()
     .toLowerCase(),
  alertType: task._alertType || '',
  alertDate: task._alertDate || '',
  alertTime: task._alertTime || '',
 });

  setFormError('');
  setShowTaskModal(true);
};

const closeTaskModal = () => {
 if (saving) return;

 setShowTaskModal(false);
 setEditingTask(null);
 setFormError('');

  setNewTask({
   title: '',
   details: '',
   priority: '',
   alertType: '',
   alertDate: '',
   alertTime: '',
  });
};


const getTodoAlertStorageKey = (userId) =>
  `campora-todo-alert-links-${userId}`;

const readTodoAlertLinks = (userId) => {
  if (!userId) return {};

  try {
    return JSON.parse(
      localStorage.getItem(getTodoAlertStorageKey(userId)) || '{}'
    );
  } catch {
    return {};
  }
};

const writeTodoAlertLinks = (userId, links) => {
  if (!userId) return;

  localStorage.setItem(
    getTodoAlertStorageKey(userId),
    JSON.stringify(links || {})
  );
};

const removeLinkedTodoAlert = async (userId, todoId) => {
  if (!userId || !todoId) return;

  const links = readTodoAlertLinks(userId);

  delete links[todoId];

  writeTodoAlertLinks(userId, links);
};

const createLinkedTodoAlert = async ({
  userId,
  todo,
  alertType,
  alertDate,
  alertTime,
}) => {
  if (!userId || !todo?.id || !alertType) return;

  const links = readTodoAlertLinks(userId);

  links[todo.id] = {
    type: alertType,
    title: todo.title || 'To-Do',
    details: todo.details || '',
    priority: todo.priority || '',
    date: alertDate || '',
    time: alertTime || '',
    created_at: new Date().toISOString(),
  };

  writeTodoAlertLinks(userId, links);
};

const handleSaveTask = async () => {
 const title = newTask.title.trim();
 const details = newTask.details.trim();
 const priority = newTask.priority;
 const alertType = newTask.alertType;
 const alertDate = newTask.alertDate;
 const alertTime = newTask.alertTime;

 setFormError('');

 if (!title) {
   setFormError('Please enter a task title.');
   return;
 }

 if (!priority) {
   setFormError('Please choose a priority.');
   return;
 }

 if (!['high', 'medium', 'low'].includes(priority)) {
   setFormError('Please choose a valid priority.');
   return;
 }

 if (alertType === 'reminder' && !alertDate) {
   setFormError('Please choose a date for the reminder.');
   return;
 }

 setSaving(true);

 try {
   const {
     data: { user },
     error: userError,
   } = await supabase.auth.getUser();

   if (userError) {
     setFormError(userError.message);
     return;
   }

   if (!user) {
     setFormError('You must be logged in to save a task.');
     return;
   }

   let savedTask = null;

   if (editingTask) {
     const { data, error } = await supabase
       .from('todos')
       .update({
         title,
         details,
         priority,
       })
       .eq('id', editingTask.id)
       .select('*')
       .single();

     if (error) {
       console.error('Supabase edit error:', error);
       setFormError(error.message);
       return;
     }

     savedTask = data;

     setTasks((current) =>
       current.map((task) =>
         task.id === editingTask.id
           ? {
               ...data,
               _alertType: alertType,
               _alertDate: alertDate,
               _alertTime: alertTime,
             }
           : task
       )
     );
   } else {
     const { data, error } = await supabase
       .from('todos')
       .insert([
         {
           profile_id: user.id,
           title,
           details,
           priority,
           completed: false,
         },
       ])
       .select('*')
       .single();

     if (error) {
       console.error('Supabase add error:', error);
       setFormError(error.message);
       return;
     }

     savedTask = data;

     setTasks((current) => [
       {
         ...data,
         _alertType: alertType,
         _alertDate: alertDate,
         _alertTime: alertTime,
       },
       ...current,
     ]);
   }

   toast('Task added');

  try {
    if (alertType) {
      await createLinkedTodoAlert({
        userId: user.id,
        todo: savedTask,
        alertType,
        alertDate,
        alertTime,
      });
    } else {
      await removeLinkedTodoAlert(user.id, savedTask?.id);
    }
  } catch (alertError) {
    console.error('Could not create To-Do alert:', alertError);

    setFormError(
      `Task saved, but the ${
        alertType === 'reminder' ? 'reminder' : 'notification'
      } could not be added: ${alertError?.message || 'Unknown error'}`
    );

    return;
  }

  setNewTask({
    title: '',
    details: '',
    priority: '',
    alertType: '',
    alertDate: '',
    alertTime: '',
  });

  setEditingTask(null);
  setFormError('');
  setShowTaskModal(false);
 } catch (error) {
   console.error('Task save error:', error);

   setFormError(
     error?.message || 'Something went wrong while saving the task.'
   );
 } finally {
   setSaving(false);
 }
};

const toggleTask = async (id) => {
 const task = tasks.find((task) => task.id === id);

 if (!task) return;

 try {
   const updated = await toggleTodo(
     id,
     !task.completed
   );

    setTasks((current) =>
      current.map((task) =>
        task.id === id ? updated : task
      )
    );

    if (updated.completed) {
      toast('Task completed');
    } else {
      toast('Task marked incomplete', 'info');
    }
  } catch (error) {
    console.error('Error toggling task:', error);
  }
};

const handleDeleteTask = async (id) => {
 try {
   const {
     data: { user },
   } = await supabase.auth.getUser();

   await deleteTodo(id);

   if (user) {
     await removeLinkedTodoAlert(user.id, id);
   }

   setTasks((current) =>
     current.filter((task) => task.id !== id)
   );
 } catch (error) {
   console.error('Error deleting task:', error);
 }
};

const completeAllInPriority = async (priority) => {
 const matchingTasks = tasks.filter(
   (task) =>
    !task.completed &&
    String(task.priority || '')
      .trim()
      .toLowerCase() === priority
 );

 if (matchingTasks.length === 0) return;

 const ids = matchingTasks.map((task) => task.id);

 try {
   const { data, error } = await supabase
    .from('todos')
    .update({
      completed: true,
    })
    .in('id', ids)
    .select('*');

  if (error) {
    console.error('Complete all error:', error);
    return;
  }

  const updatedMap = new Map(
    (data || []).map((task) => [task.id, task])
  );

    setTasks((current) =>
      current.map((task) =>
        updatedMap.has(task.id)
         ? updatedMap.get(task.id)
         : task
      )
    );
  } catch (error) {
    console.error('Complete all error:', error);
  }
};

const clearAllInPriority = async (priority) => {
 const matchingTasks = tasks.filter(
   (task) =>
    !task.completed &&
    String(task.priority || '')
      .trim()
      .toLowerCase() === priority
 );

 if (matchingTasks.length === 0) return;

 const ids = matchingTasks.map((task) => task.id);

 try {
   const { error } = await supabase
    .from('todos')

    .delete()
    .in('id', ids);

  if (error) {
    console.error('Clear priority error:', error);
    return;
  }

    setTasks((current) =>
      current.filter((task) => !ids.includes(task.id))
    );
  } catch (error) {
    console.error('Clear priority error:', error);
  }
};

const clearCompleted = async () => {
 const completedIds = tasks
  .filter((task) => task.completed)
  .map((task) => task.id);

 if (completedIds.length === 0) return;

 try {
   const { error } = await supabase
    .from('todos')
    .delete()
    .in('id', completedIds);

  if (error) {
    console.error('Clear completed error:', error);
    return;
  }

    setTasks((current) =>
      current.filter((task) => !task.completed)
    );
  } catch (error) {
    console.error('Clear completed error:', error);
  }
};

const completedCount = useMemo(() => {
  return tasks.filter((task) => task.completed).length;
}, [tasks]);

const remainingCount =

 tasks.length - completedCount;

const progress =
 tasks.length === 0
  ? 0
  : Math.round(
      (completedCount / tasks.length) * 100
    );

const activeTasks = useMemo(() => {
  return tasks.filter((task) => !task.completed);
}, [tasks]);

const completedTasks = useMemo(() => {
  return tasks.filter((task) => task.completed);
}, [tasks]);

const priorityGroups = useMemo(() => {
 return {
  high: activeTasks.filter((task) => {
    return (
      String(task.priority || '')
       .trim()
       .toLowerCase() === 'high'
    );
  }),

  medium: activeTasks.filter((task) => {
   return (
      String(task.priority || '')
       .trim()
       .toLowerCase() === 'medium'
   );
  }),

    low: activeTasks.filter((task) => {
      return (
        String(task.priority || '')
         .trim()
         .toLowerCase() === 'low'
      );
    }),
  };
}, [activeTasks]);

return (
 <div style={todoPageShellStyle}>

 {/* HEADER */}

 <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
  <span
   className="pill"
   style={{
    alignSelf: 'flex-start',
    background: 'var(--campora-navy-tint)',
    color: 'var(--campora-navy)',
   }}
  >
   <Sparkles size={13} />
   Stay Productive
  </span>

  <SectionHeader
   title="To-Do List"
   subtitle="Keep your tasks organized, focus on what matters most, and celebrate your progress."
  />
 </div>

 {/* SUMMARY */}

 <div className="grid-3" style={{ gap: '16px' }}>
  <SummaryStat
   icon={ListTodo}
   value={tasks.length}
   label="Total Tasks"
   accent="#6684AE"
   soft="#F1F5FA"
   border="#D9E2ED"
  />

  <SummaryStat
   icon={Target}
   value={remainingCount}
   label="Remaining"
   accent="#7F7897"
   soft="#F4F2F8"
   border="#E4DFEC"
  />

  <SummaryStat
   icon={Trophy}
   value={completedCount}
   label="Completed"
   accent="#6F948B"
   soft="#F1F7F5"
   border="#D8E7E2"
  />
 </div>

 {/* PROGRESS */}

 <div
  style={{
   background:
    'linear-gradient(135deg, var(--campora-navy-solid) 0%, var(--campora-navy-solid) 60%, var(--primary-container) 100%)',
   borderRadius: 'var(--radius)',
   padding: '18px 22px',
   color: '#FFFFFF',
   boxShadow: 'var(--shadow-lift)',
  }}
 >
  <div
   style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
   }}
  >
   <div>
    <p
     style={{
      margin: '0 0 3px',
      fontWeight: '900',
      fontSize: '15px',
     }}
    >
     Your Progress
    </p>

    <p
     style={{
      margin: 0,
      opacity: 0.7,
      fontSize: '12px',
      fontWeight: '700',
     }}
    >
     {tasks.length === 0
       ? 'Add your first task to get started.'
       : `${completedCount} of ${tasks.length} tasks completed`}
    </p>
   </div>

   <div
    style={{
     fontSize: '24px',
     fontWeight: '900',
    }}
   >
    {progress}%
   </div>
  </div>

  <div
   style={{
    height: '8px',
    borderRadius: '999px',
    background: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
   }}
  >
   <div
    style={{
     width: `${progress}%`,
     height: '100%',
     background: '#FFFFFF',
     borderRadius: '999px',
     transition: 'width 0.3s ease',
    }}
   />
  </div>
 </div>

 {/* PRIORITY OVERVIEW */}

 <div className="grid-3">
  <PriorityOverviewCard
   priority="high"
   count={priorityGroups.high.length}
  />

  <PriorityOverviewCard
   priority="medium"
   count={priorityGroups.medium.length}
  />

  <PriorityOverviewCard
   priority="low"
   count={priorityGroups.low.length}
  />
 </div>

 {/* ADD TASK BAR */}

 <div
  className="panel"
  style={{
   display: 'flex',
   justifyContent: 'space-between',
   alignItems: 'center',
   gap: '20px',
   flexWrap: 'wrap',
   boxShadow: 'var(--shadow-soft)',
  }}
 >
  <div>
   <p
    style={{
     margin: 0,
     color: NAVY,
     fontWeight: '900',
     fontSize: '14px',
    }}
   >
    What do you need to get done?
   </p>

   <p
    style={{
     margin: '4px 0 0',
     color: 'var(--campora-muted)',
     fontSize: '12px',
     fontWeight: '700',
    }}
   >
    Create a task and choose its priority.
   </p>
  </div>

  <button
   type="button"
   onClick={openAddTask}
   className="btn btn-primary"
  >
   <Plus size={17} />
   Add Task
  </button>
 </div>

 {/* YOUR TASKS */}

 <div
   className="panel"
   style={{
    background: '#FFFFFF',
    border: '1px solid #E5EAF2',
    borderRadius: '20px',
    boxShadow: '0 8px 22px rgba(11,26,63,0.04)',
   }}
  >
  <SectionHeader
   title="Your Tasks"
   subtitle="Keep track of what matters most."
   action={
    <span
     style={{
      minWidth: '64px',
      height: '32px',
      padding: '0 12px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '999px',
      background: '#FFFFFF',
      color: '#0B1A3F',
      border: '1px solid #D8E0EB',
      boxShadow: '0 3px 9px rgba(11, 26, 63, 0.05)',
      fontSize: '11px',
      fontWeight: '900',
      whiteSpace: 'nowrap',
     }}
    >
     {remainingCount} left
    </span>
   }
  />

  {activeTasks.length === 0 ? (
   <div
    style={{
     minHeight: '210px',
     display: 'flex',
     flexDirection: 'column',
     alignItems: 'center',
     justifyContent: 'center',
     textAlign: 'center',
     padding: '28px 20px',
    }}
   >
    <div
     style={{
      width: '58px',
      height: '58px',
      borderRadius: '50%',
      background: '#FFFFFF',
      border: '1px solid #E2E7EF',
      boxShadow: '0 5px 14px rgba(11,26,63,0.05)',
      color: '#0B1A3F',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '14px',
     }}
    >
     <CheckCircle2 size={27} strokeWidth={2} />
    </div>

    <div
     style={{
      color: '#0B1A3F',
      fontSize: '16px',
      fontWeight: '900',
     }}
    >
     Your list is clear
    </div>

    <div
     style={{
      marginTop: '6px',
      color: '#8B97AD',
      fontSize: '11px',
      fontWeight: '700',
     }}
    >
     Add a task when you have something to get done.
    </div>
   </div>
  ) : (
   <div
    style={{
     display: 'grid',
     gridTemplateColumns:
      'repeat(auto-fit, minmax(260px, 1fr))',
     gap: '14px',
     alignItems: 'start',
     marginTop: '18px',
    }}
   >
    <PriorityColumn
     priority="high"
     tasks={priorityGroups.high}
     onToggle={toggleTask}
     onDelete={handleDeleteTask}
     onEdit={openEditTask}
     onCompleteAll={completeAllInPriority}
     onClearAll={clearAllInPriority}
    />

    <PriorityColumn
     priority="medium"
     tasks={priorityGroups.medium}
     onToggle={toggleTask}
     onDelete={handleDeleteTask}
     onEdit={openEditTask}
     onCompleteAll={completeAllInPriority}
     onClearAll={clearAllInPriority}
    />

    <PriorityColumn
     priority="low"
     tasks={priorityGroups.low}
     onToggle={toggleTask}
     onDelete={handleDeleteTask}
     onEdit={openEditTask}
     onCompleteAll={completeAllInPriority}
     onClearAll={clearAllInPriority}
    />
   </div>
  )}
 </div>

 {/* COMPLETED */}

 {completedTasks.length > 0 && (
  <div
    className="panel"
    style={{
     background: '#FFFFFF',
     border: '1px solid #E5EAF2',
     borderRadius: '20px',
     boxShadow: '0 8px 22px rgba(11,26,63,0.04)',
    }}
   >
   <div
    style={{
     display: 'flex',
     alignItems: 'center',
     justifyContent: 'space-between',
     gap: '14px',
     marginBottom: '14px',
    }}
   >
    <div
     style={{
      display: 'flex',
      alignItems: 'center',
      gap: '9px',
     }}
    >
     <div
      style={{
       width: '34px',
       height: '34px',
       borderRadius: 'var(--radius-sm)',
       background: 'var(--tone-success-soft)',
       color: 'var(--tone-success)',
       display: 'flex',
       alignItems: 'center',
       justifyContent: 'center',
      }}
     >
      <CheckCircle2 size={18} />
     </div>

     <div>
      <h3
       style={{
        margin: 0,
        color: 'var(--campora-text)',
        fontSize: '15px',
        fontWeight: '900',
       }}
      >
       Completed
      </h3>

      <p
       style={{
        margin: '2px 0 0',
        color: 'var(--campora-muted)',
        fontSize: '11px',
        fontWeight: '700',
       }}
      >
       {completedTasks.length} completed{' '}
       {completedTasks.length === 1 ? 'task' : 'tasks'}
      </p>
     </div>
    </div>

    <button
     type="button"
     onClick={clearCompleted}
     className="btn btn-sm btn-danger"
    >
     <Trash2 size={13} />
     Clear Completed
    </button>
   </div>

   <div
    style={{
     display: 'flex',
     flexDirection: 'column',
     gap: '8px',
    }}
   >
    {completedTasks.map((task) => (
     <CompletedTask
      key={task.id}
      task={task}
      onToggle={toggleTask}
      onDelete={handleDeleteTask}
      onEdit={openEditTask}
     />
    ))}
   </div>
  </div>
 )}

 {/* ADD / EDIT MODAL */}

 {showTaskModal && (
  <div
   onMouseDown={(e) => {
    if (e.target === e.currentTarget) {
     closeTaskModal();
    }
   }}
   style={{
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    background: 'rgba(0, 45, 98, 0.45)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
   }}
  >
   <div
    className="panel"
    style={{
     width: '100%',
     maxWidth: '520px',
     padding: '25px',
     boxShadow: 'var(--shadow-lift)',
    }}
   >
    <div
     style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: '15px',
      marginBottom: '22px',
     }}
    >
     <div>
      <h2
       style={{
        margin: 0,
        color: 'var(--campora-text)',
        fontSize: '22px',
        fontWeight: '900',
       }}
      >
       {editingTask ? 'Edit Task' : 'Add Task'}
      </h2>

      <p
       style={{
        margin: '5px 0 0',
        color: 'var(--campora-muted)',
        fontSize: '13px',
        fontWeight: '700',
       }}
      >
       {editingTask
         ? 'Update the task details or change its priority.'
         : 'Add the details and choose its priority.'}
      </p>
     </div>

     <button
      type="button"
      onClick={closeTaskModal}
      disabled={saving}
      className="btn btn-sm btn-tinted"
      style={{
       width: '36px',
       height: '36px',
       padding: 0,
       opacity: saving ? 0.5 : 1,
       cursor: saving ? 'default' : 'pointer',
      }}
     >
      <X size={18} />
     </button>
    </div>

    <FormLabel>Title</FormLabel>

    <input
     type="text"
     autoFocus
     placeholder="What do you need to do?"
     value={newTask.title}
     onChange={(e) => {
      setNewTask((current) => ({
       ...current,
       title: e.target.value,
      }));

      setFormError('');
     }}
     style={inputStyle}
    />

    <FormLabel>Details</FormLabel>

    <textarea
     rows={4}
     placeholder="Add any notes or details..."
     value={newTask.details}
     onChange={(e) => {
      setNewTask((current) => ({
       ...current,
       details: e.target.value,
      }));

      setFormError('');
     }}
     style={{
      ...inputStyle,
      resize: 'vertical',
      minHeight: '100px',
     }}
    />

    <FormLabel>Priority</FormLabel>

    <div
     style={{
      position: 'relative',
      marginBottom: formError ? '10px' : '22px',
     }}
    >
     <Flag
      size={16}
      style={{
       position: 'absolute',
       left: '14px',
       top: '50%',
       transform: 'translateY(-50%)',
       color: newTask.priority ? NAVY : 'var(--campora-muted)',
       pointerEvents: 'none',
      }}
     />

     <select
      value={newTask.priority}
      onChange={(e) => {
       setNewTask((current) => ({
        ...current,
        priority: e.target.value,
       }));

       setFormError('');
      }}
      style={{
       width: '100%',
       boxSizing: 'border-box',
       appearance: 'none',
       padding: '13px 42px',
       borderRadius: 'var(--radius-sm)',
       border: formError
         ? '1.5px solid #E8C4CB'
         : '1.5px solid var(--divider)',
       background: 'var(--surface-container-lowest)',
       color: newTask.priority
         ? NAVY
         : 'var(--campora-muted)',
       fontWeight: '800',
       fontFamily: 'inherit',
       outline: 'none',
       cursor: 'pointer',
      }}
     >
      <option value="" disabled>
       Choose priority...
      </option>

      <option value="high">
       High Priority
      </option>

      <option value="medium">
       Medium Priority
      </option>

      <option value="low">
       Low Priority
      </option>
     </select>

     <ChevronDown
      size={16}
      style={{
       position: 'absolute',
       right: '14px',
       top: '50%',
       transform: 'translateY(-50%)',
       color: 'var(--campora-muted)',
       pointerEvents: 'none',
      }}
     />
    </div>

    <FormLabel>Alert</FormLabel>

    <div
     style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
      gap: '9px',
      marginBottom: newTask.alertType ? '14px' : '22px',
     }}
    >
     {[
       {
         value: '',
         label: 'None',
         icon: Circle,
         color: '#75839A',
         soft: '#F6F8FB',
         border: '#E4E8EF',
       },
       {
         value: 'notification',
         label: 'Notification',
         icon: Bell,
         color: '#648CCB',
         soft: '#F3F7FD',
         border: '#DDE7F5',
       },
       {
         value: 'reminder',
         label: 'Reminder',
         icon: AlarmClock,
         color: '#8B78B8',
         soft: '#F7F4FC',
         border: '#E7E0F2',
       },
     ].map((option) => {
       const AlertIcon = option.icon;
       const active = newTask.alertType === option.value;

       return (
        <button
         key={option.label}
         type="button"
         onClick={() => {
          setNewTask((current) => ({
           ...current,
           alertType: option.value,
           alertDate:
             option.value === 'reminder'
               ? current.alertDate
               : '',
           alertTime:
             option.value === 'reminder'
               ? current.alertTime
               : '',
          }));

          setFormError('');
         }}
         style={{
          minHeight: '48px',
          borderRadius: 'var(--radius-sm)',
          border: active
            ? `1.5px solid ${option.color}`
            : `1px solid ${option.border}`,
          background: active
            ? option.color
            : option.soft,
          color: active
            ? '#FFFFFF'
            : option.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '7px',
          cursor: 'pointer',
          fontWeight: '900',
          fontSize: '11px',
         }}
        >
         <AlertIcon size={15} />
         {option.label}
        </button>
       );
     })}
    </div>

    {newTask.alertType === 'notification' && (
     <div
      style={{
       marginBottom: '20px',
       padding: '10px 12px',
       borderRadius: 'var(--radius-sm)',
       background: '#F3F7FD',
       border: '1px solid #DDE7F5',
       color: '#648CCB',
       fontSize: '11px',
       fontWeight: '800',
       lineHeight: 1.45,
      }}
     >
      A To-Do notification will be added to Notifications.
     </div>
    )}

    {newTask.alertType === 'reminder' && (
     <>
      <div
       style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
        gap: '10px',
        marginBottom: '8px',
       }}
      >
       <div>
        <FormLabel>Reminder Date</FormLabel>

        <input
         type="date"
         value={newTask.alertDate}
         onChange={(e) => {
          setNewTask((current) => ({
           ...current,
           alertDate: e.target.value,
          }));

          setFormError('');
         }}
         style={{
          ...inputStyle,
          marginBottom: 0,
         }}
        />
       </div>

       <div>
        <FormLabel>Reminder Time</FormLabel>

        <input
         type="time"
         value={newTask.alertTime}
         onChange={(e) =>
          setNewTask((current) => ({
           ...current,
           alertTime: e.target.value,
          }))
         }
         style={{
          ...inputStyle,
          marginBottom: 0,
         }}
        />
       </div>
      </div>

      <div
       style={{
        marginBottom: '20px',
        color: 'var(--campora-muted)',
        fontSize: '10px',
        fontWeight: '700',
       }}
      >
       This will appear under Reminders in Notifications & Reminders.
      </div>
     </>
    )}

    {formError && (
     <div
      style={{
       marginBottom: '18px',
       padding: '10px 12px',
       background: 'var(--tone-error-soft)',
       border: '1px solid var(--tone-error-soft)',
       borderRadius: 'var(--radius-sm)',
       color: 'var(--tone-error)',
       fontSize: '12px',
       fontWeight: '800',
       lineHeight: '1.4',
      }}
     >
      {formError}
     </div>
    )}

    <div
     style={{
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '10px',
     }}
    >
     <button
      type="button"
      onClick={closeTaskModal}
      disabled={saving}
      className="btn btn-outline"
      style={{
       opacity: saving ? 0.55 : 1,
       cursor: saving ? 'default' : 'pointer',
      }}
     >
      Cancel
     </button>

     <button
      type="button"
      onClick={handleSaveTask}
      disabled={saving}
      className="btn btn-primary"
      style={{
       opacity: saving ? 0.7 : 1,
       cursor: saving ? 'default' : 'pointer',
      }}
     >
      {editingTask ? (
       <Pencil size={16} />
      ) : (
       <Plus size={17} />
      )}

      {saving
       ? 'Saving...'
       : editingTask
         ? 'Save Changes'
         : 'Add Task'}
     </button>
    </div>
   </div>
  </div>
 )}
 </div>
);
}

function SummaryStat({
 icon: Icon,
 value,
 label,
 accent,
 soft,
 border,
}) {
 return (
  <div
   style={{
    minHeight: '92px',
    padding: '17px 18px',
    borderRadius: '18px',
    background: soft,
    border: `1px solid ${border}`,
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    boxShadow: '0 6px 18px rgba(11,26,63,0.03)',
   }}
  >
   <div
    style={{
     width: '42px',
     height: '42px',
     borderRadius: '13px',
     background: '#FFFFFF',
     border: `1px solid ${border}`,
     color: accent,
     display: 'flex',
     alignItems: 'center',
     justifyContent: 'center',
     flexShrink: 0,
    }}
   >
    <Icon size={20} strokeWidth={2} />
   </div>

   <div>
    <div
     style={{
      color: '#0B1A3F',
      fontSize: '23px',
      lineHeight: 1,
      fontWeight: '950',
     }}
    >
     {value}
    </div>

    <div
     style={{
      marginTop: '6px',
      color: accent,
      fontSize: '10px',
      fontWeight: '900',
     }}
    >
     {label}
    </div>
   </div>
  </div>
 );
}

function PriorityOverviewCard({ priority, count }) {
 const config = PRIORITY_CONFIG[priority];

    return (
     <div
      className="panel-low"
      style={{
       background: config.background,
       border: `1px solid ${config.border}`,
       borderRadius: '16px',
       padding: '16px 18px',
       boxShadow: '0 5px 14px rgba(11,26,63,0.025)',
       display: 'flex',
       alignItems: 'center',
       justifyContent: 'space-between',
       gap: '14px',
      }}
     >
       <div
        style={{
         display: 'flex',
         alignItems: 'center',
         gap: '11px',
        }}
       >
        <div
         style={{
          width: '36px',
          height: '36px',
          borderRadius: 'var(--radius-sm)',
          background: config.headerBackground,
          color: config.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
         }}
        >
         <Flag size={17} />
        </div>

        <div>
         <p
          style={{
           margin: 0,
           color: 'var(--campora-muted)',
           fontSize: '11px',
           fontWeight: '800',
          }}
         >
          {config.label}
         </p>

         <h3
          style={{
           margin: '2px 0 0',
           color: 'var(--campora-text)',
           fontSize: '19px',
           fontWeight: '900',
          }}
         >
          {count}
         </h3>
        </div>
       </div>

        <span
         className="pill"
         style={{
          fontSize: '11px',
          fontWeight: '900',
          color: config.color,
          background: config.badge,
          padding: '5px 9px',
          height: 'auto',
         }}
        >
         {config.shortLabel}
        </span>
       </div>
    );
}

function PriorityColumn({
 priority,
 tasks,
 onToggle,
 onDelete,
 onEdit,
 onCompleteAll,
 onClearAll,
}) {
 const config = PRIORITY_CONFIG[priority];

 return (
  <div
   style={{
    background: config.background,
    border: `1px solid ${config.border}`,
    borderRadius: 'var(--radius-secondary)',
    overflow: 'hidden',
    minHeight: '190px',
   }}
  >
   <div
    style={{
     padding: '13px 14px',
     background: config.headerBackground,
     borderBottom: `1px solid ${config.border}`,
    }}
   >
    <div
     style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '10px',
     }}
    >
     <div
      style={{
       display: 'flex',
       alignItems: 'center',
       gap: '8px',
      }}
     >
      <Flag size={15} color={config.color} />

      <span
       style={{
        fontWeight: '900',
        color: 'var(--campora-text)',
        fontSize: '13px',
       }}
      >
       {config.label}
      </span>
     </div>

     <span
      className="pill"
      style={{
       minWidth: '24px',
       height: '24px',
       padding: '0 7px',
       background: 'var(--surface-container-lowest)',
       color: config.color,
       display: 'inline-flex',
       alignItems: 'center',
       justifyContent: 'center',
       fontSize: '11px',
       fontWeight: '900',
      }}
     >
      {tasks.length}
     </span>
    </div>

    {tasks.length > 0 && (
     <div
      style={{
       display: 'flex',
       gap: '7px',
       marginTop: '10px',
       flexWrap: 'wrap',
      }}
     >
      <button
       type="button"
       onClick={() => onCompleteAll(priority)}
       className="btn btn-sm"
       style={{
        background: 'var(--surface-container-lowest)',
        color: 'var(--campora-navy)',
        padding: '0 9px',
       }}
      >
       <CheckCheck size={12} />
       Complete All
      </button>

      <button
       type="button"
       onClick={() => onClearAll(priority)}
       className="btn btn-sm"
       style={{
        background: 'var(--surface-container-lowest)',
        color: 'var(--campora-urgent)',
        padding: '0 9px',
       }}
      >
       <Trash2 size={12} />
       Clear All
      </button>
     </div>
    )}
   </div>

   <div
    style={{
     padding: '11px',
     display: 'flex',
     flexDirection: 'column',
     gap: '9px',
    }}
   >
    {tasks.length === 0 ? (
     <div
      style={{
       minHeight: '115px',
       display: 'flex',
       alignItems: 'center',
       justifyContent: 'center',
       textAlign: 'center',
       padding: '12px',
      }}
     >
      <p
       style={{
        margin: 0,
        color: 'var(--campora-muted)',
        fontSize: '11px',
        fontWeight: '700',
       }}
      >
       No {config.shortLabel.toLowerCase()} priority tasks
      </p>
     </div>
    ) : (
     tasks.map((task) => (
      <TaskCard
       key={task.id}
       task={task}
       onToggle={onToggle}
       onDelete={onDelete}
       onEdit={onEdit}
      />
     ))
    )}
   </div>
  </div>
 );
}

function TaskCard({
 task,
 onToggle,
 onDelete,
 onEdit,
}) {
 return (
  <div
   style={{
    background: 'var(--surface-container-lowest)',
    border: '1px solid var(--divider)',
    borderRadius: 'var(--radius-sm)',
    padding: '12px',
    boxShadow: 'var(--shadow-soft)',
   }}
  >
   <div
    style={{
     display: 'flex',
     alignItems: 'flex-start',
     gap: '10px',
    }}
   >
    <button
     type="button"
     onClick={() => onToggle(task.id)}
     style={{
      marginTop: '1px',
      padding: 0,
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      display: 'flex',
      flexShrink: 0,
     }}
    >
     <Circle size={19} color="var(--campora-navy)" />
    </button>

    <div
     style={{
      flex: 1,
      minWidth: 0,
     }}
    >
     <p
      style={{
       margin: 0,
       color: 'var(--campora-text)',
       fontWeight: '900',
       fontSize: '13px',
       lineHeight: '1.35',
       wordBreak: 'break-word',
      }}
     >
      {task.title}
     </p>

     {task.details && (
      <p
       style={{
        margin: '5px 0 0',
        color: 'var(--campora-muted)',
        fontSize: '11px',
        fontWeight: '700',
        lineHeight: '1.45',
        wordBreak: 'break-word',
       }}
      >
       {task.details}
      </p>
     )}

     {task._alertType && (
      <div
       style={{
        marginTop: '7px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '4px 7px',
        borderRadius: '999px',
        background:
         task._alertType === 'reminder'
           ? '#F7F4FC'
           : '#F3F7FD',
        color:
         task._alertType === 'reminder'
           ? '#8B78B8'
           : '#648CCB',
        fontSize: '9px',
        fontWeight: '900',
       }}
      >
       {task._alertType === 'reminder' ? (
        <AlarmClock size={10} />
       ) : (
        <Bell size={10} />
       )}

       {task._alertType === 'reminder'
         ? `Reminder${task._alertDate ? ` • ${task._alertDate}` : ''}`
         : 'Notification'}
      </div>
     )}
    </div>

    <div
     style={{
      display: 'flex',
      gap: '6px',
      flexShrink: 0,
     }}
    >
     <button
      type="button"
      onClick={() => onEdit(task)}
      title="Edit task"
      style={{
       width: '29px',
       height: '29px',
       borderRadius: 'var(--radius-sm)',
       border: 'none',
       background: 'var(--surface-container)',
       color: 'var(--campora-navy)',
       cursor: 'pointer',
       display: 'flex',
       alignItems: 'center',
       justifyContent: 'center',
      }}
     >
      <Pencil size={14} />
     </button>

     <button
      type="button"
      onClick={() => onDelete(task.id)}
      title="Delete task"
      style={{
       width: '29px',
       height: '29px',
       borderRadius: 'var(--radius-sm)',
       border: 'none',
       background: 'var(--tone-error-soft)',
       color: 'var(--campora-urgent)',
       cursor: 'pointer',
       display: 'flex',
       alignItems: 'center',
       justifyContent: 'center',
      }}
     >
      <Trash2 size={14} />
     </button>
    </div>
   </div>
  </div>
 );
}

function CompletedTask({
 task,
 onToggle,
 onDelete,
 onEdit,
}) {
 return (
  <div
   style={{
    background: 'var(--surface-container-low)',
    border: '1px solid var(--divider)',
    borderRadius: 'var(--radius-sm)',
    padding: '12px 13px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
   }}
  >
   <button
    type="button"
    onClick={() => onToggle(task.id)}
    style={{
     padding: 0,
     border: 'none',
     background: 'transparent',
     cursor: 'pointer',
     display: 'flex',
    }}
   >
    <CheckCircle2 size={19} color="var(--tone-success)" />
   </button>

   <div style={{ flex: 1 }}>
    <p
     style={{
      margin: 0,
      color: 'var(--campora-text)',
      fontWeight: '800',
      fontSize: '13px',
      opacity: 0.45,
      textDecoration: 'line-through',
     }}
    >
     {task.title}
    </p>

    {task.details && (
     <p
      style={{
       margin: '4px 0 0',
       color: 'var(--campora-muted)',
       fontSize: '11px',
       fontWeight: '700',
       textDecoration: 'line-through',
       opacity: 0.65,
      }}
     >
      {task.details}
     </p>
    )}
   </div>

   <div
    style={{
     display: 'flex',
     gap: '6px',
    }}
   >
    <button
     type="button"
     onClick={() => onEdit(task)}
     title="Edit task"
     style={{
      width: '29px',
      height: '29px',
      borderRadius: 'var(--radius-sm)',
      border: 'none',
      background: 'var(--surface-container)',
      color: 'var(--campora-navy)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
     }}
    >
     <Pencil size={14} />
    </button>

    <button
     type="button"
     onClick={() => onDelete(task.id)}
     title="Delete task"
     style={{
      width: '29px',
      height: '29px',
      borderRadius: 'var(--radius-sm)',
      border: 'none',
      background: 'var(--tone-error-soft)',
      color: 'var(--campora-urgent)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
     }}
    >
     <Trash2 size={14} />
    </button>
   </div>
  </div>
 );
}

function FormLabel({ children }) {
 return (
  <label
   style={{
    display: 'block',
    marginBottom: '7px',
    color: 'var(--campora-navy)',
    fontWeight: '900',
    fontSize: '13px',
   }}
  >
   {children}
  </label>
 );
}

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '13px 14px',
  borderRadius: 'var(--radius-sm)',
  border: '1.5px solid var(--divider)',
  outline: 'none',
  fontWeight: '700',
  color: 'var(--campora-navy)',
  background: 'var(--surface-container-lowest)',
  fontFamily: 'inherit',
  marginBottom: '17px',
};
