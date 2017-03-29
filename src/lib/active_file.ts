import {ActiveHash, ActiveHashRecord} from "./active_hash";
import {ActiveHashRelation} from "./active_hash_relation";
import snakeCase = require("lodash.snakecase");
import * as fs from "fs";
import * as path from "path";
import * as pluralize from "pluralize";

export class ActiveFile extends ActiveHash {
    static readonly filename: string;
    static readonly filenames: string[];
    static readonly rootPath: string;
    static dataLoaded = false;

    static reload(force = true) {
        if (!force && this.dataLoaded) return;
        this.dataLoaded = true;
        this.data = this.loadFiles();
    }

    static loadFile(_: string): any {
        throw new Error("Override Me");
    }

    static loadFiles(): ActiveHashRecord[] {
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

    static get fullPathBase() {
        const actualFileName = this.filename || pluralize.plural(snakeCase(this.name));
        return path.join(this.actualRootPath, actualFileName);
    }

    static get fullPaths() {
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

    protected static get extension(): string {
        throw new Error("Override Me");
    }

    protected static get actualRootPath() {
        return this.rootPath || ".";
    }

    static isExists(record: {id: any}) {
        if (!this.dataLoaded) this.reload();
        return super.isExists(record);
    }

    static all(): ActiveHashRelation {
        if (!this.dataLoaded) this.reload();
        return super.all();
    }

    static where(conditions?: {[column: string]: any}) {
        if (!this.dataLoaded) this.reload();
        return super.where(conditions);
    }

    static find_by(conditions: {[column: string]: any}) {
        if (!this.dataLoaded) this.reload();
        return super.find_by(conditions);
    }

    static count() {
        if (!this.dataLoaded) this.reload();
        return super.count();
    }

    static find(id: any) {
        if (!this.dataLoaded) this.reload();
        return super.find(id);
    }
}
