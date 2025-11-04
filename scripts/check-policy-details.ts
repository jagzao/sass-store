#!/usr/bin/env node
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

import { db } from '../packages/database';
import { sql } from 'drizzle-orm';

async function checkPolicies() {
  const policies: any = await db.execute(sql`
    SELECT policyname, qual
    FROM pg_policies
    WHERE tablename='products'
    ORDER BY policyname
  `);

  console.log('Product Policies:\n');
  policies.forEach((p: any) => {
    console.log(`${p.policyname}:`);
    console.log(`  ${p.qual}\n`);
  });
}

checkPolicies().then(() => process.exit(0));
