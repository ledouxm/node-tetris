import { getOrMakeDbConnection } from "./db";
import fs from "fs/promises";
const clear = async () => {
  console.log("cleaning...");

  try {
    const { collection, client } = await getOrMakeDbConnection();
    await collection.deleteMany({});
    await client.close();
  } catch (e) {
  } finally {
  }
  try {
    await fs.rm("lastGeneration.json");
  } catch (e) {
    console.log("error while cleaning db");
  }

  try {
    await fs.rm("bestGame.json");
  } catch (e) {
    console.log("error while cleaning bestGame.json");
  }

  console.log("done");
};

clear();
