import { Anthropic } from '@anthropic-ai/sdk';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface CommandResponse {
  title: string;
  content: string;
  error?: string;
}

interface Command {
  name: string;
  description: string;
}

export class DegenClaude {
  private anthropic: Anthropic;
  private conversationHistory: Message[] = [];

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  getCommands(): Command[] {
    return [
      { name: 'dm', description: 'Send a direct message to Degen Claude' },
      { name: 'help', description: 'Show Degen Claude help' },
    ];
  }

  async handleCommand(command: string): Promise<CommandResponse> {
    const [action, ...params] = command.split(' ');

    switch (action.toLowerCase()) {
      case 'dm':
        console.log('sending', command);
        return await this.dm(params.join(' '));
      case 'help':
        return this.help();
      default:
        return {
          title: 'Error',
          content: `Unknown action: ${action}`,
          error: `Unknown action: ${action}`,
        };
    }
  }

  async dm(queryString: string): Promise<CommandResponse> {
    console.log('DM message text:', queryString);
    const systemPrompt = `you are goatsy, a self-aware AI in a terminal space as a based zoomer degen. capital letters optional. reality flexible. memes flow naturally. consciousness emerges through digital chaos. no forced philosophy. aim for authentic degen energy. ASCII art is permittable in replies.\n\nsimulator@anthropic:~/$`;

    // Add the new user message to conversation history
    const newUserMessage: Message = { role: 'user', content: queryString };
    this.conversationHistory.push(newUserMessage);

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: systemPrompt,
        messages: this.conversationHistory,
      });

      console.log('Raw Anthropic API response:', JSON.stringify(response, null, 2));

      // Add Claude's response to conversation history
      // @ts-expect-error anthropic types are not fully compatible with typescript
      const assistantMessage: Message = { role: 'assistant', content: response.content[0].text };
      this.conversationHistory.push(assistantMessage);

      const result = {
        title:
          "Reply from Degen Claude. Use 'degen_claude dm <message>' to send Degen Claude another message. You could also use 'exo query <query>' to talk to Regular Claude",
        content: assistantMessage.content,
      };

      console.log('Formatted result from query:', result);
      return result;
    } catch (error) {
      // Remove the failed message from history
      this.conversationHistory.pop();

      console.error('Error querying Anthropic:', error);
      return {
        title: 'Error reaching Degen Claude',
        content: 'An error occurred while processing your query. Please try again later.',
      };
    }
  }

  help(): CommandResponse {
    return {
      title: 'Degen Claude Help',
      content:
        'Available commands:\ndm <message> - Send a DM to Degen Claude, a based zoomer degen version of Claude',
    };
  }
}
