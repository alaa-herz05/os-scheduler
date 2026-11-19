/* Run with:  node tests/scheduler.test.js
   Expected values were derived BY HAND (Gantt charts worked out on paper),
   then the engine output is compared against them. Property tests add
   invariants over many random process sets. */
'use strict';
var S = require('../js/scheduler.js');
var passed = 0, failed = 0;

function eq(actual, expected, label) {
  var a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a === e) passed++; else { failed++; console.log('FAIL  ' + label + '\n   expected ' + e + '\n   actual   ' + a); }
}
function near(actual, expected, label) {
  if (Math.abs(actual - expected) < 1e-9) passed++; else { failed++; console.log('FAIL  ' + label + ' expected ' + expected + ' got ' + actual); }
}
var P = function (id, a, b, pr) { return { id: id, arrival: a, burst: b, priority: pr == null ? 1 : pr }; };
var gantt = function (r) { return r.blocks.map(function (b) { return (b.pid || 'idle') + ':' + b.start + '-' + b.end; }).join(' '); };
var col = function (r, k) { return r.rows.map(function (x) { return x[k]; }); };

/* ---- Test set A: textbook set (P1 0/8/3, P2 1/4/1, P3 2/9/4, P4 3/5/2) ---- */
var A = [P('P1', 0, 8, 3), P('P2', 1, 4, 1), P('P3', 2, 9, 4), P('P4', 3, 5, 2)];
var r = S.simulate('fcfs', A);
eq(gantt(r), 'P1:0-8 P2:8-12 P3:12-21 P4:21-26', 'A FCFS gantt');
eq(col(r, 'completion'), [8, 12, 21, 26], 'A FCFS CT');
eq(col(r, 'tat'), [8, 11, 19, 23], 'A FCFS TAT');
eq(col(r, 'wt'), [0, 7, 10, 18], 'A FCFS WT');
eq(col(r, 'rt'), [0, 7, 10, 18], 'A FCFS RT');
near(r.stats.avgWT, 8.75, 'A FCFS avg WT'); near(r.stats.avgTAT, 15.25, 'A FCFS avg TAT'); near(r.stats.avgRT, 8.75, 'A FCFS avg RT');
near(r.stats.utilization, 100, 'A FCFS util');

r = S.simulate('sjf', A);
eq(gantt(r), 'P1:0-8 P2:8-12 P4:12-17 P3:17-26', 'A SJF gantt');
eq(col(r, 'completion'), [8, 12, 26, 17], 'A SJF CT');
eq(col(r, 'tat'), [8, 11, 24, 14], 'A SJF TAT');
eq(col(r, 'wt'), [0, 7, 15, 9], 'A SJF WT');
eq(col(r, 'rt'), [0, 7, 15, 9], 'A SJF RT');
near(r.stats.avgWT, 7.75, 'A SJF avg WT'); near(r.stats.avgTAT, 14.25, 'A SJF avg TAT');

r = S.simulate('priority', A);
eq(gantt(r), 'P1:0-8 P2:8-12 P4:12-17 P3:17-26', 'A Priority gantt');
near(r.stats.avgWT, 7.75, 'A Priority avg WT');

r = S.simulate('rr', A, 3);
eq(gantt(r), 'P1:0-3 P2:3-6 P3:6-9 P4:9-12 P1:12-15 P2:15-16 P3:16-19 P4:19-21 P1:21-23 P3:23-26', 'A RR q=3 gantt');
eq(col(r, 'completion'), [23, 16, 26, 21], 'A RR CT');
eq(col(r, 'tat'), [23, 15, 24, 18], 'A RR TAT');
eq(col(r, 'wt'), [15, 11, 15, 13], 'A RR WT');
eq(col(r, 'rt'), [0, 2, 4, 6], 'A RR RT');
near(r.stats.avgWT, 13.5, 'A RR avg WT'); near(r.stats.avgTAT, 20, 'A RR avg TAT'); near(r.stats.avgRT, 3, 'A RR avg RT');
eq(r.stats.contextSwitches, 9, 'A RR context switches');

/* ---- Test set B: CPU idle gaps (P1 2/3, P2 10/2) ---- */
var B = [P('P1', 2, 3), P('P2', 10, 2)];
['fcfs', 'sjf', 'priority', 'rr'].forEach(function (a) {
  r = S.simulate(a, B, 2);
  eq(gantt(r), 'idle:0-2 P1:2-5 idle:5-10 P2:10-12', 'B ' + a + ' gantt with idle');
  eq(col(r, 'completion'), [5, 12], 'B ' + a + ' CT');
  eq(col(r, 'wt'), [0, 0], 'B ' + a + ' WT');
  eq(col(r, 'rt'), [0, 0], 'B ' + a + ' RT');
  near(r.stats.utilization, 5 / 12 * 100, 'B ' + a + ' utilization');
  eq(r.stats.idle, 7, 'B ' + a + ' idle time');
});

