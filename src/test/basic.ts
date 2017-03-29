import test from "ava";
import {ActiveHash, ActiveHashRecord} from "../lib";
import {toId} from "./util";

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
const Item = new ActiveHash("Item", ItemRecord);

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

test("basic queries", (t) => {
    t.is(Item.count(), 6);
    t.is(Item.find(11).name, "n11");
    t.is(Item.find_by({id: 100}), undefined);
    t.true(Item.isExists({id: 11}));
    const id123 = Item.where({id: [13, 12, 11]});
    t.is(id123.count(), 2);
    t.deepEqual(toId(id123), [11, 12]);
    t.deepEqual(toId(Item.all()), [11, 12, 21, 22, 23, 31]);
    t.deepEqual(toId(Item.where({type: "b"}).where({item_group_id: 2})), [22, 23]);
    t.deepEqual(toId(Item.where().not({type: "a"})), [22, 23, 31]);
    t.deepEqual(toId(Item.where().not({id: 11})), [12, 21, 22, 23, 31]);
});

test("associations", (t) => {
    const item11 = Item.find(11);
    t.is(item11.itemGroup, ItemGroup.find(item11.item_group_id));
    const itemGroup2 = ItemGroup.find(2);
    t.deepEqual(toId(itemGroup2.items), toId(Item.where({item_group_id: itemGroup2.id})));
});
