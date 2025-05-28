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
    const objofAPIKeys = {};
    for (const sourceFile of source) {
        const calls = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.CallExpression); //gets all call expressions
        const variableDeclarations = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.VariableDeclaration); // gets all variable dec.
        for (const https of variableDeclarations) {
            const urlString = https.getInitializer();
            if (urlString && urlString.getKind() === ts_morph_1.SyntaxKind.StringLiteral) {
                const value = urlString.getText().replace(/^['"`]|['"`]$/g, '');
                if (value.startsWith('http')) {
                    console.log(`🔍 Found API URL: '${value}'`);
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
                    console.log('enVarName:', envVarName);
                }
                catch (error) {
                    console.error('Error in PropertyAccessExpression:', error);
                }
            }
        }
        // for (const c of calls) {
        //   const expr = c.getExpression(); //reads each call expression found
        //   const isDirectFetch = expr.getText() === 'fetch'; //these 3 lines will check for the type of call expression
        //   const isWindowFetch = expr.getText() === 'window.fetch';
        //   const isGlobalFetch = expr.getText() === 'globalThis.fetch';
        //   // console.log('testing if this will log')
        //   // console.log('c:', c)
        //   if (isDirectFetch || isWindowFetch || isGlobalFetch) {
        //     //if it matches, get the text and write it to a json object file
        //     const code = c.getText(); // build in TS-Morph more appropriate?? seeing .getArguments();
        //     // console.log('code:', code)
        //     //Extract headers from fetch second argument (if present)
        //     const args = c.getArguments();
        //     // console.log('ARGS:', args)
        //     if (args.length > 0) {
        //       const arg0 = args[0];
        //       if (arg0.getKind() === SyntaxKind.StringLiteral) {
        //         const apiURL = arg0.getText().replace(/^['"`]|['"`]$/g, '');
        //         console.log('Extracted API URL:', apiURL);
        //         if(!arrayofFetchAPIs.includes(apiURL)) {
        //           arrayofFetchAPIs.push(apiURL);
        //         }
        //       }
        //       else if (arg0.getKind() === SyntaxKind.Identifier) {
        //         const identifier = arg0.asKindOrThrow(SyntaxKind.Identifier);
        //         const defs = identifier.getDefinitionNodes();
        //         for (const def of defs) {
        //           if (def.getKind() === SyntaxKind.VariableDeclaration) {
        //           const varDecl = def.asKindOrThrow(SyntaxKind.VariableDeclaration);
        //           const init = varDecl.getInitializer();
        //             if (init?.getKind() === SyntaxKind.StringLiteral) {
        //             const url = init.getText().replace(/^['"`]|['"`]$/g, '');
        //             console.log('✅ Resolved from identifier:', url);
        //               if(!arrayofFetchAPIs.includes(url)) {
        //               arrayofFetchAPIs.push(url);
        //             }
        //             } else {
        //             console.warn('⚠️ Could not resolve literal for identifier:', arg0.getText());
        //           }
        //       }
        //     }
        //         } else {
        //           console.warn('Fetch call does not use a string literal or identifier for the URL:', arg0.getText());
        //         }
        //       }
        //     }
        //   }
    }
    console.log("objofAPIKeys:", objofAPIKeys);
    console.log('array of api URLs from variable declarations:', arrayofAPIURLs);
    console.log('array of api URLs from fetch:', arrayofFetchAPIs);
}
scanSalmon();
