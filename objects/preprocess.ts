import AsyncDelay from "../utilities/async_delay";
import VerificationCache from "./cache";
import Logger from "./logger";
import RobotEvent, { EventData, SeasonData } from "./robotevent";

export default class PreProcess {

    private static processed_season_data: SeasonDataEvents[] = [];

    // only process seasons with the following programs
    private static readonly SEASON_PROGRAM_CODES: string[] = ["V5RC", "VURC"];

    public static get_event_season(event_id: number, event_program_code: string): SeasonData | undefined {
        const event_season = PreProcess.processed_season_data.find(season_data_events => {
            if (season_data_events.season_data.season_program.program_code !== event_program_code) return false;
            if (season_data_events.season_events.id_min                    >   event_id)           return false;
            if (season_data_events.season_events.id_max                    <   event_id)           return false;
            if (season_data_events.season_events.id_all.includes(event_id) !== true)               return false;
            return true;
        });
        return event_season?.season_data;
    }

    public static async preprocess_event_season(): Promise<void> {
        const seasons_list   = (await RobotEvent.get_seasons()).filter(season_data => PreProcess.SEASON_PROGRAM_CODES.includes(season_data.season_program.program_code));
        const seasons_events = [] as EventData[][];
        for (const season_data of seasons_list) {
            const cache_exist = (await VerificationCache.cache_get(`ROBOTEVENT_SEASONEVENTS_${season_data.season_id}`)) !== undefined;
            seasons_events.push(await RobotEvent.get_season_events(season_data.season_id, season_data.season_date.date_end));
            if (!cache_exist) await AsyncDelay.async_delay(10 * 1E3);
        }
        const seasons_result = seasons_list.map((season_data, season_index) => {
            const season_events_sorted = seasons_events[season_index].map(season_data => season_data.event_id).sort();
            if (season_events_sorted.length <= 0) return null;
            return {
                season_data:   season_data,
                season_events: {
                    id_all: season_events_sorted,
                    id_min: season_events_sorted[0],
                    id_max: season_events_sorted[season_events_sorted.length - 1]
                }
            } as SeasonDataEvents;
        }).filter(season_data => season_data !== null) as SeasonDataEvents[];
        PreProcess.processed_season_data = seasons_result;
        // log
        Logger.send_log([
            "Completed Event Season Preprocess:",
            ...seasons_result.map(result_data => `(${result_data.season_data.season_id}) [${result_data.season_data.season_name}] Events: ${result_data.season_events.id_min}~${result_data.season_events.id_max}`)
        ].join("\n"));
    }

}

interface SeasonDataEvents {
    season_data:   SeasonData,
    season_events: {
        id_all:    number[],
        id_min:    number,
        id_max:    number
    }
}