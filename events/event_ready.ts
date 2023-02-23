import { Client } from "discord.js";
import Logger from "../objects/logger";
import VerificationEvent from "../templates/template_event";

export default class ReadyEvent extends VerificationEvent {

    public event_configuration(): {name: string} {
        return {
            name: "ready"
        };
    }

    public async event_trigger(client: Client): Promise<void> {
        Logger.send_log("Verification bot is now online.");
    }

}