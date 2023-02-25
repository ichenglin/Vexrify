import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder, TextChannel } from "discord.js";
import VerificationCommand from "../templates/template_command";

export default class VerifyCommand extends VerificationCommand {

    public command_configuration(): SlashCommandBuilder {
        return new SlashCommandBuilder()
        .setName("verify")
        .setDescription("Generates an embed with verification instructions.")
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);
    }

    public async command_trigger(command_interaction: ChatInputCommandInteraction): Promise<void> {
        await command_interaction.deferReply();
        const verify_embed = new EmbedBuilder()
            .setTitle("🔒 Identity Verification 🔒")
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
        await command_interaction.deleteReply();
        await (command_interaction.channel as TextChannel).send({embeds: [verify_embed], components: [verify_components]});
    }

}