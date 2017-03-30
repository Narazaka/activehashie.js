import {ActiveHashRecord, ActiveHashRecordBase} from "./active_hash_record";
import {ActiveHashRelation} from "./active_hash_relation";
import {Queryable} from "./queryable";

type RecordIndex = Map<any, number[]>;

export type Contitions<Record extends ActiveHashRecord> = {
    [column in keyof Record]?: Record[column] | Array<Record[column]> | null | undefined;
};

export class ActiveHash<Record extends ActiveHashRecord> implements Queryable<Record> {
    /** table name */
    readonly name: string;
    /** record class */
    readonly recordClass: new(source: ActiveHashRecordBase) => Record;
    /** index columns */
    readonly indexColumns: ReadonlyArray<keyof(Record)>;
    private _data: Record[];
    private recordIndexes: Map<string, RecordIndex>;

    constructor(
        name: string,
        recordClass: new(source: ActiveHashRecordBase) => Record,
        options: {indexColumns?: Array<keyof(Record)>} = {},
    ) {
        this.name = name;
        this.indexColumns = Object.freeze((options.indexColumns || []).concat(["id"]));
        this.recordClass = recordClass;
        this.resetData();
    }

    get data() { return this._data; }

    setData(data: ActiveHashRecordBase[]) {
        this.resetData();
        this.push(...data);
    }

    isExists(record: {id: any}) {
        return (<RecordIndex> this.recordIndexes.get("id")).has(record.id);
    }

    push(...records: ActiveHashRecordBase[]) {
        let nextId = this.nextId() - 1;
        const useRecords: Record[] = Array(records.length);
        let index = 0;
        for (const record of records) {
            if (record.id == null) record.id = ++nextId;
            useRecords[index] = record instanceof this.recordClass ? record : new this.recordClass(record);
            ++index;
        }
        for (const record of useRecords) record._parentTable = this; // 親参照できるように
        this.addToRecordIndex(useRecords, this.data.length);
        this.data.push(...useRecords);
    }

    nextId() {
        const recordIndex = <RecordIndex> this.recordIndexes.get("id");
        const maxId = Math.max(...(<number[]> Array.from(recordIndex.keys())));
        return maxId === -Infinity ? 1 : maxId + 1; // 1つでもidが数値でない場合NaNになる
    }

    searchIndexesByUsingIndex(column: string, values: any[]) {
        const recordIndex = this.recordIndexes.get(column);
        if (!recordIndex) return;
        return <number[]> values
            .map((value) => recordIndex.get(value))
            .reduce((allIndexes, indexes) => (<number[]> allIndexes).concat(indexes || []), []);
    }

    all(): ActiveHashRelation<Record> {
        return new ActiveHashRelation(this);
    }

    where(conditions?: Contitions<Record>) {
        return this.all().where(conditions);
    }

    filter(callback: (record: Record) => boolean) {
        return this.all().filter(callback);
    }

    filterColumn<Column extends keyof Record>(column: Column, callback: (value: Record[Column]) => boolean) {
        return this.all().filterColumn(column, callback);
    }

    find_by(conditions: Contitions<Record>) {
        return this.all().find_by(conditions);
    }

    find(id: any) {
        return this.all().find(id);
    }

    count() {
        return this.data.length;
    }

    toArray() {
        return this.data;
    }

    pluck<Column extends keyof Record>(column: Column): Array<Record[Column]>;
    pluck(...columns: Array<keyof Record>): Array<Array<Record[keyof Record]>>;
    pluck(...columns: Array<keyof Record>) {
        if (columns.length === 1) {
            const column = columns[0];
            return <any> this.toArray().map((record) => record[column]);
        } else {
            return this.toArray().map((record) => columns.map((column) => record[column]));
        }
    }

    private addToRecordIndex(records: Record[], minIndex: number) {
        for (const indexColumn of this.indexColumns) {
            const recordIndex = <RecordIndex> this.recordIndexes.get(indexColumn);
            let index = minIndex;
            for (const record of records) {
                const keyValue = record[indexColumn];
                let keyIndexes = recordIndex.get(keyValue);
                if (!keyIndexes) {
                    keyIndexes = [];
                    recordIndex.set(keyValue, keyIndexes);
                }
                keyIndexes.push(index);
                ++index;
            }
        }
    }

    private resetData() {
        this._data = [];
        this.recordIndexes = new Map();
        for (const indexColumn of this.indexColumns) {
            this.recordIndexes.set(indexColumn, new Map());
        }
    }
}
