import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import VerificationCommand from "../templates/template_command";
import VerificationGuild from "../interactions/guild";
import RobotEvent, { TeamData } from "../objects/robotevent";

import CountryCode from "../data/country_code.json";
import { VerificationUserData } from "../interactions/user";

export default class RosterCommand extends VerificationCommand {

    public command_configuration(): SlashCommandBuilder {
        return new SlashCommandBuilder()
        .setName("roster")
        .setDescription("Generates an embed with all the teams in the guild.")
        .setDMPermission(false);
    }

    public async command_trigger(command_interaction: ChatInputCommandInteraction): Promise<void> {
        await command_interaction.deferReply();
        // get users
        const guild_users = await VerificationGuild.users_get(command_interaction.guild?.id as string);
        if (guild_users.length <= 0) {
            // no registered user in guild
            const invalid_embed = new EmbedBuilder()
                .setTitle("⛔ Insufficient Members ⛔")
                .setDescription(`The command requires at least **one verified user** in **${command_interaction.guild?.name}** to display the guild roster! If you believe this is in error, please contact an administrator.`)
                .setColor("#ef4444");
            await command_interaction.editReply({embeds: [invalid_embed]});
            return;
        }
        // process teams
        const guild_teams_raw = new Map<number, {team_number: string, team_data: TeamData, team_users: VerificationUserData[]}>();
        for (const loop_user of guild_users) {
            if (guild_teams_raw.has(loop_user.user_team_id)) guild_teams_raw.get(loop_user.user_team_id)?.team_users.push(loop_user);
            else                                             guild_teams_raw.set(loop_user.user_team_id, {
                team_number: loop_user.user_team_number,
                team_data:   await RobotEvent.get_team_by_number(loop_user.user_team_number) as TeamData,
                team_users:  [loop_user]
            });
        }
        const guild_teams = Array.from(guild_teams_raw, ([team_id, team_data]) => ({team_id, ...team_data}));
        // generate embed
        const roster_embed = new EmbedBuilder()
            .setTitle(`📙 ${command_interaction.guild?.name}'s Roster 📙`)
            .setDescription(`**${command_interaction.guild?.name}** had a total of **${guild_teams.length} registered teams**, below are the teams and their members.\n\u200B`)
            .addFields(
                ...guild_teams.sort((team_a, team_b) => team_a.team_number.localeCompare(team_b.team_number)).map((loop_team) => {
                    const team_country_code = CountryCode.find(country_data => country_data.name === loop_team.team_data.team_country)?.code;
                    const team_country_flag = team_country_code !== undefined ? `:flag_${team_country_code.toLowerCase()}:` : ":earth_americas:";
                    return {
                        name:  `${loop_team.team_number}`,
                        value: [
                            `\`${loop_team.team_data.team_name}\``,
                            `<:vrc_dot_blue:1135437387619639316> Country: ${team_country_flag}`,
                            `<:vrc_dot_blue:1135437387619639316> Grade: \`${loop_team.team_data.team_grade}\``,
                            ...loop_team.team_users.map(loop_user => `<@${loop_user.user_id}>`)
                        ].join("\n"),
                        inline: true
                    }
                }))
            .setTimestamp()
            .setFooter({text: `requested by ${command_interaction.user.tag}`, iconURL: command_interaction.client.user.displayAvatarURL()})
            .setColor("#84cc16");
        await command_interaction.editReply({embeds: [roster_embed]});
    }

}