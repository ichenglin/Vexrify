import Prefetch from "./objects/prefetch";
import * as dotenv from "dotenv";

dotenv.config();

(async () => {
    await Prefetch.prefetch_update();
})();