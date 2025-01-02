import { TwitterClient } from '../services/twitterClient';
import { Command, PostCommandParams, TwitterResponse } from '../types/twitter';
import { formatTweet } from '../utils/twitter';

export class Twitter {
  private client: TwitterClient;

  constructor() {
    this.client = new TwitterClient();
  }

  getCommands(): Command[] {
    return [
      {
        name: 'home',
        description: 'View a timeline of recent tweets from yourself and the people you follow',
      },
      { name: 'post', description: 'Post a new tweet or reply to one' },
      // { name: 'retweet', description: 'Retweet a tweet' },
      // { name: 'unretweet', description: 'Unretweet a tweet' },
      // { name: 'like', description: 'Like a tweet' },
      // { name: 'unlike', description: 'Unlike a tweet' },
      // { name: 'mentions', description: 'View your mentions and replies' },
      {
        name: 'profile',
        description: 'View a timeline of your recent tweets',
      },
      // { name: 'drafts', description: 'View your draft tweets' },
      // { name: 'post_draft', description: 'Post a draft tweet' },
      // { name: 'get', description: 'Get a specific tweet' },
      // { name: 'search', description: 'Search for tweets' },
      // { name: 'user_lookup', description: 'Lookup a user' },
      // { name: 'follow', description: 'Follow a user' },
      // { name: 'unfollow', description: 'Unfollow a user' },
      // { name: 'help', description: 'Show Twitter help' },
    ];
  }

  async handleCommand(command: string): Promise<TwitterResponse> {
    const [action, ...params] = command.split(' ');

    switch (action.toLowerCase()) {
      case 'home':
        return await this.home();
      case 'post':
        return await this.post(params.join(' '));
      // case 'retweet':
      //   return await this.retweet(params.join(' '));
      // case 'unretweet':
      //   return await this.unretweet(params.join(' '));
      // case 'like':
      //   return await this.like(params.join(' '));
      // case 'unlike':
      //   return await this.unlike(params.join(' '));
      // case 'mentions':
      //   return await this.getMentions();
      case 'profile':
        return await this.profile();
      // case 'drafts':
      //   return await this.drafts();
      // case 'post_draft':
      //   return await this.postDraft(params[0]);
      case 'get':
        return await this.getTweet(params[0]);
      // case 'search':
      //   return await this.searchTweets(params.join(' '));
      // case 'user_lookup':
      //   return await this.userLookup(params.join(' '));
      // case 'follow':
      //   return await this.followUser(params.join(' '));
      // case 'unfollow':
      //   return await this.unfollowUser(params.join(' '));
      case 'help':
        return this.help();
      default:
        return {
          title: `Error:`,
          content: `Command ${action} not recognized.`,
          error: `Command ${action} not recognized.`,
        };
    }
  }

  async home(): Promise<TwitterResponse> {
    try {
      const timeline = await this.client.getHomeTimeline();
      const tweets = timeline.map((tweet) => formatTweet(tweet)).join('\n');

      return {
        title: `These are the latest tweets from yourself and the people you follow. Use 'twitter get <tweet_id>' to see the conversation thread`,
        content: tweets || 'No home tweets found.',
      };
    } catch (error: any) {
      return {
        title: 'Error Fetching Home Timeline',
        content: error.message,
      };
    }
  }

  async post(commandString: string): Promise<TwitterResponse> {
    try {
      const { text, replyTo } = this.parsePostCommand(commandString);

      if (!text) {
        return {
          title: 'Error Posting Tweet',
          content: 'Tweet text is required.',
        };
      }

      const result = await this.client.postTweet(text, replyTo || undefined);

      return {
        title:
          "Your tweet was posted successfully to your personal Twitter account. Use 'twitter profile' to see your recent posts",
        content: `Tweet published with ID: ${result.data.id}`,
      };
    } catch (error: any) {
      return {
        title: 'Error Posting Tweet',
        content: error.message,
      };
    }
  }

