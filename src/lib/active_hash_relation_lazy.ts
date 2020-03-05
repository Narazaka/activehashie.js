import { ActiveHash } from "./active_hash";
import { ActiveHashRecord } from "./active_hash_record";
import { ActiveHashRelationBase } from "./active_hash_relation_base";
import { ActiveHashRelationEager } from "./active_hash_relation_eager";
import {
    ActiveHashRecordFilter,
    ActiveHashRecordMapper,
    ActiveHashRecordValueFilter,
    ActiveHashRecordValueMapper,
    Contitions,
    LazyQueryable,
} from "./queryable";

export class ActiveHashRelationLazy<Record extends ActiveHashRecord> extends ActiveHashRelationBase<Record>
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
        return new ActiveHashRelationEager(this.source, this.filteredIndexes);
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

    group<Column extends keyof Record>(column: Column) {
        const indexGroups = this.buildIndexGroups(column);
        const groups: Map<Record[Column], ActiveHashRelationLazy<Record>> = new Map();
        for (const [value, indexes] of indexGroups.entries()) {
            groups.set(value, new ActiveHashRelationLazy(this.source, [() => indexes]));
        }
        return groups;
    }

    groupBy<Result>(callback: ActiveHashRecordMapper<Record, Result>) {
        const indexGroups = this.buildIndexGroupsBy(callback);
        const groups: Map<Result, ActiveHashRelationLazy<Record>> = new Map();
        for (const [value, indexes] of indexGroups.entries()) {
            groups.set(value, new ActiveHashRelationLazy(this.source, [() => indexes]));
        }
        return groups;
    }

    groupByColumn<Column extends keyof Record, Result>(
        column: Column,
        callback: ActiveHashRecordValueMapper<Record, Column, Result>,
    ) {
        const indexGroups = this.buildIndexGroupsByColumn(column, callback);
        const groups: Map<Result, ActiveHashRelationLazy<Record>> = new Map();
        for (const [value, indexes] of indexGroups.entries()) {
            groups.set(value, new ActiveHashRelationLazy(this.source, [() => indexes]));
        }
        return groups;
    }

    none() {
        return new ActiveHashRelationLazy(this.source, [() => []]);
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

    protected get filteredIndexes() {
        const indexes = this.filters.reduce(
            (filteredIndexes, filter) => filter(this.source, filteredIndexes),
            Array.from(Array(this.source.data.length).keys()),
        );
        return indexes.sort();
    }
}
