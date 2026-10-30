type Pending<K, V> = {
  key: K;
  resolve: (value: V | undefined) => void;
  reject: (error: unknown) => void;
};

export class Batch<K, V> {
  private readonly cache = new Map<K, Promise<V | undefined>>();
  private pending: Pending<K, V>[] = [];

  constructor(private readonly fetch: (keys: K[]) => Promise<Map<K, V>>) {}

  load(key: K): Promise<V | undefined> {
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }
    const promise = new Promise<V | undefined>((resolve, reject) => {
      if (this.pending.length === 0) {
        queueMicrotask(() => void this.flush());
      }
      this.pending.push({ key, resolve, reject });
    });
    this.cache.set(key, promise);
    return promise;
  }

  private async flush() {
    const batch = this.pending;
    this.pending = [];
    try {
      const values = await this.fetch([...new Set(batch.map((p) => p.key))]);
      for (const { key, resolve } of batch) {
        resolve(values.get(key));
      }
    } catch (error) {
      for (const { reject } of batch) {
        reject(error);
      }
    }
  }
}
