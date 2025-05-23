"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareAPIs = compareAPIs;
const deep_diff_1 = require("deep-diff");
const chalk_1 = __importDefault(require("chalk"));
function compareAPIs(initial, current) {
    const drift = (0, deep_diff_1.diff)(initial, current);
    if (!drift) {
        console.log(chalk_1.default.bold.bgWhite.greenBright('✅ No drift detected!'));
        return;
    }
    console.log(chalk_1.default.yellow.bold('\n⚠️ Drift detected:\n'));
    drift.forEach((update) => {
        const path = change.path?.join('.') || '(root)';
        switch (update.kind) {
            case 'E':
                console.log(chalk_1.default.blueBright(`✏️  Change at: ${path}`));
                console.log(`From: ${JSON.stringify(update.lhs)}`);
                console.log(`To: ${JSON.stringify(update.rhs)}`);
                break;
            case 'N':
                console.log(chalk_1.default.greenBright(`➕ Addition at: ${path}`));
                console.log(`Value: ${JSON.stringify(update.rhs)}\n`);
                break;
            case 'D':
                console.log(chalk_1.default.redBright(`❌ Removed at: ${path}`));
                console.log(`Old value: ${JSON.stringify(update.lhs)}\n`);
                break;
            default:
                console.log(chalk_1.default.gray(`Unhandled change type at ${path}`));
        }
    });
}
