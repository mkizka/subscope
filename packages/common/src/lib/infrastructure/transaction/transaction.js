export class TransactionManager {
  db;
  constructor(db) {
    this.db = db;
  }
  async transaction(fn) {
    const tasks = [];
    const result = await this.db.transaction((tx) =>
      fn({ db: tx, afterCommit: (task) => tasks.push(task) }),
    );
    for (const task of tasks) await task();
    return result;
  }
}
