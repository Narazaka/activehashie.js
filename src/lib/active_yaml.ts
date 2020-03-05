import * as fs from "fs";
import * as jsyaml from "js-yaml";
import { ActiveFile } from "./active_file";
import { ActiveHashRecord } from "./active_hash_record";

export class ActiveYaml<Record extends ActiveHashRecord> extends ActiveFile<Record> {
    // eslint-disable-next-line class-methods-use-this
    loadFile(fullPath: string) {
        return jsyaml.safeLoad(fs.readFileSync(fullPath, "utf8"));
    }

    // eslint-disable-next-line class-methods-use-this
    get extension() {
        return "yml";
    }
}
