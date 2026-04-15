export const createActivityLog = async (
  client,
  { userId, action, entityType, entityId = null, details = {} }
) => {
  await client.query(
    `
      INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
      VALUES ($1, $2, $3, $4, $5::jsonb)
    `,
    [userId, action, entityType, entityId, JSON.stringify(details)]
  );
};
