import Winston from "winston";

export default class Commands {
    private logger: Winston.Logger;

    constructor(logger: Winston.Logger) {
        this.logger = logger;
    }
}
