export const countUsers = async (client) => {
  const { rows } = await client.query("SELECT COUNT(*)::int AS count FROM users");
  return rows[0].count;
};

export const findUserByEmail = async (client, email) => {
  const { rows } = await client.query(
    `
      SELECT id, first_name, last_name, full_name, email, password_hash, role, specialization
      FROM users
      WHERE LOWER(email) = LOWER($1)
    `,
    [email]
  );

  return rows[0] ?? null;
};

export const createUser = async (
  client,
  { firstName, lastName, email, passwordHash, role, specialization = null }
) => {
  const { rows } = await client.query(
    `
      INSERT INTO users (first_name, last_name, full_name, email, password_hash, role, specialization)
      VALUES ($1, $2, $3, LOWER($4), $5, $6, $7)
      RETURNING id, first_name, last_name, full_name, email, role, specialization, created_at
    `,
    [firstName, lastName, `${firstName} ${lastName}`, email, passwordHash, role, specialization]
  );

  return rows[0];
};

export const updateUserPassword = async (client, userId, passwordHash) => {
  await client.query(
    `
      UPDATE users
      SET password_hash = $2,
          updated_at = NOW()
      WHERE id = $1
    `,
    [userId, passwordHash]
  );
};
