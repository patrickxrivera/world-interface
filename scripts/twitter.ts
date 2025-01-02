import dotenv from 'dotenv';
import { Twitter } from '../src/environments/twitter';
// import { TwitterClient } from '../src/services/twitterClient';

dotenv.config();

async function testGetHomeTimeline() {
  try {
    const twitterEnv = new Twitter();

    const tweet = await twitterEnv.getTweet('1874744168985297148');

    console.log({ tweet });

    // const timeline = await twitterEnv.post('"posting from the void"');

    // const twitterClient = new TwitterClient();

    // const res = await twitterClient.getTweetWithThread('1874714172086526296');

    // console.log({ res });

    // console.log(timeline);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test
testGetHomeTimeline()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
