![Commits](https://img.shields.io/github/last-commit/lasa01/extcord.svg)
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Flasa01%2FExtCord.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Flasa01%2FExtCord?ref=badge_shield)
![License](https://img.shields.io/github/license/lasa01/extcord.svg)
![Size](https://img.shields.io/github/languages/code-size/lasa01/extcord.svg)
![Language](https://img.shields.io/github/languages/top/lasa01/extcord.svg)
# ExtCord
A modular Discord bot framework built on top of discord.js using TypeScript.
Requires Node.js 16 or newer.
SQLite and MariaDB/MySQL databases are supported by TypeORM. Other databases supported by TypeORM may also work.

The commands can be invoked with both normal text messages and the new slash command system of Discord.
The resulting bot is highly customizable by users:
the bot owner can configure multiple languages for users to select from,
the prefix used for text commands is configurable by users,
command aliases can be managed by users,
and command permissions can be configured by server owners.

Creating modules for the bot is easy:
translations, permission management and help messages are handled by ExtCord.
Everything is strongly typed, preventing potential errors.

## Status
The project is usable but there may be bugs and unfinished/missing features.
Currently, only one module is implemented, which provides music playing functionality.

## Usage
1. Clone the repository.
2. Run `npm install`. This will install dependencies and build the bot and the included modules.
3. Run `npm start`. This will fail on the first run, but it will create the `config.hjson` file.
4. Configure the bot in `config.hjson`. At a minimum the Discord login token needs to be supplied.
5. Run `npm start` again to start the bot.

## Screenshots
Traditional message-based commands:

![image](https://user-images.githubusercontent.com/3680681/148651429-3461ea88-05fc-4d23-8c29-c79aab4c6ee7.png)

Slash commands:

![image](https://user-images.githubusercontent.com/3680681/148651457-f34ee77e-552a-40b4-aea4-68a0837da539.png)

Command argument verification:

![image](https://user-images.githubusercontent.com/3680681/148651546-0777336d-f043-4ee4-978f-0a8d3b78c31d.png)

## Configuration
The automatically generated `config.hjson` file is the main configuration file.
Comments in the file explain the configuration options.

Available languages are stored in the `languages` directory.
By default, the bot will automatically generate a commented English language file.
This can be copied and translated to support other languages.

The `privileges` directory contains the default permission grants.
`admin.hjson` contains permissions for server administrators,
`everyone.hjson` contains permissions for everyone,
and `host.json` contains permissions for the bot owner (configured in `config.hjson`).

## Modules
Modules can be written in either JavaScript or TypeScript. TypeScript is recommended.

Module files are denoted by a header.
If the module requires additional npm packages, they can be specified as depencencies here
and they will be automatically installed when the bot starts.

Example module in TypeScript (when placed in `src_modules/example.ts`):
```ts
// extcord module
// requires package-name1 package-name2

import { Bot, MessagePhrase, Module, SimpleCommand } from "..";

const pongPhrase = new MessagePhrase(
    {
        description: "Sends a pong!",
        name: "pong",
    },
    // the text message to send when embeds are disabled
    "Pong {name}!",
    // the embed to send normally
    {
        description: "Pong {name}!",
        timestamp: false,
        title: "Pong!",
    },
    // this is used to define arguments passed to the templates above
    // and their descriptions
    {
        name: "Who sent the command",
    },
);

const pongCommand = new SimpleCommand(
    {
        // defines who is permitted to execute this command by default
        allowedPrivileges: ["everyone"],
        author: "author",
        description: "Send a pong!",
        // the default name used when calling the command
        name: "pong",
    },
    // command arguments, this command has no arguments
    [],
    // function to call to execute the command
    async (context) => {
        const name = context.member.member.nickname || "";
        // respond with the phrase defined above, passing name to the templates
        await context.respond(pongPhrase, {
            name,
        });
    },
);

// register the phrase
pongCommand.addPhrases(pongPhrase);

export default class ExampleModule extends Module {
    constructor(bot: Bot) {
        super(bot, "author", "module-name");
        // register the command
        this.registerCommand(pongCommand);
    }
}

```


## License
Copyright (C) 2022 Lassi Säike

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Flasa01%2FExtCord.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Flasa01%2FExtCord?ref=badge_large)
