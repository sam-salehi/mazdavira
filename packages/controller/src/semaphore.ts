export default class Semaphore {
    private tasks: (() => void)[] = [];
    private counter: number;
  
    constructor(private maxConcurrency: number) {
      this.counter = maxConcurrency;
    }
  
    async acquire(): Promise<void> {
      if (this.counter > 0) {
        this.counter--;
        return;
      }
  
      return new Promise<void>((resolve) => {
        this.tasks.push(resolve);
      });
    }
  
    release(): void {
      this.counter++;
      if (this.tasks.length > 0) {
        const nextTask = this.tasks.shift();
        if (nextTask) {
          this.counter--;
          nextTask();
        }
      }
    }
  }

