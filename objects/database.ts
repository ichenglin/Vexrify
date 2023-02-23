import { database } from "..";

export default class Database {

    public static async query(query: string): Promise<any> {
        return await new Promise((resolve, reject) => database.query(query, (error, results, fields) => resolve(results)));
    }

    public static async update(table: string, key: string, content: {[key: string]: any}): Promise<void> {
        const content_keys = Object.keys(content);
        let content_data: {key: string, value: string}[] = [];
        for (let key_index = 0; key_index < content_keys.length; key_index++) {
            const loop_content_key = content_keys[key_index];
            const loop_content     = content[loop_content_key];
            content_data.push({key: loop_content_key, value: database.escape(loop_content)});
        }
        const query_insert_keys   = content_data.map(loop_content => loop_content.key  ).join(",");
        const query_insert_values = content_data.map(loop_content => loop_content.value).join(",");
        const query_update        = content_data.filter(loop_content => loop_content.key !== key).map(loop_content => `${loop_content.key} = ${loop_content.value}`).join(",");
        return await this.query(`INSERT INTO ${table} (${query_insert_keys}) VALUES (${query_insert_values}) ON DUPLICATE KEY UPDATE ${query_update};`);
    }

}