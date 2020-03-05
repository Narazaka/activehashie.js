import { ActiveHashRecord, ActiveHashRelationBase } from "../../lib";

export function toId<Record extends ActiveHashRecord>(relation: ActiveHashRelationBase<Record>) {
    return relation.toArray().map(record => record.id);
}
