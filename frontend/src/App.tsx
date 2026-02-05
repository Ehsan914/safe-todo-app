import { useState, useEffect } from 'react';
import { type Task } from '../../shared/index'; // .js extension handled by bundler usually, or keep .js if required
import { api } from './api'; // 👈 Using our SDK
import './App.css';

const App = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // 1. Load Tasks
  useEffect(() => {
    api.getTasks()
      .then((data) => {
        setTasks(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  // 2. Add Task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    api.addTask(title)
      .then((newTask) => {
        setTasks([...tasks, newTask]);
        setTitle('');
      })
      .catch((err) => {
        console.error('Failed to add task:', err);
        alert('Failed to add task. Please try again.');
      });
  };

  // 3. Toggle Task (Using Index)
  const toggleTask = (id: number) => { 
    if (!id) return;
    api.toggleTask(id)
      .then((updatedTask) => {
        setTasks(tasks.map((t) => (t.id === id ? updatedTask : t)));
      })
      .catch((err) => {
        console.error('Failed to toggle task:', err);
      });
  };

  // 4. Delete Task (Using Index)
  const deleteTask = (id: number) => {
    if (!id) return;
    api.deleteTask(id)
      .then(() => {
        setTasks(tasks.filter((t) => t.id !== id));
      })
      .catch((err) => {
        console.error('Failed to delete task:', err);
      });
  };

  const completedCount = tasks.filter((t) => t.isCompleted).length;
  const totalCount = tasks.length;
  const progress = totalCount === 0 ? 0 : (completedCount / totalCount) * 125.6;

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <div className="header-content">
            <h1 className="title">
              <span className="title-icon">✦</span>
              My Tasks
            </h1>
            <p className="subtitle">Stay organized, stay focused</p>
          </div>
          {totalCount > 0 && (
            <div className="progress-badge">
              <span className="progress-text">
                {completedCount} / {totalCount}
              </span>
              <div className="progress-ring">
                <svg width="48" height="48">
                  <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="3" />
                  <circle
                    cx="24" cy="24" r="20" fill="none" stroke="#d4a574" strokeWidth="3"
                    strokeDasharray={`${progress} 125.6`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 0.5s ease' }}
                  />
                </svg>
              </div>
            </div>
          )}
        </header>

        <form onSubmit={handleAddTask} className="input-section">
          <div className="input-wrapper">
            <input
              type="text"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="task-input"
            />
            <button type="submit" className="add-button">
              <span className="add-icon">+</span>
            </button>
          </div>
        </form>

        <div className="tasks-container">
          {isLoading ? (
            <div className="loading"><div className="spinner"></div></div>
          ) : tasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <p className="empty-text">No tasks yet</p>
              <p className="empty-subtext">Add your first task to get started</p>
            </div>
          ) : (
            <ul className="tasks-list">
              {tasks.map((task, index) => (
                <li
                  key={task.id}
                  className={`task-item ${task.isCompleted ? 'completed' : ''}`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <button
                    className="checkbox"
                    onClick={() => toggleTask(task.id)}
                  >
                    <svg viewBox="0 0 24 24" className="checkmark"><path d="M5 12l5 5L20 7" /></svg>
                  </button>
                  
                  <span className="task-title">{task.taskName}</span>
                  
                  <button
                    className="delete-button"
                    onClick={() => deleteTask(task.id)}
                  >
                    <svg viewBox="0 0 24 24" className="delete-icon"><path d="M6 6l12 12M18 6L6 18" /></svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
