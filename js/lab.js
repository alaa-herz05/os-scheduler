/* ==========================================================================
   lab.js - Interactive Process Lab (ported from the original project).
   fork() / exec() / wait() / exit() on a live process tree, including
   zombies and cascading termination. Text comes from i18n (lab.* keys).
   ========================================================================== */
(function (root) {
  'use strict';
  var App = root.App;
  var $ = function (id) { return document.getElementById(id); };
  var t = function (k, p) { return root.I18N.t(k, p); };
  var reduce = root.matchMedia && root.matchMedia('(prefers-reduced-motion:reduce)').matches;

  App.initLab = function () {
    var svg = $('lab-svg'), msg = $('lab-msg'), lg = $('lab-log'), bs = $('lab-btns').querySelectorAll('[data-a]');
    var N, nextPid, sel, LOG, lastText;

    function get(id) { for (var i = 0; i < N.length; i++) if (N[i].id === id) return N[i]; }
    function kids(id) { return N.filter(function (n) { return n.p === id && n.s !== 'gone'; }); }
    function desc(id, out) { kids(id).forEach(function (k) { out.push(k); desc(k.id, out); }); return out; }
    function live() { return N.filter(function (n) { return n.s !== 'gone'; }); }

    var seen = {}; // ids already drawn (so only brand-new nodes play the "born" animation)
    function draw() {
      var pos = {}, leaf = 0, maxD = 0, h = '', dieIdx = 0;
      function lay(n, d) {
        var ks = kids(n.id); if (d > maxD) maxD = d;
        if (!ks.length) pos[n.id] = [leaf++, d];
        else { ks.forEach(function (k) { lay(k, d + 1); }); pos[n.id] = [(pos[ks[0].id][0] + pos[ks[ks.length - 1].id][0]) / 2, d]; }
      }
      lay(N[0], 0);
      var W = Math.max(1000, leaf * 150), H = Math.max(440, 100 + maxD * 120 + 70);
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.style.minHeight = Math.min(H * 0.9, 620) + 'px';
      var X = function (p) { return (p[0] + .5) * W / Math.max(leaf, 1); }, Y = function (p) { return 62 + p[1] * 120; };
      live().forEach(function (n) {
        if (n.p && pos[n.id] && pos[n.p]) h += '<line pathLength="1" class="pe' + (n.s === 'dead' ? ' dead' : '') + (seen[n.id] ? '' : ' born') + '" x1="' + X(pos[n.p]) + '" y1="' + Y(pos[n.p]) + '" x2="' + X(pos[n.id]) + '" y2="' + Y(pos[n.id]) + '"/>';
      });
      live().forEach(function (n) {
        var p = pos[n.id]; if (!p) return; var x = X(p), y = Y(p);
        var cls = n.s + (n.id === sel ? ' sel' : '') + (seen[n.id] ? '' : ' born');
        var sty = n.s === 'dead' ? ' style="animation-delay:' + ((dieIdx++) * 0.28) + 's"' : '';
        h += '<g class="pn ' + cls + '"' + sty + ' data-id="' + n.id + '" tabindex="0" role="button" aria-label="P' + n.id + ' ' + t('lab.s.' + n.s) + '">' +
          (n.id === sel ? '<circle class="ring" cx="' + x + '" cy="' + y + '" r="40"/>' : '') +
          '<circle class="body" cx="' + x + '" cy="' + y + '" r="31"/><text x="' + x + '" y="' + (y + 5) + '">P' + n.id + '</text>' +
          '<text class="sub" x="' + x + '" y="' + (y + 56) + '">' + t('lab.s.' + n.s) + ' · ' + (n.p ? t('lab.pg.' + n.pg) : t('lab.root')) + '</text></g>';
        seen[n.id] = 1;
      });
      svg.innerHTML = h;
      var s = get(sel), ok = s && s.s === 'run';
      [].forEach.call(bs, function (b) { b.disabled = b.dataset.a !== 'reset' && !ok; });
      lg.innerHTML = LOG.map(function (x) { return '<div>' + x + '</div>'; }).join('');
      msg.textContent = lastText;
    }
    // messages are stored as keys+params so they can be re-rendered when the language changes
    function say(key, params) {
      var text = t(key, params); LOG.unshift(text); if (LOG.length > 6) LOG.pop(); lastText = text; draw();
    }
    function reset() { seen = {}; N = [{ id: 100, p: 0, s: 'run', pg: 0 }]; nextPid = 101; sel = 100; LOG = []; lastText = t('lab.ph'); say('lab.msg.reset'); lastText = t('lab.ph'); draw(); }

    function act(a) {
      if (a === 'reset') { reset(); return; }
      var n = get(sel); if (!n || n.s !== 'run') { say('lab.msg.off'); return; }
      if (a === 'fork') {
        if (live().length >= 9) { say('lab.msg.limit'); return; }
        var c = { id: nextPid++, p: n.id, s: 'run', pg: 0 }; N.push(c); say('lab.msg.fork', { p: n.id, c: c.id });
      } else if (a === 'exec') { n.pg = 1; say('lab.msg.exec', { p: n.id }); }
      else if (a === 'wait') {
        var ks = kids(n.id), z = ks.filter(function (k) { return k.s === 'zom'; })[0];
        if (z) { z.s = 'gone'; say('lab.msg.w1', { p: n.id, k: z.id }); }
        else if (ks.some(function (k) { return k.s === 'run' || k.s === 'wait'; })) { n.s = 'wait'; say('lab.msg.w2', { p: n.id }); }
        else say('lab.msg.w0', { p: n.id });
      } else if (a === 'exit') {
        var ds = desc(n.id, []), gone = ds.slice(), text;
        ds.forEach(function (d) { d.s = 'dead'; });
        if (!n.p) { n.s = 'dead'; text = t('lab.msg.x3', { p: n.id }); }
        else {
          var par = get(n.p);
          if (par.s === 'wait') { par.s = 'run'; if (ds.length) { n.s = 'dead'; gone.push(n); } else n.s = 'gone'; text = t('lab.msg.x1', { p: n.id, q: par.id }); }
          else { n.s = 'zom'; text = t('lab.msg.x2', { p: n.id, q: par.id }); }
        }
        if (ds.length) text += ' ' + t('lab.msg.cas', { a: ds.map(function (d) { return 'P' + d.id; }).join(', ') });
        sel = n.p || n.id;
        LOG.unshift(text); if (LOG.length > 6) LOG.pop(); lastText = text; draw();
        if (gone.length) setTimeout(function () { gone.forEach(function (d) { d.s = 'gone'; }); draw(); }, reduce ? 0 : 1700);
      }
    }

    [].forEach.call(bs, function (b) { b.onclick = function () { act(b.dataset.a); }; });
    svg.onclick = function (e) { var g = e.target.closest ? e.target.closest('g.pn') : null; if (g) { sel = +g.dataset.id; draw(); } };
    svg.onkeydown = function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        var g = e.target.closest ? e.target.closest('g.pn') : null;
        if (g) { e.preventDefault(); sel = +g.dataset.id; draw(); var q = svg.querySelector('g[data-id="' + sel + '"]'); if (q) q.focus(); }
      }
    };
    App.on('lang', function () { lastText = t('lab.ph'); draw(); });
    reset();
  };
})(window);
