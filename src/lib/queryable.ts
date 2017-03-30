import {Contitions} from "./active_hash";
import {ActiveHashRecord} from "./active_hash_record";
import {ActiveHashRelation} from "./active_hash_relation";

export interface Queryable<Record extends ActiveHashRecord> {
    name: string;
    all(): ActiveHashRelation<Record>;
    where(conditions?: Contitions<Record>): ActiveHashRelation<Record>;
    find_by(conditions: Contitions<Record>): Record | undefined;
    find(id: any): Record;
    count(): number;
}
