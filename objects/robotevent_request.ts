import fetch from "node-fetch";
import Logger from "./logger";

export default class RobotEventRequest {

    public static async fetch_robotevent_list(api_path: string, page_items: number): Promise<any[]> {
        const api_response = await this.fetch_robotevent(`https://www.robotevents.com/api/v2/${api_path}?per_page=${page_items}`, 5).then(response => response.json()) as any;
        if (api_response.data.length <= 0) return [];
        const api_data: any[] = api_response.data;
        const api_response_continued = await Promise.all(new Array(api_response.meta.last_page - 1).fill(0).map((zero_lol, page_index) => 
            this.fetch_robotevent(`https://www.robotevents.com/api/v2/${api_path}?per_page=${page_items}&page=${api_response.meta.last_page - page_index}`, 5).then(response => response.json())
        ));
        for (let page_index = 0; page_index < (api_response.meta.last_page - 1); page_index++) {
            api_data.push(...api_response_continued[page_index].data);
        }
        return api_data;
    }

    public static async fetch_robotevent(request_url: string, retry_amount: number): Promise<any> {
        for (let attempt_index = 0; attempt_index < retry_amount; attempt_index++) {
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