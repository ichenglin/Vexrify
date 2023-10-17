import Database from "../objects/database";
import { VerificationUserData } from "./user";

export default class VerificationGuild {

    public static async users_get(guild_id: string): Promise<VerificationUserData[]> {
        const database_matches = await Database.query(`SELECT * FROM verified_user_data WHERE guild_id=${guild_id}`);
        return database_matches;
    }

}