# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Keep route-specific rendering in the existing React components and share API loading, empty, and error states through `CapabilityCard`; use `getJson` for all requests.
- Logic tier decision: Keep HTTP handling in the Express API router and validation/business rules in explicit service functions. Return deliberate 4xx responses for invalid or unknown references.
- Data tier decision: Require meaningful fields in Mongoose schemas, normalize and uniquely index valid user emails, default team members to an empty array, and retain the idempotent, non-destructive seed behavior.
- Activity tracking approach: Validate IDs and input before querying, confirm the user belongs to the selected team, then store the activity with points equal to submitted minutes and the current time.
- Team management approach: Require a name and mascot, validate member IDs against existing users, assign each user to only one team, and keep `User.team` and `Team.members` synchronized.
- Leaderboard approach: Sum activity points by team, include teams with no activity at zero, sort by total points descending with team name as a stable tie-breaker, and assign 1-based ranks.
- Workout suggestions approach: Find the user by email, prefer workouts matching their fitness goal, fall back to their most recent activity type when available, and include a recommendation reason; return 404 for an unknown user.

## Test plan

- `npm run test:data --prefix octofit-tracker/backend`: passed, 5 tests; covers schema validation, unique normalized emails, and idempotent seeding.
- `npm run test:api --prefix octofit-tracker/backend`: passed, 4 tests; covers API validation, consistent team membership, persistence, leaderboard ordering, and recommendations.
- `npm test --prefix octofit-tracker/frontend`: passed, 15 tests; covers API rendering and loading, empty, and error states for each view.
- `npm run build --prefix octofit-tracker/backend`: passed TypeScript compilation.
- `npm run build --prefix octofit-tracker/frontend`: passed TypeScript compilation and Vite production build.
