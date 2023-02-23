import { BaseInteraction } from "discord.js";
import { verification_registry } from "..";
import Logger from "../objects/logger";
import VerificationEvent from "../templates/template_event";

export default class InteractionCreateEvent extends VerificationEvent {

    public event_configuration(): {name: string} {
        return {
            name: "interactionCreate"
        };
    }

    public async event_trigger(interaction: BaseInteraction): Promise<void> {
        try {
            if      (interaction.isChatInputCommand()) await verification_registry.command_trigger(interaction);
            else if (interaction.isButton())           await verification_registry.button_trigger(interaction);
            else if (interaction.isModalSubmit())      await verification_registry.modal_trigger(interaction);
        } catch (error) {
            Logger.send_log("An error has occured in event triggers.");
        }
    }

}