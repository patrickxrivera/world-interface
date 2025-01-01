import { TweetV2, UserV2 } from 'twitter-api-v2';
import { Tweet, ProcessedTweet } from '../types/twitter';

export function formatTweet(tweet: Tweet): string {
  console.log({ tweet });
  const metrics = tweet?.metrics ?? {
    retweets: 0,
    replies: 0,
    likes: 0,
    impressions: 0,
  };

  const tweetText = tweet.noteTweet?.text || tweet.text;

  return `${tweet.id} (@${tweet?.author?.username}): ${tweetText} // Replies: ${metrics.replies}, Likes: ${metrics.likes}, Retweets: ${metrics.retweets}, Views: ${metrics.impressions}\n`;
}

export function processTweets(
  tweets: TweetV2[],
  includes?: { users?: UserV2[] },
): ProcessedTweet[] {
  return tweets.map((tweet) => {
    const author = includes?.users?.find((user) => user.id === tweet.author_id);

    return {
      id: tweet.id,
      text: tweet.text,
      noteTweet: {
        text: tweet.note_tweet?.text,
      },
      author: {
        id: tweet.author_id!,
        username: author?.username,
      },
      createdAt: tweet.created_at ? new Date(tweet.created_at) : null,
      metrics: {
        retweets: tweet.public_metrics?.retweet_count ?? 0,
        replies: tweet.public_metrics?.reply_count ?? 0,
        likes: tweet.public_metrics?.like_count ?? 0,
        impressions: tweet.public_metrics?.impression_count ?? 0,
      },
    };
  });
}
