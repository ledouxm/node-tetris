import express from "express";
import cors from "cors";
import { router } from "./routes";
export const startApi = async () => {
    const app = express();

    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    const port = process.env.PORT || 8080;

    app.use("/api", router);

    app.listen(port, () => {
        console.log("listening on port", port);
    });
};
