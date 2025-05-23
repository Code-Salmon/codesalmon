import path from "path";

// function to create new file to store json snapshot of fetch calls on user's machine locally
export const fileFolder = (data: Record<string, unknown>)  => {
    if(!data || typeof data !== "object"){
        throw new Error("Invalid Data provided")
    }}