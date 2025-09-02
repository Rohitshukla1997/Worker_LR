/**
 * Converts an ISO 8601 string to "dd/mm/yyyy hh:mm" format.
 * Example: "2025-07-29T12:20:20.543Z" → "29/07/2025 12:20"
 */
export const useDateTime = (isoString) => {
    if (!isoString) return null;

    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
        console.warn('Invalid ISO date string. Got:', isoString);
        return null;
    }

    const pad = (num) => num.toString().padStart(2, '0');

    const day = pad(date.getUTCDate());
    const month = pad(date.getUTCMonth() + 1);
    const year = date.getUTCFullYear();
    const hour = pad(date.getUTCHours());
    const minute = pad(date.getUTCMinutes());

    return `${day}/${month}/${year} ${hour}:${minute}`;
};
