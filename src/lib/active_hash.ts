import {ActiveHashRecord, ActiveHashRecordBase} from "./active_hash_record";
import {ActiveHashRelation} from "./active_hash_relation";
import {RecordNotFound} from "./record_not_found";

type RecordIndex = Map<any, number[]>;

export type Contitions<Record extends ActiveHashRecord> = {
    [column in keyof Record]?: Record[column] | Array<Record[column]> | null | undefined;
};

export class ActiveHash<Record extends ActiveHashRecord> {
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
        for (const record of records) {
            if (record.id == null) record.id = ++nextId;
            useRecords.push(record instanceof this.recordClass ? record : new this.recordClass(record));
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

    find_by(conditions: Contitions<Record>) {
        return this.all().find_by(conditions);
    }

    count() {
        return this.data.length;
    }

    find(id: any) {
        const record = this.find_by(<any> {id});
        if (record) {
            return record;
        } else {
            throw new RecordNotFound(`Couldn't find ${this.name} with ID=${id}`);
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
