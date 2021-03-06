import { getOrMakeDbConnection } from "../db";

export const getBestGeneration = async () => {
  const { collection } = await getOrMakeDbConnection();

  const best = await collection.find().sort({ bestScore: -1 }).toArray();

  return best[0];
};

export const getGenerations = async () => {
  const { collection } = await getOrMakeDbConnection();

  const bests = await collection
    .find()
    .sort({ "bestGame.score": -1 })
    .toArray();

  return bests;
};

export const getGenerationByNumber = async (number: number) => {
  const { collection } = await getOrMakeDbConnection();

  const best = await collection.findOne({ generation: number });

  return best;
};

export const getGenerationBestScores = async () => {
  const { collection } = await getOrMakeDbConnection();

  const data = await collection
    .find({})
    .project({
      generation: 1,
      bestScore: 1,
      average: 1,
      median: 1,
      worstScore: 1,
      createdAt: 1,
      config: 1,
    })
    .sort({ createdAt: 1 })
    .toArray();
  return data.map((obj) => ({ ...obj, ...(obj.config as any) }));
};
