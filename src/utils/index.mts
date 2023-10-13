export function today(): number {
    const now = new Date();
    return +now.toISOString().split('T')[0]!.replace(/-/gu, '');
}

export function tomorrow(): number {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return Math.floor(tomorrow.getTime() / 1000);
}
