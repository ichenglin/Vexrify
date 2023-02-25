import fetch from "node-fetch";
import * as FileSystem from "fs";

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
            award_event: {
                event_id:   award_data.event.id,
                event_name: award_data.event.name
            }
        } as TeamAward));
    }

    public static async get_team_skills(team_id: number): Promise<TeamSkills[]> {
        return (await this.get_response(`teams/${team_id}/skills`)).map((skill_data: any) => ({
            skill_id:        skill_data.id,
            skill_type:      skill_data.type,
            skill_score:     skill_data.score,
            skill_attempts:  skill_data.attempts,
            skill_event: {
                event_id:    skill_data.event.id,
                event_name:  skill_data.event.name
            },
            skill_season: {
                season_id:   skill_data.season.id,
                season_name: skill_data.season.name
            }
        } as TeamSkills));
    }

    public static async get_season_skills(season_id: number): Promise<SeasonSkills[]> {
        const api_response = await fetch(`https://www.robotevents.com/api/seasons/${season_id}/skills`, {headers: this.get_authorization()}).then(response => response.json()) as any[];
        return api_response.map(skill_data => ({
            skills_rank:           skill_data.rank,
            skills_entries:        api_response.length,
            skills_team: {
                team_id:           skill_data.team.id,
                team_number:       skill_data.team.team,
                team_name:         skill_data.team.teamName,
                team_organization: skill_data.team.organization,
                team_country:      skill_data.team.country,
                team_program:      skill_data.team.program,
                team_grade:        skill_data.team.gradeLevel
            },
            skills_score: {
                driver_score: skill_data.scores.driver,
                driver_time_stop: skill_data.scores.driverStopTime,
                driver_score_date: skill_data.scores.driverScoredAt,
                programming_score: skill_data.scores.programming,
                programming_time_stop: skill_data.scores.progStopTime,
                programming_score_date: skill_data.scores.progScoredAt,
            }
        } as SeasonSkills));
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

export interface EventData {
    event_id:   number,
    event_name: string
}

export interface SeasonData {
    season_id:   number,
    season_name: string
}

export interface TeamAward {
    award_id:       number,
    award_name:     string,
    award_event:    EventData
}

export interface TeamSkills {
    skill_id:        number,
    skill_type:      string,
    skill_score:     number,
    skill_attempts:  number,
    skill_event:     EventData,
    skill_season:    SeasonData
}

export interface SeasonSkills {
    skills_rank:                 number,
    skills_entries:              number,
    skills_team:                 TeamData,
    skills_score: {
        // driver
        driver_score:            number,
        driver_time_stop:        number,
        driver_score_date:       string,
        // programming
        programming_score:       number,
        programming_time_stop:   number,
        programming_score_date:  string
    }
}