import { verification_database } from "..";
import Logger from "./logger";

export default class Database {

    public static async query(query: string): Promise<any> {
        console.log(query);
        console.log(query.length);
        const now = Date.now();
        const data = await new Promise((resolve, reject) => verification_database.query(query, (error, results, fields) => {
            if (error) console.log(error);
            resolve(results);
        }));
        Logger.send_log(`Database operation took ${Date.now() - now} ms.`);
        console.log(data);
        return data;
    }

    public static async query_stack(queries: string[], query_maximum: number = 65000): Promise<any> {
        const query_strings = [""];
        for (let query_index = 0; query_index < queries.length; query_index++) {
            const loop_query = queries[query_index];
            if (query_strings[query_strings.length - 1].length + loop_query.length > query_maximum) query_strings.push("");
            query_strings[query_strings.length - 1] += loop_query;
        }
        return await Promise.all(query_strings.map(query_string => this.query(query_string)));
    }

    public static async update(table: string, key: string, content: {[key: string]: any}): Promise<void> {
        const content_keys = Object.keys(content);
        let content_data: {key: string, value: string}[] = [];
        for (let key_index = 0; key_index < content_keys.length; key_index++) {
            const loop_content_key = content_keys[key_index];
            const loop_content     = content[loop_content_key];
            content_data.push({key: loop_content_key, value: verification_database.escape(loop_content)});
        }
        const query_insert_keys   = content_data.map(loop_content => loop_content.key  ).join(",");
        const query_insert_values = content_data.map(loop_content => loop_content.value).join(",");
        const query_update        = content_data.filter(loop_content => loop_content.key !== key).map(loop_content => `${loop_content.key} = ${loop_content.value}`).join(",");
        return await this.query(`INSERT INTO ${table} (${query_insert_keys}) VALUES (${query_insert_values}) ON DUPLICATE KEY UPDATE ${query_update};`);
    }

    public static update_string(table: string, key: string, content: {[key: string]: any}): string {
        const content_keys = Object.keys(content);
        let content_data: {key: string, value: string}[] = [];
        for (let key_index = 0; key_index < content_keys.length; key_index++) {
            const loop_content_key = content_keys[key_index];
            const loop_content     = content[loop_content_key];
            content_data.push({key: loop_content_key, value: verification_database.escape(loop_content)});
        }
        const query_insert_keys   = content_data.map(loop_content => loop_content.key  ).join(",");
        const query_insert_values = content_data.map(loop_content => loop_content.value).join(",");
        const query_update        = content_data.filter(loop_content => loop_content.key !== key).map(loop_content => `${loop_content.key} = ${loop_content.value}`).join(",");
        return `INSERT INTO ${table} (${query_insert_keys}) VALUES (${query_insert_values}) ON DUPLICATE KEY UPDATE ${query_update};`;
    }

}