export class InMemoryJobQueue {
  jobs = [];
  getQueues() {
    return [];
  }
  async add(params) {
    this.jobs.push(params);
  }
  clear() {
    this.jobs = [];
  }
  findByQueueName(queueName) {
    return this.jobs.filter((job) => job.queueName === queueName);
  }
  getJobs() {
    return this.jobs;
  }
}
