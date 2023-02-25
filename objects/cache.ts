import { verification_cache } from "..";
import Logger from "./logger";

export default class VerificationCache {

    public static async cache_get(cache_id: string): Promise<any | undefined> {
        cache_id = cache_id.toUpperCase();
        const cache_response = await verification_cache.get(cache_id);
        if (cache_response === null) return undefined;
        Logger.send_log(`Returned cached with id ${cache_id}`);
        return JSON.parse(cache_response);
    }

    public static async cache_set(cache_id: string, cache_data: any): Promise<void> {
        cache_id = cache_id.toUpperCase();
        if (cache_data === undefined) return;
        Logger.send_log(`Registered cached with id ${cache_id}`);
        await verification_cache.setEx(cache_id, parseInt(process.env.REDIS_CACHE_LIFESPAN as string), JSON.stringify(cache_data));
    }

}