import Winston from "winston";
import Command from "./command";

export default class Commands {
    private logger: Winston.Logger;
    private commands: Map<string, Command>;

    constructor(logger: Winston.Logger) {
        this.logger = logger;
        this.commands = new Map();
    }

    public register(command: Command) {
        if (this.commands.has(command.name)) {
            this.logger.warn(`Multiple commands with the same name detected, renaming "${command.name}"`);
            if (this.commands.has(command.rename())) {
                this.logger.error(`Renaming to ${command.name}" failed, command ignored`);
                return;
            }
        }
        this.commands.set(command.name, command);
    }
}
