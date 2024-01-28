import { APIEmbedField, ActionRowBuilder, AnyComponentBuilder, AttachmentBuilder, BaseMessageOptions, ChatInputCommandInteraction, EmbedBuilder, Message, PermissionFlagsBits, TextBasedChannel } from "discord.js";

export default class VerificationDisplay {

    public static readonly EMOJI = {
        LIST_MARKER: "<:vrc_dot_blue:1135437387619639316>",
        VRC_LOGO:    "<:vrc_logo:1200947268925263982>"
    };

    public static string_list(string_items: string[]): string {
        if      (string_items.length <= 0)  return "";
        else if (string_items.length === 1) return string_items[0];
        else if (string_items.length === 2) return `${string_items[0]} and ${string_items[1]}`;
        const index_last = (string_items.length - 1);
        string_items[index_last] = `and ${string_items[index_last]}`;
        return string_items.join(", ");
    }

    public static permission_list(permission_list: bigint): string[] {
        const permission_flag_names = Object.getOwnPropertyNames(PermissionFlagsBits);
        const permission_flag_used  = [] as string[];
        permission_flag_names.forEach(flag_name => {
            const flag_set = (permission_list & (PermissionFlagsBits as {[index: string]: bigint})[flag_name]) !== BigInt(0);
            if (flag_set) permission_flag_used.push(flag_name);
        });
        return permission_flag_used;
    }

    public static embed_safe(embed_data: EmbedBuilder, attachment_data: (AttachmentBuilder[] | undefined), component_data: (ActionRowBuilder<AnyComponentBuilder>[] | undefined)): BaseMessageOptions[] {
        const embed_header_length = [
            embed_data.data.title,
            embed_data.data.description,
        ].filter(embed_text => embed_text !== undefined).join().length;
        const embed_footer_length = (embed_data.data.footer?.text.length || 0);
        // divide fields into groups
        const embed_field_group: APIEmbedField[][] = [[]];
        for (let field_index = 0; field_index < (embed_data.data.fields?.length || 0); field_index++) {
            const field_object      = (embed_data.data.fields as APIEmbedField[])[field_index];
            const field_length      = (field_object.name + field_object.value).length;
            const group_last        = embed_field_group[embed_field_group.length - 1];
            const group_last_length = group_last.map(field_data => field_data.name + field_data.value).join().length;
            // calculate group length
            let group_new_length = group_last_length + field_length;
            if (embed_field_group.length === 1)                                   group_new_length += embed_header_length;
            if (field_index === ((embed_data.data.fields?.length as number) - 1)) group_new_length += embed_footer_length;
            // if adding new field exceed limit of 6000 characters, create a new group
            if (group_new_length > 6000)        embed_field_group.push([]);
            embed_field_group[embed_field_group.length - 1].push(field_object);
        }
        // construct embeds from groups
        const embed_group: BaseMessageOptions[] = [];
        for (let group_index = 0; group_index < embed_field_group.length; group_index++) {
            const group_embed  = new EmbedBuilder();
            const group_header = (group_index === 0);
            const group_footer = (group_index === (embed_field_group.length - 1));
            group_embed.setFields(         embed_field_group[group_index]);
            group_embed.setColor(          embed_data.data.color       || null);
            // headers
            if (group_header) {
                group_embed.setTitle(      embed_data.data.title       || null);
                group_embed.setDescription(embed_data.data.description || null);
            }
            // footers
            if (group_footer) {
                group_embed.setImage(      embed_data.data.image?.url  || null);
                group_embed.setFooter(     embed_data.data.footer    !== undefined ? {text: embed_data.data.footer.text, iconURL: embed_data.data.footer.icon_url} : null);
                group_embed.setTimestamp(  embed_data.data.timestamp !== undefined ? new Date(embed_data.data.timestamp)                                           : null);
            }
            embed_group.push({
                embeds:     [group_embed],
                files:      (group_footer ? attachment_data         : undefined),
                components: (group_footer ? (component_data as any) : undefined)
            });
        }
        return embed_group;
    }

    public static async embed_editreply(interaction: ChatInputCommandInteraction, embed_group: BaseMessageOptions[], embed_messages_old: Message<boolean>[] = []): Promise<Message<boolean>[]> {
        if (embed_messages_old.length > 1) await Promise.all(embed_messages_old.slice(1).map(message_old => message_old.delete()));
        const embed_messages: Message<boolean>[] = [];
        embed_messages.push(await interaction.editReply(embed_group[0]));
        for (const embed_children of embed_group.slice(1)) embed_messages.push(await (interaction.channel as TextBasedChannel).send(embed_children));
        return embed_messages;
    }

}