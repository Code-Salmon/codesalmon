"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareAPIs = compareAPIs;
const deep_diff_1 = require("deep-diff");
const chalk_1 = __importDefault(require("chalk"));
const cfonts = __importStar(require("cfonts"));
// function to use cfonts for messaging
function displayMessage(message, colors) {
    cfonts.say(message, {
        font: 'chrome',
        align: 'left',
        colors,
        background: 'transparent',
        letterSpacing: 1, // Define letter spacing
        lineHeight: 1, // Define the line height
        space: true, // Add space between letters
        maxLength: '0', // Define max length of output string
        rawMode: false, // define if the line breaks should be CR(`\r\n`) over the default LF (`\n`)
        env: 'node',
        independentGradient: false, // Apply gradient across all lines
        transitionGradient: false
    });
}
function compareAPIs(initial, current) {
    const drift = (0, deep_diff_1.diff)(initial, current);
    if (!drift) {
        displayMessage('No drift detected!', ['#3fff3f', '#00b400', '#005a00']);
        return;
    }
    displayMessage('Drift detected!', ['red', '#D16002', 'red']);
    drift.forEach((update) => {
        const path = update.path?.join('.') || '(root)';
        switch (update.kind) {
            case 'E':
                console.log(chalk_1.default.bold.redBright(`Change at: ${chalk_1.default.italic.underline(path)}`));
                console.log(chalk_1.default.blue(`From: ${JSON.stringify(update.lhs)}`));
                console.log(chalk_1.default.yellow(`To: ${JSON.stringify(update.rhs)}`));
                break;
            case 'N':
                console.log(chalk_1.default.bold.redBright(`Addition at: ${chalk_1.default.italic.underline(path)}`));
                console.log(chalk_1.default.yellow(`Value: ${JSON.stringify(update.rhs)}\n`));
                break;
            case 'D':
                console.log(chalk_1.default.bold.redBright(`Removed at: ${chalk_1.default.italic.underline(path)}`));
                console.log(chalk_1.default.yellow(`Old value: ${JSON.stringify(update.lhs)}\n`));
                break;
            default:
                console.log(chalk_1.default.yellow(`Unhandled change type at ${chalk_1.default.italic.underline(path)}`));
        }
    });
}
