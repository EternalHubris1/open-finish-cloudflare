import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profileRouter from "./profile";
import activitiesRouter from "./activities";
import logsRouter from "./logs";
import alertsRouter from "./alerts";
import achievementsRouter from "./achievements";
import dashboardRouter from "./dashboard";
import calendarRouter from "./calendar";
import reflectionsRouter from "./reflections";
import dailyContextRouter from "./daily-context";
import continuityMemoryRouter from "./continuity-memory";
import rhythmsRouter from "./rhythms";

const router: IRouter = Router();

router.use(healthRouter);
router.use(profileRouter);
router.use(activitiesRouter);
router.use(logsRouter);
router.use(alertsRouter);
router.use(achievementsRouter);
router.use(dashboardRouter);
router.use(calendarRouter);
router.use(reflectionsRouter);
router.use(dailyContextRouter);
router.use(continuityMemoryRouter);
router.use(rhythmsRouter);

export default router;
