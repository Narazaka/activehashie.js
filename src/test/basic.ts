/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable max-classes-per-file */
// eslint-disable-next-line import/no-extraneous-dependencies
import test, { ExecutionContext } from "ava";
import { ActiveHash, ActiveHashRecord, Queryable } from "../lib";
import { toId } from "./util";

class ItemGroupRecord extends ActiveHashRecord {
    name: string;

    get items() {
        return this.hasMany(Item);
    }
}

class ItemRecord extends ActiveHashRecord {
    name: string;

    type: string;

    item_group_id: number;

    get itemGroup() {
        return this.belongsTo(ItemGroup);
    }
}

const ItemGroup = new ActiveHash("ItemGroup", ItemGroupRecord);
const Item = new ActiveHash("Item", ItemRecord);

Item.setData([
    { id: 11, name: "n11", type: "a", item_group_id: 1 },
    { id: 12, name: "n12", type: "a", item_group_id: 1 },
    { id: 21, name: "n21", type: "a", item_group_id: 2 },
    { id: 22, name: "n22", type: "b", item_group_id: 2 },
    { id: 23, name: "n23", type: "b", item_group_id: 2 },
    { id: 31, name: "n31", type: "b", item_group_id: 3 },
]);

ItemGroup.setData([new ItemGroupRecord({ id: 1, name: "g1" }), new ItemGroupRecord({ id: 2, name: "g2" })]);

function queryTestFor(model: Queryable<ItemRecord>) {
    return (t: ExecutionContext) => {
        t.is(model.length, 6);
        t.is(model.find(11).name, "n11");
        t.throws(() => model.find(100));
        t.is((model.findBy({ id: 11 }) as ItemRecord).name, "n11");
        t.is(model.findBy({ id: 100 }), undefined);
        if (model instanceof ActiveHash) t.true(model.isExists({ id: 11 }));
        const id123 = model.where({ id: [13, 12, 11] });
        t.is(id123.length, 2);
        t.deepEqual(id123.pluck("name"), ["n11", "n12"]);
        t.deepEqual(id123.pluck("id", "name"), [
            [11, "n11"],
            [12, "n12"],
        ]);
        t.deepEqual(model.pluck("name"), ["n11", "n12", "n21", "n22", "n23", "n31"]);
        t.deepEqual(model.pluck("id", "name"), [
            [11, "n11"],
            [12, "n12"],
            [21, "n21"],
            [22, "n22"],
            [23, "n23"],
            [31, "n31"],
        ]);
        t.deepEqual(toId(id123), [11, 12]);
        t.deepEqual(toId(model.all()), [11, 12, 21, 22, 23, 31]);
        t.deepEqual(model.all(), model.where());
        t.deepEqual(toId(model.where({ type: "b" }).where({ item_group_id: 2 })), [22, 23]);
        t.deepEqual(toId(model.not({ type: "a" })), [22, 23, 31]);
        t.deepEqual(toId(model.not({ id: 11 })), [12, 21, 22, 23, 31]);
        t.deepEqual(toId(model.filter(record => record.id > 30)), [31]);
        t.deepEqual(toId(model.filterByColumn("id", id => id > 30)), [31]);
        t.deepEqual(toId(model.where({ type: "b" }).filter(record => record.id < 30)), [22, 23]);
        t.deepEqual(toId(model.where({ type: "b" }).filterByColumn("id", id => id < 30)), [22, 23]);
        t.deepEqual(
            Array.from(model.group("type").values()).map(records => records.toArray()),
            [model.where({ type: "a" }).toArray(), model.where({ type: "b" }).toArray()],
        );
        t.deepEqual(
            Array.from(model.groupBy((record: ItemRecord) => Math.floor(record.id / 10)).values()).map(records =>
                records.pluck("id"),
            ),
            [[11, 12], [21, 22, 23], [31]],
        );
        t.deepEqual(
            Array.from(
                model.groupByColumn("item_group_id", (itemGroupId: number) => itemGroupId > 1).values(),
            ).map(records => records.pluck("id")),
            [
                [11, 12],
                [21, 22, 23, 31],
            ],
        );
        t.deepEqual(model.none().pluck("id"), []);
    };
}

test("basic queries for ActiveHash", queryTestFor(Item));
test("basic queries for eager", queryTestFor(Item.eager()));
test("basic queries for lazy", queryTestFor(Item.lazy()));

test("eager and lazy", t => {
    t.deepEqual(
        Item.eager()
            .where({ type: "b" })
            .lazy()
            .where({ item_group_id: 2 })
            .toArray(),
        Item.lazy()
            .where({ type: "b" })
            .eager()
            .where({ item_group_id: 2 })
            .toArray(),
    );
});

test("associations", t => {
    const item11 = Item.find(11);
    t.is(item11.itemGroup, ItemGroup.find(item11.item_group_id));
    const itemGroup2 = ItemGroup.find(2);
    t.deepEqual(toId(itemGroup2.items), toId(Item.where({ item_group_id: itemGroup2.id })));
});
