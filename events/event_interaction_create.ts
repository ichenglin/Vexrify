import { BaseInteraction } from "discord.js";
import { verification_registry } from "..";
import VerificationEvent from "../templates/template_event";

export default class InteractionCreateEvent extends VerificationEvent {

    public event_configuration(): {name: string} {
        return {
            name: "interactionCreate"
        };
    }

    public async event_trigger(interaction: BaseInteraction): Promise<void> {
        if (interaction.isCommand()) await verification_registry.command_trigger(interaction);
    }

}