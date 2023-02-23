import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import VerificationCommand from "../templates/template_command";
import VerificationEvent from "../templates/template_event";

export default class Registry {

    private registered_events:   Map<string, VerificationEvent>;
    private registered_commands: Map<string, VerificationCommand>;

    constructor() {
        this.registered_events   = new Map<string, VerificationEvent>();
        this.registered_commands = new Map<string, VerificationCommand>();
    }

    public register(content: VerificationEvent | VerificationCommand): void {
        if      (content instanceof VerificationEvent)   this.registered_events.set(content.event_configuration().name, content);
        else if (content instanceof VerificationCommand) this.registered_commands.set(content.command_configuration().toJSON().name, content);
    }

    public event_signatures(): VerificationEvent[] {
        return Array.from(this.registered_events, event_signature => event_signature[1]);
    }

    public command_signatures(): SlashCommandBuilder[] {
        return Array.from(this.registered_commands, command_signature => command_signature[1].command_configuration());
    }

    public async command_trigger(command_interaction: CommandInteraction): Promise<void> {
        await this.registered_commands.get(command_interaction.commandName)?.command_trigger(command_interaction);
    }

}