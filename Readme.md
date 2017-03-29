# [activehashie.js - The ActiveHash like something](https://github.com/Narazaka/activehashie.js)

Immutable(currently) table whose api is like great [ActiveHash](https://github.com/zilkey/active_hash).

## Synopsys

```typescript
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
