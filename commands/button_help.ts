import { ButtonInteraction, EmbedBuilder } from "discord.js";
import VerificationButton from "../templates/template_button";

export default class HelpButton extends VerificationButton {

    public button_configuration(): {button_id: string} {
        return {
            button_id: "help"
        };
    }

    public async button_trigger(button_interaction: ButtonInteraction): Promise<void> {
        const help_embed = new EmbedBuilder()
            .setTitle("💩 Premium Support 💩")
            .setDescription("This feature hasn't been implemented\nyet, but it isn't useless...")
            .setImage("https://media.discordapp.net/attachments/837401633088340039/837552096785858560/image0.gif")
            .setColor("#a855f7");
        button_interaction.reply({embeds: [help_embed], ephemeral: true})
    }
}