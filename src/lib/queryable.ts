import { ActiveHashRecord } from "./active_hash_record";
import { ActiveHashRelationBase } from "./active_hash_relation_base";
import { ActiveHashRelationEager } from "./active_hash_relation_eager";
import { ActiveHashRelationLazy } from "./active_hash_relation_lazy";

export type Contitions<Record extends ActiveHashRecord> = {
    [column in keyof Record]?: Record[column] | Array<Record[column]> | null | undefined;
};
export type ActiveHashRecordFilter<Record extends ActiveHashRecord> = (record: Record) => boolean;
export type ActiveHashRecordValueFilter<Record extends ActiveHashRecord, Column extends keyof Record> = (
    value: Record[Column],
) => boolean;
export type ActiveHashRecordMapper<Record extends ActiveHashRecord, Result> = (record: Record) => Result;
export type ActiveHashRecordValueMapper<Record extends ActiveHashRecord, Column extends keyof Record, Result> = (
    value: Record[Column],
) => Result;

export interface Queryable<Record extends ActiveHashRecord> {
    name: string;
    length: number;
    all(): ActiveHashRelationBase<Record>;
    eager(): ActiveHashRelationEager<Record>;
    lazy(): ActiveHashRelationLazy<Record>;
    where(conditions?: Contitions<Record>): ActiveHashRelationBase<Record>;
    not(conditions: Contitions<Record>): ActiveHashRelationBase<Record>;
    group<Column extends keyof Record>(column: Column): Map<Record[Column], ActiveHashRelationBase<Record>>;
    groupBy<Result>(callback: ActiveHashRecordMapper<Record, Result>): Map<Result, ActiveHashRelationBase<Record>>;
    groupByColumn<Column extends keyof Record, Result>(
        column: Column,
        callback: ActiveHashRecordValueMapper<Record, Column, Result>,
    ): Map<Result, ActiveHashRelationBase<Record>>;
    none(): ActiveHashRelationBase<Record>;
    filter(callback: ActiveHashRecordFilter<Record>): ActiveHashRelationBase<Record>;
    filterByColumn<Column extends keyof Record>(
        column: Column,
        callback: ActiveHashRecordValueFilter<Record, Column>,
    ): ActiveHashRelationBase<Record>;
    findBy(conditions: Contitions<Record>): Record | undefined;
    find(id: any): Record;
    toArray(): Record[];
    pluck<Column extends keyof Record>(column: Column): Array<Record[Column]>;
    pluck(...columns: Array<keyof Record>): Array<Array<Record[keyof Record]>>;
}

export interface ActiveHashRelationByEvaluation<Record extends ActiveHashRecord> {
    eager: ActiveHashRelationEager<Record>;
    lazy: ActiveHashRelationLazy<Record>;
}

export interface QueryableByEvaluation<
    Record extends ActiveHashRecord,
    Evaluation extends keyof ActiveHashRelationByEvaluation<Record>
> extends Queryable<Record> {
    all(): ActiveHashRelationByEvaluation<Record>[Evaluation];
    where(conditions?: Contitions<Record>): ActiveHashRelationByEvaluation<Record>[Evaluation];
    not(conditions: Contitions<Record>): ActiveHashRelationByEvaluation<Record>[Evaluation];
    group<Column extends keyof Record>(
        column: Column,
    ): Map<Record[Column], ActiveHashRelationByEvaluation<Record>[Evaluation]>;
    groupBy<Result>(
        callback: ActiveHashRecordMapper<Record, Result>,
    ): Map<Result, ActiveHashRelationByEvaluation<Record>[Evaluation]>;
    groupByColumn<Column extends keyof Record, Result>(
        column: Column,
        callback: ActiveHashRecordValueMapper<Record, Column, Result>,
    ): Map<Result, ActiveHashRelationByEvaluation<Record>[Evaluation]>;
    none(): ActiveHashRelationByEvaluation<Record>[Evaluation];
    filter(callback: ActiveHashRecordFilter<Record>): ActiveHashRelationByEvaluation<Record>[Evaluation];
    filterByColumn<Column extends keyof Record>(
        column: Column,
        callback: ActiveHashRecordValueFilter<Record, Column>,
    ): ActiveHashRelationByEvaluation<Record>[Evaluation];
}

export interface EagerQueryable<Record extends ActiveHashRecord> extends QueryableByEvaluation<Record, "eager"> {}
export interface LazyQueryable<Record extends ActiveHashRecord> extends QueryableByEvaluation<Record, "lazy"> {}
