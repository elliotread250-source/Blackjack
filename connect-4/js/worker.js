/* Runs the bot off the main thread so the board keeps animating while it
 * thinks. Message in: { id, moves, level, budget }. Out: { id, move }. */
'use strict';
importScripts('bot.js');
self.onmessage = function (ev) {
  var d = ev.data || {};
  var move = null;
  try { move = self.C4Bot.chooseMove(d.moves || [], d.level, { budget: d.budget }); } catch (e) { move = null; }
  self.postMessage({ id: d.id, move: move });
};
