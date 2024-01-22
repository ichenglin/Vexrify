import * as GeographicalTimezone from "geo-tz";
import {default as timezone_moment} from "moment-timezone";

export default class VerificationTimezone {

    public static timezone_get(location_latitude: number, location_longitude: number): TimezoneData[] {
        if (location_latitude  === undefined || location_latitude  === null) return [];
        if (location_longitude === undefined || location_longitude === null) return [];
        const timezone_names     = GeographicalTimezone.find(location_latitude, location_longitude);
        const location_timezones = timezone_names.map(timezone_name => ({
            timezone_name:   timezone_name,
            timezone_offset: (timezone_moment().tz(timezone_name).utcOffset() / 60)
        } as TimezoneData));
        return location_timezones;
    }

    public static timezone_set(date_string: string, date_timezone: number): Date {
        const date_string_utc = date_string.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
        const date_object_utc = new Date(date_string_utc !== null ? `${date_string_utc[1]}Z` : date_string);
        const date_offset     = (-date_timezone * (60*60*1000));
        return new Date(date_object_utc.getTime() + date_offset);
    }
}

export interface TimezoneData {
    timezone_name:   string,
    timezone_offset: number
}