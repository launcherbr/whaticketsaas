import express from "express";
import isAuth from "../middleware/isAuth";

import * as SubscriptionController from "../controllers/SubscriptionController";

const subscriptionRoutes = express.Router();
subscriptionRoutes.post("/subscription", isAuth, SubscriptionController.createSubscription);
subscriptionRoutes.post("/subscription/create/webhook", SubscriptionController.createWebhook);
subscriptionRoutes.post("/subscription/validate/webhook", isAuth, SubscriptionController.validateWebhook);
subscriptionRoutes.post("/subscription/webhook/:type?", SubscriptionController.webhook);
subscriptionRoutes.put("/subscription/webhook/:type?", SubscriptionController.webhook);
// Suporte para OPTIONS (preflight) para webhooks
subscriptionRoutes.options("/subscription/webhook/:type?", (req, res) => {
  res.status(200).end();
});

export default subscriptionRoutes;
