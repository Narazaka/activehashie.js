import {ActiveHash, Contitions} from "./active_hash";
import {ActiveHashRecord} from "./active_hash_record";
import {ActiveHashRelation} from "./active_hash_relation";
import snakeCase = require("lodash.snakecase");
import * as fs from "fs";
import * as path from "path";
import * as pluralize from "pluralize";

export class ActiveFile<Record extends ActiveHashRecord> extends ActiveHash<Record> {
    readonly filename: string;
    readonly filenames: string[];
    readonly rootPath: string;
    dataLoaded = false;

    reload(force = true) {
        if (!force && this.dataLoaded) return;
        this.dataLoaded = true;
        this.setData(this.loadFiles());
    }

    loadFile(_: string): any {
        throw new Error("Override Me");
    }

    loadFiles(): Record[] {
        const data = [];
        for (const fullPath of this.fullPaths) {
            const fileData = this.loadFile(fullPath);
            if (fileData instanceof Array) {
                data.push(...fileData);
            } else {
                data.push(...Object.keys(fileData).map((key) => (<any> fileData)[key]));
            }
        }
        return data;
    }

    get fullPathBase() {
        const actualFileName = this.filename || pluralize.plural(snakeCase(this.name));
        return path.join(this.actualRootPath, actualFileName);
    }

    get fullPaths() {
        if (this.filenames && this.filenames.length) {
            return this.filenames
                .map((filename) => path.join(this.actualRootPath, `${filename}.${this.extension}`));
        } else {
            if (fs.existsSync(this.fullPathBase)) {
                return fs.readdirSync(this.fullPathBase)
                    .map((filename) => path.join(this.actualRootPath, `${filename}.${this.extension}`));
            } else {
                return [`${this.fullPathBase}.${this.extension}`];
            }
        }
    }

    protected get extension(): string {
        throw new Error("Override Me");
    }

    protected get actualRootPath() {
        return this.rootPath || ".";
    }

    isExists(record: {id: any}) {
        if (!this.dataLoaded) this.reload();
        return super.isExists(record);
    }

    all(): ActiveHashRelation<Record> {
        if (!this.dataLoaded) this.reload();
        return super.all();
    }

    where(conditions?: Contitions<Record>) {
        if (!this.dataLoaded) this.reload();
        return super.where(conditions);
    }

    find_by(conditions: Contitions<Record>) {
        if (!this.dataLoaded) this.reload();
        return super.find_by(conditions);
    }

    count() {
        if (!this.dataLoaded) this.reload();
        return super.count();
    }

    find(id: any) {
        if (!this.dataLoaded) this.reload();
        return super.find(id);
    }
}
