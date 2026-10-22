"""Small, persistent, casual leaderboard; scores are client-reported."""
import os
import sqlite3
import uuid
from pathlib import Path

# Keep player data outside the public static-file directory.
DATA_DIR = Path(os.environ.get('RAILWAY_VOLUME_MOUNT_PATH', os.environ.get('TETRIS_DATA_DIR', '/tmp/tetris-data')))
DB_PATH = DATA_DIR / 'leaderboard.sqlite3'


def connect():
    db = sqlite3.connect(DB_PATH, timeout=10)
    db.row_factory = sqlite3.Row
    return db


def initialize():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with connect() as db:
        db.execute('''CREATE TABLE IF NOT EXISTS scores (
            id TEXT PRIMARY KEY, mode TEXT NOT NULL, name TEXT NOT NULL,
            score INTEGER NOT NULL, time_ms INTEGER NOT NULL, lines INTEGER NOT NULL,
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
        )''')
        db.execute('CREATE INDEX IF NOT EXISTS scores_mode ON scores(mode)')


def validate(data):
    if not isinstance(data, dict):
        raise ValueError('Invalid score.')
    try:
        run_id = str(uuid.UUID(data.get('id', '')))
    except (ValueError, TypeError, AttributeError):
        raise ValueError('Invalid game ID.')
    mode = data.get('mode')
    if mode not in ('marathon', 'sprint'):
        raise ValueError('Choose Marathon or 40 Lines.')
    name = data.get('name')
    if not isinstance(name, str):
        raise ValueError('Enter a player name.')
    name = ' '.join(name.split())
    if not 1 <= len(name) <= 20 or any(not (c.isalnum() or c in " ._'-") for c in name):
        raise ValueError('Use 1–20 letters, numbers, spaces, or . _ \' - in your name.')
    values = [data.get(k) for k in ('score', 'time_ms', 'lines')]
    if any(type(v) is not int for v in values):
        raise ValueError('Invalid score values.')
    score, time_ms, lines = values
    if not (0 <= score <= 1_000_000_000 and 1 <= time_ms <= 604_800_000 and 0 <= lines <= 1_000_000):
        raise ValueError('Score is outside the supported range.')
    if mode == 'marathon' and score <= 0:
        raise ValueError('Score some points before submitting.')
    if mode == 'sprint' and not 40 <= lines <= 43:
        raise ValueError('Finish all 40 lines before submitting a time.')
    return run_id, mode, name, score, time_ms, lines


def top(mode, db=None):
    if mode not in ('marathon', 'sprint'):
        raise ValueError('Unknown mode.')
    order = 'score DESC, time_ms ASC' if mode == 'marathon' else 'time_ms ASC, score DESC'
    def query(conn):
        return [dict(row) for row in conn.execute(
            f'SELECT id, name, score, time_ms, lines FROM scores WHERE mode=? ORDER BY {order}, created_at ASC, id ASC LIMIT 10', (mode,))]
    if db is not None:
        return query(db)
    with connect() as conn:
        return query(conn)


def submit(data):
    values = validate(data)
    with connect() as db:
        db.execute('INSERT OR IGNORE INTO scores (id,mode,name,score,time_ms,lines) VALUES (?,?,?,?,?,?)', values)
        return top(values[1], db)
