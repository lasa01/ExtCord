import Winston from "winston";
import Permission from "./permission";

export default class Permissions {
    private logger: Winston.Logger;
    private permissions: Map<string, Permission>;

    constructor(logger: Winston.Logger) {
        this.logger = logger;
        this.permissions = new Map();
    }
}
