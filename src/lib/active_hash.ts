import {ActiveHashRelation} from "./active_hash_relation";
import {RecordNotFound} from "./record_not_found";

export type ActiveHashOptions = {
    indexes?: string[];
};

export type ActiveHashRecord = {
    id: any;
    [column: string]: any;
};

type RecordIndex = Map<any, number[]>;

export class ActiveHash {
    static readonly indexColumns: string[];

    static get data() { return this._data; }
    static set data(data: ActiveHashRecord[]) {
        this.resetData();
        this.push(...data);
    }

    static isExists(record: {id: any}) {
        return (<RecordIndex> this.recordIndexes.get("id")).has(record.id);
    }

    static push(...records: ActiveHashRecord[]) {
        let nextId = this.nextId() - 1;
        for (const record of records) {
            if (record.id == null) record.id = ++nextId;
        }
        this.addToRecordIndex(records, this.data.length);
        this.data.push(...records);
    }

    static nextId() {
        const recordIndex = <RecordIndex> this.recordIndexes.get("id");
        const maxId = Math.max(...(<number[]> Array.from(recordIndex.keys())));
        return maxId === -Infinity ? 1 : maxId + 1; // 1つでもidが数値でない場合NaNになる
    }

    static searchIndexesByUsingIndex(column: string, values: any[]) {
        const recordIndex = this.recordIndexes.get(column);
        if (!recordIndex) return;
        return <number[]> values
            .map((value) => recordIndex.get(value))
            .reduce((allIndexes, indexes) => (<number[]> allIndexes).concat(indexes || []), []);
    }

    static all() {
        return new ActiveHashRelation(this);
    }

    static where(conditions?: {[column: string]: any}) {
        return this.all().where(conditions);
    }

    static find_by(conditions: {[column: string]: any}) {
        return this.all().find_by(conditions);
    }

    static count() {
        return this.data.length;
    }

    static find(id: any) {
        const record = this.find_by({id});
        if (record) {
            return record;
        } else {
            throw new RecordNotFound(`Couldn't find ${this.name} with ID=${id}`);
        }
    }

    private static _data: ActiveHashRecord[];
    private static recordIndexes: Map<string, RecordIndex>;

    private static addToRecordIndex(records: ActiveHashRecord[], minIndex: number) {
        for (const indexColumn of (this.indexColumns || []).concat(["id"])) {
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

    private static resetData() {
        this._data = [];
        this.recordIndexes = new Map();
        for (const indexColumn of (this.indexColumns || []).concat(["id"])) {
            this.recordIndexes.set(indexColumn, new Map());
        }
    }
}
