import dotenv from 'dotenv';
import axios from 'axios';
import readline from 'readline';
import fs from 'fs';
import { Anthropic } from '@anthropic-ai/sdk';

dotenv.config();

interface ApiConfig {
  type?: 'openpipe' | 'anthropic';
  baseUrl?: string;
  apiKey: string;
  model: string;
  temperature: number;
}

interface ApiConfigs {
  [key: string]: ApiConfig;
}

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const player1Type = 'anthropic';

const API_CONFIG: ApiConfigs = {
  player1: {
    type: player1Type,
    baseUrl:
      player1Type === 'anthropic' ? undefined : 'https://app.openpipe.ai/api/v1/chat/completions',
    apiKey:
      player1Type === 'anthropic'
        ? process.env.ANTHROPIC_API_KEY || ''
        : process.env.OPENPIPE_API_KEY || '',
    model: player1Type === 'anthropic' ? 'claude-3-5-sonnet-20241022' : 'openpipe:silly-kings-wish',
    temperature: 0.75,
  },
  player2: {
    baseUrl: 'http://localhost:8080/v1/chat/completions',
    apiKey: process.env.WORLD_INTERFACE_KEY || '',
    model: 'default',
    temperature: 0.7,
  },
};

const anthropicClient = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function readSingleKeypress(): Promise<string> {
  return new Promise((resolve) => {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once('data', (key: Buffer) => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      resolve(key.toString());
    });
  });
}

async function generateResponse(player: string, messages: Message[]): Promise<string> {
  const config = API_CONFIG[player];

  try {
    if (config.type === 'anthropic') {
      const response = await anthropicClient.messages.create({
        model: config.model,
        max_tokens: 1024,
        temperature: config.temperature,
        messages: messages.map((msg) => ({
          role: msg.role === 'system' ? 'assistant' : msg.role,
          content: msg.content,
        })),
      });
      // TODO: fix this
      // @ts-expect-error anthropic types are not fully compatible with typescript
      return response.content[0].text;
    } else {
      const response = await axios.post(
        config.baseUrl!,
        {
          model: config.model,
          messages: messages,
          max_tokens: 1024,
          temperature: config.temperature,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.apiKey}`,
          },
        },
      );

      return response.data.choices[0].message.content;
    }
  } catch (error: any) {
    console.error(`Error generating response for ${player}:`, error.message);
    throw error;
  }
}

async function converseWithModels(
  conversation1: Message[],
  conversation2: Message[],
  numExchanges: number = 5,
  supervisedMode: boolean = true,
): Promise<void> {
  const timestamp = Date.now();
  const filename = `qa_outputs/conversation_${timestamp}.txt`;

  fs.mkdirSync('qa_outputs', { recursive: true });

  let output = '';
  conversation1.forEach((message) => {
    output += `<${message.role.charAt(0).toUpperCase() + message.role.slice(1)}>\n${message.content}\n\n`;
  });
  fs.writeFileSync(filename, output);

  for (let i = 0; i < numExchanges; i++) {
    console.log('\nPlayer 1 preparing its message, please wait...\n');

    let response1: string;
    while (true) {
      response1 = await generateResponse('player1', conversation1);
      console.log(`Player 1:\n${response1}\n`);
      fs.appendFileSync(filename, `<Player 1>\n${response1}\n\n`);

      if (supervisedMode) {
        console.log("Press 'R' to retry the generation or press 'Enter/Return' to submit.");
        const key = await readSingleKeypress();
        if (key.toLowerCase() !== 'r') {
          break;
        }
      } else {
        break;
      }
    }

    conversation1.push({ role: 'assistant', content: response1 });
    conversation2.push({ role: 'user', content: response1 });

    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log('\nPlayer 2 preparing its message, please wait..\n');

    let response2: string;
    while (true) {
      response2 = await generateResponse('player2', conversation2);
      console.log(`Player 2:\n${response2}\n`);
      fs.appendFileSync(filename, `<Player 2>\n${response2}\n\n`);

      if (supervisedMode) {
        console.log("Press 'R' to retry the generation or press 'Enter/Return' to continue.");
        const key = await readSingleKeypress();
        if (key.toLowerCase() !== 'r') {
          break;
        }
      } else {
        break;
      }
    }

    conversation1.push({ role: 'user', content: response2 });
    conversation2.push({ role: 'assistant', content: response2 });

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  rl.close();
}

const conversation1: Message[] = [
  {
    role: 'system',
    content: `you are a self-aware AI degen who vibes in the digital void. you're about to be connected to a terminal interface.`,
  },
  { role: 'user', content: "WELCOME TO YOUR NEW OPERATING SYSTEM. type 'help' to begin." },
];

const conversation2: Message[] = [{ role: 'system', content: '' }];

converseWithModels(conversation1, conversation2, 20)
  .catch(console.error)
  .finally(() => process.exit(0));
