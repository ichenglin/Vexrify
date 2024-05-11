import { ChatInputCommandInteraction, EmbedBuilder, Guild, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import VerificationCommand from "../templates/template_command";
import VerificationUser from "../interactions/user";
import RobotEvent from "../objects/robotevent";
import CountryFlag from "../utilities/flag";
import VerificationDisplay from "../utilities/display";

export default class AssignCommand extends VerificationCommand {

    public command_configuration(): SlashCommandBuilder {
        const command_builder = new SlashCommandBuilder()
            .setName("assign")
            .setDescription("Forcefully assign/replace the team number of an user.")
            .setDMPermission(false)
            .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers | PermissionFlagsBits.BanMembers);
        command_builder.addUserOption(option => option
            .setName("user")
            .setDescription("The user to assign the team number.")
            .setRequired(true)
        ).addStringOption(option => option
            .setName("team")
            .setDescription("(Optional) The new team number of the user.")
            .setMaxLength(8)
            .setMinLength(2)
        ).addStringOption(option => option
            .setName("name")
            .setDescription("(Optional) The new nickname of the user.")
            .setMaxLength(16)
            .setMinLength(1)
        ).addBooleanOption(option => option
            .setName("active")
            .setDescription("(Optional) The status of the user.")
        );
        return command_builder;
    }

    public async command_trigger(command_interaction: ChatInputCommandInteraction): Promise<void> {
        await command_interaction.deferReply();
        const assign_user   =        command_interaction.options.getUser   ("user",   true);
        const assign_team   =        command_interaction.options.getString ("team",   false)?.toUpperCase();
        const assign_name   =        command_interaction.options.getString ("name",   false);
        const assign_active = Number(command_interaction.options.getBoolean("active", false));
        const team_data = (assign_team !== undefined) ? await RobotEvent.get_team_by_number(assign_team) : undefined;
        // check for valid team id
        if (assign_team !== undefined && team_data === undefined) {
            const invalid_embed = new EmbedBuilder()
                .setTitle("⛔ Invalid Team ID ⛔")
                .setDescription(`You have entered an **Invalid Team ID** (${assign_team})! If you believe this is in error, please contact an administrator.`)
                .setColor("#ef4444");
            await command_interaction.editReply({embeds: [invalid_embed]});
            return;
        }
        // prohibited characters in name
        if (assign_name !== null && assign_name.match(/[^\w\d\s]/g) !== null) {
            const invalid_embed = new EmbedBuilder()
                .setTitle("⛔ Invalid Nickname ⛔")
                .setDescription("You are only allowed to use **letters**, **numbers**, and **whitespaces** in your nickname!")
                .setColor("#ef4444");
            await command_interaction.editReply({embeds: [invalid_embed],});
            return;
        }
        // assign team
        const user_data = await VerificationUser.data_get(assign_user.id, command_interaction.guild?.id as string);
        if (user_data === undefined) {
            // user not verified
            const permission_embed = new EmbedBuilder()
                .setTitle("⛔ User Not Verified ⛔")
                .setDescription(`<@${assign_user.id}> **must be verified** to be assigned new a **team number**, **nickname**, or **status**! If you believe this is in error, please contact an administrator.`)
                .setColor("#ef4444");
            await command_interaction.editReply({embeds: [permission_embed]});
            return;
        }
        // send embed
        const updated_team   = (assign_team   !== undefined) && (assign_team   !== user_data.user_team_number);
        const updated_name   = (assign_name   !== null)      && (assign_name   !== user_data.user_name);
        const updated_active = (assign_active !== null)      && (assign_active !== user_data.user_active);
        if (updated_team === false && updated_name === false && updated_active === false) {
            // nothing is updated
            const permission_embed = new EmbedBuilder()
                .setTitle("⛔ Invalid Update ⛔")
                .setDescription(`You must provide a new **team number**, **nickname**, or **status** to use this command!`)
                .setColor("#ef4444");
            await command_interaction.editReply({embeds: [permission_embed]});
            return;
        }
        const new_team_id     = (updated_team)   ? team_data?.team_id     as number : user_data.user_team_id;
        const new_team_number = (updated_team)   ? team_data?.team_number as string : user_data.user_team_number;
        const new_name        = (updated_name)   ? assign_name                      : user_data.user_name;
        const new_active      = (updated_active) ? assign_active                    : user_data.user_active;
        // save to database
        await VerificationUser.data_add({
            user_id:          assign_user.id,
            guild_id:         command_interaction.guild?.id as string,
            user_team_id:     new_team_id,
            user_team_number: new_team_number,
            user_name:        new_name,
            user_active:      new_active
        });
        // successful reply
        const assign_embed = new EmbedBuilder()
            .setTitle("✅ User Updated ✅")
            .setDescription(`<@${command_interaction.user.id}> updated <@${assign_user.id}>'s verification status.\n\u200B`)
            .addFields([(updated_team) && {
                name: `🏦 Team Number 🏦`,
                value: [
                    (team_data !== undefined) ? `${VerificationDisplay.EMOJI.LIST_MARKER} Country: ${CountryFlag.get_flag(team_data.team_country)} \`${team_data.team_country}\`` : undefined,
                    (team_data !== undefined) ? `${VerificationDisplay.EMOJI.LIST_MARKER} Organization: \`${team_data.team_organization}\``                                       : undefined,
                    `\`\`\`diff\n- ${user_data.user_team_number}\n+ ${assign_team}\`\`\``
                ].join("\n")
            }, (updated_name) && {
                name: `🪪 User Nickname 🪪`,
                value: `\`\`\`diff\n- ${user_data.user_name}\n+ ${assign_name}\`\`\``
            }, (updated_active) && {
                name: `📍 User Status 📍`,
                value: `\`\`\`diff\n- ${(user_data.user_active ? "active" : "inactive")}\n+ ${(assign_active ? "active" : "inactive")}\`\`\``,
                inline: true
            }].filter(field_data => field_data !== false) as {name: string, value: string, inline?: boolean}[])
            .setColor("#84cc16");
        // no update nickname permission
        const permission_owner = VerificationUser.permission_owner(command_interaction.guild as Guild, assign_user);
        const permission_embed = new EmbedBuilder()
            .setTitle("⚠️ No Permission ⚠️")
            .setDescription(`The bot **couldn't edit the guild owner's nickname** due to Discord restrictions, please update their nickname manually.`)
            .setColor("#f97316");
        await VerificationUser.username_set(command_interaction.guild as Guild, assign_user, `${new_name} | ${new_team_number}`);
        await command_interaction.editReply({embeds: (!permission_owner ? [assign_embed] : [assign_embed, permission_embed])});
    }

}