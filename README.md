# Event Planning Application

A full-stack event planning app where people can create events, browse and filter them, sell or give away tickets, and pay for paid events through eSewa.

**Stack:** React + TypeScript + Vite (frontend) · Node.js + Express + TypeScript (backend) · MySQL · Knex.js

---

## 1. Engineering Decisions

This section explains the main choices made while building this, in plain words — what was picked and why.

### Overall stack

- **Frontend:** React + TypeScript, built with Vite
- **Backend:** Node.js + Express + TypeScript
- **Database:** MySQL
- **Query builder:** Knex.js (no ORM, as required) — this means we write our own SQL-like queries instead of letting a tool guess them for us. Slower to write at first, but nothing is hidden or "magic" — every query is visible and easy to reason about.
- **Validation:** Zod — the backend rejects bad data before it ever reaches the database.

### Authentication

- Passwords are never stored directly — they're scrambled with **bcrypt** before saving, so even if the database leaked, no real password would be exposed.
- Login works with a **JWT (JSON Web Token)** stored in an **httpOnly cookie**, not in the browser's regular storage. This means JavaScript running on the page can never read or steal it, which protects against a common attack (XSS).
- **Two-Factor Authentication (2FA)** is offered as an extra option — it works with any standard authenticator app (Google Authenticator, Authy), using the same TOTP method banks and big tech companies use.

### Database design

- Tables are **normalized** — for example, tags aren't stored as a text list on each event ("Birthday, Music"). Instead, there's a separate `tags` table and a `event_tags` linking table. This avoids duplicate/misspelled tag names and makes searching by tag fast.
- Every schema change was done through a **migration file** — a small script that describes exactly what changed and when. The whole database can be rebuilt from scratch at any time, and every change is tracked, rather than typed directly into a database tool.

### Images

- Event photos are uploaded to **Cloudinary** (a free image-hosting service) instead of storing raw files on our server.
- The upload goes **through our own backend first**, not directly from the browser to Cloudinary. This keeps our Cloudinary secret key hidden on the server — it's never visible in the browser's code.

### Location

- Instead of a full address-autocomplete system (which needs a paid Google account with a credit card on file), the location field is plain text that becomes a clickable link that opens a Google Maps search for that text. Free, instant, no account needed, and does exactly what was asked.

### Tickets and Payments

- **eSewa** (a popular Nepali payment service) is integrated for paid events.
- Every payment request sent to eSewa is signed with a secret key using cryptography (**HMAC-SHA256**), so no one can fake or tamper with a payment amount.
- After a payment, we never just trust what the browser tells us — we **call eSewa's servers directly** to double-check the payment really went through before marking an order as paid. This stops someone from faking a "success" message.
- **Free tickets** (for public events) use the exact same ticket system as paid ones, just skipping the payment step when the price is 0. Almost no extra code was needed to support free RSVPs.
- To stop **overselling** (two people buying the very last seat at the same moment), the database briefly "locks" a ticket row while checking availability, so only one purchase can succeed if only one seat is left.
- An order only counts as a ticket once it's **completed** — a payment that was started but abandoned or failed never shows up in a user's ticket collection.

### Frontend

- Built using **Ant Design**, a ready-made set of UI components (forms, buttons, tables), styled with inline styles directly in the code rather than separate CSS files — faster to build and keeps everything for one component in one place.
- Login state is shared across the whole app using **React Context**, so every page knows whether someone is logged in without asking the server separately each time.

### Verification

- During development, every feature was verified against a **real MySQL database and the real running server** — not just by assuming the code "should" work. This caught several real bugs early (wrong date formatting, missing database columns, incorrect validation) before they could reach users.

---

## 2. Setup Instructions

### What you need first

- **Node.js** installed (v18 or newer)
- **MySQL** installed and running
- A free **Cloudinary** account (for image uploads) — no credit card needed
- **eSewa's public test credentials** — already built into the project, no signup needed

> **Project layout — important before you start:**
> The project root folder **is the backend** (where `package.json` and this README live). The frontend lives in the `frontend/` sub-folder. So the two parts are started from **different folders** — see steps below.

### Step 1 — Database

1. Open MySQL Workbench (or any MySQL tool)
2. Create a database:

