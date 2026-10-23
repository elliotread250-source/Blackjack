"""Deterministic gameplay and real HTTP multiplayer contract checks."""
import unittest, random, time, threading, json
from urllib.request import Request,urlopen
from urllib.error import HTTPError
from http.server import ThreadingHTTPServer
from functools import partial
import server as game

class Mechanics(unittest.TestCase):
 def setUp(self):random.seed(38)
 def room(self,kind):
  r=game.Room(kind);r.players.clear();r.tiles.clear();r.items=[];r.add('one','One');r.add('two','Two');
  for p in r.players.values():p.update(x=-200,y=-200,angle=0,input={'angle':0})
  r.players['two'].update(x=300,y=0)
  return r,r.players['one'],r.players['two']
 def test_loop_claims_enclosed_ground(self):
  r,p,q=self.room('paper');r.tiles={(20,20):'one'};p['trail']=[[x,20] for x in range(20,26)]+[[25,y] for y in range(21,26)]+[[x,25] for x in range(24,19,-1)]+[[20,y] for y in range(24,19,-1)]
  r.capture(p);self.assertEqual(r.tiles[(22,22)],'one');self.assertEqual(p['trail'],[]);self.assertNotIn((10,10),r.tiles)
 def test_exposed_ribbon_can_be_cut(self):
  for kind in ('paper','scissor'):
   r,p,q=self.room(kind);q['trail']=[list(game.cell(p['x'],p['y']))];r.tick(0);self.assertFalse(q['alive'])
 def test_snake_eats_and_grows(self):
  r,p,q=self.room('snake');r.items=[dict(x=p['x'],y=p['y'],r=3,kind=0)];r.tick(0);self.assertGreater(p['mass'],70);self.assertEqual(p['score'],3)
 def test_snake_body_collision(self):
  r,p,q=self.room('snake');q['trail']=[[p['x'],p['y']]]*12;r.tick(0);self.assertFalse(p['alive'])
 def test_hole_respects_object_size(self):
  r,p,q=self.room('hole');r.items=[dict(x=p['x'],y=p['y'],r=36,kind=1)];r.tick(0);self.assertEqual(p['mass'],70);r.items=[dict(x=p['x'],y=p['y'],r=4,kind=0)];r.tick(0);self.assertGreater(p['mass'],70)
 def test_blob_splits_preserving_mass(self):
  r,p,q=self.room('blob');p['input']['split']=True;r.tick(0);self.assertEqual(len(p['cells']),2);self.assertEqual(sum(c['mass'] for c in p['cells']),70)
 def test_blob_eats_smaller_cell(self):
  r,p,q=self.room('blob');p['cells']=[dict(x=0,y=0,mass=200,merge=0)];q['cells']=[dict(x=0,y=0,mass=70,merge=0)];r.tick(0);self.assertFalse(q['alive']);self.assertEqual(p['mass'],270)
 def test_blob_merges_after_cooldown(self):
  r,p,q=self.room('blob');p['cells']=[dict(x=0,y=0,mass=35,merge=0),dict(x=1,y=0,mass=35,merge=0)];r.tick(0);self.assertEqual(len(p['cells']),1);self.assertEqual(p['mass'],70)
 def test_wall_death_and_respawn(self):
  r,p,q=self.room('snake');p['x']=500;r.tick(0);self.assertFalse(p['alive']);p['respawn']=0;r.tick(0);self.assertTrue(p['alive'])

 def test_round_results_then_fresh_board(self):
  r,p,q=self.room('paper');p['score']=123;r.end=time.time()-1;r.tick(0)
  self.assertEqual(r.winner['name'],'One');self.assertEqual(p['score'],123)
  r.end=time.time()-7;r.tick(0)
  self.assertIsNone(r.winner);self.assertEqual(p['score'],sum(v=='one' for v in r.tiles.values()));self.assertLess(p['score'],123);self.assertGreater(r.end,time.time())


class Multiplayer(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.http=ThreadingHTTPServer(('127.0.0.1',0),partial(game.Handler,directory=game.ROOT));threading.Thread(target=cls.http.serve_forever,daemon=True).start();cls.url='http://127.0.0.1:'+str(cls.http.server_port)
 @classmethod
 def tearDownClass(cls):cls.http.shutdown();cls.http.server_close()
 def call(self,path,data):
  with urlopen(Request(self.url+path,data=json.dumps(data).encode(),headers={'Content-Type':'application/json'})) as r:return json.load(r)
 def test_two_clients_same_room_and_private_credentials(self):
  for kind in game.GAMES:
   one=self.call('/api/join',dict(game=kind,name='First'));two=self.call('/api/join',dict(game=kind,name='Second',room=one['room']))
   self.assertEqual(one['room'],two['room']);self.assertNotEqual(one['token'],two['token']);self.assertEqual(len(two['state']['players']),9)
   self.assertNotIn(one['token'],json.dumps(two['state']))
   out=self.call('/api/input',dict(room=one['room'],token=one['token'],angle=1.2));self.assertTrue(any(p['name']=='Second' for p in out['state']['players']))
   with self.assertRaises(HTTPError) as e:self.call('/api/input',dict(room=one['room'],token=one['player'],angle=0))
   self.assertEqual(e.exception.code,404)
 def test_invalid_room_and_nonfinite_input_rejected(self):
  with self.assertRaises(HTTPError):self.call('/api/join',dict(game='snake',room='MISSING'))
  one=self.call('/api/join',dict(game='snake'))
  with self.assertRaises(HTTPError):self.call('/api/input',dict(room=one['room'],token=one['token'],angle=float('nan')))

if __name__=='__main__':unittest.main()
