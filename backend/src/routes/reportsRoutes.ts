import express from 'express';
import isAuth from '../middleware/isAuth';

import * as ReportsController from '../controllers/ReportsController';

const reportsRoutes = express.Router();

reportsRoutes.get(
  '/reports/appointmentsAtendent',
  isAuth,
  ReportsController.appointmentsAtendent,
);

reportsRoutes.get('/reports/rushHour', isAuth, ReportsController.rushHour);
reportsRoutes.get(
  '/reports/departamentRatings',
  isAuth,
  ReportsController.departamentRatings,
);

export default reportsRoutes;
