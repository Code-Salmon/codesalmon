import * as fs from "fs";
import path from "path";
import { compareAPIs } from "./drift";
import fetch from "node-fetch";
import { execSync } from "child_process";
import chalk from "chalk";
import { FetchCallData } from ".";

type OutputArray = any[] | any;
  


// Function to make the fetch calls and store the results in a variable to pass to fileFolder
const apiTestCalls = async (url: any[]) => {
  const finalArray = [...url]; // avoid mutating original array
  try {
    for (let i = 0; i < url.length; i++) {
      const resolvedUrl = url[i].resolvedUrl;
      try {
        const call = await fetch(resolvedUrl);

        if (!call.ok) {
          console.error(`Request to ${resolvedUrl} failed with status ${call.status}`);
          finalArray[i].firstCall = { error: `HTTP ${call.status}` };
          continue;
        }

        const contentType = call.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          console.error(`Unexpected content type from ${resolvedUrl}: ${contentType}`);
          finalArray[i].firstCall = { error: "Non-JSON response" };
          continue;
        }

        const data = await call.json();
        finalArray[i].firstCall = data;
      } catch (fetchErr: any) {
        console.error(`Fetch error for ${resolvedUrl}:`, fetchErr);
        finalArray[i].firstCall = { error: "Fetch failed", details: fetchErr.message };
      }
    }
    return finalArray;
  } catch (err) {
    console.error("Unexpected error in apiTestCalls:", err);
    return [];
  }
};

// Function to create or append the JSON snapshot to a file in the user's repo root
const fileFolder = (finalOutputArray: OutputArray) => {
  if (!finalOutputArray || typeof finalOutputArray !== "object") {
    throw new Error("Invalid data provided");
  }

  try {
    const repoRoot = execSync("git rev-parse --show-toplevel", { encoding: "utf-8" }).trim();
    const filePath = path.join(repoRoot, ".apiRestContracts.json");

    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(finalOutputArray, null, 2));
      console.log(chalk.blue(`Comparison file has been written at ${filePath}`));
    } else {
      fs.appendFile(filePath, JSON.stringify(finalOutputArray, null, 2), (err) => {
        if (err) {
          console.error(chalk.red("Error appending to file:", err));
        } else {
          console.log(chalk.blue("Data appended successfully."));
        }
      });
    }
  } catch (error) {
    console.error(chalk.red("File for comparison data not written"), error);
    throw error;
  }
};



export const writeTheFile = async (array: FetchCallData[]) => {
  try {
    const topLevelPath = execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
    const filePath = path.join(topLevelPath, '.apiRestContracts.json');

    let apiUrl: FetchCallData[];

    if (fs.existsSync(filePath)) {
      const rawData = fs.readFileSync(filePath, 'utf-8');
      apiUrl = JSON.parse(rawData);
    } else {
      apiUrl = array;
    }

    const testTheFile = await apiTestCalls(apiUrl);
    fileFolder(testTheFile);
  } catch (error) {
    console.error(chalk.red("Error during API call"), error);
  }
};

      