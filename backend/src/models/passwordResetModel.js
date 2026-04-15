export const createPasswordResetToken = async (
  client,
  { userId, tokenHash, expiresAt }
) => {
  await client.query(
    `
      INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
      VALUES ($1, $2, $3)
    `,
    [userId, tokenHash, expiresAt]
  );
};

export const invalidateActivePasswordResetTokens = async (client, userId) => {
  await client.query(
    `
      UPDATE password_reset_tokens
      SET used_at = NOW()
      WHERE user_id = $1
        AND used_at IS NULL
    `,
    [userId]
  );
};

export const findValidPasswordResetToken = async (client, tokenHash) => {
  const { rows } = await client.query(
    `
      SELECT id, user_id
      FROM password_reset_tokens
      WHERE token_hash = $1
        AND used_at IS NULL
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [tokenHash]
  );

  return rows[0] ?? null;
};

export const markPasswordResetTokenUsed = async (client, tokenId) => {
  await client.query(
    `
      UPDATE password_reset_tokens
      SET used_at = NOW()
      WHERE id = $1
    `,
    [tokenId]
  );
};
