import snakeCase = require("lodash.snakecase");
import {ActiveHash} from "./active_hash";
import {ActiveHashRelationBase} from "./active_hash_relation_base";

export class ActiveHashRecord implements ActiveHashRecordBase {
    id: any;
    _parentTable: ActiveHash<any>;

    constructor(source: ActiveHashRecordBase) {
        Object.assign(this, source);
    }

    protected hasMany<Record extends ActiveHashRecord>(
        target: ActiveHash<Record>, foreignKey?: keyof Record,
    ): ActiveHashRelationBase<Record> {
        const useForeignKey = foreignKey || snakeCase(this._parentTable.name) + "_id";
        return target.where({[useForeignKey]: this.id} as any);
    }

    protected hasOne<Record extends ActiveHashRecord>(
        target: ActiveHash<Record>, foreignKey?: keyof Record,
    ) {
        const useForeignKey = foreignKey || snakeCase(this._parentTable.name) + "_id";
        return target.findBy({[useForeignKey]: this.id} as any);
    }

    protected belongsTo<Record extends ActiveHashRecord>(
        target: ActiveHash<Record>, foreignKey?: keyof this,
    ) {
        const useForeignKey = foreignKey || snakeCase(target.name) + "_id";
        const id = (this as any)[useForeignKey];
        return target.findBy({id} as any);
    }
}

export interface ActiveHashRecordBase {
    id: any;
    [column: string]: any;
}
