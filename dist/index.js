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
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const ts_morph_1 = require("ts-morph");
const fs = __importStar(require("fs"));
const userProjectRoot = process.cwd();
dotenv_1.default.config({ path: path_1.default.join(userProjectRoot, '.env') });
const fetchCalls = [];
const arrayofAPIURLs = [];
const objofAPIKeys = {};
// const cliArgs = yargs(process.argv.slice(2)).parse();
async function scanSalmon() {
    const tsConfigPath = path_1.default.resolve(userProjectRoot, 'tsconfig.json');
    // console.log(tsConfigPath);
    // console.log('User project root:', userProjectRoot);
    // console.log('Looking for tsconfig at:', tsConfigPath);
    let project;
    if (fs.existsSync(tsConfigPath)) {
        console.log('Found tsconfig.json, loading project from it...');
        project = new ts_morph_1.Project({ tsConfigFilePath: tsConfigPath });
    }
    else {
        console.log('No tsconfig.json found in root, scanning all .ts files in project...');
        project = new ts_morph_1.Project();
        project.addSourceFilesAtPaths([
            path_1.default.join(userProjectRoot, '**/*.ts'),
            '!' + path_1.default.join(userProjectRoot, 'node_modules/**/*'),
        ]);
    }
    const source = project.getSourceFiles();
    // console.log('Source:', source)
    for (const sourceFile of source) {
        const calls = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.CallExpression); //gets all call expressions
        const variableDeclarations = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.VariableDeclaration); // gets all variable dec.
        for (const c of calls) {
            const expr = c.getExpression();
            const isFetchCall = expr.getText() === 'fetch' ||
                expr.getText() === 'window.fetch' ||
                expr.getText() === 'globalThis.fetch';
            if (!isFetchCall)
                continue;
            console.log('fetch calls:', isFetchCall);
            const args = c.getArguments();
            const urlArg = args[0];
            console.log('url arguments:', urlArg);
            let url;
            let apiKeyVar;
            // Extract the URL or environment-based URL
            if (urlArg) {
                if (urlArg.getKind() === ts_morph_1.SyntaxKind.StringLiteral) {
                    url = urlArg.getText().replace(/^['"`]|['"`]$/g, '');
                }
                else if (urlArg.getText().includes('process.env.')) {
                    const urlText = urlArg.getText();
                    url = urlText;
                    const envMatch = urlText.match(/process\.env\.([A-Z0-9_]+)/i);
                    if (envMatch) {
                        apiKeyVar = envMatch[1];
                    }
                }
            }
            // Extract the API key variable from headers
            const optionsArg = args[1];
            if (optionsArg?.getKind() === ts_morph_1.SyntaxKind.ObjectLiteralExpression) {
                const options = optionsArg;
                const headersProp = options.getProperty('headers');
                if (headersProp &&
                    headersProp.getKind() === ts_morph_1.SyntaxKind.PropertyAssignment) {
                    const initializer = headersProp.getInitializerIfKind(ts_morph_1.SyntaxKind.ObjectLiteralExpression);
                    initializer?.getProperties().forEach((prop) => {
                        if (ts_morph_1.Node.isPropertyAssignment(prop)) {
                            const name = prop.getName().replace(/^['"`]|['"`]$/g, '');
                            const init = prop.getInitializer();
                            if (init?.getText().startsWith('process.env.')) {
                                const envVar = init.getText().split('.').pop();
                                if (envVar &&
                                    (name.toLowerCase().includes('auth') ||
                                        name.toLowerCase().includes('key'))) {
                                    apiKeyVar = envVar;
                                }
                            }
                        }
                    });
                }
            }
            if (url) {
                const resolvedUrl = url?.replace(/process\.env\.([A-Z0-9_]+)/gi, (_, varName) => {
                    return process.env[varName] || `process.env.${varName}`;
                });
                fetchCalls.push({ url, apiKeyVar, resolvedUrl });
            }
        }
        console.log('Fetch Call Summary OBJ:', fetchCalls);
        // console.log('\n:package: Extracted Fetch Calls:');
        // console.table(fetchCalls);
        // const outputPath = path.join(userProjectRoot, 'fetch-api-summary.json');
        // fs.writeFileSync(outputPath, JSON.stringify(fetchCalls, null, 2));
        // console.log(`\n:white_check_mark: Summary written to: ${outputPath}`);
        for (const https of variableDeclarations) {
            const urlString = https.getInitializer();
            if (urlString && urlString.getKind() === ts_morph_1.SyntaxKind.StringLiteral) {
                const value = urlString.getText().replace(/^['"`]|['"`]$/g, '');
                if (value.startsWith('http')) {
                    // console.log(`🔍 Found API URL: '${value}'`);
                    arrayofAPIURLs.push(value);
                }
            }
            else if (urlString && urlString.getKind() === ts_morph_1.SyntaxKind.PropertyAccessExpression) {
                //  console.log('URLString:', urlString)
                try {
                    const processDec = urlString.asKindOrThrow(ts_morph_1.SyntaxKind.PropertyAccessExpression);
                    //  const processDec= processEnv.getInitializerIfKind(SyntaxKind.PropertyAccessExpression);
                    //  const env = processDec.getText(); // whole expression process.env.apikeyvar --- might nobt e 
                    const envApiVar = processDec.getExpression().getText(); // process.env
                    const envVarName = processDec.getName(); // .APIKEYVar
                    //! FINALLY GETTING API KEYS
                    if (process.env[envVarName]) {
                        objofAPIKeys[envVarName] = process.env[envVarName];
                    }
                    //  console.log('enVarName:', envVarName);
                }
                catch (error) {
                    console.error('Error in PropertyAccessExpression:', error);
                }
            }
        }
    }
    // { url: key }
    // obj.url + obj.url.value
}
// console.log("objofAPIKeys:", objofAPIKeys)
// console.log('array of api URLs from variable declarations:', arrayofAPIURLs);
// }
scanSalmon();
// For tomorrow:
// Try for a half an hour or so
// attempt to make the api calls with
// https://api.nasa.gov/planetary/apod?api_key=4Ft01vTgsi4Gp07fqeIlcrjaGJ0AO3fz1KHQaL8m
// We hardcode two different json objects
// The second one (either response or call depending on deep diff) slightly different
//* Deep diff comparison
//! This is big for the presentation, Making cool chalk response!!!
//? We can make a graph or we can just return the actual data
// {
//     "date": "2025-05-28",
//     "explanation": "This might look like a double-bladed lightsaber, but these two cosmic jets actually beam outward from a newborn star in a galaxy near you. Constructed from Hubble Space Telescope image data, the stunning scene spans about half a light-year across Herbig-Haro 24 (HH 24), some 1,300 light-years or 400 parsecs away in the stellar nurseries of the Orion B molecular cloud complex. Hidden from direct view, HH 24's central protostar is surrounded by cold dust and gas flattened into a rotating accretion disk. As material from the disk falls toward the young stellar object, it heats up. Opposing jets are blasted out along the system's rotation axis. Cutting through the region's interstellar matter, the narrow, energetic jets produce a series of glowing shock fronts along their path.",
//     "hdurl": "https://apod.nasa.gov/apod/image/2505/hs-2015-42-a-fullHH24.jpg",
//     "media_type": "image",
//     "service_version": "v1",
//     "title": "Herbig-Haro 24",
//     "url": "https://apod.nasa.gov/apod/image/2505/hs-2015-42-a-largeHH241024.jpg"
// }
// -->array of api urls + keys
// make calls
// If (E's folder does not exsist){
// invoke fun
// save respose making folder}
// if (E's folder exists && resoponse isn't in there){
// invoke fun
// save response}
// invoke drift on (folder saved, current call)
// return drift
