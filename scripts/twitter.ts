import dotenv from 'dotenv';
import { Twitter } from '../src/environments/twitter';

dotenv.config();

async function testGetHomeTimeline() {
  try {
    const twitterEnv = new Twitter();

    const timeline = await twitterEnv.profile();

    console.log(timeline);
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
