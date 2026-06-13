import "dotenv/config";
import pg from "pg";

const { Client } = pg;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is missing");
  process.exit(1);
}

const client = new Client({ connectionString });

async function main() {
  const shouldDelete = process.argv.includes("--delete");
  await client.connect();

  if (shouldDelete) {
    await client.query(`DELETE FROM plan_variants WHERE plan_id IN (SELECT id FROM plans WHERE name = 'Test') AND speed_mbps = 1 AND duration_months = 1`);
    await client.query(`DELETE FROM plans WHERE name = 'Test' AND NOT EXISTS (SELECT 1 FROM plan_variants WHERE plan_variants.plan_id = plans.id)`);
    console.log("Cashfree test plan removed if it was not referenced by existing records.");
    return;
  }

  const planResult = await client.query(`
    INSERT INTO plans (id, name, description)
    VALUES ('plan_cashfree_test', 'Test', 'Hidden Rs. 1 Cashfree production test plan.')
    ON CONFLICT (name)
    DO UPDATE SET description = EXCLUDED.description
    RETURNING id
  `);

  const planId = planResult.rows[0].id;

  await client.query(
    `
      INSERT INTO plan_variants (id, plan_id, speed_mbps, duration_months, price)
      VALUES ('variant_cashfree_test_1', $1, 1, 1, 1)
      ON CONFLICT (plan_id, speed_mbps, duration_months)
      DO UPDATE SET price = EXCLUDED.price
    `,
    [planId],
  );

  console.log("Cashfree test plan ready: Test 1 Mbps, 1 month, Rs. 1");
  console.log("Open /plans?cashfreeTest=1 to use it.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end().catch(() => undefined);
  });
