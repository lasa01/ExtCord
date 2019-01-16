import Readline from "readline";

import Winston from "winston";

import Config from "./config/config";
import ConfigEntryGroup from "./config/entry/entrygroup";
import NumberConfigEntry from "./config/entry/numberentry";
import StringConfigEntry from "./config/entry/stringentry";

import Database from "./database/database";
import MemberPermissionEntity from "./permissions/database/memberpermissionentity";
import Permissions from "./permissions/permissions";

const log = Winston.createLogger({
    format: Winston.format.cli(),
    level: "silly",
    transports: [
        new Winston.transports.Console(),
    ],
});

const tests: {
    [key: string]: () => Promise<any>;
} = {
    config: testConfig,
    database: testDatabase,
};

async function testConfig() {
    // Test config
    const config = new Config(log);

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
        config.register(entry);
    }

    while (config.hasNext()) {
        log.info(`Loaded stage: ${(await config.loadNext("configtest.hjson")).toString()}`);
        for (const entry of entries) {
            const lines = entry.print().split("\n");
            lines.forEach((line) => log.info("    " + line));
        }
    }
}

async function testDatabase() {
    // Test database
    const database = new Database(log);
    Config.registerDatabase(database);
    Permissions.registerDatabase(database);

    await database.connect({
        database: "bottest.sqlite",
        type: "sqlite",
    });

    const gRepo = database.repos.guild!;
    const uRepo = database.repos.user!;
    const mRepo = database.repos.member!;

    log.info("Clearing repos");
    await mRepo.clear();
    await gRepo.clear();
    await uRepo.clear();

    log.info("Creating a guild and an user");
    const guild = await gRepo.create({
        id: "testg",
        name: "guild",
    });

    const user = await uRepo.create({
        discriminator: "4123",
        id: "testu",
        username: "user",
    });

    log.info("saving");
    await gRepo.save(guild);
    await uRepo.save(user);

    log.info("Creating a member");
    const member = mRepo.create({
        nickname: "member",
    });
    member.guild = guild;
    member.user = user;

    log.info("Saving member");
    await mRepo.save(member);

    const pRepo = database.connection!.getRepository(MemberPermissionEntity);
    log.info("Testing permissions");
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

    log.info("Saving permissions");
    await pRepo.save([perm, perm2]);
}

const readline = Readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

readline.question(`Select tests: (${[...Object.keys(tests), "all"].join(", ")}): `, async (answer) => {
    log.info("Performing tests");
    if (answer === "all") {
        for (const test of Object.values(tests)) {
            try {
                await test();
            } catch (e) {
                log.error(`Test failed: ${e}`);
            }
        }
    } else if (tests[answer]) {
        try {
            await tests[answer]();
        } catch (e) {
            log.error(`Test failed: ${e}`);
        }
    } else {
        log.error("Test not found");
    }
    readline.close();
});