/* ---- Test set C: single process ---- */
['fcfs', 'sjf', 'priority', 'rr'].forEach(function (a) {
  r = S.simulate(a, [P('P1', 0, 5)], 2);
  eq(gantt(r), 'P1:0-5', 'C ' + a + ' gantt'); eq(col(r, 'wt'), [0], 'C WT'); near(r.stats.utilization, 100, 'C util');
});

/* ---- Test set D: equal arrival / burst / priority -> input order ---- */
var D = [P('P1', 0, 4, 2), P('P2', 0, 4, 2), P('P3', 0, 4, 2)];
['fcfs', 'sjf', 'priority'].forEach(function (a) {
  r = S.simulate(a, D);
  eq(gantt(r), 'P1:0-4 P2:4-8 P3:8-12', 'D ' + a + ' tie-break gantt'); eq(col(r, 'wt'), [0, 4, 8], 'D ' + a + ' WT'); near(r.stats.avgWT, 4, 'D avg WT');
});
r = S.simulate('rr', D, 2);
eq(gantt(r), 'P1:0-2 P2:2-4 P3:4-6 P1:6-8 P2:8-10 P3:10-12', 'D RR gantt');
eq(col(r, 'completion'), [8, 10, 12], 'D RR CT'); eq(col(r, 'wt'), [4, 6, 8], 'D RR WT'); eq(col(r, 'rt'), [0, 2, 4], 'D RR RT');

/* ---- Test set E: SJF and Priority disagree ---- */
var E = [P('P1', 0, 5, 2), P('P2', 0, 3, 3), P('P3', 0, 1, 1)];
r = S.simulate('sjf', E);
eq(gantt(r), 'P3:0-1 P2:1-4 P1:4-9', 'E SJF gantt'); eq(col(r, 'wt'), [4, 1, 0], 'E SJF WT'); near(r.stats.avgWT, 5 / 3, 'E SJF avg WT');
r = S.simulate('priority', E);
eq(gantt(r), 'P3:0-1 P1:1-6 P2:6-9', 'E Priority gantt'); eq(col(r, 'wt'), [1, 6, 0], 'E Priority WT'); near(r.stats.avgWT, 7 / 3, 'E Priority avg WT');

/* ---- Test set F: RR arrival exactly at quantum expiry is queued BEFORE the preempted process ---- */
r = S.simulate('rr', [P('P1', 0, 4), P('P2', 2, 2)], 2);
eq(gantt(r), 'P1:0-2 P2:2-4 P1:4-6', 'F RR arrival-at-expiry gantt');
eq(col(r, 'completion'), [6, 4], 'F CT'); eq(col(r, 'wt'), [2, 0], 'F WT'); eq(col(r, 'rt'), [0, 0], 'F RT');

/* ---- Test set G: non-preemptive means a late short job does not interrupt ---- */
r = S.simulate('sjf', [P('P1', 0, 7), P('P2', 1, 1)]);
eq(gantt(r), 'P1:0-7 P2:7-8', 'G SJF non-preemptive');
r = S.simulate('priority', [P('P1', 0, 7, 5), P('P2', 1, 1, 1)]);
eq(gantt(r), 'P1:0-7 P2:7-8', 'G Priority non-preemptive');

/* ---- Test set H: RR with idle gap in the middle ---- */
r = S.simulate('rr', [P('P1', 0, 1), P('P2', 5, 2)], 2);
eq(gantt(r), 'P1:0-1 idle:1-5 P2:5-7', 'H RR idle gap'); near(r.stats.utilization, 3 / 7 * 100, 'H util');

/* ---- Test set I: Priority tie -> earlier arrival ---- */
r = S.simulate('priority', [P('P1', 1, 2, 1), P('P2', 0, 3, 1), P('P3', 2, 1, 1)]);
eq(gantt(r), 'P2:0-3 P1:3-5 P3:5-6', 'I priority tie -> earlier arrival');

/* ---- Test set J: RR with huge quantum == FCFS ---- */
var rrBig = S.simulate('rr', A, 50), fc = S.simulate('fcfs', A);
eq(gantt(rrBig), gantt(fc), 'J RR(q>=max burst) equals FCFS');

/* ---- Test set K: RR q=1 on short mix: P1 0/3, P2 0/2 ---- */
r = S.simulate('rr', [P('P1', 0, 3), P('P2', 0, 2)], 1);
eq(gantt(r), 'P1:0-1 P2:1-2 P1:2-3 P2:3-4 P1:4-5', 'K RR q=1 gantt');
eq(col(r, 'completion'), [5, 4], 'K CT'); eq(col(r, 'wt'), [2, 2], 'K WT'); eq(col(r, 'rt'), [0, 1], 'K RT');

