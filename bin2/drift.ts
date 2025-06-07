import { diff, Diff } from 'deep-diff';
import chalk from 'chalk';
import * as cfonts from 'cfonts';
import stripAnsi from 'strip-ansi';
import * as fs from 'fs';
import path from 'path';
import { execSync } from "child_process";

export type JSONObj = Record<string, any>;


// function to use cfonts for messaging
function displayMessage(message: string, colors: string[]) {
  cfonts.say(message, {
    font: 'chrome',
    align: 'left',
    colors,
    background: 'transparent',
    letterSpacing: 1,           // Define letter spacing
    lineHeight: 1,              // Define the line height
    space: true,                // Add space between letters
    maxLength: '0',             // Define max length of output string
    rawMode: false,             // define if the line breaks should be CR(`\r\n`) over the default LF (`\n`)
	  env: 'node',
    independentGradient: false,// Apply gradient across all lines
    transitionGradient: false
  });
}

export function compareAPIs(initial: JSONObj, current: JSONObj): void {
  const drift: Diff<JSONObj, JSONObj>[] | undefined = diff(initial, current);
  if (!drift) {
    // console.log(chalk.bold.bgWhite.greenBright('✅ No drift detected!'));
     displayMessage('No drift detected!', ['#3fff3f', '#00b400', '#005a00']);
    return;
  }
  // console.log(chalk.yellow.bold('\n⚠️ Drift detected:\n'));
    displayMessage('Drift detected!', ['red', '#D16002', 'red']);

  drift.forEach((update) => {
    const path = update.path?.join('.') || '(root)';
    switch (update.kind) {
      case 'E':
        console.log(chalk.bold.redBright(`Change at: ${chalk.italic.underline(path)}`));
        console.log(chalk.blue(`From: ${JSON.stringify(update.lhs)}`));
        console.log(chalk.yellow(`To: ${JSON.stringify(update.rhs)}`));
        break;
      case 'N':
        console.log(chalk.bold.redBright(`Addition at: ${chalk.italic.underline(path)}`));
        console.log(chalk.yellow(`Value: ${JSON.stringify(update.rhs)}\n`));
        break;
      case 'D':
        console.log(chalk.bold.redBright(`Removed at: ${chalk.italic.underline(path)}`));
        console.log(chalk.yellow(`Old value: ${JSON.stringify(update.lhs)}\n`));
        break;
      default:
        console.log(chalk.yellow(`Unhandled change type at ${chalk.italic.underline(path)}`));
    }
  });
}


export function boxedLog(title: string, callback: () => void) {
  const logs: string[] = [];
  const originalLog = console.log;

  console.log = (...args: any[]) => {
    const output = args.map(String).join(" ");
    logs.push(...output.split("\n"));
  };

  try {
    callback();
  } finally {
    console.log = originalLog;

    const allLines = [title, ...logs];
    const maxLength = Math.max(...allLines.map(line => stripAnsi(line).length)) + 2;

    const horizontal = "─".repeat(maxLength);
    console.log(`┌${horizontal}┐`);
    console.log(`│ ${title.padEnd(maxLength - 1)}│`);
    console.log(`├${horizontal}┤`);

    for (const line of logs) {
      const visibleLength = stripAnsi(line).length;
      const padding = ' '.repeat(maxLength - visibleLength - 1);
      console.log(`│ ${line}${padding}│`);
    }

    console.log(`└${horizontal}┘`);
  }
}

// const identifySalmon = () => {
//     const apiRestContractsPath = path.resolve(__dirname, '../.apiRestContracts.json');
//     const apiContracts = JSON.parse(fs.readFileSync(apiRestContractsPath, 'utf-8'));
//     for (let i = 0; i < apiContracts.length; i++) {
//       boxedLog(`📦 API Drift Report`, () => {
//       compareAPIs(apiContracts[i], muddyData[i])
//     })
//   }
// }

// get hardcoded data for current


// const urls = ['https://api.nasa.gov/planetary/apod?api_key=', 'https://pokeapi.co/api/v2/pokemon?offset=1&limit=1']
// for (let i=0; i<goldenData.length; i++){
//   boxedLog(`📦 API Drift Report for ${urls[i]}`, () => {
//   compareAPIs(goldenData[i], muddyData[i])
//   });
// }

// needs to be dynamic for DD to do comparison without hardcoded data. need to pull in json object and iterate through them to get array[i].resolvedURL and make fetch call to compare
