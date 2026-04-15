import { withTransaction } from "../config/database.js";
import { listAlerts } from "../models/alertModel.js";
import { getHighRiskPatients, getOverviewAnalytics } from "../models/analyticsModel.js";

export const getDashboard = async (req, res) => {
  const payload = await withTransaction(async (client) => {
    const [analytics, alerts, highRiskPatients] = await Promise.all([
      getOverviewAnalytics(client, {
        role: req.user.role,
        userId: req.user.sub,
      }),
      listAlerts(client, {
        limit: 8,
        role: req.user.role,
        userId: req.user.sub,
      }),
      getHighRiskPatients(client, {
        role: req.user.role,
        userId: req.user.sub,
        limit: 6,
      }),
    ]);

    return {
      overview: analytics.overview,
      doctorLoad: analytics.doctorLoad,
      conditionBreakdown: analytics.conditionBreakdown.slice(0, 6),
      missedTrend: analytics.missedTrend,
      activeAlerts: alerts,
      highRiskPatients,
    };
  });

  res.json(payload);
};
