
import EventEmitter from 'events';

class JobQueue extends EventEmitter {
  constructor() {
    super();
    this.queue = [];
    this.running = false;
  }

  enqueue(jobId) {
    this.queue.push(jobId);
    this.emit('enqueued', jobId);
    this._maybeRun();
  }

  dequeue() {
    return this.queue.shift();
  }

  _maybeRun() {
    if (this.running) return;
    if (this.queue.length === 0) return;
    this.running = true;
    this._runLoop();
  }

  async _runLoop() {
    while (this.queue.length > 0) {
      const jobId = this.dequeue();
      try {
        await this.emitAsync('process', jobId);
      } catch (err) {
        console.error('Job processing error (queue):', err);
      }
    }
    this.running = false;
  }

  emitAsync(event, ...args) {
    const listeners = this.listeners(event);
    return Promise.all(listeners.map(fn => fn(...args)));
  }
}

const jobQueue = new JobQueue();
export default jobQueue;
