import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import VerificationUser from "../interactions/user";
import VerificationCommand from "../templates/template_command";
import VerificationGuild from "../interactions/guild";
import VerificationCache from "../objects/cache";

export default class PingCommand extends VerificationCommand {

    public command_configuration(): SlashCommandBuilder {
        const command_builder = new SlashCommandBuilder()
            .setName("ping")
            .setDescription("Ping all users in a team.")
            .setDMPermission(false);
        command_builder.addStringOption(option => option
            .setName("team")
            .setDescription("The number of the team.")
            .setMaxLength(8)
            .setMinLength(2)
            .setRequired(true)
        );
        return command_builder;
    }

    public async command_trigger(command_interaction: ChatInputCommandInteraction): Promise<void> {
        await command_interaction.deferReply();
        const user_data = await VerificationUser.data_get(command_interaction.user.id, command_interaction.guild?.id as string);
        if (user_data === undefined) {
            // user not verified (require users to be verified to avoid spam)
            const permission_embed = new EmbedBuilder()
                .setTitle("⛔ Verification Required ⛔")
                .setDescription("**You are not verified!** If you believe this is in error, please contact an administrator.")
                .setColor("#ef4444");
            await command_interaction.editReply({embeds: [permission_embed]});
            return;
        }
        // cooldown
        const cooldown_key   = `FRONTEND_PINGCOOLDOWN_${command_interaction.guild?.id}_${command_interaction.user.id}`;
        const cooldown_cache = await VerificationCache.cache_get(cooldown_key);
        if (cooldown_cache !== undefined) {
            // cooldown active
            const cooldown_embed = new EmbedBuilder()
                .setTitle("⛔ Command on Cooldown ⛔")
                .setDescription(`This command has a **cooldown of 1 minute** to avoid spams, please try again later.`)
                .setColor("#ef4444");
            await command_interaction.editReply({embeds: [cooldown_embed]});
            return;
        }
        const guild_teams      = await VerificationGuild.teams_get(command_interaction.guild?.id as string);
        const ping_team_number = command_interaction.options.getString("team")?.toUpperCase();
        const ping_team_data   = guild_teams.find(loop_team => loop_team.team_number === ping_team_number);
        if (ping_team_data === undefined) {
            // invalid team
            const invalid_embed = new EmbedBuilder()
                .setTitle("⛔ Team Not Found ⛔")
                .setDescription(`The team (${ping_team_number}) is either **invalid** or **not in the server**! If you believe this is in error, please contact an administrator.`)
                .setColor("#ef4444");
            await command_interaction.editReply({embeds: [invalid_embed]});
            return;
        }
        // ping embed
        const ping_embed = new EmbedBuilder()
            .setTitle(`🔔 Pinged Team ${ping_team_number} 🔔`)
            .setDescription(`<@${command_interaction.user.id}> had **pinged all members** in **team ${ping_team_number}**,\nbelow are the users that were pinged.\n\u200B`)
            .setThumbnail("https://media.tenor.com/CW8PlYZiKEIAAAAC/angry-ping.gif")
            .setTimestamp()
            .setFooter({text: `requested by ${command_interaction.user.tag}`, iconURL: command_interaction.client.user.displayAvatarURL()})
            .setColor("#84cc16");
        // ping message
        const ping_message = ping_team_data.team_users.map(loop_user => `<@${loop_user.user_id}>`).join(", ");
        await VerificationCache.cache_set(cooldown_key, Date.now(), 60);
        await command_interaction.editReply({embeds: [ping_embed]}).then(command_interaction => command_interaction.channel.send(ping_message) as any);
    }
}