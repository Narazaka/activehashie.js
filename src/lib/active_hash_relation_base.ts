import intersection = require("lodash.intersection");
import difference = require("lodash.difference");
import {ActiveHash} from "./active_hash";
import {ActiveHashRecord} from "./active_hash_record";
import {ActiveHashRelationEager} from "./active_hash_relation_eager";
import {ActiveHashRelationLazy} from "./active_hash_relation_lazy";
import {ActiveHashRecordFilter, ActiveHashRecordValueFilter, Contitions, Queryable} from "./queryable";
import {RecordNotFound} from "./record_not_found";

export abstract class ActiveHashRelationBase<Record extends ActiveHashRecord> implements Queryable<Record> {
    protected source: ActiveHash<Record>;

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

    abstract filter(callback: ActiveHashRecordFilter<Record>): ActiveHashRelationBase<Record>;

    abstract filterByColumn<Column extends keyof Record>(
        column: Column, callback: ActiveHashRecordValueFilter<Record, Column>,
    ): ActiveHashRelationBase<Record>;

    find_by(conditions: Contitions<Record>): Record | undefined {
        return this.where(conditions).toArray()[0];
    }

    find(id: any) {
        const record = this.find_by(<any> {id});
        if (record) {
            return record;
        } else {
            throw new RecordNotFound(`Couldn't find ${this.source.name} with ID=${id}`);
        }
    }

    abstract get length(): number;

    abstract toArray(): Record[];

    pluck<Column extends keyof Record>(column: Column): Array<Record[Column]>;
    pluck(...columns: Array<keyof Record>): Array<Array<Record[keyof Record]>>;
    pluck(...columns: Array<keyof Record>) {
        if (columns.length === 1) {
            const column = columns[0];
            return <any> this.toArray().map((record) => record[column]);
        } else {
            return this.toArray().map((record) => columns.map((column) => record[column]));
        }
    }

    protected buildWhereFilder(conditions: Contitions<Record>) {
        return (source: ActiveHash<Record>, filteredIndexes: number[]) => {
            const {indexes, restConditions} = this.filterByIndex(source, filteredIndexes, conditions);
            return this.filterByMatch(source, indexes, restConditions);
        };
    }

    protected buildNotFinder(conditions: Contitions<Record>) {
        return (source: ActiveHash<Record>, filteredIndexes: number[]) => {
            const {indexes, restConditions} = this.filterByIndex(source, filteredIndexes, conditions, true);
            return this.filterByMatch(source, indexes, restConditions, true);
        };
    }

    protected buildFilterFinder(callback: (record: Record) => boolean) {
        return (source: ActiveHash<Record>, filteredIndexes: number[]) => {
            return filteredIndexes.filter((index) => callback(source.data[index]));
        };
    }

    protected buildFilterByColumnFinder<Column extends keyof Record>(
        column: Column, callback: (value: Record[Column]) => boolean,
    ) {
        return (source: ActiveHash<Record>, filteredIndexes: number[]) => {
            return filteredIndexes.filter((index) => callback(source.data[index][column]));
        };
    }

    private filterByIndex(
        source: ActiveHash<Record>, filteredIndexes: number[], conditions: Contitions<Record>, not = false,
    ) {
        const filteredIndexesList = [];
        const restConditions: Contitions<Record> = {};
        for (const column of <Array<keyof Record>> Object.keys(conditions)) {
            const value = conditions[column];
            const indexes = source.searchIndexesByUsingIndex(column, value instanceof Array ? value : [value]);
            if (indexes) {
                filteredIndexesList.push(indexes);
            } else {
                restConditions[column] = conditions[column];
            }
        }
        return {
            indexes: not ?
                difference(filteredIndexes, ...filteredIndexesList) :
                intersection(filteredIndexes, ...filteredIndexesList),
            restConditions,
        };
    }

    private filterByMatch(
        source: ActiveHash<Record>, filteredIndexes: number[], conditions: Contitions<Record>, not = false,
    ) {
        const columns = Object.keys(conditions);
        if (!columns.length) return filteredIndexes;
        return filteredIndexes.filter((index) => {
            const record = source.data[index];
            const matched = columns.every((column: keyof Record) => {
                const value = conditions[column];
                if (value instanceof Array) {
                    return value.indexOf(record[column]) !== -1;
                } else {
                    return record[column] === value;
                }
            });
            return not ? !matched : matched;
        });
    }
}
