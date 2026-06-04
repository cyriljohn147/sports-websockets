import express from 'express';
import { eq, desc } from 'drizzle-orm';
import { db, pool } from './db/db.js';
import { matches, commentary } from './db/schema.js';

const app = express();
const PORT = 8000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Welcome to Sportz Real-Time Application!');
});

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
  try {
    const match = await db.select().from(matches).where(eq(matches.id, parseInt(req.params.id)));
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
  try {
    const { sport, homeTeam, awayTeam, status, startTime, endTime, homeScore, awayScore } = req.body;
    const [updatedMatch] = await db
      .update(matches)
      .set({
        sport,
        homeTeam,
        awayTeam,
        status,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        homeScore,
        awayScore,
      })
      .where(eq(matches.id, parseInt(req.params.id)))
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
  try {
    const result = await db
      .delete(matches)
      .where(eq(matches.id, parseInt(req.params.id)))
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
  try {
    const allCommentary = await db
      .select()
      .from(commentary)
      .where(eq(commentary.matchId, parseInt(req.params.matchId)))
      .orderBy(commentary.sequence);
    res.json(allCommentary);
  } catch (error) {
    console.error('Error fetching commentary:', error);
    res.status(500).json({ error: 'Failed to fetch commentary' });
  }
});

app.post('/matches/:matchId/commentary', async (req, res) => {
  try {
    const { minute, sequence, period, eventType, actor, team, message, metadata, tags } = req.body;
    const [newCommentary] = await db
      .insert(commentary)
      .values({
        matchId: parseInt(req.params.matchId),
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
    res.status(500).json({ error: 'Failed to create commentary' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
