#!/usr/bin/env node
import yargs from 'yargs';
import { Project, ScriptTarget, SyntaxKind } from "ts-morph";
import * as fs from 'fs';
import path from 'path';
import { compareAPIs } from './drift'

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

