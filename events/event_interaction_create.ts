import { BaseInteraction, ChatInputCommandInteraction, EmbedBuilder, InteractionType } from "discord.js";
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
            Logger.send_log(`Event received in ${Date.now() - interaction.createdTimestamp} ms.`);
            if      (interaction.isChatInputCommand()) await verification_registry.command_trigger(interaction);
            else if (interaction.isButton())           await verification_registry.button_trigger(interaction);
            else if (interaction.isModalSubmit())      await verification_registry.modal_trigger(interaction);
            Logger.send_log(`Event processed in ${Date.now() - interaction.createdTimestamp} ms.`);
        } catch (error) {
            Logger.send_log(`An error has occured in event triggers. (Type=${InteractionType[interaction.type]})`);
            if (interaction.type !== InteractionType.ApplicationCommand) return;
            // report command error
            const interaction_element = (interaction as ChatInputCommandInteraction);
            const failure_embed       = new EmbedBuilder()
                .setTitle("⚠️ Failure ⚠️")
                .setDescription(`An unknown error has occured while peforming the operation, please try again later.`)
                .setColor("#f97316");
            if (interaction_element.deferred) await interaction_element.editReply({embeds: [failure_embed]});
            else                              await interaction_element.reply(    {embeds: [failure_embed]});
        }
    }

}