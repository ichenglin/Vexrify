import { verification_cache } from "..";
import Logger from "./logger";

export default class VerificationCache {

    public static async cache_get(cache_id: string): Promise<VerificationCacheData | undefined> {
        cache_id = cache_id.toUpperCase();
        const cache_response = await verification_cache.get(cache_id);
        if (cache_response === null) return undefined;
        Logger.send_log(`Returned cache with id ${cache_id}`);
        return JSON.parse(cache_response) as VerificationCacheData;
    }

    public static async cache_set(cache_id: string, cache_data: any, cache_lifespan?: number): Promise<void> {
        cache_id = cache_id.toUpperCase();
        if (cache_data     === undefined) return;
        if (cache_lifespan === undefined) cache_lifespan = parseInt(process.env.REDIS_CACHE_LIFESPAN as string);
        Logger.send_log(`Registered cache with id ${cache_id}`);
        await verification_cache.setEx(cache_id, cache_lifespan, JSON.stringify({
            cache_data:      cache_data,
            cache_birthdate: Date.now(),
            cache_lifespan:  cache_lifespan
        } as VerificationCacheData));
    }

}

interface VerificationCacheData {
    cache_data:      any,
    cache_birthdate: number,
    cache_lifespan:  number
}