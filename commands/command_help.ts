import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { verification_registry } from "..";
import VerificationCommand from "../templates/template_command";
import VerificationDisplay from "../utilities/display";

export default class HelpCommand extends VerificationCommand {

    public command_configuration(): SlashCommandBuilder {
        return new SlashCommandBuilder()
        .setName("help")
        .setDescription("List all the available commands.");
    }

    public async command_trigger(command_interaction: ChatInputCommandInteraction): Promise<void> {
        await command_interaction.deferReply();
        const help_embed = new EmbedBuilder()
            .setTitle("🌟 VRC Verification 🌟")
            .setDescription(`**VRC Verification** is a discord bot made for **Vex Robotics Competition**, assisting discord communities with **statistics lookup** and **identity verification** services.\n\u200B`)
            .addFields(verification_registry.command_signatures().map(command_signature => {
                const command_parameters = command_signature.options.map(command_option => {
                    const command_data = command_option.toJSON();
                    return (command_data.required ? `[${command_data.name}]` : `(${command_data.name}?)`);
                });
                const command_full        = [`/${command_signature.name}`, ...command_parameters].join(" ");
                const command_permissions = (command_signature.default_member_permissions !== undefined) ? VerificationDisplay.string_list(VerificationDisplay.permission_list(BigInt(command_signature.default_member_permissions as string))) : undefined;
                return {
                    name: `🏷️ ${command_full}`,
                    value: [
                        `\`${command_signature.description}\``,
                        `${VerificationDisplay.LIST_MARKER} Prerequisites: \`${(command_signature.default_member_permissions !== undefined ? `⚠️ ${command_permissions} Permission` : "✅ None")}\``,
                        `${VerificationDisplay.LIST_MARKER} Compatibility: \`${(command_signature.dm_permission              === false)    ? "⚠️ Guild Only"             : "✅ All"}\``
                    ].join("\n")
                };
            }))
            .addFields({
                name: "🔔 Ping Team (#[team])",
                value: [
                    "\`Pings all users from a team in text messages.\`",
                    `${VerificationDisplay.LIST_MARKER} Prerequisites: \`✅ None\``,
                    `${VerificationDisplay.LIST_MARKER} Compatibility: \`⚠️ Guild Only\``
                ].join("\n")
            })
            .setTimestamp()
            .setFooter({text: `requested by ${command_interaction.user.tag}`, iconURL: command_interaction.client.user.displayAvatarURL()})
            .setColor("#84cc16");
        // send embed
        const embed_safe = VerificationDisplay.embed_safe(help_embed, undefined, undefined);
        await command_interaction.editReply(embed_safe[0]);
        for (const embed_children of embed_safe.slice(1)) await command_interaction.channel?.send(embed_children);
    }

}