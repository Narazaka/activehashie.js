import { ActiveHash } from "./active_hash";
import { ActiveHashRecord } from "./active_hash_record";
import { ActiveHashRelationEager } from "./active_hash_relation_eager";
import { ActiveHashRelationLazy } from "./active_hash_relation_lazy";
import {
    ActiveHashRecordFilter,
    ActiveHashRecordMapper,
    ActiveHashRecordValueFilter,
    ActiveHashRecordValueMapper,
    Contitions,
    Queryable,
} from "./queryable";
import { RecordNotFound } from "./record_not_found";

import difference = require("lodash.difference");
import intersection = require("lodash.intersection");

export abstract class ActiveHashRelationBase<Record extends ActiveHashRecord> implements Queryable<Record> {
    protected source: ActiveHash<Record>;

    protected abstract readonly filteredIndexes: number[];

    get name() {
        return this.source.name;
    }

    constructor(source: ActiveHash<Record>) {
        this.source = source;
    }

    abstract all(): ActiveHashRelationBase<Record>;

    abstract eager(): ActiveHashRelationEager<Record>;

    abstract lazy(): ActiveHashRelationLazy<Record>;

    abstract where(conditions?: Contitions<Record>): ActiveHashRelationBase<Record>;

    abstract not(conditions: Contitions<Record>): ActiveHashRelationBase<Record>;

    abstract group<Column extends keyof Record>(column: Column): Map<Record[Column], ActiveHashRelationBase<Record>>;

    abstract groupBy<Result>(
        callback: ActiveHashRecordMapper<Record, Result>,
    ): Map<Result, ActiveHashRelationBase<Record>>;

    abstract groupByColumn<Column extends keyof Record, Result>(
        column: Column,
        callback: ActiveHashRecordValueMapper<Record, Column, Result>,
    ): Map<Result, ActiveHashRelationBase<Record>>;

    abstract none(): ActiveHashRelationBase<Record>;

    abstract filter(callback: ActiveHashRecordFilter<Record>): ActiveHashRelationBase<Record>;

    abstract filterByColumn<Column extends keyof Record>(
        column: Column,
        callback: ActiveHashRecordValueFilter<Record, Column>,
    ): ActiveHashRelationBase<Record>;

    findBy(conditions: Contitions<Record>): Record | undefined {
        return this.where(conditions).toArray()[0];
    }

    find(id: any) {
        const record = this.findBy({ id } as any);
        if (record) {
            return record;
        }
        throw new RecordNotFound(`Couldn't find ${this.source.name} with ID=${id}`);
    }

    get length() {
        return this.filteredIndexes.length;
    }

    toArray() {
        return this.filteredIndexes.map(index => this.source.data[index]);
    }

    pluck<Column extends keyof Record>(column: Column): Array<Record[Column]>;

    pluck(...columns: Array<keyof Record>): Array<Array<Record[keyof Record]>>;

    pluck(...columns: Array<keyof Record>) {
        if (columns.length === 1) {
            const column = columns[0];
            return this.toArray().map(record => record[column]) as any;
        }
        return this.toArray().map(record => columns.map(column => record[column]));
    }

    protected buildWhereFilder(conditions: Contitions<Record>) {
        return (source: ActiveHash<Record>, filteredIndexes: number[]) => {
            const { indexes, restConditions } = this.filterByIndex(source, filteredIndexes, conditions);
            return this.filterByMatch(source, indexes, restConditions);
        };
    }

    protected buildNotFinder(conditions: Contitions<Record>) {
        return (source: ActiveHash<Record>, filteredIndexes: number[]) => {
            const { indexes, restConditions } = this.filterByIndex(source, filteredIndexes, conditions, true);
            return this.filterByMatch(source, indexes, restConditions, true);
        };
    }

    // eslint-disable-next-line class-methods-use-this
    protected buildFilterFinder(callback: (record: Record) => boolean) {
        return (source: ActiveHash<Record>, filteredIndexes: number[]) => {
            return filteredIndexes.filter(index => callback(source.data[index]));
        };
    }

    // eslint-disable-next-line class-methods-use-this
    protected buildFilterByColumnFinder<Column extends keyof Record>(
        column: Column,
        callback: (value: Record[Column]) => boolean,
    ) {
        return (source: ActiveHash<Record>, filteredIndexes: number[]) => {
            return filteredIndexes.filter(index => callback(source.data[index][column]));
        };
    }

    protected buildIndexGroups<Column extends keyof Record>(column: Column) {
        const indexGroups: Map<Record[Column], number[]> = new Map();
        for (const index of this.filteredIndexes) {
            const value = this.source.data[index][column];
            let indexGroup = indexGroups.get(value);
            if (!indexGroup) {
                indexGroup = [];
                indexGroups.set(value, indexGroup);
            }
            indexGroup.push(index);
        }
        return indexGroups;
    }

    protected buildIndexGroupsBy<Result>(callback: ActiveHashRecordMapper<Record, Result>) {
        const indexGroups: Map<Result, number[]> = new Map();
        for (const index of this.filteredIndexes) {
            const value = callback(this.source.data[index]);
            let indexGroup = indexGroups.get(value);
            if (!indexGroup) {
                indexGroup = [];
                indexGroups.set(value, indexGroup);
            }
            indexGroup.push(index);
        }
        return indexGroups;
    }

    protected buildIndexGroupsByColumn<Column extends keyof Record, Result>(
        column: Column,
        callback: ActiveHashRecordValueMapper<Record, Column, Result>,
    ) {
        const indexGroups: Map<Result, number[]> = new Map();
        for (const index of this.filteredIndexes) {
            const value = callback(this.source.data[index][column]);
            let indexGroup = indexGroups.get(value);
            if (!indexGroup) {
                indexGroup = [];
                indexGroups.set(value, indexGroup);
            }
            indexGroup.push(index);
        }
        return indexGroups;
    }

    // eslint-disable-next-line class-methods-use-this
    private filterByIndex(
        source: ActiveHash<Record>,
        filteredIndexes: number[],
        conditions: Contitions<Record>,
        not = false,
    ) {
        const filteredIndexesList = [];
        const restConditions: Contitions<Record> = {};
        for (const column of Object.keys(conditions) as Array<keyof Record>) {
            const value = conditions[column];
            const indexes = source.searchIndexesByUsingIndex(column, value instanceof Array ? value : [value]);
            if (indexes) {
                filteredIndexesList.push(indexes);
            } else {
                restConditions[column] = conditions[column];
            }
        }
        return {
            indexes: not
                ? difference(filteredIndexes, ...filteredIndexesList)
                : intersection(filteredIndexes, ...filteredIndexesList),
            restConditions,
        };
    }

    // eslint-disable-next-line class-methods-use-this
    private filterByMatch(
        source: ActiveHash<Record>,
        filteredIndexes: number[],
        conditions: Contitions<Record>,
        not = false,
    ) {
        const columns = Object.keys(conditions) as Array<keyof Record>;
        if (!columns.length) return filteredIndexes;
        return filteredIndexes.filter(index => {
            const record = source.data[index];
            const matched = columns.every((column: keyof Record) => {
                const value = conditions[column];
                if (value instanceof Array) {
                    return value.indexOf(record[column]) !== -1;
                }
                return record[column] === value;
            });
            return not ? !matched : matched;
        });
    }
}
