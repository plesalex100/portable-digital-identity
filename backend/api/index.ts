
import { Router } from "express";

const router = Router();

import faceAPI from './face.ts';
router.use('/face', faceAPI);

export default router;