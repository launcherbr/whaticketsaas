import { QueryInterface, QueryTypes } from "sequelize";

const tableName = "TicketUsers";
const primaryKeyName = "TicketUsers_pkey";
const sequenceName = "TicketUsers_id_seq";
const uniqueIndexName = "TicketUsers_ticketId_userId_unique";

async function getPrimaryKeyColumns(
  queryInterface: QueryInterface,
  transaction: any
): Promise<string[]> {
  const rows = await queryInterface.sequelize.query(
    `
      SELECT a.attname AS column_name
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
      WHERE t.relname = :tableName
        AND c.conname = :primaryKeyName
        AND c.contype = 'p'
      ORDER BY array_position(c.conkey, a.attnum);
    `,
    {
      replacements: { tableName, primaryKeyName },
      type: QueryTypes.SELECT,
      transaction
    }
  ) as Array<{ column_name: string }>;

  return rows.map(row => row.column_name);
}

async function indexExists(
  queryInterface: QueryInterface,
  transaction: any
): Promise<boolean> {
  const rows = await queryInterface.sequelize.query(
    `
      SELECT 1
      FROM pg_indexes
      WHERE schemaname = ANY(current_schemas(false))
        AND tablename = :tableName
        AND indexname = :uniqueIndexName;
    `,
    {
      replacements: { tableName, uniqueIndexName },
      type: QueryTypes.SELECT,
      transaction
    }
  );

  return rows.length > 0;
}

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const tableDescription = await queryInterface.describeTable(tableName) as Record<string, unknown>;
      const hasIdColumn = Boolean(tableDescription.id);
      const primaryKeyColumns = await getPrimaryKeyColumns(queryInterface, transaction);
      const hasPrimaryKey = primaryKeyColumns.length > 0;
      const primaryKeyIsId =
        primaryKeyColumns.length === 1 && primaryKeyColumns[0] === "id";

      await queryInterface.sequelize.query(
        `CREATE SEQUENCE IF NOT EXISTS "${sequenceName}";`,
        { transaction }
      );

      if (!hasIdColumn) {
        if (hasPrimaryKey) {
          await queryInterface.sequelize.query(
            `ALTER TABLE "${tableName}" DROP CONSTRAINT "${primaryKeyName}";`,
            { transaction }
          );
        }

        await queryInterface.sequelize.query(
          `ALTER TABLE "${tableName}" ADD COLUMN "id" INTEGER DEFAULT nextval('"${sequenceName}"');`,
          { transaction }
        );

        await queryInterface.sequelize.query(
          `UPDATE "${tableName}" SET "id" = nextval('"${sequenceName}"') WHERE "id" IS NULL;`,
          { transaction }
        );

        await queryInterface.sequelize.query(
          `ALTER TABLE "${tableName}" ALTER COLUMN "id" SET NOT NULL;`,
          { transaction }
        );

        await queryInterface.sequelize.query(
          `ALTER TABLE "${tableName}" ADD PRIMARY KEY ("id");`,
          { transaction }
        );
      } else {
        await queryInterface.sequelize.query(
          `ALTER TABLE "${tableName}" ALTER COLUMN "id" SET DEFAULT nextval('"${sequenceName}"');`,
          { transaction }
        );

        if (!primaryKeyIsId) {
          if (hasPrimaryKey) {
            await queryInterface.sequelize.query(
              `ALTER TABLE "${tableName}" DROP CONSTRAINT "${primaryKeyName}";`,
              { transaction }
            );
          }

          await queryInterface.sequelize.query(
            `ALTER TABLE "${tableName}" ADD PRIMARY KEY ("id");`,
            { transaction }
          );
        }
      }

      await queryInterface.sequelize.query(
        `ALTER SEQUENCE "${sequenceName}" OWNED BY "${tableName}"."id";`,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `SELECT setval('"${sequenceName}"', COALESCE((SELECT MAX("id") FROM "${tableName}"), 0) + 1, false);`,
        { transaction }
      );

      if (!(await indexExists(queryInterface, transaction))) {
        await queryInterface.addIndex(tableName, ["ticketId", "userId"], {
          unique: true,
          name: uniqueIndexName,
          transaction
        });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface: QueryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      if (await indexExists(queryInterface, transaction)) {
        await queryInterface.removeIndex(tableName, uniqueIndexName, { transaction });
      }

      const primaryKeyColumns = await getPrimaryKeyColumns(queryInterface, transaction);

      if (primaryKeyColumns.length > 0) {
        await queryInterface.sequelize.query(
          `ALTER TABLE "${tableName}" DROP CONSTRAINT "${primaryKeyName}";`,
          { transaction }
        );
      }

      await queryInterface.removeColumn(tableName, "id", { transaction });

      await queryInterface.sequelize.query(
        `DROP SEQUENCE IF EXISTS "${sequenceName}";`,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE "${tableName}" ADD CONSTRAINT "${primaryKeyName}" PRIMARY KEY ("ticketId", "userId");`,
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
