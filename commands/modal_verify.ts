import { EmbedBuilder, Guild, ModalSubmitInteraction } from "discord.js";
import VerificationUser from "../interactions/user";
import RobotEvent from "../objects/robotevent";
import VerificationModal from "../templates/template_modal";

export default class VerifyModal extends VerificationModal {

    public modal_configuration(): {modal_id: string} {
        return {
            modal_id: "application"
        };
    }

    public async modal_trigger(modal_interaction: ModalSubmitInteraction): Promise<void> {
        await modal_interaction.deferReply({ephemeral: true});
        const form_team_number = modal_interaction.fields.getTextInputValue("application_team");
        const form_user_name   = modal_interaction.fields.getTextInputValue("application_nick");
        // prohibited characters in team number
        if (form_team_number.match(/[^\w\d]/g) !== null) {
            const invalid_embed = new EmbedBuilder()
                .setTitle("⛔ Prohibited Team ID ⛔")
                .setDescription("You are only allowed to use **letters** and **numbers** in team ID!")
                .setColor("#ef4444");
            await modal_interaction.editReply({embeds: [invalid_embed],});
            return;
        }
        // check for valid team id
        const team_data = await RobotEvent.get_team_by_number(form_team_number);
        if (team_data === undefined) {
            // invalid team
            const invalid_embed = new EmbedBuilder()
                .setTitle("⛔ Verification Request Denied ⛔")
                .setDescription(`You have entered an **Invalid Team ID** (${form_team_number})! If you believe this is in error, please contact an administrator.`)
                .setColor("#ef4444");
            await modal_interaction.editReply({embeds: [invalid_embed]});
            return;
        }
        // prohibited characters in name
        if (form_user_name.match(/[^\w\d\s]/g) !== null) {
            const invalid_embed = new EmbedBuilder()
                .setTitle("⛔ Prohibited Nickname ⛔")
                .setDescription("You are only allowed to use **letters**, **numbers**, and **whitespaces** in your nickname!")
                .setColor("#ef4444");
            await modal_interaction.editReply({embeds: [invalid_embed],});
            return;
        }
        // successful reply
        const verified_embed = new EmbedBuilder()
            .setTitle("✅ Verification Request Accepted ✅")
            .setDescription(`Welcome <@${modal_interaction.user.id}>! You are now **verified** and have access to the rest of the server.`)
            .addFields(
                //{name: "\u200B", value: "\u200B"},
                {name: `🏦 ${team_data.team_name} (${team_data.team_number}) 🏦`, value: `**Organization:** ${team_data.team_organization}\n**Country:** ${team_data.team_country}`}
            )
            .setColor("#84cc16");
        // no update nickname permission
        const permission_owner = VerificationUser.permission_owner(modal_interaction.guild as Guild, modal_interaction.user);
        const permission_embed = new EmbedBuilder()
            .setTitle("⚠️ No Permission ⚠️")
            .setDescription(`The verification bot **couldn't edit the guild owner's nickname** due to Discord restrictions, please update your nickname manually. **(Do not report this as a bug)**`)
            .setColor("#f97316");
        await VerificationUser.username_set(modal_interaction.guild as Guild, modal_interaction.user, `${form_user_name} | ${team_data.team_number}`)
        await VerificationUser.role_add(modal_interaction.guild as Guild, "Verified", modal_interaction.user);
        await modal_interaction.editReply({embeds: (!permission_owner ? [verified_embed] : [verified_embed, permission_embed])});
        // save to database
        await VerificationUser.data_add({
            user_id:          modal_interaction.user.id,
            guild_id:         modal_interaction.guild?.id as string,
            user_team_id:     team_data.team_id,
            user_team_number: form_team_number,
            user_name:        form_user_name
        });
    }

}