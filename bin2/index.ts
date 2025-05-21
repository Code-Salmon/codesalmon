#!/usr/bin/env node
import yargs from 'yargs';
import { Project, ScriptTarget, SyntaxKind } from "ts-morph";
import * as fs from 'fs';

const path = yargs(process.argv.slice(2)).parse();

const project = fs.existsSync("tsconfig.json") //if tsconfig.json exists, scan files from this source
  ? new Project({ tsConfigFilePath: `${path}/tsconfig.json` })
  : new Project(); 

if (!fs.existsSync("tsconfig.json")) {
  project.addSourceFilesAtPaths("src/**/*.ts"); //backup pattern to scan files if no tsconfig.json file found in user's code
}

const source = project.getSourceFiles();
// console.log(sourceFiles)
source.forEach((sourceFile) => {
  const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression); //gets all call expressions

  calls.forEach((c) => {
    const expr = c.getExpression(); //reads each call expression found

    const isDirectFetch = expr.getText() === 'fetch'; //these 3 lines will check for the type of call expression
    const isWindowFetch = expr.getText() === 'window.fetch';
    const isGlobalFetch = expr.getText() === 'globalThis.fetch';

    if (isDirectFetch || isWindowFetch || isGlobalFetch) {
      //if it matches, get the text and write it to a json object file
      const filePath = sourceFile.getFilePath();
      const code = c.getText();

      if (!fs.existsSync('codeToScan.json')) {
        //check if file already written so its not rewritten

        fs.writeFile('codeToScan.json', code, (err) => {
          if (err) {
            console.error('An error occurred:', err);
          } else {
            console.log('File written successfully!');
          }
        });
      } else {
        fs.appendFile('codeToScan.json', code, (err) => {
          //append new data if file already exists
          if (err) {
            console.error('An error occurred:', err);
          } else {
            console.log('File written successfully!');
          }
        });
      }
    }
  });
});




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