# Process Management & CPU Scheduling Simulator

Operating Systems, Chapter 3: Processes. Plain HTML + CSS + vanilla JavaScript. No backend, no build step, no frameworks.

## Run
Open `index.html` in any modern browser (double-click it). Fonts load from Google Fonts when online and fall back to system fonts offline.

Run the algorithm tests (optional, needs Node.js): `node tests/scheduler.test.js`

## Structure
| File | Role |
|---|---|
| `index.html` | Layout and static text (tabs: Simulator, Compare, Process Lab, Learn, Quiz) |
| `css/style.css` | Dark purple theme, responsive layout, RTL support |
| `js/scheduler.js` | **Pure scheduling logic** (FCFS, SJF, Priority, Round Robin, metrics). No DOM. |
| `js/gantt.js` | Gantt chart and legend rendering |
| `js/simulator.js` | State, process table + validation, controls, dashboard, state pipeline, results |
| `js/compare.js` | Four-algorithm comparison |
| `js/learn.js`, `js/lab.js`, `js/quiz.js` | Theory widgets, Process Lab, quiz |
| `js/i18n.js` | English / Arabic |
| `tests/scheduler.test.js` | Hand-computed cases + 400 random invariant checks |

## Rules
- Times are integers. CPU utilization = busy time / total time (from t = 0 to last completion).
- Ties: FCFS = arrival, then row order. SJF = burst, arrival, row order. Priority (lower number = higher) = priority, arrival, row order.
- Round Robin: FIFO queue; an arrival at the exact moment a quantum expires is queued before the preempted process.
- Limits: 10 processes, arrival 0-100, burst 1-50, priority 1-20, quantum 1-50.
