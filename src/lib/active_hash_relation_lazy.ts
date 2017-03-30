import {ActiveHash, Contitions} from "./active_hash";
import {ActiveHashRecord} from "./active_hash_record";
import {ActiveHashRelationBase} from "./active_hash_relation_base";
import {ActiveHashRelationEager} from "./active_hash_relation_eager";

export class ActiveHashRelationLazy<Record extends ActiveHashRecord> extends ActiveHashRelationBase<Record> {
    private filters: Array<(source: ActiveHash<Record>, filteredIndexes: number[]) => number[]>;

    constructor(
        source: ActiveHash<Record>,
        filters: Array<(source: ActiveHash<Record>, filteredIndexes: number[]) => number[]> = [],
    ) {
        super(source);
        this.filters = filters;
    }

    all() {
        return this;
    }

    eager() {
        return new ActiveHashRelationEager(this.source, this.filteredIndexes());
    }

    lazy() {
        return this;
    }

    where(conditions?: Contitions<Record>) {
        if (!conditions) return this.all();
        return new ActiveHashRelationLazy(this.source, this.filters.concat([this.buildWhereFilder(conditions)]));
    }

    not(conditions: Contitions<Record>) {
        return new ActiveHashRelationLazy(this.source, this.filters.concat([this.buildNotFinder(conditions)]));
    }

    filter(callback: (record: Record) => boolean) {
        return new ActiveHashRelationLazy(this.source, this.filters.concat([this.buildFilterFinder(callback)]));
    }

    filterByColumn<Column extends keyof Record>(column: Column, callback: (value: Record[Column]) => boolean) {
        return new ActiveHashRelationLazy(
            this.source,
            this.filters.concat([this.buildFilterByColumnFinder(column, callback)]),
        );
    }

    toArray() {
        return this.filteredIndexes().map((index) => this.source.data[index]);
    }

    private filteredIndexes() {
        const indexes = this.filters.reduce(
            (filteredIndexes, filter) => filter(this.source, filteredIndexes),
            Array.from(Array(this.source.data.length).keys()),
        );
        return indexes.sort();
    }
}
