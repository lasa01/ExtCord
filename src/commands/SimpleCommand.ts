import { PermissionPrivilege } from "../permissions/PermissionPrivilege";
import { Argument } from "./arguments/Argument";
import { Command, ICommandInfo, IExecutionContext } from "./Command";

/**
 * A simple command with arguments and specified execution function.
 * @category Command
 */
export class SimpleCommand<T extends ReadonlyArray<Argument<any, boolean, any>>> extends Command<T> {
    public execute: (context: IExecutionContext<T>) => Promise<void>;

    /**
     * Creates a new simple command.
     * @param info Defines basic command parameters.
     * @param args Defines arguments for the command.
     * @param execute Defines the execution function of the command.
     */
    constructor(info: ICommandInfo, args: T, execute: (context: IExecutionContext<T>) => Promise<void>) {
        super(info, args);
        this.execute = execute;
    }
}
