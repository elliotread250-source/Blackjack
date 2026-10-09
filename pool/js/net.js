/* WebSocket client for online play. Same host and port as the page (Railway
 * terminates TLS and proxies WebSockets), path /ws. Keeps a ping going so
 * proxies don't drop idle sockets and so the HUD can show connection quality. */
(function (root) {
  'use strict';
  var ws = null, handlers = {}, queue = [], pingTimer = null, pingId = 0, pingSent = {};
  var state = 'idle', rtt = 0, lastPong = 0;

  function url() {
    var loc = root.location;
    return (loc.protocol === 'https:' ? 'wss' : 'ws') + '://' + loc.host + '/ws';
  }
  function emit(name, arg) { if (handlers[name]) try { handlers[name](arg); } catch (e) { if (root.console) console.error(e); } }

  var Net = {
    on: function (name, fn) { handlers[name] = fn; },
    get state() { return state; },
    get rtt() { return rtt; },
    get quality() {
      if (state !== 'open') return 0;
      if (lastPong && performance.now() - lastPong > 35000) return 1;
      return rtt < 250 ? 3 : rtt < 700 ? 2 : 1;
    },
    connect: function () {
      if (ws && (state === 'open' || state === 'connecting')) return;
      state = 'connecting';
      try { ws = new WebSocket(url()); } catch (e) { state = 'closed'; emit('close', 'error'); return; }
      var sock = ws;
      ws.onopen = function () {
        if (sock !== ws) return;
        state = 'open';
        lastPong = performance.now();
        while (queue.length) sock.send(queue.shift());
        clearInterval(pingTimer);
        pingTimer = setInterval(Net.ping, 15000);
        Net.ping();
        emit('open');
      };
      ws.onmessage = function (ev) {
        if (sock !== ws) return;
        var msg;
        try { msg = JSON.parse(ev.data); } catch (e) { return; }
        if (!msg || typeof msg !== 'object' || typeof msg.t !== 'string') return;
        if (msg.t === 'pong') {
          var sent = pingSent[msg.id];
          if (sent) { rtt = performance.now() - sent; delete pingSent[msg.id]; }
          lastPong = performance.now();
          emit('quality');
          return;
        }
        emit('message', msg);
      };
      ws.onclose = function () {
        if (sock !== ws) return;
        state = 'closed';
        clearInterval(pingTimer);
        ws = null; queue = [];
        emit('close', 'closed');
      };
      ws.onerror = function () { /* onclose follows */ };
    },
    ping: function () {
      if (state !== 'open') return;
      var id = ++pingId;
      pingSent[id] = performance.now();
      Net.send({ t: 'ping', id: id });
    },
    send: function (obj) {
      var data = JSON.stringify(obj);
      if (state === 'open' && ws) { try { ws.send(data); } catch (e) { /* closing */ } }
      else if (state === 'connecting') queue.push(data);
    },
    close: function () {
      clearInterval(pingTimer);
      if (ws) { var s = ws; ws = null; try { s.close(); } catch (e) { /* ignore */ } }
      state = 'idle'; queue = [];
    }
  };
  root.PoolNet = Net;
})(typeof window !== 'undefined' ? window : globalThis);
