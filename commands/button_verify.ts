import { ActionRowBuilder, ButtonInteraction, EmbedBuilder, Guild, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import VerificationUser from "../interactions/user";
import VerificationButton from "../templates/template_button";

export default class VerifyButton extends VerificationButton {

    public button_configuration(): {button_id: string} {
        return {
            button_id: "apply"
        };
    }

    public async button_trigger(button_interaction: ButtonInteraction): Promise<void> {
        // check if user is already verified
        if (await VerificationUser.role_has(button_interaction.guild as Guild, "Verified", button_interaction.user)) {
            const verified_embed = new EmbedBuilder()
                .setTitle("⛔ Verification Request Denied ⛔")
                .setDescription(`**You're alreadly verified!** If you believe this is in error, please contact an administrator.`)
                .setColor("#ef4444");
            await button_interaction.reply({embeds: [verified_embed], ephemeral: true});
            return;
        }
        // if not verified, open verification menu
        const verify_modal = new ModalBuilder()
            .setCustomId("application")
            .setTitle("Identity Verification");
        const verify_input_team = new TextInputBuilder()
            .setCustomId("application_team")
            .setLabel("Team ID (Example: 69420A)")
            .setMaxLength(8)
            .setMinLength(2)
            .setStyle(TextInputStyle.Short);
        const verify_input_nick = new TextInputBuilder()
            .setCustomId("application_nick")
            .setLabel("Nickname")
            .setMaxLength(16)
            .setMinLength(1)
            .setStyle(TextInputStyle.Short);
        const verify_input_reason = new TextInputBuilder()
            .setCustomId("application_reason")
            .setLabel("Declare your understanding of Pallas's cat")
            .setRequired(false)
            .setStyle(TextInputStyle.Paragraph);
        verify_modal.addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(verify_input_team),
            new ActionRowBuilder<TextInputBuilder>().addComponents(verify_input_nick),
            new ActionRowBuilder<TextInputBuilder>().addComponents(verify_input_reason)
        );
        await button_interaction.showModal(verify_modal);
    }

}