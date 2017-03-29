import {ActiveHash} from "./active_hash";
import {ActiveHashRelation} from "./active_hash_relation";
import snakeCase = require("lodash.snakecase");

export class ActiveHashRecord implements ActiveHashRecordBase {
    id: any;
    _parentTable: ActiveHash<this>;

    constructor(source: ActiveHashRecordBase) {
        Object.assign(this, source);
    }

    protected hasMany<Record extends ActiveHashRecord>(
        target: ActiveHash<Record>, foreignKey?: keyof Record,
    ): ActiveHashRelation<Record> {
        const useforeignKey = foreignKey || snakeCase(this._parentTable.name) + "_id";
        return target.where(<any> {[useforeignKey]: this.id});
    }

    protected hasOne<Record extends ActiveHashRecord>(
        target: ActiveHash<Record>, foreignKey?: keyof Record,
    ) {
        const useforeignKey = foreignKey || snakeCase(this._parentTable.name) + "_id";
        return target.find_by(<any> {[useforeignKey]: this.id});
    }

    protected belongsTo<Record extends ActiveHashRecord>(
        target: ActiveHash<Record>, foreignKey?: keyof this,
    ) {
        const useforeignKey = foreignKey || snakeCase(target.name) + "_id";
        const id = (<any> this)[useforeignKey];
        return target.find_by(<any> {id});
    }
};

export interface ActiveHashRecordBase {
    id: any;
    [column: string]: any;
}
