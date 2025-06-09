import { diff, Diff } from 'deep-diff';
import chalk from 'chalk';
import * as cfonts from 'cfonts';

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
     displayMessage('No drift detected!', ['#3fff3f', '#00b400', '#005a00']);
    return;
  }
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


