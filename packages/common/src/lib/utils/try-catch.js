export function tryCatch(fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof Error) {
        return error;
      }
      throw error;
    }
  };
}
