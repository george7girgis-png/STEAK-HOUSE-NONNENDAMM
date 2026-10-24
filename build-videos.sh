#!/usr/bin/env bash
# Turns raw Higgsfield clips (assets/raw/<name>.mp4) into seamless web loops in assets/scenes/:
#   <name>.mp4    1920px, desktop
#   <name>-m.mp4  960px, phones
#   <name>.jpg    poster (first frame of the loop), shown until the video plays
# Loop modes:
#   xfade     locked-off clips (fire, smoke): the last second crossfades into the first, no visible jump
#   pingpong  clips with camera motion: plays forward then backward
# Usage: bash build-videos.sh                (all scenes)
#        bash build-videos.sh huefte xfade   (one scene)
set -e
cd "$(dirname "$0")"
RAW=assets/raw
OUT=assets/scenes
mkdir -p "$OUT"

encode() {
  local name=$1 mode=$2 src="$RAW/$1.mp4" loop="$OUT/$1-loop.tmp.mp4"
  local dur
  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$src")
  if [ "$mode" = pingpong ]; then
    ffmpeg -loglevel error -y -i "$src" -filter_complex \
      "[0:v]split[a][b];[b]reverse,trim=start_frame=1,setpts=PTS-STARTPTS[r];[a][r]concat=n=2:v=1[v]" \
      -map "[v]" -an -c:v libx264 -crf 14 -preset fast "$loop"
  else
    # Clip from 1 s to the end, then fade the last second into the first second.
    ffmpeg -loglevel error -y -i "$src" -filter_complex \
      "[0:v]split[a][b];[a]trim=start=1,setpts=PTS-STARTPTS[main];[b]trim=end=1,setpts=PTS-STARTPTS[head];\
[main][head]xfade=transition=fade:duration=1:offset=$(awk "BEGIN{print $dur - 2}")[v]" \
      -map "[v]" -an -c:v libx264 -crf 14 -preset fast "$loop"
  fi
  # Short GOP so scroll-driven seeking and looping stay smooth.
  ffmpeg -loglevel error -y -i "$loop" -vf "scale=1920:-2,format=yuv420p" -an -c:v libx264 -preset slow -crf 29 -g 24 -movflags +faststart "$OUT/$name.mp4"
  ffmpeg -loglevel error -y -i "$loop" -vf "scale=960:-2,format=yuv420p" -an -c:v libx264 -preset slow -crf 26 -g 24 -movflags +faststart "$OUT/$name-m.mp4"
  ffmpeg -loglevel error -y -i "$OUT/$name.mp4" -frames:v 1 -q:v 4 "$OUT/$name.jpg"
  rm -f "$loop"
  echo "$name ($mode): $(du -h "$OUT/$name.mp4" | cut -f1) desktop, $(du -h "$OUT/$name-m.mp4" | cut -f1) phone"
}

if [ -n "$1" ]; then encode "$1" "${2:-xfade}"; exit; fi
encode hero xfade
encode huefte xfade
encode spiess pingpong
encode holzfaeller pingpong
encode smoke xfade
encode interior pingpong
encode wein pingpong
encode ambiente pingpong
