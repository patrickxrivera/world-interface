export interface Tweet {
  id: string;
  text?: string;
  noteTweet?: { text?: string };
  author?: { username?: string };
  metrics?: {
    retweets: number;
    replies: number;
    likes: number;
    impressions: number;
  };
}

export interface Command {
  name: string;
  description: string;
}

export interface PostCommandParams {
  text: string | null;
  replyTo: string | null;
  mediaUrl: string | null;
}

export interface TwitterResponse {
  title: string;
  content: string;
  error?: string;
}

// interface Draft {
//   id: string;
//   fields: {
//     content_cleaned?: string;
//     content: string;
//   };
// }

export interface ProcessedTweet {
  id: string;
  text: string;
  noteTweet?: { text?: string };
  author: { id: string; username?: string };
  authorUsername?: string;
  createdAt: Date | null;
  metrics: {
    retweets: number;
    replies: number;
    likes: number;
    impressions: number;
  };
}
