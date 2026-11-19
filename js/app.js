/* ==========================================================================
   app.js - bootstrap: tab dashboard (no page reloads), language toggle,
   module initialisation.
   ========================================================================== */
(function (root) {
  'use strict';
  var App = root.App, I18N = root.I18N;
  var tabs = [].slice.call(document.querySelectorAll('.tbn'));
  var panels = [].slice.call(document.querySelectorAll('.panel'));

  App.showTab = function (name, focus) {
    tabs.forEach(function (b) {
      var on = b.dataset.tab === name;
      b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1;
      if (on && focus) b.focus();
    });
    panels.forEach(function (p) { p.classList.toggle('on', p.id === 'p-' + name); });
    root.scrollTo(0, 0);
    try { root.sessionStorage.setItem('os-tab', name); } catch (e) { /* storage may be unavailable */ }
  };

  tabs.forEach(function (b, i) {
    b.onclick = function () { App.showTab(b.dataset.tab); };
    b.onkeydown = function (e) {         // roving tabindex: arrow keys move between tabs
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (document.documentElement.dir === 'rtl') d = -d;
      if (d) { e.preventDefault(); App.showTab(tabs[(i + d + tabs.length) % tabs.length].dataset.tab, true); }
    };
  });

  I18N.init();
  App.initSimulator(); App.initCompare(); App.initLearn(); App.initLab(); App.initCtx(); App.initQuiz();

  I18N.onChange(function () { App.renderAll(); App.emit('lang'); });
  document.getElementById('lang').onclick = function () {
    var next = I18N.lang() === 'en' ? 'ar' : 'en';
    I18N.set(next);
    try { root.localStorage.setItem('os-lang', next); } catch (e) { /* ignore */ }
  };

  var saved = null; try { saved = root.localStorage.getItem('os-lang'); } catch (e) { /* ignore */ }
  if (saved === 'ar') I18N.set('ar');
  App.showTab('sim');
})(window);
