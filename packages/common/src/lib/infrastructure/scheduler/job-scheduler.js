const AGGREGATE_STATS_DELAY_MS = 10 * 1000;
export class JobScheduler {
  jobQueue;
  constructor(jobQueue) {
    this.jobQueue = jobQueue;
  }
  async scheduleFetchRecord(uri, { live, depth }) {
    const uriString = uri.toString();
    await this.jobQueue.add({
      queueName: "fetchRecord",
      jobName: uriString,
      data: {
        uri: uriString,
        depth,
        live,
      },
      options: {
        jobId: uriString,
        priority: live ? undefined : 1,
      },
    });
  }
  async scheduleResolveDid(did) {
    const jobName = `at://${did}`;
    await this.jobQueue.add({
      queueName: "resolveDid",
      jobName,
      data: did,
      options: {
        jobId: jobName,
      },
    });
  }
  async scheduleSyncTapRepo(did) {
    await this.jobQueue.add({
      queueName: "syncTapRepo",
      jobName: did,
      data: did,
    });
  }
  async scheduleAggregatePostStats(uri, type) {
    const postUri = uri.toString();
    await this.jobQueue.add({
      queueName: "aggregatePostStats",
      jobName: postUri,
      data: {
        uri: postUri,
        type,
      },
      options: {
        deduplication: { id: `${type}__${postUri}`, keepLastIfActive: true },
        delay: AGGREGATE_STATS_DELAY_MS,
      },
    });
  }
  async scheduleAggregateActorStats(did, type) {
    await this.jobQueue.add({
      queueName: "aggregateActorStats",
      jobName: did,
      data: {
        did,
        type,
      },
      options: {
        deduplication: { id: `${type}__${did}`, keepLastIfActive: true },
        delay: AGGREGATE_STATS_DELAY_MS,
      },
    });
  }
}
