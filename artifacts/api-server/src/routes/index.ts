import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profileRouter from "./profile";
import activitiesRouter from "./activities";
import logsRouter from "./logs";
import alertsRouter from "./alerts";
import achievementsRouter from "./achievements";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(profileRouter);
router.use(activitiesRouter);
router.use(logsRouter);
router.use(alertsRouter);
router.use(achievementsRouter);
router.use(dashboardRouter);

export default router;
