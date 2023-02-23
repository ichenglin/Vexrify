export default class Logger {

    public static send_log(log_message: string): void {
        console.log(`[LOG ${new Date().toLocaleTimeString()}] ${log_message}`);
    }

}