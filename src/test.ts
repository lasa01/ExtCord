import { createInterface } from "readline";

import { Config } from "./config/Config";
import { ConfigEntryGroup } from "./config/entry/ConfigEntryGroup";
import { NumberConfigEntry } from "./config/entry/NumberConfigEntry";
import { StringConfigEntry } from "./config/entry/StringConfigEntry";

import { Database } from "./database/Database";
import { MemberPermissionEntity } from "./permissions/database/MemberPermissionEntity";
import { Permissions } from "./permissions/Permissions";
import { Logger } from "./util/Logger";

Logger.initialize(3);

/**
 * @ignore
 */
const tests: {
    [key: string]: () => Promise<any>;
} = {
    config: testConfig,
    database: testDatabase,
};

/**
 * @ignore
 */
async function testConfig() {
    // Test config
    const config = new Config("configtest.hjson");

    const entries = [
        new StringConfigEntry({ name: "early", description: "This is an early one", loadStage: 0 }, "snail"),
        new StringConfigEntry({ name: "name", description: "The name of the entry" }, "extcord"),
        new ConfigEntryGroup({ name: "nothinggroup", description: "An entry group with nothing in it" }, []),
        new ConfigEntryGroup({ name: "group", description: "An entry group with something in it" }, [
            new StringConfigEntry({ name: "name", description: "The name of the entrygroup" }, "group"),
            new StringConfigEntry({ name: "value", description: "Some value" }, "yes"),
        ]),
        new NumberConfigEntry({ name: "number", description: "A number" }, 10),
        new StringConfigEntry({ name: "later", description: "This is a slower one", loadStage: 2 }, "snail"),
    ];

    for (const entry of entries) {
        config.registerEntry(entry);
    }

    while (config.hasNext()) {
        Logger.info(`Loaded stage: ${(await config.loadNext()).toString()}`);
        for (const entry of entries) {
            const lines = entry.print().split("\n");
            lines.forEach((line) => Logger.info("    " + line));
        }
    }
}

/**
 * @ignore
 */
async function testDatabase() {
    // Test database
    const database: Database = new Database();
    Config.registerDatabase(database);
    const permissions = new Permissions(database);

    await database.connect({
        database: "bottest.sqlite",
        type: "sqlite",
    });

    database.ensureConnection();

    const gRepo = database.repos.guild;
    const uRepo = database.repos.user;
    const mRepo = database.repos.member;

    Logger.info("Clearing repos");
    await mRepo.clear();
    await gRepo.clear();
    await uRepo.clear();

    Logger.info("Creating a guild and an user");
    const guild = gRepo.create({
        id: "testg",
        name: "guild",
    });

    const user = uRepo.create({
        discriminator: "4123",
        id: "testu",
        username: "user",
    });

    Logger.info("saving");
    await gRepo.save(guild);
    await uRepo.save(user);

    Logger.info("Creating a member");
    const member = mRepo.create({
        nickname: "member",
    });
    member.guild = guild;
    member.user = user;

    Logger.info("Saving member");
    await mRepo.save(member);

    const pRepo = database.connection.getRepository(MemberPermissionEntity);
    Logger.info("Testing permissions");
    const perm = pRepo.create({
        member,
        name: "test",
        permission: true,
    });
    const perm2 = pRepo.create({
        member,
        name: "test2",
        permission: false,
    });

    Logger.info("Saving permissions");
    await pRepo.save([perm, perm2]);
}

/**
 * @ignore
 */
const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
});

readline.question(`Select tests: (${[...Object.keys(tests), "all"].join(", ")}): `, async (answer) => {
    Logger.info("Performing tests");
    if (answer === "all") {
        for (const test of Object.values(tests)) {
            try {
                await test();
            } catch (e) {
                Logger.error(`Test failed: ${e}`);
            }
        }
    } else if (tests[answer]) {
        try {
            await tests[answer]();
        } catch (e) {
            Logger.error(`Test failed: ${e}`);
        }
    } else {
        Logger.error("Test not found");
    }
    readline.close();
});
