import { Generation } from "./generation";

export const startGenetic = async () => {
    const generation = new Generation();
    await generation.init();

    generation.start();
};
