import { Client, Events } from "discord.js";
import Logger from "../objects/logger";
import VerificationEvent from "../templates/template_event";
import PreProcess from "../objects/preprocess";

export default class ReadyEvent extends VerificationEvent {

    public event_configuration(): {name: string} {
        return {
            name: Events.ClientReady
        };
    }

    public async event_trigger(client: Client): Promise<void> {
        Logger.send_log("The bot is now online.");
        // repeat preprocess
        await this.preprocess_fetch();
        setInterval(this.preprocess_fetch, parseInt(process.env.REDIS_CACHE_LIFESPAN as string) * (1E3));
    }

    public async preprocess_fetch(): Promise<void> {
        await PreProcess.preprocess_event_season();
    }

}