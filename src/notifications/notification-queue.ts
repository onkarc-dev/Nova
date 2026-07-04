import { Injectable, Logger } from '@nestjs/common';
import { NotificationPriority } from '@prisma/client';

export interface NotificationJob {
  notificationId: string;
  priority: NotificationPriority;
  attempts: number;
}

@Injectable()
export class NotificationQueue {
  private readonly logger = new Logger(NotificationQueue.name);
  private readonly pending = new Map<string, NotificationJob>();

  enqueue(job: NotificationJob): void {
    const existing = this.pending.get(job.notificationId);
    if (existing && this.rank(existing.priority) >= this.rank(job.priority)) return;
    this.pending.set(job.notificationId, job);
  }

  drain(limit = 25): NotificationJob[] {
    const jobs = [...this.pending.values()]
      .sort((a, b) => this.rank(b.priority) - this.rank(a.priority) || a.attempts - b.attempts)
      .slice(0, limit);
    for (const job of jobs) this.pending.delete(job.notificationId);
    if (jobs.length) this.logger.debug(`Drained ${String(jobs.length)} notification jobs from in-process queue.`);
    return jobs;
  }

  size(): number {
    return this.pending.size;
  }

  backoffMs(attempts: number): number {
    return Math.min(30_000, 500 * 2 ** Math.max(0, attempts - 1));
  }

  private rank(priority: NotificationPriority): number {
    return { LOW: 0, NORMAL: 1, HIGH: 2, CRITICAL: 3 }[priority];
  }
}
