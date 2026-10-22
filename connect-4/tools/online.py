import asyncio,json,sys
from websockets.asyncio.client import connect
URL=sys.argv[1] if len(sys.argv)>1 else 'ws://localhost:8947/ws'
async def recv(ws,t):
 while True:
  m=json.loads(await asyncio.wait_for(ws.recv(),5))
  if m['t']==t:return m
async def send(ws,**m):await ws.send(json.dumps(m))
async def main():
 async with connect(URL) as a,connect(URL) as b:
  await send(a,t='create',name='Test Red'); room=await recv(a,'room')
  await send(b,t='join',name='Test Yellow',code=room['code'])
  sa,sb=await recv(a,'start'),await recv(b,'start')
  players=[a,b]; first=sa['first']
  await send(players[1-first],t='move',col=0,n=0); assert (await recv(players[1-first],'reject'))['why']=='turn'
  for n,col in enumerate([0,1,0,1,0,1,0]):
   await send(players[(first+n)%2],t='move',col=col,n=n)
   ma,mb=await recv(a,'move'),await recv(b,'move');assert ma==mb
  assert ma['score'][first]==1
  await send(a,t='rematch');await recv(b,'rematch_req');await send(b,t='rematch')
  sa,sb=await recv(a,'start'),await recv(b,'start');assert sa['first']==1-first and not sa['moves']
  async with connect(URL) as c:
   await send(c,t='resume',code=sa['code'],token=sa['token']);sc=await recv(c,'start');assert sc['score']==sa['score'];await send(c,t='leave')
 async with connect(URL) as a,connect(URL) as b:
  await send(a,t='quick',name='A');await recv(a,'queued');await send(b,t='quick',name='B');await recv(a,'start');await recv(b,'start');await send(a,t='leave')
 print('Online rooms, turn validation, synchronized win, rematch, resume and quick match passed')
asyncio.run(main())
