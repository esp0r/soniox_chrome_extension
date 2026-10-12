"""Convert downloaded YouTube JSON3 captions into UTF-8 TXT and SRT.

Input: artifacts/audio/<id>.ja-orig.json3 (YouTube automatic captions).
This does not run a new speech recognition model or correct caption errors.
"""
import json
from pathlib import Path


def timestamp(ms):
    seconds, millis = divmod(int(ms), 1000)
    minutes, seconds = divmod(seconds, 60)
    hours, minutes = divmod(minutes, 60)
    return f'{hours:02}:{minutes:02}:{seconds:02},{millis:03}'


def main():
    root = Path(__file__).resolve().parents[1] / 'artifacts' / 'audio'
    for file in root.glob('*.ja-orig.json3'):
        events = json.loads(file.read_text(encoding='utf-8'))['events']
        rows, subtitles = [], []
        for event in events:
            text = ''.join(s.get('utf8', '') for s in event.get('segs', [])).strip()
            if not text:
                continue
            start = event.get('tStartMs', 0)
            end = start + event.get('dDurationMs', 1000)
            rows.append(f'[{start / 1000:.1f}] {text}')
            subtitles.append(f'{len(subtitles) + 1}\n{timestamp(start)} --> {timestamp(end)}\n{text}\n')
        file.with_suffix('.txt').write_text('\n'.join(rows) + '\n', encoding='utf-8')
        file.with_suffix('.srt').write_text('\n'.join(subtitles), encoding='utf-8')
        print(f'{file.name}: {len(rows)} caption segments')


if __name__ == '__main__':
    main()
