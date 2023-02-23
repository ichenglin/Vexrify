import { ModalSubmitInteraction } from "discord.js";

export default class VerificationModal {

    public modal_configuration(): {modal_id: string} {
        return {modal_id: "default"};
    }

    public async modal_trigger(modal_interaction: ModalSubmitInteraction): Promise<void> {}

}