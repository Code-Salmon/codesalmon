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
  Identifier
} from 'ts-morph';
import * as fs from 'fs';
import fetch from 'node-fetch';
import { writeTheFile } from './filecontracts';
import { compareAPIs, boxedLog, JSONObj } from './drift';
import chalk from 'chalk';
import { execSync } from 'child_process';
// Anne -> This reads the .env file in the project root and loads key-value pairs into process.env.
import inquirer from 'inquirer';

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

async function scanSalmon() {
  
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
        if (urlArg.getKind() === SyntaxKind.StringLiteral) {
          url = urlArg.getText().replace(/^['"`]|['"`]$/g, '');
        } else if (urlArg.getText().includes('process.env.')) {
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
async function swimSalmon() {
  try {
    console.log(chalk.blue('🐟 Starting swimSalmon...'));

    // Step 1: Find API calls
    const discoveredAPIs = await scanSalmon(); // Ensure this returns FetchCallData[]
    console.log(chalk.green('✅ API scan complete.'));

    // Step 2: Write baseline results
    await writeTheFile(discoveredAPIs); // This creates `.apiRestContracts.json`
    console.log(chalk.green('✅ API snapshot written.'));

    // Step 3: Load saved data
    const topLevelPath = execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
    const filePath = path.join(topLevelPath, '.apiRestContracts.json');
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const baselineData = JSON.parse(rawData);

    // Step 4: Re-fetch and compare
    for (const api of baselineData) {
      const url = api.resolvedUrl;
      const prev = api[url];
      const liveCall = await fetch(url);

      if (!liveCall.ok) {
        console.warn(chalk.yellow(`⚠️ Could not re-fetch ${url}: ${liveCall.status}`));
        continue;
      }

      const current = (await liveCall.json()) as JSONObj;
      boxedLog(chalk.blue(`🔍 Comparing drift for ${url}`), () => {
        compareAPIs(prev, current);
      });

    }

    console.log(chalk.cyan('🏁 swimSalmon complete.'));
  } catch (error) {
    console.error(chalk.red('❌ Error in swimSalmon:'), error);
  }
}

    // https://api.nasa.gov/planetary/apod?api_key=4Ft01vTgsi4Gp07fqeIlcrjaGJ0AO3fz1KHQaL8m

// {
//     "date": "2025-05-28",
//     "explanation": "This might look like a double-bladed lightsaber, but these two cosmic jets actually beam outward from a newborn star in a galaxy near you. Constructed from Hubble Space Telescope image data, the stunning scene spans about half a light-year across Herbig-Haro 24 (HH 24), some 1,300 light-years or 400 parsecs away in the stellar nurseries of the Orion B molecular cloud complex. Hidden from direct view, HH 24's central protostar is surrounded by cold dust and gas flattened into a rotating accretion disk. As material from the disk falls toward the young stellar object, it heats up. Opposing jets are blasted out along the system's rotation axis. Cutting through the region's interstellar matter, the narrow, energetic jets produce a series of glowing shock fronts along their path.",
//     "hdurl": "https://apod.nasa.gov/apod/image/2505/hs-2015-42-a-fullHH24.jpg",
//     "media_type": "image",
//     "service_version": "v1",
//     "title": "Herbig-Haro 24",
//     "url": "https://apod.nasa.gov/apod/image/2505/hs-2015-42-a-largeHH241024.jpg"
// }
