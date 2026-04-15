import { withTransaction } from "../config/database.js";
import { listAlerts } from "../models/alertModel.js";

export const getAlerts = async (req, res) => {
  const alerts = await withTransaction(async (client) =>
    listAlerts(client, {
      limit: Number(req.query.limit ?? 15),
      role: req.user.role,
      userId: req.user.sub,
    })
  );

  res.json(alerts);
};
