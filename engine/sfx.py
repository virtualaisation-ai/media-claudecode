"""Genera gli effetti sonori base e li mixa sugli istanti indicati in un file JSON.
Uso: python3 engine/sfx.py <eventi.json> <out.wav>
eventi.json: {"duration": 28, "events": [["thump", 0.0], ["whoosh", 7.65], ["pop", 11.5], ["tick", 1.0], ...]}"""
import json, os, subprocess, sys

def ff(*a): subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *a], check=True)

cfg = json.load(open(sys.argv[1])); out = sys.argv[2]
d = os.path.join(os.path.dirname(os.path.abspath(out)), 'sfx'); os.makedirs(d, exist_ok=True)
ff('-f', 'lavfi', '-i', 'sine=f=55:d=0.4', '-f', 'lavfi', '-i', 'anoisesrc=d=0.09:c=brown:a=0.7', '-filter_complex',
   '[0]volume=1.4,afade=t=out:st=0:d=0.4[a];[1]afade=t=out:st=0:d=0.09[b];[a][b]amix=inputs=2:normalize=0',
   '-ar', '44100', '-ac', '2', f'{d}/thump.wav')
ff('-f', 'lavfi', '-i', 'anoisesrc=d=0.7:c=pink:a=0.8', '-af',
   'bandpass=f=900:w=1400,afade=t=in:st=0:d=0.35,afade=t=out:st=0.35:d=0.35,volume=0.9', '-ar', '44100', '-ac', '2', f'{d}/whoosh.wav')
ff('-f', 'lavfi', '-i', 'sine=f=1320:d=0.14', '-f', 'lavfi', '-i', 'sine=f=1980:d=0.14', '-filter_complex',
   '[0][1]amix=inputs=2:normalize=0,afade=t=out:st=0:d=0.14,volume=0.22', '-ar', '44100', '-ac', '2', f'{d}/pop.wav')

ff('-f', 'lavfi', '-i', 'sine=f=2600:d=0.03', '-af', 'afade=t=out:st=0:d=0.03,volume=0.12', '-ar', '44100', '-ac', '2', f'{d}/tick.wav')

args = ['-f', 'lavfi', '-t', str(cfg['duration']), '-i', 'anullsrc=r=44100:cl=stereo']; fc = []; labels = ['[0]']
for i, (name, t) in enumerate(cfg['events'], 1):
    args += ['-i', f'{d}/{name}.wav']; ms = int(t * 1000)
    fc.append(f'[{i}]adelay={ms}|{ms}[e{i}]'); labels.append(f'[e{i}]')
fc.append(''.join(labels) + f'amix=inputs={len(labels)}:normalize=0:duration=first,alimiter=limit=0.9[out]')
ff(*args, '-filter_complex', ';'.join(fc), '-map', '[out]', '-c:a', 'pcm_s16le', out)
