import { ButtonInteraction } from "discord.js";

export default class VerificationButton {

    public button_configuration(): {button_id: string} {
        return {button_id: "default"};
    }

    public async button_trigger(button_interaction: ButtonInteraction): Promise<void> {}

}