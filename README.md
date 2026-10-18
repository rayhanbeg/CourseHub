# CourseHub

CourseHub is a MERN online learning platform with a React and Vite frontend, an Express API, MongoDB data models, and Stripe Checkout.

## Local development

1. Copy `backend/.env.example` to `backend/.env` and configure MongoDB, JWT secrets, and any services you plan to use.
2. Copy `frontend/.env.example` to `frontend/.env.local`. Set `VITE_API_URL` to the backend API URL. Add verified public support contact details if they should appear in the footer.
3. Install dependencies in `backend/` and `frontend/` with `npm install`.
4. Start the API with `npm run dev` from `backend/` and the frontend with `npm run dev` from `frontend/`.

To send password reset emails, configure `EMAIL_API_KEY`, `EMAIL_FROM`, and optionally `EMAIL_API_URL` in `backend/.env`. The default email endpoint uses the Resend API format. Reset links expire after 30 minutes.

## Stripe Checkout (local testing)

Paid course prices are read from MongoDB on the server. The browser receives a hosted Stripe Checkout URL and never submits an amount. Enrollment and paid order completion happen only after a verified Stripe webhook. Free courses enroll directly without Stripe.

1. Add your Stripe test secret key to `backend/.env` as `STRIPE_SECRET_KEY` and set `STRIPE_CURRENCY=usd` (or a currency supported by your Stripe account). Keep all secret keys in `backend/.env`; do not add them to the frontend environment.
2. Start the API and frontend, then run the Stripe CLI in another terminal: `stripe listen --forward-to localhost:5000/api/orders/webhook/stripe`.
3. Copy the signing secret printed by `stripe listen` into `STRIPE_WEBHOOK_SECRET` in `backend/.env`, then restart the API.
4. Purchase a published paid course using Stripe's test card `4242 4242 4242 4242`, any future expiry date, and any CVC/postal code.
5. The return page shows a pending state until the webhook arrives. Check **Dashboard → Orders & receipts** for the final status and print a receipt. A success redirect alone does not grant access.

## Local demo accounts

Run `npm run seed` from `backend/` to create or reset these development accounts. The seed script sets the same password for both accounts:

| Role | Email | Password |
| --- | --- | --- |
| Student | `student@test.com` | `password123` |
| Admin | `admin@test.com` | `password123` |

These accounts use a deliberately simple local-development password. Do not seed them into a production database.

## Private lesson video delivery

Lesson uploads are stored in Cloudinary as `authenticated` video assets. The API issues an expiring (15 minute) Cloudinary URL only from `GET /api/lessons/:id/stream` after checking preview status, enrollment, or course ownership. Course and curriculum payloads expose lesson metadata and access state, not delivery URLs. Course introduction videos are intentionally public.

Existing public lesson assets should be migrated before production rollout. Back up MongoDB and the Cloudinary assets first, run `node scripts/migrateLessonVideosToAuthenticated.js` from `backend/` to review the dry-run list, then run it with `--apply`. Confirm a migrated lesson can play while enrolled and rejects a non-enrolled stream request. Cloudinary invalidation can take time to propagate, so old public CDN URLs may remain usable during that propagation window.

The player disables browser download controls and uses short-lived URLs to reduce casual downloading. This is not DRM; a viewer can still record the screen or capture media while it plays.
