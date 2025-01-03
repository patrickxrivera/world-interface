import { Twitter } from './environments/twitter';
import { Exo } from './environments/exo';
import { Search } from './environments/search';
import { DegenClaude } from './environments/degenClaude';

interface Command {
  name: string;
  description: string;
}

interface Environment {
  getCommands(): Command[];
  handleCommand(command: string, messages: any[]): Promise<CommandResult>;
}

interface CommandResult {
  title: string;
  content: string;
  imageUrl?: string;
  tweet?: string;
}

interface EnvironmentMap {
  [key: string]: Environment;
}

interface CommandMap {
  [key: string]: Command[];
}

export class EnvironmentRegistry {
  private environments: EnvironmentMap;

  constructor() {
    this.environments = {
      twitter: new Twitter(),
      degen_claude: new DegenClaude(),
      exo: new Exo(),
      search: new Search(),
    };
  }

  getEnvironment(name: string): Environment | undefined {
    return this.environments[name.toLowerCase()];
  }

  getEnvironmentNames(): string[] {
    return Object.keys(this.environments);
  }

  getAllCommands(): CommandMap {
    console.log('getting all valid commands');
    const commands: CommandMap = {};
    for (const [envName, env] of Object.entries(this.environments)) {
      commands[envName] = env.getCommands();
    }
    return commands;
  }
}
