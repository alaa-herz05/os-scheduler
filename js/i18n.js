/* ==========================================================================
   i18n.js - English / Arabic.
   * Static text:  elements carry data-i="key". The English text is read from
     the HTML itself; Arabic comes from AR_STATIC below. Tooltips use
     data-i-tip (English in the data-tip attribute).
   * Dynamic text (built by JS): I18N.t(key, {params}) with {name} placeholders,
     using the DYN dictionaries below.
   ========================================================================== */
(function (root) {
  'use strict';
  var lang = 'en', EN = {}, ENTIP = {}, listeners = [];

  /* ---------------- Arabic: static (data-i) ---------------- */
  var AR_STATIC = {
    'app.title': 'محاكي إدارة العمليات وجدولة المعالج',
    'app.sub': 'نظم التشغيل · الفصل 3: العمليات',
    'tab.sim': 'المحاكي', 'tab.cmp': 'المقارنة', 'tab.lab': 'مختبر العمليات', 'tab.learn': 'تعلّم', 'tab.quiz': 'اختبار',
    'dash.total': 'إجمالي العمليات', 'dash.ready': 'جاهزة (Ready)', 'dash.running': 'قيد التشغيل', 'dash.waiting': 'انتظار (I/O)', 'dash.done': 'مكتملة', 'dash.algo': 'الخوارزمية',
    'proc.title': 'العمليات', 'f.at': 'الوصول', 'f.bt': 'Burst', 'f.pr': 'الأولوية',
    'btn.add': '+ إضافة عملية', 'btn.sample': 'تحميل عيّنة', 'btn.clear': 'مسح الكل',
    'th.id': 'العملية', 'th.at': 'الوصول', 'th.bt': 'Burst', 'th.pr': 'الأولوية',
    'proc.empty': 'لا توجد عمليات بعد. أضف عملية أعلاه أو حمّل عيّنة.',
    'algo.title': 'خوارزمية الجدولة',
    'algo.fcfs.s': 'الأول وصولاً يُخدم أولاً', 'algo.sjf.s': 'أقصر مهمة أولاً (غير استباقي)', 'algo.pr.s': 'بالأولوية (غير استباقي)', 'algo.rr.s': 'استباقي بكوانتم زمني',
    'q.label': 'الكوانتم الزمني',
    'c.start': '▶ ابدأ', 'c.pause': '❚❚ إيقاف مؤقت', 'c.resume': '▶ استئناف', 'c.step': 'الخطوة التالية ›', 'c.reset': '↺ إعادة ضبط', 'c.speed': 'السرعة',
    'state.title': 'حالات العمليات أثناء المحاكاة', 'state.hint': 'كل نبضة = وحدة زمنية. كل حالة مأخوذة من الجدول الفعلي.',
    'gantt.title': 'مخطط جانت (Gantt)', 'res.title': 'نتائج الأداء',
    'rules.sum': 'القوانين وقواعد كسر التعادل',
    'rules.util': 'استغلال المعالج = وقت الانشغال ÷ الزمن الكلي (من t = 0 حتى آخر اكتمال) × 100. فترات الخمول تُحسب غير مستغلة.',
    'rules.tie': 'التعادل: FCFS ← الأسبق وصولاً ثم ترتيب الصف. SJF ← الأقصر burst ثم الوصول ثم ترتيب الصف. الأولوية ← الرقم الأصغر أولاً ثم الوصول ثم ترتيب الصف.',
    'rules.rr': 'Round Robin: طابور FIFO. العملية التي تصل لحظة انتهاء الكوانتم تُوضع في الطابور قبل العملية المقاطَعة.',
    'cmp.same': 'تعمل الخوارزميات الأربع على نفس قائمة العمليات في تبويب المحاكي.',
    'lab.title': 'مختبر العمليات التفاعلي',
    'lab.intro': 'ابنِ شجرة عمليات. اضغط على عملية لاختيارها ثم استدعِ <code>fork()</code> أو <code>exec()</code> أو <code>wait()</code> أو <code>exit()</code>. كل إجراء يُشرح.',
    'lab.l.run': 'قيد التشغيل', 'lab.l.wait': 'منتظِرة (خارج الـ ready queue)', 'lab.l.zom': 'زومبي', 'lab.l.dead': 'منتهية', 'lab.reset': 'إعادة ضبط',
    'lab.chal': 'تحديات',
    'lab.c1': 'اصنع <b>زومبي</b>: أنشئ ابناً ثم أنهِه قبل أن يستدعي أبوه wait().',
    'lab.c2': 'أطلق <b>الإنهاء المتسلسل</b>: ابنِ مستويين ثم أنهِ الابن الأعلى.',
    'lab.c3': 'اجعل الأب <b>ينتظر</b> ثم أيقظه بإنهاء ابنه.',
    'l1.t': '1 · مفهوم العملية وتخطيط الذاكرة',
    'l1.p': '<b>العملية</b> هي <b>برنامج قيد التنفيذ</b>. البرنامج ملف سلبي على القرص؛ ويصبح عملية عندما يُحمَّل في الذاكرة.',
    'l1.prog': 'البرنامج', 'l1.proc': 'العملية', 'l1.r1': 'الطبيعة', 'l1.r1a': 'سلبي (ملف)', 'l1.r1b': 'نشطة (تعمل)',
    'l1.r2': 'مكانه', 'l1.r2a': 'القرص', 'l1.r2b': 'الذاكرة الرئيسية + المعالج', 'l1.r3': 'العدد', 'l1.r3a': 'ملف واحد', 'l1.r3b': 'يمكن لعدة عمليات تشغيل البرنامج نفسه',
    'l1.mem': 'تخطيط الذاكرة', 'm.push': 'استدعاء دالة (push)', 'm.pop': 'رجوع (pop)', 'm.malloc': 'malloc', 'm.free': 'free',
    'l1.text': 'الكود التنفيذي', 'l1.data': 'المتغيرات العامة والساكنة', 'l1.heap': 'ذاكرة تُخصَّص وقت التشغيل', 'l1.stack': 'المعاملات وعنوان الرجوع والمتغيرات المحلية',
    'l2.t': '2 · حالات العملية ودورة حياتها',
    'l2.p': 'اضغط على اسم سهم أو على زر لنقل العملية. الأسهم المتقطعة المتوهجة هي الانتقالات المسموحة من الحالة الحالية.',
    'l3.t': '3 · كتلة التحكم بالعملية (PCB)',
    'l3.p': 'الـ PCB هو السجل الذي يحتفظ به النظام لكل عملية (ويعرَّف برقم PID). يُنشأ مع العملية ويُحذف عند انتهائها. اضغط على حقل.',
    'l3.live': 'عرض PCB حي (من المحاكي)',
    'l4.t': '4 · خوارزميات جدولة المعالج',
    'l4.fcfs': 'يشغّل العمليات بترتيب الوصول. بسيط، لكن المهمة الطويلة تؤخر كل القصيرة خلفها (convoy effect).',
    'l4.sjf': 'يختار أقصر burst بين العمليات التي وصلت. يعطي أقل متوسط انتظار لمجموعة معينة، لكنه يحتاج معرفة الـ burst مسبقاً وقد يُجوِّع المهام الطويلة.',
    'l4.pr': 'يختار الأعلى أولوية (أصغر رقم). قد يُجوِّع المهام منخفضة الأولوية؛ والحل المعتاد هو الـ aging.',
    'l4.rr': 'تحصل كل عملية على كوانتم واحد كحد أقصى ثم تذهب لآخر الطابور. عادل وبوقت استجابة جيد؛ وحجم الكوانتم مهم (صغير جداً = تبديلات كثيرة، كبير جداً = FCFS).',
    'l4.cs': '<b>تبديل السياق:</b> تحفظ النواة حالة العملية القديمة في الـ PCB الخاص بها وتحمّل حالة التالية. هو overhead خالص.',
    'l5.t': '5 · عمليات العملية: fork() وexec() وwait() وexit()',
    'l5.fork': 'ينشئ ابناً هو نسخة من الأب.', 'l5.exec': 'يستبدل ذاكرة العملية ببرنامج جديد.',
    'l5.wait': 'ينام الأب حتى ينتهي ابن. بدونه تصبح الأبناء المنتهية زومبي.', 'l5.exit': 'ينهي العملية؛ ويسترجع النظام ذاكرتها وملفاتها ومخازنها.',
    'l5.try': 'جرّبها في مختبر العمليات ←',
    'l6.t': '6 · الاتصال بين العمليات (IPC)', 'l6.p': 'تحتاج العمليات المتعاونة إلى IPC. هناك نموذجان.',
    'l6.shm': 'الذاكرة المشتركة', 'l6.msg': 'تمرير الرسائل',
    'l6.a': 'الآلية', 'l6.a1': 'منطقة ذاكرة مشتركة تقرأ منها العمليات وتكتب فيها', 'l6.a2': 'عبر النظام',
    'l6.b': 'السرعة', 'l6.b1': 'سريعة (لا system call لكل تبادل)', 'l6.b2': 'أبطأ (تتدخل النواة)',
    'l6.c': 'التحدي', 'l6.c1': 'على المستخدمين مزامنة الوصول', 'l6.c2': 'التسمية والتخزين المؤقت (zero / bounded / unbounded)',
    'l6.d': 'الأنسب لـ', 'l6.d1': 'عمليات على جهاز واحد', 'l6.d2': 'الأنظمة الموزعة',
    'l6.pc': 'المنتج والمستهلك: مخزن محدود (5 خانات)', 'b.prod': 'إنتاج عنصر', 'b.cons': 'استهلاك عنصر',
    'quiz.title': 'اختبار: العمليات وجدولة المعالج', 'quiz.reset': 'إعادة الاختبار',
    'footer': 'نظم التشغيل (501471) · الفصل 3: العمليات · يعمل بالكامل في متصفحك بلا خادم'
  };
  var AR_TIP = {
    'tip.waiting': 'عمليات محجوبة بانتظار I/O أو حدث. يحاكي هذا البرنامج فترات CPU فقط (بلا I/O) لذلك العدد دائماً 0 هنا. الانتظار للـ CPU يظهر كحالة Ready.',
    'tip.priority': 'الرقم الأصغر = أولوية أعلى (1 هي الأعلى).',
    'tip.quantum': 'يُستخدم في Round Robin فقط. عدد صحيح من 1 إلى 50.',
    'tip.mem': 'حجم Text وData ثابت. فقط الـ stack والـ heap يكبران ويصغران، ويجب على النظام منعهما من التداخل.'
  };

  /* ---------------- dynamic strings ---------------- */
  var DYN = {
    en: {
      'err.arrival': 'Arrival must be a whole number from 0 to {amax}.', 'err.burst': 'Burst must be a whole number from 1 to {bmax}.',
      'err.priority': 'Priority must be a whole number from 1 to {pmax}.', 'err.quantum': 'Time quantum must be a whole number from 1 to {qmax}. The last valid value is kept.',
      'err.idFormat': 'ID must start with a letter and use at most 6 letters or digits.', 'err.idDuplicate': 'This process ID already exists.', 'err.max': 'At most {n} processes are allowed.',
      'ok.added': '{p} added.', 'ok.cleared': 'All processes removed.', 'ok.sample': 'Loaded sample: {name}.',
      'proc.count': '{n} / {max} processes', 'btn.del': 'Delete',
      'sample.textbook': 'Textbook (4 processes)', 'sample.idle': 'With CPU idle gaps', 'sample.equal': 'Equal arrivals (all at 0)', 'sample.convoy': 'Convoy effect (long job first)', 'sample.single': 'Single process',
      'algo.name.rr': 'Round Robin (q={q})',
      'status.idle': 'idle', 'status.running': 'running', 'status.paused': 'paused', 'status.done': 'finished',
      'sim.t': 't = {t}', 'sim.tIdle': 't = –',
      'ev.arrive': '{p} arrived (New → Ready)', 'ev.dispatch': '{p} dispatched to the CPU (Ready → Running)', 'ev.preempt': '{p} preempted by the scheduler (Running → Ready)',
      'ev.finish': '{p} finished (Running → Terminated)', 'ev.idle': 'CPU idle: no process is ready', 'ev.done': 'All processes terminated.',
      'state.new': 'New', 'state.ready': 'Ready', 'state.running': 'Running', 'state.waiting': 'Waiting', 'state.terminated': 'Terminated',
      'q.cpu': 'CPU', 'q.ready': 'Ready queue (front → back)', 'q.empty': 'empty',
      'log.start': 'Press Start (or Next step) to replay the schedule one time unit at a time.',
      'gantt.idle': 'idle', 'gantt.sub.idle': 'Complete schedule, total time {total}. Press Start to replay it.', 'gantt.sub.run': 'Replaying: t = {t} of {total}',
      'res.empty': 'Add processes to see results.', 'res.avg': 'Average',
      'stat.awt': 'Avg waiting time', 'stat.atat': 'Avg turnaround time', 'stat.art': 'Avg response time', 'stat.util': 'CPU utilization', 'stat.cs': 'Context switches', 'stat.cs.f': 'process → other process',
      'th.ct': 'CT', 'th.tat': 'TAT', 'th.wt': 'WT', 'th.rt': 'RT',
      'th.id.f': 'Process ID', 'th.at.f': 'Arrival time', 'th.bt.f': 'Burst time', 'th.pr.f': 'Priority (lower = higher)',
      'th.ct.f': 'Completion time', 'th.tat.f': 'Turnaround time = CT − AT', 'th.wt.f': 'Waiting time = TAT − BT', 'th.rt.f': 'Response time = first start − AT',
      'cmp.empty': 'Add processes in the Simulator tab to compare the algorithms.',
      'cmp.win': 'Lowest average waiting time: {names} ({v})', 'cmp.tie': 'Tie for the lowest average waiting time: {names} ({v})',
      'cmp.note': 'This holds for this process set only. Another set or quantum can change it, and the lowest waiting time is not always the best choice (SJF can starve long jobs; Round Robin gives better response time).',
      'cmp.m.wt': 'Average waiting time', 'cmp.m.tat': 'Average turnaround time', 'cmp.m.rt': 'Average response time', 'cmp.m.util': 'CPU utilization',
      'cmp.lower': 'lower is better', 'cmp.higher': 'higher is better', 'cmp.lowest': 'lowest wait',
      'm.ok': 'Text and data have a fixed size. Only the stack and heap grow and shrink.', 'm.clash': 'Stack and heap collided! The OS must make sure they never overlap.',
      'sm.init': 'Click an arrow label (or a button). Glowing dashed arrows are the transitions allowed from the current state.', 'sm.bad': 'Not allowed from the current state.',
      'sm.b.admit': 'Admit', 'sm.b.dispatch': 'Scheduler dispatch', 'sm.b.interrupt': 'Interrupt (timeout)', 'sm.b.wait': 'I/O or event wait', 'sm.b.io': 'I/O or event completion', 'sm.b.exit': 'Exit', 'sm.b.reset': 'Reset',
      'sm.m.admit': 'Admitted: the process is created and moved to the ready queue.', 'sm.m.dispatch': 'Scheduler dispatch: the CPU is assigned to the process.',
      'sm.m.interrupt': 'Interrupt: the time slice ended, back to ready.', 'sm.m.wait': 'The process requested I/O or waits for an event.',
      'sm.m.io': 'I/O or event completion: back to the ready queue.', 'sm.m.exit': 'Exit: the process finished execution.',
      'pcb.field': 'Field', 'pcb.value': 'Value (this process)',
      'pcb.pid': 'Process ID (PID)', 'pcb.pid.s': 'unique integer', 'pcb.pid.d': 'A unique integer that identifies the process and its PCB.',
      'pcb.state': 'Process state', 'pcb.state.s': 'new … terminated', 'pcb.state.d': 'New, ready, running, waiting or terminated.',
      'pcb.pc': 'Program counter', 'pcb.pc.s': 'next instruction', 'pcb.pc.d': 'Location of the next instruction to execute. Saved on a context switch.',
      'pcb.regs': 'CPU registers', 'pcb.regs.s': 'saved context', 'pcb.regs.d': 'Contents of all process-centric registers, saved and restored on every context switch.',
      'pcb.sched': 'Scheduling info', 'pcb.sched.s': 'priority, queues', 'pcb.sched.d': 'Priority and pointers to scheduling queues: the data the scheduler uses.',
      'pcb.mem': 'Memory management', 'pcb.mem.s': 'limits, page tables', 'pcb.mem.d': 'Memory allocated to the process (base/limit registers or page tables).',
      'pcb.acct': 'Accounting', 'pcb.acct.s': 'CPU used, time', 'pcb.acct.d': 'CPU time used, clock time elapsed, time limits.',
      'pcb.io': 'I/O status', 'pcb.io.s': 'devices, open files', 'pcb.io.d': 'I/O devices allocated to the process and its list of open files.',
      'pcb.pc.v': 'after {n} executed time unit(s)', 'pcb.regs.v': 'saved here on a context switch', 'pcb.sched.v': 'priority {pr}; ready-queue position {q}',
      'pcb.mem.v': 'not modelled', 'pcb.acct.v': 'CPU used {u} of {b}; waited {w}', 'pcb.io.v': 'none (CPU-only bursts)',
      'b.init': 'Add and remove items. Try to overfill or over-consume.', 'b.full': 'Buffer is FULL: the producer must wait.', 'b.empty': 'Buffer is EMPTY: the consumer must wait.', 'b.p': 'Producer added an item.', 'b.c': 'Consumer removed an item.',
      'lab.s.run': 'running', 'lab.s.wait': 'waiting', 'lab.s.zom': 'zombie', 'lab.s.dead': 'terminated', 'lab.pg.0': 'copy', 'lab.pg.1': 'new program', 'lab.root': 'shell',
      'lab.ph': 'Tap a process circle to select it, then choose a system call. Every action is explained here.',
      'lab.msg.reset': 'Lab reset: only the root process P100 exists.', 'lab.msg.off': 'The selected process is not running, so it cannot make that call. Select a running process.',
      'lab.msg.limit': 'This lab allows at most 9 processes. Terminate something first.',
      'lab.msg.fork': 'P{p} calls fork(): child P{c} is created as a duplicate (same program and data) with a new pid.',
      'lab.msg.exec': 'P{p} calls exec(): its memory space is replaced by a new program (the pid stays the same).',
      'lab.msg.w0': 'P{p} has no children, so wait() has nothing to wait for.', 'lab.msg.w1': 'P{p} calls wait(): the zombie child P{k} is reaped and its process-table entry is removed.',
      'lab.msg.w2': 'P{p} calls wait(): it moves off the ready queue until a child terminates (state: waiting).',
      'lab.msg.x1': 'P{p} calls exit(): its memory, open files and I/O buffers are reclaimed. Parent P{q} was waiting, so it wakes up and continues, and P{p} is removed.',
      'lab.msg.x2': 'P{p} calls exit(): its resources are reclaimed, but parent P{q} has not called wait(), so P{p} is now a ZOMBIE.',
      'lab.msg.x3': 'Root process P{p} exits, which ends the whole tree.', 'lab.msg.cas': 'Cascading termination: the OS also terminates all its descendants ({a}).',
      'quiz.score': 'Score: {s} / {n}', 'quiz.prog': '· question {i} of {n}', 'quiz.done': 'Finished! {s} / {n} ({p}%)',
      'quiz.great': 'Excellent work, you know this material.', 'quiz.good': 'Good. Review the topics you missed and try again.', 'quiz.retry': 'Review the Learn tab and the Simulator, then reset the quiz and try again.',
      'quiz.next': 'Next question', 'quiz.finish': 'See my score', 'quiz.ok': 'Correct ✓', 'quiz.no': 'Wrong ✗', 'quiz.right': 'The right answer is “{a}”.'
    },
    ar: {
      'err.arrival': 'وقت الوصول يجب أن يكون عدداً صحيحاً من 0 إلى {amax}.', 'err.burst': 'الـ Burst يجب أن يكون عدداً صحيحاً من 1 إلى {bmax}.',
      'err.priority': 'الأولوية يجب أن تكون عدداً صحيحاً من 1 إلى {pmax}.', 'err.quantum': 'الكوانتم يجب أن يكون عدداً صحيحاً من 1 إلى {qmax}. تم الاحتفاظ بآخر قيمة صالحة.',
      'err.idFormat': 'يجب أن يبدأ المعرّف بحرف ويتكوّن من 6 حروف أو أرقام كحد أقصى.', 'err.idDuplicate': 'معرّف العملية هذا موجود مسبقاً.', 'err.max': 'الحد الأقصى {n} عمليات.',
      'ok.added': 'تمت إضافة {p}.', 'ok.cleared': 'تم حذف كل العمليات.', 'ok.sample': 'تم تحميل العيّنة: {name}.',
      'proc.count': '{n} / {max} عمليات', 'btn.del': 'حذف',
      'sample.textbook': 'مثال الكتاب (4 عمليات)', 'sample.idle': 'مع فترات خمول للمعالج', 'sample.equal': 'وصول متساوٍ (الكل عند 0)', 'sample.convoy': 'تأثير القافلة (مهمة طويلة أولاً)', 'sample.single': 'عملية واحدة',
      'algo.name.rr': 'Round Robin (q={q})',
      'status.idle': 'جاهز', 'status.running': 'يعمل', 'status.paused': 'متوقف مؤقتاً', 'status.done': 'انتهى',
      'sim.t': 't = {t}', 'sim.tIdle': 't = –',
      'ev.arrive': '{p} وصلت (New ← Ready)', 'ev.dispatch': '{p} أُسندت إلى المعالج (Ready ← Running)', 'ev.preempt': '{p} قاطعها المجدول (Running ← Ready)',
      'ev.finish': '{p} انتهت (Running ← Terminated)', 'ev.idle': 'المعالج خامل: لا توجد عملية جاهزة', 'ev.done': 'انتهت جميع العمليات.',
      'state.new': 'جديدة (New)', 'state.ready': 'جاهزة (Ready)', 'state.running': 'تعمل (Running)', 'state.waiting': 'منتظرة (Waiting)', 'state.terminated': 'منتهية (Terminated)',
      'q.cpu': 'المعالج', 'q.ready': 'طابور الجاهزة (من الأمام ← الخلف)', 'q.empty': 'فارغ',
      'log.start': 'اضغط ابدأ (أو الخطوة التالية) لإعادة تشغيل الجدول وحدة زمنية بعد أخرى.',
      'gantt.idle': 'خمول', 'gantt.sub.idle': 'الجدول كاملاً، الزمن الكلي {total}. اضغط ابدأ لإعادة تشغيله.', 'gantt.sub.run': 'إعادة التشغيل: t = {t} من {total}',
      'res.empty': 'أضف عمليات لعرض النتائج.', 'res.avg': 'المتوسط',
      'stat.awt': 'متوسط وقت الانتظار', 'stat.atat': 'متوسط وقت الدوران', 'stat.art': 'متوسط وقت الاستجابة', 'stat.util': 'استغلال المعالج', 'stat.cs': 'تبديلات السياق', 'stat.cs.f': 'عملية ← عملية أخرى',
      'th.ct': 'CT', 'th.tat': 'TAT', 'th.wt': 'WT', 'th.rt': 'RT',
      'th.id.f': 'معرّف العملية', 'th.at.f': 'وقت الوصول', 'th.bt.f': 'زمن التنفيذ (Burst)', 'th.pr.f': 'الأولوية (الأصغر = الأعلى)',
      'th.ct.f': 'وقت الاكتمال', 'th.tat.f': 'وقت الدوران = CT − AT', 'th.wt.f': 'وقت الانتظار = TAT − BT', 'th.rt.f': 'وقت الاستجابة = أول تشغيل − AT',
      'cmp.empty': 'أضف عمليات في تبويب المحاكي لمقارنة الخوارزميات.',
      'cmp.win': 'أقل متوسط وقت انتظار: {names} ({v})', 'cmp.tie': 'تعادل في أقل متوسط وقت انتظار: {names} ({v})',
      'cmp.note': 'هذا صحيح لمجموعة العمليات هذه فقط. مجموعة أخرى أو كوانتم آخر قد يغيّر النتيجة، وأقل وقت انتظار ليس دائماً الخيار الأفضل (SJF قد يُجوِّع المهام الطويلة؛ و Round Robin يعطي وقت استجابة أفضل).',
      'cmp.m.wt': 'متوسط وقت الانتظار', 'cmp.m.tat': 'متوسط وقت الدوران', 'cmp.m.rt': 'متوسط وقت الاستجابة', 'cmp.m.util': 'استغلال المعالج',
      'cmp.lower': 'الأقل أفضل', 'cmp.higher': 'الأعلى أفضل', 'cmp.lowest': 'أقل انتظار',
      'm.ok': 'حجم Text وData ثابت. فقط الـ stack والـ heap يكبران ويصغران.', 'm.clash': 'تصادم الـ stack والـ heap! يجب على النظام ضمان عدم تداخلهما.',
      'sm.init': 'اضغط على اسم سهم (أو على زر). الأسهم المتقطعة المتوهجة هي الانتقالات المسموحة من الحالة الحالية.', 'sm.bad': 'غير مسموح من الحالة الحالية.',
      'sm.b.admit': 'قبول (Admit)', 'sm.b.dispatch': 'إسناد المجدول', 'sm.b.interrupt': 'مقاطعة (انتهاء الشريحة)', 'sm.b.wait': 'انتظار I/O أو حدث', 'sm.b.io': 'اكتمال I/O أو الحدث', 'sm.b.exit': 'إنهاء (Exit)', 'sm.b.reset': 'إعادة ضبط',
      'sm.m.admit': 'قُبلت العملية: أُنشئت ونُقلت إلى طابور الجاهزة.', 'sm.m.dispatch': 'إسناد المجدول: أُعطي المعالج للعملية.',
      'sm.m.interrupt': 'مقاطعة: انتهت الشريحة الزمنية، عودة إلى Ready.', 'sm.m.wait': 'طلبت العملية I/O أو تنتظر حدثاً.',
      'sm.m.io': 'اكتمال I/O أو الحدث: عودة إلى طابور الجاهزة.', 'sm.m.exit': 'Exit: أنهت العملية تنفيذها.',
      'pcb.field': 'الحقل', 'pcb.value': 'القيمة (لهذه العملية)',
      'pcb.pid': 'رقم العملية (PID)', 'pcb.pid.s': 'عدد صحيح فريد', 'pcb.pid.d': 'عدد صحيح فريد يعرّف العملية والـ PCB الخاص بها.',
      'pcb.state': 'حالة العملية', 'pcb.state.s': 'new … terminated', 'pcb.state.d': 'New أو ready أو running أو waiting أو terminated.',
      'pcb.pc': 'عداد البرنامج', 'pcb.pc.s': 'التعليمة التالية', 'pcb.pc.d': 'موقع التعليمة التالية للتنفيذ. يُحفظ عند تبديل السياق.',
      'pcb.regs': 'مسجلات المعالج', 'pcb.regs.s': 'السياق المحفوظ', 'pcb.regs.d': 'محتويات كل المسجلات الخاصة بالعملية، تُحفظ وتُستعاد عند كل تبديل سياق.',
      'pcb.sched': 'معلومات الجدولة', 'pcb.sched.s': 'الأولوية والطوابير', 'pcb.sched.d': 'الأولوية ومؤشرات طوابير الجدولة: البيانات التي يستخدمها المجدول.',
      'pcb.mem': 'إدارة الذاكرة', 'pcb.mem.s': 'الحدود وجداول الصفحات', 'pcb.mem.d': 'الذاكرة المخصصة للعملية (مسجلات base/limit أو جداول الصفحات).',
      'pcb.acct': 'المحاسبة', 'pcb.acct.s': 'وقت CPU المستخدم', 'pcb.acct.d': 'وقت CPU المستخدم والزمن المنقضي وحدود الوقت.',
      'pcb.io': 'حالة I/O', 'pcb.io.s': 'الأجهزة والملفات', 'pcb.io.d': 'أجهزة I/O المخصصة للعملية وقائمة ملفاتها المفتوحة.',
      'pcb.pc.v': 'بعد تنفيذ {n} وحدة زمنية', 'pcb.regs.v': 'تُحفظ هنا عند تبديل السياق', 'pcb.sched.v': 'الأولوية {pr}؛ الترتيب في طابور الجاهزة {q}',
      'pcb.mem.v': 'غير محاكى', 'pcb.acct.v': 'استخدمت {u} من {b}؛ انتظرت {w}', 'pcb.io.v': 'لا شيء (فترات CPU فقط)',
      'b.init': 'أضف وأزل عناصر. جرّب الإفراط في الملء أو الاستهلاك.', 'b.full': 'المخزن ممتلئ: على المنتج الانتظار.', 'b.empty': 'المخزن فارغ: على المستهلك الانتظار.', 'b.p': 'أضاف المنتج عنصراً.', 'b.c': 'أزال المستهلك عنصراً.',
      'lab.s.run': 'تعمل', 'lab.s.wait': 'منتظرة', 'lab.s.zom': 'زومبي', 'lab.s.dead': 'منتهية', 'lab.pg.0': 'نسخة', 'lab.pg.1': 'برنامج جديد', 'lab.root': 'shell',
      'lab.ph': 'اضغط على دائرة عملية لاختيارها ثم اختر system call. كل إجراء يُشرح هنا.',
      'lab.msg.reset': 'أُعيد ضبط المختبر: توجد فقط العملية الجذر P100.', 'lab.msg.off': 'العملية المختارة لا تعمل حالياً فلا تستطيع هذا الاستدعاء. اختر عملية في حالة running.',
      'lab.msg.limit': 'يسمح المختبر بـ 9 عمليات كحد أقصى. أنهِ عملية أولاً.',
      'lab.msg.fork': 'P{p} تستدعي fork(): يُنشأ الابن P{c} كنسخة (نفس البرنامج والبيانات) مع pid جديد.',
      'lab.msg.exec': 'P{p} تستدعي exec(): تُستبدل ذاكرتها ببرنامج جديد (ويبقى الـ pid نفسه).',
      'lab.msg.w0': 'P{p} ليس لها أبناء، فلا يوجد ما تنتظره في wait().', 'lab.msg.w1': 'P{p} تستدعي wait(): يُستلَم الابن الزومبي P{k} ويُحذف مدخله من جدول العمليات.',
      'lab.msg.w2': 'P{p} تستدعي wait(): تخرج من الـ ready queue حتى ينتهي أحد أبنائها (الحالة: waiting).',
      'lab.msg.x1': 'P{p} تستدعي exit(): تُحرَّر ذاكرتها وملفاتها المفتوحة ومخازن I/O. كان الأب P{q} ينتظر فيستيقظ ويتابع، وتُحذف P{p}.',
      'lab.msg.x2': 'P{p} تستدعي exit(): تُحرَّر مواردها، لكن الأب P{q} لم يستدعِ wait()، فتصبح P{p} الآن ZOMBIE.',
      'lab.msg.x3': 'العملية الجذر P{p} تنتهي، فتنتهي الشجرة كلها.', 'lab.msg.cas': 'إنهاء متسلسل: يُنهي النظام أيضاً كل أحفادها ({a}).',
      'quiz.score': 'النتيجة: {s} / {n}', 'quiz.prog': '· السؤال {i} من {n}', 'quiz.done': 'انتهيت! {s} / {n} ({p}%)',
      'quiz.great': 'عمل ممتاز، أنت متمكن من المادة.', 'quiz.good': 'جيد. راجع المواضيع التي أخطأت فيها ثم أعد المحاولة.', 'quiz.retry': 'راجع تبويب تعلّم والمحاكي، ثم أعد ضبط الاختبار وجرّب مرة أخرى.',
      'quiz.next': 'السؤال التالي', 'quiz.finish': 'عرض نتيجتي', 'quiz.ok': 'صح ✓', 'quiz.no': 'غلط ✗', 'quiz.right': 'الإجابة الصحيحة: “{a}”.'
    }
  };

  function interpolate(s, p) { return p ? s.replace(/\{(\w+)\}/g, function (m, k) { return p[k] == null ? m : p[k]; }) : s; }

  function pick(l, key) {
    var v = DYN[l][key];
    if (v == null && l === 'ar') v = AR_STATIC[key] != null ? AR_STATIC[key] : AR_TIP[key];
    if (v == null && l === 'en') v = EN[key] != null ? EN[key] : ENTIP[key];
    return v;
  }
  function t(key, params) {
    var s = pick(lang, key);
    if (s == null) s = pick('en', key);        // fall back to English, then to the key itself
    return interpolate(s == null ? key : s, params);
  }

  function capture() {
    [].forEach.call(document.querySelectorAll('[data-i]'), function (el) { EN[el.dataset.i] = el.innerHTML; });
    [].forEach.call(document.querySelectorAll('[data-i-tip]'), function (el) { ENTIP[el.dataset.iTip] = el.getAttribute('data-tip'); });
  }

  function applyStatic() {
    [].forEach.call(document.querySelectorAll('[data-i]'), function (el) { el.innerHTML = t(el.dataset.i); });
    [].forEach.call(document.querySelectorAll('[data-i-tip]'), function (el) { el.setAttribute('data-tip', t(el.dataset.iTip)); });
    var h = document.documentElement; h.lang = lang; h.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.title = lang === 'ar' ? 'محاكي إدارة العمليات وجدولة المعالج' : 'Process Management & CPU Scheduling Simulator';
    var b = document.getElementById('lang'); if (b) b.textContent = lang === 'ar' ? 'English' : 'العربية';
  }

  root.I18N = {
    init: function () { capture(); },
    lang: function () { return lang; },
    t: t,
    set: function (l) { lang = l; applyStatic(); listeners.forEach(function (fn) { fn(); }); },
    onChange: function (fn) { listeners.push(fn); },
    // used by the self-check in tests: every static key must have an Arabic entry
    _keys: function () { return { static: Object.keys(EN), ar: Object.keys(AR_STATIC), tips: Object.keys(ENTIP), arTips: Object.keys(AR_TIP), dynEn: Object.keys(DYN.en), dynAr: Object.keys(DYN.ar) }; }
  };
})(window);
