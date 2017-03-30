import {Contitions} from "./active_hash";
import {ActiveHashRecord} from "./active_hash_record";
import {ActiveHashRelationBase} from "./active_hash_relation_base";
import {ActiveHashRelationEager} from "./active_hash_relation_eager";
import {ActiveHashRelationLazy} from "./active_hash_relation_lazy";

export interface Queryable<Record extends ActiveHashRecord> {
    name: string;
    all(): ActiveHashRelationBase<Record>;
    eager(): ActiveHashRelationEager<Record>;
    lazy(): ActiveHashRelationLazy<Record>;
    where(conditions?: Contitions<Record>): ActiveHashRelationBase<Record>;
    not(conditions: Contitions<Record>): ActiveHashRelationBase<Record>;
    filter(callback: (record: Record) => boolean): ActiveHashRelationBase<Record>;
    filterByColumn<Column extends keyof Record>(column: Column, callback: (value: Record[Column]) => boolean):
        ActiveHashRelationBase<Record>;
    find_by(conditions: Contitions<Record>): Record | undefined;
    find(id: any): Record;
    count(): number;
    toArray(): Record[];
    pluck<Column extends keyof Record>(column: Column): Array<Record[Column]>;
    pluck(...columns: Array<keyof Record>): Array<Array<Record[keyof Record]>>;
}

export interface ActiveHashRelationByEvaluation<Record extends ActiveHashRecord> {
    eager: ActiveHashRelationEager<Record>;
    lazy: ActiveHashRelationLazy<Record>;
};

export interface QueryableByEvaluation<
    Record extends ActiveHashRecord,
    Evaluation extends keyof ActiveHashRelationByEvaluation<Record>
> extends Queryable<Record> {
    all(): ActiveHashRelationByEvaluation<Record>[Evaluation];
    where(conditions?: Contitions<Record>): ActiveHashRelationByEvaluation<Record>[Evaluation];
    not(conditions: Contitions<Record>): ActiveHashRelationByEvaluation<Record>[Evaluation];
    filter(callback: (record: Record) => boolean): ActiveHashRelationByEvaluation<Record>[Evaluation];
    filterByColumn<Column extends keyof Record>(column: Column, callback: (value: Record[Column]) => boolean):
        ActiveHashRelationByEvaluation<Record>[Evaluation];
};

export interface EagerQueryable<Record extends ActiveHashRecord> extends QueryableByEvaluation<Record, "eager"> { }
export interface LazyQueryable<Record extends ActiveHashRecord> extends QueryableByEvaluation<Record, "lazy"> { }
