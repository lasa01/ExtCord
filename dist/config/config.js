"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const fs_1 = require("fs");
const json5_1 = __importDefault(require("json5"));
class Config extends events_1.EventEmitter {
    constructor(bot, fileName) {
        super();
        this.bot = bot;
        this.fileName = fileName;
        this.entries = new Map();
        this.stages = [];
    }
    register(entry) {
        this.entries.set(entry.name, entry);
        if (!this.stages.includes(entry.loadStage)) {
            this.stages.push(entry.loadStage);
        }
    }
    async load(stage) {
        if (!this.stages.includes(stage)) {
            this.bot.logger.warn("Trying to load a config stage that doesn't exist, skipping...");
            return;
        }
        let content;
        let parsed;
        try {
            content = await fs_1.promises.readFile(this.fileName, "utf8");
            parsed = json5_1.default.parse(content);
        }
        catch (_a) {
            content = "";
            parsed = {};
        }
        let updated = false;
        for (const [name, entry] of this.entries) {
            if (entry.loadStage !== stage) {
                continue;
            }
            let b;
            [b, parsed[name]] = entry.validate(parsed[name]);
            if (b) {
                updated = true;
            }
        }
        if (updated) {
            content = json5_1.default.stringify(parsed, undefined, 4);
            await fs_1.promises.writeFile(this.fileName, content);
        }
        for (const [name, entry] of this.entries) {
            if (entry.loadStage !== stage) {
                continue;
            }
            entry.parse(parsed[name]);
            entry.emit("loaded");
        }
        this.emit("loaded", stage);
    }
}
exports.default = Config;
//# sourceMappingURL=config.js.map