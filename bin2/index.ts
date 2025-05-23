#!/usr/bin/env node
import yargs from 'yargs';
import { Project, ScriptTarget, SyntaxKind } from "ts-morph";
import * as fs from 'fs';
import path from 'path';
<<<<<<< HEAD
import fetch from 'node-fetch';
import { fileFolder } from './filecontracts';
=======
import { compareAPIs } from './drift'
>>>>>>> 08410b5633b4936e33091ee5c980469ea117d671

const cliArgs = yargs(process.argv.slice(2)).parse();

const userProjectRoot = process.cwd();
const tsConfigPath = path.resolve(userProjectRoot, 'tsconfig.json');
console.log(tsConfigPath);

console.log("User project root:", userProjectRoot);
console.log("Looking for tsconfig at:", tsConfigPath);

let project: Project;

if (fs.existsSync(tsConfigPath)) {
  console.log("Found tsconfig.json, loading project from it...");
  project = new Project({ tsConfigFilePath: tsConfigPath });
} else {
  console.log("No tsconfig.json found in root, scanning all .ts files in project...");
  project = new Project();
  project.addSourceFilesAtPaths([
  path.join(userProjectRoot, '**/*.ts'),
  '!' + path.join(userProjectRoot, 'node_modules/**/*'),
]);
}

const source = project.getSourceFiles();
console.log('Source:', source)

<<<<<<< HEAD
source.forEach((sourceFile) => {
  const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression); //gets all call expressions

    calls.forEach(async (c) => {
    const expr = c.getExpression(); //reads each call expression found

    const isDirectFetch = expr.getText() === 'fetch'; //these 3 lines will check for the type of call expression
    const isWindowFetch = expr.getText() === 'window.fetch';
    const isGlobalFetch = expr.getText() === 'globalThis.fetch';

    if (isDirectFetch || isWindowFetch || isGlobalFetch) {
      //if it matches, get the text and write it to a json object file
      const code = c.getText();
      const apiURLGrab = code.match(/fetch\(['"](.+?)['"]/);
      if(apiURLGrab) {
        const apiURL = apiURLGrab[1];
        // the word fetch would be the [0] the url is the [1]
        try {
      const response = await fetch(apiURL)
      const data = await response.json();
      console.log(`Response data from ${apiURL}:`, data);
        fileFolder(data as Record<string, unknown>);
          } catch (error) {
            console.error(`Error making test call to ${apiURL}:`, error)
        }}}
      }
)})


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
=======
>>>>>>> 08410b5633b4936e33091ee5c980469ea117d671
