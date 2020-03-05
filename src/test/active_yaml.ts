/* eslint-disable max-classes-per-file */
// eslint-disable-next-line import/no-extraneous-dependencies
import test from "ava";
import * as fs from "fs";
import * as path from "path";
import { ActiveHashRecord, ActiveYaml } from "../lib";
import { toId } from "./util";

function fromCwd(target: string) {
    return path.join(__dirname, target);
}

class ItemGroupRecord extends ActiveHashRecord {
    name: string;
}

class ItemRecord extends ActiveHashRecord {
    name: string;

    type: string;

    item_group_id: number;
}

const ItemGroup = new ActiveYaml("ItemGroup", ItemGroupRecord, { rootPath: fromCwd(".") });

const Item = new ActiveYaml("Item", ItemRecord, { rootPath: fromCwd(".") });

test.before(() => {
    fs.writeFileSync(
        fromCwd("item_groups.yml"),
        `---
data1:
    id: 1
    name: g1
data2:
    id: 2
    name: g2
`,
        "utf8",
    );
    fs.mkdirSync(fromCwd("items"));
    fs.writeFileSync(
        fromCwd("items/data1.yml"),
        `---
data11:
    id: 11
    name: i11
    type: a
    item_group_id: 1
data12:
    id: 12
    name: i12
    type: a
    item_group_id: 1
`,
        "utf8",
    );
    fs.writeFileSync(
        fromCwd("items/data2.yml"),
        `---
data21:
    id: 21
    name: i21
    type: a
    item_group_id: 2
data22:
    id: 22
    name: i22
    type: b
    item_group_id: 2
`,
        "utf8",
    );
});

test.after(() => {
    fs.unlinkSync(fromCwd("item_groups.yml"));
    fs.unlinkSync(fromCwd("items/data1.yml"));
    fs.rmdirSync(fromCwd("items"));
});

test("from single file", t => {
    t.is(ItemGroup.length, 2);
    t.deepEqual(toId(ItemGroup.all()), [1, 2]);
});

test("from multiple files", t => {
    t.is(Item.length, 4);
    t.deepEqual(toId(Item.all()), [11, 12, 21, 22]);
    fs.unlinkSync(fromCwd("items/data2.yml"));
    Item.reload();
    t.deepEqual(toId(Item.all()), [11, 12, 21, 22]);
    Item.reload(true);
    t.deepEqual(toId(Item.all()), [11, 12]);
});
