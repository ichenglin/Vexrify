import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import VerificationCommand from "../templates/template_command";

export default class PingCommand extends VerificationCommand {

    public command_configuration(): SlashCommandBuilder {
        return new SlashCommandBuilder()
        .setName("ping")
        .setDescription("ping-pong!");
    }

    public async command_trigger(command_interaction: CommandInteraction): Promise<void> {
        await command_interaction.reply("Pong!");
    }

}