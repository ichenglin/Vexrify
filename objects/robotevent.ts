import fetch from "node-fetch";
import VerificationCache from "./cache";
import Logger from "./logger";

export default class RobotEvent {

    public static async get_team_by_number(team_number: string): Promise<TeamData | undefined> {
        // load cache
        const api_cache = await VerificationCache.cache_get(`ROBOTEVENT_TEAMBYNUMBER_${team_number}`);
        if (api_cache !== undefined) return api_cache.cache_data;
        // cache not exist
        const api_response = await this.fetch_retries(`https://www.robotevents.com/api/v2/teams?number=${team_number}&per_page=1000`, 5).then(response => response.json()) as any;
        if (api_response.data.length <= 0) return undefined;
        const grade_priority = ["College", "High School", "Middle School", "Elementary School"];
        const api_team = api_response.data.sort((team_a: any, team_b: any) => grade_priority.indexOf(team_b.grade) - grade_priority.indexOf(team_a.grade))[api_response.data.length - 1];
        const result = {
            team_id:           api_team.id,
            team_number:       api_team.number,
            team_name:         api_team.team_name,
            team_organization: api_team.organization,
            team_country:      (api_team.location === undefined) || (api_team.location.country),
            team_program:      (api_team.program  === undefined) || (api_team.program.name),
            team_grade:        api_team.grade
        };
        await VerificationCache.cache_set(`ROBOTEVENT_TEAMBYNUMBER_${team_number}`, result);
        return result;
    }

    public static async get_team_awards(team_id: number): Promise<TeamAward[]> {
        // load cache
        const api_cache = await VerificationCache.cache_get(`ROBOTEVENT_TEAMAWARDS_${team_id}`);
        if (api_cache !== undefined) return api_cache.cache_data;
        // cache not exist
        const result = (await this.get_response(`teams/${team_id}/awards?per_page=1000`)).map((award_data: any) => ({
            award_id:       award_data.id,
            award_name:     award_data.title.match(/^([^\(]+)\s\(/)[1],
            award_event: {
                event_id:   award_data.event.id,
                event_name: award_data.event.name
            }
        } as TeamAward));
        await VerificationCache.cache_set(`ROBOTEVENT_TEAMAWARDS_${team_id}`, result);
        return result;
    }

    public static async get_team_skills(team_id: number): Promise<TeamSkills[]> {
        // load cache
        const api_cache = await VerificationCache.cache_get(`ROBOTEVENT_TEAMSKILLS_${team_id}`);
        if (api_cache !== undefined) return api_cache.cache_data;
        // cache not exist
        const result = (await this.get_response(`teams/${team_id}/skills?per_page=1000`)).map((skill_data: any) => ({
            skill_id:        skill_data.id,
            skill_type:      skill_data.type,
            skill_score:     skill_data.score,
            skill_rank:      skill_data.rank,
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
        await VerificationCache.cache_set(`ROBOTEVENT_TEAMSKILLS_${team_id}`, result);
        return result;
    }

    public static async get_season_skills(season_id: number, grade_level: string): Promise<SeasonSkills[]> {
        // load cache
        const api_cache = await VerificationCache.cache_get(`ROBOTEVENT_SEASONSKILLS_${season_id}`);
        if (api_cache !== undefined) return api_cache.cache_data;
        // cache not exist
        const api_response = (await this.fetch_retries(`https://www.robotevents.com/api/seasons/${season_id}/skills?grade_level=${encodeURI(grade_level)}`, 5).then(response => response.json())) as any[];
        if ((api_response as any).message !== undefined) return [];
        const result = api_response.map(skill_data => ({
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
        await VerificationCache.cache_set(`ROBOTEVENT_SEASONSKILLS_${season_id}`, result);
        return result;
    }

    private static async get_response(api_path: string): Promise<any[]> {
        const api_response = await this.fetch_retries(`https://www.robotevents.com/api/v2/${api_path}`, 5).then(response => response.json()) as any;
        if (api_response.data.length <= 0) return [];
        const api_data: any[] = api_response.data;
        const api_response_continued = await Promise.all(new Array(api_response.meta.last_page - 1).fill(0).map((zero_lol, page_index) => 
            this.fetch_retries(`https://www.robotevents.com/api/v2/${api_path}?page=${api_response.meta.last_page - page_index}`, 5).then(response => response.json())
        ));
        for (let page_index = 0; page_index < (api_response.meta.last_page - 1); page_index++) {
            api_data.push(...api_response_continued[page_index].data);
        }
        return api_data;
    }

    private static async fetch_retries(request_url: string, retry_amount: number): Promise<any> {
        for (let attempt_index = 0; attempt_index < (retry_amount + 1); attempt_index++) {
            try {
                return await fetch(request_url, {headers: this.get_authorization()});
            } catch (error) {
                Logger.send_log(`Request to ${request_url} failed, attempt refetch #${attempt_index + 1}`);
            }
        }
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
    skill_rank:      number,
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