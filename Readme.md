# [activehashie.js - The ActiveHash like something](https://github.com/Narazaka/activehashie.js)

[![npm](https://img.shields.io/npm/v/activehashie.svg)](https://www.npmjs.com/package/activehashie)
[![npm license](https://img.shields.io/npm/l/activehashie.svg)](https://www.npmjs.com/package/activehashie)
[![npm download total](https://img.shields.io/npm/dt/activehashie.svg)](https://www.npmjs.com/package/activehashie)
[![npm download by month](https://img.shields.io/npm/dm/activehashie.svg)](https://www.npmjs.com/package/activehashie)

[![Dependency Status](https://david-dm.org/Narazaka/activehashie.js.svg)](https://david-dm.org/Narazaka/activehashie.js)
[![devDependency Status](https://david-dm.org/Narazaka/activehashie.js/dev-status.svg)](https://david-dm.org/Narazaka/activehashie.js#info=devDependencies)
[![Travis Build Status](https://travis-ci.org/Narazaka/activehashie.js.svg)](https://travis-ci.org/Narazaka/activehashie.js)
[![AppVeyor Build Status](https://ci.appveyor.com/api/projects/status/github/Narazaka/activehashie.js?svg=true)](https://ci.appveyor.com/project/Narazaka/activehashie-js)
[![codecov.io](https://codecov.io/github/Narazaka/activehashie.js/coverage.svg?branch=master)](https://codecov.io/github/Narazaka/activehashie.js?branch=master)
[![Code Climate](https://codeclimate.com/github/Narazaka/activehashie.js/badges/gpa.svg)](https://codeclimate.com/github/Narazaka/activehashie.js)

Immutable(currently) table whose api is like great [ActiveHash](https://github.com/zilkey/active_hash).

## Synopsys

```typescript
// TypeScript!
import {ActiveHash, ActiveHashRecord} from "activehashie";

class ItemGroupRecord extends ActiveHashRecord {
    name: string;
    get items() { return this.hasMany(Item); }
}

class ItemRecord extends ActiveHashRecord {
    name: string;
    type: string;
    item_group_id: number;
    get itemGroup() { return this.belongsTo(ItemGroup); }
}

const ItemGroup = new ActiveHash("ItemGroup", ItemGroupRecord);
const Item = new ActiveHash("Item", ItemRecord, { indexColumns: "item_group_id" });

Item.setData([
    {id: 11, name: "n11", type: "a", item_group_id: 1},
    {id: 12, name: "n12", type: "a", item_group_id: 1},
    {id: 21, name: "n21", type: "a", item_group_id: 2},
    {id: 22, name: "n22", type: "b", item_group_id: 2},
    {id: 23, name: "n23", type: "b", item_group_id: 2},
    {id: 31, name: "n31", type: "b", item_group_id: 3},
]);

ItemGroup.setData([
    new ItemGroupRecord({id: 1, name: "g1"}),
    new ItemGroupRecord({id: 2, name: "g2"}),
]);

Item.
    where({id: [11, 21, 22]}).
    where({item_group_id: 2}).
    not({type: "a"}).
    toArray()[0] ===
    Item.find(22);
```

## See also

- [ActiveHash](https://github.com/zilkey/active_hash)

## License

This is released under [MIT License](http://narazaka.net/license/MIT?2017).
