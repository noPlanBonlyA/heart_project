# HEART — Psychological Immersive Theatre

Project site by Mariia Dmitrieva. Vite + TypeScript, no framework.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/ — deploy to Vercel as a Vite project
```

## Where things are
- `index.html` — all text of the main page (hero, Heart Theatre, Heart System, contacts)
- `methodology.html` — the methodology document (web version)
- `public/heart-methodology.pdf` — PDF of the same document. After editing `methodology.html`,
  re-export it: open `/methodology.html` in Chrome → Print → Save as PDF (A4, background graphics on).
- `public/video/trailer/` — trailer as an adaptive HLS stream (360p–1080p), `trailer.mp4` is the fallback
- `src/main.ts` — heartbeat animation, scroll reveals, trailer player, card tap
- `src/style.css`, `src/doc.css` — styles; fonts are self-hosted (`src/fonts.ts`)

## Replacing the trailer
```bash
ffmpeg -i new.mov -filter_complex "[0:v]fps=30,split=4[a][b][c][d];[a]scale=-2:360[o1];[b]scale=-2:540[o2];[c]scale=-2:720[o3];[d]scale=-2:1080[o4]" \
  -map "[o1]" -map 0:a -map "[o2]" -map 0:a -map "[o3]" -map 0:a -map "[o4]" -map 0:a \
  -c:v libx264 -preset slow -g 120 -keyint_min 120 -sc_threshold 0 \
  -b:v:0 450k -b:v:1 900k -b:v:2 1600k -b:v:3 3000k -c:a aac -b:a 128k \
  -f hls -hls_time 4 -hls_playlist_type vod -hls_segment_filename "public/video/trailer/%v_%03d.ts" \
  -master_pl_name master.m3u8 -var_stream_map "v:0,a:0 v:1,a:1 v:2,a:2 v:3,a:3" "public/video/trailer/%v.m3u8"
```
