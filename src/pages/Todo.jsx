import React, { useEffect, useState } from 'react';
import { Plus, CheckCircle2, Circle, Trash2 } from 'lucide-react';
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

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1
          style={{
            fontSize: '40px',
            fontWeight: '900',
            color: '#0B1A3F',
            marginBottom: '8px',
          }}
        >
          To-Do List
        </h1>

        <p
          style={{
            color: '#A3AED0',
            fontWeight: '700',
          }}
        >
          Keep track of your personal tasks and priorities.
        </p>
      </div>

      <div
        className="card"
        style={{
          border: '1.5px solid #E9EDF7',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '12px',
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
              padding: '14px 16px',
              borderRadius: '12px',
              border: '1.5px solid #E2E8F0',
              outline: 'none',
              fontWeight: '700',
              color: '#0B1A3F',
            }}
          />

          <button
            type="button"
            onClick={addTask}
            style={{
              border: 'none',
              background: '#0B1A3F',
              color: 'white',
              borderRadius: '12px',
              padding: '0 18px',
              fontWeight: '900',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Plus size={18} />
            Add
          </button>
        </div>
      </div>

      <div
        className="card"
        style={{
          minHeight: '360px',
          border: '1.5px solid #E9EDF7',
        }}
      >
        {tasks.length === 0 ? (
          <div
            style={{
              minHeight: '320px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              color: '#A3AED0',
              fontWeight: '800',
            }}
          >
            No tasks yet. Add your first to-do above.
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {tasks.map((task) => (
              <div
                key={task.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  background: task.completed ? '#F8FAFF' : 'white',
                  border: '1px solid #EDF1F7',
                }}
              >
                <div
                  onClick={() => toggleTask(task.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    flex: 1,
                  }}
                >
                  {task.completed ? (
                    <CheckCircle2 size={20} color="#05CD99" />
                  ) : (
                    <Circle size={20} color="#A3AED0" />
                  )}

                  <span
                    style={{
                      fontWeight: '800',
                      color: '#0B1A3F',
                      textDecoration: task.completed
                        ? 'line-through'
                        : 'none',
                      opacity: task.completed ? 0.5 : 1,
                    }}
                  >
                    {task.title}
                  </span>
                </div>

                <Trash2
                  size={18}
                  color="#EE5D50"
                  onClick={() => deleteTask(task.id)}
                  style={{ cursor: 'pointer' }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}