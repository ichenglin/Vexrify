import { ButtonInteraction, ChatInputCommandInteraction, ModalSubmitInteraction, SlashCommandBuilder } from "discord.js";
import VerificationButton from "../templates/template_button";
import VerificationCommand from "../templates/template_command";
import VerificationEvent from "../templates/template_event";
import VerificationModal from "../templates/template_modal";

export default class Registry {

    private registered_events:   Map<string, VerificationEvent>;
    private registered_commands: Map<string, VerificationCommand>;
    private registered_buttons:  Map<string, VerificationButton>;
    private registered_modals:   Map<string, VerificationModal>;

    constructor() {
        this.registered_events   = new Map<string, VerificationEvent>();
        this.registered_commands = new Map<string, VerificationCommand>();
        this.registered_buttons  = new Map<string, VerificationButton>();
        this.registered_modals   = new Map<string, VerificationModal>();
    }

    public register(contents: (VerificationEvent | VerificationCommand | VerificationButton | VerificationModal)[]): void {
        for (let content_index = 0; content_index < contents.length; content_index++) {
            const loop_content = contents[content_index];
            if      (loop_content instanceof VerificationEvent)   this.registered_events.set(loop_content.event_configuration().name, loop_content);
            else if (loop_content instanceof VerificationCommand) this.registered_commands.set(loop_content.command_configuration().toJSON().name, loop_content);
            else if (loop_content instanceof VerificationButton)  this.registered_buttons.set(loop_content.button_configuration().button_id, loop_content);
            else if (loop_content instanceof VerificationModal)   this.registered_modals.set(loop_content.modal_configuration().modal_id, loop_content);
        }
    }

    public event_signatures(): VerificationEvent[] {
        return Array.from(this.registered_events, event_signature => event_signature[1]);
    }

    public command_signatures(): SlashCommandBuilder[] {
        return Array.from(this.registered_commands, command_signature => command_signature[1].command_configuration());
    }

    public async command_trigger(command_interaction: ChatInputCommandInteraction): Promise<void> {
        await this.registered_commands.get(command_interaction.commandName)?.command_trigger(command_interaction);
    }

    public async button_trigger(button_interaction: ButtonInteraction): Promise<void> {
        await this.registered_buttons.get(button_interaction.customId)?.button_trigger(button_interaction);
    }

    public async modal_trigger(modal_interaction: ModalSubmitInteraction): Promise<void> {
        await this.registered_modals.get(modal_interaction.customId)?.modal_trigger(modal_interaction);
    }

}