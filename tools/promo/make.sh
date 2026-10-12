#!/bin/sh
# Rebuilds promo/digital-card-battle-promo.mp4 from the running site.
# Needs: the site served on $SITE (default http://127.0.0.1:8765/), Playwright for node
# (set PLAYWRIGHT to its path if it is not installed locally), python3 with Pillow, ffmpeg.
# usage: sh tools/promo/make.sh <work folder>
set -e
T=$(cd "$(dirname "$0")" && pwd)
R=$(cd "$T/../.." && pwd)
mkdir -p "$1" && cd "$1"

# The 3D battle, stepped two game frames (1/30 s) at a time, so the PS1 and the Ultra
# captures of one attack line up frame for frame.
node "$T/cap_battle.js" f_open_l legacy Imperialdramon 0 VenomMyotismon 41 2 110
node "$T/cap_battle.js" f_war_l legacy WarGreymon 0 MetalGarurumon 46 2
RES=maximum node "$T/cap_battle.js" f_war_u ultra WarGreymon 0 MetalGarurumon 46 2
node "$T/cap_battle.js" f_omni_l legacy "Omnimon I" 0 Diaboromon 49 2 60
RES=maximum node "$T/cap_battle.js" f_omni ultra "Omnimon I" 0 Diaboromon 49 2
RES=maximum node "$T/cap_battle.js" f_phx ultra Phoenixmon 0 Machinedramon 45 2
RES=maximum node "$T/cap_battle.js" f_imp ultra Imperialdramon 0 VenomMyotismon 41 2
RES=maximum node "$T/cap_battle.js" f_mgar ultra MetalGarurumon 2 WarGreymon 46 2
RES=maximum node "$T/cap_battle.js" f_sera ultra Seraphimon 0 Piedmon 39 2

# A match on the board, played by a simple script for player 1, and the deck editor.
# The match is random: if the moments in BOARD_CLIPS (compose.py) no longer show an
# attack, a Deadly Attack and a digivolution, pick new ones from rb/times.json.
node "$T/rec_board.js" rb 90 ultra
node "$T/shots.js"

node -e "
const d=require('$R/web/js/data/cards.js'),fs=require('fs');
const c=d.cards.filter(c=>c.type==='digimon'&&fs.existsSync('$R/web/assets/art2/'+String(c.id).padStart(3,'0')+'.webp'))
  .map(c=>({id:c.id,name:c.name,spec:c.spec,level:c.level}));
fs.writeFileSync('cards.json',JSON.stringify(c));"

python3 "$T/compose.py" video_noaudio.mp4
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 video_noaudio.mp4)
FADE=$(python3 -c "print($D-3)")
# music: the free battle tune (bgm 143)
ffmpeg -y -v error -i video_noaudio.mp4 -i "$R/web/assets/audio/bgm/143.ogg" \
  -filter_complex "[1:a]atrim=0:$D,afade=t=in:d=0.4,afade=t=out:st=$FADE:d=3,volume=1.2[a]" \
  -map 0:v -map "[a]" -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -c:a aac -b:a 192k \
  -shortest -movflags +faststart "$R/promo/digital-card-battle-promo.mp4"
