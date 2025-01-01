import { TwitterApi } from 'twitter-api-v2';
import { processTweets } from '../utils/twitter';
import { ProcessedTweet } from '../types/twitter';

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
    return await this.client.v2.singleTweet(tweetId, {
      expansions: ['author_id', 'referenced_tweets.id'],
      'tweet.fields': ['public_metrics', 'created_at', 'conversation_id'],
    });
  }
}
