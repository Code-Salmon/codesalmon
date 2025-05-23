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
const node_fetch_1 = __importDefault(require("node-fetch"));
const filecontracts_1 = require("./filecontracts");
const cliArgs = (0, yargs_1.default)(process.argv.slice(2)).parse();
function scanSalmon() {
    const userProjectRoot = process.cwd();
    const tsConfigPath = path_1.default.resolve(userProjectRoot, 'tsconfig.json');
    console.log(tsConfigPath);
    console.log("User project root:", userProjectRoot);
    console.log("Looking for tsconfig at:", tsConfigPath);
    let project;
    if (fs.existsSync(tsConfigPath)) {
        console.log("Found tsconfig.json, loading project from it...");
        project = new ts_morph_1.Project({ tsConfigFilePath: tsConfigPath });
    }
    else {
        console.log("No tsconfig.json found in root, scanning all .ts files in project...");
        project = new ts_morph_1.Project();
        project.addSourceFilesAtPaths([
            path_1.default.join(userProjectRoot, '**/*.ts'),
            '!' + path_1.default.join(userProjectRoot, 'node_modules/**/*'),
        ]);
    }
    const source = project.getSourceFiles();
    // console.log('Source:', source)
    source.forEach(async (sourceFile) => {
        const calls = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.CallExpression); //gets all call expressions
        calls.forEach(async (c) => {
            const expr = c.getExpression(); //reads each call expression found
            const isDirectFetch = expr.getText() === 'fetch'; //these 3 lines will check for the type of call expression
            const isWindowFetch = expr.getText() === 'window.fetch';
            const isGlobalFetch = expr.getText() === 'globalThis.fetch';
            // console.log('testing if this will log')
            // console.log('c:', c)
            if (isDirectFetch || isWindowFetch || isGlobalFetch) {
                //if it matches, get the text and write it to a json object file
                const code = c.getText();
                const apiURLGrab = code.match(/fetch\(['"](.+?)['"]/);
                console.log(apiURLGrab);
                if (apiURLGrab) {
                    const apiURL = apiURLGrab[1];
                    // the word fetch would be the [0] the url is the [1]
                    try {
                        const response = await (0, node_fetch_1.default)(apiURL);
                        const data = await response.json();
                        console.log(`Response data from ${apiURL}:`, data);
                        (0, filecontracts_1.fileFolder)(data);
                    }
                    catch (error) {
                        console.error(`Error making test call to ${apiURL}:`, error);
                    }
                }
            }
        });
    });
}
;
scanSalmon();
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
