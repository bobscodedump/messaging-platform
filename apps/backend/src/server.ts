import { json, urlencoded } from "body-parser";
import express, { type Express } from "express";
import morgan from "morgan";
import cors from "cors";
import cookieParser from 'cookie-parser';
import contactsRouter from "./routes/v1/contacts";
import usersRouter from "./routes/v1/users";
import messagesRouter from "./routes/v1/messages";
import templatesRouter from "./routes/v1/templates";
import groupsRouter from "./routes/v1/groups";
import companiesRouter from "./routes/v1/companies";
import schedulerRouter from "./routes/v1/scheduler";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler";
import { schedulerService } from "./services/schedulerService";
import authRouter from "./routes/v1/auth";
import passport, { requireAuth } from "./middleware/auth";

export const createServer = (): Express => {
    const app = express();

    const apiV1 = express.Router();
    // Public auth endpoints
    apiV1.use(authRouter);
    // Protected application endpoints
    apiV1.use(requireAuth, companiesRouter);
    apiV1.use(requireAuth, contactsRouter);
    apiV1.use(requireAuth, usersRouter);
    apiV1.use(requireAuth, messagesRouter);
    apiV1.use(requireAuth, templatesRouter);
    apiV1.use(requireAuth, groupsRouter);
    apiV1.use(requireAuth, schedulerRouter);

    // Start the scheduler service (skip during tests)
    if (process.env.NODE_ENV !== 'test') {
        schedulerService.start();
    }

    const corsOptions: cors.CorsOptions = {
        origin: (_origin, callback) => callback(null, true), // reflect request origin
        credentials: true,
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    };

    app
        .disable("x-powered-by")
        .use(morgan("dev"))
        .use(urlencoded({ extended: true }))
        .use(json())
        .use(cookieParser())
        .use(cors(corsOptions))
        .options('*', cors(corsOptions))
        .use(passport.initialize())
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
