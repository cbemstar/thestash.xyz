# Newsletter (Loops.so) setup

The site’s “Get updates” form posts to `/api/subscribe`, which adds the contact to Loops when `LOOPS_API_KEY` is set. **Loops does not send any email by default** when a contact is added via the API. To send the “Check your email for a confirmation” message that users expect, you need a **Loop** (workflow) in Loops that triggers on new contacts and sends a confirmation/welcome email.

## 1. API and env (already in place)

- `POST /api/subscribe` sends the email to Loops: it calls **Create contact** (`POST /v1/contacts/create`) first so the “Contact added” trigger fires (welcome email). If the contact already exists (409), it falls back to **Update contact** (`PUT /v1/contacts/update`).
- Set `LOOPS_API_KEY` in your env (get it in [Loops → Settings](https://app.loops.so/settings)).
- If your Loop uses **Contact added to list**, set `LOOPS_MAILING_LIST_ID` to that list ID (see Lists in the Loops dashboard); otherwise **Contact added** works without it.
- `POST /api/subscribe` now requires a valid **Google reCAPTCHA v3** token (action: `newsletter_subscribe`) in production.

Required env for captcha:

- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
- `RECAPTCHA_SECRET_KEY`

Optional hardening:

- `RECAPTCHA_MIN_SCORE` (default `0.7`)
- `RECAPTCHA_ALLOWED_HOSTNAMES` (comma-separated, e.g. `www.thestash.xyz,thestash.xyz`)

## 2. Send the confirmation email (do this in Loops)

1. In [Loops](https://app.loops.so), go to **Loop builder** and create a new Loop.
2. Set the trigger to **Contact added** (recommended) so new signups from the API trigger the welcome email. If you use **Contact added to list**, set `LOOPS_MAILING_LIST_ID` in env to the same list ID.
3. Add an **Email** step: create or choose a template (e.g. “Thanks for subscribing – confirm your email” or “You’re on the list”).
4. Use your verified sending domain so emails don’t go to spam.
5. Activate the Loop.

After this, when someone signs up on the site, they’re added as a contact in Loops and immediately enter this Loop and receive the confirmation email. No code changes are required.

## 3. Optional: double opt-in

If you want a “Confirm your email” link that sets a custom property before treating them as fully subscribed, you can:

- Add a **Link** in the confirmation email that goes to a URL that calls Loops (or your API) to set a property like `emailConfirmed: true`.
- In your Loop, add a branch so that only contacts with `emailConfirmed` get later emails, or use a separate “Confirmed” list.

For a simple “you’re on the list” confirmation, the single Loop above is enough.
