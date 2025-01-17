import { TweetV2, UserV2 } from 'twitter-api-v2';
import { Tweet, ProcessedTweet } from '../types/twitter';

export function formatTweet(tweet: Tweet): string {
  const metrics = tweet?.metrics ?? {
    retweets: 0,
    replies: 0,
    likes: 0,
    impressions: 0,
  };

  const tweetText = tweet.noteTweet?.text || tweet.text;

  const retweet = tweet.referencedTweets?.find((rt) => rt.type === 'retweeted');

  if (retweet) {
    if (!tweetText)
      return `${tweet.id} (@${tweet?.author?.username}): RT ${retweet.id} // No text available\n`;

    return `${tweet.id} (@${tweet?.author?.username}): RT ${retweet.id} (@${tweetText.split('@')[1].split(':')[0]}): ${tweetText.substring(3)} // Replies: ${metrics.replies}, Likes: ${metrics.likes}, Retweets: ${metrics.retweets}, Views: ${metrics.impressions}\n`;
  }

  const quoteTweet = tweet.referencedTweets?.find((qt) => qt.type === 'quoted');

  if (quoteTweet) {
    return `${tweet.id} (@${tweet?.author?.username}): ${tweetText} [QT: ${quoteTweet.id}] // Replies: ${metrics.replies}, Likes: ${metrics.likes}, Retweets: ${metrics.retweets}, Views: ${metrics.impressions}\n`;
  }

  return `${tweet.id} (@${tweet?.author?.username}): ${tweetText} // Replies: ${metrics.replies}, Likes: ${metrics.likes}, Retweets: ${metrics.retweets}, Views: ${metrics.impressions}\n`;
}

export function processTweets(
  tweets: TweetV2[],
  includes?: { users?: UserV2[] },
): ProcessedTweet[] {
  return tweets.map((tweet) => {
    const author = includes?.users?.find((user) => user.id === tweet.author_id);
    console.log(tweet);
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
      referencedTweets: tweet.referenced_tweets,
      conversationId: tweet.conversation_id,
    };
  });
}
