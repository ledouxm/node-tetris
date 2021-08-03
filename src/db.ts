import { Collection, MongoClient } from "mongodb";

const url = "mongodb://root:ptdrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr@localhost:27017";
const ref = {
    client: (null as any) as MongoClient,
    collection: (null as any) as Collection,
};

export const dbName = "tetrisIA";

export const getOrMakeDbConnection = async () => {
    if (ref.client) return ref;

    ref.client = new MongoClient(url);
    await ref.client.connect();

    const db = ref.client.db(dbName);
    ref.collection = db.collection("tetris");

    return ref;
};