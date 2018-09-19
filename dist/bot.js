"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = __importDefault(require("discord.js"));
const winston_1 = __importDefault(require("winston"));
const config_1 = __importDefault(require("./config/config"));
const modules_1 = __importDefault(require("./modules/modules"));
class Bot {
    constructor(configFile) {
        this.config = new config_1.default(this, configFile);
        this.logger = winston_1.default.createLogger({
            format: winston_1.default.format.cli(),
            transports: [
                new winston_1.default.transports.Console(),
                new winston_1.default.transports.File({ filename: "bot.log" }),
            ],
        });
        this.modules = new modules_1.default(this);
        this.client = new discord_js_1.default.Client();
    }
}
exports.default = Bot;
//# sourceMappingURL=bot.js.map