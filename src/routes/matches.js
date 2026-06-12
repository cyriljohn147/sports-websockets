import {Router} from 'express';
import { createMatchSchema, listMatchesQuerySchema } from '../validation/matches.js';
import {matches} from '../db/schema.js';
import {db} from '../db/db.js';
import {getMatchStatus} from '../utils/match-status.js';
import { desc } from 'drizzle-orm';


export const matchesRouter = Router();

matchesRouter.use((req, res, next) => {
    console.log(`${req.method} ${req.path}, body:`, req.body);
    next();
});

matchesRouter.get('/', async (req, res) => {
    const parsed = listMatchesQuerySchema.safeParse(req.query);
    if(!parsed.success) {
        return res.status(400).json({ 
            message: 'Invalid query parameters', 
            details: parsed.error.issues.map(issue => issue.message) 
        });
    }

    const limit = parsed.data.limit ?? 50;

    try {
        const data = await db.select().from(matches).orderBy(desc(matches.createdAt)).limit(limit);
        res.status(200).json({ data });
    } catch(e) {
        return res.status(500).json({ 
            message: 'Failed to fetch matches', 
            details: e.message 
        });
    }
});

matchesRouter.post('/', async (req, res) => {
    const requestBody = req.body || {};
    const parsed = createMatchSchema.safeParse(requestBody);

    if (!parsed.success) {
        const errors = {};
        parsed.error.issues.forEach(issue => {
            const path = issue.path.join('.');
            errors[path] = issue.message;
        });
        
        return res.status(400).json({ 
            message: 'Invalid match data', 
            details: errors 
        });
    }

    try {
        const { sport, homeTeam, awayTeam, startTime, endTime, homeScore, awayScore } = parsed.data;
        
        const startDate = startTime ? new Date(startTime) : undefined;
        const endDate = endTime ? new Date(endTime) : undefined;

        const [event] = await db.insert(matches).values({
            sport,
            homeTeam,
            awayTeam,
            startTime: startDate,
            endTime: endDate,
            homeScore: homeScore ?? 0,
            awayScore: awayScore ?? 0,
            status: startTime && endTime ? getMatchStatus(startTime, endTime) : 'scheduled',
        }).returning();
        
        res.status(201).json({data: event});
    } catch(e) {
        return res.status(500).json({ 
            message: 'Internal server error', 
            details: e.message 
        });
    }
});
