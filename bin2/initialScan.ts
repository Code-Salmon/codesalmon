#!/usr/bin/env node
import { writeTheFile } from './filecontracts';
import chalk from 'chalk';
import { scanSalmon } from './index'

async function swimSalmon() {
  try {
    console.log(chalk.blue('🐟 Starting swimSalmon...'));

    // Step 1: Find API calls
    const discoveredAPIs = await scanSalmon(); // Ensure this returns FetchCallData[]
    console.log(chalk.green('✅ API scan complete.'));

    // Step 2: Write baseline results
    await writeTheFile(discoveredAPIs); // This creates `.apiRestContracts.json`
    console.log(chalk.green('✅ API snapshot written.'));


  } catch (error) {
    console.error(chalk.red('❌ Error in swimSalmon:'), error);
  }
}

swimSalmon();