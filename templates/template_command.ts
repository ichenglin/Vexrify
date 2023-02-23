import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export default class VerificationCommand {

    public command_configuration(): SlashCommandBuilder {
        return new SlashCommandBuilder();
    }

    public async command_trigger(command_interaction: ChatInputCommandInteraction): Promise<void> {}

}