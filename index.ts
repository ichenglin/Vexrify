import { Client, GatewayIntentBits, REST, Routes } from "discord.js";
import * as dotenv from "dotenv";
import * as FileSystem from "fs";
import mysql from "mysql";
import PingCommand from "./commands/command_ping";
import InteractionCreateEvent from "./events/event_interaction_create";
import ReadyEvent from "./events/event_ready";
import Registry from "./objects/registry";

dotenv.config();

export const database = mysql.createConnection({
    host:     process.env.MYSQL_HOST,
    user:     process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    ssl: {
        ca: FileSystem.readFileSync(process.env.MYSQL_SSL as string),
        rejectUnauthorized: false
    }
});

// registry
const discord_client_registry = new Registry();
discord_client_registry.register(new PingCommand);
discord_client_registry.register(new ReadyEvent);
discord_client_registry.register(new InteractionCreateEvent);

// rest
const discord_rest = new REST({version: "10"});
discord_rest.setToken(process.env.APPLICATION_TOKEN as string);

// client
const discord_client = new Client({intents: [GatewayIntentBits.Guilds]});
for (const event_signature of discord_client_registry.event_signatures()) discord_client.on(event_signature.event_configuration().name, event_signature.event_trigger);

(async () => {
    await discord_rest.put(Routes.applicationCommands(process.env.APPLICATION_ID as string), {body: discord_client_registry.command_signatures()});
    await discord_client.login(process.env.APPLICATION_TOKEN as string);
})();