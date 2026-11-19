/* ==========================================================================
   compare.js - runs all four algorithms on the SAME process list (data comes
   from Scheduler.compareAll via App.all) and draws bars + summary cards.
   ========================================================================== */
(function (root) {
  'use strict';
  var S = root.Scheduler, V = root.Viz, App = root.App;
  var $ = function (id) { return document.getElementById(id); };
  var t = function (k, p) { return root.I18N.t(k, p); };

  var METRICS = [
    { key: 'avgWT', label: 'cmp.m.wt', better: 'cmp.lower', win: true },
    { key: 'avgTAT', label: 'cmp.m.tat', better: 'cmp.lower' },
    { key: 'avgRT', label: 'cmp.m.rt', better: 'cmp.lower' },
    { key: 'utilization', label: 'cmp.m.util', better: 'cmp.higher', pct: true }
  ];

  function render() {
    var all = App.all;
    if (!all) {
      $('cmp-banner').innerHTML = '<b>' + t('cmp.empty') + '</b>';
      $('cmp-bars').innerHTML = ''; $('cmp-cards').innerHTML = ''; return;
    }
    var winners = S.lowestWaiting(all), f = V.fmt, keys = S.ALGO_ORDER;
    var names = winners.map(function (k) { return App.algoName(k); }).join(' + ');
    $('cmp-banner').innerHTML = '<b style="font-size:16px">★ ' +
      t(winners.length > 1 ? 'cmp.tie' : 'cmp.win', { names: names, v: f(all[winners[0]].stats.avgWT) }) + '</b><span class="mut" style="font-size:13.5px">' + t('cmp.note') + '</span>';

    // bar groups
    $('cmp-bars').innerHTML = METRICS.map(function (m) {
      var max = Math.max.apply(null, keys.map(function (k) { return all[k].stats[m.key]; }));
      var rows = keys.map(function (k) {
        var v = all[k].stats[m.key], w = m.pct ? v : (max ? v / max * 100 : 0);
        var win = m.win && winners.indexOf(k) >= 0;
        return '<div class="brow' + (win ? ' win' : '') + '"><span class="nm">' + (win ? '★ ' : '') + V.esc(S.ALGORITHMS[k].short) + '</span>' +
          '<div class="btrack"><div class="bfill" style="width:' + Math.max(w, v > 0 ? 1.5 : 0) + '%"></div></div><span class="v">' + f(v) + (m.pct ? '%' : '') + '</span></div>';
      }).join('');
      return '<div class="card bgroup"><h3>' + t(m.label) + '</h3><div class="mut" style="font-size:12.5px;margin-bottom:4px">' + t(m.better) + '</div>' + rows + '</div>';
    }).join('');

    // per-algorithm cards with a compact Gantt
    var cols = App.colors();
    $('cmp-cards').innerHTML = keys.map(function (k) {
      var s = all[k].stats, win = winners.indexOf(k) >= 0;
      return '<div class="card acard' + (win ? ' win' : '') + '"><div class="ah"><h3 style="margin:0">' + V.esc(App.algoName(k)) + '</h3>' +
        (win ? '<span class="crown">★ ' + t('cmp.lowest') + '</span>' : '') + '</div>' +
        '<div class="mini"><div><small>WT</small><b>' + f(s.avgWT) + '</b></div><div><small>TAT</small><b>' + f(s.avgTAT) + '</b></div><div><small>RT</small><b>' + f(s.avgRT) + '</b></div><div><small>CPU</small><b>' + f(s.utilization) + '%</b></div></div>' +
        '<div class="ghost" data-a="' + k + '"></div><div class="mut" style="font-size:12.5px;margin-top:6px">' + t('stat.cs') + ': <b class="num">' + s.contextSwitches + '</b></div></div>';
    }).join('');
    [].forEach.call(document.querySelectorAll('#cmp-cards .ghost'), function (h) {
      V.renderGantt(h, all[h.dataset.a], { colors: cols, compact: true, idleLabel: t('gantt.idle') });
    });
  }

  App.initCompare = function () { App.on('data', render); App.on('lang', render); render(); };
})(window);
