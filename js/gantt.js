/* ==========================================================================
   gantt.js - rendering helpers: process colours, Gantt chart, number format.
   Pure presentation: it only draws what Scheduler.simulate() returned.
   ========================================================================== */
(function (root) {
  'use strict';

  // Light tones so dark text stays readable on every block.
  var PALETTE = ['#b58cff', '#ffb454', '#4ade80', '#38bdf8', '#ff7a9a', '#f0abfc',
                 '#fde047', '#2dd4bf', '#fb923c', '#bef264', '#93a5ff', '#fca5a5'];

  function fmt(n) { return String(+Number(n).toFixed(2)); }

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /**
   * Draw a Gantt chart.
   * @param {HTMLElement} host
   * @param {object} result  output of Scheduler.simulate
   * @param {object} opts    { colors: {id: '#hex'}, upto: number (reveal up to this time), compact: bool, idleLabel: string }
   */
  function renderGantt(host, result, opts) {
    opts = opts || {};
    var total = result ? result.total : 0;
    if (!total) { host.innerHTML = ''; return; }
    var upto = opts.upto == null ? total : Math.min(opts.upto, total);
    var colors = opts.colors || {};
    var px = opts.compact ? Math.max(3, 250 / total) : Math.max(14, Math.min(46, Math.floor(980 / total)));   // compact charts fit their card; px is also used for label spacing
    var inner = total * px;

    var blocks = '', ticks = [], lastX = -1e9, cursor = '';
    result.blocks.forEach(function (b) {
      if (b.start >= upto) return;
      var end = Math.min(b.end, upto), w = (end - b.start) * px;
      var left = b.start / total * 100, width = (end - b.start) / total * 100;
      var label = b.pid === null ? (opts.idleLabel || 'idle') : esc(b.pid);
      var range = w >= (opts.compact ? 30 : 44) ? '<small>' + b.start + '–' + end + '</small>' : '';
      var isNow = opts.upto != null && upto < total && end === upto && b.end > upto;
      blocks += '<div class="gb' + (b.pid === null ? ' idle' : '') + (isNow ? ' now' : '') + '" style="left:' + left + '%;width:' + width + '%' +
        (b.pid === null ? '' : ';background:' + (colors[b.pid] || '#b58cff')) + '" title="' + label + ' [' + b.start + ', ' + end + ')">' +
        (w >= 16 || b.pid !== null ? '<span>' + label + '</span>' : '') + range + '</div>';
      [b.start, end].forEach(function (tm) { if (ticks.indexOf(tm) < 0) ticks.push(tm); });
    });
    ticks.sort(function (a, b) { return a - b; });

    // axis: show every block boundary that has room for its label (greedy, left to right)
    var axis = '';
    ticks.forEach(function (tm) {
      var x = tm * px, wLabel = String(tm).length * 7 + 8;
      if (x - lastX >= wLabel) { axis += '<span style="left:' + (tm / total * 100) + '%">' + tm + '</span>'; lastX = x; }
    });
    if (opts.upto != null && upto < total) cursor = '<div class="gcur" data-t="' + upto + '" style="left:' + (upto / total * 100) + '%"></div>';

    host.innerHTML = '<div class="gscroll' + (opts.compact ? ' compact' : '') + '"><div class="gwrap" style="' + (opts.compact ? 'width:100%' : 'width:' + (inner + 30) + 'px') + '">' +
      '<div class="ginner" style="--u:' + px + 'px"><div class="gtrack" style="--u:' + px + 'px">' + blocks + '</div>' +
      '<div class="gaxis">' + axis + '</div>' + cursor + '</div></div></div>';
  }

  function renderLegend(host, procs, colors) {
    host.innerHTML = procs.map(function (p) {
      return '<span><i class="dot" style="background:' + colors[p.id] + '"></i>' + esc(p.id) + '</span>';
    }).join('');
  }

  root.Viz = { PALETTE: PALETTE, fmt: fmt, esc: esc, renderGantt: renderGantt, renderLegend: renderLegend };
})(window);
