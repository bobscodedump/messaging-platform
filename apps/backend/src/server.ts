import { json, urlencoded } from "body-parser";
import express, { type Express } from "express";
import morgan from "morgan";
import cors from "cors";
import contactsRouter from "./routes/v1/contacts";
import usersRouter from "./routes/v1/users";
import messagesRouter from "./routes/v1/messages";
import templatesRouter from "./routes/v1/templates";
import groupsRouter from "./routes/v1/groups";
import companiesRouter from "./routes/v1/companies";
import schedulerRouter from "./routes/v1/scheduler";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler";
import { schedulerService } from "./services/schedulerService";

export const createServer = (): Express => {
    const app = express();

    const apiV1 = express.Router();
    apiV1.use(companiesRouter);
    apiV1.use(contactsRouter);
    apiV1.use(usersRouter);
    apiV1.use(messagesRouter);
    apiV1.use(templatesRouter);
    apiV1.use(groupsRouter);
    apiV1.use(schedulerRouter);

    // Start the scheduler service
    schedulerService.start();

    app
        .disable("x-powered-by")
        .use(morgan("dev"))
        .use(urlencoded({ extended: true }))
        .use(json())
        .use(cors())
        // Health and demo endpoints
        .get("/message/:name", (req, res) => {
            return res.json({ message: `hello ${req.params.name}` });
        })
        .get("/status", (_, res) => {
            return res.json({ ok: true });
        })
        // Mount API v1
        .use("/api/v1", apiV1)
        // 404 handler for unmatched routes
        .use(notFoundHandler)
        // Centralized error handler
        .use(errorHandler);

    return app;
};
