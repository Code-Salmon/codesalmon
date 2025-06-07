#!/usr/bin/env node
import path from 'path';
import * as fs from 'fs';
import fetch from 'node-fetch';
import { compareAPIs, boxedLog, JSONObj } from './drift';
import chalk from 'chalk';
import { execSync } from 'child_process';



async function compareScan () {
    // Step 3: Load saved data
    const topLevelPath = execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
    const filePath = path.join(topLevelPath, '.apiRestContracts.json');
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const baselineData = JSON.parse(rawData);

    // Step 4: Re-fetch and compare
    for (const api of baselineData) {
      const url = api.resolvedUrl;
      const initial = api[url];
      const liveCall = await fetch(url);

      if (!liveCall.ok) {
        console.warn(chalk.yellow(`⚠️ Could not re-fetch ${url}: ${liveCall.status}`));
        continue;
      }

      const current = (await liveCall.json()) as JSONObj;
      boxedLog(chalk.blue(`🔍 Comparing drift for ${url}`), () => {
        compareAPIs(initial, current);
      });
    }
}
console.log(chalk.cyan('🏁 swimSalmon complete.'));

compareScan();