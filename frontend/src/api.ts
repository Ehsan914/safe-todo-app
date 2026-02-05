import { type Task, TaskInputSchema } from '../../shared/index';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = {
  // 1. Get all tasks
  getTasks: async (): Promise<Task[]> => {
    try {
      const res = await fetch(`${API_URL}/tasks`);
      if (!res.ok) {
        console.error('Failed to fetch tasks:', await res.text());
        return [];
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  },

  // 2. Add a new task
  addTask: async (title: string): Promise<Task> => {
    // We can even use Zod here to validate BEFORE sending!
    // If this fails, we never even bother the server.
    const cleanTitle = TaskInputSchema.pick({ taskName: true }).parse({ taskName: title });

    const res = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taskName: cleanTitle.taskName,
        isCompleted: false,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to add task');
    }

    return res.json();
  },

  // 3. Delete a task
  deleteTask: async (index: number): Promise<void> => {
    const res = await fetch(`${API_URL}/tasks/${index}`, {
      method: 'DELETE',
    });
    
    if (!res.ok && res.status !== 204) {
      const error = await res.json().catch(() => ({ error: 'Failed to delete task' }));
      throw new Error(error.error || 'Failed to delete task');
    }
  },

  // 4. Toggle task completion
  toggleTask: async (index: number): Promise<Task> => {
    const res = await fetch(`${API_URL}/tasks/${index}`, {
      method: 'PATCH',
    });
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Failed to toggle task' }));
      throw new Error(error.error || 'Failed to toggle task');
    }
    
    return res.json();
  }
};