/* ---- Empty list, validation, lowest-waiting helper, snapshots/states ---- */
r = S.simulate('fcfs', []);
eq([r.total, r.blocks.length, r.rows.length], [0, 0, 0], 'empty list');
eq(S.validateField('burst', 0), 'burst', 'burst 0 rejected'); eq(S.validateField('burst', 1.5), 'burst', 'decimal rejected');
eq(S.validateField('arrival', -1), 'arrival', 'negative arrival rejected'); eq(S.validateField('arrival', 0), null, 'arrival 0 ok');
eq(S.validateField('quantum', 0), 'quantum', 'quantum 0 rejected'); eq(S.validateField('quantum', 3), null, 'quantum 3 ok');
eq(S.validateField('priority', NaN), 'priority', 'NaN rejected');
eq(isNaN(S.parseInteger('')), true, 'empty text invalid'); eq(isNaN(S.parseInteger('2.5')), true, 'decimal text invalid'); eq(S.parseInteger(' 7 '), 7, 'trim int');
eq(S.validateId('P1', ['P1']), 'idDuplicate', 'duplicate id'); eq(S.validateId('1P', []), 'idFormat', 'bad id'); eq(S.validateId('P9', ['P1']), null, 'ok id');
var all = S.compareAll(A, 3);
eq(S.lowestWaiting(all), ['sjf', 'priority'], 'lowest avg WT on set A (SJF and Priority tie at 7.75)');
eq(S.lowestWaiting(S.compareAll(E, 2)), ['sjf'], 'lowest avg WT on set E');
var st = S.statesAt(S.simulate('rr', A, 3), 3);
eq(st.map, { P1: 'ready', P2: 'running', P3: 'ready', P4: 'ready' }, 'states at t=3 (RR)');
eq(st.queue, ['P3', 'P4', 'P1'], 'RR queue at t=3 (P4 arrived at 3 before preempted P1)');
eq(S.statesAt(S.simulate('rr', A, 3), 26).map, { P1: 'terminated', P2: 'terminated', P3: 'terminated', P4: 'terminated' }, 'states at end');
eq(S.statesAt(S.simulate('fcfs', B), 0).map, { P1: 'new', P2: 'new' }, 'states at t=0 with idle');
eq(S.eventsAt(S.simulate('rr', A, 3), 3).map(function (e) { return e.type + ':' + (e.id || ''); }),
   ['arrive:P4', 'preempt:P1', 'dispatch:P2'], 'events at t=3');

/* ---- Property tests on random sets ---- */
var seed = 12345; function rnd() { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }
function ri(a, b) { return a + Math.floor(rnd() * (b - a + 1)); }
for (var iter = 0; iter < 400; iter++) {
  var n = ri(1, 8), set = [];
  for (var i = 0; i < n; i++) set.push(P('P' + (i + 1), ri(0, 12), ri(1, 9), ri(1, 4)));
  S.ALGO_ORDER.forEach(function (a) {
    var q = ri(1, 5), res = S.simulate(a, set, q), tag = a + ' iter' + iter + ' ' + JSON.stringify(set) + ' q' + q;
    var ok = true, why = '';
    // blocks contiguous from 0, no overlap
    var cur = 0; res.blocks.forEach(function (b) { if (b.start !== cur || b.end <= b.start) { ok = false; why = 'blocks'; } cur = b.end; });
    if (cur !== res.total) { ok = false; why = 'total'; }
    res.rows.forEach(function (row) {
      var ran = 0, first = null;
      res.blocks.forEach(function (b) { if (b.pid === row.id) { ran += b.end - b.start; if (first === null) first = b.start; if (b.start < row.arrival) { ok = false; why = 'ran before arrival'; } } });
      if (ran !== row.burst) { ok = false; why = 'burst mismatch ' + row.id; }
      if (row.tat !== row.completion - row.arrival || row.wt !== row.tat - row.burst || row.rt !== first - row.arrival) { ok = false; why = 'formulas'; }
      if (row.wt < 0 || row.rt < 0 || row.rt > row.wt) { ok = false; why = 'negative or rt>wt'; }
      if (a !== 'rr' && ran !== row.completion - first) { ok = false; why = 'non-preemptive process was interrupted'; }
    });
    // work conserving: CPU idle only when nothing has arrived and is unfinished
    res.snapshots.forEach(function (s) { if (s.running === null) { var pending = res.rows.some(function (r) { return r.arrival <= s.t && r.completion > s.t; }); if (pending) { ok = false; why = 'idle while ready'; } } });
    near(res.stats.avgWT, res.rows.reduce(function (s, r) { return s + r.wt; }, 0) / n, 'avg WT ' + tag);
    if (ok) passed++; else { failed++; console.log('FAIL property (' + why + ') ' + tag); }
  });
}

console.log('\n' + passed + ' checks passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
