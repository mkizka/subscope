export const required = <T>(value: T | null | undefined): T => {
  if (value === null || value === undefined) {
    throw new Error("value is required");
  }
  return value;
};
