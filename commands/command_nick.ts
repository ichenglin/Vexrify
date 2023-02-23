import { ChatInputCommandInteraction, EmbedBuilder, Guild, SlashCommandBuilder } from "discord.js";
import VerificationUser from "../interactions/user";
import VerificationCommand from "../templates/template_command";

export default class NickCommand extends VerificationCommand {

    public command_configuration(): SlashCommandBuilder {
        const command_builder = new SlashCommandBuilder()
            .setName("nick")
            .setDescription("Updates the nickname of verified user.");
        command_builder.addStringOption(option => option
            .setName("nickname")
            .setDescription("The new nickname of the user.")
            .setMaxLength(16)
            .setRequired(true)
        );
        return command_builder;
    }

    public async command_trigger(command_interaction: ChatInputCommandInteraction): Promise<void> {
        await command_interaction.deferReply({ephemeral: true});
        const user_data = await VerificationUser.data_get(command_interaction.user.id, command_interaction.guild?.id as string);
        if (user_data === undefined) {
            // user not verified
            const permission_embed = new EmbedBuilder()
                .setTitle("⛔ Verification Required ⛔")
                .setDescription(`**You are not verified!** If you believe this is in error, please contact an administrator.`)
                .setColor("#ef4444");
            await command_interaction.editReply({embeds: [permission_embed],});
            return;
        }
        const user_nick = command_interaction.options.getString("nickname", true);
        user_data.user_name = user_nick;
        await VerificationUser.data_add(user_data);
        await VerificationUser.username_set(command_interaction.guild as Guild, command_interaction.user, `${user_nick} | ${user_data.user_team_number}`);
        const nick_embed = new EmbedBuilder()
            .setTitle("💳 Updated Nickname 💳")
            .setDescription(`Your nickname has been updated to **${user_nick} | ${user_data.user_team_number}**.`)
            .setColor("#84cc16");
        const permission_owner = VerificationUser.permission_owner(command_interaction.guild as Guild, command_interaction.user);
        const permission_embed = new EmbedBuilder()
            .setTitle("⚠️ No Permission ⚠️")
            .setDescription(`The verification bot **couldn't edit the guild owner's nickname** due to Discord restrictions, please update your nickname manually. **(Do not report this as a bug)**`)
            .setColor("#f97316");
        await command_interaction.editReply({embeds: (!permission_owner ? [nick_embed] : [nick_embed, permission_embed])});
    }
}