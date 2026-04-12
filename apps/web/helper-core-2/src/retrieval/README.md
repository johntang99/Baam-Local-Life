# Retrieval Refactor Plan

`baam.ts` grew too large to safely iterate on.  
The refactor strategy is to split by **domain rules** while keeping orchestration in `baam.ts`.

## Current split

- `baam.ts`
  - Orchestration, querying Supabase, merge/sort pipeline, final source shaping.
- `rules/legal.ts`
  - Legal-intent detection and legal specialty boundary functions.
- `rules/medical.ts`
  - Medical/query detection, medical specialty boundary functions, supportive/fallback helpers.
- `rules/food.ts`
  - Restaurant/cuisine detection, cuisine profile matching, and food-specific boundary helpers.

## Next splits (recommended order)

1. `rules/common.ts`
   - shared text helpers used by multiple domains

## Guardrails

- Keep behavior parity while moving code.
- Run lints and targeted query regression after each split.
- Move small coherent groups only (no big-bang rewrite).

