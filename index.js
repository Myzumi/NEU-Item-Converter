const fs = require("fs");
const chalk = require("chalk");
const array = [];
const missing_types = [];
const yml = require("js-yaml");
const blacklist = require("./blacklist.json");
let one = 1;
const itemlist = [];

async function prepare() {
  if (!fs.existsSync(`./items/`)) throw new Error("No item Folder Found");
  if (!fs.existsSync(`./converted-items/`))
    throw new Error("No converted item Folder Found");
  if (fs.existsSync("./output/missing_types.json"))
    fs.unlinkSync("./output/missing_types.json");
  if (fs.existsSync("./output/output.json"))
    fs.unlinkSync("./output/output.json");
    if (fs.existsSync("./output/items.yml"))
    fs.unlinkSync("./output/items.yml");
  fs.readdirSync(`./converted-items/`).forEach((file) => {
    fs.unlinkSync(`./converted-items/${file}`);
  });
}

async function init() {
  await fs.readdirSync(`./items/`).forEach(async (file) => {
    let data = JSON.parse(fs.readFileSync(`./items/${file}`));
    let ditemid = String(data["itemid"]);
    let nbtdata = String(data["nbttag"]);
    let lore = data["lore"];
    let displayname = data["displayname"].split("'").join("`")
    if (blacklist.absoulute.includes(ditemid)) return;
    if (ditemid.includes("acacia") || ditemid.includes("rail")) return;
    let itemid = await GetItemID(data.itemid);
    if (itemid === null) {
      missing_types.push(data.itemid);
      itemid = data.itemid;
    }
    array.push(
      JSON.stringify({
        item: file.replace(".json", ""),
        id: itemid,
      })
    );
    let DataNBT = await ConvertNBTToJson(nbtdata);
    if (itemid !== null) {
      await PrepareOutput(
        String(itemid).replace('minecraft:', 'LEGACY_'),
        { displayname, DataNBT, lore },
        file.replace(".json", "")
      );
    }
  });
  fs.writeFileSync(`./output/output.json`, JSON.stringify(array, null, 1));
  fs.writeFileSync(
    `./output/missing_types.json`,
    JSON.stringify(missing_types, null, 1)
  );
}

async function PrepareLore(lore) {
  let itemlore = lore;
  let output = [];
  itemlore.forEach((obj) => {
    output.push(`- '${obj.split("'").join("`")}'`);
  });
  return output.join("\n    ");
}

async function PrepareOutput(id, data, itemname) {
  let displayname = data["displayname"];
  let NBT = data["DataNBT"];
  let lore = data["lore"];
  let extra = ``
  const itemlore = await PrepareLore(lore);
  if (String(NBT.texture).startsWith('ey') || String(NBT.texture).startsWith('ew')) {
    extra = `
    skull-texture:
      value: ${NBT.texture}
      uuid: ${NBT.id}`
  }
  if (id === "PLAYER_HEAD") {
    itemlist.push(
        `${itemname}:
  base:
    material: ${id}
    name: ${displayname}
    lore:
    ${itemlore}${extra}
`
    );
  } else {
    itemlist.push(
      `${itemname}:
  base:
    material: ${id}
    name: '${displayname}'
    lore:
    ${itemlore}
`
    );
  }
  console.log(itemlist.length)
  if (itemlist.length === 2748) {
    fs.writeFileSync(`./output/items.yml`, itemlist.join(''))
  }
}

async function GetItemID(id) {
  if (id === "minecraft:skull") return "PLAYER_HEAD";
  if (id === "minecraft:paper") return "PAPER";
  if (id === "minecraft:enchanted_book") return "ENCHANTED_BOOK";
  if (id === "minecraft:potion") return "POTION";
  if (id === "minecraft:leather_leggings") return "LEATHER_LEGGINGS";
  if (id === "minecraft:diamond_chestplate") return "DIAMOND_CHESTPLATE";
  if (id === "minecraft:diamond_helmet") return "DIAMOND_HELMET";
  if (id === "minecraft:diamond_boots") return "DIAMOND_BOOTS";
  if (id === "minecraft:diamond_leggings") return "DIAMOND_LEGGINGS";
  if (id === 'minecraft:blaze_rod') return 'BLAZE_ROD'
  if (id === 'minecraft:bed') return 'white_bed'
  //if (id === 'minecraft:map') return 'PAPER'
  if (id === 'minecraft:stained_glass') return 'RED_STAINED_GLASS'
  if (id === 'minecraft:deadbush') return 'dead_bush'

  return null;
}

async function ConvertNBTToJson(NBT) {
  let obj = String(NBT).split('"');
  let id = obj[1];
  let texture = obj[3];
  return { id, texture };
}

console.log(chalk.yellow("Preparing Operation"));
prepare();
console.log(chalk.yellow("Converting Items..."));
init();
console.log(chalk.greenBright("Done Converted Items"));
process.on("unhandledRejection", (error) => {
  throw new Error(error.stack);
});
