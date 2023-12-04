export default class Logger {

    public static send_log(log_message: string): void {
        const log_time = new Date().toLocaleTimeString();
        console.log(log_message.split("\n").map(log_line => `[LOG ${log_time}] ${log_line}`).join("\n"));
    }

}