"""vo.py · one narration take from ElevenLabs, with a timing for every word (captions and cuts are placed on these).

  python vo.py <text.txt> <out-stem> --voice <voice_id> [--model eleven_v4] [--seed 2026] [--lang ar]
      writes <out-stem>.mp3 and <out-stem>.words.json  ([{"w": word, "s": start, "e": end}, ...], seconds)

This spends credits on the account that owns the key. The key is read from ELEVENLABS_API_KEY and is never printed or written.
The voice must be one the account owner has the right to use: their own voice, or a library voice under ElevenLabs' terms.
"""
import argparse, base64, io, json, os, sys, urllib.request, urllib.error
from pathlib import Path

def words_from(al):
    """Character timings from ElevenLabs -> word timings. A word is a run of non-space characters."""
    words, cur, s, e = [], '', None, None
    for c, cs, ce in zip(al['characters'], al['character_start_times_seconds'], al['character_end_times_seconds']):
        if c.isspace():
            if cur: words.append({'w': cur, 's': round(s, 3), 'e': round(e, 3)})
            cur, s = '', None
        else:
            if s is None: s = cs
            cur += c; e = ce
    if cur: words.append({'w': cur, 's': round(s, 3), 'e': round(e, 3)})
    return words

def main():
    p = argparse.ArgumentParser(description='ElevenLabs narration with word timings')
    p.add_argument('text'); p.add_argument('out'); p.add_argument('--voice', required=True)
    p.add_argument('--model', default='eleven_v4'); p.add_argument('--seed', type=int, default=2026); p.add_argument('--lang', default='ar')
    a = p.parse_args()
    key = os.environ.get('ELEVENLABS_API_KEY') or sys.exit('ELEVENLABS_API_KEY is not set')
    if not os.path.isfile(a.text): sys.exit(f'text file not found: {a.text}')
    text = io.open(a.text, encoding='utf-8').read().strip() or sys.exit(f'{a.text} is empty')
    body = {'text': text, 'model_id': a.model, 'seed': a.seed, 'voice_settings': {'stability': 0.5, 'similarity_boost': 0.85, 'style': 0.15, 'use_speaker_boost': True}}
    if a.model != 'eleven_multilingual_v2': body['language_code'] = a.lang        # that model rejects the field
    req = urllib.request.Request(f'https://api.elevenlabs.io/v1/text-to-speech/{a.voice}/with-timestamps?output_format=mp3_44100_192',
                                 data=json.dumps(body).encode('utf-8'), headers={'xi-api-key': key, 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=300) as r: d = json.loads(r.read())
    except urllib.error.HTTPError as e:
        sys.exit(f'ElevenLabs refused ({e.code}): {e.read().decode("utf-8", "replace")[:400]}')
    words = words_from(d['alignment']); stem = Path(a.out); stem.parent.mkdir(parents=True, exist_ok=True)
    Path(str(stem) + '.mp3').write_bytes(base64.b64decode(d['audio_base64']))
    io.open(str(stem) + '.words.json', 'w', encoding='utf-8').write(json.dumps(words, ensure_ascii=False, indent=1))
    print(f'{stem.name}: {len(text)} chars, {words[-1]["e"]:.1f} s, {len(words)} words, {len(words) / words[-1]["e"] * 60:.0f} wpm')

if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf8'); main()
