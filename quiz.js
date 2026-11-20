/* ==========================================================================
   quiz.js - multiple-choice quiz with instant feedback, score and reset.
   Scheduling numbers in the questions were verified against scheduler.js
   (see tests/scheduler.test.js, test set A).
   ========================================================================== */
(function (root) {
  'use strict';
  var App = root.App;
  var $ = function (id) { return document.getElementById(id); };
  var t = function (k, p) { return root.I18N.t(k, p); };

  // o: options (first one is the correct answer; the display order is shuffled)
  var Q = [
    { q: { en: 'What is a process?', ar: 'ما هي العملية (process)؟' },
      o: { en: ['A program in execution', 'A file stored on disk', 'A type of CPU', 'A compiler'], ar: ['برنامج قيد التنفيذ', 'ملف مخزّن على القرص', 'نوع من المعالجات', 'مترجم (compiler)'] },
      e: { en: 'A program is passive (a file on disk); it becomes an active process when loaded into memory.', ar: 'البرنامج كيان سلبي (ملف على القرص) ويصبح عملية نشطة عند تحميله في الذاكرة.' } },
    { q: { en: 'Which memory section holds local variables, parameters and return addresses?', ar: 'أي قسم في الذاكرة يحمل المتغيرات المحلية والمعاملات وعناوين الرجوع؟' },
      o: { en: ['Stack', 'Heap', 'Data', 'Text'], ar: ['Stack', 'Heap', 'Data', 'Text'] },
      e: { en: 'Each function call pushes an activation record onto the stack.', ar: 'كل استدعاء دالة يدفع activation record إلى الـ stack.' } },
    { q: { en: 'A running process whose time slice expires moves to which state?', ar: 'العملية الجارية التي تنتهي شريحتها الزمنية تنتقل إلى أي حالة؟' },
      o: { en: ['Ready', 'Waiting', 'Terminated', 'New'], ar: ['Ready', 'Waiting', 'Terminated', 'New'] },
      e: { en: 'Interrupt (timeout): Running → Ready. Only I/O or event waits lead to Waiting.', ar: 'Interrupt (timeout): من Running إلى Ready. فقط انتظار I/O أو حدث يؤدي إلى Waiting.' } },
    { q: { en: 'Which system call replaces a process’s memory space with a new program?', ar: 'أي system call يستبدل ذاكرة العملية ببرنامج جديد؟' },
      o: { en: ['exec()', 'fork()', 'wait()', 'exit()'], ar: ['exec()', 'fork()', 'wait()', 'exit()'] },
      e: { en: 'fork() duplicates, exec() replaces the program, wait() waits for a child, exit() terminates.', ar: 'fork() ينسخ، exec() يستبدل البرنامج، wait() ينتظر الابن، exit() ينهي العملية.' } },
    { q: { en: 'A zombie process is…', ar: 'العملية الزومبي (zombie) هي…' },
      o: { en: ['Terminated, but its parent has not called wait() yet', 'A process stuck in the ready queue', 'A process with a very large heap', 'A process that never started'], ar: ['منتهية لكن أباها لم يستدعِ wait() بعد', 'عملية عالقة في الـ ready queue', 'عملية ذات heap كبير جداً', 'عملية لم تبدأ أبداً'] },
      e: { en: 'Its entry stays in the process table until the parent reaps it with wait().', ar: 'يبقى مدخلها في جدول العمليات حتى يستلمها الأب بـ wait().' } },
    { q: { en: 'Which IPC model needs the kernel for every data exchange?', ar: 'أي نموذج IPC يحتاج النواة (kernel) عند كل تبادل للبيانات؟' },
      o: { en: ['Message passing', 'Shared memory', 'Both always', 'Neither'], ar: ['تمرير الرسائل', 'الذاكرة المشتركة', 'كلاهما دائماً', 'لا أحد منهما'] },
      e: { en: 'Shared memory is set up once; afterwards processes exchange data without system calls (but must synchronize).', ar: 'تُنشأ الذاكرة المشتركة مرة واحدة ثم تتبادل العمليات البيانات بلا system calls (مع ضرورة المزامنة).' } },
    { q: { en: 'Waiting time equals…', ar: 'وقت الانتظار (Waiting time) يساوي…' },
      o: { en: ['Turnaround time − Burst time', 'Completion time − Arrival time', 'First start − Arrival', 'Burst time − Arrival time'], ar: ['Turnaround − Burst', 'Completion − Arrival', 'أول تشغيل − Arrival', 'Burst − Arrival'] },
      e: { en: 'WT = TAT − BT, where TAT = CT − AT.', ar: 'WT = TAT − BT حيث TAT = CT − AT.' } },
    { q: { en: 'Response time equals…', ar: 'وقت الاستجابة (Response time) يساوي…' },
      o: { en: ['First time on the CPU − Arrival time', 'Completion time − Arrival time', 'Turnaround − Burst', 'Total CPU time'], ar: ['أول مرة على الـ CPU − Arrival', 'Completion − Arrival', 'Turnaround − Burst', 'إجمالي وقت الـ CPU'] },
      e: { en: 'It measures how long a process waits before it first gets the CPU.', ar: 'يقيس المدة قبل أن تحصل العملية على الـ CPU لأول مرة.' } },
    { q: { en: 'P1 (arrival 0, burst 8), P2 (1, 4), P3 (2, 9), P4 (3, 5). Average waiting time under FCFS?', ar: 'P1 (وصول 0، burst 8)، P2 (1، 4)، P3 (2، 9)، P4 (3، 5). متوسط وقت الانتظار في FCFS؟' },
      o: { en: ['8.75', '7.75', '13.5', '15.25'], ar: ['8.75', '7.75', '13.5', '15.25'] },
      e: { en: 'Order P1, P2, P3, P4 → waits 0, 7, 10, 18 → 35 / 4 = 8.75.', ar: 'الترتيب P1,P2,P3,P4 ← الانتظار 0 و7 و10 و18 ← 35 ÷ 4 = 8.75.' } },
    { q: { en: 'Same processes under non-preemptive SJF: average waiting time?', ar: 'نفس العمليات تحت SJF غير الاستباقي: متوسط وقت الانتظار؟' },
      o: { en: ['7.75', '8.75', '13.5', '5.5'], ar: ['7.75', '8.75', '13.5', '5.5'] },
      e: { en: 'Order P1, P2, P4, P3 → waits 0, 7, 9, 15 → 31 / 4 = 7.75.', ar: 'الترتيب P1,P2,P4,P3 ← الانتظار 0 و7 و9 و15 ← 31 ÷ 4 = 7.75.' } },
    { q: { en: 'Same processes under Round Robin with quantum 3: average waiting time?', ar: 'نفس العمليات تحت Round Robin بكوانتم 3: متوسط وقت الانتظار؟' },
      o: { en: ['13.5', '8.75', '7.75', '20'], ar: ['13.5', '8.75', '7.75', '20'] },
      e: { en: 'Waits are 15, 11, 15, 13 → 54 / 4 = 13.5. RR trades a higher average wait for a much lower response time (average 3 vs 8.75).', ar: 'الانتظار 15 و11 و15 و13 ← 54 ÷ 4 = 13.5. يقايض RR متوسط انتظار أعلى بوقت استجابة أقل بكثير (3 مقابل 8.75).' } },
    { q: { en: 'The convoy effect (short jobs stuck behind a long one) is typical of…', ar: 'تأثير القافلة (convoy effect) أي عمليات قصيرة عالقة خلف طويلة، يميّز…' },
      o: { en: ['FCFS', 'Round Robin', 'Preemptive scheduling in general', 'Context switching'], ar: ['FCFS', 'Round Robin', 'الجدولة الاستباقية عموماً', 'تبديل السياق'] },
      e: { en: 'FCFS never interrupts the long job, so everything behind it waits.', ar: 'لا يقاطع FCFS العملية الطويلة فينتظر كل ما خلفها.' } },
    { q: { en: 'Which algorithm can starve a process indefinitely?', ar: 'أي خوارزمية قد تُجوِّع (starve) عملية إلى أجل غير محدد؟' },
      o: { en: ['Priority scheduling', 'FCFS', 'Round Robin', 'None of them'], ar: ['الجدولة بالأولوية', 'FCFS', 'Round Robin', 'لا شيء منها'] },
      e: { en: 'A steady stream of higher-priority processes can keep a low-priority one waiting forever (aging fixes this). SJF has the same risk for long jobs.', ar: 'تدفق مستمر من عمليات أعلى أولوية قد يُبقي ذات الأولوية المنخفضة منتظرة للأبد (الـ aging يحل ذلك). ولدى SJF الخطر نفسه للمهام الطويلة.' } },
    { q: { en: 'Round Robin with a very large quantum behaves like…', ar: 'Round Robin بكوانتم كبير جداً يتصرف مثل…' },
      o: { en: ['FCFS', 'SJF', 'Priority scheduling', 'A random scheduler'], ar: ['FCFS', 'SJF', 'الجدولة بالأولوية', 'مجدول عشوائي'] },
      e: { en: 'Every process finishes within its first quantum, so the order is simply arrival order.', ar: 'تنتهي كل عملية ضمن أول كوانتم لها فيصبح الترتيب ترتيب الوصول فقط.' } },
    { q: { en: 'When does the CPU sit idle in a schedule?', ar: 'متى يبقى الـ CPU خاملاً (idle) في الجدول؟' },
      o: { en: ['When no process has arrived or is ready', 'Whenever a context switch happens', 'Only in Round Robin', 'Never'], ar: ['عندما لا توجد عملية وصلت أو جاهزة', 'عند كل تبديل سياق', 'فقط في Round Robin', 'أبداً'] },
      e: { en: 'If the ready queue is empty but later arrivals exist, the CPU idles until the next arrival. Idle time lowers CPU utilization.', ar: 'إذا كان الـ ready queue فارغاً مع وجود وصولات لاحقة يخمل الـ CPU حتى الوصول التالي، والخمول يخفض استغلال الـ CPU.' } }
  ];

  var order = [], idx = 0, score = 0, answered = false, pick = null;

  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; } return a; }

  function newRun() {
    order = Q.map(function (q, i) {
      return { q: i, opts: shuffle(q.o.en.map(function (_, k) { return k; })) };
    });
    idx = 0; score = 0; answered = false; render();
  }

  function render() {
    var box = $('q-box'), lang = root.I18N.lang();
    $('score').textContent = t('quiz.score', { s: score, n: idx + (answered ? 1 : 0) });
    $('q-prog').textContent = idx < Q.length ? t('quiz.prog', { i: idx + 1, n: Q.length }) : '';
    $('q-bar').style.width = (idx / Q.length * 100) + '%';
    if (idx >= Q.length) {
      var pct = Math.round(score / Q.length * 100);
      box.innerHTML = '<div class="tip"><h3>' + t('quiz.done', { s: score, n: Q.length, p: pct }) + '</h3>' + t(pct >= 85 ? 'quiz.great' : pct >= 60 ? 'quiz.good' : 'quiz.retry') + '</div>';
      $('q-bar').style.width = '100%'; return;
    }
    var cur = order[idx], q = Q[cur.q];
    box.innerHTML = '<p style="font-weight:600;font-size:16.5px;margin:6px 0 10px">' + V().esc(q.q[lang]) + '</p>' +
      cur.opts.map(function (k) { return '<button class="opt" type="button" data-k="' + k + '">' + V().esc(q.o[lang][k]) + '</button>'; }).join('') +
      '<div class="fb" id="q-fb" style="display:none" role="status"></div><div style="margin-top:10px"><button class="btn" id="q-next" type="button" style="display:none">' +
      t(idx === Q.length - 1 ? 'quiz.finish' : 'quiz.next') + '</button></div>';
    if (answered && pick !== null) showAnswer(pick);
  }
  function V() { return root.Viz; }

  function onAnswer(e) {
    var b = e.target.closest('.opt'); if (!b || answered) return;
    answered = true; pick = +b.dataset.k;
    if (pick === 0) score++;            // index 0 is the correct option
    showAnswer(pick);
  }
  function showAnswer(k) {
    var q = Q[order[idx].q], lang = root.I18N.lang(), good = k === 0;
    [].forEach.call($('q-box').querySelectorAll('.opt'), function (o) {
      o.disabled = true; if (+o.dataset.k === 0) o.classList.add('ok'); if (+o.dataset.k === k && !good) o.classList.add('no');
    });
    var fb = $('q-fb'); fb.style.display = 'block'; fb.className = 'fb ' + (good ? 'ok' : 'no');
    fb.innerHTML = '<b>' + t(good ? 'quiz.ok' : 'quiz.no') + '</b> ' + (good ? '' : t('quiz.right', { a: V().esc(q.o[lang][0]) }) + ' ') + V().esc(q.e[lang]);
    $('q-next').style.display = '';
    $('score').textContent = t('quiz.score', { s: score, n: idx + 1 });
  }

  App.initQuiz = function () {
    $('q-box').addEventListener('click', function (e) {
      if (e.target.id === 'q-next') { idx++; answered = false; pick = null; render(); } else onAnswer(e);
    });
    $('q-reset').onclick = newRun;
    App.on('lang', render);            // re-draw in the new language, keeping progress and the chosen answer
    newRun();
  };
})(window);
