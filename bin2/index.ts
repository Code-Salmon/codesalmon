#!/usr/bin/env node
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
import path from 'path';
import fetch from 'node-fetch';
import { fileFolder } from './filecontracts';
import dotenv from 'dotenv';
// Anne -> This reads the .env file in the project root and loads key-value pairs into process.env.
import inquirer from 'inquirer';

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
  const arrayofAPIURLs = [];
  const arrayofFetchAPIs: string[] = [];
  for (const sourceFile of source) {
    const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression); //gets all call expressions

    const variableDeclarations = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration);
    
    for (const https of variableDeclarations){
      const urlString = https.getInitializer();
      if (urlString && urlString.getKind() === SyntaxKind.StringLiteral){
        const value = urlString.getText().replace(/^['"`]|['"`]$/g, ''); 
        if (value.startsWith('http')) {
          // console.log(`🔍 Found API URL: '${value}'`);
          arrayofAPIURLs.push(value)
          
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
        let headers: Record<string, string> = {};
        //Extract headers from fetch second argument (if present)
        const args = c.getArguments();
        // Grab the second argument (the options object), like { headers: { ... } }
        // args[0] = "https://api.example.com"
        // args[1] = { method: "GET", headers: { ... } }
        // console.log('ARGS:', args)
        const arg0 = args[0];
        // console.log('Kind:', arg0.getKindName());
        // console.log('Text:', arg0.getText());
        if (arg0.getKind() === SyntaxKind.Identifier) {
          const identifier = arg0.asKindOrThrow(SyntaxKind.Identifier);
          const defs = identifier.getDefinitionNodes();
          // const defs = arg0.getDefinitionNodes();
        
          for (const def of defs) {
            if (def.getKind() === SyntaxKind.VariableDeclaration) {
              const varDecl = def.asKindOrThrow(SyntaxKind.VariableDeclaration);
              const init = varDecl.getInitializer();
        
              if (init?.getKind() === SyntaxKind.StringLiteral) {
                const url = init.getText().replace(/^['"`]|['"`]$/g, '');
                console.log('✅ Resolved from identifier:', url);
                
                if(!arrayofFetchAPIs.includes(url)) {
                  arrayofFetchAPIs.push(url);
                }
                
              } else {
                console.warn('⚠️ Could not resolve literal for identifier:', arg0.getText());
              }
            }
          }
        }
        // console.log('array of Fetch API URLs:', arrayofFetchAPIs)
        // DOES NOT WORK RIGHT NOW
        if (
          args[1] &&
          args[1].getKind() === SyntaxKind.ObjectLiteralExpression
        ) {
          // if it exists and is an object literal
          console.log('args[1] is obj lit')
          const options = args[1] as ObjectLiteralExpression;
          const headersProp = options.getProperty('headers'); // grabbing header from the object literal

          if (
            headersProp &&
            headersProp.getKind() === SyntaxKind.PropertyAssignment
          ) {
            // if it exists and is an object, get contents of the hearder object
            const initializer = (
              headersProp as PropertyAssignment
            ).getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);
            console.log('Header value:', initializer)
            if (initializer) {
              for (const prop of initializer.getProperties()) {
                {
                  // loop through the key-value pairs of that object
                  if (prop.getKind() === SyntaxKind.PropertyAssignment) {
                    const assignment = prop as PropertyAssignment;
                    const name = assignment.getName().replace(/^['"`]|['"`]$/g, '');
                    const init = assignment.getInitializer(); // to be understood further
                    // ^^ .getInitializer() gets the value of the prop which would be "Authorization": process.env.API_KEY

                    if (init?.getKind() === SyntaxKind.StringLiteral) {
                      headers[name] = init
                        .getText()
                        .replace(/^['"`]|['"`]$/g, '');
                    }

                    if (init?.getText().startsWith('process.env.')) {
                      const envVar = init.getText().split('.').pop();

                      if (envVar && process.env[envVar]) {
                        headers[name] = process.env[envVar]!;
                        console.log('header found:', headers[name])
                      } else {
                        console.warn(
                          `⚠️ Environment variable '${envVar}' is not defined. Prompting user...`
                        );
                      }
                      if (envVar){
                        const response = await inquirer.prompt([
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
  console.log('array of api URLs from fetch:', arrayofFetchAPIs)
}
// }
scanSalmon();
