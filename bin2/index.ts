#!/usr/bin/env node
import dotenv from 'dotenv';
import path from 'path';
import {
  Node,
  Project,
  ScriptTarget,
  SyntaxKind,
  ObjectLiteralExpression,
  PropertyAssignment,
  Identifier,
  VariableDeclaration
} from 'ts-morph';
import * as fs from 'fs';
import fetch from 'node-fetch';
import { writeTheFile } from './filecontracts';
import { compareAPIs, boxedLog, JSONObj } from './drift';
import chalk from 'chalk';
import { execSync } from 'child_process';

const userProjectRoot = process.cwd();
dotenv.config({ path: path.join(userProjectRoot, '.env') });

interface APIKeys {
  [key: string]: string | undefined;
}
// UPDATE
export type FetchCallData = {
  url: string;
  apiKeyVar?: string;
  resolvedUrl?: string;
};
const fetchCalls: FetchCallData[] = [];
const arrayofAPIURLs: string[] = [];
const objofAPIKeys: APIKeys = {};

export async function scanSalmon() {
  
  const tsConfigPath = path.resolve(userProjectRoot, 'tsconfig.json');
  // console.log(tsConfigPath);

  // console.log('User project root:', userProjectRoot);
  // console.log('Looking for tsconfig at:', tsConfigPath);

  let project: Project;

  if (fs.existsSync(tsConfigPath)) {
    console.log('Found tsconfig.json, loading project from it...');
    project = new Project({ tsConfigFilePath: tsConfigPath });
  } else {
    console.log(
      'No tsconfig.json found in root, scanning all .ts files in project...'
    );
    project = new Project();
    project.addSourceFilesAtPaths([
      path.join(userProjectRoot, '**/*.ts'),
      '!' + path.join(userProjectRoot, 'node_modules/**/*'),
    ]);
  }
  const source = project.getSourceFiles();
  // console.log('Source:', source)

  
  for (const sourceFile of source) {
    const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression); //gets all call expressions
    const variableDeclarations = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration); // gets all variable dec.
    for (const c of calls) {
      const expr = c.getExpression();
      const isFetchCall =
        expr.getText() === 'fetch' ||
        expr.getText() === 'window.fetch' ||
        expr.getText() === 'globalThis.fetch';

      if (!isFetchCall) continue;
      // console.log('fetch calls:', isFetchCall)
      const args = c.getArguments();
      const urlArg = args[0];
      // console.log('url arguments:', urlArg)
      let url: string | undefined;
      let apiKeyVar: string | undefined;

      // Extract the URL or environment-based URL
      if (urlArg) {
        // console.log('urlArg:', urlArg)
        const kind = urlArg.getKind();
        console.log('urlKind:', kind)
        
        if (kind === SyntaxKind.StringLiteral) {
          url = urlArg.getText().replace(/^['"`]|['"`]$/g, '');
        } else if (urlArg.getText().includes('process.env.')) {
          const urlText = urlArg.getText();
          url = urlText;
          console.log('url:', url)
          const envMatch = urlText.match(/process\.env\.([A-Z0-9_]+)/i);
          if (envMatch) {
            apiKeyVar = envMatch[1];
            console.log('envMatch', envMatch)
          }
        } else if (kind === SyntaxKind.Identifier) {
          // Try to resolve the variable declaration
          const symbol = urlArg.getSymbol();
          const decl = symbol?.getDeclarations()?.[0];
          if (decl?.getKind() === SyntaxKind.VariableDeclaration) {
            const initializer = (decl as VariableDeclaration).getInitializer();
            if (initializer?.getKind() === SyntaxKind.StringLiteral) {
              url = initializer.getText().replace(/^['"`]|['"`]$/g, '');
              console.log('url from Identifier:', url)
            }
            else if (initializer?.getKind() === SyntaxKind.BinaryExpression) {
              const fullUrl = initializer.getText();
              url = fullUrl;
              console.log('url from BinaryExpression:', url);

              const envMatch = fullUrl.match(/process\.env\.([A-Z0-9_]+)/i);
              if (envMatch) {
               apiKeyVar = envMatch[1];
              }
            }
          }
          
        }
        
      }
      
      // Extract the API key variable from headers
      const optionsArg = args[1];
      if (optionsArg?.getKind() === SyntaxKind.ObjectLiteralExpression) {
        const options = optionsArg as ObjectLiteralExpression;
        const headersProp = options.getProperty('headers');
        if (
          headersProp &&
          headersProp.getKind() === SyntaxKind.PropertyAssignment
        ) {
          const initializer = (
            headersProp as PropertyAssignment
          ).getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);
          initializer?.getProperties().forEach((prop) => {
            if (Node.isPropertyAssignment(prop)) {
              const name = prop.getName().replace(/^['"`]|['"`]$/g, '');
              const init = (prop as PropertyAssignment).getInitializer();
              if (init?.getText().startsWith('process.env.')) {
                const envVar = init.getText().split('.').pop();
                if (
                  envVar &&
                  (name.toLowerCase().includes('auth') ||
                    name.toLowerCase().includes('key'))
                ) {
                  apiKeyVar = envVar;
                }
              }
            }
          });
        }
      }
      if (url) {
        const resolvedUrl = url?.replace(
          /process\.env\.([A-Z0-9_]+)/gi,
          (_, varName) => {
            return process.env[varName] || `process.env.${varName}`;
          }
        );
        fetchCalls.push({ url, apiKeyVar, resolvedUrl });

      }
    } console.log('Fetch Call Summary OBJ:', fetchCalls);

  // console.log('\n:package: Extracted Fetch Calls:');
  // console.table(fetchCalls);
  // const outputPath = path.join(userProjectRoot, 'fetch-api-summary.json');
  // fs.writeFileSync(outputPath, JSON.stringify(fetchCalls, null, 2));
  // console.log(`\n:white_check_mark: Summary written to: ${outputPath}`);


    for (const https of variableDeclarations){
      const urlString = https.getInitializer();

      if (urlString && urlString.getKind() === SyntaxKind.StringLiteral){
        const value = urlString.getText().replace(/^['"`]|['"`]$/g, ''); 

        if (value.startsWith('http')) {
          // console.log(`🔍 Found API URL: '${value}'`);
          arrayofAPIURLs.push(value)
      } 
     } else if (urlString && urlString.getKind() === SyntaxKind.PropertyAccessExpression){
        //  console.log('URLString:', urlString)
         try {
         const processDec = urlString.asKindOrThrow(SyntaxKind.PropertyAccessExpression);
        //  const processDec= processEnv.getInitializerIfKind(SyntaxKind.PropertyAccessExpression);
        //  const env = processDec.getText(); // whole expression process.env.apikeyvar --- might nobt e 
         const envApiVar = processDec.getExpression().getText(); // process.env
         const envVarName = processDec.getName(); // .APIKEYVar
                                //! FINALLY GETTING API KEYS
         if(process.env[envVarName]) {
         objofAPIKeys[envVarName] = process.env[envVarName];
        }
        //  console.log('enVarName:', envVarName);
         } catch (error) {
            console.error('Error in PropertyAccessExpression:', error);
          }
        }
      }
    }
    return fetchCalls;
} //end of scanSalmon


// Helper function to invoke everything

