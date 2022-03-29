// Copyright (c) 2022. All rights reserved. MIT license.

import type {
  Disposable,
  Runnable,
  ScheduleOptions,
  Scheduler,
  Worker,
} from "./types.d.ts";
import { CallbackDisposable, Disposables } from "./disposable.ts";

/**
 * Default implementation for {@link Scheduler} interface
 */
export class DefaultScheduler implements Scheduler {
  schedule(task: Runnable, delay?: number): Disposable {
    const id = setTimeout(task, delay ?? 0);
    return new CallbackDisposable(() => clearTimeout(id));
  }

  schedulePeriodically(
    task: Runnable,
    options: ScheduleOptions = {}
  ): Disposable {
    const periodicTask = new PeriodicTask(task);

    periodicTask.initialId = setTimeout(() => {
      task();
      periodicTask.periodId = setInterval(
        periodicTask.run,
        options.period ?? 0
      );
    }, options.initialDelay ?? 0);

    return periodicTask;
  }

  now(): number {
    return new Date().getTime();
  }

  createWorker(): Worker {
    return new DefaultWorker();
  }
}

/**
 * Default worker implementation for {@link Worker} interface
 */
export class DefaultWorker implements Worker {
  #shutdown: boolean;
  #timeouts: Array<number> = [];
  #intervals: Array<number> = [];

  constructor() {
    this.#shutdown = false;
  }

  schedule(task: Runnable, delay?: number): Disposable {
    if (this.#shutdown) {
      return Disposables.REJECTED;
    }

    const workerTask = new WorkerTask(this, task);

    const id = setTimeout(workerTask.run, delay ?? 0);
    this.#timeouts.push(id);
    workerTask.id = id;

    return workerTask;
  }

  schedulePeriodically(task: Runnable, options: ScheduleOptions): Disposable {
    if (this.#shutdown) {
      return Disposables.REJECTED;
    }

    const workerTask = new WorkerPeriodicTask(this, task);

    const initialId = setTimeout(() => {
      task();

      const periodId = setInterval(workerTask.run, options.period ?? 0);

      this.#intervals.push(periodId);

      workerTask.periodId = periodId;
    }, options.initialDelay ?? 0);

    this.#timeouts.push(initialId);

    return workerTask;
  }

  shutdown(): void {
    this.#shutdown = true;
    this.#intervals.forEach((it) => {
      clearInterval(it);
    });

    this.#timeouts.forEach((it) => {
      clearTimeout(it);
    });

    this.#intervals.length = 0;
    this.#timeouts.length = 0;
  }

  /**
   * Remove the setTimeout timer from the internal tracking list
   * @param id setTimeout timer id
   */
  removeTimeout(id?: number) {
    if (id) {
      const idx = this.#timeouts.indexOf(id);
      if (idx >= 0) {
        this.#timeouts.splice(idx, 1);
      }
    }
  }

  /**
   * Remove the setInterval timer from the internal tracking list
   * @param id setInterval timer id
   */
  removeInterval(id?: number) {
    if (id) {
      const idx = this.#intervals.indexOf(id);
      if (idx >= 0) {
        this.#intervals.splice(idx, 1);
      }
    }
  }
}

export class PeriodicTask implements Disposable {
  _task: Runnable;
  initialId?: number;
  periodId?: number;

  constructor(task: Runnable) {
    this._task = task;
  }

  run() {
    try {
      this._task();
    } catch (_) {
      this.dispose();
    }
  }

  dispose(): void {
    if (this.initialId) {
      clearTimeout(this.initialId);
    }

    if (this.periodId) {
      clearInterval(this.periodId);
    }
  }
}

export class WorkerTask implements Disposable {
  id?: number;
  #parent: DefaultWorker;
  #task: Runnable;

  constructor(parentWorker: DefaultWorker, task: Runnable) {
    this.#parent = parentWorker;
    this.#task = task;
  }

  run() {
    try {
      this.#task();
    } finally {
      this.#parent.removeTimeout(this.id);
    }
  }

  dispose(): void {
    clearTimeout(this.id);
    this.#parent.removeTimeout(this.id);
  }
}

export class WorkerPeriodicTask extends PeriodicTask {
  #parent: DefaultWorker;

  constructor(parentWorker: DefaultWorker, task: Runnable) {
    super(task);
    this.#parent = parentWorker;
  }

  run() {
    try {
      this._task();
    } catch (_) {
      if (this.periodId) {
        const periodId = this.periodId;
        clearInterval(periodId);
        this.#parent.removeInterval(periodId);
      }
    }
  }

  dispose() {
    if (this.initialId) {
      const initialId = this.initialId;
      clearTimeout(initialId);
      this.#parent.removeTimeout(initialId);
    }
    if (this.periodId != null) {
      const periodId = this.periodId;
      clearInterval(periodId);
      this.#parent.removeInterval(periodId);
    }
  }
}

/**
 * {@link DefaultScheduler} singleton object
 */
const SCHEDULER_INSTANCE = new DefaultScheduler();

/**
 * Get the {@link Scheduler} instance
 * @returns the {@link DefaultScheduler} singleton object
 */
export function defaultScheduler(): Scheduler {
  return SCHEDULER_INSTANCE;
}
