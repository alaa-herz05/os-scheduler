# os-scheduler-simulator
A browser-based simulator for the Operating Systems “Processes” chapter, built at Jadara University. It lets you edit a process table, pick a scheduling algorithm and watch the simulation run step by step. A dynamic Gantt chart, including idle periods, and per-process Completion, Turnaround, Waiting and Response times, with averages and CPU utilization, show the result.

Features

FCFS, SJF (non-preemptive), Priority (non-preemptive) and Round Robin, with deterministic tie-breaking
Start / Pause / Resume / Next Step / Reset and speed control, with a live process-state pipeline
Side-by-side algorithm comparison that highlights the lowest average waiting time
Process Lab for fork / exec / wait / exit, zombies and orphans
Concise theory: process states, PCB, memory layout, IPC and a bounded-buffer demo
15-question bilingual quiz
Dark purple theme, responsive layout, English/Arabic (RTL) toggle
Input validation and edge-case handling

Run: open index.html in any browser. No install or build step.
Test: node tests/scheduler.test.js runs 3,317 checks.
