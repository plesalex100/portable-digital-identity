
import { Router } from "express";

const router = Router();

import faceAPI from './face';
router.use('/face', faceAPI);

import passengersAPI from './passengers';
router.use('/passengers', passengersAPI);

export default router;