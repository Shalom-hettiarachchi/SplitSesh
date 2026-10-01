# JointAccount

Shared consumption tracker & settlement log, rebuilt from the cigarette-sharing Excel sheet — generalized so cigarettes (sticks), weed (grams), or anything else split by the unit all work the same way. Has login with two roles: **host (admin)** and **friends**.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind
- MongoDB (official `mongodb` driver, no ORM)
- Auth: signed httpOnly JWT cookie (`jose`) + bcrypt password hashes, no third-party auth service

## How the model works

A **Batch** replaces "Pack": it has a `unit` (`stick`, `gram`, or custom), a `quantity`, and a `totalCost` — cost-per-unit is derived (`totalCost / quantity`), same as the sheet's "Cost Per Stick". A weed batch is just `unit: gram, quantity: 10, totalCost: 50000` → 5,000/gram.

Each **session log** entry records a round: total amount consumed + which members were in on it. The per-person share for that round is `amount / participants.length`, matching the sheet's checkbox + even-split behavior. Settlement (owed/paid/remaining/status) is computed from all entries, same formula regardless of unit.

The batch's payer is auto-marked `Paid (Host)` for their own share; everyone else starts `Pending`, moves to `Partial`/`Paid` as payments are recorded.

## Roles

- **Host (admin)** — the first account created via `/setup`. Can add/remove friend accounts, start/finish/delete batches, and mark *anyone's* payment as settled.
- **Friend** — can log session rounds, and mark only their *own* remaining balance as paid (shows as "Mark I paid"). Can't create batches or manage accounts.

There's no public sign-up: the host creates a username + temp password for each friend from the "People" panel on the dashboard and shares it with them directly. The host can also attach a friend's Google email when adding them, so that friend can sign in with "Continue with Google" instead of the temp password.

## Running it

1. Copy `.env.local.example` to `.env.local` and set `MONGODB_URI` (defaults to `mongodb://localhost:27017`), `MONGODB_DB`, and `AUTH_SECRET` (generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
2. `npm install`
3. `npm run dev` → http://localhost:3000 — first visit redirects to `/setup` to create the host account.

## Google login (optional)

The "Continue with Google" button is hidden until `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in `.env.local`. To get them:

1. Go to [console.cloud.google.com](https://console.cloud.google.com/) → create a project (or pick an existing one).
2. **APIs & Services → OAuth consent screen** — choose "External" (or "Internal" if you have Google Workspace), fill in the app name/support email, and add yourself and your friends as test users if the app stays in "Testing" mode (fine for a small friend group — no Google review needed).
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID** — Application type: **Web application**.
   - Authorized redirect URI: `http://localhost:3000/api/auth/google/callback` (add your production URL's equivalent later if you deploy, e.g. `https://yourdomain.com/api/auth/google/callback`).
4. Copy the generated **Client ID** and **Client secret** into `.env.local` as `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, then restart `npm run dev`.

How it behaves once configured:

- If no accounts exist yet, the **first** person to sign in with Google becomes the host (same as `/setup`, just via Google instead of a password).
- After that, Google sign-in only works for an email the host has already added (via the "Google email" field in the People panel) or that already matches an existing account's email — anyone else gets "No account found for \<email> — ask your host to add you first".
- An account can have both a password and Google linked at once; either works.

## Data model (MongoDB collections)

- `users` — `{ name, username, passwordHash?, email?, googleId?, role: "admin"|"friend" }` (`passwordHash` and `email`/`googleId` are each optional — an account just needs one sign-in method)
- `batches` — `{ name, unit, unitLabel, quantity, totalCost, payerId, status }`
- `entries` — `{ batchId, date, note, amount, participantIds[], loggedBy }`
- `payments` — `{ batchId, memberId, amount, date }`
