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
exports.scanSalmon = scanSalmon;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const ts_morph_1 = require("ts-morph");
const fs = __importStar(require("fs"));
const userProjectRoot = process.cwd();
dotenv_1.default.config({ path: path_1.default.join(userProjectRoot, '.env') });
const fetchCalls = [];
const arrayofAPIURLs = [];
const objofAPIKeys = {};
async function scanSalmon() {
    const tsConfigPath = path_1.default.resolve(userProjectRoot, 'tsconfig.json');
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
            const args = c.getArguments();
            const urlArg = args[0];
            let url;
            let apiKeyVar;
            // Extract the URL or environment-based URL
            if (urlArg) {
                const kind = urlArg.getKind();
                if (kind === ts_morph_1.SyntaxKind.StringLiteral) {
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
                else if (kind === ts_morph_1.SyntaxKind.Identifier) {
                    // Try to resolve the variable declaration
                    const symbol = urlArg.getSymbol();
                    const decl = symbol?.getDeclarations()?.[0];
                    if (decl?.getKind() === ts_morph_1.SyntaxKind.VariableDeclaration) {
                        const initializer = decl.getInitializer();
                        if (initializer?.getKind() === ts_morph_1.SyntaxKind.StringLiteral) {
                            url = initializer.getText().replace(/^['"`]|['"`]$/g, '');
                        }
                        else if (initializer?.getKind() === ts_morph_1.SyntaxKind.BinaryExpression) {
                            const binaryExpr = initializer.asKind(ts_morph_1.SyntaxKind.BinaryExpression);
                            const left = binaryExpr?.getLeft();
                            const right = binaryExpr?.getRight();
                            const url = binaryExpr?.getText();
                            // Look for process.env.* on either side
                            const envMatch = url?.match(/process\.env\.([A-Z0-9_]+)/i);
                            if (envMatch) {
                                apiKeyVar = envMatch[1];
                            }
                            // 🆕 Check if one side is an Identifier like apiKeyVar (not process.env)
                            if (right?.getKind() === ts_morph_1.SyntaxKind.Identifier) {
                                const varName = right.getText();
                                apiKeyVar = process.env[varName];
                            }
                            else if (left?.getKind() === ts_morph_1.SyntaxKind.Identifier) {
                                const varName = left.getText();
                                apiKeyVar = varName;
                            }
                            const leftText = left?.getText().replace(/^['"`]|['"`]$/g, '') ?? '';
                            const resolvedUrl = leftText + (apiKeyVar ?? '');
                            fetchCalls.push({ url, apiKeyVar, resolvedUrl });
                        }
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
        }
        for (const https of variableDeclarations) {
            const urlString = https.getInitializer();
            if (urlString && urlString.getKind() === ts_morph_1.SyntaxKind.StringLiteral) {
                const value = urlString.getText().replace(/^['"`]|['"`]$/g, '');
                if (value.startsWith('http')) {
                }
            }
            else if (urlString &&
                urlString.getKind() === ts_morph_1.SyntaxKind.PropertyAccessExpression) {
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
                }
                catch (error) {
                    console.error('Error in PropertyAccessExpression:', error);
                }
            }
        }
    }
    return fetchCalls;
} //end of scanSalmon
