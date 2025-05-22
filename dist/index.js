#!/usr/bin/env node
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
const yargs_1 = __importDefault(require("yargs"));
const ts_morph_1 = require("ts-morph");
const fs = __importStar(require("fs"));
const path_1 = __importDefault(require("path"));
const cliArgs = (0, yargs_1.default)(process.argv.slice(2)).parse();
const tsConfigPath = path_1.default.resolve(__dirname, '../tsconfig.json');
console.log(tsConfigPath);
const project = fs.existsSync("tsconfig.json") //if tsconfig.json exists, scan files from this source
    ? new ts_morph_1.Project({ tsConfigFilePath: tsConfigPath })
    : new ts_morph_1.Project();
console.log("Checking tsconfig.json existence...");
console.log("fs.existsSync('tsconfig.json'):", fs.existsSync('./tsconfig.json'));
// if (!fs.existsSync("tsconfig.json")) {
//   project.addSourceFilesAtPaths("src/**/*.ts"); //!backup pattern to scan files if no tsconfig.json file found in user's code
// }
const source = project.getSourceFiles();
console.log('Source:', source);
source.forEach((sourceFile) => {
    const calls = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.CallExpression); //gets all call expressions
    calls.forEach((c) => {
        const expr = c.getExpression(); //reads each call expression found
        const isDirectFetch = expr.getText() === 'fetch'; //these 3 lines will check for the type of call expression
        const isWindowFetch = expr.getText() === 'window.fetch';
        const isGlobalFetch = expr.getText() === 'globalThis.fetch';
        if (isDirectFetch || isWindowFetch || isGlobalFetch) {
            //if it matches, get the text and write it to a json object file
            const filePath = sourceFile.getFilePath();
            const code = c.getText();
            if (!fs.existsSync('codeToScan.json')) {
                //check if file already written so its not rewritten
                fs.writeFile('codeToScan.json', code, (err) => {
                    if (err) {
                        console.error('An error occurred:', err);
                    }
                    else {
                        console.log('File written successfully!');
                    }
                });
            }
            else {
                fs.appendFile('codeToScan.json', code, (err) => {
                    //append new data if file already exists
                    if (err) {
                        console.error('An error occurred:', err);
                    }
                    else {
                        console.log('File written successfully!');
                    }
                });
            }
        }
    });
});
// if (argv.ships > 3 && argv.distance < 53.5) {
//   console.log('Plunder more riffiwobbles!');
// } else {
//   console.log('Retreat from the xupptumblers!');
// }
// console.log(argv);
// const fetchCalls = c
//   .getDescendantsOfKind(SyntaxKind.CallExpression) //get all call expressions
//   .filter(call => {
//     const expression = call.getExpression();
//     return expression.getText() === 'fetch'; //if the call expression matches 'fetch' return it 
