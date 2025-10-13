#!/usr/bin/env node
import dotenv from 'dotenv';
import path from 'path';
import {
  Node,
  Project,
  SyntaxKind,
  ObjectLiteralExpression,
  PropertyAssignment,
  VariableDeclaration,
} from 'ts-morph';
import inquirer from 'inquirer';
import * as fs from 'fs';

const userProjectRoot = process.cwd();
dotenv.config({ path: path.join(userProjectRoot, '.env') });

interface APIKeys {
  [key: string]: string | undefined;
}
export type FetchCallData = {
  url: any;
  apiKeyVar?: string;
  resolvedUrl?: string;
};
const fetchCalls: FetchCallData[] = [];
const arrayofAPIURLs: string[] = [];
const objofAPIKeys: APIKeys = {};

// Helper function to resolve enviroment variable values with prompt using inquirer
async function resolveEnvVar(apiKeyVar: string): Promise<string | undefined> {
  const existingValue = process.env[apiKeyVar];
  if (existingValue) return existingValue;

  console.log(`\nEnvironment variable "${apiKeyVar}" was referenced but not found.`);

  const answers = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'allowInput',
      message: `Would you like to enter a value for ${apiKeyVar}?`,
      default: true,
    },
    {
      type: 'input',
      name: 'userValue',
      message: `Enter value for ${apiKeyVar}:`,
      when: (answers) => answers.allowInput,
      validate: (input) => input.trim() !== '' || 'Value cannot be empty',
    },
  ]);

  if (answers.userValue) {
    const value = answers.userValue;
    process.env[apiKeyVar] = value;
    return value;
  }

  return undefined;
}

// main function to scan the project for fetch calls
export async function scanSalmon() {
  const tsConfigPath = path.resolve(userProjectRoot, 'tsconfig.json');

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

  for (const sourceFile of source) {
    const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression); //gets all call expressions
    const variableDeclarations = sourceFile.getDescendantsOfKind(
      SyntaxKind.VariableDeclaration
    ); // gets all variable dec.
   // console.log(calls)
    for (const c of calls) {
      const expr = c.getExpression();
      const isFetchCall =
        expr.getText() === 'fetch' ||
        expr.getText() === 'window.fetch' ||
        expr.getText() === 'globalThis.fetch';
     //   console.log('Call Expression:', c.getText());

      if (!isFetchCall) continue;
      const args = c.getArguments();
      const urlArg = args[0];
      let url: string | undefined;
      let apiKeyVar: string | undefined;

      // Extract the URL or environment-based URL
      if (urlArg) {
        const kind = urlArg.getKind();
        //console.log('URL Argument Kind:', SyntaxKind[kind], "urlArg:", urlArg); // binary expression

        if (kind === SyntaxKind.StringLiteral) {
          url = urlArg.getText().replace(/^['"`]|['"`]$/g, '');
        } else if (urlArg.getText().includes('process.env.')) {
          const urlText = urlArg.getText();
          url = urlText;
          const envMatch = urlText.match(/process\.env\.([A-Z0-9_]+)/i);
          if (envMatch) {
            apiKeyVar = envMatch[1];
          }
        } else if (kind === SyntaxKind.BinaryExpression) {
          const binaryExpr = urlArg.asKind(SyntaxKind.BinaryExpression);
          const left = binaryExpr?.getLeft();
          const right = binaryExpr?.getRight();
      
          const leftText = left?.getText() ?? '';
          const rightText = right?.getText() ?? '';
          const fullText = leftText + rightText;
      
          // Look for process.env.* on either side
          const envMatch = fullText.match(/process\.env\.([A-Z0-9_]+)/i);
          if (envMatch) {
            apiKeyVar = envMatch[1];
          }

          const baseUrl = leftText.replace(/^['"`]|['"`]$/g, '');
          const resolvedValue = apiKeyVar ? await resolveEnvVar(apiKeyVar) ?? '' : '';
          const resolvedUrl = `${baseUrl}${resolvedValue}`;

          fetchCalls.push({ url: fullText, apiKeyVar, resolvedUrl });
          console.log('Fetch Call (Binary):', { url: fullText, apiKeyVar, resolvedUrl });
        
        } else if (kind === SyntaxKind.Identifier) {
          // Try to resolve the variable declaration
          const symbol = urlArg.getSymbol();
          const decl = symbol?.getDeclarations()?.[0];
          if (decl?.getKind() === SyntaxKind.VariableDeclaration) {
            const initializer = (decl as VariableDeclaration).getInitializer();
            if (initializer?.getKind() === SyntaxKind.StringLiteral) {
              url = initializer.getText().replace(/^['"`]|['"`]$/g, '');
            } else if (initializer?.getKind() === SyntaxKind.BinaryExpression) {
              const binaryExpr = initializer.asKind(
                SyntaxKind.BinaryExpression
              );
              const left = binaryExpr?.getLeft();
              const right = binaryExpr?.getRight();
              const url = binaryExpr?.getText();

              // Look for process.env.* on either side
              const envMatch = url?.match(/process\.env\.([A-Z0-9_]+)/i);
              if (envMatch) {
                apiKeyVar = envMatch[1];
              }

              // Check if one side is an Identifier like apiKeyVar (not process.env)
              if (right?.getKind() === SyntaxKind.Identifier) {
                const varName = right.getText();
                apiKeyVar = await resolveEnvVar(varName);
              } else if (left?.getKind() === SyntaxKind.Identifier) {
                const varName = left.getText();
                apiKeyVar = await resolveEnvVar(varName);
              }
                const leftText = left?.getText().replace(/^['"`]|['"`]$/g, '') ?? '';
                const resolvedUrl = leftText + (apiKeyVar ?? '');
                
              fetchCalls.push({ url, apiKeyVar, resolvedUrl });
              console.log('Fetch Call (Identifier):', { url, apiKeyVar, resolvedUrl });
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
    }

    for (const https of variableDeclarations) {
      const urlString = https.getInitializer();

      if (urlString && urlString.getKind() === SyntaxKind.StringLiteral) {
        const value = urlString.getText().replace(/^['"`]|['"`]$/g, '');

        if (value.startsWith('http')) {
        }
      } else if (
        urlString &&
        urlString.getKind() === SyntaxKind.PropertyAccessExpression
      ) {
        try {
          const processDec = urlString.asKindOrThrow(
            SyntaxKind.PropertyAccessExpression
          );
          //const processDec= processEnv.getInitializerIfKind(SyntaxKind.PropertyAccessExpression);
          //const env = processDec.getText(); // whole expression process.env.apikeyvar --- might nobt e
          //const envApiVar = processDec.getExpression().getText(); // process.env
          const envVarName = processDec.getName(); // .APIKEYVar
          //! FINALLY GETTING API KEYS
          if (process.env[envVarName]) {
            objofAPIKeys[envVarName] = process.env[envVarName];
          }
        } catch (error) {
          console.error('Error in PropertyAccessExpression:', error);
        }
      }
    }
  }
  return fetchCalls;
} //end of scanSalmon
