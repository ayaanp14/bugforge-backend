# Daily videos

One prompt makes a landscape video (3 to 5 minutes) and a Short (20 to 35 seconds), and posts both to YouTube. It posts every day at 18:00 IST once switched on (making starts at 15:00, see [What it costs](#what-it-costs)). They aren't AI-generated footage: Claude writes the script and an HTML composition, Polly voices it, and Chrome renders that page frame by frame.

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
4. **`publish` job.** A daily run waits until 18:00 IST (status "scheduled"), then asks the API before each upload, uploads, and reports back.

Anything the review doesn't clear goes up private and shows as "Check this one" on the page.

## Links to the site

Claude picks the video's pages from the site's own sitemaps (`src/site.ts` shortlists the pages whose address shares words with the topic: the problem, its topic hub, the roadmap lesson, a CS note), never by guessing: `practicePath` (where to solve it) and `learnPath` (where the idea is taught). Both are checked against the live site before they are printed; a page that doesn't answer falls back to /challenges or is left out. The landscape description carries all four links (practise, learn, the roadmap, the site), the Short's the first two, each with UTM tags per place (video, short, comment, short-comment). Every public video also gets a comment from the channel with the same links and a question for the comments. **The YouTube API cannot pin a comment** (it has no such call), so pinning it is one tap in YouTube Studio.

## On the site

A public upload is also shown on the site (`SiteVideo`, `services/site-videos.ts`): the publish job's `recordUpload` names the video's pages (the practice and learn pages above), and a problem's editorial answer carries its newest long video (Shorts are recorded but not shown on the site, the owner's call). The problem page draws them at the top of the Editorial tab and in a visitor's "How to solve" guide (`components/problems/VideoExplanation`, click to play), so the search traffic the problem pages get becomes views. A new video shows within the editorial cache's ten minutes.

## What a Short looks like

20 to 35 seconds in 3 to 4 scenes (YouTube pushes a Short people finish and replay). The first scene is the hook: at most 10 words, the payoff in 110px type, fully drawn on its first frame (that frame is also the feed's preview), with the page's header hidden for it (`src/runtime.js`).

## Topics

The queue first, then `AUTO_TOPICS` (`src/lib/video-studio.ts` on the API): coding problems named by their LeetCode title and number, the way students search them, with an aptitude topic every few days. Its position is stored, so only append, or rewrite entries the position hasn't reached.

## What it costs

Almost all of a run's cost is Claude's output (run cmw8riz2d, 2026-11-09: 86% of $2.84), so caching, already on, can't do much. Three things cut it (2026-11-09):

- **Two models.** Opus 5.5 (`VIDEO_MODEL`) writes the script and does every review, where correctness is decided. Sonnet 5.5 (`VIDEO_COMPOSE_MODEL`), at half the price, writes and fixes the animation and the cover: 80% of the output tokens. Set `VIDEO_COMPOSE_MODEL=claude-opus-5-5` as a repository variable to go back.
- **Fixes as edits.** A review round asks for find-and-replace edits instead of the whole file again (17–18k tokens a round before). An edit whose text isn't found exactly once makes it ask for the whole file, as before.
- **The Batches API, at half price.** A daily run sends each Claude call as a one-request batch and polls it. A batch not ended in 20 minutes (`VIDEO_BATCH_WAIT_MIN`) is cancelled and the call made directly at full price, so a slow queue never costs the day's video; so is a declined one, because batches can't carry the refusal fallback. That's why the job starts at 15:00 IST and the upload waits for 18:00, the evening hour students scroll. "Make one now" never batches. `VIDEO_BATCH=off` turns it off.

The run log names the model of each call and marks batched ones.

## The voice and the language

**Amazon Polly**, voice **Kajal** (neural, Indian English), the voice the site reads interview questions in (`src/voice.ts`). Polly reports when each word is said, so the captions and the animation cues land on the words exactly. Repository variables `POLLY_VOICE`, `POLLY_ENGINE` and `POLLY_REGION` change it; a voice without word timings (the generative engine has none) is timed from the pauses between its sentences instead.

Each video is **Hinglish** (Roman script, technical terms in English) or **English**, picked on the Videos tab and copied onto the run when it starts. Titles, thumbnails, code and on-screen text stay English either way; a Hinglish video's title ends with "in Hindi" where it fits.

## What each upload carries

Claude writes, per cut, a search-first title (under 70 characters, "in Hindi" for Hinglish), a description whose first sentence restates the search term, 10–15 tags and three hashtags (a Short's first is #shorts), and picks one of the channel's playlists (`PLAYLISTS` in src/types.ts). The upload adds: category Education; not made for kids (that would turn off comments and end screens and narrow the audience); no altered or synthetic content to declare; standard licence, embeddable, public stats; the spoken language (`hi` for Hinglish, `en` otherwise) with English title text; the practice link with UTM tags, chapters, a subscribe line; the thumbnail; captions on both cuts; and the video added to "<playlist> in Hindi" (the Short to "Coding Shorts in Hindi"), each playlist made the first time it is needed. A thumbnail, caption or playlist failure is a warning on the run, never a failed upload.

## Instagram

When Instagram is set up (step 5b), the Short also goes up as a reel (`src/instagram.ts`, API side `src/services/video-instagram.ts`). The script carries its own Instagram words (`reel` in `types.ts`, rules in the script prompt): a hook as the caption's first line (all Instagram shows before "more"), the idea, a save/share line and a question that invites comments, then the practice page written out (captions have no clickable links), a follow line and three to five specific hashtags (generic reach tags such as viral or fyp are dropped). The reel shares to the feed and names its audio after the topic. Scripts from before the field fall back to the Short's title and description. Instagram has no private or unlisted posts, so a run that didn't go up public on YouTube isn't posted there (the run says so).

**The cover.** Each run's create job has Claude design a 1080×1920 cover for the topic (`composeCover` in `src/claude.ts`; the target is the channel's best hand-made covers: a blue eyebrow, a huge headline with the key word in blue, a struck-through "before" against an "after", one picture of the idea drawn from the real example, a promise line). The page draws our logo; the design keeps inside Instagram's 3:4 grid crop (`COVER` in `types.ts`). It is rendered in the same sandbox as the video frames (`renderCover`), checked for text off the area or under 22px, reviewed like a frame (`reviewCover`) and rewritten once on a blocker; without a clean one the run warns and both platforms show a frame. The same `cover.jpg` is the Short's YouTube thumbnail and the reel's Instagram cover. The long cut keeps its own 16:9 thumbnail.

Instagram Login can't upload a file: a reel is made from a URL Instagram fetches itself. So the publish job sends the MP4 and the cover to the API, which serves each from a random 32-character name for up to two hours and deletes them as soon as the reel is published or has failed. **Never twice:** the reel's id is kept on the run, and before posting the API reads the account's newest 30 posts for one whose caption opens with this reel's first line, so a job that died after Instagram published adopts that reel. The token never expires and never leaves the API: the publish job sends the file and asks, and the API makes every call to Instagram. Any Instagram failure is a warning on the run; YouTube is never held up by it.

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

**5b. Instagram (optional).** Meta's path for posting to your own account is the Instagram API with **Unified login**: a business portfolio, the Instagram account as one of its assets (no Facebook Page), and a system user's token that never expires. No sign-in button, no redirect URL.

1. Make the Instagram account **professional** (Instagram app → Settings → Account type and tools → Switch to professional account).
2. At developers.facebook.com, create an app with the use case *Manage messaging & content on Instagram*. Under *Use cases → Customize → API setup with Unified login*, link it to a **business portfolio** (create one, free, if you have none).
3. In Business settings (business.facebook.com/settings) for that portfolio:
   - *Accounts → Instagram accounts → Add*, and log in to the Instagram account. Open it there and copy its **ID** (a long number starting 17841).
   - *Users → System users → Add*: name it `codekairo-reels`, role Admin.
   - On that system user, *Assign assets*: the app (full control) and the Instagram account (content).
   - *Generate new token*: the app, expiry **Never**, permissions `instagram_basic` and `instagram_content_publish` (add `business_management` if Meta asks). Copy the token: Meta shows it once.
4. On the instance, `bash deploy/set-secrets.sh`: `INSTAGRAM_ACCESS_TOKEN` is the token, `INSTAGRAM_USER_ID` the ID. The Videos tab then says which account reels go to, read from Instagram, or why Instagram refused.

**6. On the page:** connect YouTube, set "Post as" to Private, press "Make one now", and watch the result. Then set it to Public and turn on the daily switch.

## Trying it locally

```bash
cd video
npm ci
npx tsx src/cli.ts demo            # the reference composition, silent, no API keys
npx tsx src/cli.ts demo --voice    # with the real Polly voice; needs AWS credentials (aws login)
```

The result is in `out/`. Local rendering needs Google Chrome installed. `backend/scratch/video-studio-job-smoke.mts` runs the daily job through the scheduler against a stub.

## Good to know

- This repository's logs and artifacts are public. They show scripts and unpublished videos (kept for one day), never secrets.
- Each run's real Claude cost is on the page.
- Local `prisma db push` may also offer to drop tables removed from the schema earlier (`External*`). Preview with `prisma migrate diff` first.
