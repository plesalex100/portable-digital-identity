
import { Router } from "express";

const router = Router();

import faceAPI from './face.js';
router.use('/face', faceAPI);

export default router;