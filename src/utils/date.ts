/**
 * Formats a date or ISO string into a locale-aware time string.
 * Uses the device's default locale and respects 12H/24H settings.
 */
export function formatTimeLocale(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Formats a date or ISO string into a locale-aware date string.
 * Uses the device's default locale (e.g., DD/MM/YYYY or MM/DD/YYYY).
 */
export function formatDateLocale(date: Date | string, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString(undefined, options);
}

/**
 * Standardizes a HH:mm string (like 20:00) into a locale-aware time string.
 */
export function formatTimeStr(timeStr: string): string {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const d = new Date();
    d.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return formatTimeLocale(d);
}

/**
 * Combines date and time in a detailed locale-aware format.
 * Format: "MMM DD, h:mm:ss A" (e.g., "Feb 28, 9:26:38 PM")
 */
export function formatDetailedDateTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true
    });
}
/**
 * Formats a birthday string (MM-DD) into a human-readable format like "21st March".
 */
export function formatBirthday(birthday?: string): string | null {
    if (!birthday || birthday === '') return null;
    const parts = birthday.split('-');
    if (parts.length !== 2) return birthday;
    const month = parseInt(parts[0]);
    const day = parseInt(parts[1]);
    if (isNaN(month) || isNaN(day)) return birthday;
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const suffix = (d: number) => {
        if (d > 3 && d < 21) return 'th';
        switch (d % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    };
    return `${day}${suffix(day)} ${months[month - 1]}`;
}
