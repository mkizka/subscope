export class InMemoryJobScheduler {
  fetchRecordJobs = [];
  resolveDidJobs = [];
  syncTapRepoJobs = [];
  aggregatePostStatsJobs = [];
  aggregateActorStatsJobs = [];
  async scheduleFetchRecord(uri, { live, depth }) {
    this.fetchRecordJobs.push({ uri, live, depth });
  }
  async scheduleResolveDid(did) {
    this.resolveDidJobs.push({ did });
  }
  async scheduleSyncTapRepo(did) {
    this.syncTapRepoJobs.push({ did });
  }
  async scheduleAggregatePostStats(uri, type) {
    this.aggregatePostStatsJobs.push({ uri, type });
  }
  async scheduleAggregateActorStats(did, type) {
    this.aggregateActorStatsJobs.push({ did, type });
  }
  getFetchRecordJobs() {
    return this.fetchRecordJobs;
  }
  getResolveDidJobs() {
    return this.resolveDidJobs;
  }
  getSyncTapRepoJobs() {
    return this.syncTapRepoJobs;
  }
  getAggregatePostStatsJobs() {
    return this.aggregatePostStatsJobs;
  }
  getAggregateActorStatsJobs() {
    return this.aggregateActorStatsJobs;
  }
  clear() {
    this.fetchRecordJobs = [];
    this.resolveDidJobs = [];
    this.syncTapRepoJobs = [];
    this.aggregatePostStatsJobs = [];
    this.aggregateActorStatsJobs = [];
  }
}
