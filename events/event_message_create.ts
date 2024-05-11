import { EmbedBuilder, Events, Message } from "discord.js";
import remove_markdown from "remove-markdown";
import Logger from "../objects/logger";
import VerificationEvent from "../templates/template_event";
import VerificationGuild, { VerificationTeamData } from "../interactions/guild";
import VerificationDisplay from "../utilities/display";
import { VerificationUserData } from "../interactions/user";

export default class MessageCreateEvent extends VerificationEvent {

    public event_configuration(): {name: string} {
        return {
            name: Events.MessageCreate
        };
    }

    public async event_trigger(message: Message): Promise<void> {
        if (message.author.bot === true) return;
        await this.ping_event(message);
    }

    private async ping_event(message: Message): Promise<void> {
        const content_plain =  remove_markdown(message.content);
        const ping_messages = [...new Set(Array.from(content_plain.matchAll(/(?<![^\s])#([a-zA-Z\d]+)(?![^\s])/g)).map(ping_data => ({
            ping_full:    ping_data[0].toUpperCase(),
            ping_content: ping_data[1].toUpperCase(),
            ping_index:   ping_data.index
        })))];
        if (ping_messages.length <= 0) return;
        if (message.guild === null)    return;
        // validate pinged teams
        const guild_teams        = await VerificationGuild.teams_get(message.guild.id);
        const guild_teams_pinged = ping_messages.map(ping_data => guild_teams.find(loop_team => loop_team.team_number === ping_data.ping_content)).filter(team_data => team_data !== undefined) as VerificationTeamData[];
        const guild_users_pinged = ([] as VerificationUserData[]).concat.apply([], guild_teams_pinged.map(team_data => team_data.team_users));
        if (guild_teams_pinged.length <= 0) return;
        // ping embed
        const ping_embed = new EmbedBuilder()
            .setTitle(`🔔 Tagged Teams 🔔`)
            .setDescription(`<@${message.author.id}> had **pinged all members** of team(s) ${VerificationDisplay.string_list(guild_teams_pinged.map(loop_team => `**${loop_team.team_number}**`))}.\n\u200B`)
            .setThumbnail("https://media.tenor.com/CW8PlYZiKEIAAAAC/angry-ping.gif")
            .setTimestamp()
            .setFooter({text: `requested by ${message.author.tag}`, iconURL: message.client.user.displayAvatarURL()})
            .setColor("#84cc16");
        // ping message
        const ping_message = VerificationDisplay.string_list(guild_users_pinged.map(loop_user => `<@${loop_user.user_id}>`));
        await message.reply({content: `${ping_message}`, embeds: [ping_embed]});
        Logger.send_log(`${message.author.tag} pinged ${guild_users_pinged.length} users in ${message.guild.name}`);
    }

}