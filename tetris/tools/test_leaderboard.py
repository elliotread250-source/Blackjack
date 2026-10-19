"""Run with python -m unittest discover -s tetris/tools -p 'test_*.py'."""
import concurrent.futures
import importlib.util
import os
from pathlib import Path
import tempfile
import unittest
import uuid

_tmp = tempfile.TemporaryDirectory()
os.environ['TETRIS_DATA_DIR'] = _tmp.name
spec = importlib.util.spec_from_file_location('leaderboard', Path(__file__).parents[1] / 'leaderboard.py')
lb = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lb)

class LeaderboardTests(unittest.TestCase):
    def setUp(self):
        lb.initialize()
        with lb.connect() as db:
            db.execute('DELETE FROM scores')

    def entry(self, **changes):
        return dict(id=str(uuid.uuid4()), mode='marathon', name='Player', score=100, time_ms=60000, lines=0, **changes) if not changes else {**self.entry(), **changes}

    def test_ranking_modes_limit_and_restart(self):
        for score in range(1, 16):
            lb.submit(self.entry(score=score))
        for t in [90000, 45000, 60000]:
            lb.submit(self.entry(mode='sprint', time_ms=t, lines=40))
        lb.initialize()  # Startup must never erase saved scores.
        self.assertEqual([r['score'] for r in lb.top('marathon')], list(range(15, 5, -1)))
        self.assertEqual([r['time_ms'] for r in lb.top('sprint')], [45000, 60000, 90000])

    def test_retry_and_concurrent_submission(self):
        run = self.entry(name='  Test   Player  ')
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
            list(pool.map(lb.submit, [run] * 8))
        self.assertEqual(len(lb.top('marathon')), 1)
        self.assertEqual(lb.top('marathon')[0]['name'], 'Test Player')

    def test_reject_invalid_results(self):
        for changes in [dict(name='<script>'), dict(name=' '), dict(name='x'*21), dict(score=-1), dict(score=True), dict(time_ms=0), dict(mode='sprint', lines=39), dict(mode='other'), dict(id='invalid')]:
            with self.subTest(changes=changes), self.assertRaises(ValueError):
                lb.submit(self.entry(**changes))
        self.assertEqual(lb.top('marathon'), [])

if __name__ == '__main__':
    unittest.main()
