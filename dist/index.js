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
const ts_morph_1 = require("ts-morph");
const fs = __importStar(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
// Anne -> This reads the .env file in the project root and loads key-value pairs into process.env.
const inquirer_1 = __importDefault(require("inquirer"));
// const cliArgs = yargs(process.argv.slice(2)).parse();
const userProjectRoot = process.cwd();
dotenv_1.default.config({ path: path_1.default.join(userProjectRoot, '.env') });
async function scanSalmon() {
    const tsConfigPath = path_1.default.resolve(userProjectRoot, 'tsconfig.json');
    console.log(tsConfigPath);
    console.log('User project root:', userProjectRoot);
    console.log('Looking for tsconfig at:', tsConfigPath);
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
    const arrayofAPIURLs = [];
    const arrayofFetchAPIs = [];
    for (const sourceFile of source) {
        const calls = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.CallExpression); //gets all call expressions
        const variableDeclarations = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.VariableDeclaration);
        for (const https of variableDeclarations) {
            const urlString = https.getInitializer();
            if (urlString && urlString.getKind() === ts_morph_1.SyntaxKind.StringLiteral) {
                const value = urlString.getText().replace(/^['"`]|['"`]$/g, '');
                if (value.startsWith('http')) {
                    // console.log(`🔍 Found API URL: '${value}'`);
                    arrayofAPIURLs.push(value);
                }
            }
            // 
            for (const c of calls) {
                const expr = c.getExpression(); //reads each call expression found
                const isDirectFetch = expr.getText() === 'fetch'; //these 3 lines will check for the type of call expression
                const isWindowFetch = expr.getText() === 'window.fetch';
                const isGlobalFetch = expr.getText() === 'globalThis.fetch';
                // console.log('testing if this will log')
                // console.log('c:', c)
                if (isDirectFetch || isWindowFetch || isGlobalFetch) {
                    //if it matches, get the text and write it to a json object file
                    const code = c.getText(); // build in TS-Morph more appropriate?? seeing .getArguments();
                    // console.log('code:', code)
                    // ANNE CODE BLOCK
                    let headers = {};
                    //Extract headers from fetch second argument (if present)
                    const args = c.getArguments();
                    // Grab the second argument (the options object), like { headers: { ... } }
                    // args[0] = "https://api.example.com"
                    // args[1] = { method: "GET", headers: { ... } }
                    // console.log('ARGS:', args)
                    const arg0 = args[0];
                    // console.log('Kind:', arg0.getKindName());
                    // console.log('Text:', arg0.getText());
                    if (arg0.getKind() === ts_morph_1.SyntaxKind.Identifier) {
                        const identifier = arg0.asKindOrThrow(ts_morph_1.SyntaxKind.Identifier);
                        const defs = identifier.getDefinitionNodes();
                        // const defs = arg0.getDefinitionNodes();
                        for (const def of defs) {
                            if (def.getKind() === ts_morph_1.SyntaxKind.VariableDeclaration) {
                                const varDecl = def.asKindOrThrow(ts_morph_1.SyntaxKind.VariableDeclaration);
                                const init = varDecl.getInitializer();
                                if (init?.getKind() === ts_morph_1.SyntaxKind.StringLiteral) {
                                    const url = init.getText().replace(/^['"`]|['"`]$/g, '');
                                    console.log('✅ Resolved from identifier:', url);
                                    if (!arrayofFetchAPIs.includes(url)) {
                                        arrayofFetchAPIs.push(url);
                                    }
                                }
                                else {
                                    console.warn('⚠️ Could not resolve literal for identifier:', arg0.getText());
                                }
                            }
                        }
                    }
                    // console.log('array of Fetch API URLs:', arrayofFetchAPIs)
                    // DOES NOT WORK RIGHT NOW
                    if (args[1] &&
                        args[1].getKind() === ts_morph_1.SyntaxKind.ObjectLiteralExpression) {
                        // if it exists and is an object literal
                        console.log('args[1] is obj lit');
                        const options = args[1];
                        const headersProp = options.getProperty('headers'); // grabbing header from the object literal
                        if (headersProp &&
                            headersProp.getKind() === ts_morph_1.SyntaxKind.PropertyAssignment) {
                            // if it exists and is an object, get contents of the hearder object
                            const initializer = headersProp.getInitializerIfKind(ts_morph_1.SyntaxKind.ObjectLiteralExpression);
                            console.log('Header value:', initializer);
                            if (initializer) {
                                for (const prop of initializer.getProperties()) {
                                    {
                                        // loop through the key-value pairs of that object
                                        if (prop.getKind() === ts_morph_1.SyntaxKind.PropertyAssignment) {
                                            const assignment = prop;
                                            const name = assignment.getName().replace(/^['"`]|['"`]$/g, '');
                                            const init = assignment.getInitializer(); // to be understood further
                                            // ^^ .getInitializer() gets the value of the prop which would be "Authorization": process.env.API_KEY
                                            if (init?.getKind() === ts_morph_1.SyntaxKind.StringLiteral) {
                                                headers[name] = init
                                                    .getText()
                                                    .replace(/^['"`]|['"`]$/g, '');
                                            }
                                            if (init?.getText().startsWith('process.env.')) {
                                                const envVar = init.getText().split('.').pop();
                                                if (envVar && process.env[envVar]) {
                                                    headers[name] = process.env[envVar];
                                                    console.log('header found:', headers[name]);
                                                }
                                                else {
                                                    console.warn(`⚠️ Environment variable '${envVar}' is not defined. Prompting user...`);
                                                }
                                                if (envVar) {
                                                    const response = await inquirer_1.default.prompt([
                                                        {
                                                            type: 'password',
                                                            name: 'value',
                                                            message: `Enter value for environment variable "${envVar}`,
                                                            mask: '*',
                                                        },
                                                    ]);
                                                    headers[name] = response.value;
                                                    process.env[envVar] = response.value; //sets it in memory for later use
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            // if statement to check if variable is in env
                            // have considered api key within header
                            // NOTE TO USER - if key is exposed - console log the warning - suggest making it a .env variable
                            // const apiURLGrab = code.match(/fetch\(['"](.+?)['"]/);
                            // const apiURLGrab = code.match(/fetch\s*\(\s*['"]([^'"]+)['"]/);
                            // console.log('apiURLGrab:', apiURLGrab);
                            // if (apiURLGrab) {
                            //   const apiURL = apiURLGrab[1];
                            //   console.log('apiURL =', apiURL);
                            //   // the word fetch would be the [0] the url is the [1]
                            //   try {
                            //     const response = await fetch(apiURL, { headers });
                            //     const data = await response.json();
                            //     console.log(`Response data from ${apiURL}:`, data);
                            //     fileFolder(data as Record<string, unknown>);
                            //   } catch (error) {
                            //     console.error(`Error making test call to ${apiURL}:`, error);
                            //   }
                            // }
                        }
                    }
                    // else {
                    //   const response = await inquirer.prompt([
                    //     {
                    //       type: 'password',
                    //       name: 'value',
                    //       message: `Enter key for environment variable "URL"`, //! define URL
                    //       mask: '*',
                    //     },
                    //   ]);
                    // headers[name] = response.value;
                    // process.env[envVar] = response.value; //sets it in memory for later use
                }
            }
        }
    }
    console.log('array of api URLs from variable declarations:', arrayofAPIURLs);
    console.log('array of api URLs from fetch:', arrayofFetchAPIs);
}
// }
scanSalmon();
