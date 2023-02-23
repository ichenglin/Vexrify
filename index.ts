import { Client, GatewayIntentBits, REST, Routes } from "discord.js";
import * as dotenv from "dotenv";
import * as FileSystem from "fs";
import mysql from "mysql";
import VerifyButton from "./commands/button_verify";
import NickCommand from "./commands/command_nick";
import VerifyCommand from "./commands/command_verify";
import VerifyModal from "./commands/modal_verify";
import InteractionCreateEvent from "./events/event_interaction_create";
import ReadyEvent from "./events/event_ready";
import Registry from "./objects/registry";

dotenv.config();

export const verification_database = mysql.createConnection({
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
export const verification_registry = new Registry();
verification_registry.register(new VerifyCommand);
verification_registry.register(new NickCommand);
verification_registry.register(new VerifyButton);
verification_registry.register(new VerifyModal);
verification_registry.register(new ReadyEvent);
verification_registry.register(new InteractionCreateEvent);

// rest
const discord_rest = new REST({version: "10"});
discord_rest.setToken(process.env.APPLICATION_TOKEN as string);

// client
const discord_client = new Client({intents: [GatewayIntentBits.Guilds]});
for (const event_signature of verification_registry.event_signatures()) discord_client.on(event_signature.event_configuration().name, event_signature.event_trigger);

(async () => {
    await discord_rest.put(Routes.applicationCommands(process.env.APPLICATION_ID as string), {body: verification_registry.command_signatures()});
    await discord_client.login(process.env.APPLICATION_TOKEN as string);
})();