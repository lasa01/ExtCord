import FS = require("fs");
import { promisify } from "util";

export const mkdir = promisify(FS.mkdir);
export const readFile = promisify(FS.readFile);
export const readdir = promisify(FS.readdir);
export const stat = promisify(FS.stat);
export const writeFile = promisify(FS.writeFile);
