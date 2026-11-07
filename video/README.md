# Daily videos

One prompt makes a landscape video (3 to 5 minutes) and a Short (30 to 60 seconds), and posts both to YouTube. It runs every day at 10:00 IST once switched on. They aren't AI-generated footage: Claude writes the script and an HTML composition, Polly voices it, and Chrome renders that page frame by frame.

## Where everything lives

| Part | Where | Why |
| --- | --- | --- |
| The screen | The **Videos** tab at campaign.codekairo.com (`frontend/campaign/public/index.html`, `video.js`, `video.css`) | Draws only; it holds no logic. |
| Schedule, queue, YouTube connection, the record of what's posted | `backend/src/services/video-studio.ts`, routes at `/api/video-studio` | The API owns all of this, in MySQL. |
| The making: Claude, voice, Chrome, ffmpeg, upload | `backend/video/` (this folder), run by `.github/workflows/daily-video.yml` | Backend code on GitHub's runners. Chrome and ffmpeg for tens of minutes don't fit beside MySQL on the 2 GB instance (`deploy/mysql.cnf`). The repository is public, so the minutes are free. |

## A run

1. **Start.** The `daily_video` job (or "Make one now") picks the topic: the queue first, then `AUTO_TOPICS`, then Claude's own choice. The API starts the workflow.
2. **`create` job.** Asks Claude whether the channel already has this video. Then the script, the voice, one composition per cut, and the review: mechanical checks plus Claude reading frames, with up to two rounds of fixes.
3. **`render` job.** Compiles and runs the on-screen Java, then renders every frame. It holds no secrets, because this is the job that runs model-written code.
4. **`publish` job.** Asks the API before each upload, uploads, and reports back.

Anything the review doesn't clear goes up private and shows as "Check this one" on the page.

## The voice and the language

**Amazon Polly**, voice **Kajal** (neural, Indian English), the voice the site reads interview questions in (`src/voice.ts`). Polly reports when each word is said, so the captions and the animation cues land on the words exactly. Repository variables `POLLY_VOICE`, `POLLY_ENGINE` and `POLLY_REGION` change it; a voice without word timings (the generative engine has none) is timed from the pauses between its sentences instead.

Each video is **Hinglish** (Roman script, technical terms in English) or **English**, picked on the Videos tab and copied onto the run when it starts. Titles, thumbnails, code and on-screen text stay English either way; a Hinglish video's title ends with "in Hindi" where it fits.

## Never posting the same video twice

- **Before making it:** the API compares the words of the prompt with what's posted. Then Claude judges whether it's the same video in different words. A typed prompt is refused with the title it repeats; an automatic topic moves to the next in line.
- **What "posted" means:** the channel's real uploads list, read from YouTube on every run, so videos uploaded by hand count too. Rows stay in `PostedVideo` even if a video is later deleted.
- **Before each upload:** `claimUpload` reads the channel again and refuses a matching title or identical file.
- **Re-running a job:** a cut this run already posted is skipped. If a job died after YouTube took the file but before reporting it, the re-run finds its title on the channel and takes it as its own.

The rules are in `src/lib/video-studio.ts`, pinned by `video-studio.test.ts`.

## Setup (once)

**1. Google.** In Google Cloud, enable *YouTube Data API v3* and create an OAuth client of type *Web application*, separate from the sign-in one, with this redirect URI:

```
https://api.codekairo.com/api/video-studio/youtube/callback
```

Set the consent screen's publishing status to **In production**. In *Testing*, Google expires the refresh token after 7 days and posting stops. Google will show an "unverified app" warning when you connect; that's expected for an app only you sign in to.

**2. GitHub token.** Create a fine-grained token on `ayaanp14/bugforge-backend` with **Actions: read and write** and nothing else.

**3. The API's environment** (`bash deploy/set-secrets.sh` on the instance):

| Name | Value |
| --- | --- |
| `CAMPAIGN_PASSWORD` | The same value as the campaign Worker's secret |
| `VIDEO_RUNNER_SECRET` | `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
| `GITHUB_DISPATCH_TOKEN` | From step 2 |
| `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET` | From step 1 |

Rotating `VIDEO_RUNNER_SECRET` means reconnecting YouTube, since it also encrypts the stored token.

**4. The repository's Actions settings:**

| Kind | Name | Value |
| --- | --- | --- |
| Secret | `ANTHROPIC_API_KEY` | Your Anthropic key |
| Secret | `POLLY_ACCESS_KEY_ID` | An IAM user's access key, allowed only `polly:SynthesizeSpeech` |
| Secret | `POLLY_SECRET_ACCESS_KEY` | That key's secret |
| Secret | `VIDEO_RUNNER_SECRET` | The same as above |
| Variable | `API_URL` | `https://api.codekairo.com` |
| Variable | `VIDEO_MODEL` | Optional. `claude-sonnet-5-5` halves the Claude cost. |

**5. Deploy** both repositories. GitHub only starts a dispatched workflow whose file is on `main`. The API's deploy creates the four new tables.

**6. On the page:** connect YouTube, set "Post as" to Private, press "Make one now", and watch the result. Then set it to Public and turn on the daily switch.

## Trying it locally

```bash
cd video
npm ci
npx tsx src/cli.ts demo            # the reference composition, silent, no API keys
npx tsx src/cli.ts demo --voice    # with the real Polly voice; needs AWS credentials (aws login)
```

The result is in `out/`. Local rendering needs Google Chrome installed. `backend/scratch/video-studio-job-smoke.mts` runs the 10:00 job through the scheduler against a stub.

## Good to know

- This repository's logs and artifacts are public. They show scripts and unpublished videos (kept for one day), never secrets.
- Each run's real Claude cost is on the page.
- Local `prisma db push` may also offer to drop tables removed from the schema earlier (`External*`). Preview with `prisma migrate diff` first.
