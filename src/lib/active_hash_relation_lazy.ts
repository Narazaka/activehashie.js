import {ActiveHash} from "./active_hash";
import {ActiveHashRecord} from "./active_hash_record";
import {ActiveHashRelationBase} from "./active_hash_relation_base";
import {ActiveHashRelationEager} from "./active_hash_relation_eager";
import {ActiveHashRecordFilter, ActiveHashRecordValueFilter, Contitions, LazyQueryable} from "./queryable";

export class ActiveHashRelationLazy<Record extends ActiveHashRecord>
    extends ActiveHashRelationBase<Record>
    implements LazyQueryable<Record> {
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

    filter(callback: ActiveHashRecordFilter<Record>) {
        return new ActiveHashRelationLazy(this.source, this.filters.concat([this.buildFilterFinder(callback)]));
    }

    filterByColumn<Column extends keyof Record>(column: Column, callback: ActiveHashRecordValueFilter<Record, Column>) {
        return new ActiveHashRelationLazy(
            this.source,
            this.filters.concat([this.buildFilterByColumnFinder(column, callback)]),
        );
    }

    get length() {
        return this.filteredIndexes().length;
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
