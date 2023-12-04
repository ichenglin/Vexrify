import { AttachmentBuilder, ChatInputCommandInteraction, EmbedBuilder, InteractionEditReplyOptions, MessagePayload, SlashCommandBuilder } from "discord.js";
import * as NodeChartJS from "chartjs-node-canvas";
import RobotEvent, { SeasonData } from "../objects/robotevent";
import VerificationCommand from "../templates/template_command";
import VerificationDisplay from "../utilities/display";

export default class SkillsCommand extends VerificationCommand {

    public command_configuration(): SlashCommandBuilder {
        const command_builder = new SlashCommandBuilder()
            .setName("skills")
            .setDescription("Retrieves all the skills record of a team.");
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
        const team_skills = await RobotEvent.get_team_skills(team_data.team_id);
        if (team_skills.length <= 0) {
            // no awards
            const invalid_embed = new EmbedBuilder()
                .setTitle(`⚡ ${team_data.team_name}'s Skills ⚡`)
                .setDescription(`**${team_data.team_name} (${team_data.team_number})** don't have any skills record. 😢`)
                .setColor("#ef4444");
            await command_interaction.editReply({embeds: [invalid_embed]});
            return;
        }
        const team_season_data: SeasonData[] = [];
        for (let skill_index = 0; skill_index < team_skills.length; skill_index++) {
            const skill_data = team_skills[skill_index];
            // if driver score and programming score is both 0, won't exist in season skill
            if (skill_data.skill_score === 0 || skill_data.skill_rank < 1) continue;
            // check season already exist
            if (team_season_data.filter(skill_season => skill_season.season_id === skill_data.skill_season.season_id).length > 0) continue;
            team_season_data.push(skill_data.skill_season);
        }
        const team_season_skills = await Promise.all(team_season_data.map(skill_season => 
            RobotEvent.get_season_skills(skill_season.season_id, team_data.team_grade)
            .then(world_skills => world_skills.filter(skill_data => skill_data.skills_team.team_id === team_data.team_id)[0])
        ));
        const team_season_skills_sorted = team_season_data.map((season_data, season_index) => ({
            season_data:   season_data,
            season_skills: team_season_skills[season_index],
            placeholder:   false
        })).filter(season_skill => season_skill.season_skills !== undefined).sort((season_skill_a, season_skill_b) => season_skill_b.season_data.season_id - season_skill_a.season_data.season_id);
        const skills_embed = new EmbedBuilder()
            .setTitle(`⚡ ${team_data.team_name}'s Skills ⚡`)
            .setDescription(`**${team_data.team_name} (${team_data.team_number})** had participated in **${team_season_skills_sorted.length} skill seasons**, below are the records of their driver and programming skills.\n\u200B`)
            .addFields(
                ...team_season_skills_sorted.map((skill_data) => (
                    {name: `🏁 ${skill_data.season_data.season_name} 🏁`, value: [
                        `<:vrc_dot_blue:1135437387619639316> Rank: \`#${skill_data.season_skills.skills_rank}\` out of ${skill_data.season_skills.skills_entries} entries (\`Top ${Math.ceil(skill_data.season_skills.skills_rank / skill_data.season_skills.skills_entries * 100)}%\`)`,
                        `<:vrc_dot_blue:1135437387619639316> Driver: \`${skill_data.season_skills.skills_score.driver_score}\``,
                        `<:vrc_dot_blue:1135437387619639316> Programming: \`${skill_data.season_skills.skills_score.programming_score}\``
                    ].join("\n")}
                )))
            .setImage("attachment://skills_graph.png")
            .setTimestamp()
            .setFooter({text: `requested by ${command_interaction.user.tag}`, iconURL: command_interaction.client.user.displayAvatarURL()})
            .setColor("#84cc16");
        // process data points
        let skills_data   = [...team_season_skills_sorted].reverse();
        if (team_season_skills_sorted.length <= 1) skills_data = [{placeholder: true} as any, ...skills_data, {placeholder: true} as any];
        // skills graph
        const skills_canvas = new NodeChartJS.ChartJSNodeCanvas({width: 960, height: 540});
        const skills_buffer = await skills_canvas.renderToBuffer({type: "line", data: {
            labels: skills_data.map((skill_data) => !skill_data.placeholder ? (skill_data.season_data.season_name.match(/^[^ ]+ (\d{4}-\d{4}):/) as RegExpMatchArray)[1] : ""),
            datasets: [{
                label:           "Driver Score",
                data:            skills_data.map((skill_data) => !skill_data.placeholder ? skill_data.season_skills.skills_score.driver_score : null),
                fill:            true,
                borderWidth:     6,
                borderColor:     "rgb(255, 99, 132)",
                backgroundColor: "rgba(255, 99, 132, 0.2)",
                tension:         0.4
            },{
                label:           "Programming Score",
                data:            skills_data.map((skill_data) => !skill_data.placeholder ? skill_data.season_skills.skills_score.programming_score : null),
                fill:            true,
                borderWidth:     6,
                borderColor:     "rgb(54, 162, 235)",
                backgroundColor: "rgba(54, 162, 235, 0.2)",
                tension:         0.4
            }]
        }, options: {plugins: {
            title: {
                display: true,
                text:    `${team_data.team_name}'s Season Scores`,
                color:   "white",
                font:    {size: 20, weight: "800"}
            },
            legend: {
                labels: {color: "white", font: {size: 20, weight: "800"}}
            }
        }, scales: {
            x: {ticks: {color: "white", font: {size: 20, weight: "800"}}}                  as any,
            y: {ticks: {color: "white", font: {size: 20, weight: "800"}}, suggestedMin: 0} as any
        }}});
        const skills_image = new AttachmentBuilder(skills_buffer, {name: "skills_graph.png"});
        // send embed
        const embed_safe = VerificationDisplay.embed_safe(skills_embed, [skills_image]);
        await command_interaction.editReply(embed_safe[0]);
        for (const embed_children of embed_safe.slice(1)) await command_interaction.channel?.send(embed_children);
    }
}