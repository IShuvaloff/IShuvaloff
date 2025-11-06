export function getWeekMonday(weekOffset = 0) {
    const result = new Date();
    result.setDate(result.getDate() - result.getDay() + 1 + weekOffset * 7);
    result.setHours(0, 0, 0, 0);
    return result;
}

export function isToday(date) {
    if (!(date instanceof Date)) return false;
    const today = new Date();
    return (
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate()
    );
}

export function setLocalData(key, data) {
    if (typeof key === "function") return;
    if (["null", "undefined"].includes(typeof data))
        localStorage.removeItem(key);
    if (typeof data === "object") {
        localStorage.setItem(key, JSON.stringify(data));
    } else {
        localStorage.setItem(key, `${data}`);
    }
}

export function isInRange(num, min, max) {
    return num >= min && num <= max;
}

export function random(min, max, includeMax = true) {
    const range = includeMax ? max - min + 1 : max - min;
    return Math.floor(Math.random() * range) + min;
}

export function alertMessage(text) {
    setTimeout(() => alert(text), 100);
}
