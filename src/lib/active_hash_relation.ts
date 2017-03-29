import intersection = require("lodash.intersection");
import difference = require("lodash.difference");
import {ActiveHash} from "./active_hash";

export class ActiveHashRelation {
    private source: typeof ActiveHash;
    private filters: Array<(source: ActiveHash, filteredIndexes: number[]) => number[]>;

    constructor(
        source: typeof ActiveHash, filters: Array<(source: ActiveHash, filteredIndexes: number[]) => number[]> = [],
    ) {
        this.source = source;
        this.filters = filters;
    }

    all() {
        return new ActiveHashRelation(this.source, this.filters);
    }

    where(conditions?: {[column: string]: any}) {
        if (!conditions) return this.all();
        const finder = (source: typeof ActiveHash, filteredIndexes: number[]) => {
            const {indexes, restConditions} = this.filterByIndex(source, filteredIndexes, conditions);
            return this.filterByMatch(source, indexes, restConditions);
        };
        return new ActiveHashRelation(this.source, this.filters.concat([finder]));
    }

    not(conditions: {[column: string]: any}) {
        if (!conditions) return this.all();
        const finder = (source: typeof ActiveHash, filteredIndexes: number[]) => {
            const {indexes, restConditions} = this.filterByIndex(source, filteredIndexes, conditions, true);
            return this.filterByMatch(source, indexes, restConditions, true);
        };
        return new ActiveHashRelation(this.source, this.filters.concat([finder]));
    }

    find_by(conditions: {[column: string]: any}) {
        return this.where(conditions).toArray()[0];
    }

    count() {
        return this.toArray().length;
    }

    toArray() {
        return this.filteredIndexes().map((index) => this.source.data[index]);
    }

    private filteredIndexes() {
        const indexes = this.filters.reduce(
            (filteredIndexes, filter) => filter(this.source, filteredIndexes),
            Array(this.source.data.length),
        );
        return indexes.sort();
    }

    private filterByIndex(
        source: typeof ActiveHash, filteredIndexes: number[], conditions: {[column: string]: any}, not = false,
    ) {
        const filteredIndexesList = [];
        const restConditions = [];
        for (const column of Object.keys(conditions)) {
            const value = conditions[column];
            const indexes = source.searchIndexesByUsingIndex(column, value instanceof Array ? value : [value]);
            if (indexes) {
                filteredIndexesList.push(indexes);
            } else {
                restConditions.push(column);
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
        source: typeof ActiveHash, filteredIndexes: number[], conditions: {[column: string]: any}, not = false,
    ) {
        return filteredIndexes.filter((index) => {
            const record = source.data[index];
            const matched = Object.keys(conditions).every((column) => {
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
