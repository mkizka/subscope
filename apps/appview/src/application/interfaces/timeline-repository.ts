export interface TimelinePost {
  uri: string;
  sortAt: Date;
}

export interface ITimelineRepository {
  findPosts: (params: {
    authDid: string;
    limit: number;
    cursor?: Date;
  }) => Promise<TimelinePost[]>;
}
