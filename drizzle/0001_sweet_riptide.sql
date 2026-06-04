ALTER TABLE "commentary" ADD CONSTRAINT "chk_minute_nonneg" CHECK ("commentary"."minute" >= 0);--> statement-breakpoint
ALTER TABLE "commentary" ADD CONSTRAINT "chk_sequence_nonneg" CHECK ("commentary"."sequence" >= 0);--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "chk_home_score_nonneg" CHECK ("matches"."home_score" >= 0);--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "chk_away_score_nonneg" CHECK ("matches"."away_score" >= 0);