import * as fs from "fs";
import path from "path";
import { compareAPIs } from "./drift";
import fetch from 'node-fetch'
import { execSync } from "child_process";
import { appendFile } from "node:fs";

type OutputArray = any[];

const apiUrl = [
  {
    "url": "process.env.API_URL + '/v1/resource'",
    "apiKeyVar": "API_KEY",
    "resolvedUrl": "https://api.example.com/v1/resource"
  },
  {
    "url": "https://api.openai.com/v1/chat",
    "apiKeyVar": "OPENAI_API_KEY",
    "resolvedUrl": "https://api.openai.com/v1/chat"
  }
] //! hardcoded string to test, can remove once Anne's logic writes objects 

// function to make the fetch calls and store the results in a variable to pass to fileFolder
const apiTestCalls = async (url: string) => { 
  try {
    const call = await fetch(url);
    const data = await call.json();
    // console.log(data)
    return data;

    // return scanSalmon(outputArr[i][resolvedURL])

  }
  catch(err) {
    console.error(err);
  }
}
apiTestCalls(apiUrl);

// const getGitIgnore = async () => {
//   // try catch / async
//     // creating the variable that brings the file to gitIgnore
//       // using execSync
//       try {
//         const ignoreOutput = execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).toString().trim();
//         return ignoreOutput;
//         console.log('ignoreOutput', ignoreOutput);
//       } catch (error) {
//         console.error('Error when getting the git ignore', error)
//       }
// }


// function to create new file to store json snapshot of fetch calls on user's machine locally
export const fileFolder = (finalOutputArray: OutputArray)  => {

    if(!finalOutputArray || typeof finalOutputArray !== "object"){
        throw new Error("Invalid Data provided")
    }
    try{
      const ignoreOutput = execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).toString().trim();
      const filePath = path.join(ignoreOutput, ".apiRestContracts.json"); // <-- process.cwd() places the file within the user's current src folder

      if(!filePath) {
        fs.writeFileSync(filePath, JSON.stringify(finalOutputArray, null, 2)); //! <-- NEED TO PROPERLY PLACE FILE IN GITIGNORE, FILE IS CURRENTLY WRITING NEXT TO GITIGNORE
        // console.log('ignoreOutput', ignoreOutput);
        // console.log("File path:", filePath);
        // console.log("Data to write:", finalOutputArray);
      } else if (filePath) {
        fs.appendFile(filePath, JSON.stringify(finalOutputArray, null, 2)); //! <-- Append correct file!
      }
    // compareAPIs(); // <-- invoking Anne's function

    } catch (error) {
        console.error("File for comparison data not written", error)
        throw error;
    }
}; 





//need to run fetch calls from URL/Key strings sent from Anne's logic
//then store that to json object
//more than one file or just different arrays in one file?

//hardcode in URL/Keys and then write logic for fetch calls here
//then write logic for storing in different json files, maybe with temp lit to differentiate between APIs


// apiTestCalls actually making call, getting response
  // That response needs to be stored as fourth property of output array
    // The full array is passed into fileFolder
      // Helper function for fileFolder to find and access to the user's gitignore <--- Done???
      // FileFolder will either write or append the file to user's codebase

      