import { runDailySync } from './models/CardM.js';

// Use an external scheduler and the CLI when running multiple API replicas.
export function nextSync(now: Date, hour: number) {
  const next = new Date(now);
  next.setUTCHours(hour, 0, 0, 0);
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  return next;
}
export function startDailySync() {
  if (process.env.SYNC_ENABLED !== 'true') return () => {};
  const hour = Number(process.env.SYNC_HOUR_UTC ?? 11);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) throw new Error('SYNC_HOUR_UTC deve ser 0–23.');
  let timer: ReturnType<typeof setTimeout>;
  const schedule = () => {
    timer = setTimeout(() => { runDailySync(); schedule(); }, nextSync(new Date(), hour).getTime() - Date.now());
    timer.unref();
  };
  schedule();
  return () => clearTimeout(timer);
}