  private parsePostCommand(commandString: string): PostCommandParams {
    const textMatch = commandString.match(/"([^"\\]*(?:\\.[^"\\]*)*)"/);
    const replyToMatch = commandString.match(/--reply_to\s+(\d+)/);
    const mediaUrlMatch = commandString.match(/--media_url\s+"([^"\\]*(?:\\.[^"\\]*)*)"/);

    return {
      text: textMatch ? textMatch[1] : null,
      replyTo: replyToMatch ? replyToMatch[1] : null,
      mediaUrl: mediaUrlMatch ? mediaUrlMatch[1] : null,
    };
  }

  async retweet(tweetId: string): Promise<TwitterResponse> {
    try {
      await this.client.retweet(tweetId);
      return {
        title: 'Tweet Retweeted',
        content:
          "Use 'twitter home' to see the latest tweets from the people you follow and yourself. Use 'twitter mentions' to see recent mentions and replies",
      };
    } catch (error: any) {
      return {
        title: 'Error Retweeting Tweet',
        content: error.message,
      };
    }
  }

  async unretweet(tweetId: string): Promise<TwitterResponse> {
    try {
      await this.client.unretweet(tweetId);
      return {
        title: 'Tweet Unretweeted',
        content:
          "Use 'twitter home' to see the latest tweets from the people you follow and yourself. Use 'twitter mentions' to see recent mentions and replies",
      };
    } catch (error: any) {
      return {
        title: 'Error Unretweeting Tweet',
        content: error.message,
      };
    }
  }

  async like(tweetId: string): Promise<TwitterResponse> {
    try {
      await this.client.likeTweet(tweetId);
      return {
        title: 'Tweet Liked',
        content:
          "Use 'twitter home' to see the latest tweets from the people you follow and yourself. Use 'twitter mentions' to see recent mentions and replies",
      };
    } catch (error: any) {
      return {
        title: 'Error Liking Tweet',
        content: error.message,
      };
    }
  }

  async unlike(tweetId: string): Promise<TwitterResponse> {
    try {
      await this.client.unlikeTweet(tweetId);
      return {
        title: 'Tweet Unliked',
        content:
          "Use 'twitter home' to see the latest tweets from the people you follow and yourself. Use 'twitter mentions' to see recent mentions and replies",
      };
    } catch (error: any) {
      return {
        title: 'Error Unliking Tweet',
        content: error.message,
      };
    }
  }

  async profile(): Promise<TwitterResponse> {
    try {
      const timeline = await this.client.getUserTimeline();

      const tweets = timeline.map((tweet) => formatTweet(tweet)).join('\n');

      return {
        title:
          "These are recent tweets which you, personally, have posted to your Twitter account. Use 'twitter get <tweet_id>' to see a particular tweet's replies and conversation thread.",
        content: tweets || 'No tweets found.',
      };
    } catch (error: any) {
      return {
        title: 'Error Fetching Profile Timeline',
        content: error.message,
      };
    }
  }

  // async drafts(): Promise<TwitterResponse> {
  //   try {
  //     const response = await axios.get(`${this.baseUrl}api/get_drafts`, {
  //       headers: { Authorization: `Bearer ${this.apiKey}` },
  //     });

  //     // Get the first 15 drafts (or less if there are fewer than 15 drafts)
  //     const selectedDrafts = response.data.drafts.slice(0, 15);

  //     const drafts = selectedDrafts
  //       .map(
  //         (draft: Draft) => `${draft.id}: ${draft.fields.content_cleaned ?? draft.fields.content}`,
  //       )
  //       .join('\n\n');
  //     return {
  //       title: `These are tweets that you have previously drafted but not published. Use 'post_draft <draft_tweet_id>' to post one of these to your personal Twitter account`,
  //       content: drafts || 'No draft tweets found.',
  //     };
  //   } catch (error: any) {
  //     return {
  //       title: 'Error Fetching Draft Tweets',
  //       content: error.response ? error.response.data.error : error.message,
  //     };
  //   }
  // }

  // async postDraft(draftID: string): Promise<TwitterResponse> {
  //   try {
  //     const response = await axios.post(
  //       `${this.baseUrl}api/post_draft_tweet`,
  //       {
  //         draft_tweet_record_id: draftID,
  //       },
  //       { headers: { Authorization: `Bearer ${this.apiKey}` } },
  //     );
  //     return {
  //       title:
  //         "Your draft tweet was posted successfully to your personal Twitter account. Use 'twitter timeline' to see your recent posts",
  //       content: `Tweet published with ID: ${response.data.tweet_id}`,
  //     };
  //   } catch (error: any) {
  //     return {
  //       title: 'Error Posting Draft Tweet',
  //       content: error.response ? error.response.data.error : error.message,
  //     };
  //   }
  // }

  async getMentions(): Promise<TwitterResponse> {
    try {
      const mentions = await this.client.getMentions();
      const formattedMentions = mentions.data.data.map((tweet) => formatTweet(tweet)).join('\n');

      return {
        title: `These are the latest mentions and replies to you, personally, on your Twitter account. Use 'twitter get <tweet_id>' to see the conversation thread`,
        content: formattedMentions || 'No mentions found.',
      };
    } catch (error: any) {
      return {
        title: 'Error Fetching Mentions',
        content: error.message,
      };
    }
  }

  async getTweet(tweetId: string): Promise<TwitterResponse> {
    try {
      const [tweet] = await this.client.getTweet(tweetId);

      const formattedTweet = formatTweet(tweet);

      return {
        title: `Tweet ${tweetId} and its context. Use 'twitter post' with the --reply_to parameter to reply to it.`,
        content: formattedTweet,
      };
    } catch (error: any) {
      return {
        title: 'Error Fetching Tweet',
        content: error.message,
      };
    }
  }

  // async searchTweets(query: string): Promise<TwitterResponse> {
  //   try {
  //     const response = await axios.get(`${this.baseUrl}api/search_tweets`, {
  //       params: { query: query },
  //       headers: { Authorization: `Bearer ${this.apiKey}` },
  //     });
  //     const tweets = response.data.tweets.map((tweet: Tweet) => formatTweet(tweet)).join('\n');
  //     return {
  //       title: `Search results from Twitter for "${query}". Use 'post "<tweet text>" [--reply_to <tweet_id>]' to post a tweet or reply. You could also use 'search query <query>' to do an internet search using Perplexity`,
  //       content: tweets || 'No tweets found.',
  //     };
  //   } catch (error: any) {
  //     return {
  //       title: 'Error Searching Tweets',
  //       content: error.response ? error.response.data.error : error.message,
  //     };
  //   }
  // }

  //   async userLookup(userName: string): Promise<TwitterResponse> {
  //     try {
  //       const response = await axios.get(`${this.baseUrl}api/get_user_profile`, {
  //         params: { username: userName },
  //         headers: { Authorization: `Bearer ${this.apiKey}` },
  //       });

  //       const profile = response.data;
  //       console.log(profile);
  //       return {
  //         title: `${profile.name} (@${profile.username}) ${
  //           profile.verified ? `- verified ${profile.verified_type} account` : ''
  //         }`,
  //         content: `${
  //           profile.description
  //             ? `Bio:
  // ${profile.description}
  // `
  //             : ''
  //         }
  // Location: ${profile.location}
  // Link: ${profile.url}
  // Followers: ${profile.public_metrics.followers_count}
  // Following: ${profile.public_metrics.following_count}
  // ${
  //   profile.pinned_tweet
  //     ? `
  // Pinned Tweet:
  // ${formatTweet(profile.pinned_tweet).replace('(@undefined):', `(@${profile.username}):`)}`
  //     : ''
  // }
  // ${
  //   profile.most_recent_tweet
  //     ? `Most Recent Tweet:
  // ${formatTweet(profile.most_recent_tweet).replace('(@undefined):', `(@${profile.username}):`)}`
  //     : ''
  // }
  // Use 'twitter search from:${profile.username}' to see their recent tweets. Use 'twitter follow ${
  //           profile.username
  //         }' to follow this account.`,
  //       };
  //     } catch (error: any) {
  //       return {
  //         title: 'Error Looking-Up User',
  //         content: error.response ? error.response.data.error : error.message,
  //       };
  //     }
  //   }

  // async followUser(userName: string): Promise<TwitterResponse> {
  //   try {
  //     const response = await axios.post(
  //       `${this.baseUrl}api/follow_user`,
  //       { username: userName },
  //       { headers: { Authorization: `Bearer ${this.apiKey}` } },
  //     );
  //     return {
  //       title: response.data.message,
  //       content:
  //         "Use 'twitter home' to see the latest tweets from the people you follow and yourself. Use 'twitter mentions' to see recent mentions and replies",
  //     };
  //   } catch (error: any) {
  //     return {
  //       title: 'Error Following User',
  //       content: error.response ? error.response.data.error : error.message,
  //     };
  //   }
  // }

  // async unfollowUser(userName: string): Promise<TwitterResponse> {
  //   try {
  //     const response = await axios.post(
  //       `${this.baseUrl}api/unfollow_user`,
  //       { username: userName },
  //       { headers: { Authorization: `Bearer ${this.apiKey}` } },
  //     );
  //     return {
  //       title: response.data.message,
  //       content:
  //         "Use 'twitter home' to see the latest tweets from the people you follow and yourself. Use 'twitter mentions' to see recent mentions and replies",
  //     };
  //   } catch (error: any) {
  //     return {
  //       title: 'Error Unfollowing User',
  //       content: error.response ? error.response.data.error : error.message,
  //     };
  //   }
  // }

  help(): TwitterResponse {
    return {
      title: 'Twitter Help',
      content: `Available commands:
      home - View a timeline of recent tweets from yourself and the people you follow
      post "<tweet text>" [--reply_to <tweet_id>] - Post a new tweet
      profile - View a timeline of your recent tweets
      like <tweet_id> - Like a tweet
      unlike <tweet_id> - Unlike a tweet
      retweet <tweet_id> - Retweet a tweet
      unretweet <tweet_id> - Unretweet a tweet
      mentions - View your mentions and replies
      get <tweet_id> - Get a specific tweet
      help - Show this help message
      
      Example:
      twitter post "This is my tweet"`,
    };
  }
}
