export interface TimelinePost {
  uri: string;
  sortAt: Date;
}

export interface ITimelineRepository {
  findPosts: (params: {
    authDid: string;
    cursor?: Date;
    limit: number;
  }) => Promise<TimelinePost[]>;
}
