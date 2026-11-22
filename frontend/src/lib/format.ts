export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
export const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());
