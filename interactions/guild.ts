import Database from "../objects/database";
import RobotEvent, { TeamData } from "../objects/robotevent";
import { VerificationUserData } from "./user";

export default class VerificationGuild {

    public static async teams_get(guild_id: string): Promise<VerificationTeamData[]> {
        const guild_users = await VerificationGuild.users_get(guild_id);
        // process teams
        const guild_teams_raw = new Map<number, {team_number: string, team_data: TeamData, team_users: VerificationUserData[]}>();
        for (const loop_user of guild_users) {
            if (guild_teams_raw.has(loop_user.user_team_id)) guild_teams_raw.get(loop_user.user_team_id)?.team_users.push(loop_user);
            else                                             guild_teams_raw.set(loop_user.user_team_id, {
                team_number: loop_user.user_team_number,
                team_data:   await RobotEvent.get_team_by_number(loop_user.user_team_number) as TeamData,
                team_users:  [loop_user]
            });
        }
        return Array.from(guild_teams_raw, ([team_id, team_data]) => ({team_id, ...team_data}));
    }

    public static async users_get(guild_id: string): Promise<VerificationUserData[]> {
        const database_matches = await Database.query(`SELECT * FROM verified_user_data WHERE guild_id=${guild_id}`);
        return database_matches;
    }

}

export interface VerificationTeamData {
    team_number: string,
    team_data:   TeamData,
    team_users:  VerificationUserData[]
}