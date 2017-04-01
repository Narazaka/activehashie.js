import {ActiveHash} from "./active_hash";
import {ActiveHashRecord} from "./active_hash_record";
import {ActiveHashRelationBase} from "./active_hash_relation_base";
import {ActiveHashRelationLazy} from "./active_hash_relation_lazy";
import {
    ActiveHashRecordFilter,
    ActiveHashRecordMapper,
    ActiveHashRecordValueFilter,
    ActiveHashRecordValueMapper,
    Contitions,
    EagerQueryable,
} from "./queryable";

export class ActiveHashRelationEager<Record extends ActiveHashRecord>
    extends ActiveHashRelationBase<Record>
    implements EagerQueryable<Record> {
    protected readonly filteredIndexes: number[];

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

    group<Column extends keyof Record>(column: Column) {
        const indexGroups = this.buildIndexGroups(column);
        const groups: Map<Record[Column], ActiveHashRelationEager<Record>> = new Map();
        for (const [value, indexes] of indexGroups.entries()) {
            groups.set(value, new ActiveHashRelationEager(this.source, indexes));
        }
        return groups;
    }

    groupBy<Result>(callback: ActiveHashRecordMapper<Record, Result>) {
        const indexGroups = this.buildIndexGroupsBy(callback);
        const groups: Map<Result, ActiveHashRelationEager<Record>> = new Map();
        for (const [value, indexes] of indexGroups.entries()) {
            groups.set(value, new ActiveHashRelationEager(this.source, indexes));
        }
        return groups;
    }

    groupByColumn<Column extends keyof Record, Result>(
        column: Column, callback: ActiveHashRecordValueMapper<Record, Column, Result>,
    ) {
        const indexGroups = this.buildIndexGroupsByColumn(column, callback);
        const groups: Map<Result, ActiveHashRelationEager<Record>> = new Map();
        for (const [value, indexes] of indexGroups.entries()) {
            groups.set(value, new ActiveHashRelationEager(this.source, indexes));
        }
        return groups;
    }

    none() {
        return new ActiveHashRelationEager(this.source, []);
    }

    filter(callback: ActiveHashRecordFilter<Record>) {
        return new ActiveHashRelationEager(
            this.source,
            this.buildFilterFinder(callback)(this.source, this.filteredIndexes),
        );
    }

    filterByColumn<Column extends keyof Record>(column: Column, callback: ActiveHashRecordValueFilter<Record, Column>) {
        return new ActiveHashRelationEager(
            this.source,
            this.buildFilterByColumnFinder(column, callback)(this.source, this.filteredIndexes),
        );
    }
}
