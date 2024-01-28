export default class AsyncDelay {

    public static async async_delay(await_milliseconds: number): Promise<void> {
        await new Promise((resolve, reject) => setTimeout(resolve, await_milliseconds));
    }

}