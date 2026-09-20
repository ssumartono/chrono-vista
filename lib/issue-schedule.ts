export function parseJakartaSchedule(value: string, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error('Format waktu terbit tidak valid.');
  const date = new Date(`${value}:00+07:00`);
  if (Number.isNaN(date.getTime())) throw new Error('Waktu terbit tidak valid.');
  const local = new Date(date.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 16);
  if (local !== value) throw new Error('Tanggal terbit tidak valid.');
  if (date.getTime() <= now.getTime()) throw new Error('Pilih waktu terbit di masa depan.');
  return date;
}

export function formatJakartaInput(date: Date) {
  return new Date(date.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 16);
}

export function jakartaScheduleDefaults(now = new Date()) {
  return {
    earliest: formatJakartaInput(new Date(now.getTime() + 60_000)),
    suggested: formatJakartaInput(new Date(now.getTime() + 10 * 60_000)),
    currentLabel: now.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' }),
  };
}
