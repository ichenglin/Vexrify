import fetch from "node-fetch";

export default class RobotEvent {

    public static async get_team_by_number(team_number: string): Promise<TeamData | undefined> {
        const api_response = await fetch(`https://www.robotevents.com/api/v2/teams?number=${team_number}`, {headers: this.get_authorization()}).then(response => response.json()) as any;
        if (api_response.data.length <= 0) return undefined;
        const api_team = api_response.data[0];
        return {
            team_id:           api_team.id,
            team_number:       api_team.number,
            team_name:         api_team.team_name,
            team_organization: api_team.organization,
            team_country:      (api_team.location === undefined) || (api_team.location.country),
            team_program:      (api_team.program  === undefined) || (api_team.program.name),
            team_grade:        api_team.grade
        };
    }

    private static get_authorization() {
        return {
            Accept:        "application/json",
            Authorization: `Bearer ${process.env.ROBOTEVENT_ACCESS_KEY}`
        }
    }

}

export interface TeamData {
    team_id:           number,
    team_number:       string,
    team_name:         string,
    team_organization: string,
    team_country:      string,
    team_program:      string,
    team_grade:        string
}