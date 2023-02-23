import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import VerificationCommand from "../templates/template_command";

export default class VerifyCommand extends VerificationCommand {

    public command_configuration(): SlashCommandBuilder {
        return new SlashCommandBuilder()
        .setName("verify")
        .setDescription("Generates an embed with verification instructions.");
    }

    public async command_trigger(command_interaction: CommandInteraction): Promise<void> {
        const verify_embed = new EmbedBuilder()
            .setTitle(":lock: Identity Verification :lock:")
            .setDescription(`Welcome to **${command_interaction.guild?.name}**! Click the button below to **complete the verification** and gain access to the rest of the server.`)
            .setImage("https://kinsta.com/wp-content/uploads/2016/11/ssl-check-1.png")
            .setColor("#84cc16");
        const verify_components = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
            .setCustomId("apply")
            .setLabel("Verify")
            .setStyle(ButtonStyle.Success)
            .setEmoji("🔗"),
            new ButtonBuilder()
            .setCustomId("help")
            .setLabel("Need Help?")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🖐️")
        );
        await command_interaction.reply({embeds: [verify_embed], components: [verify_components]});
    }

}