import FS from "fs";
import Util from "util";

export default {
    readFile: Util.promisify(FS.readFile),
    readdir: Util.promisify(FS.readdir),
    stat: Util.promisify(FS.stat),
    writeFile: Util.promisify(FS.writeFile),
};
