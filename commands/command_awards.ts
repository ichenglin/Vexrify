import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import VerificationPriority from "../utilities/priority";
import RobotEvent from "../objects/robotevent";
import VerificationCommand from "../templates/template_command";

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
        const team_awards_classified = new Map<string, string[]>();
        for (let award_index = 0; award_index < team_awards.length; award_index++) {
            const award_data = team_awards[award_index];
            if (!team_awards_classified.has(award_data.award_name)) team_awards_classified.set(award_data.award_name, []);
            team_awards_classified.get(award_data.award_name)?.push(award_data.award_event.event_name);
        }
        const team_awards_sorted = Array.from(team_awards_classified.entries()).map(award_data => ({award_name: award_data[0], award_events: award_data[1]})).sort((award_a, award_b) => VerificationPriority.priority_awards(award_b.award_name) - VerificationPriority.priority_awards(award_a.award_name));
        const awards_embed = new EmbedBuilder()
            .setTitle(`🏅 ${team_data.team_name}'s Awards 🏅`)
            .setDescription(`**${team_data.team_name} (${team_data.team_number})** had won a total of **${team_awards.length} awards**, below are the details of the awards and their events.\n\u200B`)
            .addFields(
                ...team_awards_sorted.map((award_data) => {
                    let award_events = award_data.award_events.map((event_data, event_index) => `▪️ \`${event_data}\``).join("\n");
                    if (award_events.length > 1024) award_events = `${award_events.slice(0, 1024 - 4)}\`...`;
                    return {name: `🎖️ ${award_data.award_name} x${award_data.award_events.length} 🎖️`, value: award_events};
                }))
            .setColor("#84cc16");
        await command_interaction.editReply({embeds: [awards_embed]});
    }

}