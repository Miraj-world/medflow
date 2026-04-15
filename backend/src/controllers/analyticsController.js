import { withTransaction } from "../config/database.js";
import { getOverviewAnalytics } from "../models/analyticsModel.js";

export const getAnalyticsOverview = async (req, res) => {
  const analytics = await withTransaction(async (client) =>
    getOverviewAnalytics(client, {
      role: req.user.role,
      userId: req.user.sub,
    })
  );

  res.json(analytics);
};
