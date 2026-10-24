"""SQLite on the Railway volume: one database for all three IO games ($DATA_DIR/io.db, WAL mode).

The schema is created on start (CREATE ... IF NOT EXISTS), so a fresh volume needs no migration step.
A backup copy goes to $DATA_DIR/backups once a day; the newest 14 are kept.
"""

import os
import sqlite3
import threading
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.environ.get("DATA_DIR") or ("/data" if os.path.isdir("/data") else os.path.join(ROOT, "data"))
DB_FILE = os.path.join(DATA_DIR, "io.db")
BACKUP_DIR = os.path.join(DATA_DIR, "backups")

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY, username TEXT NOT NULL, uname TEXT NOT NULL UNIQUE,
  pin_hash TEXT NOT NULL, pin_salt TEXT NOT NULL, rec_hash TEXT NOT NULL, rec_salt TEXT NOT NULL,
  created INTEGER NOT NULL, last_active INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS devices (token_hash TEXT PRIMARY KEY, created INTEGER NOT NULL, active_user INTEGER);
CREATE TABLE IF NOT EXISTS device_logins (token_hash TEXT NOT NULL, user_id INTEGER NOT NULL, last_used INTEGER NOT NULL,
  PRIMARY KEY (token_hash, user_id));
CREATE TABLE IF NOT EXISTS best (game TEXT NOT NULL, user_id INTEGER NOT NULL, score INTEGER NOT NULL, at INTEGER NOT NULL,
  PRIMARY KEY (game, user_id));
CREATE INDEX IF NOT EXISTS best_rank ON best(game, score DESC, at ASC);
CREATE TABLE IF NOT EXISTS runs (id INTEGER PRIMARY KEY, game TEXT NOT NULL, user_id INTEGER NOT NULL, score INTEGER NOT NULL,
  seconds INTEGER NOT NULL, at INTEGER NOT NULL);
"""

lock = threading.RLock()
_db = None


def now():
    return int(time.time())


def open_db():
    global _db
    os.makedirs(DATA_DIR, exist_ok=True)
    _db = sqlite3.connect(DB_FILE, check_same_thread=False, isolation_level=None)
    _db.row_factory = sqlite3.Row
    _db.execute("PRAGMA journal_mode=WAL")
    _db.executescript(SCHEMA)


class Tx:
    def __enter__(self):
        lock.acquire()
        _db.execute("BEGIN IMMEDIATE")
        return _db

    def __exit__(self, kind, *_):
        try:
            _db.execute("ROLLBACK" if kind else "COMMIT")
        finally:
            lock.release()
        return False


def q(sql, *args):
    with lock:
        return _db.execute(sql, args).fetchall()


def q1(sql, *args):
    with lock:
        return _db.execute(sql, args).fetchone()


def backup():
    if not os.path.exists(DB_FILE):
        return
    os.makedirs(BACKUP_DIR, exist_ok=True)
    dest = os.path.join(BACKUP_DIR, time.strftime("io-%Y%m%d-%H%M%S.db", time.gmtime()))
    with lock:
        out = sqlite3.connect(dest)
        with out:
            _db.backup(out)
        out.close()
    files = sorted(f for f in os.listdir(BACKUP_DIR) if f.startswith("io-"))
    for f in files[:-14]:
        try:
            os.remove(os.path.join(BACKUP_DIR, f))
        except OSError:
            pass


def daily_backups():
    while True:
        time.sleep(24 * 3600)
        try:
            backup()
        except Exception as exc:  # a failed backup must never take the games down
            print(f"backup failed: {exc!r}", flush=True)
