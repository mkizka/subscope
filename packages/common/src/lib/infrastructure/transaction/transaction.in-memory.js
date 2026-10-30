export class InMemoryTransactionManager {
  async transaction(fn) {
    const tasks = [];
    const result = await fn({
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      db: {},
      afterCommit: (task) => tasks.push(task),
    });
    for (const task of tasks) await task();
    return result;
  }
}
