import { Router, type IRouter } from "express";
import healthRouter from "./health";
import storageRouter from "./storage";
import imagesRouter from "./images";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storageRouter);
router.use(imagesRouter);

export default router;
