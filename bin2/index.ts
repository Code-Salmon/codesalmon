#!/usr/bin/env node
import yargs from 'yargs';
import { Project, ScriptTarget, SyntaxKind } from "ts-morph";
import * as fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { fileFolder } from './filecontracts';

const cliArgs = yargs(process.argv.slice(2)).parse();

const tsConfigPath = path.resolve(__dirname, '../tsconfig.json');
console.log(tsConfigPath);

const project = fs.existsSync("tsconfig.json") //if tsconfig.json exists, scan files from this source
  ? new Project({ tsConfigFilePath: tsConfigPath })
  : new Project(); 

console.log("Checking tsconfig.json existence...");
console.log("fs.existsSync('tsconfig.json'):", fs.existsSync('./tsconfig.json'));

// if (!fs.existsSync("tsconfig.json")) {
//   project.addSourceFilesAtPaths("src/**/*.ts"); //!backup pattern to scan files if no tsconfig.json file found in user's code
// }

const source = project.getSourceFiles();
console.log('Source:', source)

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