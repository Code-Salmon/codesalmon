#!/usr/bin/env node
// import yargs from 'yargs';
// ANNE -> added after SyntaxKind
import { Project, ScriptTarget, SyntaxKind, ObjectLiteralExpression, PropertyAssignment } from 'ts-morph';
import * as fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { fileFolder } from './filecontracts';
// const cliArgs = yargs(process.argv.slice(2)).parse();
// Anne -> npm install dotenv
// Anne -> This reads the .env file in the project root and loads key-value pairs into process.env.
import dotenv from 'dotenv';



dotenv.config();

async function scanSalmon() {
  const userProjectRoot = process.cwd();
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

  for (const sourceFile of source) {
    const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression); //gets all call expressions

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
        console.log('code', code);
        // ANNE CODE BLOCK
        let headers: Record<string, string> = {};
        //Extract headers from fetch second argument (if present)
        const args = c.getArguments();
        // Grab the second argument (the options object), like { headers: { ... } }
        // args[0] = "https://api.example.com"
        // args[1] = { method: "GET", headers: { ... } }
        if (args[1] && args[1].getKind() === SyntaxKind.ObjectLiteralExpression) { // if it exists and is an object literal
          const options = args[1] as ObjectLiteralExpression;
          const headersProp = options.getProperty('headers'); // grabbing header from the object literal

          if (headersProp && headersProp.getKind() === SyntaxKind.PropertyAssignment) { // if it exists and is an object, get contents of the hearder object
            const initializer = (headersProp as PropertyAssignment).getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);
            initializer?.getProperties().forEach((prop) => { // loop through the key-value pairs of that object
              if (prop.getKind() === SyntaxKind.PropertyAssignment) { 
                const name = prop.getName().replace(/^['"`]|['"`]$/g, ''); // removes quotes from the name
                const init = prop.getInitializer(); // to be understood further
                // ^^ .getInitializer() gets the value of the prop which would be "Authorization": process.env.API_KEY

                if (init?.getKind() === SyntaxKind.StringLiteral) {
                  headers[name] = init.getText().replace(/^['"`]|['"`]$/g, '');
                }

                if (init?.getText().startsWith('process.env.')) {
                  const envVar = init.getText().split('.').pop();
                  if (envVar && process.env[envVar]) {
                    headers[name] = process.env[envVar]!;
                  } else {
                    console.warn(`⚠️ Environment variable '${envVar}' is not defined in .env`);
                  }
                }
              }
            });
          }
        }
        // if statement to check if variable is in env
        // have considered api key within header 
        // NOTE TO USER - if key is exposed - console log the warning - suggest making it a .env variable

        // const apiURLGrab = code.match(/fetch\(['"](.+?)['"]/);
        const apiURLGrab = code.match(/fetch\s*\(\s*['"]([^'"]+)['"]/);

        console.log('apiURLGrab:', apiURLGrab);
        if (apiURLGrab) {
          const apiURL = apiURLGrab[1];
          console.log('apiURL =', apiURL);
          // the word fetch would be the [0] the url is the [1]
          try {
            const response = await fetch(apiURL);

            const data = await response.json();
            console.log(`Response data from ${apiURL}:`, data);
            fileFolder(data as Record<string, unknown>);
          } catch (error) {
            console.error(`Error making test call to ${apiURL}:`, error);
          }
        }
      }
    }
  }
}

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
