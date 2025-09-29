import express from 'express';
import isAuth from '../middleware/isAuth';

import * as DashboardController from '../controllers/DashbardController';

const routes = express.Router();

routes.get('/dashboard', isAuth, DashboardController.index);
routes.get('/dashboard/ticketsUsers', DashboardController.reportsUsers);
routes.get('/dashboard/ticketsDay', DashboardController.reportsDay);

export default routes;
