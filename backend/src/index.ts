import express from 'express';
import cors from 'cors';
import { PrismaClient } from './generated/prisma/client.ts';
import { TaskInputSchema } from '../../shared/index.js';
import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import process from 'node:process';

const app = express();
const port = 3000;

// Create a PostgreSQL pool for connection pooling
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Test database connection on startup
prisma.$connect()
  .then(() => {
    console.log('✅ Database connected successfully');
  })
  .catch((err) => {
    console.error('❌ Failed to connect to database:', err.message);
    console.error('Please check your DATABASE_URL in .env file');
    console.error('Make sure your Supabase project is active (not paused)');
  });

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  await pool.end();
  process.exit();
});

app.use(cors());
app.use(express.json());

// 1. GET all tasks (Ordered by newest)
app.get('/tasks', async (req, res) => {
  try {
    console.log('📥 GET /tasks request received');
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: 'desc' }
    });
    console.log(`✅ Found ${tasks.length} tasks`);
    res.json(tasks);
  } catch (err: any) {
    console.error('❌ Error fetching tasks:', err);
    console.error('Error details:', err.message);
    res.status(500).json({ error: 'Failed to fetch tasks', details: err.message });
  }
});

// 2. CREATE a task
app.post('/tasks', async (req, res) => {
  try {
    const data = TaskInputSchema.parse(req.body);
    const newTask = await prisma.task.create({
      data: {
        taskName: data.taskName,
        isCompleted: data.isCompleted
      }
    });
    res.json(newTask);
  } catch (err: any) {
    console.error('Error creating task:', err);
    if (err.name === 'ZodError') {
      res.status(400).json({ error: 'Invalid data', details: err.errors });
    } else {
      res.status(500).json({ error: 'Failed to create task' });
    }
  }
});

// 3. TOGGLE a task (Using ID, not Index)
app.patch('/tasks/:id', async (req, res) => {
  try {
    console.log('🔄 PATCH /tasks/:id request received, id:', req.params.id);
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      console.log('❌ Invalid ID');
      return res.status(400).json({ error: 'Invalid ID' });
    }
    
    // Find it first to know current status
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      console.log('❌ Task not found');
      return res.status(404).json({ error: 'Task not found' });
    }

    // Update it
    const updated = await prisma.task.update({
      where: { id },
      data: { isCompleted: !task.isCompleted }
    });
    
    console.log(`✅ Task ${id} toggled to ${updated.isCompleted}`);
    res.json(updated);
  } catch (err: any) {
    console.error('❌ Error toggling task:', err);
    console.error('Error details:', err.message);
    res.status(500).json({ error: 'Failed to toggle task', details: err.message });
  }
});

// 4. DELETE a task
app.delete('/tasks/:id', async (req, res) => {
  try {
    console.log('🗑️  DELETE /tasks/:id request received, id:', req.params.id);
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      console.log('❌ Invalid ID');
      return res.status(400).json({ error: 'Invalid ID' });
    }
    
    await prisma.task.delete({ where: { id } });
    console.log(`✅ Task ${id} deleted`);
    res.status(204).send();
  } catch (err: any) {
    console.error('❌ Error deleting task:', err);
    console.error('Error details:', err.message);
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'Task not found' });
    } else {
      res.status(500).json({ error: 'Failed to delete task', details: err.message });
    }
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});