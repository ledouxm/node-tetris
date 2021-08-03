import { getOrMakeDbConnection } from "../db";

export const getBestGeneration = async () => {
    const { collection } = await getOrMakeDbConnection();

    const best = await collection.find().sort({ bestScore: -1 }).toArray();

    return best[0];
};

export const getGenerations = async () => {
    const { collection } = await getOrMakeDbConnection();

    const bests = await collection.find().sort({ "bestGame.score": -1 }).toArray();

    return bests;
};

export const getGenerationByNumber = async (number: number) => {
    const { collection } = await getOrMakeDbConnection();

    const best = await collection.findOne({ generation: number });

    return best;
};
