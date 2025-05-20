import { diff, Diff } from 'deep-diff';

type JSONObj = Record<string, unknown>;

export function compareAPIs(initial: JSONObj, current: JSONObj): void {
    const drift: Diff<JSONObj, JSONObj>[] | undefined = diff(initial, current);
    if (!drift){
        console.log("no drift detected!");
        return
    }
    console.log('Drift detected: \n');

    
    drift.forEach((update) => {
        const path = change.path?.join('.') || '(root)';
        switch (update.kind) {
            case 'E':
                console.log(`Change found: ${path}`);
                console.log(`From: ${JSON.stringify(update.lhs)}`);
                console.log(`To: ${JSON.stringify(update.rhs)}`);
                break;
            case 'N':
                console.log(`Addition was made: ${path}`);
                console.log(`Value: ${JSON.stringify(update.rhs)}\n`);
                break;
            case 'D':
                console.log(chalk.red(`Removed: ${path}`));
                console.log(`Old value: ${JSON.stringify(update.lhs)}\n`);
                break;   
        }
    });
}        