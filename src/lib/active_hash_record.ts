import {ActiveHash} from "./active_hash";
import {ActiveHashRelationBase} from "./active_hash_relation_base";
import snakeCase = require("lodash.snakecase");

export class ActiveHashRecord implements ActiveHashRecordBase {
    id: any;
    _parentTable: ActiveHash<this>;

    constructor(source: ActiveHashRecordBase) {
        Object.assign(this, source);
    }

    protected hasMany<Record extends ActiveHashRecord>(
        target: ActiveHash<Record>, foreignKey?: keyof Record,
    ): ActiveHashRelationBase<Record> {
        const useforeignKey = foreignKey || snakeCase(this._parentTable.name) + "_id";
        return target.where(<any> {[useforeignKey]: this.id});
    }

    protected hasOne<Record extends ActiveHashRecord>(
        target: ActiveHash<Record>, foreignKey?: keyof Record,
    ) {
        const useforeignKey = foreignKey || snakeCase(this._parentTable.name) + "_id";
        return target.findBy(<any> {[useforeignKey]: this.id});
    }

    protected belongsTo<Record extends ActiveHashRecord>(
        target: ActiveHash<Record>, foreignKey?: keyof this,
    ) {
        const useforeignKey = foreignKey || snakeCase(target.name) + "_id";
        const id = (<any> this)[useforeignKey];
        return target.findBy(<any> {id});
    }
};

export interface ActiveHashRecordBase {
    id: any;
    [column: string]: any;
}
