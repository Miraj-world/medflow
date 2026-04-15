# MedFlow Backend

Node.js + Express backend for the MedFlow healthcare dashboard.

## Scripts

`npm install`

`npm run migrate`

`npm run seed`

`npm start`

## Required Environment Variables

- `DATABASE_URL`
- `JWT_SECRET`
- `PORT` optional locally, required by Render at runtime
- `FRONTEND_URL` optional for CORS
- `DATABASE_USE_SSL` set to `true` on Render, `false` locally

## Notes

- The API binds to `0.0.0.0` and reads `process.env.PORT`.
- Migrations are raw SQL files stored in `db/migrations/`.
- `npm run reset-db` drops and recreates the schema, then reapplies migrations.
