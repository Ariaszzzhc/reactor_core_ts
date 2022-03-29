// Copyright (c) 2022. All rights reserved. MIT license.

/**
 * task type alias
 */
export type Runnable = () => void;

/**
 * Periodic execution options
 */
export interface ScheduleOptions {
  /**
   * the delay amount, non-positive values indicate non-delayed scheduling
   */
  initialDelay?: number;

  /**
   * the period at which the task should be re-executed
   */
  period?: number;
}

/**
 * Indicates that a task or resource can be cancelled/disposed.
 *
 * Call to the dispose method is/should be idempotent.
 */
export interface Disposable {
  /**
   * Cancel or dispose the underlying task or resource.
   *
   * Implementations are required to make this method idempotent.
   */
  dispose(): void;
}

/**
 * Provides an abstract asynchronous boundary to operators.
 */
export interface Scheduler {
  /**
   * Schedules the execution of the given task with the given delay amount.
   *
   * @param task the task to schedule
   * @param delay the delay amount, non-positive values indicate non-delayed scheduling
   * @return the {@link Disposable} that let's one cancel this particular delayed task
   */
  schedule(task: Runnable, delay?: number): Disposable;

  /**
   * Schedules a periodic execution of the given task with the given initial delay and period.
   *
   * The periodic execution is at a fixed rate, that is, the first execution will be after the initial
   * delay, the second after initialDelay + period, the third after initialDelay + 2 * period, and so on.
   *
   * @param task the task to schedule
   * @param options the {@link ScheduleOptions} object
   * @return the {@link Disposable} that let's one cancel this particular delayed task
   */
  schedulePeriodically(task: Runnable, options: ScheduleOptions): Disposable;

  /**
   * Creates a worker of this Scheduler.
   *
   * Once the Worker is no longer in use, one should call {@link Worker#shutdown()} on it to
   * release any resources the particular Scheduler may have used.
   *
   * @return the Worker instance.
   */
  createWorker(): Worker;

  /**
   * Returns the "current time" notion of this scheduler.
   *
   * @return the current time value in the target unit of measure
   */
  now(): number;
}

/**
 * A worker representing an asynchronous boundary that executes tasks.
 *
 */
export interface Worker {
  /**
   * Schedules the execution of the given task with the given delay amount.
   *
   * @param task the task to schedule
   * @param delay the delay amount, non-positive values indicate non-delayed scheduling
   * @return the {@link Disposable} that let's one cancel this particular delayed task
   */
  schedule(task: Runnable, delay?: number): Disposable;

  /**
   * Schedules a periodic execution of the given task with the given initial delay and period.
   *
   * <p>
   * The periodic execution is at a fixed rate, that is, the first execution will be after the initial
   * delay, the second after initialDelay + period, the third after initialDelay + 2 * period, and so on.
   *
   * @param task the task to schedule
   * @param options the {@link ScheduleOptions} object
   * @return the {@link Disposable} that let's one cancel this particular delayed task
   */
  schedulePeriodically(task: Runnable, options: ScheduleOptions): Disposable;

  /**
   * Shutdown this worker and release any resources the particular Scheduler may have used.
   */
  shutdown(): void;
}
