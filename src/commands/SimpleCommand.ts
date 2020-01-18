import { PermissionPrivilege } from "../permissions/PermissionPrivilege";
import { Argument } from "./arguments/Argument";
import { Command, ICommandInfo, IExecutionContext } from "./Command";

export class SimpleCommand<T extends ReadonlyArray<Argument<any, boolean, any>>> extends Command<T> {
    public execute: (context: IExecutionContext<T>) => Promise<void>;

    constructor(info: ICommandInfo, args: T, execute: (context: IExecutionContext<T>) => Promise<void>) {
        super(info, args);
        this.execute = execute;
    }
}
