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

