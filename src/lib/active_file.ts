import * as fs from "fs";
import snakeCase = require("lodash.snakecase");
import * as path from "path";
import * as pluralize from "pluralize";
import {ActiveHash} from "./active_hash";
import {ActiveHashRecord, ActiveHashRecordBase} from "./active_hash_record";
import {ActiveHashRelationEager} from "./active_hash_relation_eager";
import {ActiveHashRelationLazy} from "./active_hash_relation_lazy";

export class ActiveFile<Record extends ActiveHashRecord> extends ActiveHash<Record> {
    readonly filename?: string;
    readonly filenames?: string[];
    readonly rootPath?: string;
    dataLoaded = false;

    constructor(
        name: string,
        recordClass: new(source: ActiveHashRecordBase) => Record,
        options: {
            indexColumns?: Array<keyof(Record)>,
            filename?: string,
            filenames?: string[],
            rootPath?: string,
        } = {},
    ) {
        super(name, recordClass, options);
        this.filename = options.filename;
        this.filenames = options.filenames;
        this.rootPath = options.rootPath;
    }

    reload(force = false) {
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
                data.push(...Object.keys(fileData).map((key) => (fileData as any)[key]));
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
                    .filter((filename) => path.extname(filename) === `.${this.extension}`)
                    .map((filename) => path.join(this.fullPathBase, filename));
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

    eager(): ActiveHashRelationEager<Record> {
        if (!this.dataLoaded) this.reload();
        return super.eager();
    }

    lazy(): ActiveHashRelationLazy<Record> {
        if (!this.dataLoaded) this.reload();
        return super.lazy();
    }

    get length() {
        if (!this.dataLoaded) this.reload();
        return super.length;
    }

    toArray() {
        if (!this.dataLoaded) this.reload();
        return super.toArray();
    }

    pluck<Column extends keyof Record>(column: Column): Array<Record[Column]>;
    pluck(...columns: Array<keyof Record>): Array<Array<Record[keyof Record]>>;
    pluck(...columns: Array<keyof Record>) {
        if (!this.dataLoaded) this.reload();
        return super.pluck(...columns) as any;
    }
}
