import { pgEnum, pgTable, serial, text, timestamp, integer, jsonb, unique, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const matchStatus = pgEnum('match_status', ['scheduled', 'live', 'finished']);

export const matches = pgTable('matches', {
  id: serial('id').primaryKey(),
  sport: text('sport').notNull(),
  homeTeam: text('home_team').notNull(),
  awayTeam: text('away_team').notNull(),
  status: matchStatus('status').notNull().default('scheduled'),
  startTime: timestamp('start_time', { withTimezone: true }),
  endTime: timestamp('end_time', { withTimezone: true }),
  homeScore: integer('home_score').notNull().default(0),
  awayScore: integer('away_score').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  return {
    chkHomeScoreNonneg: check('chk_home_score_nonneg', sql`${table.homeScore} >= 0`),
    chkAwayScoreNonneg: check('chk_away_score_nonneg', sql`${table.awayScore} >= 0`),
  };
});

export const commentary = pgTable('commentary', {
  id: serial('id').primaryKey(),
  matchId: integer('match_id').notNull().references(() => matches.id, { onDelete: 'cascade' }),
  minute: integer('minute'),
  sequence: integer('sequence').notNull(),
  period: text('period'),
  eventType: text('event_type'),
  actor: text('actor'),
  team: text('team'),
  message: text('message').notNull(),
  metadata: jsonb('metadata'),
  tags: text('tags').array(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  return {
    matchSequenceUnique: unique().on(table.matchId, table.sequence),
    chkMinuteNonneg: check('chk_minute_nonneg', sql`${table.minute} >= 0`),
    chkSequenceNonneg: check('chk_sequence_nonneg', sql`${table.sequence} >= 0`),
  };
});
