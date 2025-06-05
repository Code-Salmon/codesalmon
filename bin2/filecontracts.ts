import * as fs from "fs";
import path from "path";
import { compareAPIs } from "./drift";
import fetch from 'node-fetch'
import { execSync } from "child_process";
import { appendFile } from "node:fs";
import chalk from 'chalk';
import { FetchCallData } from ".";

type OutputArray = any[] | any;

const apiUrl = [
  {
    "url": "process.env.API_URL + '/v1/resource'",
    "apiKeyVar": "API_KEY",
    "resolvedUrl": "https://api.nasa.gov/planetary/apod?api_key=4Ft01vTgsi4Gp07fqeIlcrjaGJ0AO3fz1KHQaL8m"
  },
  {
    "url": "https://api.openai.com/v1/chat",
    "apiKeyVar": "OPENAI_API_KEY",
    "resolvedUrl": "https://pokeapi.co/api/v2/pokemon?limit=1"
  }
] //! hardcoded string to test, can remove once Anne's logic writes objects 

// function to make the fetch calls and store the results in a variable to pass to fileFolder
const apiTestCalls = async (url: any[]) => {
  const finalArray = url;
  try {
    for (let i = 0; i < url.length; i++) {
      const resolvedUrl = url[i].resolvedUrl;
      const call = await fetch(resolvedUrl);

      if (!call.ok) {
        console.error(
          `Request to ${resolvedUrl} failed with status ${call.status}`
        );
        finalArray[i][resolvedUrl] = { error: `HTTP ${call.status}` };
        continue;
      }

      const contentType = call.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error(
          `Unexpected content type from ${resolvedUrl}: ${contentType}`
        );
        finalArray[i][resolvedUrl] = { error: 'Non-JSON response' };
        continue;
      }

      const data = await call.json();
      finalArray[i][resolvedUrl] = data;
    }
    console.log(finalArray);
    return finalArray;
  } catch (err) {
    console.error(err);
  }
};


// function to create new file to store json snapshot of fetch calls on user's machine locally
const fileFolder = (finalOutputArray: OutputArray)  => {

    if(!finalOutputArray || typeof finalOutputArray !== "object"){
        throw new Error("Invalid Data provided")
    }
    try{
      const ignoreOutput = execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).toString().trim();
      const filePath = path.join(ignoreOutput, ".apiRestContracts.json"); // <-- process.cwd() places the file within the user's current src folder

      if(!filePath) {
        console.log(chalk.blue(`Comparison File has been written at ${filePath}`));
        fs.writeFileSync(filePath, JSON.stringify(finalOutputArray, null, 2)); //! <-- NEED TO PROPERLY PLACE FILE IN GITIGNORE, FILE IS CURRENTLY WRITING NEXT TO GITIGNORE
        // console.log('ignoreOutput', ignoreOutput);
        // console.log("File path:", filePath);
        // console.log("Data to write:", finalOutputArray);
      } else if (filePath) {
        fs.appendFile(".apiRestContracts.json", JSON.stringify(finalOutputArray, null, 2), (err) => {
          if (err) {
            console.error(chalk.red('Error appending to file:', err));
          } else {
            console.log(chalk.blue('Data appended successfully.'));
          }
        }); //! <-- Append correct file!
      }
    // compareAPIs(); // <-- invoking Anne's function

    } catch (error) {
        console.error(chalk.red("File for comparison data not written", error))
        throw error;
    }
}; 


export const writeTheFile = async (array: FetchCallData[]) => {
  try {
    const testTheFile = await apiTestCalls(apiUrl);
    fileFolder(testTheFile);
  } catch (error) {
    console.error(chalk.red('Error during API call', error));
  }
}


      