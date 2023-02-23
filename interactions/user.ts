import { Guild, User } from "discord.js";
import Database from "../objects/database";

export default class VerificationUser {

    public static async data_add(user_data: VerificationUserData): Promise<void> {
        // remove existing data to prevent duplicate
        if (await this.data_get(user_data.user_id, user_data.guild_id) !== undefined) await this.data_remove(user_data.user_id, user_data.guild_id);
        // add new data
        await Database.update("verified_user_data", "", user_data);
    }

    public static async data_remove(user_id: string, guild_id: string): Promise<void> {
        await Database.query(`DELETE FROM verified_user_data WHERE user_id=${user_id} AND guild_id=${guild_id}`);
    }

    public static async data_get(user_id: string, guild_id: string): Promise<VerificationUserData | undefined> {
        const database_matches = await Database.query(`SELECT * FROM verified_user_data WHERE user_id=${user_id} AND guild_id=${guild_id}`);
        if (database_matches === undefined) return undefined;
        return database_matches[0];
    }

    public static async username_set(guild: Guild, user: User, nickname: string) {
        // bot has no permission to update server owner display name
        if (this.permission_owner(guild, user)) return;
        await guild.members.cache.get(user.id)?.setNickname(nickname);
    }

    public static async role_add(role_guild: Guild, role_name: string, role_user: User): Promise<void> {
        let role_element = role_guild.roles.cache.find(loop_role => loop_role.name === role_name);
        if (role_element === undefined) role_element = await role_guild.roles.create({name: role_name, color: "Green", reason: "Auto", permissions: []});
        await role_guild.members.cache.get(role_user.id)?.roles.add(role_element);
    }

    public static role_has(role_guild: Guild, role_name: string, role_user: User): boolean {
        return role_guild.members.cache.get(role_user.id)?.roles.cache.some(loop_role => loop_role.name === role_name) as boolean;
    }

    public static permission_owner(guild: Guild, user: User): boolean {
        return (guild.ownerId === user.id);
    }

}

export interface VerificationUserData {
    user_id:          string,
    guild_id:         string,
    user_team_id:     number,
    user_team_number: string,
    user_name:        string
}