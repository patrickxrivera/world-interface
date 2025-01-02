import Replicate from 'replicate';

interface Command {
  name: string;
}

interface AvailableCommands {
  [environment: string]: Command[];
}

interface Message {
  role: string;
  content: string;
}

interface CommandResponse {
  processedCommand: string;
  helpText: string | null;
}

export async function preprocessCommand(
  command: string,
  availableCommands: AvailableCommands,
  messages: Message[],
): Promise<CommandResponse> {
  const processedCommand = command.trim().startsWith('help') ? 'help' : command;

  const isValidCommand = checkValidCommand(processedCommand, availableCommands);

  if (isValidCommand) {
    return {
      processedCommand,
      helpText:
        command !== processedCommand ? "Note: Additional text after 'help' was ignored." : null,
    };
  }

  // If the command is invalid, use Replicate to correct it
  const correctedCommand = await correctCommandWithLLM(command, availableCommands, messages);

  return correctedCommand;
}

function checkValidCommand(command: string, availableCommands: AvailableCommands): boolean {
  console.log('Checking command validity:', command);
  const [firstWord, ...rest] = command.split(' ');

  // Check if the first word is a valid environment
  if (availableCommands[firstWord]) {
    const action = rest[0];
    const isValid = availableCommands[firstWord].some((cmd) => cmd.name === action);
    console.log(
      `Command starts with valid environment '${firstWord}', action '${action}' is valid: ${isValid}`,
    );
    return isValid;
  }

  // If it's not a valid environment, check if it's a global command
  const globalCommands = ['help']; // Add any other global commands here
  const isGlobalCommand = globalCommands.includes(firstWord);
  console.log(`Command '${firstWord}' is a valid global command: ${isGlobalCommand}`);

  // If it's not a global command, check if it's a command that belongs to any environment
  if (!isGlobalCommand) {
    const isEnvironmentCommand = Object.values(availableCommands).some((envCommands) =>
      envCommands.some((cmd) => cmd.name === firstWord),
    );
    console.log(
      `Command '${firstWord}' is an environment-specific command without its environment: ${isEnvironmentCommand}`,
    );
    return false; // We return false here because we want to process these commands
  }

  return isGlobalCommand;
}

async function correctCommandWithLLM(
  command: string,
  availableCommands: AvailableCommands,
  messages: Message[],
): Promise<CommandResponse> {
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN || '',
  });

  const systemPrompt = `
    You are a command parser API that MUST ONLY respond with valid JSON in this exact format:
    {"processedCommand": "string", "helpText": "string"}

    Your task is to:
    1. Extract the actual command from user input, removing any conversational text
    2. If the extracted command is invalid, correct it based on the available commands: ${JSON.stringify(availableCommands)}
    3. Return the result as JSON with:
       - processedCommand: the corrected/extracted command
       - helpText: brief explanation of what was changed

    Example 1:
    User: "yo fam, help me out: timeline"
    Response: {"processedCommand": "twitter timeline", "helpText": "Added 'twitter' environment prefix"}

    Example 2:
    User: "hey there! help"
    Response: {"processedCommand": "help", "helpText": "Extracted command from conversational text"}`.trimStart();

  const input = {
    prompt: `
    IMPORTANT: Respond ONLY with a JSON object.
    Input: "${command}"
    Required format: {"processedCommand": "string", "helpText": "string"}`.trimStart(),
    max_tokens: 200,
    temperature: 0,
    system: systemPrompt,
    messages: [...messages.slice(-5), { role: 'user', content: command }],
  };

  try {
    let fullResponse = '';
    for await (const event of replicate.stream('meta/meta-llama-3.1-405b-instruct', { input })) {
      fullResponse += event;
    }

    console.log({
      availableCommands: JSON.stringify(availableCommands),
      userCommand: command,
      fullResponse,
    });

    const parsedResponse = JSON.parse(fullResponse);

    return {
      processedCommand: parsedResponse.processedCommand,
      helpText: parsedResponse.helpText,
    };
  } catch (error) {
    console.error('Error calling Replicate:', error);
    return {
      processedCommand: command,
      helpText: 'Unable to process command. Please try again.',
    };
  }
}
