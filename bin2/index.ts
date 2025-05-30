#!/usr/bin/env node
import dotenv from 'dotenv';
import path from 'path';
import yargs from 'yargs';
import {
  Project,
  ScriptTarget,
  SyntaxKind,
  ObjectLiteralExpression,
  PropertyAssignment,
  Identifier
} from 'ts-morph';
import * as fs from 'fs';
import fetch from 'node-fetch';
import { fileFolder } from './filecontracts';
// Anne -> This reads the .env file in the project root and loads key-value pairs into process.env.
import inquirer from 'inquirer';

interface APIKeys {
  [key: string]: string | undefined;
}

// const cliArgs = yargs(process.argv.slice(2)).parse();
const userProjectRoot = process.cwd();

dotenv.config({ path: path.join(userProjectRoot, '.env') });

async function scanSalmon() {

  const tsConfigPath = path.resolve(userProjectRoot, 'tsconfig.json');
  console.log(tsConfigPath);

  console.log('User project root:', userProjectRoot);
  console.log('Looking for tsconfig at:', tsConfigPath);

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
  const arrayofAPIURLs: string[] = [];
  const objofAPIKeys: APIKeys = {};
  
  for (const sourceFile of source) {
    const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression); //gets all call expressions
    const variableDeclarations = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration); // gets all variable dec.
  

    for (const https of variableDeclarations){
      const urlString = https.getInitializer();

      if (urlString && urlString.getKind() === SyntaxKind.StringLiteral){
        const value = urlString.getText().replace(/^['"`]|['"`]$/g, ''); 

        if (value.startsWith('http')) {
          console.log(`🔍 Found API URL: '${value}'`);
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
         console.log('enVarName:', envVarName);
         } catch (error) {
            console.error('Error in PropertyAccessExpression:', error);
          }
        }
      }
    }
// { url: key }
// obj.url + obj.url.value

    console.log("objofAPIKeys:", objofAPIKeys)
    console.log('array of api URLs from variable declarations:', arrayofAPIURLs);
  }

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