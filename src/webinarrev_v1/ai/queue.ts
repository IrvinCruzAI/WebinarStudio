type QueueTask<T> = () => Promise<T>;

export class AIQueue {
  private maxConcurrent = 2;
  private active = 0;
  private queue: Array<() => void> = [];
  private cancelled = false;

  async enqueue<T>(task: QueueTask<T>): Promise<T> {
    if (this.cancelled) {
      throw new Error('Queue has been cancelled');
    }

    return new Promise<T>((resolve, reject) => {
      const wrappedTask = async () => {
        if (this.cancelled) {
          reject(new Error('Task cancelled'));
          return;
        }

        this.active++;
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.active--;
          this.processNext();
        }
      };

      if (this.active < this.maxConcurrent) {
        wrappedTask();
      } else {
        this.queue.push(wrappedTask);
      }
    });
  }

  private processNext(): void {
    if (this.queue.length > 0 && this.active < this.maxConcurrent && !this.cancelled) {
      const next = this.queue.shift();
      if (next) {
        next();
      }
    }
  }

  cancel(): void {
    this.cancelled = true;
    this.queue = [];
  }

  reset(): void {
    this.cancelled = false;
    this.queue = [];
    this.active = 0;
  }

  isActive(): boolean {
    return this.active > 0 || this.queue.length > 0;
  }
}
