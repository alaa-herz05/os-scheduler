/* ==========================================================================
   scheduler.js  -  PURE scheduling logic (no DOM, no rendering).
   Works in the browser (window.Scheduler) and in Node (module.exports).

   Time model: all times are integers (time units). The CPU is simulated one
   time unit at a time, which makes every result exact and lets the UI replay
   the real schedule step by step.

   TIE-BREAKING RULES (deterministic)
   1. FCFS      : earlier arrival first; tie -> lower row position (input order).
   2. SJF (NP)  : shorter burst first; tie -> earlier arrival -> input order.
   3. Priority  : LOWER number = HIGHER priority; tie -> earlier arrival -> input order.
   4. Round Robin: FIFO ready queue. If a process arrives at the same instant a
      running process's quantum expires, the NEW arrival is queued first and the
      preempted process goes to the back.
   5. Non-preemptive algorithms never interrupt a running process.
   ========================================================================== */
(function (root) {
  'use strict';

  var LIMITS = { maxProcesses: 10, maxArrival: 100, maxBurst: 50, maxPriority: 20, maxQuantum: 50, maxId: 6 };

  var ALGORITHMS = {
    fcfs: { key: 'fcfs', short: 'FCFS', preemptive: false },
    sjf: { key: 'sjf', short: 'SJF', preemptive: false },
    priority: { key: 'priority', short: 'Priority', preemptive: false },
    rr: { key: 'rr', short: 'RR', preemptive: true }
  };
  var ALGO_ORDER = ['fcfs', 'sjf', 'priority', 'rr'];

  /* ---------- validation (returns an error code string, or null if valid) ---------- */
  function isInt(v) { return typeof v === 'number' && isFinite(v) && Math.floor(v) === v; }

  function validateField(field, value) {
    if (field === 'arrival') {
      if (!isInt(value) || value < 0 || value > LIMITS.maxArrival) return 'arrival';
    } else if (field === 'burst') {
      if (!isInt(value) || value < 1 || value > LIMITS.maxBurst) return 'burst';
    } else if (field === 'priority') {
      if (!isInt(value) || value < 1 || value > LIMITS.maxPriority) return 'priority';
    } else if (field === 'quantum') {
      if (!isInt(value) || value < 1 || value > LIMITS.maxQuantum) return 'quantum';
    }
    return null;
  }

  /** Parse text from an <input>. Empty / non-numeric / decimals -> NaN (invalid). */
  function parseInteger(text) {
    var s = String(text == null ? '' : text).trim();
    if (!/^-?\d+$/.test(s)) return NaN;
    return parseInt(s, 10);
  }

  function validateId(id, others) {
    var s = String(id == null ? '' : id).trim();
    if (!/^[A-Za-z][A-Za-z0-9]{0,5}$/.test(s)) return 'idFormat';
    for (var i = 0; i < others.length; i++) if (others[i].toLowerCase() === s.toLowerCase()) return 'idDuplicate';
    return null;
  }

  /* ---------- helpers ---------- */
  function cloneProcesses(list) {
    return list.map(function (p, i) {
      return { id: p.id, arrival: p.arrival, burst: p.burst, priority: p.priority, order: i, remaining: p.burst,
               firstStart: null, completion: null };
    });
  }

  /** Comparator for the three non-preemptive policies. */
  function comparatorFor(algo) {
    var byArrivalThenOrder = function (a, b) { return a.arrival - b.arrival || a.order - b.order; };
    if (algo === 'fcfs') return byArrivalThenOrder;
    if (algo === 'sjf') return function (a, b) { return a.burst - b.burst || byArrivalThenOrder(a, b); };
    if (algo === 'priority') return function (a, b) { return a.priority - b.priority || byArrivalThenOrder(a, b); };
    throw new Error('Unknown algorithm: ' + algo);
  }

  /**
   * Run one algorithm.
   * @param {string} algo   'fcfs' | 'sjf' | 'priority' | 'rr'
   * @param {Array}  list   [{id, arrival, burst, priority}]
   * @param {number} quantum time quantum (only used by 'rr')
   * @returns {{algo, blocks, rows, snapshots, total, stats}}
   *   blocks    : [{pid|null, start, end}]  (pid === null means CPU idle)
   *   rows      : per process {id, arrival, burst, priority, start, completion, tat, wt, rt}
   *   snapshots : snapshots[t] = {t, running: id|null, ready: [ids in queue order]}  for t in [0,total)
   */
  function simulate(algo, list, quantum) {
    if (!ALGORITHMS[algo]) throw new Error('Unknown algorithm: ' + algo);
    var procs = cloneProcesses(list);
    var n = procs.length;
    if (n === 0) return { algo: algo, blocks: [], rows: [], snapshots: [], total: 0, stats: emptyStats() };
    if (algo === 'rr' && validateField('quantum', quantum)) throw new Error('Invalid time quantum');

    var byArrival = procs.slice().sort(function (a, b) { return a.arrival - b.arrival || a.order - b.order; });
    var nextArrival = 0;            // index into byArrival
    var ready = [];                 // FIFO queue for RR, plain pool for the others
    var cmp = algo === 'rr' ? null : comparatorFor(algo);
    var running = null, sliceLeft = 0, done = 0, t = 0;
    var snapshots = [];

    function admit() {
      while (nextArrival < n && byArrival[nextArrival].arrival <= t) ready.push(byArrival[nextArrival++]);
    }

    while (done < n) {
      admit();
      if (running === null && ready.length) {
        if (algo === 'rr') { running = ready.shift(); sliceLeft = quantum; }
        else {
          var best = 0;
          for (var i = 1; i < ready.length; i++) if (cmp(ready[i], ready[best]) < 0) best = i;
          running = ready.splice(best, 1)[0];
        }
        if (running.firstStart === null) running.firstStart = t;
      }

      var queueView = algo === 'rr' ? ready.map(idOf) : ready.slice().sort(cmp).map(idOf);
      snapshots.push({ t: t, running: running ? running.id : null, ready: queueView });

      // execute one time unit
      if (running) { running.remaining--; sliceLeft--; }
      t++;
      admit();   // arrivals at time t are queued BEFORE a preempted process (rule 4)

      if (running) {
        if (running.remaining === 0) { running.completion = t; done++; running = null; }
        else if (algo === 'rr' && sliceLeft === 0) { ready.push(running); running = null; }
      }
    }

    var blocks = buildBlocks(snapshots);
    var rows = procs.map(function (p) {
      var tat = p.completion - p.arrival;
      return { id: p.id, arrival: p.arrival, burst: p.burst, priority: p.priority,
               start: p.firstStart, completion: p.completion, tat: tat, wt: tat - p.burst, rt: p.firstStart - p.arrival };
    });
    return { algo: algo, blocks: blocks, rows: rows, snapshots: snapshots, total: t, stats: computeStats(rows, blocks, t) };
  }

  function idOf(p) { return p.id; }

  /** Merge consecutive equal ticks into blocks. */
  function buildBlocks(snapshots) {
    var blocks = [];
    snapshots.forEach(function (s) {
      var last = blocks[blocks.length - 1];
      if (last && last.pid === s.running && last.end === s.t) last.end = s.t + 1;
      else blocks.push({ pid: s.running, start: s.t, end: s.t + 1 });
    });
    return blocks;
  }

  function emptyStats() { return { avgWT: 0, avgTAT: 0, avgRT: 0, utilization: 0, busy: 0, idle: 0, contextSwitches: 0 }; }

  function computeStats(rows, blocks, total) {
    var n = rows.length, sum = function (k) { return rows.reduce(function (a, r) { return a + r[k]; }, 0); };
    var busy = rows.reduce(function (a, r) { return a + r.burst; }, 0);
    var switches = 0, prev = null;
    blocks.forEach(function (b) { if (b.pid === null) return; if (prev !== null && prev !== b.pid) switches++; prev = b.pid; });
    return { avgWT: sum('wt') / n, avgTAT: sum('tat') / n, avgRT: sum('rt') / n,
             utilization: total ? busy / total * 100 : 0, busy: busy, idle: total - busy, contextSwitches: switches };
  }

  /** Run all four algorithms on the same process list. */
  function compareAll(list, quantum) {
    var out = {};
    ALGO_ORDER.forEach(function (a) { out[a] = simulate(a, list, quantum); });
    return out;
  }

  /** Keys of the algorithms with the lowest average waiting time (ties -> several). */
  function lowestWaiting(results) {
    var eps = 1e-9, min = Infinity;
    ALGO_ORDER.forEach(function (a) { min = Math.min(min, results[a].stats.avgWT); });
    return ALGO_ORDER.filter(function (a) { return Math.abs(results[a].stats.avgWT - min) < eps; });
  }

  /**
   * Describe what changed at clock time T (used by the simulation log).
   * Returns events derived from real snapshots/rows, nothing invented.
   */
  function eventsAt(result, T) {
    var ev = [], snaps = result.snapshots, rows = result.rows;
    rows.forEach(function (r) { if (r.arrival === T) ev.push({ type: 'arrive', id: r.id }); });
    var prev = T > 0 ? snaps[T - 1].running : null;
    var curr = T < snaps.length ? snaps[T].running : null;
    rows.forEach(function (r) { if (r.completion === T) ev.push({ type: 'finish', id: r.id }); });
    if (prev !== null && prev !== curr) {
      var pr = rows.filter(function (r) { return r.id === prev; })[0];
      if (pr && pr.completion !== T) ev.push({ type: 'preempt', id: prev });
    }
    if (curr !== null && curr !== prev) ev.push({ type: 'dispatch', id: curr });
    if (curr === null && T < snaps.length) ev.push({ type: 'idle' });
    if (T === result.total && result.total > 0) ev.push({ type: 'done' });
    return ev;
  }

  /** State of every process at clock time T: new | ready | running | terminated (+ ordered ready queue). */
  function statesAt(result, T) {
    var map = {}, snap = result.snapshots[T] || null;
    result.rows.forEach(function (r) {
      var s;
      if (r.completion <= T) s = 'terminated';
      else if (r.arrival > T) s = 'new';
      else if (snap && snap.running === r.id) s = 'running';
      else s = 'ready';
      map[r.id] = s;
    });
    return { map: map, running: snap ? snap.running : null, queue: snap ? snap.ready : [] };
  }

  var api = { LIMITS: LIMITS, ALGORITHMS: ALGORITHMS, ALGO_ORDER: ALGO_ORDER, validateField: validateField,
              validateId: validateId, parseInteger: parseInteger, simulate: simulate, compareAll: compareAll,
              lowestWaiting: lowestWaiting, eventsAt: eventsAt, statesAt: statesAt };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Scheduler = api;
})(typeof window !== 'undefined' ? window : this);
