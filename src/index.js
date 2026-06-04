import express from 'express';
import { eq, desc } from 'drizzle-orm';
import { db, pool } from './db/db.js';
import { matches, commentary } from './db/schema.js';

const app = express();
const PORT = 8000;

const ALLOWED_STATUS_VALUES = ['scheduled', 'live', 'finished'];

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Welcome to Sportz Real-Time Application!');
});

function validateId(req, res, paramName) {
  const id = parseInt(req.params[paramName], 10);
  if (!Number.isInteger(id) || isNaN(id)) {
    res.status(400).json({ error: `Invalid ${paramName}` });
    return null;
  }
  return id;
}

function validateMatchPayload(payload, isUpdate = false) {
  const errors = [];
  
  if (!isUpdate) {
    if (!payload.sport || typeof payload.sport !== 'string') {
      errors.push('sport is required and must be a string');
    }
    if (!payload.homeTeam || typeof payload.homeTeam !== 'string') {
      errors.push('homeTeam is required and must be a string');
    }
    if (!payload.awayTeam || typeof payload.awayTeam !== 'string') {
      errors.push('awayTeam is required and must be a string');
    }
    if (!payload.status || !ALLOWED_STATUS_VALUES.includes(payload.status)) {
      errors.push(`status is required and must be one of: ${ALLOWED_STATUS_VALUES.join(', ')}`);
    }
  } else {
    if (payload.status && !ALLOWED_STATUS_VALUES.includes(payload.status)) {
      errors.push(`status must be one of: ${ALLOWED_STATUS_VALUES.join(', ')}`);
    }
  }
  
  if (payload.startTime !== undefined) {
    const date = new Date(payload.startTime);
    if (isNaN(date.getTime())) {
      errors.push('startTime must be a valid date');
    }
  }
  
  if (payload.endTime !== undefined) {
    const date = new Date(payload.endTime);
    if (isNaN(date.getTime())) {
      errors.push('endTime must be a valid date');
    }
  }
  
  if (payload.homeScore !== undefined && (typeof payload.homeScore !== 'number' || payload.homeScore < 0)) {
    errors.push('homeScore must be a non-negative number');
  }
  
  if (payload.awayScore !== undefined && (typeof payload.awayScore !== 'number' || payload.awayScore < 0)) {
    errors.push('awayScore must be a non-negative number');
  }
  
  return errors;
}

app.get('/matches', async (req, res) => {
  try {
    const allMatches = await db.select().from(matches).orderBy(desc(matches.createdAt));
    res.json(allMatches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

app.get('/matches/:id', async (req, res) => {
  const id = validateId(req, res, 'id');
  if (id === null) return;
  
  try {
    const match = await db.select().from(matches).where(eq(matches.id, id));
    if (match.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }
    res.json(match[0]);
  } catch (error) {
    console.error('Error fetching match:', error);
    res.status(500).json({ error: 'Failed to fetch match' });
  }
});

app.post('/matches', async (req, res) => {
  const validationErrors = validateMatchPayload(req.body);
  if (validationErrors.length > 0) {
    return res.status(400).json({ error: validationErrors.join('; ') });
  }
  
  try {
    const { sport, homeTeam, awayTeam, status, startTime, endTime, homeScore, awayScore } = req.body;
    const [newMatch] = await db
      .insert(matches)
      .values({
        sport,
        homeTeam,
        awayTeam,
        status,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        homeScore,
        awayScore,
      })
      .returning();
    res.status(201).json(newMatch);
  } catch (error) {
    console.error('Error creating match:', error);
    res.status(500).json({ error: 'Failed to create match' });
  }
});

app.put('/matches/:id', async (req, res) => {
  const id = validateId(req, res, 'id');
  if (id === null) return;
  
  const validationErrors = validateMatchPayload(req.body, true);
  if (validationErrors.length > 0) {
    return res.status(400).json({ error: validationErrors.join('; ') });
  }
  
  try {
    const { sport, homeTeam, awayTeam, status, startTime, endTime, homeScore, awayScore } = req.body;
    const [updatedMatch] = await db
      .update(matches)
      .set({
        sport,
        homeTeam,
        awayTeam,
        status,
        startTime: startTime !== undefined ? new Date(startTime) : undefined,
        endTime: endTime !== undefined ? new Date(endTime) : undefined,
        homeScore,
        awayScore,
      })
      .where(eq(matches.id, id))
      .returning();
    if (!updatedMatch) {
      return res.status(404).json({ error: 'Match not found' });
    }
    res.json(updatedMatch);
  } catch (error) {
    console.error('Error updating match:', error);
    res.status(500).json({ error: 'Failed to update match' });
  }
});

app.delete('/matches/:id', async (req, res) => {
  const id = validateId(req, res, 'id');
  if (id === null) return;
  
  try {
    const result = await db
      .delete(matches)
      .where(eq(matches.id, id))
      .returning();
    if (result.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting match:', error);
    res.status(500).json({ error: 'Failed to delete match' });
  }
});

app.get('/matches/:matchId/commentary', async (req, res) => {
  const matchId = validateId(req, res, 'matchId');
  if (matchId === null) return;
  
  try {
    const allCommentary = await db
      .select()
      .from(commentary)
      .where(eq(commentary.matchId, matchId))
      .orderBy(commentary.sequence);
    res.json(allCommentary);
  } catch (error) {
    console.error('Error fetching commentary:', error);
    res.status(500).json({ error: 'Failed to fetch commentary' });
  }
});

app.post('/matches/:matchId/commentary', async (req, res) => {
  const matchId = validateId(req, res, 'matchId');
  if (matchId === null) return;
  
  try {
    const { minute, sequence, period, eventType, actor, team, message, metadata, tags } = req.body;
    const [newCommentary] = await db
      .insert(commentary)
      .values({
        matchId,
        minute,
        sequence,
        period,
        eventType,
        actor,
        team,
        message,
        metadata,
        tags,
      })
      .returning();
    res.status(201).json(newCommentary);
  } catch (error) {
    console.error('Error creating commentary:', error);
    // Error handling for PostgreSQL constraints
    if (error.code === '23503') { // Foreign key violation (match doesn't exist)
      return res.status(404).json({ error: 'Match not found' });
    }
    if (error.code === '23505') { // Unique violation (duplicate sequence for match)
      return res.status(409).json({ error: 'Duplicate sequence number for this match' });
    }
    res.status(500).json({ error: 'Failed to create commentary' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
