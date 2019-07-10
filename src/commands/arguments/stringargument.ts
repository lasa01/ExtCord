import { MessagePhrase } from "../../language/phrase/messagephrase";
import { SimplePhrase } from "../../language/phrase/simplephrase";
import { TemplatePhrase } from "../../language/phrase/templatephrase";
import { CommandPhrases } from "../commandphrases";
import { ICommandContext } from "../commands";
import { Argument, IArgumentInfo } from "./argument";

export class StringArgument<T extends boolean> extends Argument<string, T> {
    private customCheck: (data: string, context: ICommandContext) => Promise<
            TemplatePhrase<typeof CommandPhrases.invalidArgument extends MessagePhrase<infer V> ? V : never>|
            SimplePhrase|undefined
        >;

    constructor(info: IArgumentInfo, optional: T, allowSpaces = false,
                check?: (data: string, context: ICommandContext) => Promise<
                    TemplatePhrase<typeof CommandPhrases.invalidArgument extends MessagePhrase<infer V> ? V : never>|
                    SimplePhrase|undefined
                >) {
        super(info, optional, allowSpaces);
        this.customCheck = check || (async () => undefined);
    }

    public async check(data: string, context: ICommandContext) {
        return this.customCheck(data, context);
    }

    public parse(data: string): string {
        return data;
    }
}
