// Copyright (c) 2022. All rights reserved. MIT license.

import type { Disposable, Runnable } from "./types.d.ts";

/**
 * Simple callback {@link Disposable} implementation
 */
export class CallbackDisposable implements Disposable {
  #callback?: Runnable;

  constructor(callback: Runnable) {
    this.#callback = callback;
  }

  dispose(): void {
    this.#callback?.();
  }
}

export class Disposables {
  static REJECTED: Disposable = new CallbackDisposable(() => {});
}
