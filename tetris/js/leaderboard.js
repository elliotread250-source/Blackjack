(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const savedName = () => { try { return localStorage.getItem('tetris.playerName') || ''; } catch (_) { return ''; } };
  class Leaderboard {
    constructor(app) {
      this.app = app;
      this.dialog = $('leaderboard-dialog');
      this.mode = 'marathon';
      this.request = 0;
      this.reset();
      $('player-name').value = savedName();
      for (const id of ['btn-leaderboard', 'btn-over-leaderboard']) $(id).addEventListener('click', () => this.open(app.mode));
      $('btn-close-leaderboard').addEventListener('click', () => this.dialog.close());
      $('btn-refresh-leaderboard').addEventListener('click', () => this.load());
      for (const button of document.querySelectorAll('[data-leaderboard-mode]')) {
        button.addEventListener('click', () => { this.mode = button.dataset.leaderboardMode; this.load(); });
      }
      $('score-form').addEventListener('submit', event => { event.preventDefault(); this.save(); });
    }
    reset() {
      this.result = null;
      this.saved = false;
      this.saving = false;
      $('score-form').hidden = true;
      $('btn-save-score').disabled = false;
      $('player-name').disabled = false;
      $('btn-save-score').textContent = 'Save score';
      $('score-status').textContent = 'Names and results are public.';
    }
    prepare(game, complete) {
      if (this.result) return;
      if (game.mode === 'sprint' ? !complete : game.score <= 0) return;
      this.result = {
        id: crypto.randomUUID(), mode: game.mode, score: Math.round(game.score),
        time_ms: Math.max(1, Math.round(game.time)), lines: game.lines,
      };
      $('score-form').hidden = false;
    }
    async fetchJSON(url, options = {}) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Please try again.');
        return data;
      } finally { clearTimeout(timeout); }
    }
    open(mode) {
      this.mode = mode;
      this.app.input.releaseAll();
      if (!this.dialog.open) this.dialog.showModal();
      this.load();
    }
    async load() {
      const request = ++this.request, mode = this.mode;
      for (const button of document.querySelectorAll('[data-leaderboard-mode]')) button.setAttribute('aria-pressed', String(button.dataset.leaderboardMode === mode));
      $('leaderboard-value').textContent = mode === 'marathon' ? 'Score' : 'Time';
      $('leaderboard-rows').replaceChildren();
      $('leaderboard-status').textContent = 'Loading leaderboard…';
      try {
        const data = await this.fetchJSON('/api/leaderboard?mode=' + mode);
        if (request !== this.request) return;
        this.render(data.entries, mode);
      } catch (_) {
        if (request === this.request) $('leaderboard-status').textContent = 'Could not load scores. Try Refresh.';
      }
    }
    render(entries, mode) {
      const rows = $('leaderboard-rows');
      rows.replaceChildren();
      $('leaderboard-status').textContent = entries.length
        ? (mode === 'marathon' ? 'Top 10 · highest scores' : 'Top 10 · fastest completed times')
        : 'No scores yet. Be the first!';
      entries.forEach((entry, i) => {
        const row = document.createElement('tr');
        if (this.result && entry.id === this.result.id) row.className = 'mine';
        const value = mode === 'marathon' ? entry.score.toLocaleString() : window.TetrisRender.fmtTime(entry.time_ms);
        for (const text of [String(i + 1), entry.name, value]) {
          const cell = document.createElement('td');
          cell.textContent = text;
          row.append(cell);
        }
        rows.append(row);
      });
    }
    async save() {
      if (!this.result || this.saved || this.saving) return;
      const name = $('player-name').value.trim().replace(/\s+/g, ' ');
      if (!name) { $('player-name').focus(); return; }
      const result = this.result;
      this.saving = true;
      $('btn-save-score').disabled = true;
      $('score-status').textContent = 'Saving…';
      try {
        await this.fetchJSON('/api/leaderboard', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...result, name }),
        });
        if (result !== this.result) return;
        this.saved = true;
        $('player-name').disabled = true;
        $('btn-save-score').textContent = 'Saved';
        $('score-status').textContent = 'Score saved! View the leaderboard below.';
        try { localStorage.setItem('tetris.playerName', name); } catch (_) { /* optional preference */ }
      } catch (error) {
        if (result !== this.result) return;
        $('score-status').textContent = error.name === 'AbortError' ? 'Connection timed out. Try saving again.' : 'Could not save: ' + error.message;
        $('btn-save-score').disabled = false;
      } finally { if (result === this.result) this.saving = false; }
    }
  }
  window.TetrisLeaderboard = Leaderboard;
}());
