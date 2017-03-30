import intersection = require("lodash.intersection");
import difference = require("lodash.difference");
import {ActiveHash, Contitions} from "./active_hash";
import {ActiveHashRecord} from "./active_hash_record";
import {Queryable} from "./queryable";
import {RecordNotFound} from "./record_not_found";

export class ActiveHashRelation<Record extends ActiveHashRecord> implements Queryable<Record> {
    private source: ActiveHash<Record>;
    private filters: Array<(source: ActiveHash<Record>, filteredIndexes: number[]) => number[]>;

    get name() {
        return this.source.name;
    }

    constructor(
        source: ActiveHash<Record>,
        filters: Array<(source: ActiveHash<Record>, filteredIndexes: number[]) => number[]> = [],
    ) {
        this.source = source;
        this.filters = filters;
    }

    all() {
        return new ActiveHashRelation(this.source, this.filters);
    }

    where(conditions?: Contitions<Record>) {
        if (!conditions) return this.all();
        const finder = (source: ActiveHash<Record>, filteredIndexes: number[]) => {
            const {indexes, restConditions} = this.filterByIndex(source, filteredIndexes, conditions);
            return this.filterByMatch(source, indexes, restConditions);
        };
        return new ActiveHashRelation(this.source, this.filters.concat([finder]));
    }

    not(conditions: Contitions<Record>) {
        const finder = (source: ActiveHash<Record>, filteredIndexes: number[]) => {
            const {indexes, restConditions} = this.filterByIndex(source, filteredIndexes, conditions, true);
            return this.filterByMatch(source, indexes, restConditions, true);
        };
        return new ActiveHashRelation(this.source, this.filters.concat([finder]));
    }

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

    count() {
        return this.toArray().length;
    }

    toArray() {
        return this.filteredIndexes().map((index) => this.source.data[index]);
    }

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

    private filteredIndexes() {
        const indexes = this.filters.reduce(
            (filteredIndexes, filter) => filter(this.source, filteredIndexes),
            Array.from(Array(this.source.data.length).keys()),
        );
        return indexes.sort();
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
