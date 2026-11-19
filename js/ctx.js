/* ==========================================================================
   ctx.js - "Queues & Context Switch" tab.
   Two interactive pieces ported from the Chapter 3 study guide:
     1. Follow one process through the scheduling queues (queueing diagram).
     2. Context switch timeline (P0 -> OS -> P1 -> OS -> P0).
   Fully bilingual (English / Arabic) through I18N.extend.
   ========================================================================== */
(function (root) {
  'use strict';
  var App = root.App, I18N = root.I18N;
  var $ = function (id) { return document.getElementById(id); };
  var t = function (k, p) { return I18N.t(k, p); };
  var rm = !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------------- strings ---------------- */
  var EN = {
    'qd.b.0': '1. Admit', 'qd.b.1': '2. Scheduler dispatch', 'qd.b.2': 'I/O request', 'qd.b.3': 'Time slice expired', 'qd.b.4': 'Create child',
    'qd.b.5': 'Wait for interrupt', 'qd.b.6': 'Exit', 'qd.b.7': 'Event completes', 'qd.b.8': 'Reset',
    'qd.s.new': 'New (in the job queue)', 'qd.s.ready': 'Ready', 'qd.s.run': 'Running', 'qd.s.wait': 'Waiting', 'qd.s.term': 'Terminated',
    'qd.m.start': 'The job sits in the job queue. Press Admit.',
    'qd.m.admit': 'Admitted: the process joins the ready queue (state: Ready).',
    'qd.m.disp': 'The scheduler takes it from the ready queue and gives it the CPU (state: Running).',
    'qd.m.e0': 'I/O request: it moves to the I/O wait queue (Waiting) until the device finishes.',
    'qd.m.e1': 'Time slice expired: it is preempted and goes straight back to the ready queue.',
    'qd.m.e2': 'It created a child: it waits in the child-termination wait queue.',
    'qd.m.e3': 'It waits for an interrupt: it sits in the interrupt wait queue.',
    'qd.m.exit': 'Exit: the process terminates and leaves the system.',
    'qd.m.done': 'The event happened: back to the ready queue (Waiting → Ready, never straight to Running).',
    'cs.w.e': 'executing', 'cs.w.i': 'idle', 'cs.w.o': 'overhead', 'cs.w.n': 'standing by', 'cs.w.x': 'not running',
    'cs.l.0': 'Process P0', 'cs.l.1': 'Operating system', 'cs.l.2': 'Process P1',
    'cs.c.0': 'P0 is executing on the CPU. P1 is idle (waiting in the ready queue).',
    'cs.c.1': 'An interrupt or system call occurs and control passes to the operating system.',
    'cs.c.2': 'The kernel saves P0’s state into PCB0. P0 is idle now and no useful work is done (overhead).',
    'cs.c.3': 'The kernel reloads P1’s saved state from PCB1 (still overhead) and gives P1 the CPU.',
    'cs.c.4': 'P1 is executing. P0 stays idle.',
    'cs.c.5': 'Another interrupt or system call: the OS takes over and saves P1’s state into PCB1.',
    'cs.c.6': 'The kernel reloads P0’s saved state from PCB0 (overhead again).',
    'cs.c.7': 'P0 resumes exactly where it stopped. P1 is idle.',
    'cs.t.0': 'P0 executing', 'cs.t.1': 'Interrupt or system call', 'cs.t.2': 'Save state into PCB0', 'cs.t.3': 'Reload state from PCB1',
    'cs.t.4': 'P1 executing', 'cs.t.5': 'Second switch: save PCB1', 'cs.t.6': 'Reload state from PCB0', 'cs.t.7': 'P0 resumes',
    'cs.svg.0': 'process P0', 'cs.svg.1': 'operating system', 'cs.svg.2': 'process P1',
    'cs.svg.int': 'interrupt or system call', 'cs.svg.s0': 'save state into PCB0', 'cs.svg.r1': 'reload state from PCB1',
    'cs.svg.s1': 'save state into PCB1', 'cs.svg.r0': 'reload state from PCB0',
    'cs.stop': 'Stop', 'cs.auto': 'Auto-play'
  };
  var AR = {
    'tab.ctx': 'الطوابير وتبديل السياق',
    'qd.title': 'تابع عملية واحدة عبر طوابير الجدولة',
    'qd.hint': 'اضغط الأزرار بالترتيب. تُفعَّل فقط الأزرار الصالحة لمكان العملية الحالي.',
    'qd.state': 'حالة العملية:',
    'cs.title': 'تبديل السياق (Context switch)',
    'cs.intro': 'تحويل الـ CPU إلى عملية أخرى يتطلب <b>حفظ حالة</b> العملية الحالية و<b>استعادة حالة</b> عملية مختلفة. تحفظ النواة السياق القديم <b>في الـ PCB</b> الخاص بالعملية وتحمّل السياق المحفوظ للعملية الجديدة. <b>زمن تبديل السياق overhead خالص</b>: لا يؤدي النظام أي عمل مفيد أثناء التبديل، ويعتمد الزمن على دعم العتاد.',
    'cs.next': 'الخطوة التالية', 'cs.reset': 'إعادة', 'cs.auto': 'تشغيل تلقائي', 'cs.stop': 'إيقاف',
    'l4.try': 'شاهده خطوة بخطوة ←',
    'qd.b.0': '1. Admit', 'qd.b.1': '2. Scheduler dispatch', 'qd.b.2': 'طلب I/O', 'qd.b.3': 'انتهاء الشريحة الزمنية', 'qd.b.4': 'إنشاء ابن',
    'qd.b.5': 'انتظار interrupt', 'qd.b.6': 'Exit', 'qd.b.7': 'اكتمل الحدث', 'qd.b.8': 'إعادة',
    'qd.s.new': 'New (في الـ job queue)', 'qd.s.ready': 'Ready', 'qd.s.run': 'Running', 'qd.s.wait': 'Waiting', 'qd.s.term': 'Terminated',
    'qd.m.start': 'المهمة في الـ job queue. اضغط Admit.',
    'qd.m.admit': 'Admitted: دخلت العملية إلى الـ ready queue (الحالة: Ready).',
    'qd.m.disp': 'المجدول يأخذها من الـ ready queue ويعطيها الـ CPU (الحالة: Running).',
    'qd.m.e0': 'طلب I/O: تنتقل إلى طابور انتظار الـ I/O (Waiting) حتى ينتهي الجهاز.',
    'qd.m.e1': 'انتهت الشريحة الزمنية: تُقاطَع وتعود مباشرة إلى الـ ready queue.',
    'qd.m.e2': 'أنشأت ابناً: تنتظر في طابور انتظار انتهاء الابن.',
    'qd.m.e3': 'تنتظر interrupt: تبقى في طابور انتظار الـ interrupt.',
    'qd.m.exit': 'Exit: تنتهي العملية وتغادر النظام.',
    'qd.m.done': 'حدث الحدث: ترجع إلى الـ ready queue (من Waiting إلى Ready، وليس مباشرة إلى Running).',
    'cs.w.e': 'تُنفَّذ', 'cs.w.i': 'idle (تنتظر)', 'cs.w.o': 'overhead (عمل النظام)', 'cs.w.n': 'في الانتظار', 'cs.w.x': 'غير موجودة',
    'cs.l.0': 'العملية P0', 'cs.l.1': 'نظام التشغيل', 'cs.l.2': 'العملية P1',
    'cs.c.0': 'العملية P0 تُنفَّذ على الـ CPU، وP1 في حالة idle (تنتظر في الـ ready queue).',
    'cs.c.1': 'تحدث مقاطعة أو system call فينتقل التحكم إلى نظام التشغيل.',
    'cs.c.2': 'تحفظ النواة حالة P0 في PCB0. P0 الآن idle ولا يوجد عمل مفيد (overhead).',
    'cs.c.3': 'تعيد النواة تحميل حالة P1 المحفوظة من PCB1 (ما زال overhead) ثم تعطي الـ CPU لـ P1.',
    'cs.c.4': 'P1 تُنفَّذ، وP0 تبقى idle.',
    'cs.c.5': 'مقاطعة أو system call أخرى: يتولى النظام التحكم ويحفظ حالة P1 في PCB1.',
    'cs.c.6': 'تعيد النواة تحميل حالة P0 المحفوظة من PCB0 (overhead مرة أخرى).',
    'cs.c.7': 'تكمل P0 من نفس النقطة التي توقفت عندها، وP1 تصبح idle.',
    'cs.t.0': 'P0 تُنفَّذ', 'cs.t.1': 'مقاطعة أو system call', 'cs.t.2': 'حفظ الحالة في PCB0', 'cs.t.3': 'استعادة الحالة من PCB1',
    'cs.t.4': 'P1 تُنفَّذ', 'cs.t.5': 'التبديل الثاني: حفظ PCB1', 'cs.t.6': 'استعادة الحالة من PCB0', 'cs.t.7': 'P0 تستأنف',
    'cs.svg.0': 'العملية P0', 'cs.svg.1': 'نظام التشغيل', 'cs.svg.2': 'العملية P1',
    'cs.svg.int': 'مقاطعة أو system call', 'cs.svg.s0': 'حفظ الحالة في PCB0', 'cs.svg.r1': 'استعادة الحالة من PCB1',
    'cs.svg.s1': 'حفظ الحالة في PCB1', 'cs.svg.r0': 'استعادة الحالة من PCB0'
  };
  I18N.extend(EN, AR);

  /* ================= 1. Queueing diagram ================= */
  var QY = [105, 165, 225, 285];
  var QR = [['I/O request', 'I/O wait queue', 'I/O'], ['time slice expired'], ['create child process', 'child termination wait queue', 'child terminates'], ['wait for an interrupt', 'interrupt wait queue', 'interrupt occurs']];
  var QK = ['admit', 'disp', 'e0', 'e1', 'e2', 'e3', 'exit', 'done', 'reset'];

  function queueSvg() {
    var s = '<svg class="qs" viewBox="0 0 760 320" role="img" aria-label="Process scheduling queues"><defs><marker id="qh" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#a794c4"/></marker></defs>';
    var ln = function (d, m) { return '<path class="ql" d="' + d + '"' + (m ? ' marker-end="url(#qh)"' : '') + '/>'; };
    var bx = function (id, x, y, w, txt) { return '<g class="qb" id="' + id + '"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="38" rx="5"/><text x="' + (x + w / 2) + '" y="' + (y + 24) + '" text-anchor="middle">' + txt + '</text></g>'; };
    s += bx('q-job', 10, 23, 100, 'Job queue') + bx('q-rdy', 200, 23, 130, 'ready queue') + '<g class="qb" id="q-cpu"><circle cx="480" cy="42" r="30"/><text x="480" y="47" text-anchor="middle">CPU</text></g>';
    s += ln('M110 42H200', 1) + ln('M330 42H450', 1) + ln('M510 34H745', 1) + '<text x="625" y="26">exit</text>' + ln('M510 52H690V295') + ln('M150 290V42');
    QR.forEach(function (r, j) {
      var y = QY[j];
      s += ln('M690 ' + y + 'H675', 1) + bx('q-rq' + j, 545, y - 19, 130, r[0]);
      if (r[1]) s += ln('M545 ' + y + 'H525', 1) + bx('q-wq' + j, 360, y - 19, 165, r[1]) + ln('M360 ' + y + 'H340', 1) +
        '<g class="qb" id="q-ev' + j + '"><ellipse cx="275" cy="' + y + '" rx="65" ry="20"/><text x="275" y="' + (y + 4) + '" text-anchor="middle">' + r[2] + '</text></g>' + ln('M210 ' + y + 'H150');
      else s += ln('M545 ' + y + 'H150');
    });
    return s + '<circle class="tk" id="q-tk" r="9" style="transform:translate(60px,42px)"/></svg>';
  }

  function initQueues() {
    $('qd-svg').innerHTML = queueSvg();
    $('qd-btns').innerHTML = QK.map(function (k, n) {
      return '<button class="btn s' + ((n > 1 && n < 7) || n === 8 ? ' o' : '') + '" type="button" data-a="' + k + '"></button>';
    }).join('');
    var st = 'new', row = 0, busy = false, msgKey = 'start', tk = $('q-tk'), timer = 0;
    var bs = [].slice.call($('qd-btns').querySelectorAll('[data-a]'));

    function mark() {
      [].forEach.call(document.querySelectorAll('#qd-svg .qb'), function (e) { e.classList.remove('on'); });
      var id = st === 'new' ? 'q-job' : st === 'ready' ? 'q-rdy' : st === 'run' ? 'q-cpu' : st === 'wait' ? 'q-wq' + row : '';
      var e = id && $(id); if (e) e.classList.add('on');
    }
    function ui() {
      bs.forEach(function (b, n) {
        var a = b.dataset.a;
        b.textContent = t('qd.b.' + n);
        b.disabled = !(a === 'reset' || (!busy && (a === 'admit' ? st === 'new' : a === 'disp' ? st === 'ready' : a === 'done' ? st === 'wait' : st === 'run')));
      });
      $('qd-st').textContent = t('qd.s.' + st);
      $('qd-msg').textContent = t('qd.m.' + msgKey);
      mark();
    }
    function mv(path, next) {
      busy = true; ui(); var n = 0;
      (function step() {
        if (n >= path.length) { busy = false; st = next; ui(); return; }
        tk.style.transform = 'translate(' + path[n][0] + 'px,' + path[n][1] + 'px)'; n++;
        timer = setTimeout(step, rm ? 0 : 420);
      })();
    }
    bs.forEach(function (b) {
      b.onclick = function () {
        var a = b.dataset.a, j, Y;
        if (a === 'reset') { clearTimeout(timer); busy = false; st = 'new'; msgKey = 'start'; tk.style.transform = 'translate(60px,42px)'; ui(); return; }
        msgKey = a;
        if (a === 'admit') mv([[150, 42], [265, 42]], 'ready');
        else if (a === 'disp') mv([[480, 42]], 'run');
        else if (a === 'exit') mv([[725, 34]], 'term');
        else if (a === 'done') mv([[275, QY[row]], [150, QY[row]], [150, 42], [265, 42]], 'ready');
        else {
          j = +a[1]; Y = QY[j];
          if (QR[j][1]) { row = j; mv([[690, 52], [690, Y], [610, Y], [442, Y]], 'wait'); }
          else mv([[690, 52], [690, Y], [610, Y], [150, Y], [150, 42], [265, 42]], 'ready');
        }
      };
    });
    App.on('lang', ui);
    ui();
  }

  /* ================= 2. Context switch timeline ================= */
  // state codes per step for [P0, OS, P1]: e=executing i=idle o=overhead n=standing by
  var ST = ['eni', 'ioi', 'ioi', 'ioi', 'ine', 'ioi', 'ioi', 'eni'];
  var INI = 'nnn';

  function csSvg() {
    var b = function (k, c, x, y, h) { return '<rect class="cs-e ' + c + '" data-k="' + k + '" x="' + x + '" y="' + y + '" width="14" height="' + h + '" rx="3"/>'; };
    var o = function (k, y, txt) { return '<g class="cs-e ov" data-k="' + k + '"><rect x="270" y="' + y + '" width="180" height="34" rx="6"/><text x="360" y="' + (y + 22) + '" text-anchor="middle">' + txt + '</text></g>'; };
    var a = function (k, d, txt, x, y, an) { return '<g class="cs-e ar" data-k="' + k + '"><path d="' + d + '" marker-end="url(#csh)"/>' + (txt ? '<text x="' + x + '" y="' + y + '" text-anchor="' + an + '">' + txt + '</text>' : '') + '</g>'; };
    return '<svg class="cs" viewBox="0 0 720 450" role="img" aria-label="Context switch timeline"><defs><marker id="csh" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#ffb454"/></marker></defs>' +
      '<text class="ln" x="117" y="24" text-anchor="middle">' + t('cs.svg.0') + '</text><text class="ln" x="360" y="24" text-anchor="middle">' + t('cs.svg.1') + '</text><text class="ln" x="617" y="24" text-anchor="middle">' + t('cs.svg.2') + '</text>' +
      b(0, 'ex', 110, 50, 80) + b(0, 'id', 610, 50, 175) + b(2, 'id', 110, 130, 265) + b(4, 'ex', 610, 225, 75) + b(5, 'id', 610, 300, 95) + b(7, 'ex', 110, 395, 45) +
      a(1, 'M126 130L268 162', t('cs.svg.int'), 130, 118, 'start') + o(2, 150, t('cs.svg.s0')) + o(3, 196, t('cs.svg.r1')) + a(3, 'M450 213L606 228') +
      a(5, 'M608 300L452 334', t('cs.svg.int'), 600, 292, 'end') + o(5, 320, t('cs.svg.s1')) + o(6, 366, t('cs.svg.r0')) + a(7, 'M270 383L128 398') + '</svg>';
  }

  function initContextSwitch() {
    var k = -1, tm = 0, N = ST.length;
    function paint() {
      $('cs-svg').innerHTML = csSvg();
      $('cs-stat').innerHTML = [0, 1, 2].map(function (i) { return '<div class="s-n"><b>' + t('cs.l.' + i) + '</b><span></span></div>'; }).join('');
      var ol = $('cs-steps'); ol.innerHTML = '';
      for (var i = 0; i < N; i++) {
        var li = document.createElement('li'); li.tabIndex = 0; li.setAttribute('role', 'button'); li.dataset.n = i;
        li.innerHTML = '<strong>' + t('cs.t.' + i) + '</strong>' + t('cs.c.' + i);
        ol.appendChild(li);
      }
      show();
    }
    function show() {
      [].forEach.call($('cs-steps').children, function (li, i) { li.classList.toggle('a', i === k); });
      [].forEach.call(document.querySelectorAll('#cs-svg .cs-e'), function (e) { var n = +e.dataset.k; e.classList.toggle('v', n <= k); e.classList.toggle('cur', n === k); });
      var code = k < 0 ? INI : ST[k];
      [].forEach.call($('cs-stat').children, function (d, i) { d.className = 's-' + code[i]; d.querySelector('span').textContent = t('cs.w.' + code[i]); });
      $('cs-auto').textContent = t(tm ? 'cs.stop' : 'cs.auto');
    }
    function stop() { clearInterval(tm); tm = 0; show(); }
    function next() { k = (k + 1) % N; show(); }
    $('cs-next').onclick = function () { stop(); next(); };
    $('cs-auto').onclick = function () {
      if (tm) { stop(); return; }
      if (k >= N - 1) k = -1;
      next();
      tm = setInterval(function () { if (k >= N - 1) stop(); else next(); }, rm ? 400 : 1900);
      show();
    };
    $('cs-reset').onclick = function () { stop(); k = -1; show(); };
    $('cs-steps').addEventListener('click', function (e) { var li = e.target.closest('li'); if (li) { stop(); k = +li.dataset.n; show(); } });
    $('cs-steps').addEventListener('keydown', function (e) { var li = e.target.closest('li'); if (li && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); stop(); k = +li.dataset.n; show(); } });
    App.on('lang', paint);
    paint();
  }

  App.initCtx = function () { initQueues(); initContextSwitch(); };
})(window);
