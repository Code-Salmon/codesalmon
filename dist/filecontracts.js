"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileFolder = void 0;
// function to create new file to store json snapshot of fetch calls on user's machine locally
const fileFolder = (data) => {
    if (!data || typeof data !== "object") {
        throw new Error("Invalid Data provided");
    }
};
exports.fileFolder = fileFolder;
