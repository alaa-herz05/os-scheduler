/* ==========================================================================
   learn.js - the short theory section's interactive pieces:
   memory layout, state diagram, PCB (with live data), bounded buffer.
   Ported from the original ch3.html demos and made language-aware.
   ========================================================================== */
(function (root) {
  'use strict';
  var S = root.Scheduler, V = root.Viz, App = root.App;
  var $ = function (id) { return document.getElementById(id); };
  var t = function (k, p) { return root.I18N.t(k, p); };

  /* ---------- memory layout: stack and heap grow toward each other ---------- */
  function initMemory() {
    var s = 2, h = 2, e = $('mem').children, msg = $('m-msg'), clashed = false;
    function show(key) { msg.textContent = t(key); msg.dataset.k = key; }
    function sh() { e[0].style.flex = s; e[1].style.flex = 8 - s - h; e[2].style.flex = h; }
    function grow(which) { if (8 - s - h <= 0) { show('m.clash'); return; } if (which === 's') s++; else h++; show('m.ok'); sh(); }
    $('m-sg').onclick = function () { grow('s'); };
    $('m-hg').onclick = function () { grow('h'); };
    $('m-sr').onclick = function () { if (s > 1) s--; show('m.ok'); sh(); };
    $('m-hr').onclick = function () { if (h > 1) h--; show('m.ok'); sh(); };
    App.on('lang', function () { show(msg.dataset.k || 'm.ok'); });
    show('m.ok'); sh();
  }

  /* ---------- state diagram (New → Ready → Running → Waiting → Terminated) ---------- */
  var NODES = { new: [80, 50, 'New'], term: [680, 50, 'Terminated'], ready: [240, 150, 'Ready'], run: [520, 150, 'Running'], wait: [380, 285, 'Waiting'] };
  var EDGES = [['new>ready', 'M128 68Q190 84 212 123', 'admitted', 160, 56, 'start'], ['ready>run', 'M272 176Q380 222 488 176', 'scheduler dispatch', 380, 222, 'middle'],
    ['run>ready', 'M492 125Q380 48 268 125', 'interrupt', 380, 64, 'middle'], ['run>term', 'M556 128Q600 80 646 70', 'exit', 578, 76, 'end'],
    ['run>wait', 'M546 176Q540 256 440 274', 'I/O or event wait', 552, 250, 'start'], ['wait>ready', 'M322 272Q232 262 232 178', 'I/O or event completion', 224, 262, 'end']];
  var TRANS = [['new>ready', 'admit'], ['ready>run', 'dispatch'], ['run>ready', 'interrupt'], ['run>wait', 'wait'], ['wait>ready', 'io'], ['run>term', 'exit']];

  function drawDiagram() {
    var s = '<svg viewBox="0 0 760 330" role="img" aria-label="Process state diagram"><defs><marker id="dh" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#a794c4"/></marker></defs>';
    EDGES.forEach(function (e) {
      s += '<g class="ed" data-t="' + e[0] + '" tabindex="0" role="button" aria-label="' + e[2] + '"><path class="l" d="' + e[1] + '" marker-end="url(#dh)"/><path class="h" d="' + e[1] + '"/><text x="' + e[3] + '" y="' + e[4] + '" text-anchor="' + e[5] + '">' + e[2] + '</text></g>';
    });
    Object.keys(NODES).forEach(function (k) {
      s += '<g class="nd" data-s="' + k + '"><ellipse cx="' + NODES[k][0] + '" cy="' + NODES[k][1] + '" rx="62" ry="27"/><text x="' + NODES[k][0] + '" y="' + (NODES[k][1] + 5) + '" text-anchor="middle">' + NODES[k][2] + '</text></g>';
    });
    return s + '</svg>';
  }

  function initStates() {
    var cur = 'new', last = '', lastMsg = 'sm.init';
    $('state-dg').innerHTML = drawDiagram();
    function buttons() {
      $('state-btns').innerHTML = TRANS.map(function (x) { return '<button class="btn s" type="button" data-t="' + x[0] + '" data-k="' + x[1] + '">' + t('sm.b.' + x[1]) + '</button>'; }).join('') +
        '<button class="btn s o" type="button" data-t="reset">' + t('sm.b.reset') + '</button>';
    }
    function paint() {
      [].forEach.call(document.querySelectorAll('#state-dg .nd'), function (n) { n.classList.toggle('on', n.dataset.s === cur); });
      [].forEach.call(document.querySelectorAll('#state-dg .ed'), function (e) { e.classList.toggle('av', e.dataset.t.indexOf(cur + '>') === 0); e.classList.toggle('hot', e.dataset.t === last); });
      $('state-msg').textContent = t(lastMsg);
    }
    function go(tr) {
      if (tr === 'reset') { cur = 'new'; last = ''; lastMsg = 'sm.init'; paint(); return; }
      var p = tr.split('>');
      if (cur === p[0]) { cur = p[1]; last = tr; lastMsg = 'sm.m.' + TRANS.filter(function (x) { return x[0] === tr; })[0][1]; } else lastMsg = 'sm.bad';
      paint();
    }
    $('p-learn').addEventListener('click', function (e) { var el = e.target.closest('#state-dg .ed, #state-btns [data-t]'); if (el) go(el.dataset.t); });
    $('state-dg').addEventListener('keydown', function (e) { var el = e.target.closest('.ed'); if (el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); go(el.dataset.t); } });
    App.on('lang', function () { buttons(); paint(); });
    buttons(); paint();
  }

  /* ---------- PCB overview + live view ---------- */
  var PCB = ['pid', 'state', 'pc', 'regs', 'sched', 'mem', 'acct', 'io'];
  function initPCB() {
    var selField = 'pid', grid = $('pcb-grid');
    function drawGrid() {
      grid.innerHTML = PCB.map(function (k) { return '<button class="pcbf' + (k === selField ? ' on' : '') + '" type="button" data-k="' + k + '">' + t('pcb.' + k) + '<small>' + t('pcb.' + k + '.s') + '</small></button>'; }).join('');
      $('pcb-info').innerHTML = '<b>' + t('pcb.' + selField) + ':</b> ' + t('pcb.' + selField + '.d');
    }
    grid.addEventListener('click', function (e) { var b = e.target.closest('.pcbf'); if (b) { selField = b.dataset.k; drawGrid(); } });

    function drawLive() {
      var sel = $('pcb-sel'), prev = sel.value;
      sel.innerHTML = App.procs.map(function (p) { return '<option>' + V.esc(p.id) + '</option>'; }).join('');
      if (prev && App.procs.some(function (p) { return p.id === prev; })) sel.value = prev;
      var tb = $('pcb-live'), p = App.procs.filter(function (q) { return q.id === sel.value; })[0];
      if (!p || !App.result) { tb.innerHTML = '<tr><td>' + t('res.empty') + '</td></tr>'; return; }
      var v = App.view(), snaps = App.result.snapshots, T = v.T, used = 0, waited = 0, state = 'new', qpos = '—';
      if (T != null) {
        for (var i = 0; i < T; i++) { if (snaps[i].running === p.id) used++; else if (p.arrival <= i && App.result.rows.filter(function (r) { return r.id === p.id; })[0].completion > i) waited++; }
        state = v.states.map[p.id];
        var qi = v.states.queue.indexOf(p.id); if (qi >= 0) qpos = String(qi + 1);
      }
      var rows = [['pid', V.esc(p.id)], ['state', t('state.' + state)], ['pc', T == null ? '—' : t('pcb.pc.v', { n: used })], ['regs', t('pcb.regs.v')],
        ['sched', t('pcb.sched.v', { pr: p.priority, q: qpos })], ['mem', t('pcb.mem.v')], ['acct', T == null ? '—' : t('pcb.acct.v', { u: used, b: p.burst, w: waited })], ['io', t('pcb.io.v')]];
      tb.innerHTML = '<thead><tr><th>' + t('pcb.field') + '</th><th>' + t('pcb.value') + '</th></tr></thead><tbody>' +
        rows.map(function (r) { return '<tr><td>' + t('pcb.' + r[0]) + '</td><td class="num">' + r[1] + '</td></tr>'; }).join('') + '</tbody>';
    }
    $('pcb-sel').onchange = drawLive;
    App.on('sim', drawLive); App.on('data', drawLive);
    App.on('lang', function () { drawGrid(); drawLive(); });
    drawGrid(); drawLive();
  }

  /* ---------- bounded buffer (producer-consumer) ---------- */
  function initBuffer() {
    var n = 0, slots = $('slots').children, msg = $('b-msg'), key = 'b.init';
    function sh() { [].forEach.call(slots, function (s, i) { s.classList.toggle('f', i < n); s.textContent = i < n ? '■' : ''; }); msg.textContent = t(key); }
    $('b-prod').onclick = function () { if (n >= slots.length) key = 'b.full'; else { n++; key = 'b.p'; } sh(); };
    $('b-cons').onclick = function () { if (n <= 0) key = 'b.empty'; else { n--; key = 'b.c'; } sh(); };
    App.on('lang', sh); sh();
  }

  App.initLearn = function () {
    initMemory(); initStates(); initPCB(); initBuffer();
    [].forEach.call(document.querySelectorAll('[data-goto]'), function (b) { b.onclick = function () { App.showTab(b.dataset.goto); }; });
  };
})(window);
