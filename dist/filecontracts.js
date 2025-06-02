"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileFolder = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const apiUrl = ['https://api.nasa.gov/planetary/apod?api_key=4Ft01vTgsi4Gp07fqeIlcrjaGJ0AO3fz1KHQaL8m']; //! hardcoded string to test, can remove once Anne's logic writes objects 
//function to make the fetch calls and store the results in a variable to pass to fileFolder
// const apiTestCalls = async (url: string) => { 
//   try {
//     const call = await fetch(url);
//     const data = await call.json();
//     // console.log(data)
//     return data;
//     // return scanSalmon(outputArr[i][resolvedURL])
//   }
//   catch(err) {
//     console.error(err);
//   }
// }
// apiTestCalls(apiUrl);
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
const fileFolder = (finalOutputArray) => {
    if (!finalOutputArray || typeof finalOutputArray !== "object") {
        throw new Error("Invalid Data provided");
    }
    try {
        const ignoreOutput = (0, child_process_1.execSync)('git rev-parse --show-toplevel', { encoding: 'utf-8' }).toString().trim();
        console.log('ignoreOutput', ignoreOutput);
        const filePath = path_1.default.join(ignoreOutput, ".apiRestContracts.json"); // <-- process.cwd() places the file within the user's current src folder
        console.log("File path:", filePath);
        fs_1.default.writeFileSync(filePath, JSON.stringify(finalOutputArray, null, 2)); // <-- Parameters in JSON.stringify make the json object human readable
        console.log("Data to write:", finalOutputArray);
        // compareAPIs(); // <-- invoking Anne's function
    }
    catch (error) {
        console.error("File for comparison data not written", error);
        throw error;
    }
};
exports.fileFolder = fileFolder;
(0, exports.fileFolder)(apiUrl);
//need to run fetch calls from URL/Key strings sent from Anne's logic
//then store that to json object
//more than one file or just different arrays in one file?
//hardcode in URL/Keys and then write logic for fetch calls here
//then write logic for storing in different json files, maybe with temp lit to differentiate between APIs
// apiTestCalls actually making call, getting response
// That response needs to be stored as fourth property of output array
// The full array is passed into fileFolder
// Helper function for fileFolder to find and access to the user's gitignore
// FileFolder will either write or append the file to user's codebase
