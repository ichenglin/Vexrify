export default class VerificationEvent {

    public event_configuration(): {name: string} {
        return {name: "default"};
    }

    public async event_trigger(...event_arguments: any[]): Promise<void> {}

}