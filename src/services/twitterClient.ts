import { TwitterApi } from 'twitter-api-v2';
import { processTweets } from '../utils/twitter';
import { ProcessedTweet, TweetThread } from '../types/twitter';

export class TwitterClient {
  private client: TwitterApi;
  private username: string;

  constructor() {
    this.client = new TwitterApi({
      // @ts-expect-error twitter-api-v2 types are incorrect
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    });

    this.username = process.env.TWITTER_USERNAME || '';
  }

  async getHomeTimeline(): Promise<ProcessedTweet[]> {
    const timeline = await this.client.v2.homeTimeline({
      expansions: ['author_id'],
      'tweet.fields': ['public_metrics', 'created_at'],
      'user.fields': ['username'],
    });
    return processTweets(timeline.tweets, timeline.includes);
  }

  async postTweet(text: string, replyTo?: string) {
    return await this.client.v2.tweet({
      text,
      reply: replyTo ? { in_reply_to_tweet_id: replyTo } : undefined,
    });
  }

  async getUserTimeline(): Promise<ProcessedTweet[]> {
    const user = await this.client.v2.userByUsername(this.username);

    const timeline = await this.client.v2.userTimeline(user.data.id, {
      expansions: ['author_id'],
      'tweet.fields': ['public_metrics', 'created_at', 'conversation_id'],
      'user.fields': ['username'],
    });

    return processTweets(timeline.tweets, timeline.includes);
  }

  async likeTweet(tweetId: string) {
    const user = await this.client.v2.userByUsername(this.username);
    return await this.client.v2.like(user.data.id, tweetId);
  }

  async unlikeTweet(tweetId: string) {
    const user = await this.client.v2.userByUsername(this.username);
    return await this.client.v2.unlike(user.data.id, tweetId);
  }

  async retweet(tweetId: string) {
    const user = await this.client.v2.userByUsername(this.username);
    return await this.client.v2.retweet(user.data.id, tweetId);
  }

  async unretweet(tweetId: string) {
    const user = await this.client.v2.userByUsername(this.username);
    return await this.client.v2.unretweet(user.data.id, tweetId);
  }

  async getMentions() {
    const user = await this.client.v2.userByUsername(this.username);
    return await this.client.v2.userMentionTimeline(user.data.id, {
      'tweet.fields': ['public_metrics', 'created_at'],
    });
  }

  async getTweet(tweetId: string) {
    const tweet = await this.client.v2.singleTweet(tweetId, {
      expansions: ['author_id', 'referenced_tweets.id'],
      'tweet.fields': ['public_metrics', 'created_at', 'conversation_id'],
      'user.fields': ['username'],
    });

    return processTweets([tweet.data], tweet.includes);
  }

  async getTweetWithThread(tweetId: string): Promise<TweetThread | null> {
    const initialTweet = await this.client.v2.singleTweet(tweetId, {
      expansions: ['author_id', 'referenced_tweets.id'],
      'tweet.fields': ['public_metrics', 'created_at', 'conversation_id', 'referenced_tweets'],
      'user.fields': ['username'],
    });

    if (!initialTweet.data.conversation_id) {
      return null;
    }

    const allTweets = [];
    let conversation = await this.client.v2.search(
      `conversation_id:${initialTweet.data.conversation_id}`,
      {
        expansions: ['author_id', 'referenced_tweets.id'],
        'tweet.fields': ['public_metrics', 'created_at', 'conversation_id', 'referenced_tweets'],
        'user.fields': ['username'],
        max_results: 100,
      },
    );

    allTweets.push(...conversation.tweets);

    while (conversation.meta.next_token) {
      const nextPage = await this.client.v2.search(
        `conversation_id:${initialTweet.data.conversation_id}`,
        {
          expansions: ['author_id', 'referenced_tweets.id'],
          'tweet.fields': ['public_metrics', 'created_at', 'conversation_id', 'referenced_tweets'],
          'user.fields': ['username'],
          max_results: 100,
          next_token: conversation.meta.next_token,
        },
      );
      allTweets.push(...nextPage.tweets);
      conversation = nextPage;
    }

    const thread = processTweets(allTweets, conversation.includes);

    // NOTE: requestedTweet is the same as initialTweet, but processed
    const [requestedTweet] = processTweets([initialTweet.data], initialTweet.includes);

    if (!requestedTweet) {
      return null;
    }

    const ancestorChain = this.buildAncestorChain(requestedTweet, thread);
    const siblingTweets = this.getSiblingTweets(requestedTweet, thread);
    const childrenTweets = this.getChildrenTweets(requestedTweet, thread);

    return {
      requestedTweet,
      rootTweet: ancestorChain[0] || requestedTweet,
      ancestorChain,
      siblingTweets,
      childrenTweets,
    };
  }

  private buildAncestorChain(tweet: ProcessedTweet, thread: ProcessedTweet[]): ProcessedTweet[] {
    const chain: ProcessedTweet[] = [];
    let currentTweet = tweet;

    while (true) {
      const parentId = this.getParentTweetId(currentTweet);
      if (!parentId) break;

      const parentTweet = thread.find((t) => t.id === parentId);
      if (!parentTweet) break;

      chain.unshift(parentTweet);
      currentTweet = parentTweet;
    }

    return chain;
  }

  private getSiblingTweets(tweet: ProcessedTweet, thread: ProcessedTweet[]): ProcessedTweet[] {
    const parentId = this.getParentTweetId(tweet);
    if (!parentId) return [];

    return thread
      .filter((t) => this.getParentTweetId(t) === parentId && t.id !== tweet.id)
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateA - dateB;
      });
  }

  private getChildrenTweets(tweet: ProcessedTweet, thread: ProcessedTweet[]): ProcessedTweet[] {
    return thread
      .filter((t) => this.getParentTweetId(t) === tweet.id)
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateA - dateB;
      });
  }

  private getParentTweetId(tweet: ProcessedTweet): string | null {
    if (!tweet.referencedTweets) return null;

    const repliedTo = tweet.referencedTweets.find((ref) => ref.type === 'replied_to');
    return repliedTo ? repliedTo.id : null;
  }
}
