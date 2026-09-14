// Night-window gating: the app only accepts new posts, votes and
// certificate claims between NIGHT_START_HOUR and NIGHT_END_HOUR local time
// (TIMEZONE env), wrapping past midnight by default (21:00 -> 09:00).
//
// No date library is used here on purpose: only the IANA timezone database
// via Intl is needed, so wall-clock <-> UTC conversion is done with a small
// self-correcting helper instead of pulling in date-fns-tz.

export function getNightConfig() {
  const startHour = Number(process.env.NIGHT_START_HOUR ?? "21");
  const endHour = Number(process.env.NIGHT_END_HOUR ?? "9");
  const timeZone = process.env.TIMEZONE || "Europe/Paris";
  return { startHour, endHour, timeZone };
}

export type LocalParts = {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  second: number;
};

export function getLocalParts(date: Date, timeZone: string): LocalParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

/**
 * Converts a local wall-clock time in `timeZone` to the UTC instant it
 * represents, correcting for DST via two passes (standard trick: guess the
 * UTC instant as if the zone had zero offset, measure the error by
 * re-reading it back in the zone, then correct).
 */
export function localPartsToUtc(parts: LocalParts, timeZone: string): Date {
  let guess = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
  for (let i = 0; i < 2; i++) {
    const observed = getLocalParts(new Date(guess), timeZone);
    const observedUtc = Date.UTC(
      observed.year,
      observed.month - 1,
      observed.day,
      observed.hour,
      observed.minute,
      observed.second
    );
    const errorMs = observedUtc - guess;
    guess -= errorMs;
  }
  return new Date(guess);
}

function dateKeyFromParts(p: { year: number; month: number; day: number }) {
  const mm = String(p.month).padStart(2, "0");
  const dd = String(p.day).padStart(2, "0");
  return `${p.year}-${mm}-${dd}`;
}

function addDays(p: LocalParts, days: number): LocalParts {
  // Use UTC arithmetic on the naive calendar date, which is safe because
  // we only ever add/subtract whole days to a Y/M/D triple, never hours.
  const t = Date.UTC(p.year, p.month - 1, p.day) + days * 86_400_000;
  const d = new Date(t);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: p.hour,
    minute: p.minute,
    second: p.second,
  };
}

export type NightWindowStatus = {
  isOpen: boolean;
  /** dateKey of the night currently open, or the most recently open one. */
  dateKey: string;
  /** When the current/next window opens. */
  opensAt: Date;
  /** When the current/next window closes. */
  closesAt: Date;
};

export function getNightWindowStatus(now: Date = new Date()): NightWindowStatus {
  const { startHour, endHour, timeZone } = getNightConfig();
  const local = getLocalParts(now, timeZone);
  const wraps = startHour > endHour;

  const isOpen = wraps
    ? local.hour >= startHour || local.hour < endHour
    : local.hour >= startHour && local.hour < endHour;

  if (isOpen) {
    if (wraps && local.hour < endHour) {
      // We're in the early-morning tail of a night that started yesterday.
      const startDay = addDays(local, -1);
      const opensAt = localPartsToUtc(
        { ...startDay, hour: startHour, minute: 0, second: 0 },
        timeZone
      );
      const closesAt = localPartsToUtc(
        { ...local, hour: endHour, minute: 0, second: 0 },
        timeZone
      );
      return { isOpen, dateKey: dateKeyFromParts(startDay), opensAt, closesAt };
    }
    const opensAt = localPartsToUtc(
      { ...local, hour: startHour, minute: 0, second: 0 },
      timeZone
    );
    const closesAt = localPartsToUtc(
      { ...(wraps ? addDays(local, 1) : local), hour: endHour, minute: 0, second: 0 },
      timeZone
    );
    return { isOpen, dateKey: dateKeyFromParts(local), opensAt, closesAt };
  }

  // Closed: figure out the next opening (today or tomorrow) and, for
  // display purposes, when it will next close after that.
  const opensToday = local.hour < startHour;
  const opensDay = opensToday ? local : addDays(local, 1);
  const opensAt = localPartsToUtc(
    { ...opensDay, hour: startHour, minute: 0, second: 0 },
    timeZone
  );
  const closesDay = wraps ? addDays(opensDay, 1) : opensDay;
  const closesAt = localPartsToUtc(
    { ...closesDay, hour: endHour, minute: 0, second: 0 },
    timeZone
  );
  return { isOpen, dateKey: dateKeyFromParts(opensDay), opensAt, closesAt };
}
