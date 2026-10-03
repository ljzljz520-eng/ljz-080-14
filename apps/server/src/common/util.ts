let seq = 0;
export function uid(prefix: string): string {
  seq += 1;
  return `${prefix}${Date.now().toString(36)}${seq}${Math.floor(
    Math.random() * 1e4,
  )}`;
}

/** 演示基准日（与种子数据对齐）；真实环境使用服务器当天 */
export function today(): string {
  return process.env.DEMO_DATE ?? '2026-10-03';
}

export function daysBetween(fromISO: string, toISO: string): number {
  const a = new Date(`${fromISO}T00:00:00`).getTime();
  const b = new Date(`${toISO}T00:00:00`).getTime();
  return Math.round((b - a) / 86_400_000);
}

export function nowISO(): string {
  return new Date().toISOString();
}
