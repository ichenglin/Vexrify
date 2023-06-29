import Database from "./database";
import Logger from "./logger";
import RobotEventRequest from "./robotevent_request";

export default class Prefetch {

    public static async prefetch_update() {
        this.prefetch_fetch_seasons();
    }

    private static async prefetch_fetch_seasons() {
        const robotevent_seasons: PrefetchSeason[] = await RobotEventRequest.fetch_robotevent_list("seasons", 1000);
        const robotevent_grades = ["College", "High School", "Middle School", "Elementary School"];
        const robotevent_skills: any[] = [];
        const robotevent_teams:  any[] = [];
        for (let season_index = 5; season_index < 10; season_index++) {
            const loop_season = robotevent_seasons[season_index];
            const loop_season_skill_requests = await Promise.all(new Array(robotevent_grades.length).fill(0).map((zero_lol, grade_index) => 
                RobotEventRequest.fetch_robotevent(`https://www.robotevents.com/api/seasons/${loop_season.id}/skills?grade_level=${encodeURI(robotevent_grades[grade_index])}`, 5)
                .then((response: any) => response.status === 200 ? response.json() : [])
                .then((response: any) => response.error  === undefined ? response : [])
            ));
            const loop_season_skills: {[key: string]: {}} = {};
            for (let grade_index = 0; grade_index < robotevent_grades.length; grade_index++) loop_season_skills[robotevent_grades[grade_index]] = loop_season_skill_requests[grade_index].map((ranking: any) => ({rank: ranking.rank, team_id: ranking.team.id}));
            for (let grade_index = 0; grade_index < robotevent_grades.length; grade_index++) robotevent_teams.push(...loop_season_skill_requests[grade_index].map((skill_team: any) => skill_team.team));
            robotevent_skills.push(loop_season_skills);
            Logger.send_log(`Season skill team fetched (${season_index + 1}/${robotevent_seasons.length})`);
        }
        await Promise.all(new Array(robotevent_skills.length).fill(0).map((zero_lol, season_index) => Database.update("robotevent_seasons", "season_id", {
            season_id:     robotevent_seasons[season_index].id,
            season_data:   JSON.stringify(robotevent_seasons[season_index]),
            season_skills: JSON.stringify(robotevent_skills[season_index])
        })));
        const robotevent_teams_unique = new Map<number, any>();
        for (let team_index = 0; team_index < robotevent_teams.length; team_index++) if (!robotevent_teams_unique.has(robotevent_teams[team_index].id)) robotevent_teams_unique.set(robotevent_teams[team_index].id, robotevent_teams[team_index]);
        await Database.query_stack(Array.from(robotevent_teams_unique.entries()).map(([team_id, team_data]) => Database.update_string("robotevent_teams", "team_id", {
            team_id:     team_id,
            team_number: team_data.team,
            team_data:   JSON.stringify([])
        })));
        console.log("completed.");
    }

}

interface PrefetchSeason {
    id:          number,
    name:        string,
    program: {
        id:      number,
        name:    string,
        code:    string
    },
    start:       string,
    end:         string,
    years_start: number,
    years_end:   number
}