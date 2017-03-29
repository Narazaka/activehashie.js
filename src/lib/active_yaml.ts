import * as fs from "fs";
import * as jsyaml from "js-yaml";
import {ActiveFile} from "./active_file";

export class ActiveYaml extends ActiveFile {
    static loadFile(fullPath: string) {
        return jsyaml.safeLoad(fs.readFileSync(fullPath, "utf8"));
    }

    static get extension() {
        return "yml";
    }
}
