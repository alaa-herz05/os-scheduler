/* ==========================================================================
   simulator.js - application state, process table, controls, dashboard,
   state pipeline, Gantt + results rendering for the Simulator tab.
   All numbers come from Scheduler.* (scheduler.js); nothing is hard-coded.
   ========================================================================== */
(function (root) {
  'use strict';
  var S = root.Scheduler, V = root.Viz;
  var $ = function (id) { return document.getElementById(id); };
  var t = function (k, p) { return root.I18N.t(k, p); };
  var L = S.LIMITS;

  /* ---------------------------- shared state ---------------------------- */
  var App = root.App = {
    procs: [],            // [{id, arrival, burst, priority, ci}]  ci = colour index
    algo: 'fcfs',
    quantum: 3,
    result: null,         // Scheduler.simulate() result for the selected algorithm
    all: null,            // Scheduler.compareAll() result (all four algorithms)
    sim: { status: 'idle', T: 0, timer: null, log: [], prev: null },
    _h: {}
  };
  App.on = function (ev, fn) { (App._h[ev] = App._h[ev] || []).push(fn); };
  App.emit = function (ev) { (App._h[ev] || []).forEach(function (fn) { fn(); }); };
  App.colors = function () { var m = {}; App.procs.forEach(function (p) { m[p.id] = V.PALETTE[p.ci % V.PALETTE.length]; }); return m; };
  App.algoName = function (key, q) {
    if (key === 'rr') return t('algo.name.rr', { q: q == null ? App.quantum : q });
    return { fcfs: 'FCFS', sjf: 'SJF', priority: 'Priority' }[key];
  };
  App.view = function () {   // what the simulation is showing right now
    var s = App.sim;
    if (!App.result || s.status === 'idle') return { status: 'idle', T: null, states: null };
    return { status: s.status, T: s.T, states: S.statesAt(App.result, s.T) };
  };

  var SAMPLES = [
    { key: 'textbook', rows: [['P1', 0, 8, 3], ['P2', 1, 4, 1], ['P3', 2, 9, 4], ['P4', 3, 5, 2]] },
    { key: 'idle', rows: [['P1', 1, 4, 2], ['P2', 2, 3, 1], ['P3', 12, 2, 3], ['P4', 13, 1, 1]] },
    { key: 'equal', rows: [['P1', 0, 6, 2], ['P2', 0, 2, 4], ['P3', 0, 8, 1], ['P4', 0, 3, 3], ['P5', 0, 4, 2]] },
    { key: 'convoy', rows: [['P1', 0, 20, 2], ['P2', 1, 2, 1], ['P3', 2, 2, 3], ['P4', 3, 2, 2]] },
    { key: 'single', rows: [['P1', 0, 5, 1]] }
  ];
  var SPEED_MS = { 1: 1400, 2: 900, 3: 550, 4: 300, 5: 140 };

  /* ---------------------------- messages ---------------------------- */
  function say(id, kind, key, params) {
    var el = $(id); el.className = 'msg-line' + (kind ? ' ' + kind : ''); el.textContent = key ? t(key, params) : '';
  }
  function errParams() { return { amax: L.maxArrival, bmax: L.maxBurst, pmax: L.maxPriority, qmax: L.maxQuantum, n: L.maxProcesses }; }

  /* ---------------------------- recompute pipeline ---------------------------- */
  function recompute() {
    stopTimer();
    App.sim.status = 'idle'; App.sim.T = 0; App.sim.log = []; App.sim.prev = null;
    if (App.procs.length) {
      App.all = S.compareAll(App.procs, App.quantum);
      App.result = App.all[App.algo];
    } else { App.all = null; App.result = null; }
    renderAll();
    App.emit('data');
  }
  App.recompute = recompute;

  /* ---------------------------- process table ---------------------------- */
  function nextId() {
    var used = {}; App.procs.forEach(function (p) { used[p.id.toLowerCase()] = 1; });
    for (var n = 1; n < 100; n++) if (!used['p' + n]) return 'P' + n;
    return 'P99';
  }
  function freeColor() {
    var used = {}; App.procs.forEach(function (p) { used[p.ci] = 1; });
    for (var c = 0; c < V.PALETTE.length; c++) if (!used[c]) return c;
    return 0;
  }
  function addProcess(id, arrival, burst, priority) {
    App.procs.push({ id: id, arrival: arrival, burst: burst, priority: priority, ci: freeColor() });
  }

  function renderTable() {
    var tb = $('proc-table').querySelector('tbody'), cols = App.colors();
    tb.innerHTML = App.procs.map(function (p, i) {
      return '<tr data-i="' + i + '"><td class="l"><i class="dot" style="background:' + cols[p.id] + '"></i>' +
        '<input class="id" type="text" data-f="id" value="' + V.esc(p.id) + '" maxlength="6" aria-label="' + t('th.id') + '"></td>' +
        '<td><input type="text" inputmode="numeric" data-f="arrival" value="' + p.arrival + '" aria-label="' + t('th.at') + '"></td>' +
        '<td><input type="text" inputmode="numeric" data-f="burst" value="' + p.burst + '" aria-label="' + t('th.bt') + '"></td>' +
        '<td class="prcell"><input type="text" inputmode="numeric" data-f="priority" value="' + p.priority + '" aria-label="' + t('th.pr') + '"></td>' +
        '<td><button class="btn danger s" type="button" data-del="' + i + '" aria-label="' + t('btn.del') + ' ' + V.esc(p.id) + '">✕</button></td></tr>';
    }).join('');
    $('proc-table').style.display = App.procs.length ? '' : 'none';
    $('proc-empty').style.display = App.procs.length ? 'none' : '';
    $('proc-count').textContent = t('proc.count', { n: App.procs.length, max: L.maxProcesses });
    $('btn-add').disabled = App.procs.length >= L.maxProcesses;
    markPriorityColumn();
  }
  function markPriorityColumn() {
    var dim = App.algo !== 'priority';
    $('th-pr').classList.toggle('dimcol', dim);
    [].forEach.call(document.querySelectorAll('#proc-table .prcell'), function (c) { c.classList.toggle('dimcol', dim); });
  }

  function onTableInput(e) {
    var inp = e.target; if (!inp.dataset.f) return;
    var idx = +inp.closest('tr').dataset.i, f = inp.dataset.f, p = App.procs[idx], err;
    if (f === 'id') {
      var others = App.procs.filter(function (_, j) { return j !== idx; }).map(function (q) { return q.id; });
      err = S.validateId(inp.value, others);
      if (!err) p.id = inp.value.trim();
    } else {
      var v = S.parseInteger(inp.value); err = S.validateField(f, v);
      if (!err) p[f] = v;
    }
    inp.classList.toggle('bad', !!err);
    if (err) { say('proc-msg', 'err', 'err.' + err, errParams()); return; }
    say('proc-msg', '');
    if (f === 'id') [].forEach.call(document.querySelectorAll('#proc-table tbody tr'), function (tr, j) {
      tr.querySelector('.dot').style.background = App.colors()[App.procs[j].id];
    });
    recompute();
  }
  function onTableChange(e) {            // on blur: restore the last valid value if the field is invalid
    var inp = e.target; if (!inp.dataset.f || !inp.classList.contains('bad')) return;
    inp.value = App.procs[+inp.closest('tr').dataset.i][inp.dataset.f]; inp.classList.remove('bad'); say('proc-msg', '');
  }
  function onTableClick(e) {
    var b = e.target.closest('[data-del]'); if (!b) return;
    App.procs.splice(+b.dataset.del, 1); say('proc-msg', ''); renderTable(); recompute();
  }

  function onAdd(e) {
    e.preventDefault();
    if (App.procs.length >= L.maxProcesses) { say('proc-msg', 'err', 'err.max', errParams()); return; }
    var at = S.parseInteger($('a-at').value), bt = S.parseInteger($('a-bt').value), pr = S.parseInteger($('a-pr').value);
    var checks = [['a-at', 'arrival', at], ['a-bt', 'burst', bt], ['a-pr', 'priority', pr]], bad = null;
    checks.forEach(function (c) {
      var err = S.validateField(c[1], c[2]); $(c[0]).classList.toggle('bad', !!err);
      if (err && !bad) bad = err;
    });
    if (bad) { say('proc-msg', 'err', 'err.' + bad, errParams()); return; }
    var id = nextId(); addProcess(id, at, bt, pr);
    say('proc-msg', 'okk', 'ok.added', { p: id });
    renderTable(); recompute();
  }

  function fillSamples() {
    var sel = $('sample-sel'), cur = sel.value || '0';
    sel.innerHTML = SAMPLES.map(function (s, i) { return '<option value="' + i + '">' + t('sample.' + s.key) + '</option>'; }).join('');
    sel.value = cur;
  }
  function loadSample() {
    var s = SAMPLES[+$('sample-sel').value];
    App.procs = []; s.rows.forEach(function (r) { addProcess(r[0], r[1], r[2], r[3]); });
    say('proc-msg', 'okk', 'ok.sample', { name: t('sample.' + s.key) });
    renderTable(); recompute();
  }
  function clearAll() { App.procs = []; say('proc-msg', 'okk', 'ok.cleared'); renderTable(); recompute(); }

  /* ---------------------------- algorithm + quantum ---------------------------- */
  function setAlgo(key) {
    App.algo = key;
    [].forEach.call(document.querySelectorAll('#algos .algo'), function (b) {
      var on = b.dataset.algo === key; b.setAttribute('aria-checked', on); b.tabIndex = on ? 0 : -1;
    });
    ['quantum', 'quantum2'].forEach(function (id) { $(id).disabled = key !== 'rr' && id === 'quantum'; });
    markPriorityColumn();
    recompute();
  }
  function onQuantum(e) {
    var src = e.target, v = S.parseInteger(src.value), err = S.validateField('quantum', v);
    ['quantum', 'quantum2'].forEach(function (id) { $(id).classList.toggle('bad', !!err); });
    if (err) { say('q-msg', 'err', 'err.quantum', errParams()); return; }
    say('q-msg', '');
    ['quantum', 'quantum2'].forEach(function (id) { if ($(id) !== src) $(id).value = v; });
    if (v !== App.quantum) { App.quantum = v; recompute(); }   // an unchanged value must not reset a running simulation
  }
  function onQuantumBlur(e) {
    if (e.target.classList.contains('bad')) {
      ['quantum', 'quantum2'].forEach(function (id) { $(id).value = App.quantum; $(id).classList.remove('bad'); });
      say('q-msg', '');
    }
  }

  /* ---------------------------- simulation control ---------------------------- */
  function stopTimer() { if (App.sim.timer) { clearInterval(App.sim.timer); App.sim.timer = null; } }
  function startTimer() { stopTimer(); App.sim.timer = setInterval(advance, SPEED_MS[$('speed').value]); }
  function logEvents(T) {
    S.eventsAt(App.result, T).forEach(function (ev) {
      App.sim.log.unshift({ T: T, text: t('ev.' + ev.type, { p: ev.id }) });
    });
    if (App.sim.log.length > 60) App.sim.log.length = 60;
  }
  function advance() {
    var s = App.sim; if (!App.result || s.T >= App.result.total) return;
    s.T++; logEvents(s.T);
    if (s.T >= App.result.total) { s.status = 'done'; stopTimer(); }
    renderSim();
  }
  function simStart() {
    if (!App.result) return;
    var s = App.sim; stopTimer(); s.T = 0; s.log = []; s.prev = null; s.status = 'running';
    logEvents(0); renderSim(); startTimer();
  }
  function simPause() { if (App.sim.status === 'running') { stopTimer(); App.sim.status = 'paused'; renderSim(); } }
  function simResume() { if (App.sim.status === 'paused') { App.sim.status = 'running'; renderSim(); startTimer(); } }
  function simStep() {
    var s = App.sim; if (!App.result || s.status === 'done') return;
    if (s.status === 'idle') { s.T = 0; s.log = []; s.prev = null; s.status = 'paused'; logEvents(0); renderSim(); return; }
    if (s.status === 'running') { stopTimer(); s.status = 'paused'; }
    advance(); if (s.status !== 'done') { s.status = 'paused'; } renderSim();
  }
  function simReset() {
    stopTimer(); var s = App.sim; s.status = 'idle'; s.T = 0; s.log = []; s.prev = null; renderSim();
  }

  /* ---------------------------- rendering ---------------------------- */
  var STATE_KEYS = ['new', 'ready', 'running', 'waiting', 'terminated'];

  function renderSim() {
    var s = App.sim, r = App.result, v = App.view(), n = App.procs.length, cols = App.colors();
    var states = v.states, count = { new: 0, ready: 0, running: 0, waiting: 0, terminated: 0 };
    if (states) App.procs.forEach(function (p) { count[states.map[p.id]]++; }); else count.new = n;

    // dashboard
    var set = function (id, val) { var el = $(id); if (el.textContent !== String(val)) { el.textContent = val; el.parentNode.classList.remove('flash'); void el.parentNode.offsetWidth; el.parentNode.classList.add('flash'); } };
    set('k-total', n); set('k-ready', count.ready); set('k-running', states && states.running ? states.running : '—');
    set('k-waiting', count.waiting); set('k-done', count.terminated); set('k-algo', App.algoName(App.algo));

    // status / clock
    var badge = $('sim-status'); badge.textContent = t('status.' + s.status); badge.className = 'badge ' + s.status;
    $('sim-t').textContent = v.T == null ? t('sim.tIdle') : t('sim.t', { t: v.T });
    $('sim-prog').style.width = (r && v.T != null ? v.T / r.total * 100 : 0) + '%';

    // pipeline
    var pipe = $('pipe'), html = '';
    STATE_KEYS.forEach(function (k, i) {
      var ids = [];
      if (states) {
        if (k === 'ready') ids = states.queue.slice();
        else ids = App.procs.filter(function (p) { return states.map[p.id] === k; }).map(function (p) { return p.id; });
      } else if (k === 'new') ids = App.procs.map(function (p) { return p.id; });
      html += (i ? '<span class="parr" aria-hidden="true">→</span>' : '') +
        '<div class="pst s-' + k + (ids.length ? ' has' : '') + '"><h4><span>' + t('state.' + k) + '</span><em>' + ids.length + '</em></h4><div class="chips">' +
        ids.map(function (id) {
          var moved = s.prev && s.prev[id] !== k ? ' moved' : '';
          return '<span class="chip' + moved + '" style="background:' + cols[id] + '">' + V.esc(id) + '</span>';
        }).join('') + '</div></div>';
    });
    pipe.innerHTML = html;
    s.prev = states ? JSON.parse(JSON.stringify(states.map)) : null;

    var q = states ? states.queue : [];
    $('qline').innerHTML = '<span>' + t('q.cpu') + ': <b>' + (states && states.running ? V.esc(states.running) : '—') + '</b></span><span>' + t('q.ready') + ': ' +
      (q.length ? q.map(function (id) { return '<span class="chip" style="background:' + cols[id] + '">' + V.esc(id) + '</span>'; }).join(' ') : '<em>' + t('q.empty') + '</em>') + '</span>';
    $('log').innerHTML = s.log.length ? s.log.map(function (l) { return '<div><time>t=' + l.T + '</time>' + V.esc(l.text) + '</div>'; }).join('') : '<div>' + t('log.start') + '</div>';

    // gantt
    V.renderGantt($('gantt'), r, { colors: cols, upto: s.status === 'idle' ? null : s.T, idleLabel: t('gantt.idle') });
    V.renderLegend($('gantt-legend'), App.procs, cols);
    $('gantt-sub').textContent = !r ? t('res.empty') : (s.status === 'idle' ? t('gantt.sub.idle', { total: r.total }) : t('gantt.sub.run', { t: s.T, total: r.total }));

    // buttons
    var has = !!r;
    $('c-start').disabled = !has || s.status === 'running' || s.status === 'paused';
    $('c-pause').disabled = s.status !== 'running';
    $('c-resume').disabled = s.status !== 'paused';
    $('c-step').disabled = !has || s.status === 'done';
    $('c-reset').disabled = s.status === 'idle';
    App.emit('sim');
  }

  function renderResults() {
    var r = App.result, st = $('stats'), tb = $('res-table');
    if (!r) { st.innerHTML = ''; tb.innerHTML = ''; return; }
    var s = r.stats, f = V.fmt;
    st.innerHTML =
      stat(t('stat.awt'), f(s.avgWT), 'ΣWT / n') + stat(t('stat.atat'), f(s.avgTAT), 'ΣTAT / n') + stat(t('stat.art'), f(s.avgRT), 'ΣRT / n') +
      '<div class="stat"><small>' + t('stat.util') + '</small><b class="num">' + f(s.utilization) + '%</b><span class="formula">' + s.busy + ' / ' + r.total + '</span><div class="meter"><i style="width:' + s.utilization + '%"></i></div></div>' +
      stat(t('stat.cs'), s.contextSwitches, t('stat.cs.f'));
    var head = ['th.id', 'th.at', 'th.bt', 'th.pr', 'th.ct', 'th.tat', 'th.wt', 'th.rt'];
    var cols = App.colors();
    tb.innerHTML = '<thead><tr>' + head.map(function (k, i) { return '<th' + (i === 0 ? ' class="l"' : '') + ' title="' + V.esc(t(k + '.f')) + '">' + t(k) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      r.rows.map(function (x) {
        return '<tr><td class="l"><i class="dot" style="background:' + cols[x.id] + '"></i>' + V.esc(x.id) + '</td><td>' + x.arrival + '</td><td>' + x.burst + '</td><td' + (App.algo === 'priority' ? '' : ' class="dimcol"') + '>' + x.priority + '</td><td>' + x.completion + '</td><td>' + x.tat + '</td><td>' + x.wt + '</td><td>' + x.rt + '</td></tr>';
      }).join('') +
      '<tr class="avg"><td class="l" colspan="4">' + t('res.avg') + '</td><td>—</td><td>' + f(s.avgTAT) + '</td><td>' + f(s.avgWT) + '</td><td>' + f(s.avgRT) + '</td></tr></tbody>';
  }
  function stat(label, value, formula) {
    return '<div class="stat"><small>' + label + '</small><b class="num">' + value + '</b><span class="formula">' + formula + '</span></div>';
  }

  function renderAll() { renderResults(); renderSim(); }
  App.renderAll = function () { fillSamples(); renderTable(); renderAll(); };

  /* ---------------------------- wiring ---------------------------- */
  App.initSimulator = function () {
    var tbody = $('proc-table').querySelector('tbody');
    tbody.addEventListener('input', onTableInput); tbody.addEventListener('change', onTableChange); tbody.addEventListener('click', onTableClick);
    $('add-form').addEventListener('submit', onAdd);
    ['a-at', 'a-bt', 'a-pr'].forEach(function (id) { $(id).addEventListener('input', function () { this.classList.remove('bad'); }); });
    $('btn-sample').onclick = loadSample; $('btn-clear').onclick = clearAll;
    $('sample-sel').onchange = loadSample;
    [].forEach.call(document.querySelectorAll('#algos .algo'), function (b) {
      b.onclick = function () { setAlgo(b.dataset.algo); };
      b.onkeydown = function (e) {      // arrow keys move between radio options
        var keys = S.ALGO_ORDER, i = keys.indexOf(App.algo);
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); setAlgo(keys[(i + 1) % 4]); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); setAlgo(keys[(i + 3) % 4]); }
        var cur = document.querySelector('#algos .algo[aria-checked=true]'); if (cur && /Arrow/.test(e.key)) cur.focus();
      };
    });
    ['quantum', 'quantum2'].forEach(function (id) { $(id).addEventListener('input', onQuantum); $(id).addEventListener('blur', onQuantumBlur); });
    $('c-start').onclick = simStart; $('c-pause').onclick = simPause; $('c-resume').onclick = simResume;
    $('c-step').onclick = simStep; $('c-reset').onclick = simReset;
    $('speed').oninput = function () { $('speed-v').textContent = this.value + '×'; if (App.sim.status === 'running') startTimer(); };

    fillSamples(); $('sample-sel').value = '0';
    var s = SAMPLES[0]; s.rows.forEach(function (r) { addProcess(r[0], r[1], r[2], r[3]); });
    renderTable(); setAlgo('fcfs');
  };
})(window);
