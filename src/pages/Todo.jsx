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
} from 'lucide-react';

import {
  getTodosForCurrentUser,
  addTodo,
  toggleTodo,
  deleteTodo,
} from '../lib/queries';

export default function Todo() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');

  useEffect(() => {
    async function loadTasks() {
      try {
        const data = await getTodosForCurrentUser();
        setTasks(data);
      } catch (error) {
        console.error(error);
      }
    }

    loadTasks();
  }, []);

  const addTask = async () => {
    const title = newTask.trim();
    if (!title) return;

    try {
      const savedTask = await addTodo(title);
      setTasks((current) => [savedTask, ...current]);
      setNewTask('');
    } catch (error) {
      console.error(error);
    }
  };

  const toggleTask = async (id) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    try {
      const updated = await toggleTodo(id, !task.completed);

      setTasks((current) =>
        current.map((t) => (t.id === id ? updated : t))
      );
    } catch (error) {
      console.error(error);
    }
  };

  const deleteTask = async (id) => {
    try {
      await deleteTodo(id);
      setTasks((current) => current.filter((t) => t.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  const completedCount = useMemo(
    () => tasks.filter((task) => task.completed).length,
    [tasks]
  );

  const remainingCount = tasks.length - completedCount;

  const progress =
    tasks.length === 0
      ? 0
      : Math.round((completedCount / tasks.length) * 100);

  return (
    <div style={{ width: '100%' }}>
      {/* HEADER */}
      <div
        style={{
          marginBottom: '22px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '20px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 11px',
              borderRadius: '999px',
              background: '#F1F2FF',
              color: '#6366F1',
              fontWeight: '900',
              fontSize: '12px',
              marginBottom: '10px',
            }}
          >
            <Sparkles size={14} />
            Stay Productive
          </div>

          <h1
            style={{
              fontSize: '38px',
              fontWeight: '900',
              color: '#0B1A3F',
              marginBottom: '6px',
            }}
          >
            To-Do List
          </h1>

          <p
            style={{
              color: '#8F9BB3',
              fontWeight: '700',
              maxWidth: '560px',
              lineHeight: '1.5',
              margin: 0,
            }}
          >
            Keep your tasks organized, celebrate your progress, and make your
            day feel a little lighter.
          </p>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '14px',
          marginBottom: '16px',
        }}
      >
        <SummaryCard
          icon={<ListTodo size={21} />}
          label="Total Tasks"
          value={tasks.length}
          background="#F3F1FF"
          iconBackground="#E4E0FF"
          iconColor="#6366F1"
        />

        <SummaryCard
          icon={<Target size={21} />}
          label="Remaining"
          value={remainingCount}
          background="#EEF8FF"
          iconBackground="#DCEFFF"
          iconColor="#4A90E2"
        />

        <SummaryCard
          icon={<Trophy size={21} />}
          label="Completed"
          value={completedCount}
          background="#ECFBF6"
          iconBackground="#D8F7EC"
          iconColor="#05CD99"
        />
      </div>

      {/* PROGRESS */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0B1A3F, #22386F)',
          borderRadius: '22px',
          padding: '18px 22px',
          marginBottom: '16px',
          color: 'white',
          boxShadow: '0 16px 38px rgba(11, 26, 63, 0.12)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
            gap: '20px',
          }}
        >
          <div>
            <p
              style={{
                margin: '0 0 3px',
                fontWeight: '900',
                fontSize: '15px',
                color: 'white',
              }}
            >
              Your Progress
            </p>

            <p
              style={{
                margin: 0,
                color: 'rgba(255,255,255,0.70)',
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
              color: 'white',
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
              background: '#B8B7FF',
              borderRadius: '999px',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* ADD TASK */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1.5px solid #E9EDF7',
          borderRadius: '22px',
          padding: '18px 20px',
          marginBottom: '16px',
          boxShadow: '0 12px 30px rgba(81, 95, 160, 0.05)',
        }}
      >
        <p
          style={{
            margin: '0 0 11px',
            color: '#0B1A3F',
            fontWeight: '900',
            fontSize: '14px',
          }}
        >
          What do you need to get done?
        </p>

        <div
          style={{
            display: 'flex',
            gap: '10px',
          }}
        >
          <input
            type="text"
            placeholder="Add a new task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addTask();
            }}
            style={{
              flex: 1,
              padding: '13px 15px',
              borderRadius: '13px',
              border: '1.5px solid #E2E8F0',
              outline: 'none',
              fontWeight: '700',
              color: '#0B1A3F',
              background: '#FAFBFF',
              fontFamily: 'inherit',
            }}
          />

          <button
            type="button"
            onClick={addTask}
            style={{
              border: 'none',
              background: 'linear-gradient(135deg, #6366F1, #7C6BF2)',
              color: 'white',
              borderRadius: '13px',
              padding: '0 20px',
              fontWeight: '900',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              boxShadow: '0 9px 20px rgba(99, 102, 241, 0.20)',
            }}
          >
            <Plus size={17} />
            Add Task
          </button>
        </div>
      </div>

      {/* TASK LIST */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '22px',
          padding: '20px',
          minHeight: '220px',
          border: '1.5px solid #E9EDF7',
          boxShadow: '0 12px 30px rgba(81, 95, 160, 0.05)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '14px',
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '17px',
                fontWeight: '900',
                color: '#0B1A3F',
              }}
            >
              Your Tasks
            </h3>

            <p
              style={{
                margin: '3px 0 0',
                color: '#A3AED0',
                fontSize: '12px',
                fontWeight: '700',
              }}
            >
              Click a task to mark it as complete.
            </p>
          </div>

          <div
            style={{
              padding: '7px 10px',
              borderRadius: '999px',
              background: '#F1F3FF',
              color: '#6366F1',
              fontSize: '11px',
              fontWeight: '900',
            }}
          >
            {remainingCount} left
          </div>
        </div>

        {tasks.length === 0 ? (
          <div
            style={{
              minHeight: '150px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '58px',
                height: '58px',
                borderRadius: '19px',
                background: '#F1F2FF',
                color: '#6366F1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
              }}
            >
              <CheckCircle2 size={27} />
            </div>

            <h3
              style={{
                margin: '0 0 6px',
                color: '#0B1A3F',
                fontSize: '16px',
                fontWeight: '900',
              }}
            >
              Your list is clear
            </h3>

            <p
              style={{
                margin: 0,
                color: '#A3AED0',
                fontWeight: '700',
                fontSize: '13px',
              }}
            >
              Add your first task above and start organizing your day.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {tasks.map((task, index) => {
              const pastelBackgrounds = [
                '#F7F5FF',
                '#F2F8FF',
                '#FFF7F1',
                '#F1FBF7',
                '#FFF3F7',
              ];

              const background =
                pastelBackgrounds[index % pastelBackgrounds.length];

              return (
                <div
                  key={task.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '13px 15px',
                    borderRadius: '16px',
                    background: task.completed ? '#F8FAFF' : background,
                    border: '1px solid #EDF1F7',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div
                    onClick={() => toggleTask(task.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '11px',
                      cursor: 'pointer',
                      flex: 1,
                    }}
                  >
                    {task.completed ? (
                      <CheckCircle2 size={20} color="#05CD99" />
                    ) : (
                      <Circle size={20} color="#7C6BF2" />
                    )}

                    <span
                      style={{
                        fontWeight: '800',
                        color: '#0B1A3F',
                        textDecoration: task.completed
                          ? 'line-through'
                          : 'none',
                        opacity: task.completed ? 0.45 : 1,
                      }}
                    >
                      {task.title}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteTask(task.id)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '10px',
                      border: 'none',
                      background: '#FFF0F0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={15} color="#EE5D50" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  background,
  iconBackground,
  iconColor,
}) {
  return (
    <div
      style={{
        background,
        borderRadius: '20px',
        padding: '16px 18px',
        border: '1px solid #E9EDF7',
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '13px',
          background: iconBackground,
          color: iconColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '11px',
        }}
      >
        {icon}
      </div>

      <p
        style={{
          margin: '0 0 3px',
          color: '#8F9BB3',
          fontSize: '12px',
          fontWeight: '800',
        }}
      >
        {label}
      </p>

      <h3
        style={{
          margin: 0,
          color: '#0B1A3F',
          fontSize: '23px',
          fontWeight: '900',
        }}
      >
        {value}
      </h3>
    </div>
  );
}