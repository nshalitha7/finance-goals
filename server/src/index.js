import express from 'express';
import cors from 'cors';
import db from './db.js';
import { z } from 'zod';
import { computeGoalMetrics, whatIfProjection } from './analytics.js';

const app = express();
app.use(cors());
app.use(express.json());

const goalSchema = z.object({
  name: z.string().min(2), category: z.string().min(2),
  target_amount: z.number().positive(), target_date: z.string(), start_date: z.string()
});
const txnSchema = z.object({
  amount: z.number().positive(), type: z.enum(['deposit', 'withdrawal']), note: z.string().optional(), transaction_date: z.string()
});

function enrich(goal) {
  const txns = db.prepare('SELECT * FROM transactions WHERE goal_id=? ORDER BY transaction_date ASC').all(goal.id);
  const metrics = computeGoalMetrics(goal, txns);
  return { ...goal, transactions: txns, metrics };
}

app.get('/api/goals', (req, res) => {
  const goals = db.prepare('SELECT * FROM goals ORDER BY created_at DESC').all().map(enrich);
  const summary = {
    totalSaved: goals.reduce((s, g) => s + g.metrics.totalSaved, 0),
    averageMonthlyContribution: goals.length ? goals.reduce((s, g) => s + g.metrics.averageMonthlyContribution, 0) / goals.length : 0,
    completionRate: goals.length ? (goals.filter(g => g.metrics.achieved).length / goals.length) * 100 : 0
  };
  res.json({ goals, summary });
});

app.post('/api/goals', (req, res) => {
  const parsed = goalSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const now = new Date().toISOString();
  const stmt = db.prepare('INSERT INTO goals(name,category,target_amount,target_date,start_date,created_at,updated_at) VALUES(?,?,?,?,?,?,?)');
  const info = stmt.run(parsed.data.name, parsed.data.category, parsed.data.target_amount, parsed.data.target_date, parsed.data.start_date, now, now);
  const goal = db.prepare('SELECT * FROM goals WHERE id=?').get(info.lastInsertRowid);
  res.status(201).json(enrich(goal));
});
app.put('/api/goals/:id', (req, res) => {
  const parsed = goalSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const now = new Date().toISOString();
  const info = db.prepare('UPDATE goals SET name=?,category=?,target_amount=?,target_date=?,start_date=?,updated_at=? WHERE id=?').run(parsed.data.name, parsed.data.category, parsed.data.target_amount, parsed.data.target_date, parsed.data.start_date, now, req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Not found' });
  res.json(enrich(db.prepare('SELECT * FROM goals WHERE id=?').get(req.params.id)));
});
app.delete('/api/goals/:id', (req, res) => {
  const info = db.prepare('DELETE FROM goals WHERE id=?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Not found' });
  res.status(204).send();
});
app.post('/api/goals/:id/transactions', (req, res) => {
  const parsed = txnSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const goal = db.prepare('SELECT * FROM goals WHERE id=?').get(req.params.id);
  if (!goal) return res.status(404).json({ error: 'Goal not found' });
  const now = new Date().toISOString();
  db.prepare('INSERT INTO transactions(goal_id,amount,type,note,transaction_date,created_at) VALUES(?,?,?,?,?,?)').run(req.params.id, parsed.data.amount, parsed.data.type, parsed.data.note || '', parsed.data.transaction_date, now);
  res.status(201).json(enrich(goal));
});
app.get('/api/goals/:id/what-if', (req, res) => {
  const monthly = Number(req.query.monthly || 0);
  const goal = db.prepare('SELECT * FROM goals WHERE id=?').get(req.params.id);
  if (!goal) return res.status(404).json({ error: 'Goal not found' });
  const metrics = enrich(goal).metrics;
  res.json({ projectedDate: whatIfProjection(goal, metrics.totalSaved, monthly) });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API on ${port}`));
