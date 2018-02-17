import {ActiveHashRecord, ActiveHashRecordBase} from "./active_hash_record";
import {ActiveHashRelationEager} from "./active_hash_relation_eager";
import {ActiveHashRelationLazy} from "./active_hash_relation_lazy";
import {
    ActiveHashRecordFilter,
    ActiveHashRecordMapper,
    ActiveHashRecordValueFilter,
    ActiveHashRecordValueMapper,
    Contitions,
    EagerQueryable,
} from "./queryable";

type RecordIndex = Map<any, number[]>;

export class ActiveHash<Record extends ActiveHashRecord> implements EagerQueryable<Record> {
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
        return (this.recordIndexes.get("id") as RecordIndex).has(record.id);
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
        const recordIndex = this.recordIndexes.get("id") as RecordIndex;
        const maxId = Math.max(...(Array.from(recordIndex.keys()) as number[]));
        return maxId === -Infinity ? 1 : maxId + 1; // 1つでもidが数値でない場合NaNになる
    }

    searchIndexesByUsingIndex<Column extends keyof Record>(
        column: Column,
        values: Array<Record[Column] | null | undefined>,
    ) {
        const recordIndex = this.recordIndexes.get(column);
        if (!recordIndex) return;
        return values
            .map((value) => recordIndex.get(value))
            .reduce((allIndexes, indexes) => (allIndexes as number[]).concat(indexes || []), []) as number[];
    }

    all() {
        return this.eager();
    }

    eager(): ActiveHashRelationEager<Record> {
        return new ActiveHashRelationEager(this);
    }

    lazy(): ActiveHashRelationLazy<Record> {
        return new ActiveHashRelationLazy(this);
    }

    where(conditions?: Contitions<Record>) {
        return this.all().where(conditions);
    }

    not(conditions: Contitions<Record>) {
        return this.all().not(conditions);
    }

    group<Column extends keyof Record>(column: Column) {
        return this.all().group(column);
    }

    groupBy<Result>(callback: ActiveHashRecordMapper<Record, Result>) {
        return this.all().groupBy(callback);
    }

    groupByColumn<Column extends keyof Record, Result>(
        column: Column, callback: ActiveHashRecordValueMapper<Record, Column, Result>,
    ) {
        return this.all().groupByColumn(column, callback);
    }

    none() {
        return this.all().none();
    }

    filter(callback: ActiveHashRecordFilter<Record>) {
        return this.all().filter(callback);
    }

    filterByColumn<Column extends keyof Record>(column: Column, callback: ActiveHashRecordValueFilter<Record, Column>) {
        return this.all().filterByColumn(column, callback);
    }

    findBy(conditions: Contitions<Record>) {
        return this.all().findBy(conditions);
    }

    find(id: any) {
        return this.all().find(id);
    }

    get length() {
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
            return this.toArray().map((record) => record[column]) as any;
        } else {
            return this.toArray().map((record) => columns.map((column) => record[column]));
        }
    }

    private addToRecordIndex(records: Record[], minIndex: number) {
        for (const indexColumn of this.indexColumns) {
            const recordIndex = this.recordIndexes.get(indexColumn) as RecordIndex;
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
