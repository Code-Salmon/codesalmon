"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareAPIs = compareAPIs;
const deep_diff_1 = require("deep-diff");
function compareAPIs(initial, current) {
    const drift = (0, deep_diff_1.diff)(initial, current);
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
