# Todo Studio (Next.js)

A focused Next.js todo app with reminders. Add tasks, set optional date/time reminders, get browser notifications (with alert fallback), and filter by status.

## Features
- Add tasks with optional reminders (date + time)
- Browser notifications when reminders fire (or alert fallback if blocked/unsupported)
- Filters: All, Active, Done
- Clear completed tasks; inline edit/clear reminders
- Responsive gradient UI with Tailwind v4 utilities

## Getting started
Requirements: Node.js 18+ (LTS recommended) and npm.

Install dependencies:
```bash
npm install
```

Run the dev server:
```bash
npm run dev
```
Then open http://localhost:3000 and allow notifications when prompted to receive reminders.

## Scripts
- `npm run dev` – start dev server
- `npm run build` – production build
- `npm start` – serve the production build
- `npm run lint` – run ESLint

## Notes
- Reminders rely on the page being open; there is no persistence or background worker.
- Notifications require browser support and permission; otherwise an alert is shown.
