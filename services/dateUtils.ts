export function format(date: Date, formatStr: string): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'No Date';
    
    const day = d.getDate();
    const month = d.getMonth();
    const year = d.getFullYear();
    
    if (formatStr === 'yyyy-MM-dd') {
        return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    if (formatStr === 'MMM d, yyyy') {
        return `${months[month]} ${day}, ${year}`;
    }
    if (formatStr === 'MMM d, yyyy • h:mm a') {
        let hours = d.getHours();
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${months[month]} ${day}, ${year} • ${hours}:${minutes} ${ampm}`;
    }
    return d.toDateString();
}

export function parseISO(dateStr: string): Date {
    return new Date(dateStr);
}

export function isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
}

export function isTomorrow(date: Date): boolean {
    const tomorrow = new Date(Date.now() + 86400000);
    return date.getDate() === tomorrow.getDate() &&
        date.getMonth() === tomorrow.getMonth() &&
        date.getFullYear() === tomorrow.getFullYear();
}

export function isBefore(date1: Date, date2: Date): boolean {
    // compare dates by resetting time to midnight to avoid hours mismatch
    const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
    return d1.getTime() < d2.getTime();
}
