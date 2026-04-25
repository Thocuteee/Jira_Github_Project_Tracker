const UTC7_TIME_ZONE = 'Asia/Bangkok';
const HAS_TZ_SUFFIX_REGEX = /(Z|[+\-]\d{2}:\d{2})$/i;

const dateTimeFormatter = new Intl.DateTimeFormat('vi-VN', {
  timeZone: UTC7_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

const timeFormatter = new Intl.DateTimeFormat('vi-VN', {
  timeZone: UTC7_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const formatFallback = (value?: string | Date | null): string => {
  if (!value) return '--';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toISOString();
};

const toDateAssumingUtcIfMissingTz = (value?: string | Date | null): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const raw = String(value).trim();
  if (!raw) return null;

  const normalized = HAS_TZ_SUFFIX_REGEX.test(raw) ? raw : `${raw}Z`;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

export const formatUtc7DateTime = (value?: string | Date | null): string => {
  const date = toDateAssumingUtcIfMissingTz(value);
  if (!date) return formatFallback(value);
  return dateTimeFormatter.format(date);
};

export const formatUtc7Time = (value?: string | Date | null): string => {
  const date = toDateAssumingUtcIfMissingTz(value);
  if (!date) return formatFallback(value);
  return timeFormatter.format(date);
};
