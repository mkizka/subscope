export const required = (value) => {
  if (value === null || value === undefined) {
    throw new Error("value is required");
  }
  return value;
};
