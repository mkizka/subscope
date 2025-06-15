export interface TimelinePost {
  uri: string;
  sortAt: Date;
}

export interface ITimelineRepository {
  findPosts: (params: {
    authDid: string;
    before?: Date;
    limit: number;
  }) => Promise<TimelinePost[]>;
}
