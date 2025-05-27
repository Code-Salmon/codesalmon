import { diff, Diff } from 'deep-diff';
import chalk from 'chalk';

type JSONObj = Record<string, unknown>;

export function compareAPIs(initial: JSONObj, current: JSONObj): void {
  const drift: Diff<JSONObj, JSONObj>[] | undefined = diff(initial, current);
  if (!drift) {
    console.log(chalk.bold.bgWhite.greenBright('✅ No drift detected!'));
    return;
  }
  console.log(chalk.yellow.bold('\n⚠️ Drift detected:\n'));

  drift.forEach((update) => {
    const path = update.path?.join('.') || '(root)';
    switch (update.kind) {
      case 'E':
        console.log(chalk.blueBright(`✏️  Change at: ${path}`));
        console.log(`From: ${JSON.stringify(update.lhs)}`);
        console.log(`To: ${JSON.stringify(update.rhs)}`);
        break;
      case 'N':
        console.log(chalk.greenBright(`➕ Addition at: ${path}`));
        console.log(`Value: ${JSON.stringify(update.rhs)}\n`);
        break;
      case 'D':
        console.log(chalk.redBright(`❌ Removed at: ${path}`));
        console.log(`Old value: ${JSON.stringify(update.lhs)}\n`);
        break;
      default:
        console.log(chalk.gray(`Unhandled change type at ${path}`));
    }
  });
}
