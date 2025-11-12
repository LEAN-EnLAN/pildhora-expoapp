export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
export const isNumeric = (v: string) => /^\d+(\.\d+)?$/.test(v.trim());
export const required = (v: string) => v.trim().length > 0;
export const minLength = (v: string, n: number) => v.trim().length >= n;

