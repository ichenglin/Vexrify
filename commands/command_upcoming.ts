import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import VerificationGuild from "../interactions/guild";
import RobotEvent, { TeamData } from "../objects/robotevent";
import VerificationCommand from "../templates/template_command";
import CountryFlag from "../utilities/flag";
import VerificationDisplay from "../utilities/display";

export default class UpcomingCommand extends VerificationCommand {

    public command_configuration(): SlashCommandBuilder {
        const command_builder = new SlashCommandBuilder()
            .setName("upcoming")
            .setDescription("Retrieves all the upcoming events of the teams in guild.")
            .setDMPermission(false);
        return command_builder;
    }

    public async command_trigger(command_interaction: ChatInputCommandInteraction): Promise<void> {
        await command_interaction.deferReply();
        // get users
        const guild_teams      = await VerificationGuild.teams_get(command_interaction.guild?.id as string);
        const guild_teams_data = await Promise.all(guild_teams.map(team_data => RobotEvent.get_team_by_number(team_data.team_number) as Promise<TeamData>));
        if (guild_teams.length <= 0) {
            // no registered user in guild
            const invalid_embed = new EmbedBuilder()
                .setTitle("⛔ Insufficient Members ⛔")
                .setDescription(`The command requires at least **one verified user** in **${command_interaction.guild?.name}** to display the events! If you believe this is in error, please contact an administrator.`)
                .setColor("#ef4444");
            await command_interaction.editReply({embeds: [invalid_embed]});
            return;
        }
        const guild_registered_teams = guild_teams_data.reduce((value_previous, value_current) => ({...value_previous, [value_current.team_id]: value_current}), {} as {[key: number]: TeamData});
        let   guild_events           = await RobotEvent.get_guild_events((command_interaction.guild?.id as string), guild_teams_data.map(team_data => team_data.team_id), new Date());
        const guild_events_total     = guild_events.length;
        const guild_events_maximum   = 10;
        guild_events = guild_events.slice(0, Math.min(guild_events_total, guild_events_maximum));
        const guild_events_teams     = await Promise.all(guild_events.map(event_data => RobotEvent.get_event_teams(event_data.event_id)));
        // embed
        const events_embed = new EmbedBuilder()
            .setTitle(`🗓️ ${command_interaction.guild?.name}'s Upcoming Events 🗓️`)
            .setDescription(`**${command_interaction.guild?.name}** had a total of **${guild_events_total} registered events**, below are the details of their **${Math.min(guild_events_total, guild_events_maximum)} upcoming events**.\n\u200B`)
            .addFields(
                ...guild_events.map((event_data, event_index) => {
                    const event_address = [
                        ...event_data.event_location.address_lines,
                        event_data.event_location.address_city,
                        event_data.event_location.address_state,
                        `${event_data.event_location.address_country} ${event_data.event_location.address_postcode}`
                    ].filter(address_component => address_component != null && address_component.length > 0).join(", ");
                    const event_region = [
                        event_data.event_location.address_city,
                        event_data.event_location.address_state,
                        event_data.event_location.address_country
                    ].filter(address_component => address_component != null && address_component.length > 0).join(", ");
                    const event_teams_guild    = guild_events_teams[event_index].filter(team_data => guild_registered_teams[team_data.team_id] !== undefined);
                    const event_teams_excluded = guild_events_teams[event_index].length - event_teams_guild.length;
                    const event_links          = [{
                        link_name: "Robot Events",
                        link_url:  `https://www.robotevents.com/robot-competitions/vex-robotics-competition/${event_data.event_sku}.html`
                    }, {
                        link_name: "Google Maps",
                        link_url:  `https://www.google.com/maps/search/?api=1&query=${encodeURI(event_address)}`
                    }];
                    return {
                        name: `📌 ${event_data.event_name} 📌`,
                        value: [
                            `<:vrc_dot_blue:1135437387619639316> Location: ${CountryFlag.get_flag(event_data.event_location.address_country)} \`${event_region}\``,
                            `<:vrc_dot_blue:1135437387619639316> Date: <t:${Math.floor(new Date(event_data.event_date.date_begin).getTime() / 1000)}:R>`,
                            `<:vrc_dot_blue:1135437387619639316> Teams: \`${event_teams_guild.map(team_data => team_data.team_number).join("\`, \`")}\` and \`${event_teams_excluded}\` more team(s)...`,
                            `<:vrc_dot_blue:1135437387619639316> Links: ${event_links.map(link_data => `[**\`${link_data.link_name}\`**](${link_data.link_url})`).join(", ")}`,
                            `\u200B`
                        ].join("\n")
                    }
                }))
            .setTimestamp()
            .setFooter({text: `requested by ${command_interaction.user.tag}`, iconURL: command_interaction.client.user.displayAvatarURL()})
            .setColor("#84cc16");
        // send embed
        const embed_safe = VerificationDisplay.embed_safe(events_embed);
        await command_interaction.editReply(embed_safe[0]);
        for (const embed_children of embed_safe.slice(1)) await command_interaction.channel?.send(embed_children);
    }

}