```sql
CREATE DATABASE event_planner;
```

3. Create a user for the app and give it access:

```sql
CREATE USER 'event_planner'@'127.0.0.1' IDENTIFIED BY 'devpass123';
GRANT ALL PRIVILEGES ON event_planner.* TO 'event_planner'@'127.0.0.1';
FLUSH PRIVILEGES;
```

_(Use whatever username/password you like — just make sure they match the `.env` file below.)_

### Step 2 — Backend (from the project root) --root backend project folder name is (event-application)

```powershell
npm install
```

Copy `.env.example` to a new file called `.env`, then fill in your real values:

```ini
PORT=4000
NODE_ENV=development

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=event_planner
DB_PASSWORD=devpass123
DB_NAME=event_planner

JWT_SECRET=a_long_random_string_here
JWT_EXPIRES_IN=1h

COOKIE_NAME=ep_token
COOKIE_SECURE=false

FRONTEND_ORIGIN=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# eSewa test values are the defaults — only change these if you have real merchant keys
ESEWA_MERCHANT_CODE=EPAYTEST
ESEWA_SECRET_KEY=8gBm/:&EnhH.1/q
```

Then create the database tables (this runs all migrations):

```powershell
npm run migrate
```

Start the backend:

```powershell
npm run dev
```

It will run at `http://localhost:4000`.

### Step 3 — Frontend (in a new terminal, from the `frontend` folder)

```powershell
cd frontend
npm install
npm run dev
```

It will run at `http://localhost:5173` — open that in your browser.

### Step 4 — Try it out

1. Sign up for an account
2. Create an event — add tags, an image, and (if the event is private) a ticket price
3. Browse, search, and filter events from the main page
4. To test a real payment flow: create a private event with a paid ticket, then "buy" it as a _different_ account — you'll be sent to eSewa's real test payment page. Use test login `9806800001`, password `Nepal@123`.

### Useful commands

| Command                    | Where                   | What it does                          |
| -------------------------- | ----------------------- | ------------------------------------- |
| `npm install`              | root(event-application) | Installs backend packages             |
| `npm install`              | `frontend/`             | Installs frontend packages            |
| `npm run migrate`          | root                    | Creates/updates all database tables   |
| `npm run migrate:rollback` | root                    | Undoes the last migration             |
| `npm run dev`              | root                    | Runs the backend at `localhost:4000`  |
| `npm run dev`              | `frontend/`             | Runs the frontend at `localhost:5173` |
| `npm run build`            | root or `frontend/`     | Compiles the app for production       |

### Troubleshooting

- **"Missing required environment variable"** on start → your `.env` file is missing one of the keys above. Copy `.env.example` to `.env` again and fill every line.
- **Backend starts but pages don't load data** → make sure MySQL is running and the user/password in `.env` match what you created in Step 1.
- **Images fail to upload** → check your Cloudinary keys in `.env`.
- **Pagination looks wrong on the event list** → hard-refresh the browser (Ctrl+Shift+R) to clear any cached old bundle.

---

## 3. Assumptions

These are decisions made where the assessment didn't specify an exact answer, along with the reasoning:

- **Public vs. private events don't control who can _see_ them** — any logged-in user can view both. The public/private label is used as a filter/category, and to decide whether an event needs a ticket price. (Private strictly meaning "hidden from other users" was considered, but treating it as a visibility switch felt like a separate feature the assessment didn't ask for.)
- **Tags are chosen from a fixed list**, not typed freely by users when creating an event. This keeps tag names consistent (no "music" vs "Music" vs "musics" all meaning the same thing).
- **A ticket tier can be free (price = 0).** Public events offer free "seats" with a limited quantity, reusing the same paid-ticket system instead of building a separate one.
- **Only a "completed" order counts as an actual ticket** in a user's ticket collection — an order that was started but never finished (payment abandoned or failed) doesn't show up as something the user holds.
- **eSewa's public sandbox/test credentials** are used for payments, since real merchant registration requires a registered business in Nepal. The entire payment flow (signing, redirecting, verifying, confirming) is fully real and functional — only the actual money is fake.
- **All ticket prices are in NPR** (Nepali Rupees), matching eSewa being a Nepal-specific payment service.
