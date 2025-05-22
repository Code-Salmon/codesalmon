import { diff, Diff } from 'deep-diff';

type JSONObj = Record<string, unknown>;

export function compareAPIs(initial: JSONObj, current: JSONObj): void {
    const drift: Diff<JSONObj, JSONObj>[] | undefined = diff(initial, current);
    if (!drift || drift.length === 0) {
        // No drift detected
        console.log("no drift detected!");
        return;
    }
    console.log('Drift detected: \n');
    
    for (const change of drift) {
        const path = change.path?.join('.') || '(root)';
        switch (change.kind) {
            case 'E':
                console.log(`Change found: ${path}`);
                console.log(`From: ${JSON.stringify(change.lhs)}`); //
                console.log(`To: ${JSON.stringify(change.rhs)}`);
                break;
            case 'N':
                console.log(`Addition was made: ${path}`);
                console.log(`Value: ${JSON.stringify(change.rhs)}\n`);
                break;
            case 'D':
                console.log(`Removed: ${path}`);
                console.log(`Old value: ${JSON.stringify(change.lhs)}\n`);
                break;   
            case 'A':
                console.log(`Array change detected: ${path}`);
                console.log(`Index: ${change.index}`);
                console.log(`Item: ${JSON.stringify(change.item)}\n`);
                break;
        }
    }
}        