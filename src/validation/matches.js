import { z } from 'zod';

export const MATCH_STATUS = {
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  FINISHED: 'finished',
};

export const listMatchesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const matchIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createMatchSchema = z.object({
  sport: z.string({ message: 'Sport is required' }).trim().min(1, 'Sport is required'),
  homeTeam: z.string({ message: 'Home team is required' }).trim().min(1, 'Home team is required'),
  awayTeam: z.string({ message: 'Away team is required' }).trim().min(1, 'Away team is required'),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  homeScore: z.coerce.number().int().nonnegative().optional(),
  awayScore: z.coerce.number().int().nonnegative().optional(),
}).superRefine((data, ctx) => {
  if (data.startTime) {
    if (isNaN(Date.parse(data.startTime))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'startTime must be a valid ISO date string',
        path: ['startTime'],
      });
    }
  }
  if (data.endTime) {
    if (isNaN(Date.parse(data.endTime))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'endTime must be a valid ISO date string',
        path: ['endTime'],
      });
    }
  }
  if (data.startTime && data.endTime) {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    if (end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'endTime must be after startTime',
        path: ['endTime'],
      });
    }
  }
});

export const updateScoreSchema = z.object({
  homeScore: z.coerce.number().int().nonnegative(),
  awayScore: z.coerce.number().int().nonnegative(),
});
