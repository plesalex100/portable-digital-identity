
import { Router } from "express";

const router = Router();

import faceAPI from './face';
router.use('/face', faceAPI);

import passengersAPI from './passengers';
router.use('/passengers', passengersAPI);

import checkpointsAPI from './checkpoints';
router.use('/checkpoints', checkpointsAPI);

export default router;