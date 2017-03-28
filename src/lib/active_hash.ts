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
    readonly name: string;
    readonly indexesOption: ReadonlyArray<string>;
    private _data: ActiveHashRecord[];
    private recordIndexes: Map<string, RecordIndex> = new Map();

    constructor(name: string, options: ActiveHashOptions = {}) {
        this.name = name;
        this.indexesOption = Object.freeze((options.indexes || []).concat(["id"]));
        this.resetData();
    }

    get data() { return this._data; }
    set data(data: ActiveHashRecord[]) {
        this.resetData();
        this.push(...data);
    }

    isExists(record: {id: any}) {
        return (<RecordIndex> this.recordIndexes.get("id")).has(record.id);
    }

    push(...records: ActiveHashRecord[]) {
        let nextId = this.nextId() - 1;
        for (const record of records) {
            if (record.id == null) record.id = ++nextId;
        }
        this.addToRecordIndex(records, this.data.length);
        this._data.push(...records);
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

    all() {
        return new ActiveHashRelation(this);
    }

    where(conditions?: {[column: string]: any}) {
        return this.all().where(conditions);
    }

    find_by(conditions: {[column: string]: any}) {
        return this.all().find_by(conditions);
    }

    length() {
        return this.data.length;
    }

    find(id: any) {
        const record = this.find_by({id});
        if (record) {
            return record;
        } else {
            throw new RecordNotFound(`Couldn't find ${this.name} with ID=${id}`);
        }
    }

    private addToRecordIndex(records: ActiveHashRecord[], minIndex: number) {
        for (const indexOption of this.indexesOption) {
            const recordIndex = <RecordIndex> this.recordIndexes.get(indexOption);
            let index = minIndex;
            for (const record of records) {
                const keyValue = record[indexOption];
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
        for (const indexOption of this.indexesOption) {
            this.recordIndexes.set(indexOption, new Map());
        }
    }
}
