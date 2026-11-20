#!/bin/sh
# Synthesises the music bed and the small sound cues. No samples, so no licensing questions.
set -e
OUT=public/audio
# A slow, quiet A-minor pad: five sines with gentle swell, low-passed and given a soft echo.
ffmpeg -y -loglevel error -f lavfi -i "aevalsrc='0.05*sin(2*PI*110*t)+0.04*sin(2*PI*164.81*t)+0.035*sin(2*PI*220*t)+0.03*sin(2*PI*261.63*t)*(0.6+0.4*sin(2*PI*0.07*t))+0.025*sin(2*PI*329.63*t)*(0.6+0.4*sin(2*PI*0.05*t))+0.02*sin(2*PI*440*t)*(0.5+0.5*sin(2*PI*0.031*t))':s=44100:d=300" \
  -af "lowpass=f=1400,aecho=0.8:0.7:480|950:0.35|0.22,aformat=channel_layouts=stereo,volume=0.9,afade=t=in:d=4,afade=t=out:st=292:d=8" $OUT/bed.wav
# Soft cues
ffmpeg -y -loglevel error -f lavfi -i "anoisesrc=d=0.9:c=pink:a=0.6" -af "highpass=f=250,lowpass=f=5000,afade=t=in:d=0.35,afade=t=out:st=0.4:d=0.5,aformat=channel_layouts=stereo,volume=0.5" $OUT/whoosh.wav
ffmpeg -y -loglevel error -f lavfi -i "sine=f=1760:d=0.09" -af "afade=t=out:st=0.015:d=0.07,aformat=channel_layouts=stereo,volume=0.5" $OUT/tick.wav
ffmpeg -y -loglevel error -f lavfi -i "sine=f=587:d=0.2" -af "afade=t=in:d=0.01,afade=t=out:st=0.03:d=0.17,aformat=channel_layouts=stereo,volume=0.45" $OUT/pop.wav
echo "audio ready"
