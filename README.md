# The Case Room — Netlify deployment guide

```
index.html                     The whole app (frontend) — unchanged
netlify/functions/claude.js    Serverless function holding your API key
netlify.toml                   Routes /api/claude to the function above
package.json
.env.example
```

## If you already have a Netlify site from the old zip

That's why case generation was failing: the old `api/claude.js` was
written for Vercel's function format, which Netlify doesn't recognize.
`/api/claude` was just 404ing. To fix your existing site:

1. In your project folder, add the two new files exactly as laid out
   above: `netlify/functions/claude.js` and `netlify.toml` at the root.
2. Delete the old `api/` folder if it's still there (harmless either way,
   but it's dead weight).
3. Push the change (git) or drag-and-drop redeploy (see below).
4. Add your environment variables (next section) if you haven't already.
5. Trigger a new deploy.

## Fresh deploy, step by step

### 1. Get an Anthropic API key
<https://console.anthropic.com> → **Settings → API Keys → Create Key**.

### 2. Set environment variables in Netlify
In your site's dashboard: **Site configuration → Environment variables →
Add a variable**.

- `ANTHROPIC_API_KEY` — paste your key
- `SITE_PASSCODE` — optional; set this to gate the site behind a passcode
  so random visitors can't run up your API bill. Leave it unset for an
  open site.

### 3. Deploy

**Drag-and-drop (simplest, no git needed):**
Go to your Netlify dashboard → **Sites → Add new site → Deploy manually**,
then drag this whole folder in.

**Via GitHub (better for ongoing edits):**
1. Push this folder to a GitHub repo.
2. Netlify dashboard → **Add new site → Import an existing project** →
   pick the repo.
3. Build settings: publish directory `.`, functions directory
   `netlify/functions` — both are already set in `netlify.toml`, so you
   can leave the defaults.
4. Add the environment variables from step 2 before or after the first
   deploy (either works — just redeploy after adding them).

**Via CLI:**
```bash
npm install -g netlify-cli
netlify login
netlify init         # links this folder to a Netlify site
netlify deploy --prod
```

### 4. Add your own domain
Netlify dashboard → **Domain management → Add a domain**, then follow the
DNS steps it gives you.

### 5. Test locally (optional)
```bash
netlify dev
```
Reads variables from a local `.env` file (copy `.env.example` → `.env`
and fill it in). Opening `index.html` directly in a browser won't work —
the API calls need the dev server running.

---

## About cost

Every case generated, submission graded, or mock-interview message is a
real, billed call to the Claude API. Set `SITE_PASSCODE` before sharing
the link widely, and keep an eye on
<https://console.anthropic.com/settings/usage> (spend limits are under
**Settings → Limits**).

## About data storage

Portfolio and application-tracker data live in each visitor's own browser
(`localStorage`) — no login, no database, nothing synced across devices.
That's fine for a first launch; if you want accounts with cross-device
sync later, that's a bigger step (real database + login) — happy to help
build it when you're ready.
