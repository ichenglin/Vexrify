import fetch from "node-fetch";

export default class RobotEvent {

    public static async get_team_by_number(team_number: string): Promise<TeamData | undefined> {
        const api_response = await fetch(`https://www.robotevents.com/api/v2/teams?number=${team_number}`, {headers: this.get_authorization()}).then(response => response.json()) as any;
        if (api_response.data.length <= 0) return undefined;
        const grade_priority = ["College", "High School", "Middle School", "Elementary School"];
        const api_team = api_response.data.sort((team_a: any, team_b: any) => grade_priority.indexOf(team_b.grade) - grade_priority.indexOf(team_a.grade))[api_response.data.length - 1];
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

    public static async get_team_awards(team_id: number): Promise<TeamAward[]> {
        return (await this.get_response(`teams/${team_id}/awards`)).map((award_data: any) => ({
            award_id:       award_data.id,
            award_name:     award_data.title.match(/^([^\(]+)\s\(/)[1],
            award_event:    {
                event_id:   award_data.event.id,
                event_name: award_data.event.name
            }
        } as TeamAward));
    }

    private static async get_response(api_path: string): Promise<any[]> {
        const api_response = await fetch(`https://www.robotevents.com/api/v2/${api_path}`, {headers: this.get_authorization()}).then(response => response.json()) as any;
        if (api_response.data.length <= 0) return [];
        const api_data: any[] = api_response.data;
        const api_response_continued = await Promise.all(new Array(api_response.meta.last_page - 1).fill(0).map((zero_lol, page_index) => 
            fetch(`https://www.robotevents.com/api/v2/${api_path}?page=${api_response.meta.last_page - page_index}`, {headers: this.get_authorization()}).then(response => response.json())
        ));
        for (let page_index = 0; page_index < (api_response.meta.last_page - 1); page_index++) {
            api_data.push(...api_response_continued[page_index].data);
        }
        return api_data;
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

export interface TeamAward {
    award_id:       number,
    award_name:     string,
    award_event: {
        event_id:   number,
        event_name: string
    }
}