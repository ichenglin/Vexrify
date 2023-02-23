import { CommandInteraction, SlashCommandBuilder } from "discord.js";

export default class VerificationCommand {

    public command_configuration(): SlashCommandBuilder {
        return new SlashCommandBuilder()
        .setName("example")
        .setDescription("Default command description");
    }

    public async command_trigger(command_interaction: CommandInteraction): Promise<void> {
        await command_interaction.reply("Example command executed.");
    }

}