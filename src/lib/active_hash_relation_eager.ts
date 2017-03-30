import {ActiveHash, Contitions} from "./active_hash";
import {ActiveHashRecord} from "./active_hash_record";
import {ActiveHashRelationBase} from "./active_hash_relation_base";
import {ActiveHashRelationLazy} from "./active_hash_relation_lazy";
import {EagerQueryable} from "./queryable";

export class ActiveHashRelationEager<Record extends ActiveHashRecord>
    extends ActiveHashRelationBase<Record>
    implements EagerQueryable<Record>
{
    private filteredIndexes: number[];

    constructor(
        source: ActiveHash<Record>,
        filteredIndexes: number[] = Array.from(Array(source.data.length).keys()),
    ) {
        super(source);
        this.filteredIndexes = filteredIndexes;
    }

    all() {
        return this;
    }

    eager() {
        return this;
    }

    lazy() {
        return new ActiveHashRelationLazy(this.source, [() => this.filteredIndexes]);
    }

    where(conditions?: Contitions<Record>) {
        if (!conditions) return this.all();
        return new ActiveHashRelationEager(
            this.source,
            this.buildWhereFilder(conditions)(this.source, this.filteredIndexes),
        );
    }

    not(conditions: Contitions<Record>) {
        return new ActiveHashRelationEager(
            this.source,
            this.buildNotFinder(conditions)(this.source, this.filteredIndexes),
        );
    }

    filter(callback: (record: Record) => boolean) {
        return new ActiveHashRelationEager(
            this.source,
            this.buildFilterFinder(callback)(this.source, this.filteredIndexes),
        );
    }

    filterByColumn<Column extends keyof Record>(column: Column, callback: (value: Record[Column]) => boolean) {
        return new ActiveHashRelationEager(
            this.source,
            this.buildFilterByColumnFinder(column, callback)(this.source, this.filteredIndexes),
        );
    }

    toArray() {
        return this.filteredIndexes.map((index) => this.source.data[index]);
    }
}
