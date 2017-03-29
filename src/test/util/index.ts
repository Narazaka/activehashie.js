import {ActiveHashRecord, ActiveHashRelation} from "../../lib";

export function toId<Record extends ActiveHashRecord>(relation: ActiveHashRelation<Record>) {
    return relation.toArray().map((record) => record.id);
}
