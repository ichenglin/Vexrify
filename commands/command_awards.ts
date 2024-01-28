import { ActionRowBuilder, ChatInputCommandInteraction, ComponentType, EmbedBuilder, Message, SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";
import VerificationPriority from "../utilities/priority";
import RobotEvent, { EventDataSimplified, SeasonData, TeamData } from "../objects/robotevent";
import VerificationCommand from "../templates/template_command";
import VerificationDisplay from "../utilities/display";
import PreProcess from "../objects/preprocess";

export default class AwardsCommand extends VerificationCommand {

    public command_configuration(): SlashCommandBuilder {
        const command_builder = new SlashCommandBuilder()
            .setName("awards")
            .setDescription("Retrieves all the awards own by a team.");
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
        const team_number = command_interaction.options.getString("team", true);
        const team_data = await RobotEvent.get_team_by_number(team_number);
        if (team_data === undefined) {
            // invalid team
            const invalid_embed = new EmbedBuilder()
                .setTitle("⛔ Invalid Team ID ⛔")
                .setDescription(`You have entered an **Invalid Team ID** (${team_number})! If you believe this is in error, please contact an administrator.`)
                .setColor("#ef4444");
            await command_interaction.editReply({embeds: [invalid_embed]});
            return;
        }
        const team_awards = await RobotEvent.get_team_awards(team_data.team_id);
        if (team_awards.length <= 0) {
            // no awards
            const invalid_embed = new EmbedBuilder()
                .setTitle(`🏅 ${team_data.team_name}'s Awards 🏅`)
                .setDescription(`**${team_data.team_name} (${team_data.team_number})** hasn't won any awards. 😢`)
                .setColor("#ef4444");
            await command_interaction.editReply({embeds: [invalid_embed]});
            return;
        }
        const team_awards_classified = new Map<string, EventDataSimplified[]>();
        for (let award_index = 0; award_index < team_awards.length; award_index++) {
            const award_data = team_awards[award_index];
            if (!team_awards_classified.has(award_data.award_name)) team_awards_classified.set(award_data.award_name, []);
            team_awards_classified.get(award_data.award_name)?.push(award_data.award_event);
        }
        const team_seasons: SeasonData[] = [];
        const team_awards_sorted = Array.from(team_awards_classified.entries()).map(award_data => ({
            award_name:       award_data[0],
            award_events: award_data[1].map(award_event => {
                const event_season = PreProcess.get_event_season(award_event.event_id, team_data.team_program.program_code) as SeasonData;
                if (team_seasons.find(team_season => team_season.season_id === event_season.season_id) === undefined) team_seasons.push(event_season);
                return {
                    event_data:   award_event,
                    event_season: event_season
                };
            })})
        ).sort((award_a, award_b) => VerificationPriority.priority_awards(award_b.award_name) - VerificationPriority.priority_awards(award_a.award_name));
        // send embed
        await this.awards_response(command_interaction, [], team_data, team_awards_sorted, team_seasons, []);
    }

    private async awards_response(command_interaction: ChatInputCommandInteraction, command_messages_old: Message<boolean>[], team_data: TeamData, team_awards: TeamAward[], team_seasons: SeasonData[], seasons_filter: number[]): Promise<void> {
        const filter_active  = (seasons_filter.length > 0 && seasons_filter.length < team_seasons.length);
        const filter_seasons = seasons_filter.map(filter_season_id => team_seasons.find(team_season_data => team_season_data.season_id === filter_season_id) as SeasonData);
        const team_awards_filtered = (!filter_active) ? team_awards : team_awards.map(award_data => ({
            award_name:   award_data.award_name,
            award_events: award_data.award_events.filter(event_data => seasons_filter.includes(event_data.event_season.season_id))
        } as TeamAward)).filter(award_data => award_data.award_events.length > 0);
        // generate embed
        const awards_amount_all      = team_awards.map(         award_data => award_data.award_events.length).reduce((total_events, award_events) => (total_events + award_events), 0);
        const awards_amount_filtered = team_awards_filtered.map(award_data => award_data.award_events.length).reduce((total_events, award_events) => (total_events + award_events), 0);
        const awards_embed = new EmbedBuilder()
            .setTitle(`🏅 ${team_data.team_name}'s Awards 🏅`)
            .setDescription([
                `**${team_data.team_name} (${team_data.team_number})** had won a total of **${awards_amount_all} awards**, below are the details of the awards and their events.`,
                (filter_active ? `\n\n✨ **Applied Filter(s):** ${VerificationDisplay.string_list(filter_seasons.map(season_data => `\`${season_data.season_name}\``))} (${awards_amount_all - awards_amount_filtered} awards hidden)` : ""),
                `\n\u200B`
            ].join(""))
            .addFields(
                ...team_awards_filtered.map((award_data) => {
                    const message_limit      = "(and more events...)\n";
                    let award_events_display = "";
                    let award_events         = award_data.award_events.map((event_data, event_index) => `${VerificationDisplay.EMOJI.LIST_MARKER} __**\`(${event_data.event_season.season_name})\`**__ \`${event_data.event_data.event_name}\`\n`);
                    for (let event_index = 0; event_index < award_events.length; event_index++) {
                        const event_string       = award_events[event_index];
                        const display_length_new = (award_events_display.length + event_string.length + message_limit.length);
                        if (display_length_new > 1024) {
                            award_events_display += message_limit;
                            break;
                        }
                        award_events_display += event_string;
                    }
                    return {name: `🎖️ ${award_data.award_name} x${award_data.award_events.length} 🎖️`, value: `${award_events_display}\u200B`};
                }))
            .setTimestamp()
            .setFooter({text: `requested by ${command_interaction.user.tag}`, iconURL: command_interaction.client.user.displayAvatarURL()})
            .setColor("#84cc16");
        // generate dropdown
        const awards_filter = new StringSelectMenuBuilder()
            .setCustomId("awards-season")
            .setPlaceholder("Filter by Season(s)")
            .setMinValues(0)
            .setMaxValues(team_seasons.length)
            .addOptions(team_seasons.sort((season_a, season_b) => season_b.season_id - season_a.season_id).map(season_data => {
                const season_name_matcher = season_data.season_name.match(/^\s*(\w+) (\d{4}-\d{4}): ([\w ]*\w)\s*$/) as RegExpMatchArray;
                return new StringSelectMenuOptionBuilder()
                    .setLabel(`${season_name_matcher[1]} ${season_name_matcher[2]}`)
                    .setDescription(season_name_matcher[3])
                    .setEmoji(VerificationDisplay.EMOJI.VRC_LOGO)
                    .setValue(season_data.season_id.toString());
        }));
        const awards_actionrow = new ActionRowBuilder().addComponents(awards_filter);
        // send embed and dropdown
        const embed_messages = await VerificationDisplay.embed_editreply(command_interaction, VerificationDisplay.embed_safe(awards_embed, undefined, [awards_actionrow]), command_messages_old);
        // reply to dropdown
        const embed_collector = embed_messages[embed_messages.length - 1].createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            filter:        (component_interaction) => component_interaction.user.id === command_interaction.user.id,
            time:          (120 * 1E3)
        });
        embed_collector.on("collect", async (component_interaction) => {
            await component_interaction.deferUpdate();
            embed_collector.removeAllListeners();
            await this.awards_response(command_interaction, embed_messages, team_data, team_awards, team_seasons, component_interaction.values.map(collector_value => parseInt(collector_value)));
        });
        embed_collector.on("ignore", async (component_interaction) => {
            const prohibited_embed = new EmbedBuilder()
                .setTitle("⛔ No Permission ⛔")
                .setDescription(`This embed belongs to <@${command_interaction.user.id}>, you are not allowed to use this!`)
                .setColor("#ef4444");
            await component_interaction.reply({embeds: [prohibited_embed], ephemeral: true});
        });
        embed_collector.on("end", async () => {
            awards_filter.setDisabled(true);
            awards_filter.setPlaceholder("(Filter Expired After 2 Minutes of Inactivity)")
            await embed_messages[embed_messages.length - 1].edit({components: [awards_actionrow as any]});
        });
    }

}

interface TeamAward {
    award_name: string;
    award_events: {
        event_data: EventDataSimplified;
        event_season: SeasonData;
    }[];
}