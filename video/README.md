# Aviso Previo demo video

Built with [Remotion](https://www.remotion.dev/). About 3 minutes, 1080p, 30 fps. Narration by ElevenLabs. Every number on screen
comes from the app or from a recorded run; nothing is invented.

## What is real
- **LIVE SITE** badge: screenshots of the deployed app on a real Jira site (the evaluation runs, the region-change panel, the Rovo agent
  answers, the Teamwork Graph sync). Source images are cropped by `scripts/prepare-live.mjs`.
- **REAL UI · SAMPLE DATA** badge: the built app rendered locally from its own bundle with the fictional sample (`scripts/capture-ui.mjs`).
- The Friday ticket, the contract and ticket lists and the timeline are motion graphics, labelled as such by context.
- The "Jira refuses the transition" message in scene 4 is the validator's real wording, typed on. For the strongest cut, record a short
  screen clip of the real block and save it as `public/live/block.mp4` (or `.mov`/`.webm`), then run `npm run clips`: the scene uses it instead.

## Make it
```bash
cd video
npm install
echo 'ELEVENLABS_API_KEY=...' > .env         # git-ignored. Optional: ELEVENLABS_VOICE_ID=...
node scripts/vo.mjs --voices                 # list voices on your account
npm run audio                                # synthesised music bed and sound cues (ffmpeg)
npm run assets                               # UI captures (needs `npm run build` in the repo root) and live crops
npm run vo                                   # narration + word timings -> src/vo.json
npm run studio                               # preview, scrub, tweak
npm run render                               # out/aviso-previo-demo.mp4
```
Render with your installed Chrome if Remotion's own browser fails to start:
`npx remotion render src/index.ts Demo out/demo.mp4 --browser-executable="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`

The picture is timed to the narration's word timings, so re-running `npm run vo` after editing `script.json` re-times everything.
Regenerate one scene with `node scripts/vo.mjs --only block`.

## Files
`script.json` is the narration, scene by scene. `src/scenes.tsx` is the eight scenes. `src/ui.tsx` is the shared design system and motion
helpers. `src/timing.ts` turns word timings into frames. `src/Demo.tsx` is the backdrop, the scene shell, subtitles and the audio mix.
