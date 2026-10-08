"use strict";(()=>{var vu={low:{renderDistance:4,fancyLeaves:!1,smoothLighting:!0,shaderPack:"off",clouds:!0,resolutionScale:1,mipmaps:!0},medium:{renderDistance:6,fancyLeaves:!0,smoothLighting:!0,shaderPack:"fancy",shadowQuality:1024,clouds:!0,resolutionScale:1,mipmaps:!0},high:{renderDistance:8,fancyLeaves:!0,smoothLighting:!0,shaderPack:"ultra",shadowQuality:2048,clouds:!0,resolutionScale:1,mipmaps:!0}},bu={controls:"keyboard",controlsChosen:!1,touchSensitivity:1,touchButtonScale:1,preset:"low",shaderPack:"off",resourcePack:"default",renderDistance:4,fov:70,sensitivity:1,invertY:!1,viewBobbing:!0,brightness:.5,fancyLeaves:!1,smoothLighting:!0,shadows:!1,shadowQuality:1024,waving:!1,clouds:!0,resolutionScale:1,mipmaps:!0,guiScale:2,fullscreen:!1,volume:.6,showFps:!1,maxFps:0,keybinds:{}},Zp="blockforge.settings.v1";function Ca(i){return i.shadows=i.shaderPack!=="off",i.waving=i.shaderPack!=="off",i}function vv(){try{return matchMedia("(pointer: coarse)").matches&&!matchMedia("(any-pointer: fine)").matches&&(navigator.maxTouchPoints||0)>0}catch{return!1}}function yu(i){return!i.controlsChosen&&vv()&&(i.controls="touch"),i}function Jp(){try{let i=localStorage.getItem(Zp);if(i){let t=JSON.parse(i),e={...bu,...t};return e.keybinds={...t.keybinds&&typeof t.keybinds=="object"?t.keybinds:{}},t.shaderPack||(e.shaderPack=t.shadows||t.waving?"fancy":"off"),yu(e)}}catch{}return yu(Ca({...bu,keybinds:{}}))}function jp(i){for(let t of Object.keys(i))delete i[t];return Object.assign(i,bu),i.keybinds={},yu(Ca(i))}function bi(i){try{localStorage.setItem(Zp,JSON.stringify(i))}catch{}}function Ll(i,t){return Object.assign(i,vu[t]),i.preset=t,Ca(i)}var Bi=["white","orange","magenta","light_blue","yellow","lime","pink","gray","light_gray","cyan","purple","blue","brown","green","red","black"],_v=["oak","spruce","birch","jungle","acacia","dark_oak","mangrove","cherry"],es=i=>i.split("_").map(t=>t[0].toUpperCase()+t.slice(1)).join(" "),Bs=[],Z=i=>(Bs.push(i),i);Z({name:"air",display:"Air",cat:"natural",tex:"missing",solid:!1,transparent:!0,opacity:0,replaceable:!0,item:!1,layer:"cutout",shape:"cross"});Z({name:"grass_block",display:"Grass Block",cat:"natural",tex:{top:"grass_top",bottom:"dirt",side:"grass_side"},tint:"grass",tintMask:!0,sound:"grass"});Z({name:"snowy_grass_block",display:"Snowy Grass Block",cat:"natural",tex:{top:"snow",bottom:"dirt",side:"grass_side_snowy"},sound:"snow"});Z({name:"dirt",display:"Dirt",cat:"natural",tex:"dirt",sound:"gravel"});Z({name:"coarse_dirt",display:"Coarse Dirt",cat:"natural",tex:"coarse_dirt",sound:"gravel"});Z({name:"podzol",display:"Podzol",cat:"natural",tex:{top:"podzol_top",bottom:"dirt",side:"podzol_side"},sound:"gravel"});Z({name:"rooted_dirt",display:"Rooted Dirt",cat:"natural",tex:"rooted_dirt",sound:"gravel"});Z({name:"mycelium",display:"Mycelium",cat:"natural",tex:{top:"mycelium_top",bottom:"dirt",side:"mycelium_side"},sound:"grass"});Z({name:"dirt_path",display:"Dirt Path",cat:"natural",tex:{top:"path_top",bottom:"dirt",side:"path_side"},sound:"grass"});Z({name:"mud",display:"Mud",cat:"natural",tex:"mud",sound:"gravel"});Z({name:"clay",display:"Clay",cat:"natural",tex:"clay",sound:"gravel"});Z({name:"moss_block",display:"Moss Block",cat:"natural",tex:"moss",sound:"grass"});Z({name:"sand",display:"Sand",cat:"natural",tex:"sand",sound:"sand"});Z({name:"red_sand",display:"Red Sand",cat:"natural",tex:"red_sand",sound:"sand"});Z({name:"gravel",display:"Gravel",cat:"natural",tex:"gravel",sound:"gravel"});Z({name:"stone",display:"Stone",cat:"natural",tex:"stone"});Z({name:"granite",display:"Granite",cat:"natural",tex:"granite"});Z({name:"diorite",display:"Diorite",cat:"natural",tex:"diorite"});Z({name:"andesite",display:"Andesite",cat:"natural",tex:"andesite"});Z({name:"deepslate",display:"Deepslate",cat:"natural",tex:{top:"deepslate_top",bottom:"deepslate_top",side:"deepslate"},orient:"axis"});Z({name:"tuff",display:"Tuff",cat:"natural",tex:"tuff"});Z({name:"calcite",display:"Calcite",cat:"natural",tex:"calcite"});Z({name:"dripstone_block",display:"Dripstone Block",cat:"natural",tex:"dripstone"});Z({name:"bedrock",display:"Bedrock",cat:"natural",tex:"bedrock"});Z({name:"snow_block",display:"Snow Block",cat:"natural",tex:"snow",sound:"snow"});Z({name:"snow",display:"Snow",cat:"natural",tex:"snow",shape:"layer",sound:"snow",replaceable:!0,support:"solid"});Z({name:"ice",display:"Ice",cat:"natural",tex:"ice",layer:"translucent",cullSelf:!0,opacity:1,sound:"glass"});Z({name:"packed_ice",display:"Packed Ice",cat:"natural",tex:"packed_ice",sound:"glass"});Z({name:"blue_ice",display:"Blue Ice",cat:"natural",tex:"blue_ice",sound:"glass"});Z({name:"obsidian",display:"Obsidian",cat:"natural",tex:"obsidian"});Z({name:"crying_obsidian",display:"Crying Obsidian",cat:"natural",tex:"crying_obsidian",light:10});Z({name:"netherrack",display:"Netherrack",cat:"natural",tex:"netherrack"});Z({name:"soul_sand",display:"Soul Sand",cat:"natural",tex:"soul_sand",sound:"sand"});Z({name:"soul_soil",display:"Soul Soil",cat:"natural",tex:"soul_soil",sound:"sand"});Z({name:"magma_block",display:"Magma Block",cat:"natural",tex:"magma",light:3});Z({name:"basalt",display:"Basalt",cat:"natural",tex:{end:"basalt_top",side:"basalt_side"},orient:"axis"});Z({name:"blackstone",display:"Blackstone",cat:"natural",tex:{top:"blackstone_top",bottom:"blackstone_top",side:"blackstone"}});Z({name:"end_stone",display:"End Stone",cat:"natural",tex:"end_stone"});Z({name:"amethyst_block",display:"Block of Amethyst",cat:"natural",tex:"amethyst",sound:"glass"});Z({name:"bone_block",display:"Bone Block",cat:"natural",tex:{end:"bone_top",side:"bone_side"},orient:"axis"});var ym=[["coal","Coal"],["iron","Iron"],["copper","Copper"],["gold","Gold"],["redstone","Redstone"],["lapis","Lapis Lazuli"],["diamond","Diamond"],["emerald","Emerald"]];for(let[i,t]of ym)Z({name:`${i}_ore`,display:`${t} Ore`,cat:"ores",tex:`ore_stone_${i}`,light:0});for(let[i,t]of ym)Z({name:`deepslate_${i}_ore`,display:`Deepslate ${t} Ore`,cat:"ores",tex:`ore_deepslate_${i}`});Z({name:"nether_gold_ore",display:"Nether Gold Ore",cat:"ores",tex:"ore_nether_gold"});Z({name:"nether_quartz_ore",display:"Nether Quartz Ore",cat:"ores",tex:"ore_nether_quartz"});var xv=[["coal_block","Block of Coal"],["iron_block","Block of Iron"],["copper_block","Block of Copper"],["gold_block","Block of Gold"],["redstone_block","Block of Redstone"],["lapis_block","Block of Lapis Lazuli"],["diamond_block","Block of Diamond"],["emerald_block","Block of Emerald"],["netherite_block","Block of Netherite"],["raw_iron_block","Block of Raw Iron"],["raw_copper_block","Block of Raw Copper"],["raw_gold_block","Block of Raw Gold"],["exposed_copper","Exposed Copper"],["weathered_copper","Weathered Copper"],["oxidized_copper","Oxidized Copper"]];for(let[i,t]of xv)Z({name:i,display:t,cat:"ores",tex:i,sound:"metal"});for(let i of _v){let t=es(i),e=i;Z({name:`${i}_log`,display:`${t} Log`,cat:"wood",tex:{end:`${e}_log_top`,side:`${e}_log`},orient:"axis",sound:"wood"}),Z({name:`${i}_wood`,display:`${t} Wood`,cat:"wood",tex:`${e}_log`,orient:"axis",sound:"wood"}),Z({name:`stripped_${i}_log`,display:`Stripped ${t} Log`,cat:"wood",tex:{end:`stripped_${i}_log_top`,side:`stripped_${i}_log`},orient:"axis",sound:"wood"}),Z({name:`${i}_planks`,display:`${t} Planks`,cat:"wood",tex:`${i}_planks`,sound:"wood"});let n=i!=="spruce"&&i!=="birch"&&i!=="cherry";Z({name:`${i}_leaves`,display:`${t} Leaves`,cat:"wood",tex:`${i}_leaves`,layer:"cutout",opacity:1,tint:n?"foliage":"none",sound:"grass",wave:"leaves"}),Z({name:`${i}_slab`,display:`${t} Slab`,cat:"wood",tex:`${i}_planks`,shape:"slab",sound:"wood"}),Z({name:`${i}_stairs`,display:`${t} Stairs`,cat:"wood",tex:`${i}_planks`,shape:"stairs",sound:"wood"}),Z({name:`${i}_fence`,display:`${t} Fence`,cat:"wood",tex:`${i}_planks`,shape:"fence",family:"wood_fence",sound:"wood"}),Z({name:`${i}_door`,display:`${t} Door`,cat:"wood",tex:{top:`${i}_door_top`,bottom:`${i}_door_bottom`,side:`${i}_door_bottom`},shape:"door",layer:"cutout",sound:"wood"}),Z({name:`${i}_trapdoor`,display:`${t} Trapdoor`,cat:"wood",tex:`${i}_trapdoor`,shape:"trapdoor",layer:"cutout",sound:"wood"}),Z({name:`${i}_sapling`,display:`${t} Sapling`,cat:"wood",tex:`${i}_sapling`,shape:"cross",layer:"cutout",solid:!1,support:"soil",sound:"grass",wave:"plant"})}var wv=[["cobblestone","Cobblestone","cobblestone"],["mossy_cobblestone","Mossy Cobblestone","mossy_cobblestone"],["smooth_stone","Smooth Stone","smooth_stone"],["stone_bricks","Stone Bricks","stone_bricks"],["mossy_stone_bricks","Mossy Stone Bricks","mossy_stone_bricks"],["cracked_stone_bricks","Cracked Stone Bricks","cracked_stone_bricks"],["chiseled_stone_bricks","Chiseled Stone Bricks","chiseled_stone_bricks"],["bricks","Bricks","bricks"],["polished_granite","Polished Granite","polished_granite"],["polished_diorite","Polished Diorite","polished_diorite"],["polished_andesite","Polished Andesite","polished_andesite"],["cobbled_deepslate","Cobbled Deepslate","cobbled_deepslate"],["polished_deepslate","Polished Deepslate","polished_deepslate"],["deepslate_bricks","Deepslate Bricks","deepslate_bricks"],["deepslate_tiles","Deepslate Tiles","deepslate_tiles"],["polished_tuff","Polished Tuff","polished_tuff"],["mud_bricks","Mud Bricks","mud_bricks"],["packed_mud","Packed Mud","packed_mud"],["prismarine","Prismarine","prismarine"],["prismarine_bricks","Prismarine Bricks","prismarine_bricks"],["dark_prismarine","Dark Prismarine","dark_prismarine"],["nether_bricks","Nether Bricks","nether_bricks"],["red_nether_bricks","Red Nether Bricks","red_nether_bricks"],["cracked_nether_bricks","Cracked Nether Bricks","cracked_nether_bricks"],["chiseled_nether_bricks","Chiseled Nether Bricks","chiseled_nether_bricks"],["polished_blackstone","Polished Blackstone","polished_blackstone"],["polished_blackstone_bricks","Polished Blackstone Bricks","polished_blackstone_bricks"],["end_stone_bricks","End Stone Bricks","end_stone_bricks"],["purpur_block","Purpur Block","purpur"],["terracotta","Terracotta","terracotta"]];for(let[i,t,e]of wv)Z({name:i,display:t,cat:"building",tex:e});Z({name:"sandstone",display:"Sandstone",cat:"building",tex:{top:"sandstone_top",bottom:"sandstone_bottom",side:"sandstone"}});Z({name:"chiseled_sandstone",display:"Chiseled Sandstone",cat:"building",tex:{top:"sandstone_top",bottom:"sandstone_top",side:"chiseled_sandstone"}});Z({name:"cut_sandstone",display:"Cut Sandstone",cat:"building",tex:{top:"sandstone_top",bottom:"sandstone_top",side:"cut_sandstone"}});Z({name:"smooth_sandstone",display:"Smooth Sandstone",cat:"building",tex:"sandstone_top"});Z({name:"red_sandstone",display:"Red Sandstone",cat:"building",tex:{top:"red_sandstone_top",bottom:"red_sandstone_bottom",side:"red_sandstone"}});Z({name:"chiseled_red_sandstone",display:"Chiseled Red Sandstone",cat:"building",tex:{top:"red_sandstone_top",bottom:"red_sandstone_top",side:"chiseled_red_sandstone"}});Z({name:"cut_red_sandstone",display:"Cut Red Sandstone",cat:"building",tex:{top:"red_sandstone_top",bottom:"red_sandstone_top",side:"cut_red_sandstone"}});Z({name:"smooth_red_sandstone",display:"Smooth Red Sandstone",cat:"building",tex:"red_sandstone_top"});Z({name:"quartz_block",display:"Block of Quartz",cat:"building",tex:{top:"quartz_top",bottom:"quartz_top",side:"quartz_side"}});Z({name:"chiseled_quartz_block",display:"Chiseled Quartz Block",cat:"building",tex:{end:"chiseled_quartz_top",side:"chiseled_quartz"},orient:"axis"});Z({name:"quartz_pillar",display:"Quartz Pillar",cat:"building",tex:{end:"quartz_pillar_top",side:"quartz_pillar"},orient:"axis"});Z({name:"quartz_bricks",display:"Quartz Bricks",cat:"building",tex:"quartz_bricks"});Z({name:"smooth_quartz",display:"Smooth Quartz Block",cat:"building",tex:"quartz_top"});Z({name:"purpur_pillar",display:"Purpur Pillar",cat:"building",tex:{end:"purpur_pillar_top",side:"purpur_pillar"},orient:"axis"});Z({name:"glass",display:"Glass",cat:"building",tex:"glass",layer:"cutout",cullSelf:!0,sound:"glass"});Z({name:"tinted_glass",display:"Tinted Glass",cat:"building",tex:"tinted_glass",layer:"translucent",cullSelf:!0,opacity:15,sound:"glass"});Z({name:"glass_pane",display:"Glass Pane",cat:"building",tex:"glass",shape:"pane",layer:"cutout",family:"pane",sound:"glass"});Z({name:"iron_bars",display:"Iron Bars",cat:"building",tex:"iron_bars",shape:"pane",layer:"cutout",family:"pane",sound:"metal"});var Mv=[["stone","Stone","stone",!1],["cobblestone","Cobblestone","cobblestone",!0],["mossy_cobblestone","Mossy Cobblestone","mossy_cobblestone",!0],["smooth_stone","Smooth Stone","smooth_stone_slab_side",!1],["stone_brick","Stone Brick","stone_bricks",!0],["brick","Brick","bricks",!0],["sandstone","Sandstone","sandstone_top",!0],["red_sandstone","Red Sandstone","red_sandstone_top",!0],["quartz","Quartz","quartz_top",!1],["granite","Granite","granite",!0],["diorite","Diorite","diorite",!0],["andesite","Andesite","andesite",!0],["polished_andesite","Polished Andesite","polished_andesite",!1],["cobbled_deepslate","Cobbled Deepslate","cobbled_deepslate",!0],["deepslate_brick","Deepslate Brick","deepslate_bricks",!0],["prismarine","Prismarine","prismarine",!0],["nether_brick","Nether Brick","nether_bricks",!0],["blackstone","Blackstone","blackstone",!0],["end_stone_brick","End Stone Brick","end_stone_bricks",!0],["purpur","Purpur","purpur",!1],["mud_brick","Mud Brick","mud_bricks",!0]];for(let[i,t,e,n]of Mv){let s=i==="smooth_stone"?{top:"smooth_stone",bottom:"smooth_stone",side:e}:e;Z({name:`${i}_slab`,display:`${t} Slab`,cat:"building",tex:s,shape:"slab"}),i!=="smooth_stone"&&Z({name:`${i}_stairs`,display:`${t} Stairs`,cat:"building",tex:e,shape:"stairs"}),n&&Z({name:`${i}_wall`,display:`${t} Wall`,cat:"building",tex:e,shape:"wall",family:"wall"})}for(let i of Bi)Z({name:`${i}_wool`,display:`${es(i)} Wool`,cat:"colored",tex:`wool_${i}`,sound:"wool"});for(let i of Bi)Z({name:`${i}_carpet`,display:`${es(i)} Carpet`,cat:"colored",tex:`wool_${i}`,shape:"carpet",sound:"wool",support:"solid"});for(let i of Bi)Z({name:`${i}_concrete`,display:`${es(i)} Concrete`,cat:"colored",tex:`concrete_${i}`});for(let i of Bi)Z({name:`${i}_concrete_powder`,display:`${es(i)} Concrete Powder`,cat:"colored",tex:`powder_${i}`,sound:"sand"});for(let i of Bi)Z({name:`${i}_terracotta`,display:`${es(i)} Terracotta`,cat:"colored",tex:`terracotta_${i}`});for(let i of Bi)Z({name:`${i}_glazed_terracotta`,display:`${es(i)} Glazed Terracotta`,cat:"colored",tex:`glazed_${i}`,orient:"horizontal"});for(let i of Bi)Z({name:`${i}_stained_glass`,display:`${es(i)} Stained Glass`,cat:"colored",tex:`stained_glass_${i}`,layer:"translucent",cullSelf:!0,sound:"glass"});for(let i of Bi)Z({name:`${i}_stained_glass_pane`,display:`${es(i)} Stained Glass Pane`,cat:"colored",tex:`stained_glass_${i}`,shape:"pane",layer:"translucent",family:"pane",sound:"glass"});Z({name:"glowstone",display:"Glowstone",cat:"light",tex:"glowstone",light:15,sound:"glass"});Z({name:"sea_lantern",display:"Sea Lantern",cat:"light",tex:"sea_lantern",light:15,sound:"glass"});Z({name:"torch",display:"Torch",cat:"light",tex:"torch",shape:"torch",layer:"cutout",light:14,solid:!1,sound:"wood"});Z({name:"soul_torch",display:"Soul Torch",cat:"light",tex:"soul_torch",shape:"torch",layer:"cutout",light:10,solid:!1,sound:"wood"});Z({name:"lantern",display:"Lantern",cat:"light",tex:"lantern",shape:"lantern",layer:"cutout",light:15,sound:"metal"});Z({name:"soul_lantern",display:"Soul Lantern",cat:"light",tex:"soul_lantern",shape:"lantern",layer:"cutout",light:10,sound:"metal"});Z({name:"shroomlight",display:"Shroomlight",cat:"light",tex:"shroomlight",light:15,sound:"wool"});Z({name:"jack_o_lantern",display:"Jack o'Lantern",cat:"light",tex:{top:"pumpkin_top",bottom:"pumpkin_top",side:"pumpkin_side",front:"jack_o_lantern"},orient:"horizontal",light:15,sound:"wood"});Z({name:"redstone_lamp",display:"Redstone Lamp",cat:"light",tex:"redstone_lamp_on",light:15,sound:"glass"});Z({name:"ochre_froglight",display:"Ochre Froglight",cat:"light",tex:{end:"froglight_ochre_top",side:"froglight_ochre"},orient:"axis",light:15});Z({name:"verdant_froglight",display:"Verdant Froglight",cat:"light",tex:{end:"froglight_verdant_top",side:"froglight_verdant"},orient:"axis",light:15});Z({name:"pearlescent_froglight",display:"Pearlescent Froglight",cat:"light",tex:{end:"froglight_pearl_top",side:"froglight_pearl"},orient:"axis",light:15});Z({name:"end_rod",display:"End Rod",cat:"light",tex:"end_rod",shape:"rod",layer:"cutout",light:14,sound:"glass"});Z({name:"campfire_log_glow",display:"Glowing Embers",cat:"light",tex:"embers",light:12,sound:"wood"});Z({name:"bookshelf",display:"Bookshelf",cat:"decor",tex:{top:"oak_planks",bottom:"oak_planks",side:"bookshelf"},sound:"wood"});Z({name:"crafting_table",display:"Crafting Table",cat:"decor",tex:{top:"crafting_table_top",bottom:"oak_planks",side:"crafting_table_side",front:"crafting_table_front"},orient:"horizontal",sound:"wood"});Z({name:"furnace",display:"Furnace",cat:"decor",tex:{top:"furnace_top",bottom:"furnace_top",side:"furnace_side",front:"furnace_front"},orient:"horizontal"});Z({name:"blast_furnace",display:"Blast Furnace",cat:"decor",tex:{top:"blast_furnace_top",bottom:"blast_furnace_top",side:"blast_furnace_side",front:"blast_furnace_front"},orient:"horizontal"});Z({name:"chest",display:"Chest",cat:"decor",tex:{top:"chest_top",bottom:"chest_top",side:"chest_side",front:"chest_front"},shape:"chest",orient:"horizontal",layer:"cutout",sound:"wood"});Z({name:"barrel",display:"Barrel",cat:"decor",tex:{end:"barrel_top",side:"barrel_side"},orient:"axis",sound:"wood"});Z({name:"note_block",display:"Note Block",cat:"decor",tex:"note_block",sound:"wood"});Z({name:"jukebox",display:"Jukebox",cat:"decor",tex:{top:"jukebox_top",bottom:"jukebox_side",side:"jukebox_side"},sound:"wood"});Z({name:"tnt",display:"TNT",cat:"decor",tex:{top:"tnt_top",bottom:"tnt_bottom",side:"tnt_side"},sound:"grass"});Z({name:"target",display:"Target",cat:"decor",tex:{top:"target_top",bottom:"target_top",side:"target_side"},sound:"grass"});Z({name:"pumpkin",display:"Pumpkin",cat:"decor",tex:{top:"pumpkin_top",bottom:"pumpkin_top",side:"pumpkin_side"},sound:"wood"});Z({name:"carved_pumpkin",display:"Carved Pumpkin",cat:"decor",tex:{top:"pumpkin_top",bottom:"pumpkin_top",side:"pumpkin_side",front:"carved_pumpkin"},orient:"horizontal",sound:"wood"});Z({name:"melon",display:"Melon",cat:"decor",tex:{top:"melon_top",bottom:"melon_top",side:"melon_side"},sound:"wood"});Z({name:"hay_block",display:"Hay Bale",cat:"decor",tex:{end:"hay_top",side:"hay_side"},orient:"axis",sound:"grass"});Z({name:"sponge",display:"Sponge",cat:"decor",tex:"sponge",sound:"grass"});Z({name:"wet_sponge",display:"Wet Sponge",cat:"decor",tex:"wet_sponge",sound:"grass"});Z({name:"slime_block",display:"Slime Block",cat:"decor",tex:"slime",layer:"translucent",cullSelf:!0,sound:"slime"});Z({name:"honey_block",display:"Honey Block",cat:"decor",tex:"honey",layer:"translucent",cullSelf:!0,sound:"slime"});Z({name:"honeycomb_block",display:"Honeycomb Block",cat:"decor",tex:"honeycomb",sound:"wool"});Z({name:"dried_kelp_block",display:"Dried Kelp Block",cat:"decor",tex:{top:"kelp_top",bottom:"kelp_top",side:"kelp_side"},sound:"grass"});Z({name:"brown_mushroom_block",display:"Brown Mushroom Block",cat:"decor",tex:"mushroom_brown",sound:"wood"});Z({name:"red_mushroom_block",display:"Red Mushroom Block",cat:"decor",tex:"mushroom_red",sound:"wood"});Z({name:"mushroom_stem",display:"Mushroom Stem",cat:"decor",tex:"mushroom_stem",sound:"wood"});Z({name:"cobweb",display:"Cobweb",cat:"decor",tex:"cobweb",shape:"cross",layer:"cutout",solid:!1,sound:"wool"});Z({name:"cactus",display:"Cactus",cat:"decor",tex:{top:"cactus_top",bottom:"cactus_bottom",side:"cactus_side"},shape:"cactus",layer:"cutout",support:"cactus",sound:"wool"});Z({name:"sugar_cane",display:"Sugar Cane",cat:"decor",tex:"sugar_cane",shape:"cross",layer:"cutout",solid:!1,support:"cane",sound:"grass"});Z({name:"short_grass",display:"Short Grass",cat:"decor",tex:"tall_grass",shape:"cross",layer:"cutout",solid:!1,tint:"grass",replaceable:!0,support:"soil",sound:"grass",wave:"plant"});Z({name:"fern",display:"Fern",cat:"decor",tex:"fern",shape:"cross",layer:"cutout",solid:!1,tint:"grass",replaceable:!0,support:"soil",sound:"grass",wave:"plant"});Z({name:"dead_bush",display:"Dead Bush",cat:"decor",tex:"dead_bush",shape:"cross",layer:"cutout",solid:!1,replaceable:!0,support:"sand",sound:"grass",wave:"plant"});var Sv=[["dandelion","Dandelion"],["poppy","Poppy"],["blue_orchid","Blue Orchid"],["allium","Allium"],["azure_bluet","Azure Bluet"],["red_tulip","Red Tulip"],["orange_tulip","Orange Tulip"],["white_tulip","White Tulip"],["pink_tulip","Pink Tulip"],["oxeye_daisy","Oxeye Daisy"],["cornflower","Cornflower"],["lily_of_the_valley","Lily of the Valley"]];for(let[i,t]of Sv)Z({name:i,display:t,cat:"decor",tex:`flower_${i}`,shape:"cross",layer:"cutout",solid:!1,support:"soil",sound:"grass",wave:"plant"});Z({name:"brown_mushroom",display:"Brown Mushroom",cat:"decor",tex:"brown_mushroom",shape:"cross",layer:"cutout",solid:!1,support:"solid",sound:"grass"});Z({name:"red_mushroom",display:"Red Mushroom",cat:"decor",tex:"red_mushroom",shape:"cross",layer:"cutout",solid:!1,support:"solid",sound:"grass"});Z({name:"lily_pad",display:"Lily Pad",cat:"decor",tex:"lily_pad",shape:"lily",layer:"cutout",solid:!0,tint:"foliage",support:"water",sound:"grass"});Z({name:"seagrass",display:"Seagrass",cat:"decor",tex:"seagrass",shape:"cross",layer:"cutout",solid:!1,item:!1,sound:"grass",wave:"plant"});Z({name:"water",display:"Water",cat:"fluids",tex:"water",shape:"fluid",layer:"water",fluid:!0,solid:!1,opacity:1,replaceable:!0,cullSelf:!0,tint:"water",sound:"liquid"});Z({name:"lava",display:"Lava",cat:"fluids",tex:"lava",shape:"fluid",layer:"lava",fluid:!0,solid:!1,light:15,opacity:0,replaceable:!0,cullSelf:!0,sound:"liquid"});var Le=Bs,xt=Bs.length,yt={};Bs.forEach((i,t)=>{yt[i.name]=t});var Av=["cube","slab","stairs","fence","wall","cross","torch","door","trapdoor","pane","fluid","layer","carpet","cactus","lantern","chest","rod","lily"],j=Object.fromEntries(Av.map((i,t)=>[i,t])),Ev=["opaque","cutout","translucent","water","lava"],An=Object.fromEntries(Ev.map((i,t)=>[i,t])),jt=new Uint8Array(xt),an=new Uint8Array(xt),ao=new Uint8Array(xt),Ul=new Uint8Array(xt),Fs=new Uint8Array(xt),xe=new Uint8Array(xt),he=new Uint8Array(xt),Dl=new Uint8Array(xt),Ra=new Uint8Array(xt),yi=new Uint8Array(xt),ns=new Uint8Array(xt),lo=new Uint8Array(xt),xu=new Uint8Array(xt),ei=new Uint8Array(xt),fr=new Uint8Array(xt),wu=new Uint8Array(xt),_u=[""],Tv=["none","grass","foliage","water"],tm,em,nm,im,sm,rm;for(let i=0;i<xt;i++){let t=Bs[i],e=(tm=t.shape)!=null?tm:"cube",n=(em=t.layer)!=null?em:"opaque";jt[i]=j[e],an[i]=An[n],ao[i]=(nm=t.light)!=null?nm:0;let s=e==="cube"&&n==="opaque";if(Fs[i]=s&&t.transparent!==!0?1:0,Ul[i]=(im=t.opacity)!=null?im:s?15:0,xe[i]=(sm=t.solid)==null||sm?1:0,he[i]=t.fluid?1:0,Dl[i]=t.cullSelf?1:0,Ra[i]=t.replaceable?1:0,yi[i]=Tv.indexOf((rm=t.tint)!=null?rm:"none"),ns[i]=t.tintMask?1:0,lo[i]=t.orient==="axis"?1:t.orient==="horizontal"?2:0,xu[i]=t.wave==="plant"?1:t.wave==="leaves"?2:0,ei[i]=t.name.endsWith("_leaves")?1:0,t.family){let r=_u.indexOf(t.family);r<0&&(r=_u.length,_u.push(t.family)),fr[i]=r}wu[i]=i!==0&&!t.fluid?1:0}xe[0]=0;Ul[0]=0;var Ni=[],Qp=new Map;function Il(i){let t=Qp.get(i);return t===void 0&&(t=Ni.length,Ni.push(i),Qp.set(i,t)),t}Il("missing");var Ut=new Uint16Array(xt*6),om,am,lm,cm,hm,um,dm,fm,pm,mm,gm,bm;for(let i=0;i<xt;i++){let t=Bs[i].tex,e;if(typeof t=="string")e=[t,t,t,t,t,t];else{let n=(lm=(am=(om=t.side)!=null?om:t.all)!=null?am:t.end)!=null?lm:"missing",s=(hm=(cm=t.top)!=null?cm:t.end)!=null?hm:n,r=(dm=(um=t.bottom)!=null?um:t.end)!=null?dm:s;e=[(fm=t.east)!=null?fm:n,(pm=t.west)!=null?pm:n,s,r,(mm=t.south)!=null?mm:n,(bm=(gm=t.north)!=null?gm:t.front)!=null?bm:n]}for(let n=0;n<6;n++)Ut[i*6+n]=Il(e[n])}var Mu={water_still:Il("water"),lava_still:Il("lava")},dr=new Uint8Array(1024);for(let i=0;i<xt;i++){let t=an[i]===An.cutout?1:an[i]===An.translucent?2:0;for(let e=0;e<6;e++){let n=Ut[i*6+e];t>dr[n]&&(dr[n]=t)}}function Su(i){var t,e;return(e=(t=Bs[i])==null?void 0:t.display)!=null?e:"Unknown"}function co(i){return i>0&&Bs[i].item!==!1}var Gt=1023,vm=10,Ie=(i,t=0)=>i|t<<vm,En=i=>i&Gt,_m=i=>i>>vm;if(xt>1024)throw new Error("Too many blocks for 10-bit ids");var gr=(i,t=0,e=255)=>i<t?t:i>e?e:i,M=i=>{let t=parseInt(i.replace("#",""),16);return[t>>16&255,t>>8&255,t&255]},$=(i,t)=>[gr(i[0]*t),gr(i[1]*t),gr(i[2]*t)],Bn=(i,t,e)=>[i[0]+(t[0]-i[0])*e,i[1]+(t[1]-i[1])*e,i[2]+(t[2]-i[2])*e],Fl=(i,t)=>[gr(i[0]+t),gr(i[1]+t),gr(i[2]+t)],ln=i=>[i,i,i];function kv(i){let t=2166136261;for(let e=0;e<i.length;e++)t^=i.charCodeAt(e),t=Math.imul(t,16777619);return t>>>0}function Fu(i){let t=i>>>0;return()=>{t=t+1831565813>>>0;let e=t;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}}var Nt=class i{constructor(){this.d=new Uint8ClampedArray(1024)}set(t,e,n,s=255){t&=15,e&=15;let r=(e*16+t)*4;this.d[r]=n[0],this.d[r+1]=n[1],this.d[r+2]=n[2],this.d[r+3]=s}get(t,e){t&=15,e&=15;let n=(e*16+t)*4;return[this.d[n],this.d[n+1],this.d[n+2]]}a(t,e){return this.d[((e&15)*16+(t&15))*4+3]}setA(t,e,n){this.d[((e&15)*16+(t&15))*4+3]=n}fill(t,e=255){for(let n=0;n<16;n++)for(let s=0;s<16;s++){let r=t(s,n);r&&this.set(s,n,r,e)}return this}rect(t,e,n,s,r,o=255){for(let a=e;a<=s;a++)for(let l=t;l<=n;l++)this.set(l,a,r,o);return this}outline(t,e,n,s,r){for(let o=t;o<=n;o++)this.set(o,e,r),this.set(o,s,r);for(let o=e;o<=s;o++)this.set(t,o,r),this.set(n,o,r);return this}shadeRect(t,e,n,s,r){for(let o=e;o<=s;o++)for(let a=t;a<=n;a++)this.set(a,o,$(this.get(a,o),r),this.a(a,o));return this}bevel(t,e,n,s,r,o){for(let a=t;a<=n;a++)this.set(a,e,$(this.get(a,e),r)),this.set(a,s,$(this.get(a,s),o));for(let a=e+1;a<s;a++)this.set(t,a,$(this.get(t,a),r)),this.set(n,a,$(this.get(n,a),o));return this}clear(){return this.d.fill(0),this}copy(){let t=new i;return t.d.set(this.d),t}rotate(t){let e=this.copy();for(let n=0;n<(t&3);n++){let s=n===0?e:this.copy();for(let r=0;r<16;r++)for(let o=0;o<16;o++){let a=(r*16+o)*4,l=((15-o)*16+r)*4;for(let c=0;c<4;c++)this.d[a+c]=s.d[l+c]}}return this}};function Tn(i,t,e=t){let n=new Float32Array(t*e);for(let a=0;a<n.length;a++)n[a]=i();let s=16/t,r=16/e,o=a=>a*a*(3-2*a);return(a,l)=>{let c=(a+.5)/s-.5,h=(l+.5)/r-.5,u=Math.floor(c),f=Math.floor(h),d=o(c-u),g=o(h-f),b=(u%t+t)%t,p=(b+1)%t,m=(f%e+e)%e,v=(m+1)%e,y=n[m*t+b]+(n[m*t+p]-n[m*t+b])*d,_=n[v*t+b]+(n[v*t+p]-n[v*t+b])*d;return y+(_-y)*g}}function ie(i,t,e=.35){let n=[];for(let s=0;s<t;s++)n.push($(i,1-e+2*e*s/(t-1)));return n}function Cv(i,t={}){var l,c,h,u;let e=((l=t.layers)!=null?l:[[4,.6],[8,.4]]).map(([f,d])=>[Tn(i,f),d]),n=(c=t.white)!=null?c:.35,s=(h=t.contrast)!=null?h:1.6,r=(u=t.bias)!=null?u:0,o=e.reduce((f,d)=>f+d[1],0)+n,a=new Float32Array(256);for(let f=0;f<16;f++)for(let d=0;d<16;d++){let g=0;for(let[b,p]of e)g+=b(d,f)*p;g+=i()*n,g=g/o,a[f*16+d]=gr(.5+(g-.5)*s+r,0,.9999)}return(f,d)=>a[(d&15)*16+(f&15)]}function Et(i,t,e={}){let n=Cv(i,e);return new Nt().fill((s,r)=>t[Math.floor(n(s,r)*t.length)])}var me={stone:M("#7d7d7d"),dirt:M("#86603e"),sand:M("#dccf9e"),redSand:M("#bf6a26"),deepslate:M("#4d4d52"),netherrack:M("#6e2d2b"),endStone:M("#dcdf9e"),granite:M("#9a6b57"),diorite:M("#c9c9c6"),andesite:M("#868787"),tuff:M("#6c6d65"),calcite:M("#dfe0dc"),clay:M("#a0a6b4"),mud:M("#3c3a3c"),snow:M("#f4fbfb"),blackstone:M("#2e2a30"),basalt:M("#4b4a4f"),obsidian:M("#140f1f")};function Om(i,t=me.stone){return Et(i,ie(t,5,.18),{layers:[[4,.5],[8,.5]],white:.5,contrast:1.7})}function mr(i,t=me.dirt){let e=Et(i,ie(t,5,.28),{layers:[[4,.4],[16,.6]],white:.6,contrast:1.5});for(let n=0;n<7;n++){let s=i()*16|0,r=i()*16|0;e.set(s,r,$(t,.62))}for(let n=0;n<4;n++){let s=i()*16|0,r=i()*16|0;e.set(s,r,$(t,1.25))}return e}function xm(i,t=me.sand){let e=Et(i,ie(t,4,.08),{layers:[[8,.4],[16,.6]],white:.8,contrast:1.4});for(let n=0;n<6;n++)e.set(i()*16|0,i()*16|0,$(t,.84));return e}function Rv(i){let t=Et(i,[ln(118),ln(140),ln(160),ln(178),ln(196)],{layers:[[4,.3],[16,.7]],white:.9,contrast:1.5});for(let e=0;e<256;e++)t.d[e*4+3]=0;return t}function wm(i,t=!1){let e=mr(i),n=[];for(let s=0;s<16;s++)n.push(3+(i()<.55?1:0)+(i()<.2?1:0));for(let s=0;s<16;s++)for(let r=0;r<n[s];r++)t?e.set(s,r,$(me.snow,.93+i()*.07)):e.set(s,r,ln(140+i()*50),0);return e}function Mm(i){return Et(i,[M("#4a3015"),M("#5f3e1c"),M("#7a5226"),M("#8d6433"),M("#a0753c")],{layers:[[4,.5],[16,.5]],white:.7})}function Sm(i,t,e,n=3){let s=e.copy();for(let r=0;r<16;r++){let o=n+(i()<.5?1:0);for(let a=0;a<o;a++)s.set(r,a,t.get(r,a+r*3&15))}return s}function Pv(i){let t=Et(i,ie(M("#827d7b"),4,.15),{white:.8}),e=[M("#6a6460"),M("#9a9592"),M("#5c5654"),M("#b0a9a6"),M("#7d726c")];for(let n=0;n<22;n++){let s=i()*16|0,r=i()*16|0,o=e[i()*e.length|0],a=1+(i()*2|0),l=1+(i()*2|0);for(let c=0;c<=l;c++)for(let h=0;h<=a;h++){let u=c===0||h===0?1.15:c===l||h===a?.78:1;t.set(s+h,r+c,$(o,u))}}return t}function Au(i,t=me.stone,e=!1){let s=[];for(let a=0;a<9;a++)s.push([i()*16,i()*16,.82+i()*.3]);let r=new Nt,o=Tn(i,8);for(let a=0;a<16;a++)for(let l=0;l<16;l++){let c=99,h=99,u=0;for(let m=0;m<9;m++){let v=Math.abs(l+.5-s[m][0]);v=Math.min(v,16-v);let y=Math.abs(a+.5-s[m][1]);y=Math.min(y,16-y);let _=Math.sqrt(v*v+y*y);_<c?(h=c,c=_,u=m):_<h&&(h=_)}let f=s[u];if(h-c<1.1){r.set(l,a,$(t,.52+o(l,a)*.12));continue}let d=l+.5-f[0];d>8&&(d-=16),d<-8&&(d+=16);let g=a+.5-f[1];g>8&&(g-=16),g<-8&&(g+=16);let b=1-(d+g)*.035,p=f[2]*b*(.92+o(l,a)*.16);p=Math.round(p*8)/8,r.set(l,a,$(t,p))}return e&&zm(i,r,.45),r}function zm(i,t,e){let n=Tn(i,4),s=Tn(i,8),r=[M("#4f6b2c"),M("#5f7d34"),M("#6f8f3c"),M("#567532")];for(let o=0;o<16;o++)for(let a=0;a<16;a++)n(a,o)*.7+s(a,o)*.3>1-e&&t.set(a,o,r[i()*r.length|0])}function Eu(i,t=me.stone,e="plain"){let n=Et(i,ie(t,4,.08),{white:.6}),s=$(t,.6);for(let o=0;o<16;o++)n.set(o,7,s),n.set(o,15,s);for(let o=0;o<7;o++)n.set(15,o,s);for(let o=8;o<15;o++)n.set(7,o,s);let r=(o,a,l,c)=>n.bevel(o,a,l,c,1.12,.86);return r(0,0,14,6),r(8,8,15,14),r(0,8,6,14),e==="mossy"&&zm(i,n,.4),e==="cracked"&&Hm(i,n,$(t,.45),3),n}function Hm(i,t,e,n){for(let s=0;s<n;s++){let r=i()*16|0,o=i()*16|0,a=5+(i()*6|0);for(let l=0;l<a;l++)t.set(r,o,e),r+=i()<.5?i()<.5?-1:1:0,o+=i()<.7?1:0}}function Oi(i,t=M("#965a49"),e=M("#b4aca4"),n=4,s=8){let r=new Nt,o=16/n;for(let a=0;a<o;a++){let l=a%2?s/2:0;for(let c=0;c<16/s+1;c++){let h=.88+i()*.22;for(let u=a*n;u<a*n+n;u++)for(let f=0;f<s;f++){let d=c*s+f+l&15;if(u===a*n+n-1||f===s-1)r.set(d,u,$(e,.9+i()*.12));else{let b=h*(.93+i()*.12);u===a*n&&(b*=1.1),r.set(d,u,$(t,b))}}}}return r}function si(i,t){let e=new Nt,n=Tn(i,2,16);for(let s=0;s<4;s++){let r=.93+i()*.12,o=i()*16|0;for(let a=s*4;a<s*4+4;a++)for(let l=0;l<16;l++){let c=r*(.9+n(l,a)*.18);a===s*4+3?c*=.72:a===s*4&&(c*=1.06),l===o&&a!==s*4+3&&(c*=.75),c=Math.round(c*14)/14,e.set(l,a,$(t,c))}i()<.6&&e.set(o+2+(i()*10|0)&15,s*4+1,$(t,.78))}return e}function Am(i,t,e=!1){let n=new Nt,s=[];for(let o=0;o<16;o++)s.push(.82+i()*.3);let r=Tn(i,8,4);for(let o=0;o<16;o++)for(let a=0;a<16;a++){let l=s[a]*(.88+r(a,o)*.24);!e&&(a%4===0||a%4===3)&&i()<.6&&(l*=.78),l=Math.round(l*10)/10,n.set(a,o,$(t,l))}if(e)for(let o=0;o<7;o++){let a=i()*16|0,l=i()*14|0,c=2+(i()*3|0);for(let h=0;h<c;h++)n.set(l+h,a,M("#2b2a26"));i()<.5&&n.set(l+1,a+1,M("#45433d"))}return n}function Lv(i,t,e,n=!1){let s=new Nt;for(let r=0;r<16;r++)for(let o=0;o<16;o++){let a=o-7.5,l=r-7.5,c=Math.max(Math.abs(a),Math.abs(l))*.7+Math.sqrt(a*a+l*l)*.3;if(c>7.2&&!n){s.set(o,r,$(e,.9+i()*.2));continue}let h=Math.floor(c/1.6)%2;s.set(o,r,$(t,(h?.88:1.02)*(.95+i()*.08)*(n&&c>7.2?.85:1)))}return s}function Iv(i,t,e=.24){let n=new Nt,s=Tn(i,8);for(let r=0;r<16;r++)for(let o=0;o<16;o++){let a=s(o,r)*.5+i()*.5;if(a<e){n.set(o,r,$(t,.35),0);continue}let l=a>.82?1.22:a>.6?1.05:a>.42?.9:.74;n.set(o,r,$(t,l))}return n}function Uv(i,t,e,n=5){var o;let s=t.copy(),r=[];for(let a=0;a<n;a++){let l=0,c=0;for(let g=0;g<20&&(l=2+(i()*12|0),c=2+(i()*12|0),!r.every(([b,p])=>Math.abs(b-l)+Math.abs(p-c)>4));g++);r.push([l,c]);let h=[[l,c]],u=3+(i()*3|0);for(;h.length<u;){let[g,b]=h[i()*h.length|0],p=i()*4|0,m=g+(p===0?1:p===1?-1:0),v=b+(p===2?1:p===3?-1:0);h.some(([y,_])=>y===m&&_===v)||h.push([m,v])}for(let[g,b]of h){let p=h.some(([_,w])=>_===g&&w===b-1),m=h.some(([_,w])=>_===g-1&&w===b),v=!p||!m?e[0]:e[1];s.set(g,b,v),h.some(([_,w])=>_===g&&w===b+1)||s.set(g,b+1,$(s.get(g,b+1),.7))}let[f,d]=h[0];s.set(f,d,(o=e[2])!=null?o:Fl(e[0],40))}return s}function Du(i,t,e=!0){let n=Et(i,ie(t,3,.04),{white:.6});return e&&n.outline(0,0,15,15,$(t,.82)),n}function ho(i,t){let e=Et(i,ie(t,4,.1),{layers:[[4,.7],[8,.3]],white:.4});return e.bevel(0,0,15,15,1.15,.78),e}function Ou(i,t,e=8){let n=Et(i,ie(t,3,.08),{white:.6});for(let s=0;s<16;s+=e)for(let r=0;r<16;r+=e){let o=.9+i()*.2;n.shadeRect(r,s,r+e-1,s+e-1,o),n.bevel(r,s,r+e-1,s+e-1,1.12,.62)}return n}function ii(i,t,e="plate"){let n=Et(i,ie(t,4,.12),{layers:[[2,.4],[8,.6]],white:.4});if(e==="plate"){n.bevel(0,0,15,15,1.25,.7),n.bevel(1,1,14,14,1.08,.88);for(let s=3;s<13;s+=3)n.set(s,s,Fl(t,50))}else if(e==="gem"){n.bevel(0,0,15,15,1.3,.65);for(let s=2;s<14;s+=4)for(let r=2;r<14;r+=4)n.rect(r,s,r+2,s+2,$(t,1.15)),n.set(r,s,Fl(t,70)),n.set(r+2,s+2,$(t,.7))}else if(e==="rough")for(let s=0;s<18;s++)n.set(i()*16|0,i()*16|0,$(t,i()<.5?.7:1.3));else{for(let s=0;s<16;s+=4)for(let r=0;r<16;r++)n.set(r,s,$(t,.75));for(let s=0;s<16;s+=4)n.set(s*5&15,s+1,Fl(t,60))}return n}var Dv={white:[233,236,236],orange:[240,118,19],magenta:[189,68,179],light_blue:[58,175,217],yellow:[248,197,39],lime:[112,185,25],pink:[237,141,172],gray:[62,68,71],light_gray:[142,142,134],cyan:[21,137,145],purple:[121,42,172],blue:[53,57,157],brown:[114,71,40],green:[84,109,27],red:[161,39,34],black:[21,21,26]};function Nv(i,t){let e=new Nt,n=Tn(i,8);for(let s=0;s<16;s++)for(let r=0;r<16;r++){let a=((r+(s>>1)*2&3)<2?1.05:.95)*(.92+n(r,s)*.1+(i()-.5)*.06);e.set(r,s,$(t,a))}return e}function Bv(i,t){return new Nt().fill(()=>$(t,.97+i()*.05))}function Fv(i,t){let e=Bn(t,[255,255,255],.12),n=new Nt().fill(()=>$(e,.86+i()*.22));for(let s=0;s<18;s++)n.set(i()*16|0,i()*16|0,Bn(e,[255,255,255],.35));for(let s=0;s<12;s++)n.set(i()*16|0,i()*16|0,$(e,.7));return n}function Ov(i){return $(Bn(i,[152,94,67],.55),.9)}function Gm(i,t){let e=Tn(i,4);return new Nt().fill((n,s)=>$(t,.93+e(n,s)*.08+i()*.04))}function zv(i,t){let e=Bn(t,[255,255,255],.45),n=$(t,.55),s=Bn(t,[255,220,120],.35),r=[];for(let l=0;l<8;l++){r.push([]);for(let c=0;c<8;c++)r[l].push(t)}let o=i()*4|0;for(let l=0;l<8;l++)for(let c=0;c<8;c++){let h=c+l,u=Math.max(c,l),f=Math.abs(c-l),d=t;o===0?d=h===7||h===3?n:u===0?e:f===0&&c>3?s:t:o===1?d=u===2||u===6&&(c+l)%2?n:c===l?e:u<2?s:t:o===2?d=c===0||l===0?n:h%4===0?e:c===4||l===4?s:t:d=u===7?n:Math.abs(c-4)+Math.abs(l-4)===2?e:h===10?s:t,r[l][c]=$(d,.95+i()*.08)}let a=new Nt;for(let l=0;l<8;l++)for(let c=0;c<8;c++)a.set(c,l,r[l][c]),a.set(15-l,c,r[l][c]),a.set(15-c,15-l,r[l][c]),a.set(l,15-c,r[l][c]);return a}function Hv(i,t){let e=new Nt;for(let n=0;n<16;n++)for(let s=0;s<16;s++)s===0||n===0||s===15||n===15?e.set(s,n,$(t,.85),225):e.set(s,n,Bn(t,[255,255,255],.12),130);for(let n=0;n<4;n++)e.set(3+n,11-n,Bn(t,[255,255,255],.5),190);return e.set(10,4,Bn(t,[255,255,255],.5),190),e.set(11,3,Bn(t,[255,255,255],.5),190),e}function Gv(i){let t=new Nt,e=M("#d9eef2");for(let n=0;n<16;n++)t.set(n,0,e),t.set(n,15,$(e,.8));for(let n=0;n<16;n++)t.set(0,n,e),t.set(15,n,$(e,.8));for(let n=0;n<4;n++)t.set(3+n,7-n,M("#ffffff"));return t.set(4,7,M("#cfe9ef")),t.set(10,11,M("#ffffff")),t.set(11,10,M("#ffffff")),t.set(12,9,M("#cfe9ef")),t}var Ol={oak:{planks:M("#b38d58"),bark:M("#6b5232"),stripped:M("#b18e57"),leaves:ln(150),tinted:!0},spruce:{planks:M("#735632"),bark:M("#3c2a15"),stripped:M("#76593a"),leaves:M("#4b6f48"),tinted:!1},birch:{planks:M("#c8b67a"),bark:M("#d8d6cf"),stripped:M("#c4ad73"),leaves:M("#7ca052"),tinted:!1},jungle:{planks:M("#a07350"),bark:M("#584519"),stripped:M("#ab8455"),leaves:ln(158),tinted:!0},acacia:{planks:M("#a85a32"),bark:M("#686056"),stripped:M("#ae5d3b"),leaves:ln(146),tinted:!0},dark_oak:{planks:M("#432b14"),bark:M("#3c2e1a"),stripped:M("#60492f"),leaves:ln(130),tinted:!0},mangrove:{planks:M("#763630"),bark:M("#5a3d2c"),stripped:M("#7a382f"),leaves:ln(140),tinted:!0},cherry:{planks:M("#e3b2ac"),bark:M("#38212c"),stripped:M("#d8939a"),leaves:M("#eab0c8"),tinted:!1}};function Em(i,t,e){let n=si(i,t.planks).rotate(1);if(n.outline(0,0,15,15,$(t.planks,.6)),e){for(let s of[2,9])n.rect(s,2,s+4,8,$(t.planks,.2),0);n.rect(2,10,13,13,$(t.planks,.85)),n.outline(2,10,13,13,$(t.planks,.7))}else n.outline(2,1,13,7,$(t.planks,.7)),n.outline(2,9,13,14,$(t.planks,.7)),n.set(12,0,M("#3a3a3a")),n.set(12,1,M("#5a5a5a"));return n}function Wv(i,t){let e=si(i,t.planks);e.outline(0,0,15,15,$(t.planks,.62));for(let[n,s]of[[3,3],[9,3],[3,9],[9,9]])e.rect(n,s,n+3,s+3,$(t.planks,.2),0);return e}function Vv(i,t){let e=new Nt,n=$(t.bark,1.1);for(let o=9;o<16;o++)e.set(7+(o>12,0),o,n);e.set(8,12,n),e.set(6,11,n);let s=t.tinted?Bn(t.leaves,M("#3f8f2a"),.75):t.leaves,r=(o,a,l)=>{for(let c=-l;c<=l;c++)for(let h=-l;h<=l;h++)h*h+c*c>l*l+1||i()<.15||e.set(o+h,a+c,$(s,.8+i()*.4))};return r(7,6,3),r(4,8,2),r(10,8,2),r(7,3,2),e}function ni(i,t,e,n,s){for(let r=e;r<=n;r++)i.set(t,r,s)}function $v(i,t){let e=new Nt,n=M("#3f7d2a"),s=M("#56a03a"),r=(a,l,c,h,u)=>{if(u==="round")e.rect(a-1,l-1,a+1,l+1,c),e.set(a,l-2,c),e.set(a,l+2,c),e.set(a-2,l,c),e.set(a+2,l,c),e.set(a-1,l-1,$(c,1.15));else if(u==="cup")e.rect(a-1,l-2,a+1,l+1,c),e.set(a-2,l-3,c),e.set(a,l-3,$(c,1.1)),e.set(a+2,l-3,c),e.set(a-2,l-2,$(c,.85)),e.set(a+2,l-2,$(c,.85)),e.set(a,l-1,$(c,.75));else if(u==="star"){for(let[f,d]of[[0,-2],[0,2],[-2,0],[2,0],[-1,-1],[1,1],[1,-1],[-1,1]])e.set(a+f,l+d,c);e.set(a-2,l-2,$(c,.9)),e.set(a+2,l+2,$(c,.9))}else if(u==="ball"){for(let f=-2;f<=2;f++)for(let d=-2;d<=2;d++)d*d+f*f<=5&&(d+f)%2===0&&e.set(a+d,l+f,$(c,.85+i()*.3));for(let f=-2;f<=2;f++)for(let d=-2;d<=2;d++)d*d+f*f<=5&&(d+f)%2!==0&&e.set(a+d,l+f,$(c,.6))}else e.set(a,l,c),e.set(a-1,l+1,c),e.set(a,l+1,$(c,.9)),e.set(a+1,l+1,c);h&&e.set(a,l,h)},o=(a,l)=>{e.set(a-1,l,s),e.set(a-2,l-1,s),e.set(a+1,l+1,n),e.set(a+2,l,s)};switch(t){case"dandelion":ni(e,7,9,15,n),o(7,13),r(7,7,M("#f6d320"),M("#e09a12"),"round");break;case"poppy":ni(e,7,9,15,n),o(7,12),r(7,6,M("#d8231c"),M("#2a1610"),"round"),e.set(5,5,M("#b81c16")),e.set(9,7,M("#b81c16"));break;case"blue_orchid":ni(e,7,9,15,n),ni(e,9,11,15,n),o(8,13),r(6,6,M("#30b0e8"),M("#d0f0ff"),"star"),r(10,9,M("#2a9ad4"),null,"star");break;case"allium":ni(e,7,7,15,n),o(7,13),r(7,4,M("#b05ae0"),null,"ball");break;case"azure_bluet":ni(e,5,9,15,n),ni(e,9,8,15,n),ni(e,11,11,15,n),ni(e,7,11,15,s);for(let[a,l]of[[5,8],[9,7],[11,10],[7,10]])r(a,l,M("#eef0f8"),M("#e8d34c"),"bell");break;case"red_tulip":case"orange_tulip":case"white_tulip":case"pink_tulip":{let a=M(t==="red_tulip"?"#d63420":t==="orange_tulip"?"#ee8a1c":t==="white_tulip"?"#ecf0ee":"#eca4c0");ni(e,7,8,15,n),e.set(6,13,s),e.set(5,12,s),e.set(5,11,s),e.set(8,12,s),e.set(9,11,s),r(7,7,a,null,"cup");break}case"oxeye_daisy":ni(e,7,9,15,n),o(7,13),r(7,6,M("#f2f3ee"),M("#f0c822"),"star"),e.set(7,5,M("#f2f3ee"));break;case"cornflower":ni(e,7,8,15,n),o(7,13),r(7,6,M("#4a6ee0"),M("#2a3c9c"),"star");break;case"lily_of_the_valley":for(let a=5;a<16;a++)e.set(a<8?6+(8-a):6,a,n);e.set(4,10,s),e.set(3,11,s),e.set(10,12,s),e.set(11,13,s);for(let[a,l]of[[8,5],[9,8],[6,9],[10,4]])e.set(a,l,M("#f6f8f2")),e.set(a,l+1,M("#e6e8e0"));break}return e}function Nu(i,t=!1){let e=new Nt;if(t){for(let[n,s]of[[7,0],[4,-1],[11,1]]){let r=2+(i()*4|0);for(let o=r;o<16;o++){let a=n+Math.round(s*(15-o)*.25);e.set(a,o,ln(150+i()*40)),(o-r)%2===0&&o<14&&(e.set(a-1,o,ln(130+i()*50)),e.set(a+1,o+1,ln(130+i()*50)))}}return e}for(let n=0;n<11;n++){let s=1+(i()*14|0),r=3+(i()*9|0),o=i()<.5?-1:1;for(let a=15;a>=r;a--)e.set(s,a,ln(130+(15-a)/(15-r)*70+i()*20)),i()<.18&&(s+=o)}return e}function qv(i){let t=new Nt,e=M("#7a5328"),n=M("#94683a"),s=(r,o,a,l)=>{for(let c=0;c<l;c++)t.set(r,o,c%2?n:e),o--,c%2&&(r+=a)};return s(7,15,0,6),s(7,11,-1,7),s(8,11,1,7),s(7,9,1,5),s(6,12,-1,4),t}function Xv(i){let t=new Nt,e=M("#8fc35a"),n=M("#6d9c3c"),s=M("#a9d873");for(let r of[3,8,12])for(let o=0;o<16;o++){let a=(o+r)%5===0;t.set(r,o,a?n:e),t.set(r+1,o,a?n:$(e,.85))}for(let[r,o]of[[5,4],[6,3],[10,9],[11,8],[2,12],[1,11],[14,2]])t.set(r,o,s);return t}function Tm(i,t){let e=new Nt,n=M("#d8cfc0");e.rect(7,10,8,15,n),e.set(8,15,$(n,.85));let s=M(t?"#c8221c":"#9a6c4c");if(t){e.rect(4,6,11,9,s),e.rect(5,5,10,5,s),e.rect(6,4,9,4,s);for(let[r,o]of[[6,6],[9,5],[10,8],[5,8],[8,7]])e.set(r,o,M("#f4f0ea"))}else e.rect(4,8,11,9,s),e.rect(5,7,10,7,$(s,1.1)),e.rect(6,6,9,6,$(s,1.15));return e}function Yv(i){let t=new Nt;for(let e=0;e<16;e++)for(let n=0;n<16;n++){let s=n-7.5,r=e-7.5,o=Math.sqrt(s*s+r*r);if(o>7.4||s>0&&Math.abs(r)<s*.35)continue;let a=Math.abs(s)<.6||Math.abs(r)<.6||Math.abs(s-r)<.7;t.set(n,e,ln(a?190:140+i()*30+(o<4?15:0)))}return t}function Kv(i){let t=new Nt;for(let e=0;e<5;e++){let n=2+(i()*12|0);for(let s=15;s>1+i()*6;s--)t.set(n,s,Bn(M("#2f7a3a"),M("#4fa45a"),i())),i()<.3&&(n+=i()<.5?-1:1)}return t}function Zv(i){let t=new Nt,e=M("#e8e8ec");for(let n=0;n<16;n++)t.set(n,n,e,220),t.set(15-n,n,e,220),t.set(7,n,e,200),t.set(n,8,e,200);for(let n of[3,6])for(let s=0;s<32;s++){let r=Math.round(7.5+Math.cos(s/5.1)*n),o=Math.round(7.5+Math.sin(s/5.1)*n);t.set(r,o,e,200)}return t}function Jv(i){let t=Ol.oak.planks,e=si(i,t),n=[M("#8a2b22"),M("#2d4e8a"),M("#3f6b2a"),M("#b0892c"),M("#5c2f6e"),M("#3a3a3a"),M("#a35a2a"),M("#cfc4a4")];for(let s of[1,9]){e.rect(0,s,15,s+5,$(t,.38));let r=1;for(;r<15;){let o=1+(i()*2|0),a=4+(i()*2|0),l=n[i()*n.length|0];for(let c=0;c<o&&r<15;c++,r++){for(let h=s+6-a;h<s+6;h++)e.set(r,h,$(l,c===0?1.15:.95));e.set(r,s+6-a+1,$(l,.7))}i()<.2&&r++}for(let o=0;o<16;o++)e.set(o,s+6,$(t,.85))}return e}function jv(i){let t=Ol.oak.planks,e=si(i,$(t,1.05));e.outline(0,0,15,15,$(t,.55));for(let n=1;n<15;n++)e.set(5,n,$(t,.62)),e.set(10,n,$(t,.62)),e.set(n,5,$(t,.62)),e.set(n,10,$(t,.62));return e}function km(i,t){let e=Ol.oak.planks,n=si(i,e);if(n.rect(0,0,15,2,$(e,.72)),n.bevel(0,0,15,2,1.1,.7),t){for(let s=3;s<8;s++)n.set(s,6,M("#b8b8b8"));for(let s=3;s<8;s+=1)n.set(s,7,s%2?M("#8a8a8a"):M("#b8b8b8"));n.rect(8,5,9,7,M("#5a3a1e")),n.rect(11,5,13,6,M("#7a7a7a")),n.rect(12,7,12,11,M("#5a3a1e"))}else n.rect(3,6,12,7,M("#6a6a6a")),n.rect(5,8,6,12,M("#5a3a1e")),n.rect(10,8,10,12,M("#5a3a1e"));return n}function uo(i,t,e=M("#7a7a7a"),n=!1){let s=Du(i,e,!1);if(s.bevel(0,0,15,15,1.15,.72),t==="top")return s.outline(2,2,13,13,$(e,.85)),s;if(t==="side")return s.rect(0,0,15,1,$(e,.9)),s.bevel(0,0,15,15,1.1,.75),n&&s.rect(3,5,12,6,$(e,.6)),s;s.rect(3,2,12,5,$(e,.55)),s.bevel(3,2,12,5,.7,1.2),s.rect(3,8,12,13,M("#1e1c1c")),s.bevel(3,8,12,13,.7,1.25);for(let r=4;r<12;r++)s.set(r,12,r%2?M("#ff9a2a"):M("#c8521c"));for(let r=4;r<12;r+=3)s.set(r,11,M("#ffd060"));if(n)for(let r=3;r<=12;r+=3)for(let o=8;o<=13;o++)s.set(r,o,$(e,.75));return s}function Tu(i,t){let e=M("#a2742f"),n=si(i,e),s=$(e,.48);if(n.outline(1,t==="top"?1:2,14,t==="top"?14:15,s),t!=="top")for(let r=1;r<15;r++)n.set(r,7,s);return t==="front"&&(n.rect(7,6,8,9,M("#c8c8c8")),n.set(7,6,M("#ffffff")),n.set(8,9,M("#7a7a7a"))),n}function Nl(i,t){let e=M("#d8811a"),n=new Nt;for(let s=0;s<16;s++)for(let r=0;r<16;r++){let o=r%4===0?.78:r%4===2?1.08:.96;n.set(r,s,$(e,o*(.94+i()*.1)))}if(t==="top"){let s=new Nt;for(let r=0;r<16;r++)for(let o=0;o<16;o++){let a=Math.max(Math.abs(o-7.5),Math.abs(r-7.5));s.set(o,r,$(e,(a%3<1?.82:1)*(.94+i()*.1)))}return s.rect(7,7,8,8,M("#5a6a20")),s.set(8,6,M("#6e7e28")),s}if(t==="face"||t==="lit"){let s=M(t==="lit"?"#ffd34a":"#3a2108"),r=M(t==="lit"?"#ffb020":"#2a1604");n.rect(3,4,5,6,s),n.rect(10,4,12,6,s),n.set(5,6,r),n.set(12,6,r),n.rect(3,9,12,11,s),n.set(3,9,$(e,.9)),n.set(12,9,$(e,.9)),n.set(5,9,$(e,.95)),n.set(9,11,$(e,.95)),n.set(6,11,r),n.set(11,10,r)}return n}function Cm(i,t){let e=M("#6f9a26"),n=M("#4a6e12"),s=new Nt;for(let r=0;r<16;r++)for(let o=0;o<16;o++){let a=t?(Math.max(Math.abs(o-7.5),Math.abs(r-7.5))|0)%3===0:(o+(r*.2|0))%4<2;s.set(o,r,$(a?n:e,.9+i()*.2))}return s}function ku(i,t){let e=M("#c8321e"),n=new Nt;if(t==="side"){for(let s=0;s<16;s++)for(let r=0;r<16;r++)n.set(r,s,$(e,r%4===3?.78:.95+i()*.08));n.rect(0,5,15,10,M("#e8e4dc")),n.rect(6,6,9,9,M("#2a2a2a")),n.set(10,6,M("#2a2a2a")),n.set(11,5,M("#f0a020")),n.rect(2,7,4,8,M("#c8321e")),n.rect(11,7,13,8,M("#c8321e"))}else{for(let s=0;s<16;s++)for(let r=0;r<16;r++)n.set(r,s,$(e,.9+i()*.1));for(let[s,r]of[[4,4],[11,4],[4,11],[11,11]])n.rect(s-2,r-2,s+1,r+1,M("#8a2010")),n.rect(s-1,r-1,s,r,M("#e8e4dc"));t==="top"&&n.rect(7,7,8,8,M("#3a3a3a"))}return n}function Qv(i){let t=[M("#8a5a2a"),M("#b8823c"),M("#e0b860"),M("#f8de8c"),M("#fff4c0")];return Et(i,t,{layers:[[4,.4],[8,.6]],white:.8,contrast:1.9})}function t_(i){let t=new Nt,e=M("#a8c8c0"),n=M("#e4f4f0"),s=M("#d0e8e4");for(let r=0;r<16;r++)for(let o=0;o<16;o++)t.set(o,r,$(s,.95+i()*.08));t.outline(0,0,15,15,e);for(let r=3;r<=12;r++)for(let o=3;o<=12;o++)((o+r)%3===0||(o-r+15)%4===0)&&t.set(o,r,n);return t.outline(2,2,13,13,$(e,1.05)),t}function Rm(i,t=!1){let e=new Nt,n=M("#6b4a26"),s=M("#8a6234");for(let l=8;l<16;l++)e.set(7,l,s),e.set(8,l,n);let r=M(t?"#7ff4f8":"#ffe070"),o=M(t?"#2ab8d0":"#ff9a20"),a=M(t?"#ffffff":"#fff8d0");return e.set(7,6,r),e.set(8,6,o),e.set(7,7,o),e.set(8,7,r),e.set(7,5,a,230),e.set(8,5,r,200),e.set(7,4,r,150),e}function Pm(i,t=!1){let e=new Nt,n=M("#3c4048"),s=M("#5a6070"),r=M(t?"#6ee8f0":"#ffcf5a"),o=M(t?"#c8fcff":"#fff0b0");return e.rect(5,9,10,15,n),e.rect(6,10,9,14,r),e.rect(7,11,8,12,o),e.set(5,9,s),e.set(10,15,$(n,.7)),e.rect(6,7,9,8,s),e.set(7,6,n),e.set(8,6,n),e.rect(0,0,5,5,n),e.rect(1,1,4,4,s),e.rect(2,2,3,3,$(r,.8)),e}function e_(){let i=new Nt;for(let t=0;t<16;t++)i.set(7,t,M("#f4f0e8")),i.set(8,t,M("#d8d0c8"));return i.rect(0,0,3,3,M("#c8b8d8")),i.rect(1,1,2,2,M("#e8dcf0")),i}function fo(i,t,e){let n=new Nt;for(let s=0;s<16;s++)for(let r=0;r<16;r++){let o=e?Math.max(Math.abs(r-7.5),Math.abs(s-7.5)):0,a=e?(o|0)%3===0:(r+s*2)%7<2;n.set(r,s,$(t,(a?.85:1.05)*(.95+i()*.08)))}return e||n.outline(0,0,15,15,$(t,.8)),n}function Cu(i,t){let e=M("#c4a028"),n=M("#7a4a1c"),s=new Nt;for(let r=0;r<16;r++)for(let o=0;o<16;o++)if(t){let a=Math.max(Math.abs(o-7.5),Math.abs(r-7.5));s.set(o,r,$(e,(a|0)%2?.88:1.02+i()*.06))}else s.set(o,r,$(e,(o%3===0?.85:1)*(.92+i()*.14)));return t||(s.rect(0,3,15,4,n),s.rect(0,11,15,12,n)),s}function Lm(i,t){let e=M(t?"#a8a43c":"#c8c048"),n=Et(i,ie(e,4,.12),{white:.4});for(let s=0;s<14;s++){let r=i()*15|0,o=i()*15|0;n.rect(r,o,r+1,o+(i()<.5?0:1),$(e,.55))}return n}function n_(i){let t=new Nt,e=M("#6cc04c");for(let n=0;n<16;n++)for(let s=0;s<16;s++)t.set(s,n,$(e,.95+i()*.1),170);t.outline(0,0,15,15,$(e,.8));for(let n=0;n<16;n++)t.setA(n,0,230),t.setA(n,15,230),t.setA(0,n,230),t.setA(15,n,230);t.outline(3,3,12,12,$(e,.75));for(let n=3;n<=12;n++)t.setA(n,3,220),t.setA(n,12,220),t.setA(3,n,220),t.setA(12,n,220);return t.set(4,4,M("#c8f0b0"),230),t.set(5,4,M("#c8f0b0"),230),t}function i_(i){let t=new Nt,e=M("#f0a82a");for(let n=0;n<16;n++)for(let s=0;s<16;s++)t.set(s,n,$(e,.92+i()*.12),200);t.outline(0,0,15,15,$(e,.8));for(let n=0;n<16;n++)t.setA(n,0,240),t.setA(n,15,240),t.setA(0,n,240),t.setA(15,n,240);return t.set(4,3,M("#ffe6a0"),230),t.set(3,4,M("#ffe6a0"),230),t}function s_(i){let t=M("#e09a28"),e=new Nt;for(let n=0;n<16;n++)for(let s=0;s<16;s++){let r=n>>2,o=r%2?2:0,a=(n&3)===3||(s+o&3)===3;e.set(s,n,a?$(t,.68):$(t,1+i()*.08))}return e}function Im(i,t=!1){let e=M("#6a4426"),n=si(i,e);return n.outline(0,0,15,15,$(e,.55)),t?(n.rect(4,4,11,11,M("#2a1a10")),n.rect(5,5,10,10,M("#3a2a20"))):(n.rect(5,6,6,11,M("#2a1a10")),n.rect(7,4,11,5,M("#2a1a10")),n.rect(10,5,11,10,M("#2a1a10")),n.rect(3,10,6,12,M("#2a1a10")),n.rect(8,9,11,11,M("#2a1a10"))),n}function r_(i,t){let e=new Nt;for(let n=0;n<16;n++)for(let s=0;s<16;s++){let r=Math.sqrt((s-7.5)**2+(n-7.5)**2),o=t?1:Math.floor(r/2.2)%2;e.set(s,n,$(M(o?"#e8dcc8":"#d2342a"),.95+i()*.08))}if(t){let n=Nu(i);for(let s=0;s<1024;s+=4)n.d[s+3]}return e}function Um(i,t){let e=M("#86603a");if(t){let s=si(i,e).rotate(1);return s.outline(0,0,15,15,$(e,.5)),s.outline(1,1,14,14,$(e,.8)),s.rect(6,6,9,9,$(e,.45)),s}let n=si(i,e).rotate(1);for(let s of[2,13])for(let r=0;r<16;r++)n.set(r,s,M("#4a4a4e"));return n}function Dm(i,t){let e=M("#3a4a24"),n=Et(i,ie(e,4,.2),{white:.5});if(t)n.outline(0,0,15,15,$(e,.7)),n.outline(4,4,11,11,$(e,.8));else for(let s=0;s<16;s+=5)for(let r=0;r<16;r++)n.set(r,s,$(e,.65));return n}function Ru(i,t){if(t==="stem"){let s=Et(i,ie(M("#cfc8b8"),4,.06),{layers:[[2,.6],[16,.4]],white:.5});for(let r=0;r<16;r+=3)for(let o=0;o<16;o++)i()<.25&&s.set(r,o,M("#b8b0a0"));return s}let e=M(t==="red"?"#c42a22":"#97704e"),n=Et(i,ie(e,3,.06),{white:.4});if(t==="red")for(let[s,r,o]of[[2,3,3],[10,2,2],[6,8,3],[12,10,2],[2,12,2]])n.rect(s,r,s+o-1,r+o-1,M("#ece8e0"));return n}function Pu(i,t){let e=M("#5a8a2c"),n=new Nt;if(t==="side"){for(let s=0;s<16;s++)for(let r=0;r<16;r++){let o=r%4===1?1.12:r%4===3?.82:1;n.set(r,s,$(e,o*(.92+i()*.1)))}for(let s=0;s<10;s++){let r=(i()*4|0)*4+1,o=i()*16|0;n.set(r,o,M("#e8e0b8"))}return n}for(let s=0;s<16;s++)for(let r=0;r<16;r++){let o=Math.max(Math.abs(r-7.5),Math.abs(s-7.5));n.set(r,s,$(e,(o>6?.8:o<2?1.2:1)*(.94+i()*.08)))}return t==="top"&&(n.set(7,7,M("#d8e080")),n.set(8,8,M("#d8e080"))),n}function o_(i){let t=[M("#5a3c8c"),M("#7a54b0"),M("#9a70d0"),M("#c4a0f0"),M("#e8d4ff")],e=Et(i,t,{layers:[[4,.7],[8,.3]],white:.4,contrast:1.8});for(let n=0;n<6;n++){let s=i()*15|0,r=i()*15|0;e.set(s,r,t[4]),e.set(s+1,r+1,t[3])}return e}function a_(i){let t=Et(i,[M("#3a1408"),M("#5a1c0c"),M("#7a2a10"),M("#8a3412")],{white:.5}),e=Tn(i,4);for(let n=0;n<16;n++)for(let s=0;s<16;s++){let r=e(s,n);r>.62&&r<.7?t.set(s,n,M("#ff7a1a")):r>=.7&&r<.74&&t.set(s,n,M("#ffb040"))}return t}function l_(i){let t=Et(i,[M("#0c0814"),M("#160e22"),M("#24163a"),M("#3a2460")],{white:.6});for(let e=0;e<9;e++){let n=i()*16|0,s=i()*14|0;t.set(n,s,M("#8a3ae0")),t.set(n,s+1,M("#c070ff"))}return t}function c_(){let i=new Nt,t=Fu(77),e=Tn(t,4,8);for(let n=0;n<16;n++)for(let s=0;s<16;s++){let r=e(s,n);i.set(s,n,ln(r>.6?220:r>.4?190:170),200)}return i}function h_(){let i=new Nt,t=Fu(99),e=Tn(t,4),n=Tn(t,8);for(let s=0;s<16;s++)for(let r=0;r<16;r++){let o=e(r,s)*.6+n(r,s)*.4;i.set(r,s,o>.62?M("#ffd24a"):o>.5?M("#ff9a1e"):o>.38?M("#e8641a"):M("#c8461a"))}return i}function u_(i){return Et(i,[M("#1e1e1e"),M("#3a3a3a"),M("#575757"),M("#7a7a7a"),M("#a0a0a0")],{layers:[[4,.5],[8,.5]],white:.5,contrast:2.2})}function Bu(i,t){return t?Et(i,ie(me.deepslate,4,.14),{layers:[[4,.5],[8,.5]],white:.5}):Et(i,ie(me.deepslate,4,.16),{layers:[[8,.3],[16,.2]],white:.2,contrast:1.7}).fill((e,n)=>null)&&(()=>{let e=new Nt,n=Tn(i,2,8);for(let s=0;s<16;s++)for(let r=0;r<16;r++){let o=n(r,s)*.7+i()*.3;e.set(r,s,$(me.deepslate,.78+Math.round(o*4)/4*.38))}return e})()}function d_(i){return Et(i,[M("#e4eef2"),M("#eef6f8"),M("#f6fbfc"),M("#ffffff")],{white:.6})}function Lu(i,t){let e=M(t==="blue"?"#74a8f4":t==="packed"?"#8eb4f0":"#90b8f8"),n=Et(i,ie(e,3,.06),{white:.4});for(let s=0;s<5;s++){let r=i()*16|0,o=i()*16|0;for(let a=0;a<6;a++)n.set(r,o,Bn(e,[255,255,255],.5)),r++,i()<.5&&o++}if(t==="ice")for(let s=0;s<1024;s+=4)n.d[s+3]=175;return n}function Fi(i,t,e){if(e==="top")return Et(i,ie(t,3,.05),{white:.6});if(e==="bottom")return Et(i,ie(t,4,.1),{white:.6}).bevel(0,0,15,15,1,.85);let n=Et(i,ie(t,3,.06),{white:.5});if(e==="side"){n.rect(0,0,15,2,$(t,1.04)),n.rect(0,13,15,15,$(t,.92));for(let s=0;s<16;s++)n.set(s,3,$(t,.84)),n.set(s,12,$(t,.86)),i()<.4&&n.set(s,8,$(t,.92))}else e==="cut"?(n.outline(0,0,15,15,$(t,.85)),n.outline(0,0,15,7,$(t,.85))):(n.outline(0,0,15,15,$(t,.82)),n.rect(0,0,15,2,$(t,.95)),n.rect(0,13,15,15,$(t,.95)),n.outline(4,5,11,10,$(t,.75)),n.rect(6,7,9,8,$(t,.7)));return n}function pr(i,t){let e=M("#ebe5de"),n=Et(i,ie(e,3,.03),{white:.6});if(t==="side"&&n.bevel(0,0,15,15,1.02,.92),(t==="chiseled"||t==="chiseled_top")&&(n.outline(0,0,15,15,$(e,.85)),n.outline(3,3,12,12,$(e,.85)),t==="chiseled"&&n.outline(5,5,10,10,$(e,.9))),t==="pillar")for(let s=0;s<16;s++)n.set(0,s,$(e,.85)),n.set(15,s,$(e,.85)),n.set(4,s,$(e,.92)),n.set(11,s,$(e,.92));return t==="pillar_top"&&(n.outline(0,0,15,15,$(e,.85)),n.outline(3,3,12,12,$(e,.9))),t==="bricks"?Oi(i,e,$(e,.82),4,8):n}function Iu(i,t){if(t==="plain"){let n=[M("#3e7a6c"),M("#4f9284"),M("#63a596"),M("#79b4a0"),M("#5a8aa0")];return Et(i,n,{layers:[[4,.6],[8,.4]],white:.4,contrast:1.8})}if(t==="bricks")return Oi(i,M("#62a898"),M("#3c7a6c"),8,8);let e=Et(i,ie(M("#335a4c"),3,.08),{white:.4});e.outline(0,0,15,15,M("#1e3a30")),e.outline(4,4,11,11,M("#264a3e"));for(let n=0;n<16;n+=8)for(let s=0;s<16;s++)e.set(n,s,M("#1e3a30"));return e}function Uu(i,t){let e=M("#a77aa7");if(t==="block")return Ou(i,e,8);let n=Et(i,ie(e,3,.06),{white:.5});if(t==="pillar")for(let s=0;s<16;s++)for(let r of[0,5,10,15])n.set(r,s,$(e,.82));else n.outline(0,0,15,15,$(e,.8)),n.outline(4,4,11,11,$(e,.85));return n}function f_(i){let t=me.stone,e=Et(i,ie(t,3,.06),{white:.5});return e.bevel(0,0,15,15,1.15,.6),e.outline(3,3,12,12,$(t,.68)),e.bevel(4,4,11,11,1.12,.8),e.outline(6,6,9,9,$(t,.7)),e}function p_(i){let t=M("#2e1418"),e=Ou(i,t,16);return e.outline(3,3,12,12,$(t,1.6)),e.rect(6,6,9,9,$(t,1.4)),e.rect(7,7,8,8,$(t,.6)),e}function Bl(i,t){let e=M("#c06a4c"),n=M("#52a088"),s=Bn(e,n,t),r=ii(i,s,"plate");if(t>0&&t<1)for(let o=0;o<30;o++)r.set(i()*16|0,i()*16|0,Bn(s,t>.5?e:n,.4));return r}function m_(i){let t=si(i,M("#4a2a14"));for(let e=0;e<26;e++)t.set(i()*16|0,i()*16|0,i()<.5?M("#ff8a20"):M("#ffc040"));return t}function g_(){let i=new Nt,t=M("#6a6c70"),e=M("#a0a2a8");for(let n of[1,5,9,13])for(let s=0;s<16;s++)i.set(n,s,e),i.set(n+1,s,t);for(let n of[0,15])for(let s=0;s<16;s++)i.set(s,n,t);return i}function Wm(){return new Nt().fill((i,t)=>((i>>3)+(t>>3))%2?[248,0,248]:[0,0,0])}function Nm(i,t){let e=M("#947a46");if(t)return Et(i,ie(e,4,.12),{white:.6});let n=mr(i);for(let s=0;s<16;s++)for(let r=0;r<3;r++)n.set(s,r,$(e,.92+i()*.12));for(let s=0;s<16;s++)n.set(s,0,M("#00000000".slice(0,7)),0);return n}function Bm(i,t){let e=M(t?"#4a3a2e":"#584234"),n=Et(i,ie(e,4,.22),{white:.6});if(!t)for(let s=0;s<4;s++){let r=1+(i()*12|0),o=1+(i()*12|0),a=$(e,.55);n.set(r,o,a),n.set(r+2,o,a),n.set(r,o+2,a),n.set(r+1,o+2,a),n.set(r+2,o+2,a)}return n}var Fm={coal:[M("#2a2a2a"),M("#1a1a1a"),M("#4a4a4a")],iron:[M("#d8af93"),M("#b88a6c"),M("#f0d8c4")],copper:[M("#e07a4a"),M("#4a9a7a"),M("#ffb088")],gold:[M("#fcd84a"),M("#d8a020"),M("#fff6b0")],redstone:[M("#e01a10"),M("#a00a08"),M("#ff6a50")],lapis:[M("#2450c0"),M("#1a3490"),M("#6a90f0")],diamond:[M("#5ae8e0"),M("#2ab8b0"),M("#c8fff8")],emerald:[M("#28d860"),M("#10a040"),M("#a0ffc0")],nether_gold:[M("#fcd84a"),M("#d8a020"),M("#fff6b0")],nether_quartz:[M("#ece6dc"),M("#c8c0b4"),M("#ffffff")]},b_={missing:()=>Wm(),grass_top:Rv,grass_side:i=>wm(i),grass_side_snowy:i=>wm(i,!0),dirt:i=>mr(i),coarse_dirt:i=>{let t=mr(i);for(let e=0;e<30;e++)t.set(i()*16|0,i()*16|0,i()<.5?M("#5a3e24"):M("#8a7a6a"));return t},rooted_dirt:i=>{let t=mr(i);for(let e=0;e<4;e++){let n=i()*16|0,s=i()*16|0;for(let r=0;r<5;r++)t.set(n,s,M("#9a7a54")),s++,i()<.4&&(n+=i()<.5?-1:1)}return t},podzol_top:Mm,podzol_side:i=>Sm(i,Mm(i),mr(i)),mycelium_top:i=>Et(i,[M("#5a4a5a"),M("#6e5e6a"),M("#857580"),M("#9a8c98"),M("#b0a4b0")],{white:.8}),mycelium_side:i=>Sm(i,Et(i,[M("#6e5e6a"),M("#857580"),M("#9a8c98")],{white:.8}),mr(i)),path_top:i=>Nm(i,!0),path_side:i=>Nm(i,!1),mud:i=>Et(i,ie(me.mud,4,.1),{layers:[[4,.7],[8,.3]],white:.3}),packed_mud:i=>Et(i,ie(M("#8e6a4e"),4,.12),{white:.5}),mud_bricks:i=>Oi(i,M("#8a6a4c"),M("#6a4e38"),4,8),clay:i=>Et(i,ie(me.clay,4,.06),{layers:[[4,.8],[8,.2]],white:.3}),moss:i=>Et(i,[M("#46602a"),M("#567430"),M("#668a38"),M("#76983e"),M("#86a848")],{white:.6}),sand:i=>xm(i),red_sand:i=>xm(i,me.redSand),gravel:Pv,stone:i=>Om(i),granite:i=>Et(i,[M("#6e4636"),M("#8a5a48"),M("#9e6c58"),M("#b07e6a"),M("#c49a88")],{layers:[[8,.4],[16,.6]],white:.9,contrast:1.8}),diorite:i=>{let t=Et(i,[M("#a8a8a4"),M("#c4c4c0"),M("#d4d4d0"),M("#e4e4e0")],{white:.7});for(let e=0;e<14;e++){let n=i()*16|0,s=i()*16|0;t.set(n,s,M("#6e6e6c")),i()<.5&&t.set(n+1,s,M("#8a8a88"))}return t},andesite:i=>Et(i,[M("#666868"),M("#787a7a"),M("#888a8a"),M("#9a9c9c"),M("#aaacac")],{layers:[[4,.4],[8,.6]],white:.8,contrast:1.7}),deepslate:i=>Bu(i,!1),deepslate_top:i=>Bu(i,!0),tuff:i=>{let t=Et(i,ie(me.tuff,5,.16),{white:.7});for(let e=0;e<10;e++)t.set(i()*16|0,i()*16|0,M("#9a9a88"));return t},calcite:i=>Et(i,ie(me.calcite,4,.06),{layers:[[4,.6],[8,.4]],white:.4}),dripstone:i=>Et(i,ie(M("#866a5c"),5,.18),{layers:[[2,.3],[16,.7]],white:.4}),bedrock:u_,snow:d_,ice:i=>Lu(i,"ice"),packed_ice:i=>Lu(i,"packed"),blue_ice:i=>Lu(i,"blue"),obsidian:i=>{let t=Et(i,[M("#0c0a14"),M("#140f1f"),M("#1e1630"),M("#2a2042")],{white:.6});for(let e=0;e<6;e++)t.set(i()*16|0,i()*16|0,M("#4a3a6e"));return t},crying_obsidian:l_,netherrack:i=>Et(i,ie(me.netherrack,5,.22),{layers:[[4,.4],[16,.6]],white:.8}),soul_sand:i=>Bm(i,!1),soul_soil:i=>Bm(i,!0),magma:a_,basalt_top:i=>{let t=Et(i,ie(me.basalt,4,.14),{white:.5});return t.outline(1,1,14,14,$(me.basalt,.75)),t},basalt_side:i=>{let t=new Nt,e=Tn(i,8,2);return t.fill((n,s)=>$(me.basalt,.8+Math.round(e(n,s)*4)/4*.35))},blackstone:i=>Et(i,ie(me.blackstone,5,.25),{white:.6}),blackstone_top:i=>Et(i,ie(me.blackstone,4,.18),{layers:[[4,.8],[16,.2]],white:.4}),end_stone:i=>{let t=Et(i,ie(me.endStone,4,.08),{white:.6});for(let e=0;e<12;e++)t.set(i()*16|0,i()*16|0,$(me.endStone,.8));return t},amethyst:o_,bone_top:i=>{let t=Et(i,ie(M("#e4dec8"),3,.05),{white:.5});return t.rect(5,5,10,10,M("#c8c0a6")),t.rect(6,6,9,9,M("#e4dec8")),t},bone_side:i=>{let t=Et(i,ie(M("#e4dec8"),3,.05),{white:.5});for(let e=0;e<16;e++)t.set(3,e,M("#c8c0a6")),t.set(12,e,M("#c8c0a6"));return t},cobblestone:i=>Au(i),mossy_cobblestone:i=>Au(i,me.stone,!0),cobbled_deepslate:i=>Au(i,M("#56565c")),smooth_stone:i=>Du(i,M("#a0a0a0")),smooth_stone_slab_side:i=>{let t=Du(i,M("#a0a0a0"));for(let e=0;e<16;e++)t.set(e,7,M("#8a8a8a"));return t},stone_bricks:i=>Eu(i),mossy_stone_bricks:i=>Eu(i,me.stone,"mossy"),cracked_stone_bricks:i=>Eu(i,me.stone,"cracked"),chiseled_stone_bricks:f_,bricks:i=>Oi(i),polished_granite:i=>ho(i,M("#9a6a56")),polished_diorite:i=>ho(i,M("#cdcdca")),polished_andesite:i=>ho(i,M("#848686")),polished_deepslate:i=>ho(i,M("#48484d")),polished_tuff:i=>ho(i,M("#62645c")),polished_blackstone:i=>ho(i,M("#36303a")),deepslate_bricks:i=>Oi(i,M("#4c4c50"),M("#2e2e32"),4,8),deepslate_tiles:i=>Ou(i,M("#3a3a3e"),4),polished_blackstone_bricks:i=>Oi(i,M("#3a3440"),M("#221e26"),8,8),prismarine:i=>Iu(i,"plain"),prismarine_bricks:i=>Iu(i,"bricks"),dark_prismarine:i=>Iu(i,"dark"),nether_bricks:i=>Oi(i,M("#2e1418"),M("#160a0c"),4,8),red_nether_bricks:i=>Oi(i,M("#4a0a0c"),M("#2a0406"),4,8),cracked_nether_bricks:i=>{let t=Oi(i,M("#2e1418"),M("#160a0c"),4,8);return Hm(i,t,M("#0a0405"),4),t},chiseled_nether_bricks:p_,end_stone_bricks:i=>Oi(i,M("#dadc9c"),M("#b4b47a"),8,8),purpur:i=>Uu(i,"block"),purpur_pillar:i=>Uu(i,"pillar"),purpur_pillar_top:i=>Uu(i,"pillar_top"),terracotta:i=>Gm(i,M("#985e43")),sandstone:i=>Fi(i,M("#d8cb94"),"side"),sandstone_top:i=>Fi(i,M("#dccf9a"),"top"),sandstone_bottom:i=>Fi(i,M("#d8cb94"),"bottom"),chiseled_sandstone:i=>Fi(i,M("#d8cb94"),"chiseled"),cut_sandstone:i=>Fi(i,M("#d8cb94"),"cut"),red_sandstone:i=>Fi(i,M("#b8622a"),"side"),red_sandstone_top:i=>Fi(i,M("#bc642c"),"top"),red_sandstone_bottom:i=>Fi(i,M("#b8622a"),"bottom"),chiseled_red_sandstone:i=>Fi(i,M("#b8622a"),"chiseled"),cut_red_sandstone:i=>Fi(i,M("#b8622a"),"cut"),quartz_top:i=>pr(i,"top"),quartz_side:i=>pr(i,"side"),chiseled_quartz:i=>pr(i,"chiseled"),chiseled_quartz_top:i=>pr(i,"chiseled_top"),quartz_pillar:i=>pr(i,"pillar"),quartz_pillar_top:i=>pr(i,"pillar_top"),quartz_bricks:i=>pr(i,"bricks"),glass:Gv,tinted_glass:i=>{let t=new Nt;for(let e=0;e<16;e++)for(let n=0;n<16;n++)t.set(n,e,$(M("#2a2430"),.9+i()*.2),n===0||e===0||n===15||e===15?235:190);return t},iron_bars:()=>g_(),coal_block:i=>ii(i,M("#1c1c1e"),"rough"),iron_block:i=>ii(i,M("#d8d8d8"),"plate"),copper_block:i=>Bl(i,0),exposed_copper:i=>Bl(i,.3),weathered_copper:i=>Bl(i,.62),oxidized_copper:i=>Bl(i,1),gold_block:i=>ii(i,M("#f6d23e"),"plate"),redstone_block:i=>ii(i,M("#b0140a"),"gem"),lapis_block:i=>ii(i,M("#1e4aa6"),"rough"),diamond_block:i=>ii(i,M("#62dcd6"),"gem"),emerald_block:i=>ii(i,M("#2ac25c"),"gem"),netherite_block:i=>ii(i,M("#42393a"),"ingot"),raw_iron_block:i=>ii(i,M("#a6876a"),"rough"),raw_copper_block:i=>ii(i,M("#9a5a3c"),"rough"),raw_gold_block:i=>ii(i,M("#dca23a"),"rough"),glowstone:Qv,sea_lantern:t_,torch:i=>Rm(i),soul_torch:i=>Rm(i,!0),lantern:i=>Pm(i),soul_lantern:i=>Pm(i,!0),shroomlight:i=>Et(i,[M("#c8662a"),M("#e88a3a"),M("#f4a84c"),M("#ffcc70"),M("#fff0b0")],{white:.6,contrast:1.8}),pumpkin_top:i=>Nl(i,"top"),pumpkin_side:i=>Nl(i,"side"),carved_pumpkin:i=>Nl(i,"face"),jack_o_lantern:i=>Nl(i,"lit"),redstone_lamp_on:i=>{let t=Et(i,[M("#8a5a2a"),M("#c8862e"),M("#f0c060"),M("#fff0b0")],{white:.6});t.outline(0,0,15,15,M("#5a3a1a"));for(let e=3;e<13;e+=4)t.rect(e,3,e+1,12,M("#fff4c8"));return t},froglight_ochre:i=>fo(i,M("#f4dc8c"),!1),froglight_ochre_top:i=>fo(i,M("#f4dc8c"),!0),froglight_verdant:i=>fo(i,M("#d0ecc0"),!1),froglight_verdant_top:i=>fo(i,M("#d0ecc0"),!0),froglight_pearl:i=>fo(i,M("#f0dcf0"),!1),froglight_pearl_top:i=>fo(i,M("#f0dcf0"),!0),end_rod:()=>e_(),embers:m_,bookshelf:Jv,crafting_table_top:jv,crafting_table_side:i=>km(i,!1),crafting_table_front:i=>km(i,!0),furnace_top:i=>uo(i,"top"),furnace_side:i=>uo(i,"side"),furnace_front:i=>uo(i,"front"),blast_furnace_top:i=>uo(i,"top",M("#5e5e62"),!0),blast_furnace_side:i=>uo(i,"side",M("#5e5e62"),!0),blast_furnace_front:i=>uo(i,"front",M("#5e5e62"),!0),chest_top:i=>Tu(i,"top"),chest_side:i=>Tu(i,"side"),chest_front:i=>Tu(i,"front"),barrel_top:i=>Um(i,!0),barrel_side:i=>Um(i,!1),note_block:i=>Im(i),jukebox_top:i=>Im(i,!0),jukebox_side:i=>{let t=si(i,M("#6a4426"));return t.outline(0,0,15,15,M("#3a2416")),t.outline(1,1,14,14,M("#4a3020")),t},tnt_top:i=>ku(i,"top"),tnt_bottom:i=>ku(i,"bottom"),tnt_side:i=>ku(i,"side"),target_top:i=>Cu(i,!0),target_side:i=>r_(i,!1),melon_top:i=>Cm(i,!0),melon_side:i=>Cm(i,!1),hay_top:i=>Cu(i,!0),hay_side:i=>Cu(i,!1),sponge:i=>Lm(i,!1),wet_sponge:i=>Lm(i,!0),slime:n_,honey:i_,honeycomb:s_,kelp_top:i=>Dm(i,!0),kelp_side:i=>Dm(i,!1),mushroom_brown:i=>Ru(i,"brown"),mushroom_red:i=>Ru(i,"red"),mushroom_stem:i=>Ru(i,"stem"),cobweb:Zv,cactus_top:i=>Pu(i,"top"),cactus_bottom:i=>Pu(i,"bottom"),cactus_side:i=>Pu(i,"side"),sugar_cane:Xv,tall_grass:i=>Nu(i),fern:i=>Nu(i,!0),dead_bush:qv,brown_mushroom:i=>Tm(i,!1),red_mushroom:i=>Tm(i,!0),lily_pad:Yv,seagrass:Kv,water:()=>c_(),lava:()=>h_()};function Vm(i){var s;let t=Fu(kv(i)),e=b_[i];if(e)return e(t).d;let n;if(n=i.match(/^ore_(stone|deepslate|nether)_(.+)$/)){let r=n[1]==="stone"?Om(t):n[1]==="deepslate"?Bu(t,!1):Et(t,ie(me.netherrack,5,.22),{layers:[[4,.4],[16,.6]],white:.8}),o=n[1]==="nether"?`nether_${n[2]}`:n[2];return Uv(t,r,(s=Fm[o])!=null?s:Fm.coal,n[2]==="diamond"||n[2]==="emerald"?4:5).d}if(n=i.match(/^(wool|concrete|powder|terracotta|glazed|stained_glass)_(.+)$/)){let r=Dv[n[2]];if(r)switch(n[1]){case"wool":return Nv(t,r).d;case"concrete":return Bv(t,$(r,.92)).d;case"powder":return Fv(t,r).d;case"terracotta":return Gm(t,Ov(r)).d;case"glazed":return zv(t,r).d;case"stained_glass":return Hv(t,r).d}}if(n=i.match(/^flower_(.+)$/))return $v(t,n[1]).d;if(n=i.match(/^(stripped_)?(.+?)_(log|log_top|planks|leaves|door_top|door_bottom|trapdoor|sapling)$/)){let r=Ol[n[2]];if(r){let o=!!n[1];switch(n[3]){case"log":return o?Am(t,r.stripped).d:Am(t,r.bark,n[2]==="birch").d;case"log_top":return Lv(t,o?r.stripped:r.planks,r.bark,o).d;case"planks":return si(t,r.planks).d;case"leaves":return Iv(t,r.leaves,n[2]==="cherry"?.2:.25).d;case"door_top":return Em(t,r,!0).d;case"door_bottom":return Em(t,r,!1).d;case"trapdoor":return Wv(t,r).d;case"sapling":return Vv(t,r).d}}}return typeof console!="undefined"&&console.warn("[textures] no generator for",i),Wm().d}var ri={grass:M("#7bbd56"),foliage:M("#5fab36"),water:M("#3f76e4")};var Pa=[{id:"default",name:"Default",description:"The original BlockForge look."},{id:"smooth",name:"Smooth",description:"Soft, clean surfaces and richer colour."},{id:"retro",name:"Retro",description:"Chunky 8x8 pixels and a tiny palette."},{id:"vivid",name:"Vivid",description:"Bold colours and punchy contrast."},{id:"pastel",name:"Pastel",description:"Light, soft tones. Calm and dreamy."},{id:"custom",name:"Imported Pack",description:"Load a resource pack .zip from this device."}],br=null;function mo(i){br=i;for(let t of Array.from(Hl.keys()))t.startsWith("custom:")&&Hl.delete(t)}function is(){return br?{name:br.name,count:br.tiles.size}:null}function Hu(i){return Pa.some(t=>t.id===i)}var zl=new Uint8Array(1024);for(let i=1;i<xt;i++)if(yi[i])for(let t=0;t<6;t++){let e=Ut[i*6+t];ns[i]?zl[e]||(zl[e]=2):zl[e]=1}var zu=null;function y_(i){var t;return zu||(zu=new Map(Ni.map((e,n)=>[e,n]))),(t=zu.get(i))!=null?t:-1}function v_(i){return i>=0&&i<1024?{kind:dr[i],tint:zl[i]}:{kind:0,tint:0}}var $m=new Map,Hl=new Map;function __(i){let t=$m.get(i);return t||(t=Vm(i),$m.set(i,t)),t}function ss(i,t){var r;let e=__(i);if(t==="default")return e;if(t==="custom")return(r=br==null?void 0:br.tiles.get(i))!=null?r:e;let n=t+":"+i,s=Hl.get(n);return s||(s=C_(e,t,v_(y_(i))),Hl.set(n,s)),s}function Gl(i,t){var e;return ss((e=Ni[i])!=null?e:"missing",t)}var cn=256,po=(i,t,e)=>.299*i+.587*t+.114*e;function Wl(i,t){let e=new Float32Array(cn*3),n=new Uint8Array(cn),s=new Float32Array(cn),r=new Uint8Array(cn);for(let o=0;o<cn;o++){e[o*3]=i[o*4],e[o*3+1]=i[o*4+1],e[o*3+2]=i[o*4+2];let a=i[o*4+3];t.kind===0?(r[o]=1,t.tint===2?(s[o]=1-a/255,n[o]=a<128?1:0):t.tint===1&&(s[o]=1)):(r[o]=t.kind===1?a>=128?1:0:a>0?1:0,n[o]=r[o]?0:2,t.tint&&(s[o]=1))}return{rgb:e,cls:n,lumaW:s,vis:r,wrap:t.kind===0}}function Vl(i,t,e){let n=new Uint8ClampedArray(cn*4);for(let s=0;s<cn;s++){let r=i[s*4],o=i[s*4+1],a=i[s*4+2],l=e[s*3],c=e[s*3+1],h=e[s*3+2],u=t.lumaW[s];if(u>0){let f=po(r,o,a),d=Math.max(0,Math.min(255,po(l,c,h))),g,b,p;if(f>.5){let m=d/f;g=r*m,b=o*m,p=a*m}else g=b=p=d;l+=(g-l)*u,c+=(b-c)*u,h+=(p-h)*u}t.vis[s]||(l=r,c=o,h=a),n[s*4]=Math.round(l),n[s*4+1]=Math.round(c),n[s*4+2]=Math.round(h),n[s*4+3]=i[s*4+3]}return n}function qm(i,t,e){return e?(t&15)<<4|i&15:i<0||t<0||i>15||t>15?-1:t<<4|i}function x_(i,t,e,n){let s=i.rgb,r=new Float32Array(s),o=1/(2*e*e),a=1/(2*n*n);for(let l=0;l<16;l++)for(let c=0;c<16;c++){let h=l<<4|c;if(!i.vis[h])continue;let u=s[h*3],f=s[h*3+1],d=s[h*3+2],g=0,b=0,p=0,m=0;for(let v=-t;v<=t;v++)for(let y=-t;y<=t;y++){let _=qm(c+y,l+v,i.wrap);if(_<0||i.cls[_]!==i.cls[h]||!i.vis[_])continue;let w=s[_*3]-u,S=s[_*3+1]-f,A=s[_*3+2]-d,R=Math.exp(-(y*y+v*v)*o-(w*w+S*S+A*A)*a);g+=s[_*3]*R,b+=s[_*3+1]*R,p+=s[_*3+2]*R,m+=R}r[h*3]=g/m,r[h*3+1]=b/m,r[h*3+2]=p/m}return r}function Xm(i,t){let e=new Float32Array(t);for(let n=0;n<16;n++)for(let s=0;s<16;s++){let r=n<<4|s;if(!i.vis[r])continue;let o=0,a=0,l=0,c=0;for(let h=-1;h<=1;h++)for(let u=-1;u<=1;u++){let f=qm(s+u,n+h,i.wrap);f<0||i.cls[f]!==i.cls[r]||!i.vis[f]||(o+=t[f*3],a+=t[f*3+1],l+=t[f*3+2],c++)}e[r*3]=o/c,e[r*3+1]=a/c,e[r*3+2]=l/c}return e}function w_(i,t){let e=new Float32Array(3),n=new Float32Array(3);for(let s=0;s<cn;s++)i.vis[s]&&(e[i.cls[s]]+=po(t[s*3],t[s*3+1],t[s*3+2]),n[i.cls[s]]++);for(let s=0;s<3;s++)e[s]=n[s]?e[s]/n[s]:128;return e}function $l(i,t,e,n,s=0,r=1){let o=w_(i,t);for(let a=0;a<cn;a++){let l=o[i.cls[a]],c=t[a*3],h=t[a*3+1],u=t[a*3+2],f=po(c,h,u),d=l+(f-l)*n;for(let g=0;g<3;g++){let b=d+(t[a*3+g]-f)*e;b=b*r+s,t[a*3+g]=Math.max(0,Math.min(255,b))}}}function M_(i,t){let e=Wl(i,t),n=x_(e,2,1.4,30);for(let s=0;s<cn*3;s++)n[s]=n[s]*.92+e.rgb[s]*.08;return $l(e,n,1.2,1.04,-2,1),Vl(i,e,n)}function S_(i,t){let e=Wl(i,t),n=new Float32Array(e.rgb);$l(e,n,1.6,1.35);let s=Xm(e,n);for(let r=0;r<cn*3;r++){let o=n[r]+(n[r]-s[r])*.35;o=128+(o-128)*1.08,n[r]=Math.max(0,Math.min(255,o))}return Vl(i,e,n)}function A_(i,t){let e=Wl(i,t),n=Xm(e,e.rgb),s=new Float32Array(cn*3);for(let r=0;r<cn*3;r++)s[r]=e.rgb[r]*.6+n[r]*.4;$l(e,s,.55,.7);for(let r=0;r<cn*3;r++)s[r]=s[r]+(255-s[r])*.36;return Vl(i,e,s)}function E_(i,t,e){if(t.length===0)return;let n=(h,u,f)=>{let d=i[h*3]-u[f],g=i[h*3+1]-u[f+1],b=i[h*3+2]-u[f+2];return d*d*.3+g*g*.59+b*b*.11},s=Math.min(e,t.length),r=new Float32Array(s*3),o=t[0];for(let h of t)po(i[h*3],i[h*3+1],i[h*3+2])<po(i[o*3],i[o*3+1],i[o*3+2])&&(o=h);r[0]=i[o*3],r[1]=i[o*3+1],r[2]=i[o*3+2];let a=new Float32Array(t.length).fill(1/0),l=1;for(;l<s;l++){let h=-1,u=0;for(let f=0;f<t.length;f++)a[f]=Math.min(a[f],n(t[f],r,(l-1)*3)),a[f]>u&&(u=a[f],h=t[f]);if(h<0||u<4)break;r[l*3]=i[h*3],r[l*3+1]=i[h*3+1],r[l*3+2]=i[h*3+2]}let c=new Int32Array(t.length);for(let h=0;h<8;h++){for(let f=0;f<t.length;f++){let d=0,g=1/0;for(let b=0;b<l;b++){let p=n(t[f],r,b*3);p<g&&(g=p,d=b)}c[f]=d}let u=new Float32Array(l*4);for(let f=0;f<t.length;f++){let d=t[f],g=c[f];u[g*4]+=i[d*3],u[g*4+1]+=i[d*3+1],u[g*4+2]+=i[d*3+2],u[g*4+3]++}for(let f=0;f<l;f++)if(u[f*4+3])for(let d=0;d<3;d++)r[f*3+d]=u[f*4+d]/u[f*4+3]}for(let h=0;h<t.length;h++){let u=t[h],f=c[h];i[u*3]=r[f*3],i[u*3+1]=r[f*3+1],i[u*3+2]=r[f*3+2]}}var T_=i=>Math.round(Math.max(0,Math.min(255,i))/255*15)*17;function k_(i,t){var s;let e=Wl(i,t),n=new Float32Array(e.rgb);for(let r=0;r<16;r+=2)for(let o=0;o<16;o+=2){let a=[r<<4|o,r<<4|o+1,r+1<<4|o,r+1<<4|o+1];for(let l of a){if(!e.vis[l])continue;let c=0,h=0,u=0,f=0;for(let d of a)!e.vis[d]||e.cls[d]!==e.cls[l]||(c+=e.rgb[d*3],h+=e.rgb[d*3+1],u+=e.rgb[d*3+2],f++);n[l*3]=c/f,n[l*3+1]=h/f,n[l*3+2]=u/f}}$l(e,n,1.15,1.2);for(let r=0;r<3;r++){let o=[];for(let a=0;a<cn;a++)e.vis[a]&&e.cls[a]===r&&o.push(a);E_(n,o,e.lumaW[(s=o[0])!=null?s:0]>.5?3:5)}for(let r=0;r<cn*3;r++)n[r]=T_(n[r]);return Vl(i,e,n)}function C_(i,t,e){if(i.length!==cn*4)return i.slice();switch(t){case"smooth":return M_(i,e);case"retro":return k_(i,e);case"vivid":return S_(i,e);case"pastel":return A_(i,e);default:return i.slice()}}var Km=2,La={u:2,uDev:2,gw:640,gh:360,cx:320,cy:180,qh:90,dpr:1},Xl=!1,Vu=new Set,Qt=i=>`calc(var(--u)*${i})`;function R_(i,t,e,n){let s=Math.round(t*n),r=Math.round(e*n),o=Math.max(1,Math.floor(Math.min(s/320,r/240))),a=Math.max(1,Math.min(Math.round(Math.max(1,i)*n),o)),l=Math.floor(s/a),c=Math.floor(r/a);return l-=l&1,c-=c&1,{u:a/n,uDev:a,gw:l,gh:c,cx:l/2,cy:c/2,qh:Math.floor(c/4),dpr:n}}function kn(){return La}function Zm(i){return Vu.add(i),()=>Vu.delete(i)}function Gu(){if(typeof window=="undefined")return;let i=R_(Km,window.innerWidth||1280,window.innerHeight||720,window.devicePixelRatio||1),t=i.u!==La.u||i.gw!==La.gw||i.gh!==La.gh;La=i;let e=document.documentElement.style;if(e.setProperty("--u",`${i.u}px`),e.setProperty("--gw",String(i.gw)),e.setProperty("--gh",String(i.gh)),e.setProperty("--cx",String(i.cx)),e.setProperty("--cy",String(i.cy)),e.setProperty("--qh",String(i.qh)),t)for(let n of Vu)try{n(i)}catch(s){console.warn(s)}}function Ia(i,t,e){let n=document.createElement("canvas");n.width=i,n.height=t;let s=n.getContext("2d");if(!s)return"";let r=s.createImageData(i,t);return e(r.data),s.putImageData(r,0,0),n.toDataURL("image/png")}var $u="default";function Yl(i){let t=ss("dirt",$u);return Ia(16,16,e=>{for(let n=0;n<256;n++)e[n*4]=t[n*4]*i,e[n*4+1]=t[n*4+1]*i,e[n*4+2]=t[n*4+2]*i,e[n*4+3]=255})}function Ym(i,t,e){let n=i*374761393+t*668265263+e*2147483647|0;return n=Math.imul(n^n>>>13,1274126177),((n^n>>>16)>>>0)/4294967296}function Wu(i,t,e){return Ia(16,16,n=>{for(let s=0;s<16;s++)for(let r=0;r<16;r++){let o=(Ym(r,s,e)-.5)*2*t+(Ym(r>>2,s>>1,e+7)-.5)*t,a=(s*16+r)*4;n[a]=i[0]+o,n[a+1]=i[1]+o,n[a+2]=i[2]+o,n[a+3]=255}})}function qu(i,t){let e=i.length,n=i[0].length;return Ia(n,e,s=>{var r;for(let o=0;o<e;o++)for(let a=0;a<n;a++){let l=(r=t[i[o][a]])!=null?r:[0,0,0,0],c=(o*n+a)*4;s[c]=l[0],s[c+1]=l[1],s[c+2]=l[2],s[c+3]=l[3]}})}var Jm={".":[0,0,0,0],K:[0,0,0,255],W:[255,255,255,255],S:[85,85,85,255],c:[198,198,198,255]},P_=["..KKKKK..",".KWWWWWK.","KWWWWWWcK","KWWccccSK","KWWccccSK","KWWccccSK","KWcSSSSSK",".KSSSSSK.","..KKKKK.."];function ql(i,t){let e=[];for(let r=0;r<32;r++){let o="";for(let a=0;a<28;a++){let l=r===0&&(a<2||a>25)||r===1&&(a<1||a>26),c="c";l?c=".":r===0||r===1&&(a===1||a===26)||a===0||a===27||r===1&&(a===2||a===25)?c="K":r<=2||a<=2?c="W":a>=25&&(c="S"),!i&&c==="c"&&(c="d"),!i&&c==="W"&&(c="w"),!i&&c==="S"&&(c="s"),!i&&r>=28&&c!=="."&&(c=r===31?"K":c),o+=c}e.push(o)}return t&&e.reverse(),qu(e,{...Jm,d:[158,158,158,255],w:[214,214,214,255],s:[70,70,70,255]})}function L_(){return Ia(182,22,e=>{let n=(s,r,o)=>{let a=(r*182+s)*4;e[a]=o[0],e[a+1]=o[1],e[a+2]=o[2],e[a+3]=o[3]};for(let s=0;s<22;s++)for(let r=0;r<182;r++){if(r===0||s===0||r===181||s===21){n(r,s,[10,10,10,230]);continue}let a=(r-1)%20,l=s-1;a===0||a===19||l===0||l===19?n(r,s,[72,72,72,225]):a===1||l===1?n(r,s,[24,24,24,200]):a===18||l===18?n(r,s,[118,118,118,200]):n(r,s,[36,36,36,150])}})}function I_(){return Ia(24,24,t=>{let e=(n,s,r)=>{let o=(s*24+n)*4;t[o]=r[0],t[o+1]=r[1],t[o+2]=r[2],t[o+3]=r[3]};for(let n=0;n<24;n++)for(let s=0;s<24;s++){let r=Math.min(s,n,23-s,23-n);(s===0||s===23)&&(n===0||n===23)||(r===0?e(s,n,[0,0,0,255]):r===1?e(s,n,s===1||n===1?[255,255,255,255]:[208,208,208,255]):r===2?e(s,n,s===2||n===2?[232,232,232,255]:[168,168,168,255]):r===3&&e(s,n,[0,0,0,160]))}})}var U_=[".KKKKKKK.","KKGGGGGKK","KGKKKKKgK","KGKKKKKgK","KGKKKKKgK","KGKKKKKgK","KGKKKKKgK","KKgggggKK",".KKKKKKK."];function D_(){let i=Qt,t=`${i(1)} ${i(1)} 0 var(--sh)`;return`
:root{--u:2px;--gw:640;--gh:360;--cx:320;--cy:180;--qh:90;--sh:#3f3f3f}
#game{display:block;outline:none}
.bf-gui,.bf-full{position:fixed;left:0;top:0}
.bf-gui{width:${i("var(--gw)")};height:${i("var(--gh)")}}
.bf-full{right:0;bottom:0}
.bf-font,.bf-font input,.bf-font button{font-family:BlockForge,monospace;font-size:${i(8)};line-height:${i(9)};font-weight:normal;font-style:normal;
  letter-spacing:0;word-spacing:0;font-kerning:none;font-variant-ligatures:none;font-feature-settings:"kern" 0,"liga" 0;
  text-rendering:optimizeSpeed;-webkit-font-smoothing:none;-moz-osx-font-smoothing:unset;color:#fff;--sh:#3f3f3f;text-shadow:${t};
  white-space:pre;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}
.bf-font *{box-sizing:border-box}
.bf-abs{position:absolute}
.bf-c-white{color:#fff;--sh:#3f3f3f}
.bf-c-gray{color:#a0a0a0;--sh:#282828}
.bf-c-dim{color:#808080;--sh:#202020}
.bf-c-yellow{color:#ffff55;--sh:#3f3f15}
.bf-c-gold{color:#ffaa00;--sh:#2a1c00}
.bf-c-green{color:#55ff55;--sh:#153f15}
.bf-c-red{color:#ff5555;--sh:#3f1515}
.bf-btn.bf-c-red,.bf-btn.bf-c-red:hover{color:#ff5555}
.bf-btn.bf-c-yellow,.bf-btn.bf-c-yellow:hover{color:#ffff55}
.bf-c-dark{color:#404040;text-shadow:none}
.bf-noshadow{text-shadow:none}
.bf-center{text-align:center}
.bf-right{text-align:right}
.bf-pixel{image-rendering:pixelated;image-rendering:crisp-edges}

/* ---------------- backgrounds */
.bf-dirt{background:#2b2219 var(--bf-dirt) repeat;background-size:${i(32)} ${i(32)};image-rendering:pixelated}
.bf-dirt-dark{background:#16110c var(--bf-dirt-dark) repeat;background-size:${i(32)} ${i(32)};image-rendering:pixelated}
.bf-dim{background:linear-gradient(rgba(16,16,16,.75),rgba(16,16,16,.82))}

/* ---------------- buttons */
.bf-btn{position:absolute;display:block;height:${i(20)};width:${i(200)};margin:0;padding:${i(4)} 0 0;border:${i(1)} solid #000;border-radius:0;
  background:#717171 var(--bf-btn) repeat;background-size:${i(16)} ${i(16)};image-rendering:pixelated;
  box-shadow:inset ${i(1)} ${i(1)} 0 rgba(255,255,255,.36),inset ${i(-1)} ${i(-2)} 0 rgba(0,0,0,.38);
  color:#fff;--sh:#3f3f3f;text-align:center;cursor:default;outline:none;overflow:hidden;-webkit-appearance:none;appearance:none;text-decoration:none}
.bf-btn:hover,.bf-btn:focus-visible,.bf-btn.bf-hot{border-color:#fff;background-color:#8a8f99;background-image:var(--bf-btn-hot);color:#ffffa0;--sh:#3f3f28}
.bf-btn:active{box-shadow:inset ${i(1)} ${i(1)} 0 rgba(0,0,0,.3),inset ${i(-1)} ${i(-1)} 0 rgba(255,255,255,.18)}
.bf-btn:disabled,.bf-btn.bf-off{background:#2e2e2e var(--bf-btn-off) repeat;background-size:${i(16)} ${i(16)};border-color:#000;color:#a0a0a0;--sh:#282828;
  box-shadow:inset ${i(1)} ${i(1)} 0 rgba(255,255,255,.08),inset ${i(-1)} ${i(-1)} 0 rgba(0,0,0,.3)}
a.bf-btn{color:#fff}

/* ---------------- sliders */
.bf-slider{position:absolute;height:${i(20)};width:${i(150)};touch-action:none;outline:none}
.bf-slider .bf-track{position:absolute;inset:0;border:${i(1)} solid #000;background:#2e2e2e var(--bf-btn-off) repeat;background-size:${i(16)} ${i(16)};
  box-shadow:inset ${i(1)} ${i(1)} 0 rgba(0,0,0,.45),inset ${i(-1)} ${i(-1)} 0 rgba(255,255,255,.1)}
.bf-slider .bf-knob{position:absolute;top:0;width:${i(8)};height:${i(20)};border:${i(1)} solid #000;background:#8d8d8d var(--bf-btn) repeat;background-size:${i(16)} ${i(16)};
  box-shadow:inset ${i(1)} ${i(1)} 0 rgba(255,255,255,.45),inset ${i(-1)} ${i(-2)} 0 rgba(0,0,0,.4)}
.bf-slider .bf-lbl{position:absolute;left:0;top:${i(5)};width:100%;text-align:center;pointer-events:none}
.bf-slider:hover .bf-knob,.bf-slider:focus-visible .bf-knob,.bf-slider.bf-drag .bf-knob{border-color:#fff;background-image:var(--bf-btn-hot)}
.bf-slider:hover .bf-lbl,.bf-slider:focus-visible .bf-lbl,.bf-slider.bf-drag .bf-lbl{color:#ffffa0;--sh:#3f3f28}

/* ---------------- text fields */
.bf-field{position:absolute;height:${i(20)};width:${i(200)};margin:0;padding:${i(5)} ${i(4)} 0;border:${i(1)} solid #a0a0a0;border-radius:0;background:#000;
  color:#e0e0e0;--sh:#383838;outline:none;caret-color:#e0e0e0;-webkit-user-select:text;user-select:text;-webkit-appearance:none;appearance:none}
.bf-field:focus{border-color:#fff}
.bf-field::placeholder{color:#575757;text-shadow:none;opacity:1}
.bf-field::selection{background:#3050c0;color:#fff}
.bf-label{position:absolute;color:#a0a0a0;--sh:#282828}

/* ---------------- scroll lists */
.bf-list{position:absolute;overflow:hidden;touch-action:none}
.bf-list.bf-sunk{background:#16110c var(--bf-dirt-dark) repeat;background-size:${i(32)} ${i(32)}}
.bf-list .bf-list-in{position:absolute;left:0;right:0;top:0}
.bf-list .bf-shade-t,.bf-list .bf-shade-b{position:absolute;left:0;right:0;height:${i(4)};pointer-events:none;z-index:2}
.bf-list .bf-shade-t{top:0;background:linear-gradient(rgba(0,0,0,.85),rgba(0,0,0,0))}
.bf-list .bf-shade-b{bottom:0;background:linear-gradient(rgba(0,0,0,0),rgba(0,0,0,.85))}
.bf-sbar{position:absolute;width:${i(6)};background:#000;z-index:3;touch-action:none}
.bf-sbar .bf-thumb{position:absolute;left:0;width:${i(6)};background:#808080;box-shadow:inset ${i(-1)} ${i(-1)} 0 #c0c0c0;box-shadow:inset 0 0 0 0 transparent}
.bf-sbar .bf-thumb::after{content:"";position:absolute;left:0;top:0;right:${i(1)};bottom:${i(1)};background:#c0c0c0}
.bf-sbar.bf-none{display:none}

/* ---------------- menus */
.bf-menus{z-index:30;display:none}
.bf-menus.bf-open{display:block}
.bf-screen{position:fixed;inset:0;overflow:hidden}
.bf-screen .bf-gui{position:absolute}
.bf-h1{position:absolute;left:0;width:${i("var(--gw)")};text-align:center}
.bf-hline{position:absolute;left:0;width:${i("var(--gw)")};height:${i(2)};background:linear-gradient(rgba(0,0,0,.6) 50%,rgba(255,255,255,.12) 50%)}
.bf-logo{position:absolute;image-rendering:pixelated}
.bf-splash{position:absolute;color:#ffff00;--sh:#3f3f00;transform-origin:50% 50%;animation:bf-splash .5s ease-in-out infinite alternate;white-space:pre;pointer-events:none}
@keyframes bf-splash{from{transform:translate(-50%,-50%) rotate(-20deg) scale(var(--ss,1.8))}to{transform:translate(-50%,-50%) rotate(-20deg) scale(calc(var(--ss,1.8)*.93))}}
.bf-pano{position:absolute;left:0;top:0;height:100%;background-repeat:repeat-x;image-rendering:pixelated;will-change:transform;
  animation:bf-pano-move 90s linear infinite}
@keyframes bf-pano-move{from{transform:translateX(0)}to{transform:translateX(var(--pano-w,-2048px))}}
.bf-vignette{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 40%,rgba(0,0,0,0) 30%,rgba(0,0,0,.55) 100%),linear-gradient(rgba(0,0,0,.25),rgba(0,0,0,.05) 40%,rgba(0,0,0,.4))}
.bf-pause-bg{position:absolute;inset:0;background:linear-gradient(rgba(16,16,16,.66),rgba(16,16,16,.78))}
.bf-row{position:absolute;box-sizing:border-box;border:${i(1)} solid transparent;outline:none}
.bf-row:hover{background:rgba(255,255,255,.06)}
.bf-row.bf-sel{border-color:#c0c0c0;background:rgba(0,0,0,.55)}
.bf-row.bf-sel:focus-visible,.bf-row:focus-visible{border-color:#fff}
.bf-row .bf-thumbimg{position:absolute;left:${i(1)};top:${i(1)};width:${i(32)};height:${i(32)};image-rendering:pixelated}
.bf-row:hover .bf-thumbimg::after{content:"";position:absolute;inset:0;background:rgba(255,255,255,.15)}
.bf-row .bf-play{position:absolute;left:${i(1)};top:${i(1)};width:${i(32)};height:${i(32)};display:none;background:rgba(0,0,0,.45)}
.bf-row:hover .bf-play,.bf-row.bf-sel .bf-play{display:block}
.bf-play::after{content:"";position:absolute;left:${i(12)};top:${i(8)};border-style:solid;border-color:transparent transparent transparent #fff;border-width:${i(8)} 0 ${i(8)} ${i(10)}}
.bf-keycap{position:absolute;height:${i(20)};width:${i(90)};border:${i(1)} solid #000;padding-top:${i(4)};text-align:center;
  background:#3a3a3a var(--bf-btn-off) repeat;background-size:${i(16)} ${i(16)};box-shadow:inset ${i(1)} ${i(1)} 0 rgba(255,255,255,.14),inset ${i(-1)} ${i(-2)} 0 rgba(0,0,0,.35)}
.bf-progress{position:absolute;height:${i(10)};border:${i(1)} solid #000;background:#262626;box-shadow:inset ${i(1)} ${i(1)} 0 #111,inset ${i(-1)} ${i(-1)} 0 #4a4a4a}
.bf-progress .bf-fill{position:absolute;left:${i(1)};top:${i(1)};bottom:${i(1)};width:0;background:#5bbf3a;box-shadow:inset 0 ${i(2)} 0 #8ee060,inset 0 ${i(-2)} 0 #3a8a22}
/* feature / warning buttons (Shaders..., Resource Packs..., Restore Defaults armed) */
.bf-btn.bf-feature:not(:hover):not(:focus-visible):not(:disabled){color:#ffe36e;--sh:#3f3410}
.bf-btn.bf-warn,.bf-btn.bf-warn:hover,.bf-btn.bf-warn:focus-visible{color:#ff6b6b;--sh:#3f1515}
/* shader choice cards */
.bf-card{position:absolute;display:block;margin:0;padding:0;text-align:left;border:${i(1)} solid #000;border-radius:0;outline:none;cursor:default;
  background:rgba(0,0,0,.5);box-shadow:inset 0 0 0 ${i(1)} #4a4a4a;color:#fff;-webkit-appearance:none;appearance:none;overflow:hidden}
.bf-card:hover,.bf-card:focus-visible{box-shadow:inset 0 0 0 ${i(1)} #a0a0a0;background:rgba(30,30,30,.62)}
.bf-card.bf-on{box-shadow:inset 0 0 0 ${i(1)} #fff;background:rgba(0,0,0,.68)}
.bf-card .bf-card-name{color:#fff;--sh:#3f3f3f}
.bf-card:hover .bf-card-name,.bf-card:focus-visible .bf-card-name{color:#ffffa0;--sh:#3f3f28}
.bf-card.bf-on .bf-card-name{color:#ffff55;--sh:#3f3f15}
.bf-card .bf-card-desc{color:#b8b8b8;--sh:#282828}
.bf-radio{position:absolute;background:#8b8b8b;box-shadow:inset ${i(1)} ${i(1)} 0 #373737,inset ${i(-1)} ${i(-1)} 0 #fff}
.bf-card.bf-on .bf-radio::after{content:"";position:absolute;left:${i(3)};top:${i(3)};width:${i(4)};height:${i(4)};background:#55ff55;box-shadow:inset ${i(-1)} ${i(-1)} 0 #2a9a2a}
/* resource pack rows */
.bf-packrow{cursor:default}
.bf-packrow .bf-strip{pointer-events:none}
.bf-stripimg{position:absolute;image-rendering:pixelated;image-rendering:crisp-edges}
.bf-blink{animation:bf-blink 1s steps(1) infinite}
@keyframes bf-blink{50%{opacity:0}}

/* ---------------- HUD */
.bf-hud{z-index:16;pointer-events:none}
.bf-hud.bf-hidden,.bf-cross.bf-hidden{display:none}
.bf-cross{position:fixed;z-index:16;pointer-events:none;mix-blend-mode:difference;width:${i(9)};height:${i(9)};
  left:${i("(var(--cx) - 4)")};top:${i("(var(--cy) - 4)")}}
.bf-cross::before,.bf-cross::after{content:"";position:absolute;background:#fff}
.bf-cross::before{left:0;top:${i(4)};width:${i(9)};height:${i(1)}}
.bf-cross::after{left:${i(4)};top:0;width:${i(1)};height:${i(9)}}
.bf-hotbar{position:absolute;width:${i(182)};height:${i(22)};left:${i("(var(--cx) - 91)")};top:${i("(var(--gh) - 22)")};
  background:var(--bf-hotbar) no-repeat;background-size:100% 100%;image-rendering:pixelated}
.bf-hotbar .bf-hslot{position:absolute;top:${i(1)};width:${i(20)};height:${i(20)}}
.bf-hotbar .bf-hslot .bf-icon{position:absolute;left:${i(2)};top:${i(2)};width:${i(16)};height:${i(16)}}
.bf-hotbar .bf-num{position:absolute;left:${i(1)};top:0;color:rgba(255,255,255,.62);--sh:rgba(0,0,0,.7)}
.bf-hotbar .bf-hsel{position:absolute;top:${i(-1)};width:${i(24)};height:${i(24)};background:var(--bf-select) no-repeat;background-size:100% 100%;image-rendering:pixelated}
.bf-itemname{position:absolute;left:0;width:${i("var(--gw)")};top:${i("(var(--gh) - 45)")};text-align:center;opacity:0}
.bf-chat{position:absolute;left:${i(2)};bottom:${i(40)};width:${i(320)}}
.bf-chat .bf-msg{position:relative;width:${i(320)};min-height:${i(9)};padding:0 ${i(2)};background:rgba(0,0,0,.5);white-space:pre-wrap;word-break:break-word}
.bf-debug{position:absolute;left:${i(2)};top:${i(2)};right:${i(2)};display:none}
.bf-debug.bf-on{display:block}
.bf-debug .bf-col{position:absolute;top:0}
.bf-debug .bf-col.bf-r{right:0;text-align:right}
.bf-debug .bf-line{height:${i(9)};color:#e0e0e0;text-shadow:none}
.bf-debug .bf-line span{display:inline-block;height:${i(9)};padding:0 ${i(1)};background:rgba(80,80,80,.56)}
.bf-fps{position:absolute;left:${i(2)};top:${i(2)};display:none;color:#e0e0e0}
.bf-fps.bf-on{display:block}
.bf-water{position:fixed;inset:0;z-index:15;pointer-events:none;opacity:0;transition:opacity .25s;
  background:radial-gradient(ellipse at 50% 50%,rgba(20,60,140,.16) 40%,rgba(5,20,70,.5) 100%)}
.bf-water.bf-on{opacity:1}
@media (pointer:coarse){.bf-hotbar .bf-hslot{pointer-events:auto;touch-action:none}}

/* ---------------- icons and slots */
.bf-icon{background-image:var(--bf-icons);background-size:var(--bf-icons-size);background-repeat:no-repeat;image-rendering:pixelated}
.bf-slot{position:absolute;width:${i(18)};height:${i(18)};background:#8b8b8b;box-shadow:inset ${i(1)} ${i(1)} 0 #373737,inset ${i(-1)} ${i(-1)} 0 #fff}
.bf-slot .bf-icon{position:absolute;left:${i(1)};top:${i(1)};width:${i(16)};height:${i(16)};pointer-events:none}
.bf-slot.bf-hover::after{content:"";position:absolute;left:${i(1)};top:${i(1)};width:${i(16)};height:${i(16)};background:rgba(255,255,255,.5);pointer-events:none}

/* ---------------- creative inventory */
.bf-inv-root{z-index:20;display:none;touch-action:none}
.bf-inv-root.bf-open{display:block}
.bf-inv-panel{position:absolute;width:${i(195)};height:${i(136)};left:${i("(var(--cx) - 98)")};top:${i("(var(--cy) - 68)")}}
.bf-inv-close{position:absolute;left:${i(198)};top:${i(4)};width:${i(16)};height:${i(16)};display:flex;align-items:center;justify-content:center;
  background:#8b8b8b;color:#fff;font-size:${i(9)};line-height:1;text-shadow:${i(1)} ${i(1)} 0 #3f3f3f;cursor:pointer;
  box-shadow:inset ${i(1)} ${i(1)} 0 #d8d8d8,inset ${i(-1)} ${i(-1)} 0 #565656,0 0 0 ${i(1)} #000}
.bf-inv-close:hover{background:#9aa6d4}
.bf-inv-bg{position:absolute;inset:0;border-style:solid;border-width:${i(4)};border-image:var(--bf-panel) 4 fill stretch;image-rendering:pixelated}
.bf-inv-title{position:absolute;left:${i(8)};top:${i(5)}}
.bf-tab{position:absolute;width:${i(28)};height:${i(32)};background:var(--bf-tab) no-repeat;background-size:100% 100%;image-rendering:pixelated}
.bf-tab.bf-bottom{background-image:var(--bf-tab-b)}
.bf-tab.bf-sel{background-image:var(--bf-tab-sel);z-index:2}
.bf-tab.bf-bottom.bf-sel{background-image:var(--bf-tab-b-sel)}
.bf-tab .bf-icon{position:absolute;left:${i(6)};width:${i(16)};height:${i(16)};pointer-events:none}
.bf-tab:not(.bf-bottom) .bf-icon{top:${i(9)}}
.bf-tab.bf-bottom .bf-icon{top:${i(7)}}
.bf-tab:not(.bf-sel):hover{filter:brightness(1.12)}
.bf-inv-search{position:absolute;left:${i(81)};top:${i(4)};width:${i(90)};height:${i(12)};padding:${i(1)} ${i(2)} 0;border:${i(1)} solid #000;
  background:#000;box-shadow:inset 0 0 0 ${i(1)} #3d3d3d;color:#fff;outline:none;caret-color:#fff;-webkit-user-select:text;user-select:text;border-radius:0;margin:0}
.bf-inv-search:focus{box-shadow:inset 0 0 0 ${i(1)} #a0a0a0}
.bf-inv-search::placeholder{color:#6c6c6c;text-shadow:none}
.bf-inv-track{position:absolute;left:${i(174)};top:${i(17)};width:${i(14)};height:${i(112)};background:#8b8b8b;
  box-shadow:inset ${i(1)} ${i(1)} 0 #373737,inset ${i(-1)} ${i(-1)} 0 #fff;touch-action:none}
.bf-inv-thumb{position:absolute;left:${i(1)};width:${i(12)};height:${i(15)};border:${i(1)} solid #000;background:#c6c6c6;
  box-shadow:inset ${i(1)} ${i(1)} 0 #fff,inset ${i(-1)} ${i(-1)} 0 #555}
.bf-inv-thumb.bf-off{background:#9a9a9a;box-shadow:inset ${i(1)} ${i(1)} 0 #b8b8b8,inset ${i(-1)} ${i(-1)} 0 #5a5a5a}
.bf-inv-empty{position:absolute;left:${i(9)};top:${i(54)};width:${i(162)};text-align:center}
.bf-tip{position:absolute;z-index:5;padding:${i(4)} ${i(5)} ${i(3)};border-style:solid;border-width:${i(3)};margin:0;
  border-image:var(--bf-tip) 3 fill stretch;image-rendering:pixelated;pointer-events:none;display:none;line-height:${i(10)}}
.bf-tip.bf-on{display:block}
.bf-held{position:absolute;z-index:6;width:${i(16)};height:${i(16)};pointer-events:none;display:none}
.bf-held.bf-on{display:block}
`}function Xu(i){if(!(i===$u&&Xl)&&($u=i,!(typeof document=="undefined"||!Xl)))try{let t=document.documentElement.style;t.setProperty("--bf-dirt",`url(${Yl(.27)})`),t.setProperty("--bf-dirt-dark",`url(${Yl(.14)})`)}catch(t){console.warn("[ui] could not repaint menu backgrounds",t)}}function go(i){if(Km=Number.isFinite(i)?Math.max(1,Math.min(6,i)):2,typeof document!="undefined"){if(!Xl){Xl=!0;let t=document.getElementById("bf-ui-css");t||(t=document.createElement("style"),t.id="bf-ui-css",document.head.appendChild(t)),t.textContent=D_();let e=document.documentElement.style;try{e.setProperty("--bf-dirt",`url(${Yl(.27)})`),e.setProperty("--bf-dirt-dark",`url(${Yl(.14)})`),e.setProperty("--bf-btn",`url(${Wu([112,112,112],7,1)})`),e.setProperty("--bf-btn-hot",`url(${Wu([128,136,152],7,2)})`),e.setProperty("--bf-btn-off",`url(${Wu([44,44,44],4,3)})`),e.setProperty("--bf-panel",`url(${qu(P_,Jm)})`),e.setProperty("--bf-tab",`url(${ql(!1,!1)})`),e.setProperty("--bf-tab-sel",`url(${ql(!0,!1)})`),e.setProperty("--bf-tab-b",`url(${ql(!1,!0)})`),e.setProperty("--bf-tab-b-sel",`url(${ql(!0,!0)})`),e.setProperty("--bf-hotbar",`url(${L_()})`),e.setProperty("--bf-select",`url(${I_()})`),e.setProperty("--bf-tip",`url(${qu(U_,{".":[0,0,0,0],K:[16,10,6,240],G:[214,150,48,255],g:[120,72,18,255]})})`)}catch(s){console.warn("[ui] could not paint UI textures",s)}window.addEventListener("resize",Gu);let n=()=>{try{let s=matchMedia(`(resolution: ${window.devicePixelRatio||1}dppx)`),r=()=>{s.removeEventListener("change",r),Gu(),n()};s.addEventListener("change",r)}catch{}};n()}Gu()}}var Zl={" ":"...","!":"#|#|#|#|#|.|#",'"':"#.#|#.#","#":".#.#.|.#.#.|#####|.#.#.|#####|.#.#.|.#.#.",$:"..#..|.####|#....|.###.|....#|####.|..#..","%":"##..#|##.#.|...#.|..#..|.#...|.#.##|#..##","&":".##..|#..#.|.##..|.##.#|#..#.|#..#.|.##.#","'":"#|#","(":"..#|.#.|#..|#..|#..|.#.|..#",")":"#..|.#.|..#|..#|..#|.#.|#..","*":".....|..#..|#.#.#|.###.|#.#.#|..#..","+":".....|..#..|..#..|#####|..#..|..#..",",":"..|..|..|..|..|.#|.#|#.","-":".....|.....|.....|#####",".":".|.|.|.|.|.|#","/":"....#|...#.|...#.|..#..|.#...|.#...|#....",0:".###.|#...#|#..##|#.#.#|##..#|#...#|.###.",1:"..#..|.##..|..#..|..#..|..#..|..#..|#####",2:".###.|#...#|....#|..##.|.#...|#....|#####",3:".###.|#...#|....#|..##.|....#|#...#|.###.",4:"...##|..#.#|.#..#|#...#|#####|....#|....#",5:"#####|#....|####.|....#|....#|#...#|.###.",6:"..##.|.#...|#....|####.|#...#|#...#|.###.",7:"#####|#...#|....#|...#.|..#..|..#..|..#..",8:".###.|#...#|#...#|.###.|#...#|#...#|.###.",9:".###.|#...#|#...#|.####|....#|...#.|.##..",":":".|.|#|.|.|.|#",";":"..|..|.#|..|..|..|.#|#.","<":"...#|..#.|.#..|#...|.#..|..#.|...#","=":".....|.....|#####|.....|.....|#####",">":"#...|.#..|..#.|...#|..#.|.#..|#...","?":".###.|#...#|....#|...#.|..#..|.....|..#..","@":".###.|#...#|#.###|#.#.#|#.###|#....|.####",A:".###.|#...#|#...#|#####|#...#|#...#|#...#",B:"####.|#...#|#...#|####.|#...#|#...#|####.",C:".###.|#...#|#....|#....|#....|#...#|.###.",D:"###..|#..#.|#...#|#...#|#...#|#..#.|###..",E:"#####|#....|#....|####.|#....|#....|#####",F:"#####|#....|#....|####.|#....|#....|#....",G:".####|#....|#....|#..##|#...#|#...#|.####",H:"#...#|#...#|#...#|#####|#...#|#...#|#...#",I:"###|.#.|.#.|.#.|.#.|.#.|###",J:"....#|....#|....#|....#|#...#|#...#|.###.",K:"#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#",L:"#....|#....|#....|#....|#....|#....|#####",M:"#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#",N:"#...#|##..#|#.#.#|#..##|#...#|#...#|#...#",O:".###.|#...#|#...#|#...#|#...#|#...#|.###.",P:"####.|#...#|#...#|####.|#....|#....|#....",Q:".###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#",R:"####.|#...#|#...#|####.|#.#..|#..#.|#...#",S:".####|#....|#....|.###.|....#|....#|####.",T:"#####|..#..|..#..|..#..|..#..|..#..|..#..",U:"#...#|#...#|#...#|#...#|#...#|#...#|.###.",V:"#...#|#...#|#...#|#...#|.#.#.|.#.#.|..#..",W:"#...#|#...#|#...#|#.#.#|#.#.#|##.##|#...#",X:"#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#",Y:"#...#|#...#|.#.#.|..#..|..#..|..#..|..#..",Z:"#####|....#|...#.|..#..|.#...|#....|#####","[":"###|#..|#..|#..|#..|#..|###","\\":"#....|.#...|.#...|..#..|...#.|...#.|....#","]":"###|..#|..#|..#|..#|..#|###","^":"..#..|.#.#.|#...#",_:".....|.....|.....|.....|.....|.....|.....|#####","`":"#.|.#",a:".....|.....|.###.|....#|.####|#...#|.####",b:"#....|#....|#.##.|##..#|#...#|#...#|####.",c:".....|.....|.###.|#...#|#....|#...#|.###.",d:"....#|....#|.##.#|#..##|#...#|#...#|.####",e:".....|.....|.###.|#...#|#####|#....|.###.",f:"..##|.#..|####|.#..|.#..|.#..|.#..",g:".....|.....|.####|#...#|#...#|.####|....#|####.",h:"#....|#....|#.##.|##..#|#...#|#...#|#...#",i:"#|.|#|#|#|#|#",j:"...#|....|...#|...#|...#|...#|#..#|.##.",k:"#...|#...|#..#|#.#.|##..|#.#.|#..#",l:"#.|#.|#.|#.|#.|#.|.#",m:".....|.....|##.#.|#.#.#|#.#.#|#...#|#...#",n:".....|.....|####.|#...#|#...#|#...#|#...#",o:".....|.....|.###.|#...#|#...#|#...#|.###.",p:".....|.....|#.##.|##..#|#...#|####.|#....|#....",q:".....|.....|.##.#|#..##|#...#|.####|....#|....#",r:".....|.....|#.##.|##..#|#....|#....|#....",s:".....|.....|.####|#....|.###.|....#|####.",t:".#.|.#.|###|.#.|.#.|.#.|..#",u:".....|.....|#...#|#...#|#...#|#...#|.####",v:".....|.....|#...#|#...#|#...#|.#.#.|..#..",w:".....|.....|#...#|#.#.#|#.#.#|#.#.#|.#.#.",x:".....|.....|#...#|.#.#.|..#..|.#.#.|#...#",y:".....|.....|#...#|#...#|#...#|.####|....#|####.",z:".....|.....|#####|...#.|..#..|.#...|#####","{":"..##|.#..|.#..|#...|.#..|.#..|..##","|":"#|#|#|#|#|#|#|#","}":"##..|..#.|..#.|...#|..#.|..#.|##..","~":"......|......|.##..#|#..##.","\xA0":"...","\u200A":"","\xB7":".|.|.|#","\u2026":".....|.....|.....|.....|.....|.....|#.#.#","\u2190":".....|..#..|.#...|#####|.#...|..#..","\u2191":"..#..|.###.|#.#.#|..#..|..#..|..#..|..#..","\u2192":".....|..#..|...#.|#####|...#.|..#..","\u2193":"..#..|..#..|..#..|..#..|#.#.#|.###.|..#.."},N_=["###|#.#|#.#|#.#|###",".#.|##.|.#.|.#.|###","###|..#|###|#..|###","###|..#|.##|..#|###","#.#|#.#|###|..#|..#","###|#..|###|..#|###","###|#..|###|#.#|###","###|..#|..#|.#.|.#.","###|#.#|###|#.#|###","###|#.#|###|..#|###"];N_.forEach((i,t)=>{Zl[String.fromCharCode(57344+t)]=i});function B_(i){let t=Zl[i];return t===void 0?6:t.split("|")[0].length+1}function F_(i){var n;let t=[],e=new Map;for(let s=0;s<=i.length;s++){let r=(n=i[s])!=null?n:"",o=[],a=0;for(;a<r.length;)if(r[a]==="#"){let c=a;for(;a<r.length&&r[a]==="#";)a++;o.push([c,a])}else a++;let l=new Set;for(let[c,h]of o){let u=c+","+h;l.add(u);let f=e.get(u);f?f[3]=s+1:e.set(u,[c,s,h,s+1])}for(let[c,h]of e)l.has(c)||(t.push(h),e.delete(c))}for(let s of e.values())t.push(s);return t}function jm(i){let t=i.split("|"),e=t[0].length,n=F_(t);if(!n.length)return{data:new Uint8Array(0),advance:(e+1)*128,xMin:0,yMin:0,xMax:0,yMax:0,points:0,contours:0};let s=[],r=[],o=[];for(let[m,v,y,_]of n){let w=m*128,S=y*128,A=(7-v)*128,R=(7-_)*128;s.push(w,w,S,S),r.push(R,A,A,R),o.push(s.length-1)}let a=Math.min(...s),l=Math.max(...s),c=Math.min(...r),h=Math.max(...r),u=s.length,f=10+o.length*2+2+u+u*4,d=new DataView(new ArrayBuffer(f+(4-f%4)%4)),g=0;d.setInt16(g,o.length),g+=2,d.setInt16(g,a),g+=2,d.setInt16(g,c),g+=2,d.setInt16(g,l),g+=2,d.setInt16(g,h),g+=2;for(let m of o)d.setUint16(g,m),g+=2;d.setUint16(g,0),g+=2;for(let m=0;m<u;m++)d.setUint8(g++,1);let b=0,p=0;for(let m=0;m<u;m++)d.setInt16(g,s[m]-b),b=s[m],g+=2;for(let m=0;m<u;m++)d.setInt16(g,r[m]-p),p=r[m],g+=2;return{data:new Uint8Array(d.buffer),advance:(e+1)*128,xMin:a,yMin:c,xMax:l,yMax:h,points:u,contours:o.length}}var $n=class{constructor(){this.bytes=[]}u8(t){return this.bytes.push(t&255),this}u16(t){return this.bytes.push(t>>8&255,t&255),this}i16(t){return this.u16(t<0?t+65536:t)}u32(t){return this.bytes.push(t>>>24&255,t>>>16&255,t>>>8&255,t&255),this}tag(t){for(let e=0;e<4;e++)this.u8(t.charCodeAt(e));return this}raw(t){for(let e=0;e<t.length;e++)this.bytes.push(t[e]);return this}get length(){return this.bytes.length}out(){return new Uint8Array(this.bytes)}};function Qm(i){var n,s,r,o;let t=0,e=Math.ceil(i.length/4)*4;for(let a=0;a<e;a+=4)t=t+(((n=i[a])!=null?n:0)<<24|((s=i[a+1])!=null?s:0)<<16|((r=i[a+2])!=null?r:0)<<8|((o=i[a+3])!=null?o:0))>>>0;return t>>>0}function O_(i){let t=[];for(let e=0;e<i.length;e++){let n=i.charCodeAt(e);t.push(n>>8,n&255)}return t}function z_(){let i=Object.keys(Zl).map(tt=>tt.charCodeAt(0)).sort((tt,ft)=>tt-ft),t=[];t.push(jm("#####|#...#|#...#|#...#|#...#|#...#|#####"));let e=new Map;for(let tt of i)e.set(tt,t.length),t.push(jm(Zl[String.fromCharCode(tt)]));let n=t.length,s=new $n,r=new $n;for(let tt of t)r.u32(s.length),s.raw(tt.data);r.u32(s.length);let o=t.filter(tt=>tt.contours>0),a=Math.min(...o.map(tt=>tt.xMin)),l=Math.min(...o.map(tt=>tt.yMin)),c=Math.max(...o.map(tt=>tt.xMax)),h=Math.max(...o.map(tt=>tt.yMax)),u=Math.max(...t.map(tt=>tt.advance)),f=Math.min(...o.map(tt=>tt.advance-tt.xMax)),d=Math.max(...t.map(tt=>tt.points)),g=Math.max(...t.map(tt=>tt.contours)),b=new $n;b.u32(65536).u32(65536).u32(0).u32(1594834165),b.u16(11).u16(1024);let p=3849984e3;b.u32(0).u32(p).u32(0).u32(p),b.i16(a).i16(l).i16(c).i16(h),b.u16(0).u16(8).i16(2).i16(1).i16(0);let m=new $n;m.u32(65536).i16(1024).i16(-128).i16(0).u16(u).i16(0).i16(f).i16(c),m.i16(1).i16(0).i16(0).i16(0).i16(0).i16(0).i16(0).i16(0).u16(n);let v=new $n;v.u32(65536).u16(n).u16(d).u16(g).u16(0).u16(0).u16(2).u16(0).u16(0).u16(0).u16(0).u16(0).u16(0).u16(0).u16(0);let y=new $n;for(let tt of t)y.u16(tt.advance).i16(tt.contours?tt.xMin:0);let _=Math.round(t.reduce((tt,ft)=>tt+ft.advance,0)/n),w=new $n;w.u16(4).i16(_).u16(400).u16(5).u16(0),w.i16(128*4).i16(128*4).i16(0).i16(128).i16(128*4).i16(128*4).i16(0).i16(128*3),w.i16(128).i16(128*3),w.i16(0),w.raw([2,0,5,0,0,0,0,0,0,0]),w.u32(1).u32(0).u32(0).u32(0),w.tag("BLKF"),w.u16(192),w.u16(i[0]).u16(Math.min(65535,i[i.length-1])),w.i16(1024).i16(-128).i16(0),w.u16(1024).u16(128),w.u32(1).u32(0),w.i16(128*5).i16(128*7).u16(0).u16(32).u16(1);let S=[[1,"BlockForge"],[2,"Regular"],[3,"BlockForge Regular 1.0"],[4,"BlockForge Regular"],[5,"Version 1.000"],[6,"BlockForge-Regular"]],A=new $n,R=[];A.u16(0).u16(S.length).u16(6+S.length*12);for(let[tt,ft]of S){let ht=O_(ft);A.u16(3).u16(1).u16(1033).u16(tt).u16(ht.length).u16(R.length),R.push(...ht)}A.raw(R);let P=[];for(let tt of i){let ft=e.get(tt),ht=P[P.length-1];ht&&tt===ht.end+1&&ft===tt+ht.delta?ht.end=tt:P.push({start:tt,end:tt,delta:ft-tt})}P.push({start:65535,end:65535,delta:1});let x=P.length,T=Math.floor(Math.log2(x)),D=2*(1<<T),U=new $n,k=16+x*8;U.u16(4).u16(k).u16(0).u16(x*2).u16(D).u16(T).u16(x*2-D);for(let tt of P)U.u16(tt.end);U.u16(0);for(let tt of P)U.u16(tt.start);for(let tt of P)U.u16(tt.delta+65536&65535);for(let tt=0;tt<x;tt++)U.u16(0);let B=new $n;B.u16(0).u16(1).u16(3).u16(1).u32(12).raw(U.out());let F=new $n;F.u32(196608).u32(0).i16(-128).i16(128).u32(0).u32(0).u32(0).u32(0).u32(0);let I=[["OS/2",w.out()],["cmap",B.out()],["glyf",s.out()],["head",b.out()],["hhea",m.out()],["hmtx",y.out()],["loca",r.out()],["maxp",v.out()],["name",A.out()],["post",F.out()]];I.sort((tt,ft)=>tt[0]<ft[0]?-1:tt[0]>ft[0]?1:0);let N=I.length,z=Math.floor(Math.log2(N)),et=16*(1<<z),ot=12+N*16,bt=[];for(let[,tt]of I)bt.push(ot),ot+=Math.ceil(tt.length/4)*4;let W=new Uint8Array(ot),J=new DataView(W.buffer);J.setUint32(0,65536),J.setUint16(4,N),J.setUint16(6,et),J.setUint16(8,z),J.setUint16(10,N*16-et);let rt=0;return I.forEach(([tt,ft],ht)=>{let Wt=12+ht*16;for(let kt=0;kt<4;kt++)J.setUint8(Wt+kt,tt.charCodeAt(kt));J.setUint32(Wt+4,Qm(ft)),J.setUint32(Wt+8,bt[ht]),J.setUint32(Wt+12,ft.length),W.set(ft,bt[ht]),tt==="head"&&(rt=bt[ht])}),J.setUint32(rt+8,2981146554-Qm(W)>>>0),W.buffer}var Kl=null;function t0(){return Kl||(Kl=new Promise(i=>{let t=()=>i();try{if(typeof FontFace=="undefined"||!document.fonts){t();return}let e=new FontFace("BlockForge",z_(),{style:"normal",weight:"400",display:"block"}),n=setTimeout(t,4e3);e.load().then(s=>{document.fonts.add(s),document.documentElement.classList.add("bf-font-ready")}).catch(s=>{console.warn("[font] pixel font rejected, using fallback",s)}).then(()=>{clearTimeout(n),t()})}catch(e){console.warn("[font] could not build pixel font",e),t()}}),Kl)}function rs(i){let t=0;for(let e of i)t+=B_(e);return t}function He(i,t){return t-rs(i)&1?i+"\u200A":i}var Ue=64,yr=32,Jl={search:xt,missing:xt+1},Ju=xt+2,i0=[-28,-14],s0=[28,-14],H_=[0,-34],G_=32,W_=63,Yu=(i,t)=>G_+i0[0]*i+s0[0]*t,Ku=(i,t,e)=>W_+i0[1]*i+s0[1]*e+H_[1]*t,Zu=(i,t,e)=>-(i+e)*.6124+t*.5;var jl=class{constructor(){this.px=new Uint8ClampedArray(Ue*Ue*4);this.z=new Float32Array(Ue*Ue)}clear(){this.px.fill(0),this.z.fill(-1e9)}put(t,e,n,s){let r=e.tile,o=r[n+3],a=r[n],l=r[n+1],c=r[n+2];if(e.alpha===0)e.mask&&o<128&&e.tint&&(a=a*e.tint[0]/255,l=l*e.tint[1]/255,c=c*e.tint[2]/255),o=255;else{if(e.alpha===1){if(o<128)return;o=255}else if(o===0)return;e.tint&&(a=a*e.tint[0]/255,l=l*e.tint[1]/255,c=c*e.tint[2]/255)}if(s<=this.z[t])return;a*=e.shade,l*=e.shade,c*=e.shade;let h=t*4,u=this.px;if(e.alpha===2){o=Math.max(o,e.minAlpha);let f=o/255,d=u[h+3]/255,g=f+d*(1-f);if(g<=0)return;u[h]=(a*f+u[h]*d*(1-f))/g,u[h+1]=(l*f+u[h+1]*d*(1-f))/g,u[h+2]=(c*f+u[h+2]*d*(1-f))/g,u[h+3]=g*255}else u[h]=a,u[h+1]=l,u[h+2]=c,u[h+3]=255,this.z[t]=s}quad(t,e,n,s,r,o,a,l,c,h,u,f,d,g){let b=Yu(t,n),p=Ku(t,e,n),m=Yu(t+s,n+o)-b,v=Ku(t+s,e+r,n+o)-p,y=Yu(t+a,n+c)-b,_=Ku(t+a,e+l,n+c)-p,w=m*_-y*v;if(Math.abs(w)<1e-6)return;let S=Zu(t,e,n),A=Zu(t+s,e+r,n+o)-S,R=Zu(t+a,e+l,n+c)-S,P=[b,b+m,b+y,b+m+y],x=[p,p+v,p+_,p+v+_],T=Math.max(0,Math.floor(Math.min(...P))),D=Math.min(Ue-1,Math.ceil(Math.max(...P))),U=Math.max(0,Math.floor(Math.min(...x))),k=Math.min(Ue-1,Math.ceil(Math.max(...x))),B=1e-4,F=Math.min(h,u),I=Math.max(h,u),N=Math.min(f,d),z=Math.max(f,d);for(let et=U;et<=k;et++){let nt=et+.5-p;for(let ot=T;ot<=D;ot++){let bt=ot+.5-b,W=(bt*_-nt*y)/w,J=(m*nt-v*bt)/w;if(W<-B||W>=1+B||J<-B||J>=1+B)continue;let rt=Math.floor(h+(u-h)*Math.min(Math.max(W,0),.99999)),tt=Math.floor(f+(d-f)*Math.min(Math.max(J,0),.99999));u<h&&(rt=Math.min(Math.max(rt,F),Math.ceil(I)-1)),d<f&&(tt=Math.min(Math.max(tt,N),Math.ceil(z)-1)),rt=rt<0?0:rt>15?15:rt,tt=tt<0?0:tt>15?15:tt,this.put(et*Ue+ot,g,(tt*16+rt)*4,S+W*A+J*R)}}}sprite(t,e,n,s,r,o){for(let a=0;a<16;a++)for(let l=0;l<16;l++)if(!(o&&!o(l,a)))for(let c=0;c<r;c++)for(let h=0;h<r;h++){let u=n+l*r+h,f=s+a*r+c;u<0||f<0||u>=Ue||f>=Ue||this.put(f*Ue+u,{...e,tile:t},(a*16+l)*4,0)}}};function r0(i){switch(yi[i]){case 1:return ri.grass;case 2:return ri.foliage;case 3:return ri.water;default:return null}}function ju(i){let t=an[i];return t===An.cutout?1:t===An.translucent||t===An.water?2:0}var o0=1,a0=.8,l0=.6;function Cn(i,t,e,n,s={}){var b,p,m;let[r,o,a,l,c,h]=n,u={alpha:ju(t),tint:r0(t),mask:!!ns[t],minAlpha:he[t]?185:0},f=(b=s.top)!=null?b:Ut[t*6+2],d=(p=s.north)!=null?p:Ut[t*6+5],g=(m=s.west)!=null?m:Ut[t*6+1];i.quad(r,l,c,o-r,0,0,0,0,h-c,16*r,16*o,16*c,16*h,{...u,tile:e(f),shade:o0}),i.quad(o,l,c,r-o,0,0,0,a-l,0,16*(1-o),16*(1-r),16*(1-l),16*(1-a),{...u,tile:e(d),shade:a0}),i.quad(r,l,c,0,0,h-c,0,a-l,0,16*c,16*h,16*(1-l),16*(1-a),{...u,tile:e(g),shade:l0})}var ae=1/16,V_=["................","....######......","...#gggggg#.....","..#gwwgggggr....","..#gwggggggr....","..#ggggggggr....","..#ggggggggr....","..#ggggggggr....","...#ggggggr.....","....#rrrrrhh....","..........hHh...","...........hHh..","............hHh.",".............hh.","................","................"],$_={"#":[58,58,64,255],r:[130,130,140,255],g:[150,204,236,200],w:[240,250,255,255],h:[92,62,30,255],H:[140,98,52,255]};function c0(i,t){let e=new Uint8ClampedArray(1024);for(let n=0;n<16;n++)for(let s=0;s<16;s++){let r=t[i[n][s]];if(!r)continue;let o=(n*16+s)*4;e[o]=r[0],e[o+1]=r[1],e[o+2]=r[2],e[o+3]=r[3]}return e}function q_(i,t){let e=16,n=16,s=-1,r=-1;for(let o=0;o<16;o++)for(let a=0;a<16;a++)t&&!t(a,o)||i[(o*16+a)*4+3]>=128&&(e=Math.min(e,a),n=Math.min(n,o),s=Math.max(s,a),r=Math.max(r,o));return s<0?{x0:0,y0:0,x1:15,y1:15}:{x0:e,y0:n,x1:s,y1:r}}function h0(i,t,e){if(i.clear(),t<=0||t>=xt)return;let n=jt[t],s={alpha:ju(t)===0?1:ju(t),tint:r0(t),mask:!1,shade:1,minAlpha:0},r=Ut[t*6+5];switch(n){case j.slab:Cn(i,t,e,[0,1,0,.5,0,1]);return;case j.stairs:Cn(i,t,e,[0,1,0,.5,0,1]),Cn(i,t,e,[0,1,.5,1,.5,1]);return;case j.fence:Cn(i,t,e,[6*ae,10*ae,0,1,0,4*ae]),Cn(i,t,e,[6*ae,10*ae,0,1,12*ae,1]),Cn(i,t,e,[7*ae,9*ae,12*ae,15*ae,4*ae,12*ae]),Cn(i,t,e,[7*ae,9*ae,6*ae,9*ae,4*ae,12*ae]);return;case j.wall:Cn(i,t,e,[4*ae,12*ae,0,1,4*ae,12*ae]),Cn(i,t,e,[5*ae,11*ae,0,14*ae,0,1]);return;case j.layer:Cn(i,t,e,[0,1,0,2*ae,0,1]);return;case j.carpet:Cn(i,t,e,[0,1,0,ae,0,1]);return;case j.trapdoor:Cn(i,t,e,[0,1,0,3*ae,0,1],{north:Ut[t*6+2],west:Ut[t*6+2]});return;case j.chest:Cn(i,t,e,[ae,15*ae,0,14*ae,ae,15*ae]);return;case j.cactus:{let o={alpha:1,tint:null,mask:!1,minAlpha:0};i.quad(0,1,0,1,0,0,0,0,1,0,16,0,16,{...o,tile:e(Ut[t*6+2]),shade:o0}),i.quad(1,1,ae,-1,0,0,0,-1,0,0,16,0,16,{...o,tile:e(Ut[t*6+5]),shade:a0}),i.quad(ae,1,0,0,0,1,0,-1,0,0,16,0,16,{...o,tile:e(Ut[t*6+1]),shade:l0});return}case j.door:{let o=e(Ut[t*6+2]),a=e(Ut[t*6+3]);i.sprite(o,{...s,tile:o,alpha:1},16,0,2),i.sprite(a,{...s,tile:a,alpha:1},16,32,2);return}case j.torch:case j.lantern:{let o=e(r),a=n===j.lantern?(u,f)=>!(u<=5&&f<=5):void 0,l=q_(o,a),c=Math.round((16-(l.x1-l.x0+1))/2)-l.x0,h=Math.round((16-(l.y1-l.y0+1))/2)-l.y0;i.sprite(o,{...s,tile:o,alpha:1},c*4,h*4,4,a);return}case j.rod:{let o=e(r),a=(h,u)=>[o[(u*16+h)*4],o[(u*16+h)*4+1],o[(u*16+h)*4+2],255],l=c0(Array.from({length:16},()=>".".repeat(16)),{}),c=(h,u,f)=>{let d=(u*16+h)*4;l[d]=f[0],l[d+1]=f[1],l[d+2]=f[2],l[d+3]=255};for(let h=0;h<11;h++)c(4+h,11-h,a(7,4)),c(5+h,11-h,a(8,4));for(let h=0;h<4;h++)c(1+h,11+h-1,a(1,1)),c(2+h,12+h-1,a(2,2));i.sprite(l,{...s,tile:l,alpha:1},0,0,4);return}case j.cross:case j.pane:case j.lily:{let o=e(r);i.sprite(o,{...s,tile:o,alpha:n===j.pane&&an[t]===An.translucent?2:1},0,0,4);return}default:Cn(i,t,e,[0,1,0,1,0,1])}}function u0(i,t){let e=new jl;h0(e,i,t);let n=document.createElement("canvas");n.width=Ue,n.height=Ue;let s=n.getContext("2d");if(s){let r=s.createImageData(Ue,Ue);r.data.set(e.px),s.putImageData(r,0,0)}return n}function X_(i){let t=Math.ceil(Ju/yr),e=yr*Ue,n=t*Ue,s=new Uint8ClampedArray(e*n*4),r=new jl,o=l=>{let c=l%yr,h=Math.floor(l/yr);for(let u=0;u<Ue;u++)s.set(r.px.subarray(u*Ue*4,(u+1)*Ue*4),((h*Ue+u)*e+c*Ue)*4)};for(let l=1;l<xt;l++){try{h0(r,l,i)}catch(c){r.clear(),console.warn("[icons] failed",l,c)}o(l)}r.clear();let a=c0(V_,$_);return r.sprite(a,{tile:a,alpha:2,tint:null,mask:!1,shade:1,minAlpha:0},0,0,4),o(Jl.search),r.clear(),Cn(r,1,()=>i(0),[0,1,0,1,0,1]),o(Jl.missing),{data:s,width:e,height:n,cols:yr,rows:t}}function Y_(i,t,e){let s=new ArrayBuffer(122+t*e*4),r=new DataView(s);r.setUint8(0,66),r.setUint8(1,77),r.setUint32(2,s.byteLength,!0),r.setUint32(10,122,!0),r.setUint32(14,108,!0),r.setInt32(18,t,!0),r.setInt32(22,-e,!0),r.setUint16(26,1,!0),r.setUint16(28,32,!0),r.setUint32(30,3,!0),r.setUint32(34,t*e*4,!0),r.setInt32(38,2835,!0),r.setInt32(42,2835,!0),r.setUint32(54,16711680,!0),r.setUint32(58,65280,!0),r.setUint32(62,255,!0),r.setUint32(66,4278190080,!0),r.setUint32(70,1934772034,!0);let o=new Uint8Array(s,122);for(let a=0;a<i.length;a+=4)o[a]=i[a+2],o[a+1]=i[a+1],o[a+2]=i[a],o[a+3]=i[a+3];return s}var e0=null,n0=0;function d0(i){let t=new Uint8ClampedArray(1024);return e=>{var n,s;return(s=(n=i.tiles[e])!=null?n:i.tiles[0])!=null?s:t}}function f0(i,t){let e=++n0,{data:n,width:s,height:r,cols:o,rows:a}=X_(t);i.cols=o;let l=h=>{if(e!==n0){h.startsWith("blob:")&&URL.revokeObjectURL(h);return}let u=e0;if(e0=h.startsWith("blob:")?h:null,i.url=h,document.documentElement.style.setProperty("--bf-icons",`url("${h}")`),u&&u!==h){let f=new Image,d=()=>URL.revokeObjectURL(u);f.onload=d,f.onerror=d,f.src=h,setTimeout(d,3e3)}};document.documentElement.style.setProperty("--bf-icons-size",`${o*100}% ${a*100}%`);let c=()=>{let h=document.createElement("canvas");h.width=s,h.height=r;let u=h.getContext("2d");if(!u)return;let f=u.createImageData(s,r);f.data.set(n),u.putImageData(f,0,0),h.toBlob?h.toBlob(d=>{l(d?URL.createObjectURL(d):h.toDataURL())},"image/png"):l(h.toDataURL()),c=()=>{}};try{let h=URL.createObjectURL(new Blob([Y_(n,s,r)],{type:"image/bmp"}));l(h);let u=new Image;u.onerror=()=>c(),u.src=h}catch{c()}}function p0(i){let t=Math.ceil(Ju/yr),e={url:"",size:Ue,cols:yr,apply(n,s){if(!(s>0&&s<Ju)){n.classList.remove("bf-icon"),n.style.backgroundPosition="",n.removeAttribute("data-icon");return}n.classList.add("bf-icon");let r=e.cols,o=s%r,a=Math.floor(s/r);n.style.backgroundPosition=`${r>1?o*100/(r-1):0}% ${t>1?a*100/(t-1):0}%`,n.setAttribute("data-icon",String(s))}};return f0(e,d0(i)),e}function m0(i,t){f0(i,d0(t))}var K_=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258],Z_=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0],J_=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577],j_=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13],Q_=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];function Ua(i){let t=new Uint16Array(16),e=new Uint16Array(16),n=new Uint16Array(i.length);for(let s=0;s<i.length;s++)t[i[s]]++;t[0]=0;for(let s=1;s<16;s++)e[s]=e[s-1]+t[s-1];for(let s=0;s<i.length;s++)i[s]&&(n[e[i[s]]++]=s);return{counts:t,symbols:n}}var Qu=null;function tx(){if(!Qu){let i=new Uint8Array(288);for(let e=0;e<288;e++)i[e]=e<144?8:e<256?9:e<280?7:8;let t=new Uint8Array(30).fill(5);Qu={lit:Ua(i),dist:Ua(t)}}return Qu}function g0(i,t=0){let e=0,n=0,s=0,r=new Uint8Array(Math.max(64,t)),o=0,a=f=>{if(o+f<=r.length)return;let d=new Uint8Array(Math.max(r.length*2,o+f));d.set(r.subarray(0,o)),r=d},l=f=>{for(;s<f;){if(e>=i.length)throw new Error("Damaged zip data (ended early).");n|=i[e++]<<s,s+=8}let d=n&(1<<f)-1;return n>>>=f,s-=f,d},c=f=>{let d=0,g=0,b=0;for(let p=1;p<16;p++){d|=l(1);let m=f.counts[p];if(d-m<g)return f.symbols[b+(d-g)];b+=m,g=g+m<<1,d<<=1}throw new Error("Damaged zip data (bad code).")},h=(f,d)=>{for(;;){let g=c(f);if(g<256){a(1),r[o++]=g;continue}if(g===256)return;if(g-=257,g>=29)throw new Error("Damaged zip data (bad length).");let b=K_[g]+l(Z_[g]),p=c(d);if(p>=30)throw new Error("Damaged zip data (bad distance).");let m=J_[p]+l(j_[p]);if(m>o)throw new Error("Damaged zip data (distance too far).");a(b);for(let v=0;v<b;v++,o++)r[o]=r[o-m]}},u=0;do{u=l(1);let f=l(2);if(f===0){if(n=0,s=0,e+4>i.length)throw new Error("Damaged zip data (stored block).");let d=i[e]|i[e+1]<<8;if(e+=4,e+d>i.length)throw new Error("Damaged zip data (stored block).");a(d),r.set(i.subarray(e,e+d),o),e+=d,o+=d}else if(f===1){let d=tx();h(d.lit,d.dist)}else if(f===2){let d=l(5)+257,g=l(5)+1,b=l(4)+4;if(d>286||g>30)throw new Error("Damaged zip data (table size).");let p=new Uint8Array(19);for(let _=0;_<b;_++)p[Q_[_]]=l(3);let m=Ua(p),v=new Uint8Array(d+g),y=0;for(;y<d+g;){let _=c(m);if(_<16){v[y++]=_;continue}let w=0,S;if(_===16){if(y===0)throw new Error("Damaged zip data (repeat with nothing before).");w=v[y-1],S=3+l(2)}else _===17?S=3+l(3):S=11+l(7);if(y+S>d+g)throw new Error("Damaged zip data (too many lengths).");for(;S--;)v[y++]=w}h(Ua(v.subarray(0,d)),Ua(v.subarray(d)))}else throw new Error("Damaged zip data (block type).")}while(!u);return o===r.length?r:r.slice(0,o)}var b0="assets/minecraft/textures/block/",y0={grass_side_snowy:["grass_block_snow"],path_top:["dirt_path_top","grass_path_top"],path_side:["dirt_path_side","grass_path_side"],moss:["moss_block"],amethyst:["amethyst_block"],bone_top:["bone_block_top"],bone_side:["bone_block_side"],dripstone:["dripstone_block"],purpur:["purpur_block"],quartz_top:["quartz_block_top"],quartz_side:["quartz_block_side"],chiseled_quartz:["chiseled_quartz_block"],chiseled_quartz_top:["chiseled_quartz_block_top"],froglight_ochre:["ochre_froglight_side"],froglight_ochre_top:["ochre_froglight_top"],froglight_verdant:["verdant_froglight_side"],froglight_verdant_top:["verdant_froglight_top"],froglight_pearl:["pearlescent_froglight_side"],froglight_pearl_top:["pearlescent_froglight_top"],hay_top:["hay_block_top"],hay_side:["hay_block_side"],slime:["slime_block"],honey:["honey_block_side","honey_block_top"],honeycomb:["honeycomb_block"],kelp_top:["dried_kelp_top"],kelp_side:["dried_kelp_side"],mushroom_brown:["brown_mushroom_block"],mushroom_red:["red_mushroom_block"],tall_grass:["short_grass","grass"],water:["water_still"],lava:["lava_still"],mangrove_sapling:["mangrove_propagule"],ore_nether_gold:["nether_gold_ore"],ore_nether_quartz:["nether_quartz_ore"]},ex=new Set(["missing","lantern","soul_lantern","end_rod","chest_top","chest_side","chest_front","embers"]);function nx(i){if(ex.has(i))return[];if(y0[i])return y0[i];let t;if(t=i.match(/^ore_stone_(.+)$/))return[`${t[1]}_ore`];if(t=i.match(/^ore_deepslate_(.+)$/))return[`deepslate_${t[1]}_ore`];if((t=i.match(/^(wool|concrete|powder|terracotta|glazed|stained_glass)_(.+)$/))&&Bi.includes(t[2])){let e=t[2];switch(t[1]){case"wool":return[`${e}_wool`];case"concrete":return[`${e}_concrete`];case"powder":return[`${e}_concrete_powder`];case"terracotta":return[`${e}_terracotta`];case"glazed":return[`${e}_glazed_terracotta`];case"stained_glass":return[`${e}_stained_glass`]}}return(t=i.match(/^flower_(.+)$/))?[t[1]]:[i]}var ix={spruce_leaves:[97,153,97],birch_leaves:[128,167,85],sugar_cane:[145,189,89]};function sx(i){let t=new DataView(i),e=-1;for(let a=i.byteLength-22;a>=Math.max(0,i.byteLength-22-65535);a--)if(t.getUint32(a,!0)===101010256){e=a;break}if(e<0)throw new Error("That file is not a zip archive.");let n=t.getUint16(e+10,!0),s=t.getUint32(e+16,!0),r=new TextDecoder,o=[];for(let a=0;a<n&&s+46<=i.byteLength&&t.getUint32(s,!0)===33639248;a++){let l=t.getUint16(s+10,!0),c=t.getUint32(s+20,!0),h=t.getUint32(s+24,!0),u=t.getUint16(s+28,!0),f=t.getUint16(s+30,!0),d=t.getUint16(s+32,!0),g=t.getUint32(s+42,!0),b=r.decode(new Uint8Array(i,s+46,u));o.push({name:b,method:l,compSize:c,size:h,offset:g}),s+=46+u+f+d}return o}async function rx(i,t){let e=new DataView(i);if(e.getUint32(t.offset,!0)!==67324752)throw new Error("Damaged zip entry: "+t.name);let n=t.offset+30+e.getUint16(t.offset+26,!0)+e.getUint16(t.offset+28,!0),s=new Uint8Array(i,n,t.compSize);if(t.method===0)return s.slice();if(t.method!==8)throw new Error("Unsupported compression in "+t.name);if(v0)try{let r=new DecompressionStream("deflate-raw"),o=new Blob([s]).stream().pipeThrough(r);return new Uint8Array(await new Response(o).arrayBuffer())}catch{v0=!1}return g0(s,t.size)}var v0=typeof DecompressionStream!="undefined",Da=null,_0=null,Ql=typeof createImageBitmap=="function"?"options":"none";async function ox(i){let t=new Blob([i],{type:"image/png"});for(;Ql!=="none";)try{let s=Ql==="options"?await createImageBitmap(t,{premultiplyAlpha:"none",colorSpaceConversion:"none"}):await createImageBitmap(t);return{src:s,width:s.width,height:s.height,free:()=>s.close()}}catch(s){if(!(s instanceof TypeError))break;Ql=Ql==="options"?"plain":"none"}let e=URL.createObjectURL(t),n=new Image;try{n.src=e;try{await n.decode()}catch{n.complete&&n.naturalWidth||await new Promise((s,r)=>{if(n.complete){n.naturalWidth?s():r(new Error("bad png"));return}n.onload=()=>s(),n.onerror=()=>r(new Error("bad png"))})}return{src:n,width:n.naturalWidth,height:n.naturalHeight,free:()=>URL.revokeObjectURL(e)}}catch{return URL.revokeObjectURL(e),null}}async function ax(i){let t=await ox(i);if(!t||!t.width||!t.height)return t==null||t.free(),null;let e=t.width,n=Math.min(t.width,t.height);Da||(Da=document.createElement("canvas"),Da.width=Da.height=16,_0=Da.getContext("2d",{willReadFrequently:!0}));let s=_0;return s.clearRect(0,0,16,16),s.imageSmoothingEnabled=n>16,n>16&&(s.imageSmoothingQuality="high"),s.drawImage(t.src,0,0,Math.min(e,n),n,0,0,16,16),t.free(),s.getImageData(0,0,16,16).data}function lx(i){let t=i.slice();for(let e=3;e<t.length;e+=4)t[e]=0;return t}function cx(i,t){let e=i.slice();for(let n=0;n<256;n++){let s=n*4;e[s+3]=255,t&&t[s+3]>40&&(e[s]=t[s],e[s+1]=t[s+1],e[s+2]=t[s+2],e[s+3]=0)}return e}function hx(i){let t=i.slice(),e=0,n=0,s=0,r=0;for(let o=0;o<t.length;o+=4)t[o+3]>=128&&(e+=t[o],n+=t[o+1],s+=t[o+2],r++);if(!r)return t;e=e/r*.55,n=n/r*.55,s=s/r*.55;for(let o=0;o<t.length;o+=4)t[o+3]<128&&(t[o]=e,t[o+1]=n,t[o+2]=s);return t}function ux(i){let t=i.slice(),e=0;for(let s=0;s<256;s++)e+=(i[s*4]+i[s*4+1]+i[s*4+2])/3;let n=e/256;for(let s=0;s<256;s++){let r=s*4,o=(i[r]+i[r+1]+i[r+2])/3,a=Math.max(0,Math.min(255,190+(o-n)*.45));t[r]=t[r+1]=t[r+2]=a,t[r+3]=200}return t}function dx(i,t){let e=i.slice();for(let n=0;n<e.length;n+=4)e[n]=e[n]*t[0]/255,e[n+1]=e[n+1]*t[1]/255,e[n+2]=e[n+2]*t[2]/255;return e}async function x0(i,t,e){let n=await i.arrayBuffer(),s=sx(n),r=new Map,o="";for(let d of s){let g=d.name.indexOf(b0);g<0||!d.name.endsWith(".png")||(o||(o=d.name.slice(0,g)),r.set(d.name.slice(g+b0.length,-4),d))}if(!r.size)throw s.some(d=>/(^|\/)manifest\.json$/.test(d.name))&&s.some(d=>d.name.includes("textures/blocks/"))?new Error("That is a Bedrock pack. BlockForge reads Java Edition resource packs (.zip)."):new Error("No block textures found. Pick a resource pack zip with assets/minecraft/textures/block in it.");let a=new Map,l=async d=>{if(a.has(d))return a.get(d);let g=r.get(d),b=g?await ax(await rx(n,g)):null;return a.set(d,b),b},c=new Map,h=Ni,u=0;for(let d of h){u++,u%16===0&&(e==null||e(u,h.length));try{if(d==="grass_top"){let g=await l("grass_block_top");g&&c.set(d,lx(g));continue}if(d==="grass_side"){let g=await l("grass_block_side");g&&c.set(d,cx(g,await l("grass_block_side_overlay")));continue}for(let g of nx(d)){let b=await l(g);if(!b)continue;let p=ix[d];p&&(b=dx(b,p)),d.endsWith("_leaves")&&(b=hx(b)),d==="water"&&(b=ux(b)),c.set(d,b);break}}catch(g){console.warn("[packs] skipped",d,g)}}if(e==null||e(h.length,h.length),!c.size)throw new Error("None of the textures in that pack match BlockForge blocks.");let f=t.replace(/\.(zip|mcpack)$/i,"").trim()||"Imported Pack";return{name:f.length>32?f.slice(0,31)+"\u2026":f,tiles:c}}var fx="blockforge-packs",vr="packs",td="custom";function ed(){return new Promise((i,t)=>{let e=indexedDB.open(fx,1);e.onupgradeneeded=()=>{e.result.createObjectStore(vr)},e.onsuccess=()=>i(e.result),e.onerror=()=>t(e.error),e.onblocked=()=>t(new Error("pack storage is blocked by another tab"))})}async function w0(i){var n,s;let t=await ed(),e={};for(let[r,o]of i.tiles)e[r]=o.slice().buffer;await new Promise((r,o)=>{let a=t.transaction(vr,"readwrite");a.objectStore(vr).put({name:i.name,tiles:e},td),a.oncomplete=()=>r(),a.onerror=()=>o(a.error),a.onabort=()=>{var l;return o((l=a.error)!=null?l:new Error("saving the pack was aborted"))}}).finally(()=>t.close());try{(s=(n=navigator.storage)==null?void 0:n.persist)==null||s.call(n).catch(()=>{})}catch{}}async function M0(){let i=await ed(),t=await new Promise((n,s)=>{let r=i.transaction(vr,"readonly").objectStore(vr).get(td);r.onsuccess=()=>n(r.result),r.onerror=()=>s(r.error)}).finally(()=>i.close());if(!t||!t.tiles)return null;let e=new Map;for(let[n,s]of Object.entries(t.tiles))s&&s.byteLength===1024&&e.set(n,new Uint8ClampedArray(s));return e.size?{name:t.name,tiles:e}:null}async function S0(){try{let i=await ed();await new Promise(t=>{let e=i.transaction(vr,"readwrite");e.objectStore(vr).delete(td),e.oncomplete=()=>t(),e.onerror=()=>t()}),i.close()}catch{}}var ec=[{id:"forward",label:"Walk Forward",group:"Movement",def:"KeyW"},{id:"back",label:"Walk Backward",group:"Movement",def:"KeyS"},{id:"left",label:"Strafe Left",group:"Movement",def:"KeyA"},{id:"right",label:"Strafe Right",group:"Movement",def:"KeyD"},{id:"jump",label:"Jump / Fly Up",group:"Movement",def:"Space"},{id:"sneak",label:"Sneak / Fly Down",group:"Movement",def:"ShiftLeft"},{id:"sprint",label:"Sprint",group:"Movement",def:"ControlLeft"},{id:"attack",label:"Break Block",group:"Gameplay",def:"Mouse0"},{id:"use",label:"Place / Use",group:"Gameplay",def:"Mouse2"},{id:"pick",label:"Pick Block",group:"Gameplay",def:"Mouse1"},{id:"inventory",label:"Inventory",group:"Gameplay",def:"KeyE"},{id:"hideHud",label:"Hide HUD",group:"Interface",def:"F1"},{id:"screenshot",label:"Screenshot",group:"Interface",def:"F2"},{id:"debug",label:"Debug Screen",group:"Interface",def:"F3"},...[1,2,3,4,5,6,7,8,9].map(i=>({id:`hotbar${i}`,label:`Hotbar Slot ${i}`,group:"Hotbar",def:`Digit${i}`}))],E0=Object.fromEntries(ec.map(i=>[i.id,i.def])),nc=["hotbar1","hotbar2","hotbar3","hotbar4","hotbar5","hotbar6","hotbar7","hotbar8","hotbar9"],tc=null;function nd(i){(!i.keybinds||typeof i.keybinds!="object")&&(i.keybinds={}),tc=i}function Os(i){return tc&&tc.keybinds&&tc.keybinds[i]||E0[i]}function os(i,t){let e=Os(i);return e===t||e==="ShiftLeft"&&t==="ShiftRight"||e==="ControlLeft"&&t==="ControlRight"}function id(i,t,e){nd(i),e===E0[t]?delete i.keybinds[t]:i.keybinds[t]=e}function T0(i){i.keybinds={}}function k0(){var e;let i=new Map;for(let n of ec){let s=Os(n.id),r=(e=i.get(s))!=null?e:[];r.push(n.id),i.set(s,r)}let t=new Set;for(let n of i.values())if(n.length>1)for(let s of n)t.add(s);return t}var C0=new Set(["Escape","MetaLeft","MetaRight","OSLeft","OSRight","ContextMenu"]),A0={Space:"Space",ShiftLeft:"Left Shift",ShiftRight:"Right Shift",ControlLeft:"Left Ctrl",ControlRight:"Right Ctrl",AltLeft:"Left Alt",AltRight:"Right Alt",Enter:"Enter",Tab:"Tab",Backspace:"Backspace",CapsLock:"Caps Lock",ArrowUp:"Up",ArrowDown:"Down",ArrowLeft:"Left",ArrowRight:"Right",Backquote:"`",Minus:"-",Equal:"=",BracketLeft:"[",BracketRight:"]",Backslash:"\\",Semicolon:";",Quote:"'",Comma:",",Period:".",Slash:"/",Insert:"Insert",Delete:"Delete",Home:"Home",End:"End",PageUp:"Page Up",PageDown:"Page Down",Mouse0:"Left Click",Mouse1:"Middle Click",Mouse2:"Right Click",Mouse3:"Mouse Back",Mouse4:"Mouse Forward"};function sd(i){if(A0[i])return A0[i];let t;return(t=i.match(/^Key([A-Z])$/))||(t=i.match(/^Digit(\d)$/))?t[1]:(t=i.match(/^Numpad(.+)$/))?"Num "+t[1]:(t=i.match(/^Mouse(\d+)$/))?"Mouse "+(Number(t[1])+1):i}var px=["options","controls","shaders","packs"];function Hi(i,t,e,n){let s=document.createElement(i);return t&&(s.className=t),n!==void 0&&(s.textContent=n),e&&e.appendChild(s),s}var St=(i,t,e)=>Hi("div",i,t,e);function vt(i,t,e,n,s){i.style.left=Qt(t),i.style.top=Qt(e),n!==void 0&&(i.style.width=Qt(n)),s!==void 0&&(i.style.height=Qt(s))}function Na(i,t){let e=[];for(let n of i.split(`
`)){let s="";for(let r of n.split(" ")){let o=s?s+" "+r:r;s&&rs(o)-1>t?(e.push(s),s=r):s=o}e.push(s)}return e}function vi(i,t){if(rs(i)-1<=t)return i;let e=i;for(;e.length>1&&rs(e+"...")-1>t;)e=e.slice(0,-1);return e.trimEnd()+"..."}function _i(i,t,e,n=""){let s=St("bf-h1 "+n,i);return s.textContent=He(t,0),s.style.top=Qt(e-1),s}function le(i,t,e,n,s){let r=Hi("button","bf-btn",i);r.type="button",r.style.width=Qt(e);let o={el:r,w:e,set(a){let l=He(a,e);r.textContent!==l&&(r.textContent=l)},enable(a){r.disabled=!a}};return o.set(t),s&&(r.dataset.tip=s),r.addEventListener("click",a=>{a.preventDefault(),r.disabled||n()}),o}function mx(i,t,e,n){let s=Hi("a","bf-btn",i);return s.href=n,s.setAttribute("download","blockforge.html"),s.style.width=Qt(e),s.textContent=He(t,e),{el:s,w:e,set(r){s.textContent=He(r,e)},enable(){}}}function gx(i,t,e,n,s,r,o,a,l){let c=St("bf-slider",i);c.tabIndex=0,c.style.width=Qt(t),St("bf-track",c);let h=St("bf-knob",c),u=St("bf-lbl",c);l&&(c.dataset.tip=l);let f=p=>Math.max(e,Math.min(n,Math.round((p-e)/s)*s+e)),d=()=>{let p=r(),m=(Math.max(e,Math.min(n,p))-e)/(n-e||1);h.style.left=Qt(Math.round(m*(t-8))),u.textContent=He(a(p),t)},g=p=>{let m=c.getBoundingClientRect(),v=kn().u,y=(p-m.left-4*v)/(m.width-8*v),_=f(e+Math.max(0,Math.min(1,y))*(n-e));_!==r()&&(o(_),d())};c.addEventListener("pointerdown",p=>{if(p.button===0){p.preventDefault(),p.stopPropagation(),c.focus({preventScroll:!0}),c.classList.add("bf-drag");try{c.setPointerCapture(p.pointerId)}catch{}g(p.clientX)}}),c.addEventListener("pointermove",p=>{c.classList.contains("bf-drag")&&g(p.clientX)});let b=()=>c.classList.remove("bf-drag");return c.addEventListener("pointerup",b),c.addEventListener("pointercancel",b),c.addEventListener("keydown",p=>{let m=p.key==="ArrowLeft"||p.key==="ArrowDown"?-1:p.key==="ArrowRight"||p.key==="ArrowUp"?1:0;if(!m)return;p.preventDefault(),p.stopPropagation();let v=f(r()+m*s);v!==r()&&(o(v),d())}),d(),{el:c,refresh:d}}var bo=class{constructor(t,e){this.top=0;this.height=0;this.content=0;this.scroll=0;this.acc=0;this.dragThumb=null;this.touch=null;this.swallowClick=!1;this.el=St("bf-list"+(e?" bf-sunk":""),t),this.inner=St("bf-list-in",this.el),e&&(St("bf-shade-t",this.el),St("bf-shade-b",this.el)),this.bar=St("bf-sbar",this.el),this.thumb=St("bf-thumb",this.bar),this.el.addEventListener("wheel",s=>{s.preventDefault();let r=s.deltaMode===1?s.deltaY*33:s.deltaMode===2?s.deltaY*300:s.deltaY;this.acc+=r*.2;let o=Math.trunc(this.acc);o&&(this.acc-=o,this.scrollTo(this.scroll+o))},{passive:!1}),this.thumb.addEventListener("pointerdown",s=>{s.preventDefault(),s.stopPropagation(),this.dragThumb={y:s.clientY,s:this.scroll};try{this.thumb.setPointerCapture(s.pointerId)}catch{}}),this.thumb.addEventListener("pointermove",s=>{if(!this.dragThumb)return;let r=kn().u,o=this.height-this.thumbH(),a=Math.max(0,this.content-this.height);o>0&&this.scrollTo(this.dragThumb.s+(s.clientY-this.dragThumb.y)/r*(a/o))}),this.thumb.addEventListener("pointerup",()=>{this.dragThumb=null}),this.bar.addEventListener("pointerdown",s=>{if(s.target!==this.bar)return;let r=this.bar.getBoundingClientRect(),o=(s.clientY-r.top)/r.height;this.scrollTo(o*(this.content-this.height))}),this.el.addEventListener("pointerdown",s=>{this.swallowClick=!1,s.pointerType!=="mouse"&&(this.touch={id:s.pointerId,y:s.clientY,s:this.scroll,moved:!1})},!0),this.el.addEventListener("pointermove",s=>{let r=this.touch;if(!r||r.id!==s.pointerId)return;let o=kn().u;Math.abs(s.clientY-r.y)>6*o&&(r.moved=!0),r.moved&&this.scrollTo(r.s-(s.clientY-r.y)/o)},!0);let n=()=>{var s;(s=this.touch)!=null&&s.moved&&(this.swallowClick=!0),this.touch=null};this.el.addEventListener("pointerup",n,!0),this.el.addEventListener("pointercancel",n,!0),this.el.addEventListener("click",s=>{this.swallowClick&&(s.stopPropagation(),s.preventDefault(),this.swallowClick=!1)},!0),this.el.addEventListener("focusin",s=>{var l,c;let r=s.target,o=parseFloat((l=r.dataset.y)!=null?l:"NaN"),a=parseFloat((c=r.dataset.h)!=null?c:"20");Number.isNaN(o)||this.ensureVisible(o,a)})}place(t,e,n,s){this.top=e,this.height=Math.max(20,n),vt(this.el,0,e,t.gw,this.height),vt(this.bar,s,0,6,this.height),this.scrollTo(this.scroll)}setContent(t){this.content=t,this.scrollTo(this.scroll)}thumbH(){return Math.max(32,Math.min(this.height-8,Math.round(this.height*this.height/Math.max(1,this.content))))}scrollTo(t){let e=Math.max(0,this.content-this.height);if(this.scroll=Math.max(0,Math.min(e,Math.round(t))),this.inner.style.top=Qt(-this.scroll),this.bar.classList.toggle("bf-none",e<=0),e>0){let n=this.thumbH();vt(this.thumb,0,Math.round((this.height-n)*this.scroll/e),6,n)}}ensureVisible(t,e){t<this.scroll?this.scrollTo(t-4):t+e>this.scroll+this.height&&this.scrollTo(t+e-this.height+4)}get scrollTop(){return this.scroll}get offsetTop(){return this.top}},ld=class{constructor(t,e,n,s=()=>{}){this.name=e;this.layout=s;this.root=St("bf-screen",t),this.root.style.display="none",this.bg=St("bf-full "+n,this.root),this.bg.style.position="absolute",this.gui=St("bf-gui",this.root),this.gui.style.position="absolute"}setBg(t){this.bg.className="bf-full "+t,this.bg.style.position="absolute"}},lc=new Map;function R0(i){for(let t of Array.from(lc.keys()))t.startsWith(i+":")&&lc.delete(t)}function cd(i,t){let e=t+":"+i,n=lc.get(e);if(n===void 0){try{n=u0(i,s=>Gl(s,t)).toDataURL()}catch{n=""}lc.set(e,n)}return n}var ic=["grass_block","oak_log","cherry_leaves","sand","snowy_grass_block","stone_bricks","birch_log","mossy_cobblestone","spruce_planks","podzol"];function bx(i,t){var n;let e=ic[((i|0)%ic.length+ic.length)%ic.length];return cd((n=yt[e])!=null?n:yt.grass_block,t)}var sc=["grass_block","oak_planks","stone_bricks","oak_leaves","bricks","diamond_ore","poppy"],yx={B:["#####.","##..##","##..##","#####.","##..##","##..##","#####."],L:["##....","##....","##....","##....","##....","##....","######"],O:[".####.","##..##","##..##","##..##","##..##","##..##",".####."],C:[".#####","##....","##....","##....","##....","##....",".#####"],K:["##..##","##.##.","####..","###...","####..","##.##.","##..##"],F:["######","##....","##....","#####.","##....","##....","##...."],R:["#####.","##..##","##..##","#####.","##.##.","##..##","##..##"],G:[".#####","##....","##....","##.###","##..##","##..##",".#####"],E:["######","##....","##....","#####.","##....","##....","######"]},hd="BLOCKFORGE",zs=8,cc=10,Qe=(hd.length*7-1)*zs+cc+4,zi=7*zs+cc+4,rc=null;function vx(i){if(rc&&rc.pack===i)return rc.url;let t="";try{let e=document.createElement("canvas");e.width=Qe,e.height=zi;let n=e.getContext("2d"),s=n.createImageData(Qe,zi),r=s.data,o=ss("stone_bricks",i),a=ss("cobblestone",i),l=ss("gold_block",i),c=ss("magma",i),h=new Uint8Array(Qe*zi),u=new Int8Array(Qe*zi).fill(-1),f=2;for(let p=0;p<hd.length;p++){let m=yx[hd[p]];for(let v=0;v<7;v++)for(let y=0;y<6;y++)if(m[v][y]==="#")for(let _=0;_<zs;_++)for(let w=0;w<zs;w++){let S=f+y*zs+w,A=2+v*zs+_;u[A*Qe+S]=p;for(let R=1;R<=cc;R++)h[(A+R)*Qe+S+(R>>2)]=1}f+=7*zs}let d=(p,m,v,y)=>{r[p*4]=m,r[p*4+1]=v,r[p*4+2]=y,r[p*4+3]=255},g=(p,m,v)=>((v&15)*16+(m&15))*4;for(let p=0;p<zi;p++)for(let m=0;m<Qe;m++){let v=p*Qe+m,y=u[v];if(y>=0){let _=y>=5,w=_?((m>>3)+(p>>3))%5===0?c:l:(m>>4)+(p>>4)&1?a:o,S=g(w,m,p),A=p>0?u[v-Qe]:-1,R=p<zi-1?u[v+Qe]:-1,P=m>0?u[v-1]:-1,x=1;A<0||P<0?x=1.28:R<0&&(x=.82);let T=w[S]*x,D=w[S+1]*x,U=w[S+2]*x;_&&(T=T*1.05+10,D=D*.82,U=U*.55),d(v,Math.min(255,T),Math.min(255,D),Math.min(255,U))}else if(h[v]){let _=0;for(;_<cc&&p-_-1>=0&&u[(p-_-1)*Qe+m-(_+1>>2)]<0;)_++;let w=m<5*7*zs?o:l,S=g(w,m,p),A=.36-_*.012;d(v,w[S]*A+6,w[S+1]*A+4,w[S+2]*A+4)}}let b=new Uint8Array(Qe*zi);for(let p=0;p<b.length;p++)b[p]=r[p*4+3]?1:0;for(let p=0;p<zi;p++)for(let m=0;m<Qe;m++){let v=p*Qe+m;if(b[v])continue;(m>0&&b[v-1]||m<Qe-1&&b[v+1]||p>0&&b[v-Qe]||p<zi-1&&b[v+Qe])&&(r[v*4]=12,r[v*4+1]=10,r[v*4+2]=10,r[v*4+3]=255)}n.putImageData(s,0,0),t=e.toDataURL()}catch{t=""}return rc={pack:i,url:t},t}var oi=1024,_r=256,oc=null;function _x(i){if(oc&&oc.pack===i)return oc.url;let t="";try{let e=document.createElement("canvas");e.width=oi,e.height=_r;let n=e.getContext("2d"),s=n.createImageData(oi,_r),r=s.data,o=(U,k,B,F,I,N=255)=>{if(k<0||k>=_r)return;let z=(k*oi+(U%oi+oi)%oi)*4,et=N/255;r[z]=r[z]*(1-et)+B*et,r[z+1]=r[z+1]*(1-et)+F*et,r[z+2]=r[z+2]*(1-et)+I*et,r[z+3]=255};for(let U=0;U<_r;U++){let k=U/_r,B=104+k*110,F=160+k*70,I=236+k*14;for(let N=0;N<oi;N++)o(N,U,B,F,I)}let a=(U,k)=>k.reduce((B,[F,I,N])=>B+F*Math.sin(U/oi*Math.PI*2*I+N),0),l=[[118,[150,176,206],[[22,3,.4],[10,7,1.3],[6,13,2.1]]],[138,[116,146,170],[[18,2,2.2],[9,5,.3],[5,11,4]]]];for(let[U,k,B]of l)for(let F=0;F<oi;F+=4){let I=Math.round((U-a(F,B))/4)*4;for(let N=I;N<_r;N++)for(let z=0;z<4;z++)o(F+z,N,k[0],k[1],k[2])}for(let U=0;U<9;U++){let k=(U*113+37)%oi,B=18+U*53%46,F=40+U*29%50;for(let I=0;I<8;I++)for(let N=0;N<F;N++)I<4&&(N<8||N>F-12)||I>5&&N>F-20||o(k+N,B+I,255,255,255,215)}let c=U=>ss(U,i),h=c("grass_side"),u=c("dirt"),f=c("stone"),d=c("sand"),g=c("water"),b=c("oak_log"),p=c("oak_leaves"),m=c("birch_log"),v=c("ore_stone_coal"),y=c("flower_poppy"),_=c("flower_dandelion"),w=c("tall_grass"),S=[123,189,86],A=[95,171,54],R=[63,118,228],P=(U,k,B,F,I=!1,N=1,z=!1)=>{for(let et=0;et<16;et++)for(let nt=0;nt<16;nt++){let ot=(et*16+nt)*4,bt=U[ot],W=U[ot+1],J=U[ot+2],rt=U[ot+3];z&&rt<128||(F&&(!I||rt<128)&&(bt=bt*F[0]/255,W=W*F[1]/255,J=J*F[2]/255),o(k+nt,B+et,bt,W,J,Math.round(N*(z?255:N<1?Math.max(rt,150):255))))}},x=12,T=oi/16,D=[];for(let U=0;U<T;U++){let k=11-a(U*16,[[2.2,2,.7],[1.4,5,2.4],[.8,9,.2]]);D.push(Math.round(k))}for(let U=0;U<T;U++){let k=D[U],B=U*16,F=k>=x-1;for(let I=k;I<16;I++){let N=I*16;I===k?P(F?d:h,B,N,F?void 0:S,!0):I<k+3?P(F?d:u,B,N):P((U*7+I*3)%11===0?v:f,B,N)}for(let I=x;I<k;I++)P(g,B,I*16,R,!1,.75);if(!F&&U%9===3){let I=U%2?m:b;for(let N=1;N<=4;N++)P(I,B,(k-N)*16);for(let N=-2;N<=2;N++)for(let z=3;z<=6;z++)Math.abs(N)===2&&(z===6||z===3)||z===6&&Math.abs(N)===1&&U%3===0||N===0&&z<5||P(p,B+N*16,(k-z)*16,A,!1,1,!0)}else!F&&U*5%7===1&&P(U%3?w:U%2?y:_,B,(k-1)*16,U%3?S:void 0,!1,1,!0)}n.putImageData(s,0,0),t=e.toDataURL()}catch{t=""}return oc={pack:i,url:t},t}var ac=[`${xt-1} blocks!`,"Made of 16x16 pixels!","Runs in a browser tab!","Infinite worlds!","Double-tap W to sprint!","Visit a cherry grove!","Every texture drawn by code!","No downloads needed!","Works offline too!","Build a castle!","Mind the Ctrl+W!","Cubes all the way down!","Fly with a double-tap!","Lava + water = obsidian!","Press F3 for numbers!","Square sun, square moon!","Forged in TypeScript!","Sixty frames, hopefully!","Snowy peaks!","Built for Chromebooks!","Plant a flower!","Glass panes connect!","Pixel perfect!","Hello, builder!","Fancy leaves!","Stairs face you!","Try a sunset!","Shift-click to the hotbar!","Seeds can be words!","Watch the clouds!"],P0=["Double-tap Space to start or stop flying.","Middle-click a block to put it in your hotbar.","Press E for the creative inventory. Type to search.","Double-tap W to sprint without touching Ctrl.","Press F1 to hide the HUD for screenshots, F2 to take one.","Press F3 to see coordinates, chunk and GPU info.","Shift-click an item to send it to your hotbar.","Pick a time of day from the pause menu.","Worlds are saved in this browser automatically.","Low graphics runs best on school laptops and Chromebooks."],xx={cycle:"Day Cycle",sunrise:"Sunrise",noon:"Noon",sunset:"Sunset",midnight:"Midnight"},rd=["cycle","sunrise","noon","sunset","midnight"],wx={low:"Low",medium:"Medium",high:"High",custom:"Custom"},od={off:"Off",fancy:"Fancy",ultra:"Ultra"},ad=["off","fancy","ultra"],Mx=[{id:"off",desc:"Fastest, for school laptops and Chromebooks."},{id:"fancy",desc:"Sun shadows, waving plants, reflective water."},{id:"ultra",desc:"Adds bloom, god rays, fog and mirror water. Needs a strong graphics chip."}];function Sx(i){for(let t of["low","medium","high"]){let e=vu[t];if(Object.keys(e).every(n=>i[n]===e[n]))return t}return"custom"}var Ax=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];function L0(i){if(!i)return"never";let t=new Date(i),e=new Date,n=`${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")}`,s=o=>new Date(o.getFullYear(),o.getMonth(),o.getDate()).getTime(),r=Math.round((s(e)-s(t))/864e5);return r===0?`today, ${n}`:r===1?`yesterday, ${n}`:`${t.getDate()} ${Ax[t.getMonth()]} ${t.getFullYear()}, ${n}`}function Ex(){try{return matchMedia("(pointer: coarse)").matches&&!matchMedia("(any-pointer: fine)").matches&&(navigator.maxTouchPoints||0)>0}catch{return!1}}var Tx=[["Pause menu","Esc"],["Toggle flying","Jump x2"],["Sprint","Forward x2"],["Next / previous slot","Mouse Wheel"],["Item to hotbar (inventory)","Shift+Click"],["Search blocks (inventory)","T"]],kx=[["Move (push far to sprint)","Left stick"],["Look around","Drag right"],["Jump, x2 to fly","Jump"],["Sneak, fly down","Sneak"],["Break block (hold)","Break"],["Place block, use","Place"],["Pick block","Pick"],["Change slot","Tap hotbar"],["Inventory","Grid button"],["Pause","Pause button"]],hc=class{constructor(t,e,n){this.handlers=e;this.settings=n;this.screens=new Map;this.cur=null;this.optionsBack=()=>{};this.overGame=!1;this.controlsBack=()=>{};this.tipTimer=0;this.settingsUI=null;this.worlds=[];this.selected=null;this.confirmDelete=null;this.busy=!1;this.lastWorld=null;this.titleRefresh=0;this.loadingState={text:"",progress:-2};this.keepOptionsScroll=!1;this.root=St("bf-menus bf-full bf-font",t),this.buildTitle(),this.buildWorlds(),this.buildCreate(),this.buildOptions(),this.buildControls(),this.buildPause(),this.buildLoading(),this.buildShaders(),this.buildPacks(),this.tip=St("bf-tip",this.root),this.tip.style.position="absolute",this.root.addEventListener("pointerover",s=>this.onTipOver(s)),this.root.addEventListener("pointerdown",()=>this.hideTip()),Zm(s=>{this.cur&&this.screens.get(this.cur).layout(s)})}showTitle(){this.show("title")}showWorlds(){this.confirmDelete=null,this.show("worlds"),this.reloadWorlds()}showPause(){this.busy=!1,this.show("pause")}showOptions(t){this.optionsBack=t,this.screens.get("options").setBg(this.overGame?"bf-pause-bg":"bf-dirt"),this.show("options")}showControls(t){this.controlsBack=t,this.screens.get("controls").setBg(this.overGame?"bf-pause-bg":"bf-dirt"),this.show("controls")}showShaders(){this.screens.get("shaders").setBg(this.overGame?"bf-pause-bg":"bf-dirt"),this.show("shaders")}showPacks(){this.screens.get("packs").setBg(this.overGame?"bf-pause-bg":"bf-dirt"),this.show("packs")}showLoading(t,e){let n=e===void 0?-1:Math.max(0,Math.min(1,e));this.cur!=="loading"&&(this.loadingState={text:"",progress:-2},this.pickHint(),this.show("loading")),this.updateLoading(t,n)}hide(){this.cur&&(this.screens.get(this.cur).root.style.display="none"),this.cur=null,this.root.classList.remove("bf-open"),this.hideTip()}isOpen(){return this.cur!==null}current(){return this.cur}back(){switch(this.cur){case"options":bi(this.settings),this.optionsBack();break;case"controls":this.controlsBack();break;case"shaders":case"packs":bi(this.settings),this.keepOptionsScroll=!0,this.showOptions(this.optionsBack);break;case"create":this.showWorlds();break;case"worlds":this.confirmDelete?(this.confirmDelete=null,this.renderWorlds()):this.showTitle();break;case"pause":this.handlers.resume();break;default:break}}show(t){t==="pause"?this.overGame=!0:px.includes(t)||(this.overGame=!1);let e=this.cur;e&&e!==t&&(this.screens.get(e).root.style.display="none");let n=this.screens.get(t);this.cur=t,this.root.classList.add("bf-open"),n.root.style.display="",this.hideTip(),n.layout(kn()),document.activeElement instanceof HTMLElement&&this.root.contains(document.activeElement)&&document.activeElement.blur();let s=n.onShow;s&&s()}add(t,e){let n=new ld(this.root,t,e);return this.screens.set(t,n),n}onTipOver(t){let e=t.target.closest("[data-tip]");clearTimeout(this.tipTimer),this.tip.classList.remove("bf-on"),!(!e||t.pointerType!=="mouse")&&(this.tipTimer=window.setTimeout(()=>{if(!e.isConnected||!this.cur)return;let n=kn();this.tip.textContent="";for(let c of Na(e.dataset.tip,200))St("",this.tip,c);this.tip.classList.add("bf-on");let s=e.getBoundingClientRect(),r=Math.ceil(this.tip.offsetWidth/n.u),o=Math.ceil(this.tip.offsetHeight/n.u),a=Math.floor(s.left/n.u),l=Math.floor(s.bottom/n.u)+4;a+r>n.gw-4&&(a=n.gw-4-r),l+o>n.gh-4&&(l=Math.floor(s.top/n.u)-o-4),vt(this.tip,Math.max(4,a),Math.max(4,l))},550))}hideTip(){clearTimeout(this.tipTimer),this.tip.classList.remove("bf-on")}buildTitle(){let t=this.add("title","bf-dirt"),e=St("bf-pano",t.bg);St("bf-vignette",t.bg);let n=Hi("img","bf-logo",t.gui);n.alt="BlockForge",n.draggable=!1;let s=St("bf-splash bf-font",t.gui),r=le(t.gui,"Continue",200,()=>this.continueLast());r.el.classList.add("bf-continue"),r.el.style.display="none";let o=le(t.gui,"Singleplayer",200,()=>this.showWorlds(),"Create a world or continue one you have played before."),a=this.handlers.offlineDownloadUrl?mx(t.gui,"Download offline version",200,this.handlers.offlineDownloadUrl):null;a&&(a.el.dataset.tip="One HTML file that plays without internet. Handy when a school network blocks the site.");let l=le(t.gui,"Options...",98,()=>this.showOptions(()=>this.showTitle())),c=le(t.gui,"Controls",98,()=>this.showControls(()=>this.showTitle())),h=St("bf-abs",t.gui,`BlockForge ${this.handlers.version}`),u=St("bf-abs bf-right",t.gui,"An original game. Every pixel made in code."),f=Ex()?St("bf-h1 bf-c-yellow",t.gui):null;f&&(f.textContent=He("On a touchscreen? Turn on Touch in Options.",0));let d="";this.titleUI={cont:r},t.layout=g=>{let b=this.settings.resourcePack,p=_x(b);if(p){let A=window.innerHeight,R=oi*A/_r;e.style.backgroundImage=`url(${p})`,e.style.backgroundSize=`${R}px ${A}px`,e.style.width=`${Math.ceil(window.innerWidth+R)+2}px`,e.style.setProperty("--pano-w",`${-R}px`),e.style.animationDuration=`${Math.round(R/12)}s`}let m=vx(b);m&&n.src!==m&&(n.src=m);let v=Math.round(Qe/2),y=Math.round(zi/2);vt(n,g.cx-(v>>1),28,v,y),d||(d=ac[Math.floor(Math.random()*ac.length)]),s.textContent=d,vt(s,g.cx+104,28+y-2),s.style.setProperty("--ss",String(Math.min(1.8,1.8*100/(rs(d)+32))));let w=g.qh+48,S=this.lastWorld;if(r.el.style.display=S?"":"none",S){let A="Continue: ";r.set(A+vi(S.name||"World",190-rs(A))),r.el.dataset.tip=`Jump straight back into ${S.name||"your world"}. Last played ${L0(S.lastPlayed)}.`,vt(r.el,g.cx-100,w),w+=24}vt(o.el,g.cx-100,w),w+=24,a&&(vt(a.el,g.cx-100,w),w+=24),w+=12,vt(l.el,g.cx-100,w),vt(c.el,g.cx+2,w),vt(h,2,g.gh-10),vt(u,g.gw-2-rs(u.textContent),g.gh-10),f&&(f.style.top=Qt(Math.min(g.gh-24,w+30)),f.style.display=this.settings.controls==="touch"?"none":"")},t.onShow=()=>{d=ac[Math.floor(Math.random()*ac.length)],r.enable(!0),t.layout(kn()),this.refreshContinue()}}async refreshContinue(){var n;let t=++this.titleRefresh,e=[];try{e=await this.handlers.listWorlds()}catch(s){console.warn("[menus] listWorlds failed",s)}t===this.titleRefresh&&(e.sort((s,r)=>(r.lastPlayed||0)-(s.lastPlayed||0)),this.lastWorld=(n=e[0])!=null?n:null,this.cur==="title"&&this.screens.get("title").layout(kn()))}continueLast(){let t=this.lastWorld;!t||this.busy||(this.busy=!0,this.titleUI.cont.enable(!1),this.handlers.playWorld(t.id).catch(e=>{console.warn("[menus] playWorld failed",e),this.showTitle()}).finally(()=>{this.busy=!1,this.titleUI.cont.enable(!0)}))}buildWorlds(){let t=this.add("worlds","bf-dirt"),e=_i(t.gui,"Select World",8),n=new bo(t.gui,!0),s=St("bf-h1 bf-c-gray",n.inner),r=le(t.gui,"Play Selected World",150,()=>this.playSelected()),o=le(t.gui,"Create New World",150,()=>this.showCreate()),a=le(t.gui,"Delete",150,()=>{let d=this.worlds.find(g=>g.id===this.selected);d&&(this.confirmDelete=d,this.renderWorlds())}),l=le(t.gui,"Back",150,()=>this.showTitle()),c=St("bf-abs",t.gui);c.style.inset="0";let h=St("bf-abs",c);h.style.inset="0";let u=le(c,"Delete",150,()=>void this.deleteConfirmed()),f=le(c,"Cancel",150,()=>{this.confirmDelete=null,this.renderWorlds()});this.worldsUI={list:n,title:e,empty:s,play:r,create:o,del:a,back:l,confirm:c,confirmLines:h,yes:u,no:f,rows:[]},t.layout=d=>{n.place(d,32,d.gh-64-32,d.cx+140),vt(r.el,d.cx-154,d.gh-52),vt(o.el,d.cx+4,d.gh-52),vt(a.el,d.cx-154,d.gh-28),vt(l.el,d.cx+4,d.gh-28),vt(u.el,d.cx-154,d.cy+24),vt(f.el,d.cx+4,d.cy+24),this.renderWorlds()},n.el.addEventListener("keydown",d=>{var g;if(d.key==="Enter")d.preventDefault(),this.playSelected();else if(d.key==="Delete"&&this.selected)d.preventDefault(),a.el.click();else if(d.key==="ArrowDown"||d.key==="ArrowUp"){d.preventDefault();let b=this.worlds.findIndex(m=>m.id===this.selected),p=Math.max(0,Math.min(this.worlds.length-1,b+(d.key==="ArrowDown"?1:-1)));this.worlds[p]&&(this.selected=this.worlds[p].id,this.renderWorlds(),(g=this.worldsUI.rows[p])==null||g.focus({preventScroll:!0}))}})}async reloadWorlds(){var t,e;this.worlds=[],this.worldsUI.empty.textContent=He("Loading worlds...",0),this.renderWorlds(!1);try{this.worlds=await this.handlers.listWorlds()}catch(n){console.warn("[menus] listWorlds failed",n),this.worlds=[],this.worldsUI.empty.textContent=He("Could not read saved worlds in this browser.",0),this.renderWorlds(!1);return}this.worlds.sort((n,s)=>(s.lastPlayed||0)-(n.lastPlayed||0)),this.worlds.some(n=>n.id===this.selected)||(this.selected=(e=(t=this.worlds[0])==null?void 0:t.id)!=null?e:null),this.worldsUI.empty.textContent=He("No worlds yet. Create one to start building!",0),this.cur==="worlds"&&this.renderWorlds()}renderWorlds(t=!0){let e=this.worldsUI,n=kn(),s=!!this.confirmDelete;e.confirm.style.display=s?"":"none";for(let r of[e.list.el,e.play.el,e.create.el,e.del.el,e.back.el,e.title])r.style.display=s?"none":"";if(s){let r=this.confirmDelete;e.confirmLines.textContent="";let o=n.cy-40;_i(e.confirmLines,"Delete this world?",o),o+=20;for(let a of Na(`"${vi(r.name,200)}" and everything built in it will be gone for good.`,300))_i(e.confirmLines,a,o,"bf-c-gray"),o+=10;e.yes.el.classList.add("bf-c-red");return}for(let r of e.rows)r.remove();e.rows=[],e.empty.style.display=(this.worlds.length||!t)&&this.worlds.length?"none":"",e.empty.style.top=Qt(12),this.worlds.forEach((r,o)=>{let a=St("bf-row",e.list.inner);a.tabIndex=0,a.dataset.y=String(4+o*36),a.dataset.h="36",vt(a,n.cx-135,4+o*36,270,36),a.classList.toggle("bf-sel",r.id===this.selected);let l=Hi("img","bf-thumbimg",a);l.src=bx(r.seed,this.settings.resourcePack),l.alt="",l.draggable=!1,St("bf-play",a).addEventListener("click",d=>{d.stopPropagation(),this.selected=r.id,this.playSelected()});let h=St("bf-abs",a,vi(r.name||"World",228));vt(h,35,0);let u=St("bf-abs bf-c-gray",a,vi(`Last played ${L0(r.lastPlayed)}`,228));vt(u,35,11);let f=St("bf-abs bf-c-gray",a,vi(`Creative mode, seed ${r.seed}`,228));vt(f,35,22),a.addEventListener("click",()=>{if(this.selected!==r.id){this.selected=r.id;for(let d of e.rows)d.classList.toggle("bf-sel",d===a);this.updateWorldButtons()}}),a.addEventListener("dblclick",()=>{this.selected=r.id,this.playSelected()}),e.rows.push(a)}),e.list.setContent(this.worlds.length*36+8),this.updateWorldButtons()}updateWorldButtons(){let t=!!this.selected&&this.worlds.some(e=>e.id===this.selected);this.worldsUI.play.enable(t&&!this.busy),this.worldsUI.del.enable(t&&!this.busy),this.worldsUI.create.enable(!this.busy)}playSelected(){let t=this.selected;!t||this.busy||(this.busy=!0,this.updateWorldButtons(),this.handlers.playWorld(t).catch(e=>{console.warn("[menus] playWorld failed",e),this.showWorlds()}).finally(()=>{this.busy=!1}))}async deleteConfirmed(){let t=this.confirmDelete;if(t){this.worldsUI.yes.enable(!1);try{await this.handlers.deleteWorld(t.id)}catch(e){console.warn("[menus] deleteWorld failed",e)}this.worldsUI.yes.enable(!0),this.confirmDelete=null,this.selected===t.id&&(this.selected=null),await this.reloadWorlds(),this.renderWorlds()}}showCreate(){this.createUI.name.value="New World",this.createUI.seed.value="",this.createUI.go.enable(!0),this.show("create"),this.createUI.name.focus({preventScroll:!0}),this.createUI.name.select()}buildCreate(){let t=this.add("create","bf-dirt");_i(t.gui,"Create New World",20);let e=St("bf-label",t.gui,"World Name"),n=Hi("input","bf-field",t.gui);n.type="text",n.maxLength=32,n.spellcheck=!1,n.autocomplete="off";let s=St("bf-label",t.gui,"Seed for the world generator"),r=Hi("input","bf-field",t.gui);r.type="text",r.maxLength=64,r.spellcheck=!1,r.autocomplete="off",r.placeholder="Leave blank for a random seed";let o=St("bf-label",t.gui,"Numbers and words both work."),a=le(t.gui,"Game Mode: Creative",200,()=>{},"Unlimited blocks, flying and instant breaking. The only mode in BlockForge.");a.el.classList.add("bf-off");let l=St("bf-label",t.gui),c=le(t.gui,"Create New World",150,()=>void this.doCreate()),h=le(t.gui,"Cancel",150,()=>this.showWorlds());this.createUI={name:n,seed:r,go:c};for(let u of[n,r])u.addEventListener("keydown",f=>{f.key==="Enter"?(f.preventDefault(),this.doCreate()):f.key!=="Escape"&&f.stopPropagation()});t.layout=u=>{let f=Math.max(36,Math.min(60,u.qh));vt(e,u.cx-100,f-13),vt(n,u.cx-100,f),vt(s,u.cx-100,f+31),vt(r,u.cx-100,f+44),vt(o,u.cx-100,f+67),vt(a.el,u.cx-100,f+84),l.textContent="",vt(l,u.cx-100,f+107),vt(c.el,u.cx-154,u.gh-28),vt(h.el,u.cx+4,u.gh-28)}}async doCreate(){if(this.busy)return;this.busy=!0,this.createUI.go.enable(!1);let t=this.createUI.name.value.trim()||"New World";try{await this.handlers.createWorld(t,this.createUI.seed.value)}catch(e){console.warn("[menus] createWorld failed",e),this.showWorlds()}finally{this.busy=!1,this.createUI.go.enable(!0)}}settingsEdited(t){let e=this.settings;Ca(e),t&&(e.preset=Sx(e)),bi(e);try{this.handlers.settingsChanged(e)}catch(n){console.warn("[menus] settingsChanged failed",n)}}buildOptions(){let t=this.add("options","bf-dirt"),e=_i(t.gui,"Options",13),n=new bo(t.gui,!1),s=le(t.gui,"Done",200,()=>this.back()),r=this.settings,o=["renderDistance","fancyLeaves","smoothLighting","shaderPack","shadowQuality","clouds","resolutionScale","mipmaps"],a=x=>{this.settingsEdited(!!x&&o.includes(x)),x==="guiScale"&&go(r.guiScale),u()},l=x=>x?"ON":"OFF",c=[],h=[],u=()=>{for(let x of h)x()},f=150,d=(x,T,D,U)=>{let k=le(n.inner,"",f,()=>{r[T]=!r[T],U==null||U(),a(T)},D);return h.push(()=>k.set(`${x}: ${l(!!r[T])}`)),k.el},g=(x,T,D,U,k,B,F,I)=>{let N=le(n.inner,"",f,()=>{let z=T.indexOf(D());U(T[(z+1)%T.length]),a(B)},F);return h.push(()=>{N.set(`${x}: ${k(D())}`),I&&N.enable(I())}),N.el},b=(x,T,D,U,k,B,F=1)=>{let I=gx(n.inner,f,T,D,U,()=>Math.round(r[x]*F/U)*U,N=>{r[x]=N/F,a(x)},k,B);return h.push(I.refresh),I.el},p=(x,T)=>c.push({kind:"pair",a:x,b:T}),m=(x,T=0)=>c.push({kind:"wide",el:x,gap:T}),v=x=>c.push({kind:"header",text:x});v("Graphics");let y=le(n.inner,"",310,()=>this.showShaders(),"Off is the fastest. Fancy adds sun shadows, waving plants and reflective water. Ultra adds bloom, god rays and mirror water.");y.el.classList.add("bf-feature"),h.push(()=>{var x;return y.set(`Shaders: ${(x=od[r.shaderPack])!=null?x:"Off"}...`)}),m(y.el),p(g("Graphics",["low","medium","high"],()=>r.preset,x=>Ll(r,x),x=>wx[x],"preset","Low runs at 60 fps on most school laptops. Medium turns on Fancy shaders and see-through leaves. High uses Ultra shaders and sees further."),b("renderDistance",2,12,1,x=>`Render Distance: ${x} chunks`,"How far you can see. Lower is faster."));let _=le(n.inner,"Resource Packs...",f,()=>this.showPacks(),"Change the look of every block: smooth, retro, vivid or pastel.");_.el.classList.add("bf-feature"),p(_.el,b("fov",50,110,1,x=>`FOV: ${x===70?"Normal":x}`,"Field of view in degrees.")),p(b("brightness",0,100,1,x=>`Brightness: ${x===0?"Moody":x===100?"Bright":x+"%"}`,"Lifts dark caves and nights.",100),d("Smooth Lighting","smoothLighting","Soft light and shadows in corners (ambient occlusion).")),p(d("Fancy Leaves","fancyLeaves","See-through leaves. Off draws solid leaves, which is faster."),d("Clouds","clouds","Blocky clouds drifting overhead.")),p(d("Mipmaps","mipmaps","Smooths distant textures and stops shimmering."),b("resolutionScale",50,100,5,x=>`Resolution: ${x}%`,"Renders fewer pixels and scales up. Lower is faster.",100)),p(d("View Bobbing","viewBobbing","The camera bobs while you walk."),b("maxFps",0,240,10,x=>`Max Framerate: ${x===0?"VSync":x+" fps"}`,"Cap the frame rate to save battery. VSync follows the screen.")),v("Controls"),p(g("Controls",["keyboard","touch"],()=>r.controls,x=>{r.controls=x,r.controlsChosen=!0},x=>x==="touch"?"Touch":"Keyboard & Mouse","controls","Touch shows on-screen sticks and buttons for phones and tablets."),b("sensitivity",10,200,5,x=>`Sensitivity: ${x}%`,"Mouse look speed.",100)),p(d("Invert Mouse","invertY","Moving the mouse up looks down."),d("Fullscreen on Play","fullscreen","Go fullscreen when a world starts. In fullscreen the game can keep Ctrl+W from closing the tab.")),p(b("touchSensitivity",25,300,5,x=>`Touch Look: ${x}%`,"How fast dragging turns the camera.",100),b("touchButtonScale",75,150,5,x=>`Touch Buttons: ${x}%`,"Size of the on-screen buttons.",100));let w=le(n.inner,"Key Bindings...",f,()=>this.showControls(()=>this.showOptions(this.optionsBack)),"Every key and mouse button.");p(w.el,null),v("Interface and Sound"),p(g("GUI Scale",[2,3,4],()=>r.guiScale,x=>{r.guiScale=x},x=>{let T=kn(),D=Math.round(T.uDev/T.dpr);return D<x?`${x} (fits ${D})`:String(x)},"guiScale","Size of menus and the HUD. Small screens use the largest size that fits."),d("Show FPS","showFps","Frames per second in the corner (F3 shows more).")),p(b("volume",0,100,1,x=>`Volume: ${x===0?"OFF":x+"%"}`,"Sound effects volume.",100),null);let S=0,A=()=>{clearTimeout(S),S=0,R.set("Restore Defaults"),R.el.classList.remove("bf-warn")},R=le(n.inner,"Restore Defaults",310,()=>{if(!S){R.set("Click again to restore defaults"),R.el.classList.add("bf-warn"),S=window.setTimeout(A,3e3);return}A(),jp(r),bi(r),go(r.guiScale);try{this.handlers.settingsChanged(r)}catch(x){console.warn("[menus] settingsChanged failed",x)}u()},"Put every option back the way it was the first time you played. Your worlds are not touched.");R.el.classList.add("bf-restore"),m(R.el,8);let P=[];for(let x of c)if(x.kind==="header"){let T=St("bf-h1 bf-c-yellow",n.inner);T.textContent=He(x.text,0),P.push(T)}this.settingsUI={refresh:u},u(),t.layout=x=>{var U;n.place(x,32,x.gh-64,x.cx+160);let T=4,D=0;for(let k of c)if(k.kind==="header"){let B=P[D++];B.style.top=Qt(T+5),T+=18}else k.kind==="wide"?(T+=(U=k.gap)!=null?U:0,vt(k.el,x.cx-155,T),k.el.dataset.y=String(T),T+=24):(k.a&&(vt(k.a,x.cx-155,T),k.a.dataset.y=String(T)),k.b&&(vt(k.b,x.cx+5,T),k.b.dataset.y=String(T)),T+=24);n.setContent(T+4),vt(s.el,x.cx-100,x.gh-26),u()},t.onShow=()=>{this.keepOptionsScroll||n.scrollTo(0),this.keepOptionsScroll=!1,A(),u()}}buildShaders(){let t=this.add("shaders","bf-dirt"),e=_i(t.gui,"Shaders",13),n=this.settings,s=Mx.map(c=>{let h=Hi("button","bf-btn bf-card",t.gui);h.type="button";let u=St("bf-radio",h),f=St("bf-abs bf-card-name",h),d=St("bf-abs bf-c-gray bf-card-desc",h);return h.addEventListener("click",g=>{g.preventDefault(),n.shaderPack!==c.id&&(n.shaderPack=c.id,this.settingsEdited(!0),l())}),{info:c,b:h,radio:u,name:f,desc:d}}),r=le(t.gui,"",200,()=>{n.shadowQuality=n.shadowQuality===2048?1024:2048,this.settingsEdited(!0),l()},"Sharper shadows cost more graphics memory."),o=St("bf-h1 bf-c-gray",t.gui),a=le(t.gui,"Done",200,()=>this.back()),l=()=>{for(let c of s){let h=n.shaderPack===c.info.id;c.b.classList.toggle("bf-on",h),c.b.setAttribute("aria-pressed",h?"true":"false")}r.set(`Shadow Quality: ${n.shadowQuality===2048?"High":"Normal"}`),r.enable(n.shaderPack!=="off")};t.layout=c=>{let h=Math.min(300,c.gw-16),u=s.map(m=>Na(m.info.desc,h-34)),f=19+Math.max(...u.map(m=>m.length))*10+4,d=s.length*(f+4)+4+20,g=Math.max(28,Math.min(c.qh+4,Math.round((c.gh-30-d)/2)));e.style.top=Qt(Math.max(8,g-18)-1),s.forEach((m,v)=>{vt(m.b,c.cx-(h>>1),g+v*(f+4),h,f),m.b.style.height=Qt(f),vt(m.radio,7,Math.round(f/2)-5,10,10),m.name.textContent=od[m.info.id],vt(m.name,26,5),m.desc.textContent="",u[v].forEach((y,_)=>{let w=St("",m.desc,y);w.style.height=Qt(10)}),vt(m.desc,26,16)});let b=g+s.length*(f+4)+4;vt(r.el,c.cx-100,b);let p=b+28;o.style.display=p+10<c.gh-30?"":"none",o.textContent=He("Changes show right away. Off is the fastest.",0),o.style.top=Qt(p),vt(a.el,c.cx-100,c.gh-26),l()},t.onShow=()=>l()}buildPacks(){let t=this.add("packs","bf-dirt");_i(t.gui,"Resource Packs",13);let e=new bo(t.gui,!0),n=le(t.gui,"Done",98,()=>this.back()),s=this.settings,r=48,o=Hi("input","",t.root);o.type="file",o.accept=".zip,.mcpack,application/zip,application/x-zip-compressed,application/x-zip",o.style.display="none";let a=St("bf-abs bf-c-gray",t.gui),l=!1,c=!0,h=null,u=v=>{let y=v?Na(v,m).slice(0,2):[];a.textContent=y.join(`
`),h&&vt(a,h.cx-(m>>1),h.gh-30-10*Math.max(1,y.length))},f=le(t.gui,"Import Pack...",98,()=>{l||o.click()},"Load a resource pack .zip from this device. It stays in this browser and is never uploaded."),d=le(t.gui,"Remove Import",98,()=>{l||!is()||(mo(null),S0(),c=!0,R0("custom"),s.resourcePack==="custom"&&this.pickPack("default",()=>p()),b(),p())},"Forget the imported pack.");o.addEventListener("change",async()=>{var y,_;let v=o.files&&o.files[0];if(o.value="",!(!v||l)){l=!0,f.enable(!1),u(vi("Reading "+v.name,m));try{let w=await x0(v,v.name,(S,A)=>{u(`Importing textures: ${Math.round(S/A*100)}%`)});if(mo(w),R0("custom"),b(),s.resourcePack==="custom")try{(_=(y=this.handlers).reapplyResourcePack)==null||_.call(y)}catch(S){console.warn(S)}else this.pickPack("custom",()=>p());u(`Imported ${w.tiles.size} textures from ${w.name}`),c=await Promise.race([w0(w).then(()=>!0,S=>(console.warn("[packs] could not store the imported pack",S),!1)),new Promise(S=>setTimeout(()=>S(!1),8e3))]),c||u("Imported for this visit only: this browser would not save it, so import it again next time.")}catch(w){u((w instanceof Error?w.message:String(w)).slice(0,160))}finally{l=!1,f.enable(!0),p()}}});let g=Pa.map((v,y)=>{let _=St("bf-row bf-packrow",e.inner);_.tabIndex=0,_.dataset.pack=v.id,_.dataset.y=String(4+y*r),_.dataset.h=String(r);let w=St("bf-abs",_,v.name),S=St("bf-abs bf-c-green bf-right",_,"Selected"),A=St("bf-abs bf-c-gray",_),R=St("bf-abs bf-strip",_),P=sc.map(()=>{let T=Hi("img","bf-stripimg",R);return T.alt="",T.draggable=!1,T}),x=()=>{if(v.id==="custom"&&!is()){l||o.click();return}this.pickPack(v.id,p)};return _.addEventListener("click",x),_.addEventListener("keydown",T=>{var D;if(T.key==="Enter"||T.key===" ")T.preventDefault(),x();else if(T.key==="ArrowDown"||T.key==="ArrowUp"){T.preventDefault();let U=Math.max(0,Math.min(Pa.length-1,y+(T.key==="ArrowDown"?1:-1)));(D=g[U])==null||D.row.focus({preventScroll:!0}),e.ensureVisible(4+U*r,r)}}),{p:v,row:_,name:w,used:S,desc:A,strip:R,imgs:P}}),b=()=>{let v=g.find(y=>y.p.id==="custom");v&&v.imgs.forEach((y,_)=>{var w;y.src=is()?cd((w=yt[sc[_]])!=null?w:0,"custom"):"",y.style.visibility=is()?"":"hidden"})},p=()=>{let v=is();for(let y of g){let _=s.resourcePack===y.p.id;y.row.classList.toggle("bf-sel",_),y.name.classList.toggle("bf-c-yellow",_),y.used.style.display=_?"":"none",y.p.id==="custom"&&(y.name.textContent=v?v.name:"Imported Pack",y.desc.textContent=vi(v?c?`${v.count} textures, kept in this browser only.`:`${v.count} textures, not saved: import again next time.`:"Load a resource pack .zip from this device.",m-12))}d.enable(!!v&&!l)},m=300;t.layout=v=>{let y=Math.min(300,v.gw-20);m=y,h=v,e.place(v,30,v.gh-30-56,v.cx+(y>>1)+4),g.forEach((w,S)=>{vt(w.row,v.cx-(y>>1),4+S*r,y,r-4),vt(w.name,6,4),vt(w.used,y-8-rs("Selected"),4),w.desc.textContent=vi(w.p.description,y-12),vt(w.desc,6,14),vt(w.strip,6,25,sc.length*18,16),w.imgs.forEach((A,R)=>vt(A,R*18,0,16,16))}),e.setContent(Pa.length*r+8);let _=a.textContent?a.textContent.split(`
`).length:1;vt(a,v.cx-(y>>1),v.gh-30-10*_),vt(f.el,v.cx-151,v.gh-26),vt(d.el,v.cx-49,v.gh-26),vt(n.el,v.cx+53,v.gh-26),p()},t.onShow=()=>{for(let v of g)v.p.id!=="custom"&&v.imgs.forEach((y,_)=>{var S;let w=(S=yt[sc[_]])!=null?S:0;y.src||(y.src=cd(w,v.p.id))});b(),u(""),p()}}pickPack(t,e){let n=this.settings;if(n.resourcePack===t)return;n.resourcePack=t,e(),bi(n);let s=()=>{n.resourcePack===t&&this.settingsEdited(!1)};typeof requestAnimationFrame=="function"?requestAnimationFrame(()=>setTimeout(s,0)):setTimeout(s,0)}buildControls(){let t=this.add("controls","bf-dirt");_i(t.gui,"Controls",13);let e=new bo(t.gui,!1),n=le(t.gui,"Done",98,()=>{f(),this.back()}),s=le(t.gui,"Reset Keys",98,()=>{f(),T0(this.settings),bi(this.settings),d()},"Put every key back the way it started."),r=St("bf-abs",e.inner);r.style.left="0",r.style.right="0";let o=null,a=null,l=g=>{if(!o||(g.preventDefault(),g.stopImmediatePropagation(),g.repeat))return;let b=g.code||"";b!=="Escape"&&b&&!C0.has(b)&&h(o,b),f(),d()},c=g=>{if(!(!o||g.button<0||g.button>4)){if(g.preventDefault(),g.stopImmediatePropagation(),h(o,"Mouse"+g.button),g.button===0){let b=p=>{p.preventDefault(),p.stopImmediatePropagation()};window.addEventListener("click",b,{capture:!0,once:!0}),setTimeout(()=>window.removeEventListener("click",b,!0),500)}f(),d()}},h=(g,b)=>{id(this.settings,g,b),bi(this.settings)},u=g=>{o=g,window.addEventListener("keydown",l,!0),window.addEventListener("mousedown",c,!0),d()};function f(){o=null,window.removeEventListener("keydown",l,!0),window.removeEventListener("mousedown",c,!0)}let d=()=>{let g=a;if(!g)return;r.textContent="";let b=k0(),p=4,m=_=>{let w=St("bf-h1 bf-c-yellow",r);w.textContent=He(_,0),w.style.top=Qt(p+5),p+=18},v=this.settings.controls==="touch",y=()=>{m("Touch controls");for(let[_,w]of kx){vt(St("bf-abs",r,vi(_,170)),g.cx-155,p+5);let S=St("bf-keycap",r);S.textContent=He(w,90),vt(S,g.cx+20,p,90,20),p+=22}p+=4};v&&y();for(let _ of["Movement","Gameplay","Interface","Hotbar"]){m(_==="Gameplay"?"Gameplay":_);for(let w of ec){if(w.group!==_)continue;let S=St("bf-abs",r,vi(w.label,170));vt(S,g.cx-155,p+5);let A=Os(w.id),R=o===w.id,P=le(r,R?"> Press a key <":sd(A),90,()=>{o===w.id?(f(),d()):u(w.id)},R?"Press any key or mouse button. Esc cancels.":"Click, then press the new key or mouse button.");R?P.el.classList.add("bf-c-yellow"):b.has(w.id)&&P.el.classList.add("bf-c-red"),vt(P.el,g.cx+20,p);let x=le(r,"Reset",44,()=>{f(),id(this.settings,w.id,w.def),bi(this.settings),d()},"Back to "+sd(w.def)+".");x.enable(A!==w.def),vt(x.el,g.cx+114,p),p+=22}p+=4}m("Fixed");for(let[_,w]of Tx){vt(St("bf-abs",r,vi(_,170)),g.cx-155,p+5);let S=St("bf-keycap",r);S.textContent=He(w,90),vt(S,g.cx+20,p,90,20),p+=22}p+=4,v||y(),e.setContent(p+4)};t.layout=g=>{a=g,e.place(g,32,g.gh-64,g.cx+160),d(),vt(s.el,g.cx-100,g.gh-26),vt(n.el,g.cx+2,g.gh-26)},t.onShow=()=>{f(),d(),e.scrollTo(0)}}buildPause(){let t=this.add("pause","bf-pause-bg"),e=_i(t.gui,"Game Menu",40),n=le(t.gui,"Back to Game",204,()=>this.handlers.resume()),s=le(t.gui,"Options...",98,()=>this.showOptions(()=>this.showPause())),r=le(t.gui,"Controls",98,()=>this.showControls(()=>this.showPause())),o=le(t.gui,"",204,()=>{let f=this.handlers.getTimeMode();this.handlers.setTimeMode(rd[(rd.indexOf(f)+1)%rd.length]),u()},"Keep the sun moving, or stop the clock at a time you like."),a=le(t.gui,"",204,()=>{let f=this.settings;f.shaderPack=ad[(ad.indexOf(f.shaderPack)+1)%ad.length],this.settingsEdited(!0),l()},"Off is the fastest. Fancy adds sun shadows, waving plants and reflective water. Ultra adds bloom, god rays and mirror water."),l=()=>{var f;return a.set(`Shaders: ${(f=od[this.settings.shaderPack])!=null?f:"Off"}`)},c=le(t.gui,"Save and Quit to Title",204,()=>{this.busy||(this.busy=!0,c.enable(!1),this.handlers.saveAndQuit().catch(f=>{console.warn("[menus] saveAndQuit failed",f),this.showTitle()}).finally(()=>{this.busy=!1,c.enable(!0)}))}),h=St("bf-abs",t.gui);h.style.left="0";let u=()=>{var f;return o.set(`Time of Day: ${(f=xx[this.handlers.getTimeMode()])!=null?f:"Day Cycle"}`)};t.layout=f=>{let d=Math.max(56,f.qh+8);e.style.top=Qt(Math.min(40,d-22)-1),vt(n.el,f.cx-102,d),vt(s.el,f.cx-102,d+24),vt(r.el,f.cx+4,d+24),vt(o.el,f.cx-102,d+48),vt(a.el,f.cx-102,d+72),vt(c.el,f.cx-102,d+108),h.textContent="";let g=d+140,b=Na("Ctrl+W closes the tab in browsers: sprint with a double-tap of W, or turn on Fullscreen on Play in Options.",Math.min(300,f.gw-20));if(g+11+b.length*10<=f.gh-4){_i(h,"Tip",g,"bf-c-yellow"),g+=11;for(let p of b)_i(h,p,g,"bf-c-gray"),g+=10}u(),l()},t.onShow=()=>{c.enable(!0),u(),l()}}buildLoading(){let t=this.add("loading","bf-dirt"),e=St("bf-h1",t.gui),n=St("bf-progress",t.gui),s=St("bf-fill",n),r=St("bf-h1 bf-c-gray",t.gui),o=St("bf-h1 bf-c-gray",t.gui);this.loadingUI={text:e,bar:n,fill:s,pct:r,hint:o},t.layout=a=>{e.style.top=Qt(a.cy-26),vt(n,a.cx-101,a.cy-6,202,10),r.style.top=Qt(a.cy+10),o.style.top=Qt(a.gh-24)}}pickHint(){let t=P0[Math.floor(Math.random()*P0.length)];this.loadingUI.hint.textContent=He(t,0)}updateLoading(t,e){let n=this.loadingUI,s=this.loadingState;if(t!==s.text&&(s.text=t,n.text.textContent=He(t,0)),e!==s.progress){s.progress=e;let r=e>=0;n.bar.style.display=r?"":"none",n.pct.style.display=r?"":"none",r&&(n.fill.style.width=Qt(Math.round(e*198)),n.pct.textContent=He(`${Math.round(e*100)}%`,0))}}};var Cx=2,I0=10,Rx=10;function mn(i,t){let e=document.createElement("div");return e.className=i,t&&t.appendChild(e),e}var uc=class{constructor(t,e,n){this.icons=e;this.hotbar=n;this.slotIcons=[];this.slotIds=[];this.nameTime=0;this.nameOpacity=-1;this.msgs=[];this.debugLines=[[],[]];this._debugVisible=!1;this.visible=!0;this.water=mn("bf-water",t),this.cross=mn("bf-cross",t),this.el=mn("bf-gui bf-hud bf-font",t),this.hotbarEl=mn("bf-hotbar",this.el);for(let s=0;s<9;s++){let r=mn("bf-hslot",this.hotbarEl);r.style.left=Qt(1+s*20),r.dataset.slot=String(s);let o=mn("bf-icon",r);this.slotIcons.push(o),this.slotIds.push(-1);let a=mn("bf-num",r);a.textContent=String.fromCharCode(57345+s),r.addEventListener("pointerdown",l=>{l.preventDefault(),l.stopPropagation(),this.hotbar.select(s)})}this.sel=mn("bf-hsel",this.hotbarEl),this.nameEl=mn("bf-itemname",this.el),this.chat=mn("bf-chat",this.el),this.debugEl=mn("bf-debug",this.el),this.debugCols=[mn("bf-col",this.debugEl),mn("bf-col bf-r",this.debugEl)],this.fpsEl=mn("bf-fps",this.el),n.onChange(()=>this.refreshHotbar()),this.refreshHotbar()}get debugVisible(){return this._debugVisible}refreshHotbar(){var t;for(let e=0;e<9;e++){let n=(t=this.hotbar.slots[e])!=null?t:0;this.slotIds[e]!==n&&(this.slotIds[e]=n,this.icons.apply(this.slotIcons[e],n))}this.sel.style.left=Qt(-1+this.hotbar.selected*20)}setVisible(t){this.visible=t,this.el.classList.toggle("bf-hidden",!t),this.cross.classList.toggle("bf-hidden",!t)}update(t){if(this.nameTime>0){this.nameTime=Math.max(0,this.nameTime-t);let e=Math.min(1,this.nameTime/.5),n=Math.round(e*20)/20;n!==this.nameOpacity&&(this.nameOpacity=n,this.nameEl.style.opacity=String(n))}for(let e=this.msgs.length-1;e>=0;e--){let n=this.msgs[e];n.age+=t;let s=Math.max(0,Math.min(1,I0-n.age)),r=Math.round(s*20)/20;r!==n.opacity&&(n.opacity=r,n.el.style.opacity=String(r)),n.age>=I0&&(n.el.remove(),this.msgs.splice(e,1))}}showItemName(t){if(!t){this.nameTime=0,this.nameOpacity=0,this.nameEl.style.opacity="0";return}this.nameEl.textContent=He(t,Px()),this.nameTime=Cx,this.nameOpacity=1,this.nameEl.style.opacity="1"}message(t){let e=mn("bf-msg");for(e.textContent=t,this.chat.appendChild(e),this.msgs.push({el:e,age:0,opacity:1});this.msgs.length>Rx;)this.msgs.shift().el.remove()}setDebugVisible(t){this._debugVisible=t,this.debugEl.classList.toggle("bf-on",t),t&&this.setFps(null)}setDebug(t,e){this.fillColumn(0,t),this.fillColumn(1,e)}fillColumn(t,e){let n=this.debugCols[t],s=this.debugLines[t];for(;s.length<e.length;){let r=mn("bf-line",n);r.appendChild(document.createElement("span")),s.push(r)}for(;s.length>e.length;)s.pop().remove();for(let r=0;r<e.length;r++){let o=s[r].firstChild,a=e[r];o.textContent!==a&&(o.textContent=a,o.style.display=a?"":"none")}}setFps(t){t&&!this._debugVisible?(this.fpsEl.textContent!==t&&(this.fpsEl.textContent=t),this.fpsEl.classList.add("bf-on")):this.fpsEl.classList.remove("bf-on")}setUnderwaterTint(t){this.water.classList.contains("bf-on")!==t&&this.water.classList.toggle("bf-on",t)}get isVisible(){return this.visible}};function Px(){return 0}var Ba=5,Gi=9,U0=8,Lx=17,Ix=111,D0=95,Wi=[{key:"building",title:"Building Blocks",tip:"Building",icon:yt.bricks},{key:"colored",title:"Coloured Blocks",tip:"Coloured",icon:yt.cyan_wool},{key:"natural",title:"Natural Blocks",tip:"Natural",icon:yt.grass_block},{key:"ores",title:"Ores & Minerals",tip:"Ores & Minerals",icon:yt.diamond_ore},{key:"wood",title:"Wood",tip:"Wood",icon:yt.oak_log},{key:"light",title:"Lighting",tip:"Lighting",icon:yt.lantern},{key:"decor",title:"Decoration",tip:"Decoration",icon:yt.poppy},{key:"fluids",title:"Fluids",tip:"Fluids",icon:yt.water},{key:"search",title:"Search Items",tip:"Search",icon:Jl.search}],Ux=[[0,-28,!1],[29,-28,!1],[58,-28,!1],[87,-28,!1],[116,-28,!1],[0,132,!0],[29,132,!0],[58,132,!0],[167,-28,!1]],Dx={building:"Building",colored:"Coloured",natural:"Natural",ores:"Ores & Minerals",wood:"Wood",light:"Lighting",decor:"Decoration",fluids:"Fluids"},ud=[],dd=new Map;for(let i=1;i<xt;i++){if(!co(i))continue;ud.push(i);let t=Le[i].cat,e=dd.get(t);e||(e=[],dd.set(t,e)),e.push(i)}var Nx=Le.map(i=>i.display.toLowerCase());function N0(i){let t=i.toLowerCase().trim().split(/\s+/).filter(Boolean);return t.length?ud.filter(e=>t.every(n=>Nx[e].includes(n))):ud.slice()}function hn(i,t){let e=document.createElement("div");return e.className=i,t&&t.appendChild(e),e}var dc=class{constructor(t,e,n){this.icons=e;this.hotbar=n;this.onClose=null;this._open=!1;this.tabEls=[];this.gridSlots=[];this.gridIcons=[];this.gridIds=[];this.barSlots=[];this.barIcons=[];this.barIds=[];this.tab=0;this.scroll=0;this.items=[];this.query="";this.held=0;this.hover=null;this.hoverEl=null;this.drag=null;this.thumbDrag=null;this.mouse={x:-100,y:-100};this.wheelAcc=0;this.tipTarget=null;this.hoverTab=-1;this.root=hn("bf-inv-root bf-full bf-dim bf-font",t),this.gui=hn("bf-gui",this.root),this.panel=hn("bf-inv-panel",this.gui),Wi.forEach((r,o)=>{let[a,l,c]=Ux[o],h=hn("bf-tab"+(c?" bf-bottom":""),this.panel);h.style.left=Qt(a),h.style.top=Qt(l),h.dataset.k="t"+o;let u=hn("bf-icon",h);e.apply(u,r.icon),this.tabEls.push(h)}),hn("bf-inv-bg",this.panel),this.titleEl=hn("bf-inv-title bf-c-dark",this.panel),this.search=document.createElement("input"),this.search.className="bf-inv-search",this.search.type="text",this.search.spellcheck=!1,this.search.autocomplete="off",this.search.maxLength=50,this.search.placeholder="Search...",this.search.setAttribute("aria-label","Search items"),this.panel.appendChild(this.search),this.search.addEventListener("input",()=>this.setQuery(this.search.value)),this.search.addEventListener("keydown",r=>{r.key!=="Escape"&&!/^(Digit|Numpad)[1-9]$/.test(r.code)&&r.stopPropagation()});for(let r=0;r<Ba;r++)for(let o=0;o<Gi;o++){let a=r*Gi+o,l=hn("bf-slot",this.panel);l.style.left=Qt(U0+o*18),l.style.top=Qt(Lx+r*18),l.dataset.k="g"+a,this.gridSlots.push(l),this.gridIcons.push(hn("bf-icon",l)),this.gridIds.push(-1)}for(let r=0;r<Gi;r++){let o=hn("bf-slot",this.panel);o.style.left=Qt(U0+r*18),o.style.top=Qt(Ix),o.dataset.k="h"+r,this.barSlots.push(o),this.barIcons.push(hn("bf-icon",o)),this.barIds.push(-1)}this.emptyEl=hn("bf-inv-empty bf-c-dark",this.panel),this.emptyEl.textContent="No blocks match",this.track=hn("bf-inv-track",this.panel),this.track.dataset.k="track",this.thumb=hn("bf-inv-thumb",this.track);let s=hn("bf-inv-close",this.panel);s.dataset.k="close",s.textContent="X",s.setAttribute("aria-label","Close inventory"),this.tip=hn("bf-tip",this.gui),this.heldEl=hn("bf-held",this.gui),this.root.addEventListener("pointerdown",r=>this.onDown(r)),this.root.addEventListener("pointermove",r=>this.onMove(r)),this.root.addEventListener("pointerup",r=>this.onUp(r)),this.root.addEventListener("pointercancel",()=>{this.drag=null,this.thumbDrag=null}),this.root.addEventListener("pointerleave",()=>{this.setHover(null,null)}),this.root.addEventListener("contextmenu",r=>r.preventDefault()),this.root.addEventListener("wheel",r=>this.onWheel(r),{passive:!1}),this.root.addEventListener("dragstart",r=>r.preventDefault()),n.onChange(()=>{this._open&&this.renderHotbar()}),this.selectTab(0)}get isOpen(){return this._open}open(){this._open||(this._open=!0,this.held=0,this.drag=null,this.root.classList.add("bf-open"),this.renderAll(),Wi[this.tab].key==="search"&&this.focusSearch())}close(){var t;this._open&&(this._open=!1,this.held=0,this.drag=null,this.thumbDrag=null,this.setHover(null,null),this.search.blur(),this.root.classList.remove("bf-open"),this.renderHeld(),(t=this.onClose)==null||t.call(this))}toggle(){this._open?this.close():this.open()}handleKey(t){var r;if(!this._open)return!1;if(t==="Escape")return this.close(),!0;let e=nc.findIndex(o=>os(o,t)),n=/^Numpad([1-9])$/.exec(t),s=e>=0?e:n?Number(n[1])-1:-1;if(s>=0&&this.hover){let o=s;if(this.hover.kind==="grid"){let a=(r=this.items[this.scroll*Gi+this.hover.index])!=null?r:0;a&&this.hotbar.set(o,a)}else if(this.hover.index!==o){let a=this.hotbar.slots[this.hover.index],l=this.hotbar.slots[o];this.hotbar.set(o,a),this.hotbar.set(this.hover.index,l)}return this.updateTooltip(),!0}return document.activeElement===this.search?!1:os("inventory",t)?(this.close(),!0):t==="KeyT"||t==="Slash"||t==="KeyF"?(this.selectTab(Wi.length-1),this.focusSearch(),!0):Wi[this.tab].key==="search"&&/^(Key[A-Z]|Digit\d|Space|Minus|Quote)$/.test(t)?(this.focusSearch(),!1):t==="ArrowDown"||t==="PageDown"?(this.setScroll(this.scroll+(t==="PageDown"?Ba:1)),!0):t==="ArrowUp"||t==="PageUp"?(this.setScroll(this.scroll-(t==="PageUp"?Ba:1)),!0):!1}get visibleItems(){return this.items.slice()}get heldItem(){return this.held}get currentTab(){return this.tab}selectTab(t){var s;t=Math.max(0,Math.min(Wi.length-1,t)),this.tab=t;let e=Wi[t];this.tabEls.forEach((r,o)=>r.classList.toggle("bf-sel",o===t)),this.titleEl.textContent=e.title;let n=e.key==="search";this.search.style.display=n?"":"none",this.items=n?N0(this.query):((s=dd.get(e.key))!=null?s:[]).slice(),this.scroll=0,n?this._open&&this.focusSearch():document.activeElement===this.search&&this.search.blur(),this.renderGrid()}setQuery(t){if(this.query=t,this.search.value!==t&&(this.search.value=t),Wi[this.tab].key!=="search"){this.selectTab(Wi.length-1);return}this.items=N0(t),this.scroll=0,this.renderGrid()}focusSearch(){this.search.style.display="";try{this.search.focus({preventScroll:!0})}catch{this.search.focus()}}maxScroll(){return Math.max(0,Math.ceil(this.items.length/Gi)-Ba)}setScroll(t){let e=Math.max(0,Math.min(this.maxScroll(),Math.round(t)));e!==this.scroll&&(this.scroll=e,this.renderGrid(),this.updateTooltip())}renderAll(){this.renderGrid(),this.renderHotbar(),this.renderHeld()}renderGrid(){var n;let t=this.scroll*Gi;for(let s=0;s<Ba*Gi;s++){let r=(n=this.items[t+s])!=null?n:0;this.gridIds[s]!==r&&(this.gridIds[s]=r,this.icons.apply(this.gridIcons[s],r))}let e=this.maxScroll();this.thumb.classList.toggle("bf-off",e===0),this.thumb.style.top=Qt(e?Math.round(D0*this.scroll/e):0),this.emptyEl.style.display=this.items.length?"none":""}renderHotbar(){var t;for(let e=0;e<Gi;e++){let n=(t=this.hotbar.slots[e])!=null?t:0;this.barIds[e]!==n&&(this.barIds[e]=n,this.icons.apply(this.barIcons[e],n))}}renderHeld(){this.held?(this.icons.apply(this.heldEl,this.held),this.heldEl.classList.add("bf-on"),this.placeHeld()):this.heldEl.classList.remove("bf-on"),this.updateTooltip()}placeHeld(){this.heldEl.style.left=Qt(this.mouse.x-8),this.heldEl.style.top=Qt(this.mouse.y-8)}setHover(t,e){this.hoverEl&&this.hoverEl!==e&&this.hoverEl.classList.remove("bf-hover"),this.hover=t,this.hoverEl=e,e&&t&&e.classList.add("bf-hover"),this.updateTooltip()}updateTooltip(){let t=null,e=null;if(!this.held&&!this.drag)if(this.hover){let l=this.slotId(this.hover);l&&(t=Le[l].display,e=Dx[Le[l].cat])}else this.hoverTab>=0&&(t=Wi[this.hoverTab].tip);if(!t){this.tip.classList.remove("bf-on"),this.tipTarget=null;return}let n=t+"|"+e;if(this.tipTarget!==n){this.tipTarget=n,this.tip.textContent="";let l=document.createElement("div");if(l.textContent=t,this.tip.appendChild(l),e){let c=document.createElement("div");c.className="bf-c-gray",c.textContent=e,this.tip.appendChild(c)}}this.tip.classList.add("bf-on");let s=kn(),r=Math.ceil(this.tip.offsetWidth/s.u),o=this.mouse.x+12,a=this.mouse.y-12;o+r>s.gw-2&&(o=Math.max(2,this.mouse.x-16-r)),a=Math.max(2,Math.min(s.gh-26,a)),this.tip.style.left=Qt(o),this.tip.style.top=Qt(a)}slotId(t){var e,n;return t.kind==="grid"?(e=this.items[this.scroll*Gi+t.index])!=null?e:0:(n=this.hotbar.slots[t.index])!=null?n:0}toGui(t){let e=kn().u;return{x:Math.floor(t.clientX/e),y:Math.floor(t.clientY/e)}}hit(t,e){let n=document.elementFromPoint(t,e);if(!n||!this.root.contains(n))return{k:"outside",el:null};let s=n.closest("[data-k]");return s&&this.root.contains(s)?{k:s.dataset.k,el:s}:n===this.search?{k:"search",el:n}:this.panel.contains(n)?{k:"panel",el:null}:{k:"outside",el:null}}trackHover(t,e){let{k:n,el:s}=this.hit(t,e);this.hoverTab=n[0]==="t"&&n!=="track"?Number(n.slice(1)):-1,n[0]==="g"?this.setHover({kind:"grid",index:Number(n.slice(1))},s):n[0]==="h"?this.setHover({kind:"hotbar",index:Number(n.slice(1))},s):this.setHover(null,null)}onDown(t){var o,a;if(!this._open)return;let e=this.toGui(t);this.mouse=e;let{k:n,el:s}=this.hit(t.clientX,t.clientY);if(n==="search")return;if(t.preventDefault(),n==="close"){this.close();return}if(document.activeElement===this.search&&Wi[this.tab].key!=="search"&&this.search.blur(),n==="track"){this.thumbDrag=t.pointerId;try{this.root.setPointerCapture(t.pointerId)}catch{}this.scrollToPointer(e.y);return}if(n[0]==="t"){this.selectTab(Number(n.slice(1)));return}let r=t.button===2;if(!(t.button!==0&&!r)){if(n[0]==="g"){let l=Number(n.slice(1)),c=(o=this.items[this.scroll*Gi+l])!=null?o:0;if(t.shiftKey&&c){let h=this.hotbar.firstFree();this.hotbar.set(h>=0?h:this.hotbar.selected,c)}else c?this.held&&this.held!==c&&!r?this.held=c:(this.held=c,this.drag={from:"grid",index:l,id:c,x:t.clientX,y:t.clientY,moved:!1,pointer:t.pointerId}):this.held=0}else if(n[0]==="h"){let l=Number(n.slice(1)),c=(a=this.hotbar.slots[l])!=null?a:0;t.shiftKey||r?this.hotbar.set(l,0):this.held?(this.hotbar.set(l,this.held),this.held=c):c&&(this.hotbar.set(l,0),this.held=c,this.drag={from:"hotbar",index:l,id:c,x:t.clientX,y:t.clientY,moved:!1,pointer:t.pointerId})}else n==="outside"&&(this.held=0);if(this.drag)try{this.root.setPointerCapture(t.pointerId)}catch{}this.renderHeld(),s&&this.trackHover(t.clientX,t.clientY)}}onMove(t){if(this._open){if(this.mouse=this.toGui(t),this.thumbDrag===t.pointerId){this.scrollToPointer(this.mouse.y);return}if(this.drag&&t.pointerId===this.drag.pointer&&!this.drag.moved){let e=kn().u;Math.hypot(t.clientX-this.drag.x,t.clientY-this.drag.y)>3*e&&(this.drag.moved=!0)}this.held&&this.placeHeld(),this.trackHover(t.clientX,t.clientY)}}onUp(t){var s;if(!this._open)return;if(this.thumbDrag===t.pointerId){this.thumbDrag=null;return}let e=this.drag;if(!e||e.pointer!==t.pointerId)return;if(this.drag=null,!e.moved){this.renderHeld();return}let{k:n}=this.hit(t.clientX,t.clientY);if(n[0]==="h"){let r=Number(n.slice(1));e.from==="hotbar"&&e.index!==r&&this.hotbar.set(e.index,(s=this.hotbar.slots[r])!=null?s:0),this.hotbar.set(r,e.id)}this.held=0,this.renderHeld(),this.trackHover(t.clientX,t.clientY)}onWheel(t){if(this._open)if(t.preventDefault(),t.deltaMode===0){this.wheelAcc+=t.deltaY;let e=Math.trunc(this.wheelAcc/50);e&&(this.wheelAcc-=e*50,this.setScroll(this.scroll+e))}else t.deltaY&&this.setScroll(this.scroll+Math.sign(t.deltaY))}scrollToPointer(t){let n=kn().cy-68,s=(t-n-18-7)/D0;this.setScroll(Math.max(0,Math.min(1,s))*this.maxScroll())}};var Bx={jump:'<path d="M12 4l7 8h-4v7H9v-7H5z"/>',sneak:'<path d="M12 20l-7-8h4V5h6v7h4z"/>',fly:'<path d="M3 14c4-1 6-4 9-9 1 4 0 8-3 11 3 0 6-1 9-4-1 5-6 8-12 8z"/>',break:'<path d="M4 6c4-3 10-3 15 1l-2 2c-1-1-3-2-5-2l-7 13-2-1 6-13c-2 0-3 1-4 2z"/>',place:'<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 5.3L6.5 8.4 12 11.5l5.5-3.1zM6 10.2v5.2l5 2.8v-5.2zm12 0l-5 2.8v5.2l5-2.8z"/>',pick:'<path d="M17 3l4 4-3 3-1-1-7 7H7v-3l7-7-1-1zM5 19h3v2H3v-5h2z"/>',inventory:'<path d="M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z"/>',pause:'<path d="M6 4h4v16H6zm8 0h4v16h-4z"/>',prev:'<path d="M15 4l-8 8 8 8z"/>',next:'<path d="M9 4l8 8-8 8z"/>'},Fx=`
.bf-touch{position:fixed;inset:0;z-index:15;touch-action:none;user-select:none;-webkit-user-select:none;
  -webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;display:none;--s:1}
.bf-touch.on{display:block}
.bf-touch .bt{position:absolute;width:calc(var(--s)*clamp(48px,13vmin,84px));height:calc(var(--s)*clamp(48px,13vmin,84px));
  border-radius:18%;background:rgba(20,20,24,.42);border:2px solid rgba(255,255,255,.38);box-shadow:inset 0 -3px 0 rgba(0,0,0,.35);
  display:flex;align-items:center;justify-content:center;touch-action:none}
.bf-touch .bt svg{width:58%;height:58%;fill:rgba(255,255,255,.92);filter:drop-shadow(1px 1px 0 rgba(0,0,0,.6))}
.bf-touch .bt.down{background:rgba(255,255,255,.32);border-color:#fff}
.bf-touch .bt.latched{background:rgba(120,200,255,.35);border-color:#bfe6ff}
.bf-touch .bt.small{width:calc(var(--s)*clamp(40px,10vmin,60px));height:calc(var(--s)*clamp(40px,10vmin,60px))}
.bf-touch .stick{position:absolute;width:calc(var(--s)*clamp(110px,30vmin,170px));height:calc(var(--s)*clamp(110px,30vmin,170px));
  border-radius:50%;background:rgba(20,20,24,.28);border:2px solid rgba(255,255,255,.3);transform:translate(-50%,-50%);pointer-events:none}
.bf-touch .knob{position:absolute;left:50%;top:50%;width:42%;height:42%;border-radius:50%;background:rgba(255,255,255,.45);
  border:2px solid rgba(255,255,255,.75);transform:translate(-50%,-50%)}
.bf-touch .stick.idle{opacity:.55}
.bf-touch .hint{position:absolute;left:50%;top:max(10px,env(safe-area-inset-top));transform:translateX(-50%);
  color:#fff;font:14px BlockForge,monospace;text-shadow:2px 2px 0 #000;opacity:.85;pointer-events:none;text-align:center;
  transition:opacity 1s}
`,fc=class{constructor(t,e,n,s,r){this.buttons=new Map;this.tracks=new Map;this.keys=new Set;this.stickHome={x:0,y:0};this.sneakLatched=!1;this.enabled=!1;this.longPress=null;this.sens=1;if(this.input=e,this.hotbar=n,this.hooks=r,!document.getElementById("bf-touch-css")){let a=document.createElement("style");a.id="bf-touch-css",a.textContent=Fx,document.head.appendChild(a)}let o=document.createElement("div");o.className="bf-touch",this.el=o,this.stick=document.createElement("div"),this.stick.className="stick idle",this.knob=document.createElement("div"),this.knob.className="knob",this.stick.appendChild(this.knob),o.appendChild(this.stick),this.hint=document.createElement("div"),this.hint.className="hint",this.hint.textContent="Left thumb moves. Drag right side to look. Tap to place, hold to break.",o.appendChild(this.hint),this.addButton("pause","small",{top:"max(10px,env(safe-area-inset-top))",right:"max(10px,env(safe-area-inset-right))"}),this.addButton("inventory","small",{top:"max(10px,env(safe-area-inset-top))",right:"calc(max(10px,env(safe-area-inset-right)) + var(--s)*clamp(48px,12vmin,72px))"}),this.addButton("jump","",{right:"calc(max(14px,env(safe-area-inset-right)) + 2vmin)",bottom:"calc(var(--s)*clamp(64px,16vmin,110px))"}),this.addButton("sneak","",{right:"calc(max(14px,env(safe-area-inset-right)) + var(--s)*clamp(56px,15vmin,98px) + 2vmin)",bottom:"calc(var(--s)*clamp(40px,9vmin,70px))"}),this.addButton("fly","small",{right:"calc(max(14px,env(safe-area-inset-right)) + 2vmin)",bottom:"calc(var(--s)*clamp(64px,16vmin,110px) + var(--s)*clamp(56px,15vmin,98px))"}),this.addButton("break","",{right:"calc(max(14px,env(safe-area-inset-right)) + 2vmin)",bottom:"calc(var(--s)*clamp(64px,16vmin,110px) + var(--s)*clamp(56px,15vmin,98px)*2)"}),this.addButton("place","",{right:"calc(max(14px,env(safe-area-inset-right)) + var(--s)*clamp(56px,15vmin,98px) + 2vmin)",bottom:"calc(var(--s)*clamp(64px,16vmin,110px) + var(--s)*clamp(56px,15vmin,98px)*2)"}),this.addButton("pick","small",{right:"calc(max(14px,env(safe-area-inset-right)) + var(--s)*clamp(56px,15vmin,98px)*2 + 2vmin)",bottom:"calc(var(--s)*clamp(64px,16vmin,110px) + var(--s)*clamp(56px,15vmin,98px)*2)"}),o.addEventListener("pointerdown",a=>this.onDown(a)),o.addEventListener("pointermove",a=>this.onMove(a)),o.addEventListener("pointerup",a=>this.onUp(a)),o.addEventListener("pointercancel",a=>this.onUp(a)),o.addEventListener("contextmenu",a=>a.preventDefault()),t.appendChild(o),this.applySettings(s),this.placeStickHome(),window.addEventListener("resize",()=>this.placeStickHome())}addButton(t,e,n){var r;let s=document.createElement("div");s.className=`bt ${e}`.trim(),s.dataset.btn=t,s.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true">${(r=Bx[t])!=null?r:""}</svg>`,s.setAttribute("aria-label",t);for(let[o,a]of Object.entries(n))s.style[o]=a;this.el.appendChild(s),this.buttons.set(t,s)}placeStickHome(){let t=innerWidth,e=innerHeight,n=Math.min(Math.max(110,Math.min(t,e)*.3),170)/2;this.stickHome={x:Math.max(24,t*.05)+n*1.15,y:e-Math.max(24,e*.06)-n*1.25},this.tracksHas("stick")||this.showStick(this.stickHome.x,this.stickHome.y,0,0,!0)}tracksHas(t){for(let e of this.tracks.values())if(e.role===t)return!0;return!1}applySettings(t){var e,n;this.sens=(e=t.touchSensitivity)!=null?e:1,this.el.style.setProperty("--s",String((n=t.touchButtonScale)!=null?n:1))}setEnabled(t){t!==this.enabled&&(this.enabled=t,this.el.classList.toggle("on",t),t?(this.hint.style.opacity="0.85",setTimeout(()=>{this.hint.style.opacity="0"},6e3)):this.releaseAll())}get isEnabled(){return this.enabled}key(t,e){e!==this.keys.has(t)&&(e?this.keys.add(t):this.keys.delete(t),this.input.setAction(t,e))}releaseAll(){for(let t of Array.from(this.keys))this.key(t,!1);this.tracks.clear(),this.sneakLatched=!1,this.buttons.forEach(t=>t.classList.remove("down","latched")),this.longPress=null,this.showStick(this.stickHome.x,this.stickHome.y,0,0,!0)}stickRadius(){return this.stick.getBoundingClientRect().width/2||60}onDown(t){var r;if(!this.enabled)return;t.preventDefault();try{this.el.setPointerCapture(t.pointerId)}catch{}let e=t.target.closest(".bt"),n=performance.now();if(!e)for(let o of document.elementsFromPoint(t.clientX,t.clientY)){let a=(r=o.dataset)==null?void 0:r.slot;if(a!==void 0&&o.closest(".bf-hotbar, .bf-hud, [data-slot]")){this.hotbar.select(Number(a));return}}if(e){let o=e.dataset.btn;this.tracks.set(t.pointerId,{role:o,x:t.clientX,y:t.clientY,sx:t.clientX,sy:t.clientY,t:n,moved:!1}),e.classList.add("down"),this.buttonDown(o);return}if(t.clientX<innerWidth*.42&&t.clientY>innerHeight*.3&&!this.tracksHas("stick")){this.tracks.set(t.pointerId,{role:"stick",x:t.clientX,y:t.clientY,sx:t.clientX,sy:t.clientY,t:n,moved:!1}),this.showStick(t.clientX,t.clientY,0,0,!1);return}this.tracks.set(t.pointerId,{role:"look",x:t.clientX,y:t.clientY,sx:t.clientX,sy:t.clientY,t:n,moved:!1}),this.longPress||(this.longPress={id:t.pointerId,fired:!1})}onMove(t){var r;let e=this.tracks.get(t.pointerId);if(!e||!this.enabled)return;t.preventDefault();let n=t.clientX-e.x,s=t.clientY-e.y;e.x=t.clientX,e.y=t.clientY,Math.hypot(e.x-e.sx,e.y-e.sy)>12&&(e.moved=!0),e.role==="stick"?this.updateStick(e):e.role==="look"&&(this.input.mouseDX+=n*2.2*this.sens,this.input.mouseDY+=s*2.2*this.sens,e.moved&&((r=this.longPress)==null?void 0:r.id)===t.pointerId&&!this.longPress.fired&&(this.longPress=null))}onUp(t){var n;let e=this.tracks.get(t.pointerId);if(e){if(this.tracks.delete(t.pointerId),e.role==="stick"){for(let s of["forward","left","back","right","sprint"])this.key(s,!1);this.showStick(this.stickHome.x,this.stickHome.y,0,0,!0);return}if(e.role==="look"){let s=this.longPress;s&&s.id===t.pointerId&&(s.fired?this.key("attack",!1):!e.moved&&performance.now()-e.t<350&&this.input.tapAction("use"),this.longPress=null);return}(n=this.buttons.get(e.role))==null||n.classList.remove("down"),this.buttonUp(e.role)}}showStick(t,e,n,s,r){this.stick.style.left=`${t}px`,this.stick.style.top=`${e}px`,this.knob.style.transform=`translate(calc(-50% + ${n}px), calc(-50% + ${s}px))`,this.stick.classList.toggle("idle",r)}updateStick(t){let e=this.stickRadius(),n=t.x-t.sx,s=t.y-t.sy,r=Math.hypot(n,s);r>e&&(t.sx+=n/r*(r-e),t.sy+=s/r*(r-e),n=t.x-t.sx,s=t.y-t.sy);let o=n/e,a=s/e;this.showStick(t.sx,t.sy,n,s,!1);let l=.28;this.key("forward",a<-l),this.key("back",a>l),this.key("left",o<-l),this.key("right",o>l),this.key("sprint",a<-.88&&Math.abs(o)<.55)}buttonDown(t){switch(t){case"jump":this.key("jump",!0);break;case"sneak":this.hooks.isFlying()?this.key("sneak",!0):(this.sneakLatched=!this.sneakLatched,this.key("sneak",this.sneakLatched),this.buttons.get("sneak").classList.toggle("latched",this.sneakLatched));break;case"fly":this.hooks.toggleFly();break;case"break":this.key("attack",!0);break;case"place":this.key("use",!0);break;case"pick":this.input.tapAction("pick");break;case"inventory":this.releaseAll(),this.hooks.openInventory();break;case"pause":this.releaseAll(),this.hooks.pause();break;case"prev":this.hotbar.scroll(-1);break;case"next":this.hotbar.scroll(1);break}}buttonUp(t){switch(t){case"jump":this.key("jump",!1);break;case"sneak":this.sneakLatched||this.key("sneak",!1);break;case"break":this.key("attack",!1);break;case"place":this.key("use",!1);break}}update(t){if(!this.enabled)return;let e=this.longPress;if(e&&!e.fired){let n=this.tracks.get(e.id);if(!n)this.longPress=null;else if(!n.moved&&performance.now()-n.t>380&&(e.fired=!0,this.key("attack",!0),navigator.vibrate))try{navigator.vibrate(12)}catch{}}}dispose(){this.releaseAll(),this.el.remove()}};var Rf="162";var Ox=0,B0=1,zx=2;var l1=1,Hx=2,ds=3,yn=0,zn=1,nn=2,li=0,gs=1,Oo=2,F0=3,O0=4,Gx=5,kr=100,Wx=101,Vx=102,z0=103,H0=104,$x=200,qx=201,Xx=202,Yx=203,qd=204,Xd=205,Kx=206,Zx=207,Jx=208,jx=209,Qx=210,tw=211,ew=212,nw=213,iw=214,sw=0,rw=1,ow=2,Fc=3,aw=4,lw=5,cw=6,hw=7,c1=0,uw=1,dw=2,Ys=0,fw=1,pw=2,mw=3,gw=4,bw=5,yw=6,vw=7;var h1=300,zo=301,Ho=302,Yd=303,Kd=304,rh=306,Zd=1e3,ge=1001,Jd=1002,ue=1003,G0=1004;var Cr=1005;var De=1006,fd=1007;var Pr=1008;var sn=1009,_w=1010,xw=1011,Xa=1012,u1=1013,qi=1014,ps=1015,Ur=1016,d1=1017,f1=1018,Lr=1020,ww=1021,Fe=1023,Mw=1024,Sw=1025,Ir=1026,Go=1027,Aw=1028,p1=1029,Ew=1030,m1=1031,g1=1033,pd=33776,md=33777,gd=33778,bd=33779,W0=35840,V0=35841,$0=35842,q0=35843,b1=36196,X0=37492,Y0=37496,K0=37808,Z0=37809,J0=37810,j0=37811,Q0=37812,tg=37813,eg=37814,ng=37815,ig=37816,sg=37817,rg=37818,og=37819,ag=37820,lg=37821,yd=36492,cg=36494,hg=36495,Tw=36283,ug=36284,dg=36285,fg=36286;var Oc=2300,zc=2301,vd=2302,pg=2400,mg=2401,gg=2402;var kw=3200,Cw=3201,Rw=0,Pw=1,Xs="",Vi="srgb",Yi="srgb-linear",Pf="display-p3",oh="display-p3-linear",Hc="linear",Ae="srgb",Gc="rec709",Wc="p3";var yo=7680;var bg=519,Lw=512,Iw=513,Uw=514,y1=515,Dw=516,Nw=517,Bw=518,Fw=519,yg=35044,v1=35048;var vg="300 es",jd=1035,ms=2e3,Vc=2001,Ks=class{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){if(this._listeners===void 0)return!1;let n=this._listeners;return n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){if(this._listeners===void 0)return;let s=this._listeners[t];if(s!==void 0){let r=s.indexOf(e);r!==-1&&s.splice(r,1)}}dispatchEvent(t){if(this._listeners===void 0)return;let n=this._listeners[t.type];if(n!==void 0){t.target=this;let s=n.slice(0);for(let r=0,o=s.length;r<o;r++)s[r].call(this,t);t.target=null}}},gn=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];var _d=Math.PI/180,Qd=180/Math.PI;function Ya(){let i=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(gn[i&255]+gn[i>>8&255]+gn[i>>16&255]+gn[i>>24&255]+"-"+gn[t&255]+gn[t>>8&255]+"-"+gn[t>>16&15|64]+gn[t>>24&255]+"-"+gn[e&63|128]+gn[e>>8&255]+"-"+gn[e>>16&255]+gn[e>>24&255]+gn[n&255]+gn[n>>8&255]+gn[n>>16&255]+gn[n>>24&255]).toLowerCase()}function On(i,t,e){return Math.max(t,Math.min(e,i))}function Ow(i,t){return(i%t+t)%t}function xd(i,t,e){return(1-e)*i+e*t}function _g(i){return(i&i-1)===0&&i!==0}function tf(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function Fa(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function Fn(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}var Bt=class i{constructor(t=0,e=0){i.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){let e=this.x,n=this.y,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6],this.y=s[1]*e+s[4]*n+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(On(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){let n=Math.cos(e),s=Math.sin(e),r=this.x-t.x,o=this.y-t.y;return this.x=r*n-o*s+t.x,this.y=r*s+o*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},ee=class i{constructor(t,e,n,s,r,o,a,l,c){i.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,o,a,l,c)}set(t,e,n,s,r,o,a,l,c){let h=this.elements;return h[0]=t,h[1]=s,h[2]=a,h[3]=e,h[4]=r,h[5]=l,h[6]=n,h[7]=o,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){let e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,s=e.elements,r=this.elements,o=n[0],a=n[3],l=n[6],c=n[1],h=n[4],u=n[7],f=n[2],d=n[5],g=n[8],b=s[0],p=s[3],m=s[6],v=s[1],y=s[4],_=s[7],w=s[2],S=s[5],A=s[8];return r[0]=o*b+a*v+l*w,r[3]=o*p+a*y+l*S,r[6]=o*m+a*_+l*A,r[1]=c*b+h*v+u*w,r[4]=c*p+h*y+u*S,r[7]=c*m+h*_+u*A,r[2]=f*b+d*v+g*w,r[5]=f*p+d*y+g*S,r[8]=f*m+d*_+g*A,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],l=t[6],c=t[7],h=t[8];return e*o*h-e*a*c-n*r*h+n*a*l+s*r*c-s*o*l}invert(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],l=t[6],c=t[7],h=t[8],u=h*o-a*c,f=a*l-h*r,d=c*r-o*l,g=e*u+n*f+s*d;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);let b=1/g;return t[0]=u*b,t[1]=(s*c-h*n)*b,t[2]=(a*n-s*o)*b,t[3]=f*b,t[4]=(h*e-s*l)*b,t[5]=(s*r-a*e)*b,t[6]=d*b,t[7]=(n*l-c*e)*b,t[8]=(o*e-n*r)*b,this}transpose(){let t,e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){let e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,s,r,o,a){let l=Math.cos(r),c=Math.sin(r);return this.set(n*l,n*c,-n*(l*o+c*a)+o+t,-s*c,s*l,-s*(-c*o+l*a)+a+e,0,0,1),this}scale(t,e){return this.premultiply(wd.makeScale(t,e)),this}rotate(t){return this.premultiply(wd.makeRotation(-t)),this}translate(t,e){return this.premultiply(wd.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){let e=this.elements,n=t.elements;for(let s=0;s<9;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}},wd=new ee;function _1(i){for(let t=i.length-1;t>=0;--t)if(i[t]>=65535)return!0;return!1}function $c(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function zw(){let i=$c("canvas");return i.style.display="block",i}var xg={};function Hw(i){i in xg||(xg[i]=!0,console.warn(i))}var wg=new ee().set(.8224621,.177538,0,.0331941,.9668058,0,.0170827,.0723974,.9105199),Mg=new ee().set(1.2249401,-.2249404,0,-.0420569,1.0420571,0,-.0196376,-.0786361,1.0982735),pc={[Yi]:{transfer:Hc,primaries:Gc,toReference:i=>i,fromReference:i=>i},[Vi]:{transfer:Ae,primaries:Gc,toReference:i=>i.convertSRGBToLinear(),fromReference:i=>i.convertLinearToSRGB()},[oh]:{transfer:Hc,primaries:Wc,toReference:i=>i.applyMatrix3(Mg),fromReference:i=>i.applyMatrix3(wg)},[Pf]:{transfer:Ae,primaries:Wc,toReference:i=>i.convertSRGBToLinear().applyMatrix3(Mg),fromReference:i=>i.applyMatrix3(wg).convertLinearToSRGB()}},Gw=new Set([Yi,oh]),fe={enabled:!0,_workingColorSpace:Yi,get workingColorSpace(){return this._workingColorSpace},set workingColorSpace(i){if(!Gw.has(i))throw new Error(`Unsupported working color space, "${i}".`);this._workingColorSpace=i},convert:function(i,t,e){if(this.enabled===!1||t===e||!t||!e)return i;let n=pc[t].toReference,s=pc[e].fromReference;return s(n(i))},fromWorkingColorSpace:function(i,t){return this.convert(i,this._workingColorSpace,t)},toWorkingColorSpace:function(i,t){return this.convert(i,t,this._workingColorSpace)},getPrimaries:function(i){return pc[i].primaries},getTransfer:function(i){return i===Xs?Hc:pc[i].transfer}};function Bo(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Md(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}var vo,qc=class{static getDataURL(t){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement=="undefined")return t.src;let e;if(t instanceof HTMLCanvasElement)e=t;else{vo===void 0&&(vo=$c("canvas")),vo.width=t.width,vo.height=t.height;let n=vo.getContext("2d");t instanceof ImageData?n.putImageData(t,0,0):n.drawImage(t,0,0,t.width,t.height),e=vo}return e.width>2048||e.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",t),e.toDataURL("image/jpeg",.6)):e.toDataURL("image/png")}static sRGBToLinear(t){if(typeof HTMLImageElement!="undefined"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement!="undefined"&&t instanceof HTMLCanvasElement||typeof ImageBitmap!="undefined"&&t instanceof ImageBitmap){let e=$c("canvas");e.width=t.width,e.height=t.height;let n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);let s=n.getImageData(0,0,t.width,t.height),r=s.data;for(let o=0;o<r.length;o++)r[o]=Bo(r[o]/255)*255;return n.putImageData(s,0,0),e}else if(t.data){let e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(Bo(e[n]/255)*255):e[n]=Bo(e[n]);return{data:e,width:t.width,height:t.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}},Ww=0,Xc=class{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Ww++}),this.uuid=Ya(),this.data=t,this.dataReady=!0,this.version=0}set needsUpdate(t){t===!0&&this.version++}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];let n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let o=0,a=s.length;o<a;o++)s[o].isDataTexture?r.push(Sd(s[o].image)):r.push(Sd(s[o]))}else r=Sd(s);n.url=r}return e||(t.images[this.uuid]=n),n}};function Sd(i){return typeof HTMLImageElement!="undefined"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement!="undefined"&&i instanceof HTMLCanvasElement||typeof ImageBitmap!="undefined"&&i instanceof ImageBitmap?qc.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}var Vw=0,Yn=class i extends Ks{constructor(t=i.DEFAULT_IMAGE,e=i.DEFAULT_MAPPING,n=ge,s=ge,r=De,o=Pr,a=Fe,l=sn,c=i.DEFAULT_ANISOTROPY,h=Xs){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Vw++}),this.uuid=Ya(),this.name="",this.source=new Xc(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=o,this.anisotropy=c,this.format=a,this.internalFormat=null,this.type=l,this.offset=new Bt(0,0),this.repeat=new Bt(1,1),this.center=new Bt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new ee,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.needsPMREMUpdate=!1}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];let n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==h1)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case Zd:t.x=t.x-Math.floor(t.x);break;case ge:t.x=t.x<0?0:1;break;case Jd:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case Zd:t.y=t.y-Math.floor(t.y);break;case ge:t.y=t.y<0?0:1;break;case Jd:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}};Yn.DEFAULT_IMAGE=null;Yn.DEFAULT_MAPPING=h1;Yn.DEFAULT_ANISOTROPY=1;var un=class i{constructor(t=0,e=0,n=0,s=1){i.prototype.isVector4=!0,this.x=t,this.y=e,this.z=n,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,s){return this.x=t,this.y=e,this.z=n,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){let e=this.x,n=this.y,s=this.z,r=this.w,o=t.elements;return this.x=o[0]*e+o[4]*n+o[8]*s+o[12]*r,this.y=o[1]*e+o[5]*n+o[9]*s+o[13]*r,this.z=o[2]*e+o[6]*n+o[10]*s+o[14]*r,this.w=o[3]*e+o[7]*n+o[11]*s+o[15]*r,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);let e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,s,r,l=t.elements,c=l[0],h=l[4],u=l[8],f=l[1],d=l[5],g=l[9],b=l[2],p=l[6],m=l[10];if(Math.abs(h-f)<.01&&Math.abs(u-b)<.01&&Math.abs(g-p)<.01){if(Math.abs(h+f)<.1&&Math.abs(u+b)<.1&&Math.abs(g+p)<.1&&Math.abs(c+d+m-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;let y=(c+1)/2,_=(d+1)/2,w=(m+1)/2,S=(h+f)/4,A=(u+b)/4,R=(g+p)/4;return y>_&&y>w?y<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(y),s=S/n,r=A/n):_>w?_<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(_),n=S/s,r=R/s):w<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(w),n=A/r,s=R/r),this.set(n,s,r,e),this}let v=Math.sqrt((p-g)*(p-g)+(u-b)*(u-b)+(f-h)*(f-h));return Math.abs(v)<.001&&(v=1),this.x=(p-g)/v,this.y=(u-b)/v,this.z=(f-h)/v,this.w=Math.acos((c+d+m-1)/2),this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this.w=Math.max(t.w,Math.min(e.w,this.w)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this.w=Math.max(t,Math.min(e,this.w)),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},ef=class extends Ks{constructor(t=1,e=1,n={}){super(),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=1,this.scissor=new un(0,0,t,e),this.scissorTest=!1,this.viewport=new un(0,0,t,e);let s={width:t,height:e,depth:1};n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:De,depthBuffer:!0,stencilBuffer:!1,depthTexture:null,samples:0,count:1},n);let r=new Yn(s,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace);r.flipY=!1,r.generateMipmaps=n.generateMipmaps,r.internalFormat=n.internalFormat,this.textures=[];let o=n.count;for(let a=0;a<o;a++)this.textures[a]=r.clone(),this.textures[a].isRenderTargetTexture=!0;this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=t,this.textures[s].image.height=e,this.textures[s].image.depth=n;this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let n=0,s=t.textures.length;n<s;n++)this.textures[n]=t.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0;let e=Object.assign({},t.texture.image);return this.texture.source=new Xc(e),this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},Ln=class extends ef{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}},Yc=class extends Yn{constructor(t=null,e=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=ue,this.minFilter=ue,this.wrapR=ge,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var nf=class extends Yn{constructor(t=null,e=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=ue,this.minFilter=ue,this.wrapR=ge,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var Zs=class{constructor(t=0,e=0,n=0,s=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=s}static slerpFlat(t,e,n,s,r,o,a){let l=n[s+0],c=n[s+1],h=n[s+2],u=n[s+3],f=r[o+0],d=r[o+1],g=r[o+2],b=r[o+3];if(a===0){t[e+0]=l,t[e+1]=c,t[e+2]=h,t[e+3]=u;return}if(a===1){t[e+0]=f,t[e+1]=d,t[e+2]=g,t[e+3]=b;return}if(u!==b||l!==f||c!==d||h!==g){let p=1-a,m=l*f+c*d+h*g+u*b,v=m>=0?1:-1,y=1-m*m;if(y>Number.EPSILON){let w=Math.sqrt(y),S=Math.atan2(w,m*v);p=Math.sin(p*S)/w,a=Math.sin(a*S)/w}let _=a*v;if(l=l*p+f*_,c=c*p+d*_,h=h*p+g*_,u=u*p+b*_,p===1-a){let w=1/Math.sqrt(l*l+c*c+h*h+u*u);l*=w,c*=w,h*=w,u*=w}}t[e]=l,t[e+1]=c,t[e+2]=h,t[e+3]=u}static multiplyQuaternionsFlat(t,e,n,s,r,o){let a=n[s],l=n[s+1],c=n[s+2],h=n[s+3],u=r[o],f=r[o+1],d=r[o+2],g=r[o+3];return t[e]=a*g+h*u+l*d-c*f,t[e+1]=l*g+h*f+c*u-a*d,t[e+2]=c*g+h*d+a*f-l*u,t[e+3]=h*g-a*u-l*f-c*d,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,s){return this._x=t,this._y=e,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){let n=t._x,s=t._y,r=t._z,o=t._order,a=Math.cos,l=Math.sin,c=a(n/2),h=a(s/2),u=a(r/2),f=l(n/2),d=l(s/2),g=l(r/2);switch(o){case"XYZ":this._x=f*h*u+c*d*g,this._y=c*d*u-f*h*g,this._z=c*h*g+f*d*u,this._w=c*h*u-f*d*g;break;case"YXZ":this._x=f*h*u+c*d*g,this._y=c*d*u-f*h*g,this._z=c*h*g-f*d*u,this._w=c*h*u+f*d*g;break;case"ZXY":this._x=f*h*u-c*d*g,this._y=c*d*u+f*h*g,this._z=c*h*g+f*d*u,this._w=c*h*u-f*d*g;break;case"ZYX":this._x=f*h*u-c*d*g,this._y=c*d*u+f*h*g,this._z=c*h*g-f*d*u,this._w=c*h*u+f*d*g;break;case"YZX":this._x=f*h*u+c*d*g,this._y=c*d*u+f*h*g,this._z=c*h*g-f*d*u,this._w=c*h*u-f*d*g;break;case"XZY":this._x=f*h*u-c*d*g,this._y=c*d*u-f*h*g,this._z=c*h*g+f*d*u,this._w=c*h*u+f*d*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){let n=e/2,s=Math.sin(n);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){let e=t.elements,n=e[0],s=e[4],r=e[8],o=e[1],a=e[5],l=e[9],c=e[2],h=e[6],u=e[10],f=n+a+u;if(f>0){let d=.5/Math.sqrt(f+1);this._w=.25/d,this._x=(h-l)*d,this._y=(r-c)*d,this._z=(o-s)*d}else if(n>a&&n>u){let d=2*Math.sqrt(1+n-a-u);this._w=(h-l)/d,this._x=.25*d,this._y=(s+o)/d,this._z=(r+c)/d}else if(a>u){let d=2*Math.sqrt(1+a-n-u);this._w=(r-c)/d,this._x=(s+o)/d,this._y=.25*d,this._z=(l+h)/d}else{let d=2*Math.sqrt(1+u-n-a);this._w=(o-s)/d,this._x=(r+c)/d,this._y=(l+h)/d,this._z=.25*d}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<Number.EPSILON?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(On(this.dot(t),-1,1)))}rotateTowards(t,e){let n=this.angleTo(t);if(n===0)return this;let s=Math.min(1,e/n);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){let n=t._x,s=t._y,r=t._z,o=t._w,a=e._x,l=e._y,c=e._z,h=e._w;return this._x=n*h+o*a+s*c-r*l,this._y=s*h+o*l+r*a-n*c,this._z=r*h+o*c+n*l-s*a,this._w=o*h-n*a-s*l-r*c,this._onChangeCallback(),this}slerp(t,e){if(e===0)return this;if(e===1)return this.copy(t);let n=this._x,s=this._y,r=this._z,o=this._w,a=o*t._w+n*t._x+s*t._y+r*t._z;if(a<0?(this._w=-t._w,this._x=-t._x,this._y=-t._y,this._z=-t._z,a=-a):this.copy(t),a>=1)return this._w=o,this._x=n,this._y=s,this._z=r,this;let l=1-a*a;if(l<=Number.EPSILON){let d=1-e;return this._w=d*o+e*this._w,this._x=d*n+e*this._x,this._y=d*s+e*this._y,this._z=d*r+e*this._z,this.normalize(),this}let c=Math.sqrt(l),h=Math.atan2(c,a),u=Math.sin((1-e)*h)/c,f=Math.sin(e*h)/c;return this._w=o*u+this._w*f,this._x=n*u+this._x*f,this._y=s*u+this._y*f,this._z=r*u+this._z*f,this._onChangeCallback(),this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){let t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(t),s*Math.cos(t),r*Math.sin(e),r*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},V=class i{constructor(t=0,e=0,n=0){i.prototype.isVector3=!0,this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(Sg.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(Sg.setFromAxisAngle(t,e))}applyMatrix3(t){let e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[3]*n+r[6]*s,this.y=r[1]*e+r[4]*n+r[7]*s,this.z=r[2]*e+r[5]*n+r[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){let e=this.x,n=this.y,s=this.z,r=t.elements,o=1/(r[3]*e+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*e+r[4]*n+r[8]*s+r[12])*o,this.y=(r[1]*e+r[5]*n+r[9]*s+r[13])*o,this.z=(r[2]*e+r[6]*n+r[10]*s+r[14])*o,this}applyQuaternion(t){let e=this.x,n=this.y,s=this.z,r=t.x,o=t.y,a=t.z,l=t.w,c=2*(o*s-a*n),h=2*(a*e-r*s),u=2*(r*n-o*e);return this.x=e+l*c+o*u-a*h,this.y=n+l*h+a*c-r*u,this.z=s+l*u+r*h-o*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){let e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*s,this.y=r[1]*e+r[5]*n+r[9]*s,this.z=r[2]*e+r[6]*n+r[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){let n=t.x,s=t.y,r=t.z,o=e.x,a=e.y,l=e.z;return this.x=s*l-r*a,this.y=r*o-n*l,this.z=n*a-s*o,this}projectOnVector(t){let e=t.lengthSq();if(e===0)return this.set(0,0,0);let n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return Ad.copy(this).projectOnVector(t),this.sub(Ad)}reflect(t){return this.sub(Ad.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(On(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y,s=this.z-t.z;return e*e+n*n+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){let s=Math.sin(e)*t;return this.x=s*Math.sin(n),this.y=Math.cos(e)*t,this.z=s*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){let e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=s,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},Ad=new V,Sg=new Zs,Dr=class{constructor(t=new V(1/0,1/0,1/0),e=new V(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(xi.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(xi.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){let n=xi.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);let n=t.geometry;if(n!==void 0){let r=n.getAttribute("position");if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0)for(let o=0,a=r.count;o<a;o++)t.isMesh===!0?t.getVertexPosition(o,xi):xi.fromBufferAttribute(r,o),xi.applyMatrix4(t.matrixWorld),this.expandByPoint(xi);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),mc.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),mc.copy(n.boundingBox)),mc.applyMatrix4(t.matrixWorld),this.union(mc)}let s=t.children;for(let r=0,o=s.length;r<o;r++)this.expandByObject(s[r],e);return this}containsPoint(t){return!(t.x<this.min.x||t.x>this.max.x||t.y<this.min.y||t.y>this.max.y||t.z<this.min.z||t.z>this.max.z)}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return!(t.max.x<this.min.x||t.min.x>this.max.x||t.max.y<this.min.y||t.min.y>this.max.y||t.max.z<this.min.z||t.min.z>this.max.z)}intersectsSphere(t){return this.clampPoint(t.center,xi),xi.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(Oa),gc.subVectors(this.max,Oa),_o.subVectors(t.a,Oa),xo.subVectors(t.b,Oa),wo.subVectors(t.c,Oa),Hs.subVectors(xo,_o),Gs.subVectors(wo,xo),xr.subVectors(_o,wo);let e=[0,-Hs.z,Hs.y,0,-Gs.z,Gs.y,0,-xr.z,xr.y,Hs.z,0,-Hs.x,Gs.z,0,-Gs.x,xr.z,0,-xr.x,-Hs.y,Hs.x,0,-Gs.y,Gs.x,0,-xr.y,xr.x,0];return!Ed(e,_o,xo,wo,gc)||(e=[1,0,0,0,1,0,0,0,1],!Ed(e,_o,xo,wo,gc))?!1:(bc.crossVectors(Hs,Gs),e=[bc.x,bc.y,bc.z],Ed(e,_o,xo,wo,gc))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,xi).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(xi).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(as[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),as[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),as[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),as[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),as[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),as[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),as[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),as[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(as),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}},as=[new V,new V,new V,new V,new V,new V,new V,new V],xi=new V,mc=new Dr,_o=new V,xo=new V,wo=new V,Hs=new V,Gs=new V,xr=new V,Oa=new V,gc=new V,bc=new V,wr=new V;function Ed(i,t,e,n,s){for(let r=0,o=i.length-3;r<=o;r+=3){wr.fromArray(i,r);let a=s.x*Math.abs(wr.x)+s.y*Math.abs(wr.y)+s.z*Math.abs(wr.z),l=t.dot(wr),c=e.dot(wr),h=n.dot(wr);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>a)return!1}return!0}var $w=new Dr,za=new V,Td=new V,Xi=class{constructor(t=new V,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){let n=this.center;e!==void 0?n.copy(e):$w.setFromPoints(t).getCenter(n);let s=0;for(let r=0,o=t.length;r<o;r++)s=Math.max(s,n.distanceToSquared(t[r]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){let e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){let n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;za.subVectors(t,this.center);let e=za.lengthSq();if(e>this.radius*this.radius){let n=Math.sqrt(e),s=(n-this.radius)*.5;this.center.addScaledVector(za,s/n),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(Td.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(za.copy(t.center).add(Td)),this.expandByPoint(za.copy(t.center).sub(Td))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}},ls=new V,kd=new V,yc=new V,Ws=new V,Cd=new V,vc=new V,Rd=new V,Kc=class{constructor(t=new V,e=new V(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,ls)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);let n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){let e=ls.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(ls.copy(this.origin).addScaledVector(this.direction,e),ls.distanceToSquared(t))}distanceSqToSegment(t,e,n,s){kd.copy(t).add(e).multiplyScalar(.5),yc.copy(e).sub(t).normalize(),Ws.copy(this.origin).sub(kd);let r=t.distanceTo(e)*.5,o=-this.direction.dot(yc),a=Ws.dot(this.direction),l=-Ws.dot(yc),c=Ws.lengthSq(),h=Math.abs(1-o*o),u,f,d,g;if(h>0)if(u=o*l-a,f=o*a-l,g=r*h,u>=0)if(f>=-g)if(f<=g){let b=1/h;u*=b,f*=b,d=u*(u+o*f+2*a)+f*(o*u+f+2*l)+c}else f=r,u=Math.max(0,-(o*f+a)),d=-u*u+f*(f+2*l)+c;else f=-r,u=Math.max(0,-(o*f+a)),d=-u*u+f*(f+2*l)+c;else f<=-g?(u=Math.max(0,-(-o*r+a)),f=u>0?-r:Math.min(Math.max(-r,-l),r),d=-u*u+f*(f+2*l)+c):f<=g?(u=0,f=Math.min(Math.max(-r,-l),r),d=f*(f+2*l)+c):(u=Math.max(0,-(o*r+a)),f=u>0?r:Math.min(Math.max(-r,-l),r),d=-u*u+f*(f+2*l)+c);else f=o>0?-r:r,u=Math.max(0,-(o*f+a)),d=-u*u+f*(f+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,u),s&&s.copy(kd).addScaledVector(yc,f),d}intersectSphere(t,e){ls.subVectors(t.center,this.origin);let n=ls.dot(this.direction),s=ls.dot(ls)-n*n,r=t.radius*t.radius;if(s>r)return null;let o=Math.sqrt(r-s),a=n-o,l=n+o;return l<0?null:a<0?this.at(l,e):this.at(a,e)}intersectsSphere(t){return this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){let e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){let n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){let e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,s,r,o,a,l,c=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,f=this.origin;return c>=0?(n=(t.min.x-f.x)*c,s=(t.max.x-f.x)*c):(n=(t.max.x-f.x)*c,s=(t.min.x-f.x)*c),h>=0?(r=(t.min.y-f.y)*h,o=(t.max.y-f.y)*h):(r=(t.max.y-f.y)*h,o=(t.min.y-f.y)*h),n>o||r>s||((r>n||isNaN(n))&&(n=r),(o<s||isNaN(s))&&(s=o),u>=0?(a=(t.min.z-f.z)*u,l=(t.max.z-f.z)*u):(a=(t.max.z-f.z)*u,l=(t.min.z-f.z)*u),n>l||a>s)||((a>n||n!==n)&&(n=a),(l<s||s!==s)&&(s=l),s<0)?null:this.at(n>=0?n:s,e)}intersectsBox(t){return this.intersectBox(t,ls)!==null}intersectTriangle(t,e,n,s,r){Cd.subVectors(e,t),vc.subVectors(n,t),Rd.crossVectors(Cd,vc);let o=this.direction.dot(Rd),a;if(o>0){if(s)return null;a=1}else if(o<0)a=-1,o=-o;else return null;Ws.subVectors(this.origin,t);let l=a*this.direction.dot(vc.crossVectors(Ws,vc));if(l<0)return null;let c=a*this.direction.dot(Cd.cross(Ws));if(c<0||l+c>o)return null;let h=-a*Ws.dot(Rd);return h<0?null:this.at(h/o,r)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},de=class i{constructor(t,e,n,s,r,o,a,l,c,h,u,f,d,g,b,p){i.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,o,a,l,c,h,u,f,d,g,b,p)}set(t,e,n,s,r,o,a,l,c,h,u,f,d,g,b,p){let m=this.elements;return m[0]=t,m[4]=e,m[8]=n,m[12]=s,m[1]=r,m[5]=o,m[9]=a,m[13]=l,m[2]=c,m[6]=h,m[10]=u,m[14]=f,m[3]=d,m[7]=g,m[11]=b,m[15]=p,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new i().fromArray(this.elements)}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){let e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){let e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){let e=this.elements,n=t.elements,s=1/Mo.setFromMatrixColumn(t,0).length(),r=1/Mo.setFromMatrixColumn(t,1).length(),o=1/Mo.setFromMatrixColumn(t,2).length();return e[0]=n[0]*s,e[1]=n[1]*s,e[2]=n[2]*s,e[3]=0,e[4]=n[4]*r,e[5]=n[5]*r,e[6]=n[6]*r,e[7]=0,e[8]=n[8]*o,e[9]=n[9]*o,e[10]=n[10]*o,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){let e=this.elements,n=t.x,s=t.y,r=t.z,o=Math.cos(n),a=Math.sin(n),l=Math.cos(s),c=Math.sin(s),h=Math.cos(r),u=Math.sin(r);if(t.order==="XYZ"){let f=o*h,d=o*u,g=a*h,b=a*u;e[0]=l*h,e[4]=-l*u,e[8]=c,e[1]=d+g*c,e[5]=f-b*c,e[9]=-a*l,e[2]=b-f*c,e[6]=g+d*c,e[10]=o*l}else if(t.order==="YXZ"){let f=l*h,d=l*u,g=c*h,b=c*u;e[0]=f+b*a,e[4]=g*a-d,e[8]=o*c,e[1]=o*u,e[5]=o*h,e[9]=-a,e[2]=d*a-g,e[6]=b+f*a,e[10]=o*l}else if(t.order==="ZXY"){let f=l*h,d=l*u,g=c*h,b=c*u;e[0]=f-b*a,e[4]=-o*u,e[8]=g+d*a,e[1]=d+g*a,e[5]=o*h,e[9]=b-f*a,e[2]=-o*c,e[6]=a,e[10]=o*l}else if(t.order==="ZYX"){let f=o*h,d=o*u,g=a*h,b=a*u;e[0]=l*h,e[4]=g*c-d,e[8]=f*c+b,e[1]=l*u,e[5]=b*c+f,e[9]=d*c-g,e[2]=-c,e[6]=a*l,e[10]=o*l}else if(t.order==="YZX"){let f=o*l,d=o*c,g=a*l,b=a*c;e[0]=l*h,e[4]=b-f*u,e[8]=g*u+d,e[1]=u,e[5]=o*h,e[9]=-a*h,e[2]=-c*h,e[6]=d*u+g,e[10]=f-b*u}else if(t.order==="XZY"){let f=o*l,d=o*c,g=a*l,b=a*c;e[0]=l*h,e[4]=-u,e[8]=c*h,e[1]=f*u+b,e[5]=o*h,e[9]=d*u-g,e[2]=g*u-d,e[6]=a*h,e[10]=b*u+f}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(qw,t,Xw)}lookAt(t,e,n){let s=this.elements;return qn.subVectors(t,e),qn.lengthSq()===0&&(qn.z=1),qn.normalize(),Vs.crossVectors(n,qn),Vs.lengthSq()===0&&(Math.abs(n.z)===1?qn.x+=1e-4:qn.z+=1e-4,qn.normalize(),Vs.crossVectors(n,qn)),Vs.normalize(),_c.crossVectors(qn,Vs),s[0]=Vs.x,s[4]=_c.x,s[8]=qn.x,s[1]=Vs.y,s[5]=_c.y,s[9]=qn.y,s[2]=Vs.z,s[6]=_c.z,s[10]=qn.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,s=e.elements,r=this.elements,o=n[0],a=n[4],l=n[8],c=n[12],h=n[1],u=n[5],f=n[9],d=n[13],g=n[2],b=n[6],p=n[10],m=n[14],v=n[3],y=n[7],_=n[11],w=n[15],S=s[0],A=s[4],R=s[8],P=s[12],x=s[1],T=s[5],D=s[9],U=s[13],k=s[2],B=s[6],F=s[10],I=s[14],N=s[3],z=s[7],et=s[11],nt=s[15];return r[0]=o*S+a*x+l*k+c*N,r[4]=o*A+a*T+l*B+c*z,r[8]=o*R+a*D+l*F+c*et,r[12]=o*P+a*U+l*I+c*nt,r[1]=h*S+u*x+f*k+d*N,r[5]=h*A+u*T+f*B+d*z,r[9]=h*R+u*D+f*F+d*et,r[13]=h*P+u*U+f*I+d*nt,r[2]=g*S+b*x+p*k+m*N,r[6]=g*A+b*T+p*B+m*z,r[10]=g*R+b*D+p*F+m*et,r[14]=g*P+b*U+p*I+m*nt,r[3]=v*S+y*x+_*k+w*N,r[7]=v*A+y*T+_*B+w*z,r[11]=v*R+y*D+_*F+w*et,r[15]=v*P+y*U+_*I+w*nt,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[4],s=t[8],r=t[12],o=t[1],a=t[5],l=t[9],c=t[13],h=t[2],u=t[6],f=t[10],d=t[14],g=t[3],b=t[7],p=t[11],m=t[15];return g*(+r*l*u-s*c*u-r*a*f+n*c*f+s*a*d-n*l*d)+b*(+e*l*d-e*c*f+r*o*f-s*o*d+s*c*h-r*l*h)+p*(+e*c*u-e*a*d-r*o*u+n*o*d+r*a*h-n*c*h)+m*(-s*a*h-e*l*u+e*a*f+s*o*u-n*o*f+n*l*h)}transpose(){let t=this.elements,e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){let s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=e,s[14]=n),this}invert(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],l=t[6],c=t[7],h=t[8],u=t[9],f=t[10],d=t[11],g=t[12],b=t[13],p=t[14],m=t[15],v=u*p*c-b*f*c+b*l*d-a*p*d-u*l*m+a*f*m,y=g*f*c-h*p*c-g*l*d+o*p*d+h*l*m-o*f*m,_=h*b*c-g*u*c+g*a*d-o*b*d-h*a*m+o*u*m,w=g*u*l-h*b*l-g*a*f+o*b*f+h*a*p-o*u*p,S=e*v+n*y+s*_+r*w;if(S===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let A=1/S;return t[0]=v*A,t[1]=(b*f*r-u*p*r-b*s*d+n*p*d+u*s*m-n*f*m)*A,t[2]=(a*p*r-b*l*r+b*s*c-n*p*c-a*s*m+n*l*m)*A,t[3]=(u*l*r-a*f*r-u*s*c+n*f*c+a*s*d-n*l*d)*A,t[4]=y*A,t[5]=(h*p*r-g*f*r+g*s*d-e*p*d-h*s*m+e*f*m)*A,t[6]=(g*l*r-o*p*r-g*s*c+e*p*c+o*s*m-e*l*m)*A,t[7]=(o*f*r-h*l*r+h*s*c-e*f*c-o*s*d+e*l*d)*A,t[8]=_*A,t[9]=(g*u*r-h*b*r-g*n*d+e*b*d+h*n*m-e*u*m)*A,t[10]=(o*b*r-g*a*r+g*n*c-e*b*c-o*n*m+e*a*m)*A,t[11]=(h*a*r-o*u*r-h*n*c+e*u*c+o*n*d-e*a*d)*A,t[12]=w*A,t[13]=(h*b*s-g*u*s+g*n*f-e*b*f-h*n*p+e*u*p)*A,t[14]=(g*a*s-o*b*s-g*n*l+e*b*l+o*n*p-e*a*p)*A,t[15]=(o*u*s-h*a*s+h*n*l-e*u*l-o*n*f+e*a*f)*A,this}scale(t){let e=this.elements,n=t.x,s=t.y,r=t.z;return e[0]*=n,e[4]*=s,e[8]*=r,e[1]*=n,e[5]*=s,e[9]*=r,e[2]*=n,e[6]*=s,e[10]*=r,e[3]*=n,e[7]*=s,e[11]*=r,this}getMaxScaleOnAxis(){let t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,s))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){let e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){let n=Math.cos(e),s=Math.sin(e),r=1-n,o=t.x,a=t.y,l=t.z,c=r*o,h=r*a;return this.set(c*o+n,c*a-s*l,c*l+s*a,0,c*a+s*l,h*a+n,h*l-s*o,0,c*l-s*a,h*l+s*o,r*l*l+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,s,r,o){return this.set(1,n,r,0,t,1,o,0,e,s,1,0,0,0,0,1),this}compose(t,e,n){let s=this.elements,r=e._x,o=e._y,a=e._z,l=e._w,c=r+r,h=o+o,u=a+a,f=r*c,d=r*h,g=r*u,b=o*h,p=o*u,m=a*u,v=l*c,y=l*h,_=l*u,w=n.x,S=n.y,A=n.z;return s[0]=(1-(b+m))*w,s[1]=(d+_)*w,s[2]=(g-y)*w,s[3]=0,s[4]=(d-_)*S,s[5]=(1-(f+m))*S,s[6]=(p+v)*S,s[7]=0,s[8]=(g+y)*A,s[9]=(p-v)*A,s[10]=(1-(f+b))*A,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,e,n){let s=this.elements,r=Mo.set(s[0],s[1],s[2]).length(),o=Mo.set(s[4],s[5],s[6]).length(),a=Mo.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),t.x=s[12],t.y=s[13],t.z=s[14],wi.copy(this);let c=1/r,h=1/o,u=1/a;return wi.elements[0]*=c,wi.elements[1]*=c,wi.elements[2]*=c,wi.elements[4]*=h,wi.elements[5]*=h,wi.elements[6]*=h,wi.elements[8]*=u,wi.elements[9]*=u,wi.elements[10]*=u,e.setFromRotationMatrix(wi),n.x=r,n.y=o,n.z=a,this}makePerspective(t,e,n,s,r,o,a=ms){let l=this.elements,c=2*r/(e-t),h=2*r/(n-s),u=(e+t)/(e-t),f=(n+s)/(n-s),d,g;if(a===ms)d=-(o+r)/(o-r),g=-2*o*r/(o-r);else if(a===Vc)d=-o/(o-r),g=-o*r/(o-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return l[0]=c,l[4]=0,l[8]=u,l[12]=0,l[1]=0,l[5]=h,l[9]=f,l[13]=0,l[2]=0,l[6]=0,l[10]=d,l[14]=g,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,e,n,s,r,o,a=ms){let l=this.elements,c=1/(e-t),h=1/(n-s),u=1/(o-r),f=(e+t)*c,d=(n+s)*h,g,b;if(a===ms)g=(o+r)*u,b=-2*u;else if(a===Vc)g=r*u,b=-1*u;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-f,l[1]=0,l[5]=2*h,l[9]=0,l[13]=-d,l[2]=0,l[6]=0,l[10]=b,l[14]=-g,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){let e=this.elements,n=t.elements;for(let s=0;s<16;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}},Mo=new V,wi=new de,qw=new V(0,0,0),Xw=new V(1,1,1),Vs=new V,_c=new V,qn=new V,Ag=new de,Eg=new Zs,ys=class i{constructor(t=0,e=0,n=0,s=i.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,s=this._order){return this._x=t,this._y=e,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){let s=t.elements,r=s[0],o=s[4],a=s[8],l=s[1],c=s[5],h=s[9],u=s[2],f=s[6],d=s[10];switch(e){case"XYZ":this._y=Math.asin(On(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-h,d),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(f,c),this._z=0);break;case"YXZ":this._x=Math.asin(-On(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(a,d),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-u,r),this._z=0);break;case"ZXY":this._x=Math.asin(On(f,-1,1)),Math.abs(f)<.9999999?(this._y=Math.atan2(-u,d),this._z=Math.atan2(-o,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-On(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(f,d),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-o,c));break;case"YZX":this._z=Math.asin(On(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-u,r)):(this._x=0,this._y=Math.atan2(a,d));break;case"XZY":this._z=Math.asin(-On(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(f,c),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-h,d),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return Ag.makeRotationFromQuaternion(t),this.setFromRotationMatrix(Ag,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return Eg.setFromEuler(this),this.setFromQuaternion(Eg,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};ys.DEFAULT_ORDER="XYZ";var Zc=class{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}},Yw=0,Tg=new V,So=new Zs,cs=new de,xc=new V,Ha=new V,Kw=new V,Zw=new Zs,kg=new V(1,0,0),Cg=new V(0,1,0),Rg=new V(0,0,1),Jw={type:"added"},jw={type:"removed"},Pd={type:"childadded",child:null},Ld={type:"childremoved",child:null},ci=class i extends Ks{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Yw++}),this.uuid=Ya(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=i.DEFAULT_UP.clone();let t=new V,e=new ys,n=new Zs,s=new V(1,1,1);function r(){n.setFromEuler(e,!1)}function o(){e.setFromQuaternion(n,void 0,!1)}e._onChange(r),n._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new de},normalMatrix:{value:new ee}}),this.matrix=new de,this.matrixWorld=new de,this.matrixAutoUpdate=i.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=i.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Zc,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return So.setFromAxisAngle(t,e),this.quaternion.multiply(So),this}rotateOnWorldAxis(t,e){return So.setFromAxisAngle(t,e),this.quaternion.premultiply(So),this}rotateX(t){return this.rotateOnAxis(kg,t)}rotateY(t){return this.rotateOnAxis(Cg,t)}rotateZ(t){return this.rotateOnAxis(Rg,t)}translateOnAxis(t,e){return Tg.copy(t).applyQuaternion(this.quaternion),this.position.add(Tg.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(kg,t)}translateY(t){return this.translateOnAxis(Cg,t)}translateZ(t){return this.translateOnAxis(Rg,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(cs.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?xc.copy(t):xc.set(t,e,n);let s=this.parent;this.updateWorldMatrix(!0,!1),Ha.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?cs.lookAt(Ha,xc,this.up):cs.lookAt(xc,Ha,this.up),this.quaternion.setFromRotationMatrix(cs),s&&(cs.extractRotation(s.matrixWorld),So.setFromRotationMatrix(cs),this.quaternion.premultiply(So.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.parent!==null&&t.parent.remove(t),t.parent=this,this.children.push(t),t.dispatchEvent(Jw),Pd.child=t,this.dispatchEvent(Pd),Pd.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(jw),Ld.child=t,this.dispatchEvent(Ld),Ld.child=null),this}removeFromParent(){let t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),cs.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),cs.multiply(t.parent.matrixWorld)),t.applyMatrix4(cs),this.add(t),t.updateWorldMatrix(!1,!0),this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,s=this.children.length;n<s;n++){let o=this.children[n].getObjectByProperty(t,e);if(o!==void 0)return o}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ha,t,Kw),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ha,Zw,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);let e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverseVisible(t)}traverseAncestors(t){let e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),this.matrixWorldNeedsUpdate=!1,t=!0);let e=this.children;for(let n=0,s=e.length;n<s;n++){let r=e[n];(r.matrixWorldAutoUpdate===!0||t===!0)&&r.updateMatrixWorld(t)}}updateWorldMatrix(t,e){let n=this.parent;if(t===!0&&n!==null&&n.matrixWorldAutoUpdate===!0&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),e===!0){let s=this.children;for(let r=0,o=s.length;r<o;r++){let a=s[r];a.matrixWorldAutoUpdate===!0&&a.updateWorldMatrix(!1,!0)}}}toJSON(t){let e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.visibility=this._visibility,s.active=this._active,s.bounds=this._bounds.map(a=>({boxInitialized:a.boxInitialized,boxMin:a.box.min.toArray(),boxMax:a.box.max.toArray(),sphereInitialized:a.sphereInitialized,sphereRadius:a.sphere.radius,sphereCenter:a.sphere.center.toArray()})),s.maxGeometryCount=this._maxGeometryCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.geometryCount=this._geometryCount,s.matricesTexture=this._matricesTexture.toJSON(t),this.boundingSphere!==null&&(s.boundingSphere={center:s.boundingSphere.center.toArray(),radius:s.boundingSphere.radius}),this.boundingBox!==null&&(s.boundingBox={min:s.boundingBox.min.toArray(),max:s.boundingBox.max.toArray()}));function r(a,l){return a[l.uuid]===void 0&&(a[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(t.geometries,this.geometry);let a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){let l=a.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){let u=l[c];r(t.shapes,u)}else r(t.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let a=[];for(let l=0,c=this.material.length;l<c;l++)a.push(r(t.materials,this.material[l]));s.material=a}else s.material=r(t.materials,this.material);if(this.children.length>0){s.children=[];for(let a=0;a<this.children.length;a++)s.children.push(this.children[a].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let a=0;a<this.animations.length;a++){let l=this.animations[a];s.animations.push(r(t.animations,l))}}if(e){let a=o(t.geometries),l=o(t.materials),c=o(t.textures),h=o(t.images),u=o(t.shapes),f=o(t.skeletons),d=o(t.animations),g=o(t.nodes);a.length>0&&(n.geometries=a),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),h.length>0&&(n.images=h),u.length>0&&(n.shapes=u),f.length>0&&(n.skeletons=f),d.length>0&&(n.animations=d),g.length>0&&(n.nodes=g)}return n.object=s,n;function o(a){let l=[];for(let c in a){let h=a[c];delete h.metadata,l.push(h)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){let s=t.children[n];this.add(s.clone())}return this}};ci.DEFAULT_UP=new V(0,1,0);ci.DEFAULT_MATRIX_AUTO_UPDATE=!0;ci.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Mi=new V,hs=new V,Id=new V,us=new V,Ao=new V,Eo=new V,Pg=new V,Ud=new V,Dd=new V,Nd=new V,Uo=class i{constructor(t=new V,e=new V,n=new V){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,s){s.subVectors(n,e),Mi.subVectors(t,e),s.cross(Mi);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(t,e,n,s,r){Mi.subVectors(s,e),hs.subVectors(n,e),Id.subVectors(t,e);let o=Mi.dot(Mi),a=Mi.dot(hs),l=Mi.dot(Id),c=hs.dot(hs),h=hs.dot(Id),u=o*c-a*a;if(u===0)return r.set(0,0,0),null;let f=1/u,d=(c*l-a*h)*f,g=(o*h-a*l)*f;return r.set(1-d-g,g,d)}static containsPoint(t,e,n,s){return this.getBarycoord(t,e,n,s,us)===null?!1:us.x>=0&&us.y>=0&&us.x+us.y<=1}static getInterpolation(t,e,n,s,r,o,a,l){return this.getBarycoord(t,e,n,s,us)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,us.x),l.addScaledVector(o,us.y),l.addScaledVector(a,us.z),l)}static isFrontFacing(t,e,n,s){return Mi.subVectors(n,e),hs.subVectors(t,e),Mi.cross(hs).dot(s)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,s){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,e,n,s){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return Mi.subVectors(this.c,this.b),hs.subVectors(this.a,this.b),Mi.cross(hs).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return i.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return i.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,s,r){return i.getInterpolation(t,this.a,this.b,this.c,e,n,s,r)}containsPoint(t){return i.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return i.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){let n=this.a,s=this.b,r=this.c,o,a;Ao.subVectors(s,n),Eo.subVectors(r,n),Ud.subVectors(t,n);let l=Ao.dot(Ud),c=Eo.dot(Ud);if(l<=0&&c<=0)return e.copy(n);Dd.subVectors(t,s);let h=Ao.dot(Dd),u=Eo.dot(Dd);if(h>=0&&u<=h)return e.copy(s);let f=l*u-h*c;if(f<=0&&l>=0&&h<=0)return o=l/(l-h),e.copy(n).addScaledVector(Ao,o);Nd.subVectors(t,r);let d=Ao.dot(Nd),g=Eo.dot(Nd);if(g>=0&&d<=g)return e.copy(r);let b=d*c-l*g;if(b<=0&&c>=0&&g<=0)return a=c/(c-g),e.copy(n).addScaledVector(Eo,a);let p=h*g-d*u;if(p<=0&&u-h>=0&&d-g>=0)return Pg.subVectors(r,s),a=(u-h)/(u-h+(d-g)),e.copy(s).addScaledVector(Pg,a);let m=1/(p+b+f);return o=b*m,a=f*m,e.copy(n).addScaledVector(Ao,o).addScaledVector(Eo,a)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}},x1={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},$s={h:0,s:0,l:0},wc={h:0,s:0,l:0};function Bd(i,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?i+(t-i)*6*e:e<1/2?t:e<2/3?i+(t-i)*6*(2/3-e):i}var Pt=class{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){let s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=Vi){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,fe.toWorkingColorSpace(this,e),this}setRGB(t,e,n,s=fe.workingColorSpace){return this.r=t,this.g=e,this.b=n,fe.toWorkingColorSpace(this,s),this}setHSL(t,e,n,s=fe.workingColorSpace){if(t=Ow(t,1),e=On(e,0,1),n=On(n,0,1),e===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+e):n+e-n*e,o=2*n-r;this.r=Bd(o,r,t+1/3),this.g=Bd(o,r,t),this.b=Bd(o,r,t-1/3)}return fe.toWorkingColorSpace(this,s),this}setStyle(t,e=Vi){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let r,o=s[1],a=s[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,e);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:console.warn("THREE.Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){let r=s[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(o===6)return this.setHex(parseInt(r,16),e);console.warn("THREE.Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=Vi){let n=x1[t.toLowerCase()];return n!==void 0?this.setHex(n,e):console.warn("THREE.Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=Bo(t.r),this.g=Bo(t.g),this.b=Bo(t.b),this}copyLinearToSRGB(t){return this.r=Md(t.r),this.g=Md(t.g),this.b=Md(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=Vi){return fe.fromWorkingColorSpace(bn.copy(this),t),Math.round(On(bn.r*255,0,255))*65536+Math.round(On(bn.g*255,0,255))*256+Math.round(On(bn.b*255,0,255))}getHexString(t=Vi){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=fe.workingColorSpace){fe.fromWorkingColorSpace(bn.copy(this),e);let n=bn.r,s=bn.g,r=bn.b,o=Math.max(n,s,r),a=Math.min(n,s,r),l,c,h=(a+o)/2;if(a===o)l=0,c=0;else{let u=o-a;switch(c=h<=.5?u/(o+a):u/(2-o-a),o){case n:l=(s-r)/u+(s<r?6:0);break;case s:l=(r-n)/u+2;break;case r:l=(n-s)/u+4;break}l/=6}return t.h=l,t.s=c,t.l=h,t}getRGB(t,e=fe.workingColorSpace){return fe.fromWorkingColorSpace(bn.copy(this),e),t.r=bn.r,t.g=bn.g,t.b=bn.b,t}getStyle(t=Vi){fe.fromWorkingColorSpace(bn.copy(this),t);let e=bn.r,n=bn.g,s=bn.b;return t!==Vi?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(t,e,n){return this.getHSL($s),this.setHSL($s.h+t,$s.s+e,$s.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL($s),t.getHSL(wc);let n=xd($s.h,wc.h,e),s=xd($s.s,wc.s,e),r=xd($s.l,wc.l,e);return this.setHSL(n,s,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){let e=this.r,n=this.g,s=this.b,r=t.elements;return this.r=r[0]*e+r[3]*n+r[6]*s,this.g=r[1]*e+r[4]*n+r[7]*s,this.b=r[2]*e+r[5]*n+r[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},bn=new Pt;Pt.NAMES=x1;var Qw=0,Nr=class extends Ks{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Qw++}),this.uuid=Ya(),this.name="",this.type="Material",this.blending=gs,this.side=yn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=qd,this.blendDst=Xd,this.blendEquation=kr,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Pt(0,0,0),this.blendAlpha=0,this.depthFunc=Fc,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=bg,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=yo,this.stencilZFail=yo,this.stencilZPass=yo,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBuild(){}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(let e in t){let n=t[e];if(n===void 0){console.warn(`THREE.Material: parameter '${e}' has value of undefined.`);continue}let s=this[e];if(s===void 0){console.warn(`THREE.Material: '${e}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[e]=n}}toJSON(t){let e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});let n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==gs&&(n.blending=this.blending),this.side!==yn&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==qd&&(n.blendSrc=this.blendSrc),this.blendDst!==Xd&&(n.blendDst=this.blendDst),this.blendEquation!==kr&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==Fc&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==bg&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==yo&&(n.stencilFail=this.stencilFail),this.stencilZFail!==yo&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==yo&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){let o=[];for(let a in r){let l=r[a];delete l.metadata,o.push(l)}return o}if(e){let r=s(t.textures),o=s(t.images);r.length>0&&(n.textures=r),o.length>0&&(n.images=o)}return n}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;let e=t.clippingPlanes,n=null;if(e!==null){let s=e.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=e[r].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}},Jc=class extends Nr{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Pt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new ys,this.combine=c1,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}};var Ge=new V,Mc=new Bt,Ht=class{constructor(t,e,n=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=yg,this._updateRange={offset:0,count:-1},this.updateRanges=[],this.gpuType=ps,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}get updateRange(){return Hw("THREE.BufferAttribute: updateRange() is deprecated and will be removed in r169. Use addUpdateRange() instead."),this._updateRange}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[t+s]=e.array[n+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)Mc.fromBufferAttribute(this,e),Mc.applyMatrix3(t),this.setXY(e,Mc.x,Mc.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)Ge.fromBufferAttribute(this,e),Ge.applyMatrix3(t),this.setXYZ(e,Ge.x,Ge.y,Ge.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)Ge.fromBufferAttribute(this,e),Ge.applyMatrix4(t),this.setXYZ(e,Ge.x,Ge.y,Ge.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)Ge.fromBufferAttribute(this,e),Ge.applyNormalMatrix(t),this.setXYZ(e,Ge.x,Ge.y,Ge.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)Ge.fromBufferAttribute(this,e),Ge.transformDirection(t),this.setXYZ(e,Ge.x,Ge.y,Ge.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=Fa(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=Fn(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=Fa(e,this.array)),e}setX(t,e){return this.normalized&&(e=Fn(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=Fa(e,this.array)),e}setY(t,e){return this.normalized&&(e=Fn(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=Fa(e,this.array)),e}setZ(t,e){return this.normalized&&(e=Fn(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=Fa(e,this.array)),e}setW(t,e){return this.normalized&&(e=Fn(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=Fn(e,this.array),n=Fn(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,s){return t*=this.itemSize,this.normalized&&(e=Fn(e,this.array),n=Fn(n,this.array),s=Fn(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this}setXYZW(t,e,n,s,r){return t*=this.itemSize,this.normalized&&(e=Fn(e,this.array),n=Fn(n,this.array),s=Fn(s,this.array),r=Fn(r,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==yg&&(t.usage=this.usage),t}};var jc=class extends Ht{constructor(t,e,n){super(new Uint16Array(t),e,n)}};var Qc=class extends Ht{constructor(t,e,n){super(new Uint32Array(t),e,n)}};var bs=class extends Ht{constructor(t,e,n){super(new Float32Array(t),e,n)}},tM=0,ai=new de,Fd=new ci,To=new V,Xn=new Dr,Ga=new Dr,tn=new V,Ee=class i extends Ks{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:tM++}),this.uuid=Ya(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(_1(t)?Qc:jc)(t,1):this.index=t,this}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){let e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new ee().getNormalMatrix(t);n.applyNormalMatrix(r),n.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return ai.makeRotationFromQuaternion(t),this.applyMatrix4(ai),this}rotateX(t){return ai.makeRotationX(t),this.applyMatrix4(ai),this}rotateY(t){return ai.makeRotationY(t),this.applyMatrix4(ai),this}rotateZ(t){return ai.makeRotationZ(t),this.applyMatrix4(ai),this}translate(t,e,n){return ai.makeTranslation(t,e,n),this.applyMatrix4(ai),this}scale(t,e,n){return ai.makeScale(t,e,n),this.applyMatrix4(ai),this}lookAt(t){return Fd.lookAt(t),Fd.updateMatrix(),this.applyMatrix4(Fd.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(To).negate(),this.translate(To.x,To.y,To.z),this}setFromPoints(t){let e=[];for(let n=0,s=t.length;n<s;n++){let r=t[n];e.push(r.x,r.y,r.z||0)}return this.setAttribute("position",new bs(e,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Dr);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new V(-1/0,-1/0,-1/0),new V(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,s=e.length;n<s;n++){let r=e[n];Xn.setFromBufferAttribute(r),this.morphTargetsRelative?(tn.addVectors(this.boundingBox.min,Xn.min),this.boundingBox.expandByPoint(tn),tn.addVectors(this.boundingBox.max,Xn.max),this.boundingBox.expandByPoint(tn)):(this.boundingBox.expandByPoint(Xn.min),this.boundingBox.expandByPoint(Xn.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Xi);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new V,1/0);return}if(t){let n=this.boundingSphere.center;if(Xn.setFromBufferAttribute(t),e)for(let r=0,o=e.length;r<o;r++){let a=e[r];Ga.setFromBufferAttribute(a),this.morphTargetsRelative?(tn.addVectors(Xn.min,Ga.min),Xn.expandByPoint(tn),tn.addVectors(Xn.max,Ga.max),Xn.expandByPoint(tn)):(Xn.expandByPoint(Ga.min),Xn.expandByPoint(Ga.max))}Xn.getCenter(n);let s=0;for(let r=0,o=t.count;r<o;r++)tn.fromBufferAttribute(t,r),s=Math.max(s,n.distanceToSquared(tn));if(e)for(let r=0,o=e.length;r<o;r++){let a=e[r],l=this.morphTargetsRelative;for(let c=0,h=a.count;c<h;c++)tn.fromBufferAttribute(a,c),l&&(To.fromBufferAttribute(t,c),tn.add(To)),s=Math.max(s,n.distanceToSquared(tn))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=e.position,s=e.normal,r=e.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Ht(new Float32Array(4*n.count),4));let o=this.getAttribute("tangent"),a=[],l=[];for(let R=0;R<n.count;R++)a[R]=new V,l[R]=new V;let c=new V,h=new V,u=new V,f=new Bt,d=new Bt,g=new Bt,b=new V,p=new V;function m(R,P,x){c.fromBufferAttribute(n,R),h.fromBufferAttribute(n,P),u.fromBufferAttribute(n,x),f.fromBufferAttribute(r,R),d.fromBufferAttribute(r,P),g.fromBufferAttribute(r,x),h.sub(c),u.sub(c),d.sub(f),g.sub(f);let T=1/(d.x*g.y-g.x*d.y);isFinite(T)&&(b.copy(h).multiplyScalar(g.y).addScaledVector(u,-d.y).multiplyScalar(T),p.copy(u).multiplyScalar(d.x).addScaledVector(h,-g.x).multiplyScalar(T),a[R].add(b),a[P].add(b),a[x].add(b),l[R].add(p),l[P].add(p),l[x].add(p))}let v=this.groups;v.length===0&&(v=[{start:0,count:t.count}]);for(let R=0,P=v.length;R<P;++R){let x=v[R],T=x.start,D=x.count;for(let U=T,k=T+D;U<k;U+=3)m(t.getX(U+0),t.getX(U+1),t.getX(U+2))}let y=new V,_=new V,w=new V,S=new V;function A(R){w.fromBufferAttribute(s,R),S.copy(w);let P=a[R];y.copy(P),y.sub(w.multiplyScalar(w.dot(P))).normalize(),_.crossVectors(S,P);let T=_.dot(l[R])<0?-1:1;o.setXYZW(R,y.x,y.y,y.z,T)}for(let R=0,P=v.length;R<P;++R){let x=v[R],T=x.start,D=x.count;for(let U=T,k=T+D;U<k;U+=3)A(t.getX(U+0)),A(t.getX(U+1)),A(t.getX(U+2))}}computeVertexNormals(){let t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new Ht(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let f=0,d=n.count;f<d;f++)n.setXYZ(f,0,0,0);let s=new V,r=new V,o=new V,a=new V,l=new V,c=new V,h=new V,u=new V;if(t)for(let f=0,d=t.count;f<d;f+=3){let g=t.getX(f+0),b=t.getX(f+1),p=t.getX(f+2);s.fromBufferAttribute(e,g),r.fromBufferAttribute(e,b),o.fromBufferAttribute(e,p),h.subVectors(o,r),u.subVectors(s,r),h.cross(u),a.fromBufferAttribute(n,g),l.fromBufferAttribute(n,b),c.fromBufferAttribute(n,p),a.add(h),l.add(h),c.add(h),n.setXYZ(g,a.x,a.y,a.z),n.setXYZ(b,l.x,l.y,l.z),n.setXYZ(p,c.x,c.y,c.z)}else for(let f=0,d=e.count;f<d;f+=3)s.fromBufferAttribute(e,f+0),r.fromBufferAttribute(e,f+1),o.fromBufferAttribute(e,f+2),h.subVectors(o,r),u.subVectors(s,r),h.cross(u),n.setXYZ(f+0,h.x,h.y,h.z),n.setXYZ(f+1,h.x,h.y,h.z),n.setXYZ(f+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)tn.fromBufferAttribute(t,e),tn.normalize(),t.setXYZ(e,tn.x,tn.y,tn.z)}toNonIndexed(){function t(a,l){let c=a.array,h=a.itemSize,u=a.normalized,f=new c.constructor(l.length*h),d=0,g=0;for(let b=0,p=l.length;b<p;b++){a.isInterleavedBufferAttribute?d=l[b]*a.data.stride+a.offset:d=l[b]*h;for(let m=0;m<h;m++)f[g++]=c[d++]}return new Ht(f,h,u)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let e=new i,n=this.index.array,s=this.attributes;for(let a in s){let l=s[a],c=t(l,n);e.setAttribute(a,c)}let r=this.morphAttributes;for(let a in r){let l=[],c=r[a];for(let h=0,u=c.length;h<u;h++){let f=c[h],d=t(f,n);l.push(d)}e.morphAttributes[a]=l}e.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let a=0,l=o.length;a<l;a++){let c=o[a];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){let t={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};let e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});let n=this.attributes;for(let l in n){let c=n[l];t.data.attributes[l]=c.toJSON(t.data)}let s={},r=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],h=[];for(let u=0,f=c.length;u<f;u++){let d=c[u];h.push(d.toJSON(t.data))}h.length>0&&(s[l]=h,r=!0)}r&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);let o=this.groups;o.length>0&&(t.data.groups=JSON.parse(JSON.stringify(o)));let a=this.boundingSphere;return a!==null&&(t.data.boundingSphere={center:a.center.toArray(),radius:a.radius}),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let e={};this.name=t.name;let n=t.index;n!==null&&this.setIndex(n.clone(e));let s=t.attributes;for(let c in s){let h=s[c];this.setAttribute(c,h.clone(e))}let r=t.morphAttributes;for(let c in r){let h=[],u=r[c];for(let f=0,d=u.length;f<d;f++)h.push(u[f].clone(e));this.morphAttributes[c]=h}this.morphTargetsRelative=t.morphTargetsRelative;let o=t.groups;for(let c=0,h=o.length;c<h;c++){let u=o[c];this.addGroup(u.start,u.count,u.materialIndex)}let a=t.boundingBox;a!==null&&(this.boundingBox=a.clone());let l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},Lg=new de,Mr=new Kc,Sc=new Xi,Ig=new V,ko=new V,Co=new V,Ro=new V,Od=new V,Ac=new V,Ec=new Bt,Tc=new Bt,kc=new Bt,Ug=new V,Dg=new V,Ng=new V,Cc=new V,Rc=new V,be=class extends ci{constructor(t=new Ee,e=new Jc){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){let s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(t,e){let n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,o=n.morphTargetsRelative;e.fromBufferAttribute(s,t);let a=this.morphTargetInfluences;if(r&&a){Ac.set(0,0,0);for(let l=0,c=r.length;l<c;l++){let h=a[l],u=r[l];h!==0&&(Od.fromBufferAttribute(u,t),o?Ac.addScaledVector(Od,h):Ac.addScaledVector(Od.sub(e),h))}e.add(Ac)}return e}raycast(t,e){let n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Sc.copy(n.boundingSphere),Sc.applyMatrix4(r),Mr.copy(t.ray).recast(t.near),!(Sc.containsPoint(Mr.origin)===!1&&(Mr.intersectSphere(Sc,Ig)===null||Mr.origin.distanceToSquared(Ig)>(t.far-t.near)**2))&&(Lg.copy(r).invert(),Mr.copy(t.ray).applyMatrix4(Lg),!(n.boundingBox!==null&&Mr.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,Mr)))}_computeIntersections(t,e,n){let s,r=this.geometry,o=this.material,a=r.index,l=r.attributes.position,c=r.attributes.uv,h=r.attributes.uv1,u=r.attributes.normal,f=r.groups,d=r.drawRange;if(a!==null)if(Array.isArray(o))for(let g=0,b=f.length;g<b;g++){let p=f[g],m=o[p.materialIndex],v=Math.max(p.start,d.start),y=Math.min(a.count,Math.min(p.start+p.count,d.start+d.count));for(let _=v,w=y;_<w;_+=3){let S=a.getX(_),A=a.getX(_+1),R=a.getX(_+2);s=Pc(this,m,t,n,c,h,u,S,A,R),s&&(s.faceIndex=Math.floor(_/3),s.face.materialIndex=p.materialIndex,e.push(s))}}else{let g=Math.max(0,d.start),b=Math.min(a.count,d.start+d.count);for(let p=g,m=b;p<m;p+=3){let v=a.getX(p),y=a.getX(p+1),_=a.getX(p+2);s=Pc(this,o,t,n,c,h,u,v,y,_),s&&(s.faceIndex=Math.floor(p/3),e.push(s))}}else if(l!==void 0)if(Array.isArray(o))for(let g=0,b=f.length;g<b;g++){let p=f[g],m=o[p.materialIndex],v=Math.max(p.start,d.start),y=Math.min(l.count,Math.min(p.start+p.count,d.start+d.count));for(let _=v,w=y;_<w;_+=3){let S=_,A=_+1,R=_+2;s=Pc(this,m,t,n,c,h,u,S,A,R),s&&(s.faceIndex=Math.floor(_/3),s.face.materialIndex=p.materialIndex,e.push(s))}}else{let g=Math.max(0,d.start),b=Math.min(l.count,d.start+d.count);for(let p=g,m=b;p<m;p+=3){let v=p,y=p+1,_=p+2;s=Pc(this,o,t,n,c,h,u,v,y,_),s&&(s.faceIndex=Math.floor(p/3),e.push(s))}}}};function eM(i,t,e,n,s,r,o,a){let l;if(t.side===zn?l=n.intersectTriangle(o,r,s,!0,a):l=n.intersectTriangle(s,r,o,t.side===yn,a),l===null)return null;Rc.copy(a),Rc.applyMatrix4(i.matrixWorld);let c=e.ray.origin.distanceTo(Rc);return c<e.near||c>e.far?null:{distance:c,point:Rc.clone(),object:i}}function Pc(i,t,e,n,s,r,o,a,l,c){i.getVertexPosition(a,ko),i.getVertexPosition(l,Co),i.getVertexPosition(c,Ro);let h=eM(i,t,e,n,ko,Co,Ro,Cc);if(h){s&&(Ec.fromBufferAttribute(s,a),Tc.fromBufferAttribute(s,l),kc.fromBufferAttribute(s,c),h.uv=Uo.getInterpolation(Cc,ko,Co,Ro,Ec,Tc,kc,new Bt)),r&&(Ec.fromBufferAttribute(r,a),Tc.fromBufferAttribute(r,l),kc.fromBufferAttribute(r,c),h.uv1=Uo.getInterpolation(Cc,ko,Co,Ro,Ec,Tc,kc,new Bt)),o&&(Ug.fromBufferAttribute(o,a),Dg.fromBufferAttribute(o,l),Ng.fromBufferAttribute(o,c),h.normal=Uo.getInterpolation(Cc,ko,Co,Ro,Ug,Dg,Ng,new V),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));let u={a,b:l,c,normal:new V,materialIndex:0};Uo.getNormal(ko,Co,Ro,u.normal),h.face=u}return h}var Va=class i extends Ee{constructor(t=1,e=1,n=1,s=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:s,heightSegments:r,depthSegments:o};let a=this;s=Math.floor(s),r=Math.floor(r),o=Math.floor(o);let l=[],c=[],h=[],u=[],f=0,d=0;g("z","y","x",-1,-1,n,e,t,o,r,0),g("z","y","x",1,-1,n,e,-t,o,r,1),g("x","z","y",1,1,t,n,e,s,o,2),g("x","z","y",1,-1,t,n,-e,s,o,3),g("x","y","z",1,-1,t,e,n,s,r,4),g("x","y","z",-1,-1,t,e,-n,s,r,5),this.setIndex(l),this.setAttribute("position",new bs(c,3)),this.setAttribute("normal",new bs(h,3)),this.setAttribute("uv",new bs(u,2));function g(b,p,m,v,y,_,w,S,A,R,P){let x=_/A,T=w/R,D=_/2,U=w/2,k=S/2,B=A+1,F=R+1,I=0,N=0,z=new V;for(let et=0;et<F;et++){let nt=et*T-U;for(let ot=0;ot<B;ot++){let bt=ot*x-D;z[b]=bt*v,z[p]=nt*y,z[m]=k,c.push(z.x,z.y,z.z),z[b]=0,z[p]=0,z[m]=S>0?1:-1,h.push(z.x,z.y,z.z),u.push(ot/A),u.push(1-et/R),I+=1}}for(let et=0;et<R;et++)for(let nt=0;nt<A;nt++){let ot=f+nt+B*et,bt=f+nt+B*(et+1),W=f+(nt+1)+B*(et+1),J=f+(nt+1)+B*et;l.push(ot,bt,J),l.push(bt,W,J),N+=6}a.addGroup(d,N,P),d+=N,f+=I}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}};function Wo(i){let t={};for(let e in i){t[e]={};for(let n in i[e]){let s=i[e][n];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=s.clone():Array.isArray(s)?t[e][n]=s.slice():t[e][n]=s}}return t}function Rn(i){let t={};for(let e=0;e<i.length;e++){let n=Wo(i[e]);for(let s in n)t[s]=n[s]}return t}function nM(i){let t=[];for(let e=0;e<i.length;e++)t.push(i[e].clone());return t}function w1(i){return i.getRenderTarget()===null?i.outputColorSpace:fe.workingColorSpace}var iM={clone:Wo,merge:Rn},sM=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,rM=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,we=class extends Nr{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=sM,this.fragmentShader=rM,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={derivatives:!1,fragDepth:!1,drawBuffers:!1,shaderTextureLOD:!1,clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=Wo(t.uniforms),this.uniformsGroups=nM(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this}toJSON(t){let e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(let s in this.uniforms){let o=this.uniforms[s].value;o&&o.isTexture?e.uniforms[s]={type:"t",value:o.toJSON(t).uuid}:o&&o.isColor?e.uniforms[s]={type:"c",value:o.getHex()}:o&&o.isVector2?e.uniforms[s]={type:"v2",value:o.toArray()}:o&&o.isVector3?e.uniforms[s]={type:"v3",value:o.toArray()}:o&&o.isVector4?e.uniforms[s]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?e.uniforms[s]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?e.uniforms[s]={type:"m4",value:o.toArray()}:e.uniforms[s]={value:o}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;let n={};for(let s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}},th=class extends ci{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new de,this.projectionMatrix=new de,this.projectionMatrixInverse=new de,this.coordinateSystem=ms}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},qs=new V,Bg=new Bt,Fg=new Bt,en=class extends th{constructor(t=50,e=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){let e=.5*this.getFilmHeight()/t;this.fov=Qd*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){let t=Math.tan(_d*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return Qd*2*Math.atan(Math.tan(_d*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){qs.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(qs.x,qs.y).multiplyScalar(-t/qs.z),qs.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(qs.x,qs.y).multiplyScalar(-t/qs.z)}getViewSize(t,e){return this.getViewBounds(t,Bg,Fg),e.subVectors(Fg,Bg)}setViewOffset(t,e,n,s,r,o){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=this.near,e=t*Math.tan(_d*.5*this.fov)/this.zoom,n=2*e,s=this.aspect*n,r=-.5*s,o=this.view;if(this.view!==null&&this.view.enabled){let l=o.fullWidth,c=o.fullHeight;r+=o.offsetX*s/l,e-=o.offsetY*n/c,s*=o.width/l,n*=o.height/c}let a=this.filmOffset;a!==0&&(r+=t*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,e,e-n,t,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}},Po=-90,Lo=1,sf=class extends ci{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new en(Po,Lo,t,e);s.layers=this.layers,this.add(s);let r=new en(Po,Lo,t,e);r.layers=this.layers,this.add(r);let o=new en(Po,Lo,t,e);o.layers=this.layers,this.add(o);let a=new en(Po,Lo,t,e);a.layers=this.layers,this.add(a);let l=new en(Po,Lo,t,e);l.layers=this.layers,this.add(l);let c=new en(Po,Lo,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let t=this.coordinateSystem,e=this.children.concat(),[n,s,r,o,a,l]=e;for(let c of e)this.remove(c);if(t===ms)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===Vc)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(let c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());let[r,o,a,l,c,h]=this.children,u=t.getRenderTarget(),f=t.getActiveCubeFace(),d=t.getActiveMipmapLevel(),g=t.xr.enabled;t.xr.enabled=!1;let b=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,t.setRenderTarget(n,0,s),t.render(e,r),t.setRenderTarget(n,1,s),t.render(e,o),t.setRenderTarget(n,2,s),t.render(e,a),t.setRenderTarget(n,3,s),t.render(e,l),t.setRenderTarget(n,4,s),t.render(e,c),n.texture.generateMipmaps=b,t.setRenderTarget(n,5,s),t.render(e,h),t.setRenderTarget(u,f,d),t.xr.enabled=g,n.texture.needsPMREMUpdate=!0}},eh=class extends Yn{constructor(t,e,n,s,r,o,a,l,c,h){t=t!==void 0?t:[],e=e!==void 0?e:zo,super(t,e,n,s,r,o,a,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}},rf=class extends Ln{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;let n={width:t,height:t,depth:1},s=[n,n,n,n,n,n];this.texture=new eh(s,e.mapping,e.wrapS,e.wrapT,e.magFilter,e.minFilter,e.format,e.type,e.anisotropy,e.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=e.generateMipmaps!==void 0?e.generateMipmaps:!1,this.texture.minFilter=e.minFilter!==void 0?e.minFilter:De}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new Va(5,5,5),r=new we({name:"CubemapFromEquirect",uniforms:Wo(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:zn,blending:li});r.uniforms.tEquirect.value=e;let o=new be(s,r),a=e.minFilter;return e.minFilter===Pr&&(e.minFilter=De),new sf(1,10,this).update(t,o),e.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(t,e,n,s){let r=t.getRenderTarget();for(let o=0;o<6;o++)t.setRenderTarget(this,o),t.clear(e,n,s);t.setRenderTarget(r)}},zd=new V,oM=new V,aM=new ee,fs=class{constructor(t=new V(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,s){return this.normal.set(t,e,n),this.constant=s,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){let s=zd.subVectors(n,e).cross(oM.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){let t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e){let n=t.delta(zd),s=this.normal.dot(n);if(s===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;let r=-(t.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:e.copy(t.start).addScaledVector(n,r)}intersectsLine(t){let e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){let n=e||aM.getNormalMatrix(t),s=this.coplanarPoint(zd).applyMatrix4(t),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}},Sr=new Xi,Lc=new V,Vo=class{constructor(t=new fs,e=new fs,n=new fs,s=new fs,r=new fs,o=new fs){this.planes=[t,e,n,s,r,o]}set(t,e,n,s,r,o){let a=this.planes;return a[0].copy(t),a[1].copy(e),a[2].copy(n),a[3].copy(s),a[4].copy(r),a[5].copy(o),this}copy(t){let e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=ms){let n=this.planes,s=t.elements,r=s[0],o=s[1],a=s[2],l=s[3],c=s[4],h=s[5],u=s[6],f=s[7],d=s[8],g=s[9],b=s[10],p=s[11],m=s[12],v=s[13],y=s[14],_=s[15];if(n[0].setComponents(l-r,f-c,p-d,_-m).normalize(),n[1].setComponents(l+r,f+c,p+d,_+m).normalize(),n[2].setComponents(l+o,f+h,p+g,_+v).normalize(),n[3].setComponents(l-o,f-h,p-g,_-v).normalize(),n[4].setComponents(l-a,f-u,p-b,_-y).normalize(),e===ms)n[5].setComponents(l+a,f+u,p+b,_+y).normalize();else if(e===Vc)n[5].setComponents(a,u,b,y).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),Sr.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{let e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),Sr.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(Sr)}intersectsSprite(t){return Sr.center.set(0,0,0),Sr.radius=.7071067811865476,Sr.applyMatrix4(t.matrixWorld),this.intersectsSphere(Sr)}intersectsSphere(t){let e=this.planes,n=t.center,s=-t.radius;for(let r=0;r<6;r++)if(e[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(t){let e=this.planes;for(let n=0;n<6;n++){let s=e[n];if(Lc.x=s.normal.x>0?t.max.x:t.min.x,Lc.y=s.normal.y>0?t.max.y:t.min.y,Lc.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(Lc)<0)return!1}return!0}containsPoint(t){let e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};function M1(){let i=null,t=!1,e=null,n=null;function s(r,o){e(r,o),n=i.requestAnimationFrame(s)}return{start:function(){t!==!0&&e!==null&&(n=i.requestAnimationFrame(s),t=!0)},stop:function(){i.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(r){e=r},setContext:function(r){i=r}}}function lM(i,t){let e=t.isWebGL2,n=new WeakMap;function s(c,h){let u=c.array,f=c.usage,d=u.byteLength,g=i.createBuffer();i.bindBuffer(h,g),i.bufferData(h,u,f),c.onUploadCallback();let b;if(u instanceof Float32Array)b=i.FLOAT;else if(u instanceof Uint16Array)if(c.isFloat16BufferAttribute)if(e)b=i.HALF_FLOAT;else throw new Error("THREE.WebGLAttributes: Usage of Float16BufferAttribute requires WebGL2.");else b=i.UNSIGNED_SHORT;else if(u instanceof Int16Array)b=i.SHORT;else if(u instanceof Uint32Array)b=i.UNSIGNED_INT;else if(u instanceof Int32Array)b=i.INT;else if(u instanceof Int8Array)b=i.BYTE;else if(u instanceof Uint8Array)b=i.UNSIGNED_BYTE;else if(u instanceof Uint8ClampedArray)b=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+u);return{buffer:g,type:b,bytesPerElement:u.BYTES_PER_ELEMENT,version:c.version,size:d}}function r(c,h,u){let f=h.array,d=h._updateRange,g=h.updateRanges;if(i.bindBuffer(u,c),d.count===-1&&g.length===0&&i.bufferSubData(u,0,f),g.length!==0){for(let b=0,p=g.length;b<p;b++){let m=g[b];e?i.bufferSubData(u,m.start*f.BYTES_PER_ELEMENT,f,m.start,m.count):i.bufferSubData(u,m.start*f.BYTES_PER_ELEMENT,f.subarray(m.start,m.start+m.count))}h.clearUpdateRanges()}d.count!==-1&&(e?i.bufferSubData(u,d.offset*f.BYTES_PER_ELEMENT,f,d.offset,d.count):i.bufferSubData(u,d.offset*f.BYTES_PER_ELEMENT,f.subarray(d.offset,d.offset+d.count)),d.count=-1),h.onUploadCallback()}function o(c){return c.isInterleavedBufferAttribute&&(c=c.data),n.get(c)}function a(c){c.isInterleavedBufferAttribute&&(c=c.data);let h=n.get(c);h&&(i.deleteBuffer(h.buffer),n.delete(c))}function l(c,h){if(c.isGLBufferAttribute){let f=n.get(c);(!f||f.version<c.version)&&n.set(c,{buffer:c.buffer,type:c.type,bytesPerElement:c.elementSize,version:c.version});return}c.isInterleavedBufferAttribute&&(c=c.data);let u=n.get(c);if(u===void 0)n.set(c,s(c,h));else if(u.version<c.version){if(u.size!==c.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");r(u.buffer,c,h),u.version=c.version}}return{get:o,remove:a,update:l}}var nh=class i extends Ee{constructor(t=1,e=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:s};let r=t/2,o=e/2,a=Math.floor(n),l=Math.floor(s),c=a+1,h=l+1,u=t/a,f=e/l,d=[],g=[],b=[],p=[];for(let m=0;m<h;m++){let v=m*f-o;for(let y=0;y<c;y++){let _=y*u-r;g.push(_,-v,0),b.push(0,0,1),p.push(y/a),p.push(1-m/l)}}for(let m=0;m<l;m++)for(let v=0;v<a;v++){let y=v+c*m,_=v+c*(m+1),w=v+1+c*(m+1),S=v+1+c*m;d.push(y,_,S),d.push(_,w,S)}this.setIndex(d),this.setAttribute("position",new bs(g,3)),this.setAttribute("normal",new bs(b,3)),this.setAttribute("uv",new bs(p,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.width,t.height,t.widthSegments,t.heightSegments)}},cM=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,hM=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,uM=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,dM=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,fM=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,pM=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,mM=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,gM=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,bM=`#ifdef USE_BATCHING
	attribute float batchId;
	uniform highp sampler2D batchingTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,yM=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( batchId );
#endif`,vM=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,_M=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,xM=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,wM=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,MM=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,SM=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,AM=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,EM=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,TM=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,kM=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,CM=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,RM=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	varying vec3 vColor;
#endif`,PM=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif`,LM=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
float luminance( const in vec3 rgb ) {
	const vec3 weights = vec3( 0.2126729, 0.7151522, 0.0721750 );
	return dot( weights, rgb );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,IM=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,UM=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,DM=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,NM=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,BM=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,FM=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,OM="gl_FragColor = linearToOutputTexel( gl_FragColor );",zM=`
const mat3 LINEAR_SRGB_TO_LINEAR_DISPLAY_P3 = mat3(
	vec3( 0.8224621, 0.177538, 0.0 ),
	vec3( 0.0331941, 0.9668058, 0.0 ),
	vec3( 0.0170827, 0.0723974, 0.9105199 )
);
const mat3 LINEAR_DISPLAY_P3_TO_LINEAR_SRGB = mat3(
	vec3( 1.2249401, - 0.2249404, 0.0 ),
	vec3( - 0.0420569, 1.0420571, 0.0 ),
	vec3( - 0.0196376, - 0.0786361, 1.0982735 )
);
vec4 LinearSRGBToLinearDisplayP3( in vec4 value ) {
	return vec4( value.rgb * LINEAR_SRGB_TO_LINEAR_DISPLAY_P3, value.a );
}
vec4 LinearDisplayP3ToLinearSRGB( in vec4 value ) {
	return vec4( value.rgb * LINEAR_DISPLAY_P3_TO_LINEAR_SRGB, value.a );
}
vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}
vec4 LinearToLinear( in vec4 value ) {
	return value;
}
vec4 LinearTosRGB( in vec4 value ) {
	return sRGBTransferOETF( value );
}`,HM=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,GM=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,WM=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,VM=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,$M=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,qM=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,XM=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,YM=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,KM=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,ZM=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,JM=`#ifdef USE_LIGHTMAP
	vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
	vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
	reflectedLight.indirectDiffuse += lightMapIrradiance;
#endif`,jM=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,QM=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,t2=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,e2=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	#if defined ( LEGACY_LIGHTS )
		if ( cutoffDistance > 0.0 && decayExponent > 0.0 ) {
			return pow( saturate( - lightDistance / cutoffDistance + 1.0 ), decayExponent );
		}
		return 1.0;
	#else
		float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
		if ( cutoffDistance > 0.0 ) {
			distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
		}
		return distanceFalloff;
	#endif
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,n2=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,i2=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,s2=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,r2=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,o2=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,a2=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,l2=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,c2=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,h2=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,u2=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,d2=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	gl_FragDepthEXT = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,f2=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,p2=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		varying float vFragDepth;
		varying float vIsPerspective;
	#else
		uniform float logDepthBufFC;
	#endif
#endif`,m2=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		vFragDepth = 1.0 + gl_Position.w;
		vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
	#else
		if ( isPerspectiveMatrix( projectionMatrix ) ) {
			gl_Position.z = log2( max( EPSILON, gl_Position.w + 1.0 ) ) * logDepthBufFC - 1.0;
			gl_Position.z *= gl_Position.w;
		}
	#endif
#endif`,g2=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,b2=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,y2=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,v2=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,_2=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,x2=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,w2=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[MORPHTARGETS_COUNT];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,M2=`#if defined( USE_MORPHCOLORS ) && defined( MORPHTARGETS_TEXTURE )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,S2=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
			if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
		}
	#else
		objectNormal += morphNormal0 * morphTargetInfluences[ 0 ];
		objectNormal += morphNormal1 * morphTargetInfluences[ 1 ];
		objectNormal += morphNormal2 * morphTargetInfluences[ 2 ];
		objectNormal += morphNormal3 * morphTargetInfluences[ 3 ];
	#endif
#endif`,A2=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
	#endif
	#ifdef MORPHTARGETS_TEXTURE
		#ifndef USE_INSTANCING_MORPH
			uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
		#endif
		uniform sampler2DArray morphTargetsTexture;
		uniform ivec2 morphTargetsTextureSize;
		vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
			int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
			int y = texelIndex / morphTargetsTextureSize.x;
			int x = texelIndex - y * morphTargetsTextureSize.x;
			ivec3 morphUV = ivec3( x, y, morphTargetIndex );
			return texelFetch( morphTargetsTexture, morphUV, 0 );
		}
	#else
		#ifndef USE_MORPHNORMALS
			uniform float morphTargetInfluences[ 8 ];
		#else
			uniform float morphTargetInfluences[ 4 ];
		#endif
	#endif
#endif`,E2=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
			if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
		}
	#else
		transformed += morphTarget0 * morphTargetInfluences[ 0 ];
		transformed += morphTarget1 * morphTargetInfluences[ 1 ];
		transformed += morphTarget2 * morphTargetInfluences[ 2 ];
		transformed += morphTarget3 * morphTargetInfluences[ 3 ];
		#ifndef USE_MORPHNORMALS
			transformed += morphTarget4 * morphTargetInfluences[ 4 ];
			transformed += morphTarget5 * morphTargetInfluences[ 5 ];
			transformed += morphTarget6 * morphTargetInfluences[ 6 ];
			transformed += morphTarget7 * morphTargetInfluences[ 7 ];
		#endif
	#endif
#endif`,T2=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,k2=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,C2=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,R2=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,P2=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,L2=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,I2=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,U2=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,D2=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,N2=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,B2=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,F2=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;
const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );
const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );
const float ShiftRight8 = 1. / 256.;
vec4 packDepthToRGBA( const in float v ) {
	vec4 r = vec4( fract( v * PackFactors ), v );
	r.yzw -= r.xyz * ShiftRight8;	return r * PackUpscale;
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors );
}
vec2 packDepthToRG( in highp float v ) {
	return packDepthToRGBA( v ).yx;
}
float unpackRGToDepth( const in highp vec2 v ) {
	return unpackRGBAToDepth( vec4( v.xy, 0.0, 0.0 ) );
}
vec4 pack2HalfToRGBA( vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,O2=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,z2=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,H2=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,G2=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,W2=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,V2=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,$2=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return shadow;
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
		vec3 lightToPosition = shadowCoord.xyz;
		float dp = ( length( lightToPosition ) - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );		dp += shadowBias;
		vec3 bd3D = normalize( lightToPosition );
		#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
			vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
			return (
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
			) * ( 1.0 / 9.0 );
		#else
			return texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
		#endif
	}
#endif`,q2=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,X2=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Y2=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,K2=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Z2=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,J2=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,j2=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Q2=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,tS=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,eS=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,nS=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 OptimizedCineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	float startCompression = 0.8 - 0.04;
	float desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min(color.r, min(color.g, color.b));
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max(color.r, max(color.g, color.b));
	if (peak < startCompression) return color;
	float d = 1. - startCompression;
	float newPeak = 1. - d * d / (peak + d - startCompression);
	color *= newPeak / peak;
	float g = 1. - 1. / (desaturation * (peak - newPeak) + 1.);
	return mix(color, vec3(1, 1, 1), g);
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,iS=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,sS=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
		vec3 refractedRayExit = position + transmissionRay;
		vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
		vec2 refractionCoords = ndcPos.xy / ndcPos.w;
		refractionCoords += 1.0;
		refractionCoords /= 2.0;
		vec4 transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
		vec3 transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,rS=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,oS=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,aS=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,lS=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,cS=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,hS=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,uS=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,dS=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,fS=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,pS=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,mS=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,gS=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#endif
}`,bS=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,yS=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,vS=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,_S=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,xS=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,wS=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,MS=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,SS=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,AS=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,ES=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,TS=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,kS=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,CS=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,RS=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,PS=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,LS=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,IS=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,US=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,DS=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,NS=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,BS=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,FS=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,OS=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,zS=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,HS=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
	vec2 scale;
	scale.x = length( vec3( modelMatrix[ 0 ].x, modelMatrix[ 0 ].y, modelMatrix[ 0 ].z ) );
	scale.y = length( vec3( modelMatrix[ 1 ].x, modelMatrix[ 1 ].y, modelMatrix[ 1 ].z ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,GS=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,te={alphahash_fragment:cM,alphahash_pars_fragment:hM,alphamap_fragment:uM,alphamap_pars_fragment:dM,alphatest_fragment:fM,alphatest_pars_fragment:pM,aomap_fragment:mM,aomap_pars_fragment:gM,batching_pars_vertex:bM,batching_vertex:yM,begin_vertex:vM,beginnormal_vertex:_M,bsdfs:xM,iridescence_fragment:wM,bumpmap_pars_fragment:MM,clipping_planes_fragment:SM,clipping_planes_pars_fragment:AM,clipping_planes_pars_vertex:EM,clipping_planes_vertex:TM,color_fragment:kM,color_pars_fragment:CM,color_pars_vertex:RM,color_vertex:PM,common:LM,cube_uv_reflection_fragment:IM,defaultnormal_vertex:UM,displacementmap_pars_vertex:DM,displacementmap_vertex:NM,emissivemap_fragment:BM,emissivemap_pars_fragment:FM,colorspace_fragment:OM,colorspace_pars_fragment:zM,envmap_fragment:HM,envmap_common_pars_fragment:GM,envmap_pars_fragment:WM,envmap_pars_vertex:VM,envmap_physical_pars_fragment:n2,envmap_vertex:$M,fog_vertex:qM,fog_pars_vertex:XM,fog_fragment:YM,fog_pars_fragment:KM,gradientmap_pars_fragment:ZM,lightmap_fragment:JM,lightmap_pars_fragment:jM,lights_lambert_fragment:QM,lights_lambert_pars_fragment:t2,lights_pars_begin:e2,lights_toon_fragment:i2,lights_toon_pars_fragment:s2,lights_phong_fragment:r2,lights_phong_pars_fragment:o2,lights_physical_fragment:a2,lights_physical_pars_fragment:l2,lights_fragment_begin:c2,lights_fragment_maps:h2,lights_fragment_end:u2,logdepthbuf_fragment:d2,logdepthbuf_pars_fragment:f2,logdepthbuf_pars_vertex:p2,logdepthbuf_vertex:m2,map_fragment:g2,map_pars_fragment:b2,map_particle_fragment:y2,map_particle_pars_fragment:v2,metalnessmap_fragment:_2,metalnessmap_pars_fragment:x2,morphinstance_vertex:w2,morphcolor_vertex:M2,morphnormal_vertex:S2,morphtarget_pars_vertex:A2,morphtarget_vertex:E2,normal_fragment_begin:T2,normal_fragment_maps:k2,normal_pars_fragment:C2,normal_pars_vertex:R2,normal_vertex:P2,normalmap_pars_fragment:L2,clearcoat_normal_fragment_begin:I2,clearcoat_normal_fragment_maps:U2,clearcoat_pars_fragment:D2,iridescence_pars_fragment:N2,opaque_fragment:B2,packing:F2,premultiplied_alpha_fragment:O2,project_vertex:z2,dithering_fragment:H2,dithering_pars_fragment:G2,roughnessmap_fragment:W2,roughnessmap_pars_fragment:V2,shadowmap_pars_fragment:$2,shadowmap_pars_vertex:q2,shadowmap_vertex:X2,shadowmask_pars_fragment:Y2,skinbase_vertex:K2,skinning_pars_vertex:Z2,skinning_vertex:J2,skinnormal_vertex:j2,specularmap_fragment:Q2,specularmap_pars_fragment:tS,tonemapping_fragment:eS,tonemapping_pars_fragment:nS,transmission_fragment:iS,transmission_pars_fragment:sS,uv_pars_fragment:rS,uv_pars_vertex:oS,uv_vertex:aS,worldpos_vertex:lS,background_vert:cS,background_frag:hS,backgroundCube_vert:uS,backgroundCube_frag:dS,cube_vert:fS,cube_frag:pS,depth_vert:mS,depth_frag:gS,distanceRGBA_vert:bS,distanceRGBA_frag:yS,equirect_vert:vS,equirect_frag:_S,linedashed_vert:xS,linedashed_frag:wS,meshbasic_vert:MS,meshbasic_frag:SS,meshlambert_vert:AS,meshlambert_frag:ES,meshmatcap_vert:TS,meshmatcap_frag:kS,meshnormal_vert:CS,meshnormal_frag:RS,meshphong_vert:PS,meshphong_frag:LS,meshphysical_vert:IS,meshphysical_frag:US,meshtoon_vert:DS,meshtoon_frag:NS,points_vert:BS,points_frag:FS,shadow_vert:OS,shadow_frag:zS,sprite_vert:HS,sprite_frag:GS},ut={common:{diffuse:{value:new Pt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new ee},alphaMap:{value:null},alphaMapTransform:{value:new ee},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new ee}},envmap:{envMap:{value:null},envMapRotation:{value:new ee},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new ee}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new ee}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new ee},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new ee},normalScale:{value:new Bt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new ee},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new ee}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new ee}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new ee}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Pt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Pt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new ee},alphaTest:{value:0},uvTransform:{value:new ee}},sprite:{diffuse:{value:new Pt(16777215)},opacity:{value:1},center:{value:new Bt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new ee},alphaMap:{value:null},alphaMapTransform:{value:new ee},alphaTest:{value:0}}},$i={basic:{uniforms:Rn([ut.common,ut.specularmap,ut.envmap,ut.aomap,ut.lightmap,ut.fog]),vertexShader:te.meshbasic_vert,fragmentShader:te.meshbasic_frag},lambert:{uniforms:Rn([ut.common,ut.specularmap,ut.envmap,ut.aomap,ut.lightmap,ut.emissivemap,ut.bumpmap,ut.normalmap,ut.displacementmap,ut.fog,ut.lights,{emissive:{value:new Pt(0)}}]),vertexShader:te.meshlambert_vert,fragmentShader:te.meshlambert_frag},phong:{uniforms:Rn([ut.common,ut.specularmap,ut.envmap,ut.aomap,ut.lightmap,ut.emissivemap,ut.bumpmap,ut.normalmap,ut.displacementmap,ut.fog,ut.lights,{emissive:{value:new Pt(0)},specular:{value:new Pt(1118481)},shininess:{value:30}}]),vertexShader:te.meshphong_vert,fragmentShader:te.meshphong_frag},standard:{uniforms:Rn([ut.common,ut.envmap,ut.aomap,ut.lightmap,ut.emissivemap,ut.bumpmap,ut.normalmap,ut.displacementmap,ut.roughnessmap,ut.metalnessmap,ut.fog,ut.lights,{emissive:{value:new Pt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:te.meshphysical_vert,fragmentShader:te.meshphysical_frag},toon:{uniforms:Rn([ut.common,ut.aomap,ut.lightmap,ut.emissivemap,ut.bumpmap,ut.normalmap,ut.displacementmap,ut.gradientmap,ut.fog,ut.lights,{emissive:{value:new Pt(0)}}]),vertexShader:te.meshtoon_vert,fragmentShader:te.meshtoon_frag},matcap:{uniforms:Rn([ut.common,ut.bumpmap,ut.normalmap,ut.displacementmap,ut.fog,{matcap:{value:null}}]),vertexShader:te.meshmatcap_vert,fragmentShader:te.meshmatcap_frag},points:{uniforms:Rn([ut.points,ut.fog]),vertexShader:te.points_vert,fragmentShader:te.points_frag},dashed:{uniforms:Rn([ut.common,ut.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:te.linedashed_vert,fragmentShader:te.linedashed_frag},depth:{uniforms:Rn([ut.common,ut.displacementmap]),vertexShader:te.depth_vert,fragmentShader:te.depth_frag},normal:{uniforms:Rn([ut.common,ut.bumpmap,ut.normalmap,ut.displacementmap,{opacity:{value:1}}]),vertexShader:te.meshnormal_vert,fragmentShader:te.meshnormal_frag},sprite:{uniforms:Rn([ut.sprite,ut.fog]),vertexShader:te.sprite_vert,fragmentShader:te.sprite_frag},background:{uniforms:{uvTransform:{value:new ee},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:te.background_vert,fragmentShader:te.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new ee}},vertexShader:te.backgroundCube_vert,fragmentShader:te.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:te.cube_vert,fragmentShader:te.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:te.equirect_vert,fragmentShader:te.equirect_frag},distanceRGBA:{uniforms:Rn([ut.common,ut.displacementmap,{referencePosition:{value:new V},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:te.distanceRGBA_vert,fragmentShader:te.distanceRGBA_frag},shadow:{uniforms:Rn([ut.lights,ut.fog,{color:{value:new Pt(0)},opacity:{value:1}}]),vertexShader:te.shadow_vert,fragmentShader:te.shadow_frag}};$i.physical={uniforms:Rn([$i.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new ee},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new ee},clearcoatNormalScale:{value:new Bt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new ee},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new ee},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new ee},sheen:{value:0},sheenColor:{value:new Pt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new ee},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new ee},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new ee},transmissionSamplerSize:{value:new Bt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new ee},attenuationDistance:{value:0},attenuationColor:{value:new Pt(0)},specularColor:{value:new Pt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new ee},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new ee},anisotropyVector:{value:new Bt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new ee}}]),vertexShader:te.meshphysical_vert,fragmentShader:te.meshphysical_frag};var Ic={r:0,b:0,g:0},Ar=new ys,WS=new de;function VS(i,t,e,n,s,r,o){let a=new Pt(0),l=r===!0?0:1,c,h,u=null,f=0,d=null;function g(p,m){let v=!1,y=m.isScene===!0?m.background:null;y&&y.isTexture&&(y=(m.backgroundBlurriness>0?e:t).get(y)),y===null?b(a,l):y&&y.isColor&&(b(y,1),v=!0);let _=i.xr.getEnvironmentBlendMode();_==="additive"?n.buffers.color.setClear(0,0,0,1,o):_==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,o),(i.autoClear||v)&&i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil),y&&(y.isCubeTexture||y.mapping===rh)?(h===void 0&&(h=new be(new Va(1,1,1),new we({name:"BackgroundCubeMaterial",uniforms:Wo($i.backgroundCube.uniforms),vertexShader:$i.backgroundCube.vertexShader,fragmentShader:$i.backgroundCube.fragmentShader,side:zn,depthTest:!1,depthWrite:!1,fog:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(w,S,A){this.matrixWorld.copyPosition(A.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(h)),Ar.copy(m.backgroundRotation),Ar.x*=-1,Ar.y*=-1,Ar.z*=-1,y.isCubeTexture&&y.isRenderTargetTexture===!1&&(Ar.y*=-1,Ar.z*=-1),h.material.uniforms.envMap.value=y,h.material.uniforms.flipEnvMap.value=y.isCubeTexture&&y.isRenderTargetTexture===!1?-1:1,h.material.uniforms.backgroundBlurriness.value=m.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=m.backgroundIntensity,h.material.uniforms.backgroundRotation.value.setFromMatrix4(WS.makeRotationFromEuler(Ar)),h.material.toneMapped=fe.getTransfer(y.colorSpace)!==Ae,(u!==y||f!==y.version||d!==i.toneMapping)&&(h.material.needsUpdate=!0,u=y,f=y.version,d=i.toneMapping),h.layers.enableAll(),p.unshift(h,h.geometry,h.material,0,0,null)):y&&y.isTexture&&(c===void 0&&(c=new be(new nh(2,2),new we({name:"BackgroundMaterial",uniforms:Wo($i.background.uniforms),vertexShader:$i.background.vertexShader,fragmentShader:$i.background.fragmentShader,side:yn,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(c)),c.material.uniforms.t2D.value=y,c.material.uniforms.backgroundIntensity.value=m.backgroundIntensity,c.material.toneMapped=fe.getTransfer(y.colorSpace)!==Ae,y.matrixAutoUpdate===!0&&y.updateMatrix(),c.material.uniforms.uvTransform.value.copy(y.matrix),(u!==y||f!==y.version||d!==i.toneMapping)&&(c.material.needsUpdate=!0,u=y,f=y.version,d=i.toneMapping),c.layers.enableAll(),p.unshift(c,c.geometry,c.material,0,0,null))}function b(p,m){p.getRGB(Ic,w1(i)),n.buffers.color.setClear(Ic.r,Ic.g,Ic.b,m,o)}return{getClearColor:function(){return a},setClearColor:function(p,m=1){a.set(p),l=m,b(a,l)},getClearAlpha:function(){return l},setClearAlpha:function(p){l=p,b(a,l)},render:g}}function $S(i,t,e,n){let s=i.getParameter(i.MAX_VERTEX_ATTRIBS),r=n.isWebGL2?null:t.get("OES_vertex_array_object"),o=n.isWebGL2||r!==null,a={},l=p(null),c=l,h=!1;function u(k,B,F,I,N){let z=!1;if(o){let et=b(I,F,B);c!==et&&(c=et,d(c.object)),z=m(k,I,F,N),z&&v(k,I,F,N)}else{let et=B.wireframe===!0;(c.geometry!==I.id||c.program!==F.id||c.wireframe!==et)&&(c.geometry=I.id,c.program=F.id,c.wireframe=et,z=!0)}N!==null&&e.update(N,i.ELEMENT_ARRAY_BUFFER),(z||h)&&(h=!1,R(k,B,F,I),N!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,e.get(N).buffer))}function f(){return n.isWebGL2?i.createVertexArray():r.createVertexArrayOES()}function d(k){return n.isWebGL2?i.bindVertexArray(k):r.bindVertexArrayOES(k)}function g(k){return n.isWebGL2?i.deleteVertexArray(k):r.deleteVertexArrayOES(k)}function b(k,B,F){let I=F.wireframe===!0,N=a[k.id];N===void 0&&(N={},a[k.id]=N);let z=N[B.id];z===void 0&&(z={},N[B.id]=z);let et=z[I];return et===void 0&&(et=p(f()),z[I]=et),et}function p(k){let B=[],F=[],I=[];for(let N=0;N<s;N++)B[N]=0,F[N]=0,I[N]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:B,enabledAttributes:F,attributeDivisors:I,object:k,attributes:{},index:null}}function m(k,B,F,I){let N=c.attributes,z=B.attributes,et=0,nt=F.getAttributes();for(let ot in nt)if(nt[ot].location>=0){let W=N[ot],J=z[ot];if(J===void 0&&(ot==="instanceMatrix"&&k.instanceMatrix&&(J=k.instanceMatrix),ot==="instanceColor"&&k.instanceColor&&(J=k.instanceColor)),W===void 0||W.attribute!==J||J&&W.data!==J.data)return!0;et++}return c.attributesNum!==et||c.index!==I}function v(k,B,F,I){let N={},z=B.attributes,et=0,nt=F.getAttributes();for(let ot in nt)if(nt[ot].location>=0){let W=z[ot];W===void 0&&(ot==="instanceMatrix"&&k.instanceMatrix&&(W=k.instanceMatrix),ot==="instanceColor"&&k.instanceColor&&(W=k.instanceColor));let J={};J.attribute=W,W&&W.data&&(J.data=W.data),N[ot]=J,et++}c.attributes=N,c.attributesNum=et,c.index=I}function y(){let k=c.newAttributes;for(let B=0,F=k.length;B<F;B++)k[B]=0}function _(k){w(k,0)}function w(k,B){let F=c.newAttributes,I=c.enabledAttributes,N=c.attributeDivisors;F[k]=1,I[k]===0&&(i.enableVertexAttribArray(k),I[k]=1),N[k]!==B&&((n.isWebGL2?i:t.get("ANGLE_instanced_arrays"))[n.isWebGL2?"vertexAttribDivisor":"vertexAttribDivisorANGLE"](k,B),N[k]=B)}function S(){let k=c.newAttributes,B=c.enabledAttributes;for(let F=0,I=B.length;F<I;F++)B[F]!==k[F]&&(i.disableVertexAttribArray(F),B[F]=0)}function A(k,B,F,I,N,z,et){et===!0?i.vertexAttribIPointer(k,B,F,N,z):i.vertexAttribPointer(k,B,F,I,N,z)}function R(k,B,F,I){if(n.isWebGL2===!1&&(k.isInstancedMesh||I.isInstancedBufferGeometry)&&t.get("ANGLE_instanced_arrays")===null)return;y();let N=I.attributes,z=F.getAttributes(),et=B.defaultAttributeValues;for(let nt in z){let ot=z[nt];if(ot.location>=0){let bt=N[nt];if(bt===void 0&&(nt==="instanceMatrix"&&k.instanceMatrix&&(bt=k.instanceMatrix),nt==="instanceColor"&&k.instanceColor&&(bt=k.instanceColor)),bt!==void 0){let W=bt.normalized,J=bt.itemSize,rt=e.get(bt);if(rt===void 0)continue;let tt=rt.buffer,ft=rt.type,ht=rt.bytesPerElement,Wt=n.isWebGL2===!0&&(ft===i.INT||ft===i.UNSIGNED_INT||bt.gpuType===u1);if(bt.isInterleavedBufferAttribute){let kt=bt.data,H=kt.stride,Se=bt.offset;if(kt.isInstancedInterleavedBuffer){for(let wt=0;wt<ot.locationSize;wt++)w(ot.location+wt,kt.meshPerAttribute);k.isInstancedMesh!==!0&&I._maxInstanceCount===void 0&&(I._maxInstanceCount=kt.meshPerAttribute*kt.count)}else for(let wt=0;wt<ot.locationSize;wt++)_(ot.location+wt);i.bindBuffer(i.ARRAY_BUFFER,tt);for(let wt=0;wt<ot.locationSize;wt++)A(ot.location+wt,J/ot.locationSize,ft,W,H*ht,(Se+J/ot.locationSize*wt)*ht,Wt)}else{if(bt.isInstancedBufferAttribute){for(let kt=0;kt<ot.locationSize;kt++)w(ot.location+kt,bt.meshPerAttribute);k.isInstancedMesh!==!0&&I._maxInstanceCount===void 0&&(I._maxInstanceCount=bt.meshPerAttribute*bt.count)}else for(let kt=0;kt<ot.locationSize;kt++)_(ot.location+kt);i.bindBuffer(i.ARRAY_BUFFER,tt);for(let kt=0;kt<ot.locationSize;kt++)A(ot.location+kt,J/ot.locationSize,ft,W,J*ht,J/ot.locationSize*kt*ht,Wt)}}else if(et!==void 0){let W=et[nt];if(W!==void 0)switch(W.length){case 2:i.vertexAttrib2fv(ot.location,W);break;case 3:i.vertexAttrib3fv(ot.location,W);break;case 4:i.vertexAttrib4fv(ot.location,W);break;default:i.vertexAttrib1fv(ot.location,W)}}}}S()}function P(){D();for(let k in a){let B=a[k];for(let F in B){let I=B[F];for(let N in I)g(I[N].object),delete I[N];delete B[F]}delete a[k]}}function x(k){if(a[k.id]===void 0)return;let B=a[k.id];for(let F in B){let I=B[F];for(let N in I)g(I[N].object),delete I[N];delete B[F]}delete a[k.id]}function T(k){for(let B in a){let F=a[B];if(F[k.id]===void 0)continue;let I=F[k.id];for(let N in I)g(I[N].object),delete I[N];delete F[k.id]}}function D(){U(),h=!0,c!==l&&(c=l,d(c.object))}function U(){l.geometry=null,l.program=null,l.wireframe=!1}return{setup:u,reset:D,resetDefaultState:U,dispose:P,releaseStatesOfGeometry:x,releaseStatesOfProgram:T,initAttributes:y,enableAttribute:_,disableUnusedAttributes:S}}function qS(i,t,e,n){let s=n.isWebGL2,r;function o(h){r=h}function a(h,u){i.drawArrays(r,h,u),e.update(u,r,1)}function l(h,u,f){if(f===0)return;let d,g;if(s)d=i,g="drawArraysInstanced";else if(d=t.get("ANGLE_instanced_arrays"),g="drawArraysInstancedANGLE",d===null){console.error("THREE.WebGLBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}d[g](r,h,u,f),e.update(u,r,f)}function c(h,u,f){if(f===0)return;let d=t.get("WEBGL_multi_draw");if(d===null)for(let g=0;g<f;g++)this.render(h[g],u[g]);else{d.multiDrawArraysWEBGL(r,h,0,u,0,f);let g=0;for(let b=0;b<f;b++)g+=u[b];e.update(g,r,1)}}this.setMode=o,this.render=a,this.renderInstances=l,this.renderMultiDraw=c}function XS(i,t,e){let n;function s(){if(n!==void 0)return n;if(t.has("EXT_texture_filter_anisotropic")===!0){let A=t.get("EXT_texture_filter_anisotropic");n=i.getParameter(A.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else n=0;return n}function r(A){if(A==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";A="mediump"}return A==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let o=typeof WebGL2RenderingContext!="undefined"&&i.constructor.name==="WebGL2RenderingContext",a=e.precision!==void 0?e.precision:"highp",l=r(a);l!==a&&(console.warn("THREE.WebGLRenderer:",a,"not supported, using",l,"instead."),a=l);let c=o||t.has("WEBGL_draw_buffers"),h=e.logarithmicDepthBuffer===!0,u=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),f=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),d=i.getParameter(i.MAX_TEXTURE_SIZE),g=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),b=i.getParameter(i.MAX_VERTEX_ATTRIBS),p=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),m=i.getParameter(i.MAX_VARYING_VECTORS),v=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),y=f>0,_=o||t.has("OES_texture_float"),w=y&&_,S=o?i.getParameter(i.MAX_SAMPLES):0;return{isWebGL2:o,drawBuffers:c,getMaxAnisotropy:s,getMaxPrecision:r,precision:a,logarithmicDepthBuffer:h,maxTextures:u,maxVertexTextures:f,maxTextureSize:d,maxCubemapSize:g,maxAttributes:b,maxVertexUniforms:p,maxVaryings:m,maxFragmentUniforms:v,vertexTextures:y,floatFragmentTextures:_,floatVertexTextures:w,maxSamples:S}}function YS(i){let t=this,e=null,n=0,s=!1,r=!1,o=new fs,a=new ee,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(u,f){let d=u.length!==0||f||n!==0||s;return s=f,n=u.length,d},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(u,f){e=h(u,f,0)},this.setState=function(u,f,d){let g=u.clippingPlanes,b=u.clipIntersection,p=u.clipShadows,m=i.get(u);if(!s||g===null||g.length===0||r&&!p)r?h(null):c();else{let v=r?0:n,y=v*4,_=m.clippingState||null;l.value=_,_=h(g,f,y,d);for(let w=0;w!==y;++w)_[w]=e[w];m.clippingState=_,this.numIntersection=b?this.numPlanes:0,this.numPlanes+=v}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function h(u,f,d,g){let b=u!==null?u.length:0,p=null;if(b!==0){if(p=l.value,g!==!0||p===null){let m=d+b*4,v=f.matrixWorldInverse;a.getNormalMatrix(v),(p===null||p.length<m)&&(p=new Float32Array(m));for(let y=0,_=d;y!==b;++y,_+=4)o.copy(u[y]).applyMatrix4(v,a),o.normal.toArray(p,_),p[_+3]=o.constant}l.value=p,l.needsUpdate=!0}return t.numPlanes=b,t.numIntersection=0,p}}function KS(i){let t=new WeakMap;function e(o,a){return a===Yd?o.mapping=zo:a===Kd&&(o.mapping=Ho),o}function n(o){if(o&&o.isTexture){let a=o.mapping;if(a===Yd||a===Kd)if(t.has(o)){let l=t.get(o).texture;return e(l,o.mapping)}else{let l=o.image;if(l&&l.height>0){let c=new rf(l.height);return c.fromEquirectangularTexture(i,o),t.set(o,c),o.addEventListener("dispose",s),e(c.texture,o.mapping)}else return null}}return o}function s(o){let a=o.target;a.removeEventListener("dispose",s);let l=t.get(a);l!==void 0&&(t.delete(a),l.dispose())}function r(){t=new WeakMap}return{get:n,dispose:r}}var Br=class extends th{constructor(t=-1,e=1,n=1,s=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=s,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,s,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=n-t,o=n+t,a=s+e,l=s-e;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,o=r+c*this.view.width,a-=h*this.view.offsetY,l=a-h*this.view.height}this.projectionMatrix.makeOrthographic(r,o,a,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}},Do=4,Og=[.125,.215,.35,.446,.526,.582],Rr=20,Hd=new Br,zg=new Pt,Gd=null,Wd=0,Vd=0,Tr=(1+Math.sqrt(5))/2,Io=1/Tr,Hg=[new V(1,1,1),new V(-1,1,1),new V(1,1,-1),new V(-1,1,-1),new V(0,Tr,Io),new V(0,Tr,-Io),new V(Io,0,Tr),new V(-Io,0,Tr),new V(Tr,Io,0),new V(-Tr,Io,0)],ih=class{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(t,e=0,n=.1,s=100){Gd=this._renderer.getRenderTarget(),Wd=this._renderer.getActiveCubeFace(),Vd=this._renderer.getActiveMipmapLevel(),this._setSize(256);let r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(t,n,s,r),e>0&&this._blur(r,0,0,e),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Vg(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Wg(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodPlanes.length;t++)this._lodPlanes[t].dispose()}_cleanup(t){this._renderer.setRenderTarget(Gd,Wd,Vd),t.scissorTest=!1,Uc(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===zo||t.mapping===Ho?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),Gd=this._renderer.getRenderTarget(),Wd=this._renderer.getActiveCubeFace(),Vd=this._renderer.getActiveMipmapLevel();let n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:De,minFilter:De,generateMipmaps:!1,type:Ur,format:Fe,colorSpace:Yi,depthBuffer:!1},s=Gg(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Gg(t,e,n);let{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=ZS(r)),this._blurMaterial=JS(r,t,e)}return s}_compileMaterial(t){let e=new be(this._lodPlanes[0],t);this._renderer.compile(e,Hd)}_sceneToCubeUV(t,e,n,s){let a=new en(90,1,e,n),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],h=this._renderer,u=h.autoClear,f=h.toneMapping;h.getClearColor(zg),h.toneMapping=Ys,h.autoClear=!1;let d=new Jc({name:"PMREM.Background",side:zn,depthWrite:!1,depthTest:!1}),g=new be(new Va,d),b=!1,p=t.background;p?p.isColor&&(d.color.copy(p),t.background=null,b=!0):(d.color.copy(zg),b=!0);for(let m=0;m<6;m++){let v=m%3;v===0?(a.up.set(0,l[m],0),a.lookAt(c[m],0,0)):v===1?(a.up.set(0,0,l[m]),a.lookAt(0,c[m],0)):(a.up.set(0,l[m],0),a.lookAt(0,0,c[m]));let y=this._cubeSize;Uc(s,v*y,m>2?y:0,y,y),h.setRenderTarget(s),b&&h.render(g,a),h.render(t,a)}g.geometry.dispose(),g.material.dispose(),h.toneMapping=f,h.autoClear=u,t.background=p}_textureToCubeUV(t,e){let n=this._renderer,s=t.mapping===zo||t.mapping===Ho;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=Vg()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Wg());let r=s?this._cubemapMaterial:this._equirectMaterial,o=new be(this._lodPlanes[0],r),a=r.uniforms;a.envMap.value=t;let l=this._cubeSize;Uc(e,0,0,3*l,2*l),n.setRenderTarget(e),n.render(o,Hd)}_applyPMREM(t){let e=this._renderer,n=e.autoClear;e.autoClear=!1;for(let s=1;s<this._lodPlanes.length;s++){let r=Math.sqrt(this._sigmas[s]*this._sigmas[s]-this._sigmas[s-1]*this._sigmas[s-1]),o=Hg[(s-1)%Hg.length];this._blur(t,s-1,s,r,o)}e.autoClear=n}_blur(t,e,n,s,r){let o=this._pingPongRenderTarget;this._halfBlur(t,o,e,n,s,"latitudinal",r),this._halfBlur(o,t,n,n,s,"longitudinal",r)}_halfBlur(t,e,n,s,r,o,a){let l=this._renderer,c=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let h=3,u=new be(this._lodPlanes[s],c),f=c.uniforms,d=this._sizeLods[n]-1,g=isFinite(r)?Math.PI/(2*d):2*Math.PI/(2*Rr-1),b=r/g,p=isFinite(r)?1+Math.floor(h*b):Rr;p>Rr&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${p} samples when the maximum is set to ${Rr}`);let m=[],v=0;for(let A=0;A<Rr;++A){let R=A/b,P=Math.exp(-R*R/2);m.push(P),A===0?v+=P:A<p&&(v+=2*P)}for(let A=0;A<m.length;A++)m[A]=m[A]/v;f.envMap.value=t.texture,f.samples.value=p,f.weights.value=m,f.latitudinal.value=o==="latitudinal",a&&(f.poleAxis.value=a);let{_lodMax:y}=this;f.dTheta.value=g,f.mipInt.value=y-n;let _=this._sizeLods[s],w=3*_*(s>y-Do?s-y+Do:0),S=4*(this._cubeSize-_);Uc(e,w,S,3*_,2*_),l.setRenderTarget(e),l.render(u,Hd)}};function ZS(i){let t=[],e=[],n=[],s=i,r=i-Do+1+Og.length;for(let o=0;o<r;o++){let a=Math.pow(2,s);e.push(a);let l=1/a;o>i-Do?l=Og[o-i+Do-1]:o===0&&(l=0),n.push(l);let c=1/(a-2),h=-c,u=1+c,f=[h,h,u,h,u,u,h,h,u,u,h,u],d=6,g=6,b=3,p=2,m=1,v=new Float32Array(b*g*d),y=new Float32Array(p*g*d),_=new Float32Array(m*g*d);for(let S=0;S<d;S++){let A=S%3*2/3-1,R=S>2?0:-1,P=[A,R,0,A+2/3,R,0,A+2/3,R+1,0,A,R,0,A+2/3,R+1,0,A,R+1,0];v.set(P,b*g*S),y.set(f,p*g*S);let x=[S,S,S,S,S,S];_.set(x,m*g*S)}let w=new Ee;w.setAttribute("position",new Ht(v,b)),w.setAttribute("uv",new Ht(y,p)),w.setAttribute("faceIndex",new Ht(_,m)),t.push(w),s>Do&&s--}return{lodPlanes:t,sizeLods:e,sigmas:n}}function Gg(i,t,e){let n=new Ln(i,t,e);return n.texture.mapping=rh,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Uc(i,t,e,n,s){i.viewport.set(t,e,n,s),i.scissor.set(t,e,n,s)}function JS(i,t,e){let n=new Float32Array(Rr),s=new V(0,1,0);return new we({name:"SphericalGaussianBlur",defines:{n:Rr,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:Lf(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:li,depthTest:!1,depthWrite:!1})}function Wg(){return new we({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Lf(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:li,depthTest:!1,depthWrite:!1})}function Vg(){return new we({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Lf(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:li,depthTest:!1,depthWrite:!1})}function Lf(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function jS(i){let t=new WeakMap,e=null;function n(a){if(a&&a.isTexture){let l=a.mapping,c=l===Yd||l===Kd,h=l===zo||l===Ho;if(c||h)if(a.isRenderTargetTexture&&a.needsPMREMUpdate===!0){a.needsPMREMUpdate=!1;let u=t.get(a);return e===null&&(e=new ih(i)),u=c?e.fromEquirectangular(a,u):e.fromCubemap(a,u),t.set(a,u),u.texture}else{if(t.has(a))return t.get(a).texture;{let u=a.image;if(c&&u&&u.height>0||h&&u&&s(u)){e===null&&(e=new ih(i));let f=c?e.fromEquirectangular(a):e.fromCubemap(a);return t.set(a,f),a.addEventListener("dispose",r),f.texture}else return null}}}return a}function s(a){let l=0,c=6;for(let h=0;h<c;h++)a[h]!==void 0&&l++;return l===c}function r(a){let l=a.target;l.removeEventListener("dispose",r);let c=t.get(l);c!==void 0&&(t.delete(l),c.dispose())}function o(){t=new WeakMap,e!==null&&(e.dispose(),e=null)}return{get:n,dispose:o}}function QS(i){let t={};function e(n){if(t[n]!==void 0)return t[n];let s;switch(n){case"WEBGL_depth_texture":s=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=i.getExtension(n)}return t[n]=s,s}return{has:function(n){return e(n)!==null},init:function(n){n.isWebGL2?(e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance")):(e("WEBGL_depth_texture"),e("OES_texture_float"),e("OES_texture_half_float"),e("OES_texture_half_float_linear"),e("OES_standard_derivatives"),e("OES_element_index_uint"),e("OES_vertex_array_object"),e("ANGLE_instanced_arrays")),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture")},get:function(n){let s=e(n);return s===null&&console.warn("THREE.WebGLRenderer: "+n+" extension not supported."),s}}}function tA(i,t,e,n){let s={},r=new WeakMap;function o(u){let f=u.target;f.index!==null&&t.remove(f.index);for(let g in f.attributes)t.remove(f.attributes[g]);for(let g in f.morphAttributes){let b=f.morphAttributes[g];for(let p=0,m=b.length;p<m;p++)t.remove(b[p])}f.removeEventListener("dispose",o),delete s[f.id];let d=r.get(f);d&&(t.remove(d),r.delete(f)),n.releaseStatesOfGeometry(f),f.isInstancedBufferGeometry===!0&&delete f._maxInstanceCount,e.memory.geometries--}function a(u,f){return s[f.id]===!0||(f.addEventListener("dispose",o),s[f.id]=!0,e.memory.geometries++),f}function l(u){let f=u.attributes;for(let g in f)t.update(f[g],i.ARRAY_BUFFER);let d=u.morphAttributes;for(let g in d){let b=d[g];for(let p=0,m=b.length;p<m;p++)t.update(b[p],i.ARRAY_BUFFER)}}function c(u){let f=[],d=u.index,g=u.attributes.position,b=0;if(d!==null){let v=d.array;b=d.version;for(let y=0,_=v.length;y<_;y+=3){let w=v[y+0],S=v[y+1],A=v[y+2];f.push(w,S,S,A,A,w)}}else if(g!==void 0){let v=g.array;b=g.version;for(let y=0,_=v.length/3-1;y<_;y+=3){let w=y+0,S=y+1,A=y+2;f.push(w,S,S,A,A,w)}}else return;let p=new(_1(f)?Qc:jc)(f,1);p.version=b;let m=r.get(u);m&&t.remove(m),r.set(u,p)}function h(u){let f=r.get(u);if(f){let d=u.index;d!==null&&f.version<d.version&&c(u)}else c(u);return r.get(u)}return{get:a,update:l,getWireframeAttribute:h}}function eA(i,t,e,n){let s=n.isWebGL2,r;function o(d){r=d}let a,l;function c(d){a=d.type,l=d.bytesPerElement}function h(d,g){i.drawElements(r,g,a,d*l),e.update(g,r,1)}function u(d,g,b){if(b===0)return;let p,m;if(s)p=i,m="drawElementsInstanced";else if(p=t.get("ANGLE_instanced_arrays"),m="drawElementsInstancedANGLE",p===null){console.error("THREE.WebGLIndexedBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}p[m](r,g,a,d*l,b),e.update(g,r,b)}function f(d,g,b){if(b===0)return;let p=t.get("WEBGL_multi_draw");if(p===null)for(let m=0;m<b;m++)this.render(d[m]/l,g[m]);else{p.multiDrawElementsWEBGL(r,g,0,a,d,0,b);let m=0;for(let v=0;v<b;v++)m+=g[v];e.update(m,r,1)}}this.setMode=o,this.setIndex=c,this.render=h,this.renderInstances=u,this.renderMultiDraw=f}function nA(i){let t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,o,a){switch(e.calls++,o){case i.TRIANGLES:e.triangles+=a*(r/3);break;case i.LINES:e.lines+=a*(r/2);break;case i.LINE_STRIP:e.lines+=a*(r-1);break;case i.LINE_LOOP:e.lines+=a*r;break;case i.POINTS:e.points+=a*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function s(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:s,update:n}}function iA(i,t){return i[0]-t[0]}function sA(i,t){return Math.abs(t[1])-Math.abs(i[1])}function rA(i,t,e){let n={},s=new Float32Array(8),r=new WeakMap,o=new un,a=[];for(let c=0;c<8;c++)a[c]=[c,0];function l(c,h,u){let f=c.morphTargetInfluences;if(t.isWebGL2===!0){let d=h.morphAttributes.position||h.morphAttributes.normal||h.morphAttributes.color,g=d!==void 0?d.length:0,b=r.get(h);if(b===void 0||b.count!==g){let D=function(){x.dispose(),r.delete(h),h.removeEventListener("dispose",D)};b!==void 0&&b.texture.dispose();let p=h.morphAttributes.position!==void 0,m=h.morphAttributes.normal!==void 0,v=h.morphAttributes.color!==void 0,y=h.morphAttributes.position||[],_=h.morphAttributes.normal||[],w=h.morphAttributes.color||[],S=0;p===!0&&(S=1),m===!0&&(S=2),v===!0&&(S=3);let A=h.attributes.position.count*S,R=1;A>t.maxTextureSize&&(R=Math.ceil(A/t.maxTextureSize),A=t.maxTextureSize);let P=new Float32Array(A*R*4*g),x=new Yc(P,A,R,g);x.type=ps,x.needsUpdate=!0;let T=S*4;for(let U=0;U<g;U++){let k=y[U],B=_[U],F=w[U],I=A*R*4*U;for(let N=0;N<k.count;N++){let z=N*T;p===!0&&(o.fromBufferAttribute(k,N),P[I+z+0]=o.x,P[I+z+1]=o.y,P[I+z+2]=o.z,P[I+z+3]=0),m===!0&&(o.fromBufferAttribute(B,N),P[I+z+4]=o.x,P[I+z+5]=o.y,P[I+z+6]=o.z,P[I+z+7]=0),v===!0&&(o.fromBufferAttribute(F,N),P[I+z+8]=o.x,P[I+z+9]=o.y,P[I+z+10]=o.z,P[I+z+11]=F.itemSize===4?o.w:1)}}b={count:g,texture:x,size:new Bt(A,R)},r.set(h,b),h.addEventListener("dispose",D)}if(c.isInstancedMesh===!0&&c.morphTexture!==null)u.getUniforms().setValue(i,"morphTexture",c.morphTexture,e);else{let p=0;for(let v=0;v<f.length;v++)p+=f[v];let m=h.morphTargetsRelative?1:1-p;u.getUniforms().setValue(i,"morphTargetBaseInfluence",m),u.getUniforms().setValue(i,"morphTargetInfluences",f)}u.getUniforms().setValue(i,"morphTargetsTexture",b.texture,e),u.getUniforms().setValue(i,"morphTargetsTextureSize",b.size)}else{let d=f===void 0?0:f.length,g=n[h.id];if(g===void 0||g.length!==d){g=[];for(let y=0;y<d;y++)g[y]=[y,0];n[h.id]=g}for(let y=0;y<d;y++){let _=g[y];_[0]=y,_[1]=f[y]}g.sort(sA);for(let y=0;y<8;y++)y<d&&g[y][1]?(a[y][0]=g[y][0],a[y][1]=g[y][1]):(a[y][0]=Number.MAX_SAFE_INTEGER,a[y][1]=0);a.sort(iA);let b=h.morphAttributes.position,p=h.morphAttributes.normal,m=0;for(let y=0;y<8;y++){let _=a[y],w=_[0],S=_[1];w!==Number.MAX_SAFE_INTEGER&&S?(b&&h.getAttribute("morphTarget"+y)!==b[w]&&h.setAttribute("morphTarget"+y,b[w]),p&&h.getAttribute("morphNormal"+y)!==p[w]&&h.setAttribute("morphNormal"+y,p[w]),s[y]=S,m+=S):(b&&h.hasAttribute("morphTarget"+y)===!0&&h.deleteAttribute("morphTarget"+y),p&&h.hasAttribute("morphNormal"+y)===!0&&h.deleteAttribute("morphNormal"+y),s[y]=0)}let v=h.morphTargetsRelative?1:1-m;u.getUniforms().setValue(i,"morphTargetBaseInfluence",v),u.getUniforms().setValue(i,"morphTargetInfluences",s)}}return{update:l}}function oA(i,t,e,n){let s=new WeakMap;function r(l){let c=n.render.frame,h=l.geometry,u=t.get(l,h);if(s.get(u)!==c&&(t.update(u),s.set(u,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",a)===!1&&l.addEventListener("dispose",a),s.get(l)!==c&&(e.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&e.update(l.instanceColor,i.ARRAY_BUFFER),s.set(l,c))),l.isSkinnedMesh){let f=l.skeleton;s.get(f)!==c&&(f.update(),s.set(f,c))}return u}function o(){s=new WeakMap}function a(l){let c=l.target;c.removeEventListener("dispose",a),e.remove(c.instanceMatrix),c.instanceColor!==null&&e.remove(c.instanceColor)}return{update:r,dispose:o}}var $o=class extends Yn{constructor(t,e,n,s,r,o,a,l,c,h){if(h=h!==void 0?h:Ir,h!==Ir&&h!==Go)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&h===Ir&&(n=qi),n===void 0&&h===Go&&(n=Lr),super(null,s,r,o,a,l,h,n,c),this.isDepthTexture=!0,this.image={width:t,height:e},this.magFilter=a!==void 0?a:ue,this.minFilter=l!==void 0?l:ue,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.compareFunction=t.compareFunction,this}toJSON(t){let e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}},S1=new Yn,A1=new $o(1,1);A1.compareFunction=y1;var E1=new Yc,T1=new nf,k1=new eh,$g=[],qg=[],Xg=new Float32Array(16),Yg=new Float32Array(9),Kg=new Float32Array(4);function Yo(i,t,e){let n=i[0];if(n<=0||n>0)return i;let s=t*e,r=$g[s];if(r===void 0&&(r=new Float32Array(s),$g[s]=r),t!==0){n.toArray(r,0);for(let o=1,a=0;o!==t;++o)a+=e,i[o].toArray(r,a)}return r}function Xe(i,t){if(i.length!==t.length)return!1;for(let e=0,n=i.length;e<n;e++)if(i[e]!==t[e])return!1;return!0}function Ye(i,t){for(let e=0,n=t.length;e<n;e++)i[e]=t[e]}function ah(i,t){let e=qg[t];e===void 0&&(e=new Int32Array(t),qg[t]=e);for(let n=0;n!==t;++n)e[n]=i.allocateTextureUnit();return e}function aA(i,t){let e=this.cache;e[0]!==t&&(i.uniform1f(this.addr,t),e[0]=t)}function lA(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Xe(e,t))return;i.uniform2fv(this.addr,t),Ye(e,t)}}function cA(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(i.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(Xe(e,t))return;i.uniform3fv(this.addr,t),Ye(e,t)}}function hA(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Xe(e,t))return;i.uniform4fv(this.addr,t),Ye(e,t)}}function uA(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(Xe(e,t))return;i.uniformMatrix2fv(this.addr,!1,t),Ye(e,t)}else{if(Xe(e,n))return;Kg.set(n),i.uniformMatrix2fv(this.addr,!1,Kg),Ye(e,n)}}function dA(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(Xe(e,t))return;i.uniformMatrix3fv(this.addr,!1,t),Ye(e,t)}else{if(Xe(e,n))return;Yg.set(n),i.uniformMatrix3fv(this.addr,!1,Yg),Ye(e,n)}}function fA(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(Xe(e,t))return;i.uniformMatrix4fv(this.addr,!1,t),Ye(e,t)}else{if(Xe(e,n))return;Xg.set(n),i.uniformMatrix4fv(this.addr,!1,Xg),Ye(e,n)}}function pA(i,t){let e=this.cache;e[0]!==t&&(i.uniform1i(this.addr,t),e[0]=t)}function mA(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Xe(e,t))return;i.uniform2iv(this.addr,t),Ye(e,t)}}function gA(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Xe(e,t))return;i.uniform3iv(this.addr,t),Ye(e,t)}}function bA(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Xe(e,t))return;i.uniform4iv(this.addr,t),Ye(e,t)}}function yA(i,t){let e=this.cache;e[0]!==t&&(i.uniform1ui(this.addr,t),e[0]=t)}function vA(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Xe(e,t))return;i.uniform2uiv(this.addr,t),Ye(e,t)}}function _A(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Xe(e,t))return;i.uniform3uiv(this.addr,t),Ye(e,t)}}function xA(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Xe(e,t))return;i.uniform4uiv(this.addr,t),Ye(e,t)}}function wA(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r=this.type===i.SAMPLER_2D_SHADOW?A1:S1;e.setTexture2D(t||r,s)}function MA(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture3D(t||T1,s)}function SA(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTextureCube(t||k1,s)}function AA(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture2DArray(t||E1,s)}function EA(i){switch(i){case 5126:return aA;case 35664:return lA;case 35665:return cA;case 35666:return hA;case 35674:return uA;case 35675:return dA;case 35676:return fA;case 5124:case 35670:return pA;case 35667:case 35671:return mA;case 35668:case 35672:return gA;case 35669:case 35673:return bA;case 5125:return yA;case 36294:return vA;case 36295:return _A;case 36296:return xA;case 35678:case 36198:case 36298:case 36306:case 35682:return wA;case 35679:case 36299:case 36307:return MA;case 35680:case 36300:case 36308:case 36293:return SA;case 36289:case 36303:case 36311:case 36292:return AA}}function TA(i,t){i.uniform1fv(this.addr,t)}function kA(i,t){let e=Yo(t,this.size,2);i.uniform2fv(this.addr,e)}function CA(i,t){let e=Yo(t,this.size,3);i.uniform3fv(this.addr,e)}function RA(i,t){let e=Yo(t,this.size,4);i.uniform4fv(this.addr,e)}function PA(i,t){let e=Yo(t,this.size,4);i.uniformMatrix2fv(this.addr,!1,e)}function LA(i,t){let e=Yo(t,this.size,9);i.uniformMatrix3fv(this.addr,!1,e)}function IA(i,t){let e=Yo(t,this.size,16);i.uniformMatrix4fv(this.addr,!1,e)}function UA(i,t){i.uniform1iv(this.addr,t)}function DA(i,t){i.uniform2iv(this.addr,t)}function NA(i,t){i.uniform3iv(this.addr,t)}function BA(i,t){i.uniform4iv(this.addr,t)}function FA(i,t){i.uniform1uiv(this.addr,t)}function OA(i,t){i.uniform2uiv(this.addr,t)}function zA(i,t){i.uniform3uiv(this.addr,t)}function HA(i,t){i.uniform4uiv(this.addr,t)}function GA(i,t,e){let n=this.cache,s=t.length,r=ah(e,s);Xe(n,r)||(i.uniform1iv(this.addr,r),Ye(n,r));for(let o=0;o!==s;++o)e.setTexture2D(t[o]||S1,r[o])}function WA(i,t,e){let n=this.cache,s=t.length,r=ah(e,s);Xe(n,r)||(i.uniform1iv(this.addr,r),Ye(n,r));for(let o=0;o!==s;++o)e.setTexture3D(t[o]||T1,r[o])}function VA(i,t,e){let n=this.cache,s=t.length,r=ah(e,s);Xe(n,r)||(i.uniform1iv(this.addr,r),Ye(n,r));for(let o=0;o!==s;++o)e.setTextureCube(t[o]||k1,r[o])}function $A(i,t,e){let n=this.cache,s=t.length,r=ah(e,s);Xe(n,r)||(i.uniform1iv(this.addr,r),Ye(n,r));for(let o=0;o!==s;++o)e.setTexture2DArray(t[o]||E1,r[o])}function qA(i){switch(i){case 5126:return TA;case 35664:return kA;case 35665:return CA;case 35666:return RA;case 35674:return PA;case 35675:return LA;case 35676:return IA;case 5124:case 35670:return UA;case 35667:case 35671:return DA;case 35668:case 35672:return NA;case 35669:case 35673:return BA;case 5125:return FA;case 36294:return OA;case 36295:return zA;case 36296:return HA;case 35678:case 36198:case 36298:case 36306:case 35682:return GA;case 35679:case 36299:case 36307:return WA;case 35680:case 36300:case 36308:case 36293:return VA;case 36289:case 36303:case 36311:case 36292:return $A}}var of=class{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=EA(e.type)}},af=class{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=qA(e.type)}},lf=class{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){let s=this.seq;for(let r=0,o=s.length;r!==o;++r){let a=s[r];a.setValue(t,e[a.id],n)}}},$d=/(\w+)(\])?(\[|\.)?/g;function Zg(i,t){i.seq.push(t),i.map[t.id]=t}function XA(i,t,e){let n=i.name,s=n.length;for($d.lastIndex=0;;){let r=$d.exec(n),o=$d.lastIndex,a=r[1],l=r[2]==="]",c=r[3];if(l&&(a=a|0),c===void 0||c==="["&&o+2===s){Zg(e,c===void 0?new of(a,i,t):new af(a,i,t));break}else{let u=e.map[a];u===void 0&&(u=new lf(a),Zg(e,u)),e=u}}}var Fo=class{constructor(t,e){this.seq=[],this.map={};let n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let s=0;s<n;++s){let r=t.getActiveUniform(e,s),o=t.getUniformLocation(e,r.name);XA(r,o,this)}}setValue(t,e,n,s){let r=this.map[e];r!==void 0&&r.setValue(t,n,s)}setOptional(t,e,n){let s=e[n];s!==void 0&&this.setValue(t,n,s)}static upload(t,e,n,s){for(let r=0,o=e.length;r!==o;++r){let a=e[r],l=n[a.id];l.needsUpdate!==!1&&a.setValue(t,l.value,s)}}static seqWithValue(t,e){let n=[];for(let s=0,r=t.length;s!==r;++s){let o=t[s];o.id in e&&n.push(o)}return n}};function Jg(i,t,e){let n=i.createShader(t);return i.shaderSource(n,e),i.compileShader(n),n}var YA=37297,KA=0;function ZA(i,t){let e=i.split(`
`),n=[],s=Math.max(t-6,0),r=Math.min(t+6,e.length);for(let o=s;o<r;o++){let a=o+1;n.push(`${a===t?">":" "} ${a}: ${e[o]}`)}return n.join(`
`)}function JA(i){let t=fe.getPrimaries(fe.workingColorSpace),e=fe.getPrimaries(i),n;switch(t===e?n="":t===Wc&&e===Gc?n="LinearDisplayP3ToLinearSRGB":t===Gc&&e===Wc&&(n="LinearSRGBToLinearDisplayP3"),i){case Yi:case oh:return[n,"LinearTransferOETF"];case Vi:case Pf:return[n,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space:",i),[n,"LinearTransferOETF"]}}function jg(i,t,e){let n=i.getShaderParameter(t,i.COMPILE_STATUS),s=i.getShaderInfoLog(t).trim();if(n&&s==="")return"";let r=/ERROR: 0:(\d+)/.exec(s);if(r){let o=parseInt(r[1]);return e.toUpperCase()+`

`+s+`

`+ZA(i.getShaderSource(t),o)}else return s}function jA(i,t){let e=JA(t);return`vec4 ${i}( vec4 value ) { return ${e[0]}( ${e[1]}( value ) ); }`}function QA(i,t){let e;switch(t){case fw:e="Linear";break;case pw:e="Reinhard";break;case mw:e="OptimizedCineon";break;case gw:e="ACESFilmic";break;case yw:e="AgX";break;case vw:e="Neutral";break;case bw:e="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",t),e="Linear"}return"vec3 "+i+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}function tE(i){return[i.extensionDerivatives||i.envMapCubeUVHeight||i.bumpMap||i.normalMapTangentSpace||i.clearcoatNormalMap||i.flatShading||i.alphaToCoverage||i.shaderID==="physical"?"#extension GL_OES_standard_derivatives : enable":"",(i.extensionFragDepth||i.logarithmicDepthBuffer)&&i.rendererExtensionFragDepth?"#extension GL_EXT_frag_depth : enable":"",i.extensionDrawBuffers&&i.rendererExtensionDrawBuffers?"#extension GL_EXT_draw_buffers : require":"",(i.extensionShaderTextureLOD||i.envMap||i.transmission)&&i.rendererExtensionShaderTextureLod?"#extension GL_EXT_shader_texture_lod : enable":""].filter(No).join(`
`)}function eE(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(No).join(`
`)}function nE(i){let t=[];for(let e in i){let n=i[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function iE(i,t){let e={},n=i.getProgramParameter(t,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){let r=i.getActiveAttrib(t,s),o=r.name,a=1;r.type===i.FLOAT_MAT2&&(a=2),r.type===i.FLOAT_MAT3&&(a=3),r.type===i.FLOAT_MAT4&&(a=4),e[o]={type:r.type,location:i.getAttribLocation(t,o),locationSize:a}}return e}function No(i){return i!==""}function Qg(i,t){let e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function t1(i,t){return i.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var sE=/^[ \t]*#include +<([\w\d./]+)>/gm;function cf(i){return i.replace(sE,oE)}var rE=new Map([["encodings_fragment","colorspace_fragment"],["encodings_pars_fragment","colorspace_pars_fragment"],["output_fragment","opaque_fragment"]]);function oE(i,t){let e=te[t];if(e===void 0){let n=rE.get(t);if(n!==void 0)e=te[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("Can not resolve #include <"+t+">")}return cf(e)}var aE=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function e1(i){return i.replace(aE,lE)}function lE(i,t,e,n){let s="";for(let r=parseInt(t);r<parseInt(e);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function n1(i){let t=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	`;return i.isWebGL2&&(t+=`precision ${i.precision} sampler3D;
		precision ${i.precision} sampler2DArray;
		precision ${i.precision} sampler2DShadow;
		precision ${i.precision} samplerCubeShadow;
		precision ${i.precision} sampler2DArrayShadow;
		precision ${i.precision} isampler2D;
		precision ${i.precision} isampler3D;
		precision ${i.precision} isamplerCube;
		precision ${i.precision} isampler2DArray;
		precision ${i.precision} usampler2D;
		precision ${i.precision} usampler3D;
		precision ${i.precision} usamplerCube;
		precision ${i.precision} usampler2DArray;
		`),i.precision==="highp"?t+=`
#define HIGH_PRECISION`:i.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}function cE(i){let t="SHADOWMAP_TYPE_BASIC";return i.shadowMapType===l1?t="SHADOWMAP_TYPE_PCF":i.shadowMapType===Hx?t="SHADOWMAP_TYPE_PCF_SOFT":i.shadowMapType===ds&&(t="SHADOWMAP_TYPE_VSM"),t}function hE(i){let t="ENVMAP_TYPE_CUBE";if(i.envMap)switch(i.envMapMode){case zo:case Ho:t="ENVMAP_TYPE_CUBE";break;case rh:t="ENVMAP_TYPE_CUBE_UV";break}return t}function uE(i){let t="ENVMAP_MODE_REFLECTION";if(i.envMap)switch(i.envMapMode){case Ho:t="ENVMAP_MODE_REFRACTION";break}return t}function dE(i){let t="ENVMAP_BLENDING_NONE";if(i.envMap)switch(i.combine){case c1:t="ENVMAP_BLENDING_MULTIPLY";break;case uw:t="ENVMAP_BLENDING_MIX";break;case dw:t="ENVMAP_BLENDING_ADD";break}return t}function fE(i){let t=i.envMapCubeUVHeight;if(t===null)return null;let e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),7*16)),texelHeight:n,maxMip:e}}function pE(i,t,e,n){let s=i.getContext(),r=e.defines,o=e.vertexShader,a=e.fragmentShader,l=cE(e),c=hE(e),h=uE(e),u=dE(e),f=fE(e),d=e.isWebGL2?"":tE(e),g=eE(e),b=nE(r),p=s.createProgram(),m,v,y=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(m=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,b].filter(No).join(`
`),m.length>0&&(m+=`
`),v=[d,"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,b].filter(No).join(`
`),v.length>0&&(v+=`
`)):(m=[n1(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,b,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+h:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors&&e.isWebGL2?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0&&e.isWebGL2?"#define MORPHTARGETS_TEXTURE":"",e.morphTargetsCount>0&&e.isWebGL2?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0&&e.isWebGL2?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.useLegacyLights?"#define LEGACY_LIGHTS":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.logarithmicDepthBuffer&&e.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#if ( defined( USE_MORPHTARGETS ) && ! defined( MORPHTARGETS_TEXTURE ) )","	attribute vec3 morphTarget0;","	attribute vec3 morphTarget1;","	attribute vec3 morphTarget2;","	attribute vec3 morphTarget3;","	#ifdef USE_MORPHNORMALS","		attribute vec3 morphNormal0;","		attribute vec3 morphNormal1;","		attribute vec3 morphNormal2;","		attribute vec3 morphNormal3;","	#else","		attribute vec3 morphTarget4;","		attribute vec3 morphTarget5;","		attribute vec3 morphTarget6;","		attribute vec3 morphTarget7;","	#endif","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(No).join(`
`),v=[d,n1(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,b,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+h:"",e.envMap?"#define "+u:"",f?"#define CUBEUV_TEXEL_WIDTH "+f.texelWidth:"",f?"#define CUBEUV_TEXEL_HEIGHT "+f.texelHeight:"",f?"#define CUBEUV_MAX_MIP "+f.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.useLegacyLights?"#define LEGACY_LIGHTS":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.logarithmicDepthBuffer&&e.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==Ys?"#define TONE_MAPPING":"",e.toneMapping!==Ys?te.tonemapping_pars_fragment:"",e.toneMapping!==Ys?QA("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",te.colorspace_pars_fragment,jA("linearToOutputTexel",e.outputColorSpace),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(No).join(`
`)),o=cf(o),o=Qg(o,e),o=t1(o,e),a=cf(a),a=Qg(a,e),a=t1(a,e),o=e1(o),a=e1(a),e.isWebGL2&&e.isRawShaderMaterial!==!0&&(y=`#version 300 es
`,m=[g,"precision mediump sampler2DArray;","#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,v=["precision mediump sampler2DArray;","#define varying in",e.glslVersion===vg?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===vg?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+v);let _=y+m+o,w=y+v+a,S=Jg(s,s.VERTEX_SHADER,_),A=Jg(s,s.FRAGMENT_SHADER,w);s.attachShader(p,S),s.attachShader(p,A),e.index0AttributeName!==void 0?s.bindAttribLocation(p,0,e.index0AttributeName):e.morphTargets===!0&&s.bindAttribLocation(p,0,"position"),s.linkProgram(p);function R(D){if(i.debug.checkShaderErrors){let U=s.getProgramInfoLog(p).trim(),k=s.getShaderInfoLog(S).trim(),B=s.getShaderInfoLog(A).trim(),F=!0,I=!0;if(s.getProgramParameter(p,s.LINK_STATUS)===!1)if(F=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,p,S,A);else{let N=jg(s,S,"vertex"),z=jg(s,A,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(p,s.VALIDATE_STATUS)+`

Material Name: `+D.name+`
Material Type: `+D.type+`

Program Info Log: `+U+`
`+N+`
`+z)}else U!==""?console.warn("THREE.WebGLProgram: Program Info Log:",U):(k===""||B==="")&&(I=!1);I&&(D.diagnostics={runnable:F,programLog:U,vertexShader:{log:k,prefix:m},fragmentShader:{log:B,prefix:v}})}s.deleteShader(S),s.deleteShader(A),P=new Fo(s,p),x=iE(s,p)}let P;this.getUniforms=function(){return P===void 0&&R(this),P};let x;this.getAttributes=function(){return x===void 0&&R(this),x};let T=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return T===!1&&(T=s.getProgramParameter(p,YA)),T},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(p),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=KA++,this.cacheKey=t,this.usedTimes=1,this.program=p,this.vertexShader=S,this.fragmentShader=A,this}var mE=0,hf=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){let e=t.vertexShader,n=t.fragmentShader,s=this._getShaderStage(e),r=this._getShaderStage(n),o=this._getShaderCacheForMaterial(t);return o.has(s)===!1&&(o.add(s),s.usedTimes++),o.has(r)===!1&&(o.add(r),r.usedTimes++),this}remove(t){let e=this.materialCache.get(t);for(let n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){let e=this.materialCache,n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){let e=this.shaderCache,n=e.get(t);return n===void 0&&(n=new uf(t),e.set(t,n)),n}},uf=class{constructor(t){this.id=mE++,this.code=t,this.usedTimes=0}};function gE(i,t,e,n,s,r,o){let a=new Zc,l=new hf,c=new Set,h=[],u=s.isWebGL2,f=s.logarithmicDepthBuffer,d=s.vertexTextures,g=s.precision,b={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function p(x){return c.add(x),x===0?"uv":`uv${x}`}function m(x,T,D,U,k){let B=U.fog,F=k.geometry,I=x.isMeshStandardMaterial?U.environment:null,N=(x.isMeshStandardMaterial?e:t).get(x.envMap||I),z=N&&N.mapping===rh?N.image.height:null,et=b[x.type];x.precision!==null&&(g=s.getMaxPrecision(x.precision),g!==x.precision&&console.warn("THREE.WebGLProgram.getParameters:",x.precision,"not supported, using",g,"instead."));let nt=F.morphAttributes.position||F.morphAttributes.normal||F.morphAttributes.color,ot=nt!==void 0?nt.length:0,bt=0;F.morphAttributes.position!==void 0&&(bt=1),F.morphAttributes.normal!==void 0&&(bt=2),F.morphAttributes.color!==void 0&&(bt=3);let W,J,rt,tt;if(et){let ve=$i[et];W=ve.vertexShader,J=ve.fragmentShader}else W=x.vertexShader,J=x.fragmentShader,l.update(x),rt=l.getVertexShaderID(x),tt=l.getFragmentShaderID(x);let ft=i.getRenderTarget(),ht=k.isInstancedMesh===!0,Wt=k.isBatchedMesh===!0,kt=!!x.map,H=!!x.matcap,Se=!!N,wt=!!x.aoMap,Mt=!!x.lightMap,Lt=!!x.bumpMap,se=!!x.normalMap,Vt=!!x.displacementMap,Yt=!!x.emissiveMap,Te=!!x.metalnessMap,L=!!x.roughnessMap,E=x.anisotropy>0,Q=x.clearcoat>0,it=x.iridescence>0,at=x.sheen>0,st=x.transmission>0,Kt=E&&!!x.anisotropyMap,Ft=Q&&!!x.clearcoatMap,dt=Q&&!!x.clearcoatNormalMap,mt=Q&&!!x.clearcoatRoughnessMap,Zt=it&&!!x.iridescenceMap,lt=it&&!!x.iridescenceThicknessMap,ze=at&&!!x.sheenColorMap,re=at&&!!x.sheenRoughnessMap,It=!!x.specularMap,Tt=!!x.specularColorMap,Ct=!!x.specularIntensityMap,ce=st&&!!x.transmissionMap,qt=st&&!!x.thicknessMap,ke=!!x.gradientMap,O=!!x.alphaMap,pt=x.alphaTest>0,X=!!x.alphaHash,ct=!!x.extensions,gt=Ys;x.toneMapped&&(ft===null||ft.isXRRenderTarget===!0)&&(gt=i.toneMapping);let oe={isWebGL2:u,shaderID:et,shaderType:x.type,shaderName:x.name,vertexShader:W,fragmentShader:J,defines:x.defines,customVertexShaderID:rt,customFragmentShaderID:tt,isRawShaderMaterial:x.isRawShaderMaterial===!0,glslVersion:x.glslVersion,precision:g,batching:Wt,instancing:ht,instancingColor:ht&&k.instanceColor!==null,instancingMorph:ht&&k.morphTexture!==null,supportsVertexTextures:d,outputColorSpace:ft===null?i.outputColorSpace:ft.isXRRenderTarget===!0?ft.texture.colorSpace:Yi,alphaToCoverage:!!x.alphaToCoverage,map:kt,matcap:H,envMap:Se,envMapMode:Se&&N.mapping,envMapCubeUVHeight:z,aoMap:wt,lightMap:Mt,bumpMap:Lt,normalMap:se,displacementMap:d&&Vt,emissiveMap:Yt,normalMapObjectSpace:se&&x.normalMapType===Pw,normalMapTangentSpace:se&&x.normalMapType===Rw,metalnessMap:Te,roughnessMap:L,anisotropy:E,anisotropyMap:Kt,clearcoat:Q,clearcoatMap:Ft,clearcoatNormalMap:dt,clearcoatRoughnessMap:mt,iridescence:it,iridescenceMap:Zt,iridescenceThicknessMap:lt,sheen:at,sheenColorMap:ze,sheenRoughnessMap:re,specularMap:It,specularColorMap:Tt,specularIntensityMap:Ct,transmission:st,transmissionMap:ce,thicknessMap:qt,gradientMap:ke,opaque:x.transparent===!1&&x.blending===gs&&x.alphaToCoverage===!1,alphaMap:O,alphaTest:pt,alphaHash:X,combine:x.combine,mapUv:kt&&p(x.map.channel),aoMapUv:wt&&p(x.aoMap.channel),lightMapUv:Mt&&p(x.lightMap.channel),bumpMapUv:Lt&&p(x.bumpMap.channel),normalMapUv:se&&p(x.normalMap.channel),displacementMapUv:Vt&&p(x.displacementMap.channel),emissiveMapUv:Yt&&p(x.emissiveMap.channel),metalnessMapUv:Te&&p(x.metalnessMap.channel),roughnessMapUv:L&&p(x.roughnessMap.channel),anisotropyMapUv:Kt&&p(x.anisotropyMap.channel),clearcoatMapUv:Ft&&p(x.clearcoatMap.channel),clearcoatNormalMapUv:dt&&p(x.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:mt&&p(x.clearcoatRoughnessMap.channel),iridescenceMapUv:Zt&&p(x.iridescenceMap.channel),iridescenceThicknessMapUv:lt&&p(x.iridescenceThicknessMap.channel),sheenColorMapUv:ze&&p(x.sheenColorMap.channel),sheenRoughnessMapUv:re&&p(x.sheenRoughnessMap.channel),specularMapUv:It&&p(x.specularMap.channel),specularColorMapUv:Tt&&p(x.specularColorMap.channel),specularIntensityMapUv:Ct&&p(x.specularIntensityMap.channel),transmissionMapUv:ce&&p(x.transmissionMap.channel),thicknessMapUv:qt&&p(x.thicknessMap.channel),alphaMapUv:O&&p(x.alphaMap.channel),vertexTangents:!!F.attributes.tangent&&(se||E),vertexColors:x.vertexColors,vertexAlphas:x.vertexColors===!0&&!!F.attributes.color&&F.attributes.color.itemSize===4,pointsUvs:k.isPoints===!0&&!!F.attributes.uv&&(kt||O),fog:!!B,useFog:x.fog===!0,fogExp2:!!B&&B.isFogExp2,flatShading:x.flatShading===!0,sizeAttenuation:x.sizeAttenuation===!0,logarithmicDepthBuffer:f,skinning:k.isSkinnedMesh===!0,morphTargets:F.morphAttributes.position!==void 0,morphNormals:F.morphAttributes.normal!==void 0,morphColors:F.morphAttributes.color!==void 0,morphTargetsCount:ot,morphTextureStride:bt,numDirLights:T.directional.length,numPointLights:T.point.length,numSpotLights:T.spot.length,numSpotLightMaps:T.spotLightMap.length,numRectAreaLights:T.rectArea.length,numHemiLights:T.hemi.length,numDirLightShadows:T.directionalShadowMap.length,numPointLightShadows:T.pointShadowMap.length,numSpotLightShadows:T.spotShadowMap.length,numSpotLightShadowsWithMaps:T.numSpotLightShadowsWithMaps,numLightProbes:T.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:x.dithering,shadowMapEnabled:i.shadowMap.enabled&&D.length>0,shadowMapType:i.shadowMap.type,toneMapping:gt,useLegacyLights:i._useLegacyLights,decodeVideoTexture:kt&&x.map.isVideoTexture===!0&&fe.getTransfer(x.map.colorSpace)===Ae,premultipliedAlpha:x.premultipliedAlpha,doubleSided:x.side===nn,flipSided:x.side===zn,useDepthPacking:x.depthPacking>=0,depthPacking:x.depthPacking||0,index0AttributeName:x.index0AttributeName,extensionDerivatives:ct&&x.extensions.derivatives===!0,extensionFragDepth:ct&&x.extensions.fragDepth===!0,extensionDrawBuffers:ct&&x.extensions.drawBuffers===!0,extensionShaderTextureLOD:ct&&x.extensions.shaderTextureLOD===!0,extensionClipCullDistance:ct&&x.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:ct&&x.extensions.multiDraw===!0&&n.has("WEBGL_multi_draw"),rendererExtensionFragDepth:u||n.has("EXT_frag_depth"),rendererExtensionDrawBuffers:u||n.has("WEBGL_draw_buffers"),rendererExtensionShaderTextureLod:u||n.has("EXT_shader_texture_lod"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:x.customProgramCacheKey()};return oe.vertexUv1s=c.has(1),oe.vertexUv2s=c.has(2),oe.vertexUv3s=c.has(3),c.clear(),oe}function v(x){let T=[];if(x.shaderID?T.push(x.shaderID):(T.push(x.customVertexShaderID),T.push(x.customFragmentShaderID)),x.defines!==void 0)for(let D in x.defines)T.push(D),T.push(x.defines[D]);return x.isRawShaderMaterial===!1&&(y(T,x),_(T,x),T.push(i.outputColorSpace)),T.push(x.customProgramCacheKey),T.join()}function y(x,T){x.push(T.precision),x.push(T.outputColorSpace),x.push(T.envMapMode),x.push(T.envMapCubeUVHeight),x.push(T.mapUv),x.push(T.alphaMapUv),x.push(T.lightMapUv),x.push(T.aoMapUv),x.push(T.bumpMapUv),x.push(T.normalMapUv),x.push(T.displacementMapUv),x.push(T.emissiveMapUv),x.push(T.metalnessMapUv),x.push(T.roughnessMapUv),x.push(T.anisotropyMapUv),x.push(T.clearcoatMapUv),x.push(T.clearcoatNormalMapUv),x.push(T.clearcoatRoughnessMapUv),x.push(T.iridescenceMapUv),x.push(T.iridescenceThicknessMapUv),x.push(T.sheenColorMapUv),x.push(T.sheenRoughnessMapUv),x.push(T.specularMapUv),x.push(T.specularColorMapUv),x.push(T.specularIntensityMapUv),x.push(T.transmissionMapUv),x.push(T.thicknessMapUv),x.push(T.combine),x.push(T.fogExp2),x.push(T.sizeAttenuation),x.push(T.morphTargetsCount),x.push(T.morphAttributeCount),x.push(T.numDirLights),x.push(T.numPointLights),x.push(T.numSpotLights),x.push(T.numSpotLightMaps),x.push(T.numHemiLights),x.push(T.numRectAreaLights),x.push(T.numDirLightShadows),x.push(T.numPointLightShadows),x.push(T.numSpotLightShadows),x.push(T.numSpotLightShadowsWithMaps),x.push(T.numLightProbes),x.push(T.shadowMapType),x.push(T.toneMapping),x.push(T.numClippingPlanes),x.push(T.numClipIntersection),x.push(T.depthPacking)}function _(x,T){a.disableAll(),T.isWebGL2&&a.enable(0),T.supportsVertexTextures&&a.enable(1),T.instancing&&a.enable(2),T.instancingColor&&a.enable(3),T.instancingMorph&&a.enable(4),T.matcap&&a.enable(5),T.envMap&&a.enable(6),T.normalMapObjectSpace&&a.enable(7),T.normalMapTangentSpace&&a.enable(8),T.clearcoat&&a.enable(9),T.iridescence&&a.enable(10),T.alphaTest&&a.enable(11),T.vertexColors&&a.enable(12),T.vertexAlphas&&a.enable(13),T.vertexUv1s&&a.enable(14),T.vertexUv2s&&a.enable(15),T.vertexUv3s&&a.enable(16),T.vertexTangents&&a.enable(17),T.anisotropy&&a.enable(18),T.alphaHash&&a.enable(19),T.batching&&a.enable(20),x.push(a.mask),a.disableAll(),T.fog&&a.enable(0),T.useFog&&a.enable(1),T.flatShading&&a.enable(2),T.logarithmicDepthBuffer&&a.enable(3),T.skinning&&a.enable(4),T.morphTargets&&a.enable(5),T.morphNormals&&a.enable(6),T.morphColors&&a.enable(7),T.premultipliedAlpha&&a.enable(8),T.shadowMapEnabled&&a.enable(9),T.useLegacyLights&&a.enable(10),T.doubleSided&&a.enable(11),T.flipSided&&a.enable(12),T.useDepthPacking&&a.enable(13),T.dithering&&a.enable(14),T.transmission&&a.enable(15),T.sheen&&a.enable(16),T.opaque&&a.enable(17),T.pointsUvs&&a.enable(18),T.decodeVideoTexture&&a.enable(19),T.alphaToCoverage&&a.enable(20),x.push(a.mask)}function w(x){let T=b[x.type],D;if(T){let U=$i[T];D=iM.clone(U.uniforms)}else D=x.uniforms;return D}function S(x,T){let D;for(let U=0,k=h.length;U<k;U++){let B=h[U];if(B.cacheKey===T){D=B,++D.usedTimes;break}}return D===void 0&&(D=new pE(i,T,x,r),h.push(D)),D}function A(x){if(--x.usedTimes===0){let T=h.indexOf(x);h[T]=h[h.length-1],h.pop(),x.destroy()}}function R(x){l.remove(x)}function P(){l.dispose()}return{getParameters:m,getProgramCacheKey:v,getUniforms:w,acquireProgram:S,releaseProgram:A,releaseShaderCache:R,programs:h,dispose:P}}function bE(){let i=new WeakMap;function t(r){let o=i.get(r);return o===void 0&&(o={},i.set(r,o)),o}function e(r){i.delete(r)}function n(r,o,a){i.get(r)[o]=a}function s(){i=new WeakMap}return{get:t,remove:e,update:n,dispose:s}}function yE(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.material.id!==t.material.id?i.material.id-t.material.id:i.z!==t.z?i.z-t.z:i.id-t.id}function i1(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.z!==t.z?t.z-i.z:i.id-t.id}function s1(){let i=[],t=0,e=[],n=[],s=[];function r(){t=0,e.length=0,n.length=0,s.length=0}function o(u,f,d,g,b,p){let m=i[t];return m===void 0?(m={id:u.id,object:u,geometry:f,material:d,groupOrder:g,renderOrder:u.renderOrder,z:b,group:p},i[t]=m):(m.id=u.id,m.object=u,m.geometry=f,m.material=d,m.groupOrder=g,m.renderOrder=u.renderOrder,m.z=b,m.group=p),t++,m}function a(u,f,d,g,b,p){let m=o(u,f,d,g,b,p);d.transmission>0?n.push(m):d.transparent===!0?s.push(m):e.push(m)}function l(u,f,d,g,b,p){let m=o(u,f,d,g,b,p);d.transmission>0?n.unshift(m):d.transparent===!0?s.unshift(m):e.unshift(m)}function c(u,f){e.length>1&&e.sort(u||yE),n.length>1&&n.sort(f||i1),s.length>1&&s.sort(f||i1)}function h(){for(let u=t,f=i.length;u<f;u++){let d=i[u];if(d.id===null)break;d.id=null,d.object=null,d.geometry=null,d.material=null,d.group=null}}return{opaque:e,transmissive:n,transparent:s,init:r,push:a,unshift:l,finish:h,sort:c}}function vE(){let i=new WeakMap;function t(n,s){let r=i.get(n),o;return r===void 0?(o=new s1,i.set(n,[o])):s>=r.length?(o=new s1,r.push(o)):o=r[s],o}function e(){i=new WeakMap}return{get:t,dispose:e}}function _E(){let i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new V,color:new Pt};break;case"SpotLight":e={position:new V,direction:new V,color:new Pt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new V,color:new Pt,distance:0,decay:0};break;case"HemisphereLight":e={direction:new V,skyColor:new Pt,groundColor:new Pt};break;case"RectAreaLight":e={color:new Pt,position:new V,halfWidth:new V,halfHeight:new V};break}return i[t.id]=e,e}}}function xE(){let i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Bt};break;case"SpotLight":e={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Bt};break;case"PointLight":e={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Bt,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[t.id]=e,e}}}var wE=0;function ME(i,t){return(t.castShadow?2:0)-(i.castShadow?2:0)+(t.map?1:0)-(i.map?1:0)}function SE(i,t){let e=new _E,n=xE(),s={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let h=0;h<9;h++)s.probe.push(new V);let r=new V,o=new de,a=new de;function l(h,u){let f=0,d=0,g=0;for(let D=0;D<9;D++)s.probe[D].set(0,0,0);let b=0,p=0,m=0,v=0,y=0,_=0,w=0,S=0,A=0,R=0,P=0;h.sort(ME);let x=u===!0?Math.PI:1;for(let D=0,U=h.length;D<U;D++){let k=h[D],B=k.color,F=k.intensity,I=k.distance,N=k.shadow&&k.shadow.map?k.shadow.map.texture:null;if(k.isAmbientLight)f+=B.r*F*x,d+=B.g*F*x,g+=B.b*F*x;else if(k.isLightProbe){for(let z=0;z<9;z++)s.probe[z].addScaledVector(k.sh.coefficients[z],F);P++}else if(k.isDirectionalLight){let z=e.get(k);if(z.color.copy(k.color).multiplyScalar(k.intensity*x),k.castShadow){let et=k.shadow,nt=n.get(k);nt.shadowBias=et.bias,nt.shadowNormalBias=et.normalBias,nt.shadowRadius=et.radius,nt.shadowMapSize=et.mapSize,s.directionalShadow[b]=nt,s.directionalShadowMap[b]=N,s.directionalShadowMatrix[b]=k.shadow.matrix,_++}s.directional[b]=z,b++}else if(k.isSpotLight){let z=e.get(k);z.position.setFromMatrixPosition(k.matrixWorld),z.color.copy(B).multiplyScalar(F*x),z.distance=I,z.coneCos=Math.cos(k.angle),z.penumbraCos=Math.cos(k.angle*(1-k.penumbra)),z.decay=k.decay,s.spot[m]=z;let et=k.shadow;if(k.map&&(s.spotLightMap[A]=k.map,A++,et.updateMatrices(k),k.castShadow&&R++),s.spotLightMatrix[m]=et.matrix,k.castShadow){let nt=n.get(k);nt.shadowBias=et.bias,nt.shadowNormalBias=et.normalBias,nt.shadowRadius=et.radius,nt.shadowMapSize=et.mapSize,s.spotShadow[m]=nt,s.spotShadowMap[m]=N,S++}m++}else if(k.isRectAreaLight){let z=e.get(k);z.color.copy(B).multiplyScalar(F),z.halfWidth.set(k.width*.5,0,0),z.halfHeight.set(0,k.height*.5,0),s.rectArea[v]=z,v++}else if(k.isPointLight){let z=e.get(k);if(z.color.copy(k.color).multiplyScalar(k.intensity*x),z.distance=k.distance,z.decay=k.decay,k.castShadow){let et=k.shadow,nt=n.get(k);nt.shadowBias=et.bias,nt.shadowNormalBias=et.normalBias,nt.shadowRadius=et.radius,nt.shadowMapSize=et.mapSize,nt.shadowCameraNear=et.camera.near,nt.shadowCameraFar=et.camera.far,s.pointShadow[p]=nt,s.pointShadowMap[p]=N,s.pointShadowMatrix[p]=k.shadow.matrix,w++}s.point[p]=z,p++}else if(k.isHemisphereLight){let z=e.get(k);z.skyColor.copy(k.color).multiplyScalar(F*x),z.groundColor.copy(k.groundColor).multiplyScalar(F*x),s.hemi[y]=z,y++}}v>0&&(t.isWebGL2?i.has("OES_texture_float_linear")===!0?(s.rectAreaLTC1=ut.LTC_FLOAT_1,s.rectAreaLTC2=ut.LTC_FLOAT_2):(s.rectAreaLTC1=ut.LTC_HALF_1,s.rectAreaLTC2=ut.LTC_HALF_2):i.has("OES_texture_float_linear")===!0?(s.rectAreaLTC1=ut.LTC_FLOAT_1,s.rectAreaLTC2=ut.LTC_FLOAT_2):i.has("OES_texture_half_float_linear")===!0?(s.rectAreaLTC1=ut.LTC_HALF_1,s.rectAreaLTC2=ut.LTC_HALF_2):console.error("THREE.WebGLRenderer: Unable to use RectAreaLight. Missing WebGL extensions.")),s.ambient[0]=f,s.ambient[1]=d,s.ambient[2]=g;let T=s.hash;(T.directionalLength!==b||T.pointLength!==p||T.spotLength!==m||T.rectAreaLength!==v||T.hemiLength!==y||T.numDirectionalShadows!==_||T.numPointShadows!==w||T.numSpotShadows!==S||T.numSpotMaps!==A||T.numLightProbes!==P)&&(s.directional.length=b,s.spot.length=m,s.rectArea.length=v,s.point.length=p,s.hemi.length=y,s.directionalShadow.length=_,s.directionalShadowMap.length=_,s.pointShadow.length=w,s.pointShadowMap.length=w,s.spotShadow.length=S,s.spotShadowMap.length=S,s.directionalShadowMatrix.length=_,s.pointShadowMatrix.length=w,s.spotLightMatrix.length=S+A-R,s.spotLightMap.length=A,s.numSpotLightShadowsWithMaps=R,s.numLightProbes=P,T.directionalLength=b,T.pointLength=p,T.spotLength=m,T.rectAreaLength=v,T.hemiLength=y,T.numDirectionalShadows=_,T.numPointShadows=w,T.numSpotShadows=S,T.numSpotMaps=A,T.numLightProbes=P,s.version=wE++)}function c(h,u){let f=0,d=0,g=0,b=0,p=0,m=u.matrixWorldInverse;for(let v=0,y=h.length;v<y;v++){let _=h[v];if(_.isDirectionalLight){let w=s.directional[f];w.direction.setFromMatrixPosition(_.matrixWorld),r.setFromMatrixPosition(_.target.matrixWorld),w.direction.sub(r),w.direction.transformDirection(m),f++}else if(_.isSpotLight){let w=s.spot[g];w.position.setFromMatrixPosition(_.matrixWorld),w.position.applyMatrix4(m),w.direction.setFromMatrixPosition(_.matrixWorld),r.setFromMatrixPosition(_.target.matrixWorld),w.direction.sub(r),w.direction.transformDirection(m),g++}else if(_.isRectAreaLight){let w=s.rectArea[b];w.position.setFromMatrixPosition(_.matrixWorld),w.position.applyMatrix4(m),a.identity(),o.copy(_.matrixWorld),o.premultiply(m),a.extractRotation(o),w.halfWidth.set(_.width*.5,0,0),w.halfHeight.set(0,_.height*.5,0),w.halfWidth.applyMatrix4(a),w.halfHeight.applyMatrix4(a),b++}else if(_.isPointLight){let w=s.point[d];w.position.setFromMatrixPosition(_.matrixWorld),w.position.applyMatrix4(m),d++}else if(_.isHemisphereLight){let w=s.hemi[p];w.direction.setFromMatrixPosition(_.matrixWorld),w.direction.transformDirection(m),p++}}}return{setup:l,setupView:c,state:s}}function r1(i,t){let e=new SE(i,t),n=[],s=[];function r(){n.length=0,s.length=0}function o(u){n.push(u)}function a(u){s.push(u)}function l(u){e.setup(n,u)}function c(u){e.setupView(n,u)}return{init:r,state:{lightsArray:n,shadowsArray:s,lights:e},setupLights:l,setupLightsView:c,pushLight:o,pushShadow:a}}function AE(i,t){let e=new WeakMap;function n(r,o=0){let a=e.get(r),l;return a===void 0?(l=new r1(i,t),e.set(r,[l])):o>=a.length?(l=new r1(i,t),a.push(l)):l=a[o],l}function s(){e=new WeakMap}return{get:n,dispose:s}}var df=class extends Nr{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=kw,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}},ff=class extends Nr{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}},EE=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,TE=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function kE(i,t,e){let n=new Vo,s=new Bt,r=new Bt,o=new un,a=new df({depthPacking:Cw}),l=new ff,c={},h=e.maxTextureSize,u={[yn]:zn,[zn]:yn,[nn]:nn},f=new we({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Bt},radius:{value:4}},vertexShader:EE,fragmentShader:TE}),d=f.clone();d.defines.HORIZONTAL_PASS=1;let g=new Ee;g.setAttribute("position",new Ht(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let b=new be(g,f),p=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=l1;let m=this.type;this.render=function(S,A,R){if(p.enabled===!1||p.autoUpdate===!1&&p.needsUpdate===!1||S.length===0)return;let P=i.getRenderTarget(),x=i.getActiveCubeFace(),T=i.getActiveMipmapLevel(),D=i.state;D.setBlending(li),D.buffers.color.setClear(1,1,1,1),D.buffers.depth.setTest(!0),D.setScissorTest(!1);let U=m!==ds&&this.type===ds,k=m===ds&&this.type!==ds;for(let B=0,F=S.length;B<F;B++){let I=S[B],N=I.shadow;if(N===void 0){console.warn("THREE.WebGLShadowMap:",I,"has no shadow.");continue}if(N.autoUpdate===!1&&N.needsUpdate===!1)continue;s.copy(N.mapSize);let z=N.getFrameExtents();if(s.multiply(z),r.copy(N.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(r.x=Math.floor(h/z.x),s.x=r.x*z.x,N.mapSize.x=r.x),s.y>h&&(r.y=Math.floor(h/z.y),s.y=r.y*z.y,N.mapSize.y=r.y)),N.map===null||U===!0||k===!0){let nt=this.type!==ds?{minFilter:ue,magFilter:ue}:{};N.map!==null&&N.map.dispose(),N.map=new Ln(s.x,s.y,nt),N.map.texture.name=I.name+".shadowMap",N.camera.updateProjectionMatrix()}i.setRenderTarget(N.map),i.clear();let et=N.getViewportCount();for(let nt=0;nt<et;nt++){let ot=N.getViewport(nt);o.set(r.x*ot.x,r.y*ot.y,r.x*ot.z,r.y*ot.w),D.viewport(o),N.updateMatrices(I,nt),n=N.getFrustum(),_(A,R,N.camera,I,this.type)}N.isPointLightShadow!==!0&&this.type===ds&&v(N,R),N.needsUpdate=!1}m=this.type,p.needsUpdate=!1,i.setRenderTarget(P,x,T)};function v(S,A){let R=t.update(b);f.defines.VSM_SAMPLES!==S.blurSamples&&(f.defines.VSM_SAMPLES=S.blurSamples,d.defines.VSM_SAMPLES=S.blurSamples,f.needsUpdate=!0,d.needsUpdate=!0),S.mapPass===null&&(S.mapPass=new Ln(s.x,s.y)),f.uniforms.shadow_pass.value=S.map.texture,f.uniforms.resolution.value=S.mapSize,f.uniforms.radius.value=S.radius,i.setRenderTarget(S.mapPass),i.clear(),i.renderBufferDirect(A,null,R,f,b,null),d.uniforms.shadow_pass.value=S.mapPass.texture,d.uniforms.resolution.value=S.mapSize,d.uniforms.radius.value=S.radius,i.setRenderTarget(S.map),i.clear(),i.renderBufferDirect(A,null,R,d,b,null)}function y(S,A,R,P){let x=null,T=R.isPointLight===!0?S.customDistanceMaterial:S.customDepthMaterial;if(T!==void 0)x=T;else if(x=R.isPointLight===!0?l:a,i.localClippingEnabled&&A.clipShadows===!0&&Array.isArray(A.clippingPlanes)&&A.clippingPlanes.length!==0||A.displacementMap&&A.displacementScale!==0||A.alphaMap&&A.alphaTest>0||A.map&&A.alphaTest>0){let D=x.uuid,U=A.uuid,k=c[D];k===void 0&&(k={},c[D]=k);let B=k[U];B===void 0&&(B=x.clone(),k[U]=B,A.addEventListener("dispose",w)),x=B}if(x.visible=A.visible,x.wireframe=A.wireframe,P===ds?x.side=A.shadowSide!==null?A.shadowSide:A.side:x.side=A.shadowSide!==null?A.shadowSide:u[A.side],x.alphaMap=A.alphaMap,x.alphaTest=A.alphaTest,x.map=A.map,x.clipShadows=A.clipShadows,x.clippingPlanes=A.clippingPlanes,x.clipIntersection=A.clipIntersection,x.displacementMap=A.displacementMap,x.displacementScale=A.displacementScale,x.displacementBias=A.displacementBias,x.wireframeLinewidth=A.wireframeLinewidth,x.linewidth=A.linewidth,R.isPointLight===!0&&x.isMeshDistanceMaterial===!0){let D=i.properties.get(x);D.light=R}return x}function _(S,A,R,P,x){if(S.visible===!1)return;if(S.layers.test(A.layers)&&(S.isMesh||S.isLine||S.isPoints)&&(S.castShadow||S.receiveShadow&&x===ds)&&(!S.frustumCulled||n.intersectsObject(S))){S.modelViewMatrix.multiplyMatrices(R.matrixWorldInverse,S.matrixWorld);let U=t.update(S),k=S.material;if(Array.isArray(k)){let B=U.groups;for(let F=0,I=B.length;F<I;F++){let N=B[F],z=k[N.materialIndex];if(z&&z.visible){let et=y(S,z,P,x);S.onBeforeShadow(i,S,A,R,U,et,N),i.renderBufferDirect(R,null,U,et,S,N),S.onAfterShadow(i,S,A,R,U,et,N)}}}else if(k.visible){let B=y(S,k,P,x);S.onBeforeShadow(i,S,A,R,U,B,null),i.renderBufferDirect(R,null,U,B,S,null),S.onAfterShadow(i,S,A,R,U,B,null)}}let D=S.children;for(let U=0,k=D.length;U<k;U++)_(D[U],A,R,P,x)}function w(S){S.target.removeEventListener("dispose",w);for(let R in c){let P=c[R],x=S.target.uuid;x in P&&(P[x].dispose(),delete P[x])}}}function CE(i,t,e){let n=e.isWebGL2;function s(){let O=!1,pt=new un,X=null,ct=new un(0,0,0,0);return{setMask:function(gt){X!==gt&&!O&&(i.colorMask(gt,gt,gt,gt),X=gt)},setLocked:function(gt){O=gt},setClear:function(gt,oe,ve,on,Qn){Qn===!0&&(gt*=on,oe*=on,ve*=on),pt.set(gt,oe,ve,on),ct.equals(pt)===!1&&(i.clearColor(gt,oe,ve,on),ct.copy(pt))},reset:function(){O=!1,X=null,ct.set(-1,0,0,0)}}}function r(){let O=!1,pt=null,X=null,ct=null;return{setTest:function(gt){gt?ht(i.DEPTH_TEST):Wt(i.DEPTH_TEST)},setMask:function(gt){pt!==gt&&!O&&(i.depthMask(gt),pt=gt)},setFunc:function(gt){if(X!==gt){switch(gt){case sw:i.depthFunc(i.NEVER);break;case rw:i.depthFunc(i.ALWAYS);break;case ow:i.depthFunc(i.LESS);break;case Fc:i.depthFunc(i.LEQUAL);break;case aw:i.depthFunc(i.EQUAL);break;case lw:i.depthFunc(i.GEQUAL);break;case cw:i.depthFunc(i.GREATER);break;case hw:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}X=gt}},setLocked:function(gt){O=gt},setClear:function(gt){ct!==gt&&(i.clearDepth(gt),ct=gt)},reset:function(){O=!1,pt=null,X=null,ct=null}}}function o(){let O=!1,pt=null,X=null,ct=null,gt=null,oe=null,ve=null,on=null,Qn=null;return{setTest:function(_e){O||(_e?ht(i.STENCIL_TEST):Wt(i.STENCIL_TEST))},setMask:function(_e){pt!==_e&&!O&&(i.stencilMask(_e),pt=_e)},setFunc:function(_e,Sn,Di){(X!==_e||ct!==Sn||gt!==Di)&&(i.stencilFunc(_e,Sn,Di),X=_e,ct=Sn,gt=Di)},setOp:function(_e,Sn,Di){(oe!==_e||ve!==Sn||on!==Di)&&(i.stencilOp(_e,Sn,Di),oe=_e,ve=Sn,on=Di)},setLocked:function(_e){O=_e},setClear:function(_e){Qn!==_e&&(i.clearStencil(_e),Qn=_e)},reset:function(){O=!1,pt=null,X=null,ct=null,gt=null,oe=null,ve=null,on=null,Qn=null}}}let a=new s,l=new r,c=new o,h=new WeakMap,u=new WeakMap,f={},d={},g=new WeakMap,b=[],p=null,m=!1,v=null,y=null,_=null,w=null,S=null,A=null,R=null,P=new Pt(0,0,0),x=0,T=!1,D=null,U=null,k=null,B=null,F=null,I=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS),N=!1,z=0,et=i.getParameter(i.VERSION);et.indexOf("WebGL")!==-1?(z=parseFloat(/^WebGL (\d)/.exec(et)[1]),N=z>=1):et.indexOf("OpenGL ES")!==-1&&(z=parseFloat(/^OpenGL ES (\d)/.exec(et)[1]),N=z>=2);let nt=null,ot={},bt=i.getParameter(i.SCISSOR_BOX),W=i.getParameter(i.VIEWPORT),J=new un().fromArray(bt),rt=new un().fromArray(W);function tt(O,pt,X,ct){let gt=new Uint8Array(4),oe=i.createTexture();i.bindTexture(O,oe),i.texParameteri(O,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(O,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let ve=0;ve<X;ve++)n&&(O===i.TEXTURE_3D||O===i.TEXTURE_2D_ARRAY)?i.texImage3D(pt,0,i.RGBA,1,1,ct,0,i.RGBA,i.UNSIGNED_BYTE,gt):i.texImage2D(pt+ve,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,gt);return oe}let ft={};ft[i.TEXTURE_2D]=tt(i.TEXTURE_2D,i.TEXTURE_2D,1),ft[i.TEXTURE_CUBE_MAP]=tt(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),n&&(ft[i.TEXTURE_2D_ARRAY]=tt(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),ft[i.TEXTURE_3D]=tt(i.TEXTURE_3D,i.TEXTURE_3D,1,1)),a.setClear(0,0,0,1),l.setClear(1),c.setClear(0),ht(i.DEPTH_TEST),l.setFunc(Fc),Vt(!1),Yt(B0),ht(i.CULL_FACE),Lt(li);function ht(O){f[O]!==!0&&(i.enable(O),f[O]=!0)}function Wt(O){f[O]!==!1&&(i.disable(O),f[O]=!1)}function kt(O,pt){return d[O]!==pt?(i.bindFramebuffer(O,pt),d[O]=pt,n&&(O===i.DRAW_FRAMEBUFFER&&(d[i.FRAMEBUFFER]=pt),O===i.FRAMEBUFFER&&(d[i.DRAW_FRAMEBUFFER]=pt)),!0):!1}function H(O,pt){let X=b,ct=!1;if(O){X=g.get(pt),X===void 0&&(X=[],g.set(pt,X));let gt=O.textures;if(X.length!==gt.length||X[0]!==i.COLOR_ATTACHMENT0){for(let oe=0,ve=gt.length;oe<ve;oe++)X[oe]=i.COLOR_ATTACHMENT0+oe;X.length=gt.length,ct=!0}}else X[0]!==i.BACK&&(X[0]=i.BACK,ct=!0);if(ct)if(e.isWebGL2)i.drawBuffers(X);else if(t.has("WEBGL_draw_buffers")===!0)t.get("WEBGL_draw_buffers").drawBuffersWEBGL(X);else throw new Error("THREE.WebGLState: Usage of gl.drawBuffers() require WebGL2 or WEBGL_draw_buffers extension")}function Se(O){return p!==O?(i.useProgram(O),p=O,!0):!1}let wt={[kr]:i.FUNC_ADD,[Wx]:i.FUNC_SUBTRACT,[Vx]:i.FUNC_REVERSE_SUBTRACT};if(n)wt[z0]=i.MIN,wt[H0]=i.MAX;else{let O=t.get("EXT_blend_minmax");O!==null&&(wt[z0]=O.MIN_EXT,wt[H0]=O.MAX_EXT)}let Mt={[$x]:i.ZERO,[qx]:i.ONE,[Xx]:i.SRC_COLOR,[qd]:i.SRC_ALPHA,[Qx]:i.SRC_ALPHA_SATURATE,[Jx]:i.DST_COLOR,[Kx]:i.DST_ALPHA,[Yx]:i.ONE_MINUS_SRC_COLOR,[Xd]:i.ONE_MINUS_SRC_ALPHA,[jx]:i.ONE_MINUS_DST_COLOR,[Zx]:i.ONE_MINUS_DST_ALPHA,[tw]:i.CONSTANT_COLOR,[ew]:i.ONE_MINUS_CONSTANT_COLOR,[nw]:i.CONSTANT_ALPHA,[iw]:i.ONE_MINUS_CONSTANT_ALPHA};function Lt(O,pt,X,ct,gt,oe,ve,on,Qn,_e){if(O===li){m===!0&&(Wt(i.BLEND),m=!1);return}if(m===!1&&(ht(i.BLEND),m=!0),O!==Gx){if(O!==v||_e!==T){if((y!==kr||S!==kr)&&(i.blendEquation(i.FUNC_ADD),y=kr,S=kr),_e)switch(O){case gs:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Oo:i.blendFunc(i.ONE,i.ONE);break;case F0:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case O0:i.blendFuncSeparate(i.ZERO,i.SRC_COLOR,i.ZERO,i.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",O);break}else switch(O){case gs:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Oo:i.blendFunc(i.SRC_ALPHA,i.ONE);break;case F0:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case O0:i.blendFunc(i.ZERO,i.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",O);break}_=null,w=null,A=null,R=null,P.set(0,0,0),x=0,v=O,T=_e}return}gt=gt||pt,oe=oe||X,ve=ve||ct,(pt!==y||gt!==S)&&(i.blendEquationSeparate(wt[pt],wt[gt]),y=pt,S=gt),(X!==_||ct!==w||oe!==A||ve!==R)&&(i.blendFuncSeparate(Mt[X],Mt[ct],Mt[oe],Mt[ve]),_=X,w=ct,A=oe,R=ve),(on.equals(P)===!1||Qn!==x)&&(i.blendColor(on.r,on.g,on.b,Qn),P.copy(on),x=Qn),v=O,T=!1}function se(O,pt){O.side===nn?Wt(i.CULL_FACE):ht(i.CULL_FACE);let X=O.side===zn;pt&&(X=!X),Vt(X),O.blending===gs&&O.transparent===!1?Lt(li):Lt(O.blending,O.blendEquation,O.blendSrc,O.blendDst,O.blendEquationAlpha,O.blendSrcAlpha,O.blendDstAlpha,O.blendColor,O.blendAlpha,O.premultipliedAlpha),l.setFunc(O.depthFunc),l.setTest(O.depthTest),l.setMask(O.depthWrite),a.setMask(O.colorWrite);let ct=O.stencilWrite;c.setTest(ct),ct&&(c.setMask(O.stencilWriteMask),c.setFunc(O.stencilFunc,O.stencilRef,O.stencilFuncMask),c.setOp(O.stencilFail,O.stencilZFail,O.stencilZPass)),L(O.polygonOffset,O.polygonOffsetFactor,O.polygonOffsetUnits),O.alphaToCoverage===!0?ht(i.SAMPLE_ALPHA_TO_COVERAGE):Wt(i.SAMPLE_ALPHA_TO_COVERAGE)}function Vt(O){D!==O&&(O?i.frontFace(i.CW):i.frontFace(i.CCW),D=O)}function Yt(O){O!==Ox?(ht(i.CULL_FACE),O!==U&&(O===B0?i.cullFace(i.BACK):O===zx?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):Wt(i.CULL_FACE),U=O}function Te(O){O!==k&&(N&&i.lineWidth(O),k=O)}function L(O,pt,X){O?(ht(i.POLYGON_OFFSET_FILL),(B!==pt||F!==X)&&(i.polygonOffset(pt,X),B=pt,F=X)):Wt(i.POLYGON_OFFSET_FILL)}function E(O){O?ht(i.SCISSOR_TEST):Wt(i.SCISSOR_TEST)}function Q(O){O===void 0&&(O=i.TEXTURE0+I-1),nt!==O&&(i.activeTexture(O),nt=O)}function it(O,pt,X){X===void 0&&(nt===null?X=i.TEXTURE0+I-1:X=nt);let ct=ot[X];ct===void 0&&(ct={type:void 0,texture:void 0},ot[X]=ct),(ct.type!==O||ct.texture!==pt)&&(nt!==X&&(i.activeTexture(X),nt=X),i.bindTexture(O,pt||ft[O]),ct.type=O,ct.texture=pt)}function at(){let O=ot[nt];O!==void 0&&O.type!==void 0&&(i.bindTexture(O.type,null),O.type=void 0,O.texture=void 0)}function st(){try{i.compressedTexImage2D.apply(i,arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function Kt(){try{i.compressedTexImage3D.apply(i,arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function Ft(){try{i.texSubImage2D.apply(i,arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function dt(){try{i.texSubImage3D.apply(i,arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function mt(){try{i.compressedTexSubImage2D.apply(i,arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function Zt(){try{i.compressedTexSubImage3D.apply(i,arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function lt(){try{i.texStorage2D.apply(i,arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function ze(){try{i.texStorage3D.apply(i,arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function re(){try{i.texImage2D.apply(i,arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function It(){try{i.texImage3D.apply(i,arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function Tt(O){J.equals(O)===!1&&(i.scissor(O.x,O.y,O.z,O.w),J.copy(O))}function Ct(O){rt.equals(O)===!1&&(i.viewport(O.x,O.y,O.z,O.w),rt.copy(O))}function ce(O,pt){let X=u.get(pt);X===void 0&&(X=new WeakMap,u.set(pt,X));let ct=X.get(O);ct===void 0&&(ct=i.getUniformBlockIndex(pt,O.name),X.set(O,ct))}function qt(O,pt){let ct=u.get(pt).get(O);h.get(pt)!==ct&&(i.uniformBlockBinding(pt,ct,O.__bindingPointIndex),h.set(pt,ct))}function ke(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),n===!0&&(i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null)),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),f={},nt=null,ot={},d={},g=new WeakMap,b=[],p=null,m=!1,v=null,y=null,_=null,w=null,S=null,A=null,R=null,P=new Pt(0,0,0),x=0,T=!1,D=null,U=null,k=null,B=null,F=null,J.set(0,0,i.canvas.width,i.canvas.height),rt.set(0,0,i.canvas.width,i.canvas.height),a.reset(),l.reset(),c.reset()}return{buffers:{color:a,depth:l,stencil:c},enable:ht,disable:Wt,bindFramebuffer:kt,drawBuffers:H,useProgram:Se,setBlending:Lt,setMaterial:se,setFlipSided:Vt,setCullFace:Yt,setLineWidth:Te,setPolygonOffset:L,setScissorTest:E,activeTexture:Q,bindTexture:it,unbindTexture:at,compressedTexImage2D:st,compressedTexImage3D:Kt,texImage2D:re,texImage3D:It,updateUBOMapping:ce,uniformBlockBinding:qt,texStorage2D:lt,texStorage3D:ze,texSubImage2D:Ft,texSubImage3D:dt,compressedTexSubImage2D:mt,compressedTexSubImage3D:Zt,scissor:Tt,viewport:Ct,reset:ke}}function RE(i,t,e,n,s,r,o){let a=s.isWebGL2,l=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator=="undefined"?!1:/OculusBrowser/g.test(navigator.userAgent),h=new Bt,u=new WeakMap,f,d=new WeakMap,g=!1;try{g=typeof OffscreenCanvas!="undefined"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function b(L,E){return g?new OffscreenCanvas(L,E):$c("canvas")}function p(L,E,Q,it){let at=1,st=Te(L);if((st.width>it||st.height>it)&&(at=it/Math.max(st.width,st.height)),at<1||E===!0)if(typeof HTMLImageElement!="undefined"&&L instanceof HTMLImageElement||typeof HTMLCanvasElement!="undefined"&&L instanceof HTMLCanvasElement||typeof ImageBitmap!="undefined"&&L instanceof ImageBitmap||typeof VideoFrame!="undefined"&&L instanceof VideoFrame){let Kt=E?tf:Math.floor,Ft=Kt(at*st.width),dt=Kt(at*st.height);f===void 0&&(f=b(Ft,dt));let mt=Q?b(Ft,dt):f;return mt.width=Ft,mt.height=dt,mt.getContext("2d").drawImage(L,0,0,Ft,dt),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+st.width+"x"+st.height+") to ("+Ft+"x"+dt+")."),mt}else return"data"in L&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+st.width+"x"+st.height+")."),L;return L}function m(L){let E=Te(L);return _g(E.width)&&_g(E.height)}function v(L){return a?!1:L.wrapS!==ge||L.wrapT!==ge||L.minFilter!==ue&&L.minFilter!==De}function y(L,E){return L.generateMipmaps&&E&&L.minFilter!==ue&&L.minFilter!==De}function _(L){i.generateMipmap(L)}function w(L,E,Q,it,at=!1){if(a===!1)return E;if(L!==null){if(i[L]!==void 0)return i[L];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+L+"'")}let st=E;if(E===i.RED&&(Q===i.FLOAT&&(st=i.R32F),Q===i.HALF_FLOAT&&(st=i.R16F),Q===i.UNSIGNED_BYTE&&(st=i.R8)),E===i.RED_INTEGER&&(Q===i.UNSIGNED_BYTE&&(st=i.R8UI),Q===i.UNSIGNED_SHORT&&(st=i.R16UI),Q===i.UNSIGNED_INT&&(st=i.R32UI),Q===i.BYTE&&(st=i.R8I),Q===i.SHORT&&(st=i.R16I),Q===i.INT&&(st=i.R32I)),E===i.RG&&(Q===i.FLOAT&&(st=i.RG32F),Q===i.HALF_FLOAT&&(st=i.RG16F),Q===i.UNSIGNED_BYTE&&(st=i.RG8)),E===i.RG_INTEGER&&(Q===i.UNSIGNED_BYTE&&(st=i.RG8UI),Q===i.UNSIGNED_SHORT&&(st=i.RG16UI),Q===i.UNSIGNED_INT&&(st=i.RG32UI),Q===i.BYTE&&(st=i.RG8I),Q===i.SHORT&&(st=i.RG16I),Q===i.INT&&(st=i.RG32I)),E===i.RGBA){let Kt=at?Hc:fe.getTransfer(it);Q===i.FLOAT&&(st=i.RGBA32F),Q===i.HALF_FLOAT&&(st=i.RGBA16F),Q===i.UNSIGNED_BYTE&&(st=Kt===Ae?i.SRGB8_ALPHA8:i.RGBA8),Q===i.UNSIGNED_SHORT_4_4_4_4&&(st=i.RGBA4),Q===i.UNSIGNED_SHORT_5_5_5_1&&(st=i.RGB5_A1)}return(st===i.R16F||st===i.R32F||st===i.RG16F||st===i.RG32F||st===i.RGBA16F||st===i.RGBA32F)&&t.get("EXT_color_buffer_float"),st}function S(L,E,Q){return y(L,Q)===!0||L.isFramebufferTexture&&L.minFilter!==ue&&L.minFilter!==De?Math.log2(Math.max(E.width,E.height))+1:L.mipmaps!==void 0&&L.mipmaps.length>0?L.mipmaps.length:L.isCompressedTexture&&Array.isArray(L.image)?E.mipmaps.length:1}function A(L){return L===ue||L===G0||L===Cr?i.NEAREST:i.LINEAR}function R(L){let E=L.target;E.removeEventListener("dispose",R),x(E),E.isVideoTexture&&u.delete(E)}function P(L){let E=L.target;E.removeEventListener("dispose",P),D(E)}function x(L){let E=n.get(L);if(E.__webglInit===void 0)return;let Q=L.source,it=d.get(Q);if(it){let at=it[E.__cacheKey];at.usedTimes--,at.usedTimes===0&&T(L),Object.keys(it).length===0&&d.delete(Q)}n.remove(L)}function T(L){let E=n.get(L);i.deleteTexture(E.__webglTexture);let Q=L.source,it=d.get(Q);delete it[E.__cacheKey],o.memory.textures--}function D(L){let E=n.get(L);if(L.depthTexture&&L.depthTexture.dispose(),L.isWebGLCubeRenderTarget)for(let it=0;it<6;it++){if(Array.isArray(E.__webglFramebuffer[it]))for(let at=0;at<E.__webglFramebuffer[it].length;at++)i.deleteFramebuffer(E.__webglFramebuffer[it][at]);else i.deleteFramebuffer(E.__webglFramebuffer[it]);E.__webglDepthbuffer&&i.deleteRenderbuffer(E.__webglDepthbuffer[it])}else{if(Array.isArray(E.__webglFramebuffer))for(let it=0;it<E.__webglFramebuffer.length;it++)i.deleteFramebuffer(E.__webglFramebuffer[it]);else i.deleteFramebuffer(E.__webglFramebuffer);if(E.__webglDepthbuffer&&i.deleteRenderbuffer(E.__webglDepthbuffer),E.__webglMultisampledFramebuffer&&i.deleteFramebuffer(E.__webglMultisampledFramebuffer),E.__webglColorRenderbuffer)for(let it=0;it<E.__webglColorRenderbuffer.length;it++)E.__webglColorRenderbuffer[it]&&i.deleteRenderbuffer(E.__webglColorRenderbuffer[it]);E.__webglDepthRenderbuffer&&i.deleteRenderbuffer(E.__webglDepthRenderbuffer)}let Q=L.textures;for(let it=0,at=Q.length;it<at;it++){let st=n.get(Q[it]);st.__webglTexture&&(i.deleteTexture(st.__webglTexture),o.memory.textures--),n.remove(Q[it])}n.remove(L)}let U=0;function k(){U=0}function B(){let L=U;return L>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+L+" texture units while this GPU supports only "+s.maxTextures),U+=1,L}function F(L){let E=[];return E.push(L.wrapS),E.push(L.wrapT),E.push(L.wrapR||0),E.push(L.magFilter),E.push(L.minFilter),E.push(L.anisotropy),E.push(L.internalFormat),E.push(L.format),E.push(L.type),E.push(L.generateMipmaps),E.push(L.premultiplyAlpha),E.push(L.flipY),E.push(L.unpackAlignment),E.push(L.colorSpace),E.join()}function I(L,E){let Q=n.get(L);if(L.isVideoTexture&&Vt(L),L.isRenderTargetTexture===!1&&L.version>0&&Q.__version!==L.version){let it=L.image;if(it===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(it.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{rt(Q,L,E);return}}e.bindTexture(i.TEXTURE_2D,Q.__webglTexture,i.TEXTURE0+E)}function N(L,E){let Q=n.get(L);if(L.version>0&&Q.__version!==L.version){rt(Q,L,E);return}e.bindTexture(i.TEXTURE_2D_ARRAY,Q.__webglTexture,i.TEXTURE0+E)}function z(L,E){let Q=n.get(L);if(L.version>0&&Q.__version!==L.version){rt(Q,L,E);return}e.bindTexture(i.TEXTURE_3D,Q.__webglTexture,i.TEXTURE0+E)}function et(L,E){let Q=n.get(L);if(L.version>0&&Q.__version!==L.version){tt(Q,L,E);return}e.bindTexture(i.TEXTURE_CUBE_MAP,Q.__webglTexture,i.TEXTURE0+E)}let nt={[Zd]:i.REPEAT,[ge]:i.CLAMP_TO_EDGE,[Jd]:i.MIRRORED_REPEAT},ot={[ue]:i.NEAREST,[G0]:i.NEAREST_MIPMAP_NEAREST,[Cr]:i.NEAREST_MIPMAP_LINEAR,[De]:i.LINEAR,[fd]:i.LINEAR_MIPMAP_NEAREST,[Pr]:i.LINEAR_MIPMAP_LINEAR},bt={[Lw]:i.NEVER,[Fw]:i.ALWAYS,[Iw]:i.LESS,[y1]:i.LEQUAL,[Uw]:i.EQUAL,[Bw]:i.GEQUAL,[Dw]:i.GREATER,[Nw]:i.NOTEQUAL};function W(L,E,Q){if(E.type===ps&&t.has("OES_texture_float_linear")===!1&&(E.magFilter===De||E.magFilter===fd||E.magFilter===Cr||E.magFilter===Pr||E.minFilter===De||E.minFilter===fd||E.minFilter===Cr||E.minFilter===Pr)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),Q?(i.texParameteri(L,i.TEXTURE_WRAP_S,nt[E.wrapS]),i.texParameteri(L,i.TEXTURE_WRAP_T,nt[E.wrapT]),(L===i.TEXTURE_3D||L===i.TEXTURE_2D_ARRAY)&&i.texParameteri(L,i.TEXTURE_WRAP_R,nt[E.wrapR]),i.texParameteri(L,i.TEXTURE_MAG_FILTER,ot[E.magFilter]),i.texParameteri(L,i.TEXTURE_MIN_FILTER,ot[E.minFilter])):(i.texParameteri(L,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(L,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE),(L===i.TEXTURE_3D||L===i.TEXTURE_2D_ARRAY)&&i.texParameteri(L,i.TEXTURE_WRAP_R,i.CLAMP_TO_EDGE),(E.wrapS!==ge||E.wrapT!==ge)&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.wrapS and Texture.wrapT should be set to THREE.ClampToEdgeWrapping."),i.texParameteri(L,i.TEXTURE_MAG_FILTER,A(E.magFilter)),i.texParameteri(L,i.TEXTURE_MIN_FILTER,A(E.minFilter)),E.minFilter!==ue&&E.minFilter!==De&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.minFilter should be set to THREE.NearestFilter or THREE.LinearFilter.")),E.compareFunction&&(i.texParameteri(L,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(L,i.TEXTURE_COMPARE_FUNC,bt[E.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(E.magFilter===ue||E.minFilter!==Cr&&E.minFilter!==Pr||E.type===ps&&t.has("OES_texture_float_linear")===!1||a===!1&&E.type===Ur&&t.has("OES_texture_half_float_linear")===!1)return;if(E.anisotropy>1||n.get(E).__currentAnisotropy){let it=t.get("EXT_texture_filter_anisotropic");i.texParameterf(L,it.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(E.anisotropy,s.getMaxAnisotropy())),n.get(E).__currentAnisotropy=E.anisotropy}}}function J(L,E){let Q=!1;L.__webglInit===void 0&&(L.__webglInit=!0,E.addEventListener("dispose",R));let it=E.source,at=d.get(it);at===void 0&&(at={},d.set(it,at));let st=F(E);if(st!==L.__cacheKey){at[st]===void 0&&(at[st]={texture:i.createTexture(),usedTimes:0},o.memory.textures++,Q=!0),at[st].usedTimes++;let Kt=at[L.__cacheKey];Kt!==void 0&&(at[L.__cacheKey].usedTimes--,Kt.usedTimes===0&&T(E)),L.__cacheKey=st,L.__webglTexture=at[st].texture}return Q}function rt(L,E,Q){let it=i.TEXTURE_2D;(E.isDataArrayTexture||E.isCompressedArrayTexture)&&(it=i.TEXTURE_2D_ARRAY),E.isData3DTexture&&(it=i.TEXTURE_3D);let at=J(L,E),st=E.source;e.bindTexture(it,L.__webglTexture,i.TEXTURE0+Q);let Kt=n.get(st);if(st.version!==Kt.__version||at===!0){e.activeTexture(i.TEXTURE0+Q);let Ft=fe.getPrimaries(fe.workingColorSpace),dt=E.colorSpace===Xs?null:fe.getPrimaries(E.colorSpace),mt=E.colorSpace===Xs||Ft===dt?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,E.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,E.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,E.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,mt);let Zt=v(E)&&m(E.image)===!1,lt=p(E.image,Zt,!1,s.maxTextureSize);lt=Yt(E,lt);let ze=m(lt)||a,re=r.convert(E.format,E.colorSpace),It=r.convert(E.type),Tt=w(E.internalFormat,re,It,E.colorSpace,E.isVideoTexture);W(it,E,ze);let Ct,ce=E.mipmaps,qt=a&&E.isVideoTexture!==!0&&Tt!==b1,ke=Kt.__version===void 0||at===!0,O=st.dataReady,pt=S(E,lt,ze);if(E.isDepthTexture)Tt=i.DEPTH_COMPONENT,a?E.type===ps?Tt=i.DEPTH_COMPONENT32F:E.type===qi?Tt=i.DEPTH_COMPONENT24:E.type===Lr?Tt=i.DEPTH24_STENCIL8:Tt=i.DEPTH_COMPONENT16:E.type===ps&&console.error("WebGLRenderer: Floating point depth texture requires WebGL2."),E.format===Ir&&Tt===i.DEPTH_COMPONENT&&E.type!==Xa&&E.type!==qi&&(console.warn("THREE.WebGLRenderer: Use UnsignedShortType or UnsignedIntType for DepthFormat DepthTexture."),E.type=qi,It=r.convert(E.type)),E.format===Go&&Tt===i.DEPTH_COMPONENT&&(Tt=i.DEPTH_STENCIL,E.type!==Lr&&(console.warn("THREE.WebGLRenderer: Use UnsignedInt248Type for DepthStencilFormat DepthTexture."),E.type=Lr,It=r.convert(E.type))),ke&&(qt?e.texStorage2D(i.TEXTURE_2D,1,Tt,lt.width,lt.height):e.texImage2D(i.TEXTURE_2D,0,Tt,lt.width,lt.height,0,re,It,null));else if(E.isDataTexture)if(ce.length>0&&ze){qt&&ke&&e.texStorage2D(i.TEXTURE_2D,pt,Tt,ce[0].width,ce[0].height);for(let X=0,ct=ce.length;X<ct;X++)Ct=ce[X],qt?O&&e.texSubImage2D(i.TEXTURE_2D,X,0,0,Ct.width,Ct.height,re,It,Ct.data):e.texImage2D(i.TEXTURE_2D,X,Tt,Ct.width,Ct.height,0,re,It,Ct.data);E.generateMipmaps=!1}else qt?(ke&&e.texStorage2D(i.TEXTURE_2D,pt,Tt,lt.width,lt.height),O&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,lt.width,lt.height,re,It,lt.data)):e.texImage2D(i.TEXTURE_2D,0,Tt,lt.width,lt.height,0,re,It,lt.data);else if(E.isCompressedTexture)if(E.isCompressedArrayTexture){qt&&ke&&e.texStorage3D(i.TEXTURE_2D_ARRAY,pt,Tt,ce[0].width,ce[0].height,lt.depth);for(let X=0,ct=ce.length;X<ct;X++)Ct=ce[X],E.format!==Fe?re!==null?qt?O&&e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,X,0,0,0,Ct.width,Ct.height,lt.depth,re,Ct.data,0,0):e.compressedTexImage3D(i.TEXTURE_2D_ARRAY,X,Tt,Ct.width,Ct.height,lt.depth,0,Ct.data,0,0):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):qt?O&&e.texSubImage3D(i.TEXTURE_2D_ARRAY,X,0,0,0,Ct.width,Ct.height,lt.depth,re,It,Ct.data):e.texImage3D(i.TEXTURE_2D_ARRAY,X,Tt,Ct.width,Ct.height,lt.depth,0,re,It,Ct.data)}else{qt&&ke&&e.texStorage2D(i.TEXTURE_2D,pt,Tt,ce[0].width,ce[0].height);for(let X=0,ct=ce.length;X<ct;X++)Ct=ce[X],E.format!==Fe?re!==null?qt?O&&e.compressedTexSubImage2D(i.TEXTURE_2D,X,0,0,Ct.width,Ct.height,re,Ct.data):e.compressedTexImage2D(i.TEXTURE_2D,X,Tt,Ct.width,Ct.height,0,Ct.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):qt?O&&e.texSubImage2D(i.TEXTURE_2D,X,0,0,Ct.width,Ct.height,re,It,Ct.data):e.texImage2D(i.TEXTURE_2D,X,Tt,Ct.width,Ct.height,0,re,It,Ct.data)}else if(E.isDataArrayTexture)qt?(ke&&e.texStorage3D(i.TEXTURE_2D_ARRAY,pt,Tt,lt.width,lt.height,lt.depth),O&&e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,lt.width,lt.height,lt.depth,re,It,lt.data)):e.texImage3D(i.TEXTURE_2D_ARRAY,0,Tt,lt.width,lt.height,lt.depth,0,re,It,lt.data);else if(E.isData3DTexture)qt?(ke&&e.texStorage3D(i.TEXTURE_3D,pt,Tt,lt.width,lt.height,lt.depth),O&&e.texSubImage3D(i.TEXTURE_3D,0,0,0,0,lt.width,lt.height,lt.depth,re,It,lt.data)):e.texImage3D(i.TEXTURE_3D,0,Tt,lt.width,lt.height,lt.depth,0,re,It,lt.data);else if(E.isFramebufferTexture){if(ke)if(qt)e.texStorage2D(i.TEXTURE_2D,pt,Tt,lt.width,lt.height);else{let X=lt.width,ct=lt.height;for(let gt=0;gt<pt;gt++)e.texImage2D(i.TEXTURE_2D,gt,Tt,X,ct,0,re,It,null),X>>=1,ct>>=1}}else if(ce.length>0&&ze){if(qt&&ke){let X=Te(ce[0]);e.texStorage2D(i.TEXTURE_2D,pt,Tt,X.width,X.height)}for(let X=0,ct=ce.length;X<ct;X++)Ct=ce[X],qt?O&&e.texSubImage2D(i.TEXTURE_2D,X,0,0,re,It,Ct):e.texImage2D(i.TEXTURE_2D,X,Tt,re,It,Ct);E.generateMipmaps=!1}else if(qt){if(ke){let X=Te(lt);e.texStorage2D(i.TEXTURE_2D,pt,Tt,X.width,X.height)}O&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,re,It,lt)}else e.texImage2D(i.TEXTURE_2D,0,Tt,re,It,lt);y(E,ze)&&_(it),Kt.__version=st.version,E.onUpdate&&E.onUpdate(E)}L.__version=E.version}function tt(L,E,Q){if(E.image.length!==6)return;let it=J(L,E),at=E.source;e.bindTexture(i.TEXTURE_CUBE_MAP,L.__webglTexture,i.TEXTURE0+Q);let st=n.get(at);if(at.version!==st.__version||it===!0){e.activeTexture(i.TEXTURE0+Q);let Kt=fe.getPrimaries(fe.workingColorSpace),Ft=E.colorSpace===Xs?null:fe.getPrimaries(E.colorSpace),dt=E.colorSpace===Xs||Kt===Ft?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,E.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,E.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,E.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,dt);let mt=E.isCompressedTexture||E.image[0].isCompressedTexture,Zt=E.image[0]&&E.image[0].isDataTexture,lt=[];for(let X=0;X<6;X++)!mt&&!Zt?lt[X]=p(E.image[X],!1,!0,s.maxCubemapSize):lt[X]=Zt?E.image[X].image:E.image[X],lt[X]=Yt(E,lt[X]);let ze=lt[0],re=m(ze)||a,It=r.convert(E.format,E.colorSpace),Tt=r.convert(E.type),Ct=w(E.internalFormat,It,Tt,E.colorSpace),ce=a&&E.isVideoTexture!==!0,qt=st.__version===void 0||it===!0,ke=at.dataReady,O=S(E,ze,re);W(i.TEXTURE_CUBE_MAP,E,re);let pt;if(mt){ce&&qt&&e.texStorage2D(i.TEXTURE_CUBE_MAP,O,Ct,ze.width,ze.height);for(let X=0;X<6;X++){pt=lt[X].mipmaps;for(let ct=0;ct<pt.length;ct++){let gt=pt[ct];E.format!==Fe?It!==null?ce?ke&&e.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+X,ct,0,0,gt.width,gt.height,It,gt.data):e.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+X,ct,Ct,gt.width,gt.height,0,gt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):ce?ke&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+X,ct,0,0,gt.width,gt.height,It,Tt,gt.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+X,ct,Ct,gt.width,gt.height,0,It,Tt,gt.data)}}}else{if(pt=E.mipmaps,ce&&qt){pt.length>0&&O++;let X=Te(lt[0]);e.texStorage2D(i.TEXTURE_CUBE_MAP,O,Ct,X.width,X.height)}for(let X=0;X<6;X++)if(Zt){ce?ke&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+X,0,0,0,lt[X].width,lt[X].height,It,Tt,lt[X].data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+X,0,Ct,lt[X].width,lt[X].height,0,It,Tt,lt[X].data);for(let ct=0;ct<pt.length;ct++){let oe=pt[ct].image[X].image;ce?ke&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+X,ct+1,0,0,oe.width,oe.height,It,Tt,oe.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+X,ct+1,Ct,oe.width,oe.height,0,It,Tt,oe.data)}}else{ce?ke&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+X,0,0,0,It,Tt,lt[X]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+X,0,Ct,It,Tt,lt[X]);for(let ct=0;ct<pt.length;ct++){let gt=pt[ct];ce?ke&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+X,ct+1,0,0,It,Tt,gt.image[X]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+X,ct+1,Ct,It,Tt,gt.image[X])}}}y(E,re)&&_(i.TEXTURE_CUBE_MAP),st.__version=at.version,E.onUpdate&&E.onUpdate(E)}L.__version=E.version}function ft(L,E,Q,it,at,st){let Kt=r.convert(Q.format,Q.colorSpace),Ft=r.convert(Q.type),dt=w(Q.internalFormat,Kt,Ft,Q.colorSpace);if(!n.get(E).__hasExternalTextures){let Zt=Math.max(1,E.width>>st),lt=Math.max(1,E.height>>st);at===i.TEXTURE_3D||at===i.TEXTURE_2D_ARRAY?e.texImage3D(at,st,dt,Zt,lt,E.depth,0,Kt,Ft,null):e.texImage2D(at,st,dt,Zt,lt,0,Kt,Ft,null)}e.bindFramebuffer(i.FRAMEBUFFER,L),se(E)?l.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,it,at,n.get(Q).__webglTexture,0,Lt(E)):(at===i.TEXTURE_2D||at>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&at<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,it,at,n.get(Q).__webglTexture,st),e.bindFramebuffer(i.FRAMEBUFFER,null)}function ht(L,E,Q){if(i.bindRenderbuffer(i.RENDERBUFFER,L),E.depthBuffer&&!E.stencilBuffer){let it=a===!0?i.DEPTH_COMPONENT24:i.DEPTH_COMPONENT16;if(Q||se(E)){let at=E.depthTexture;at&&at.isDepthTexture&&(at.type===ps?it=i.DEPTH_COMPONENT32F:at.type===qi&&(it=i.DEPTH_COMPONENT24));let st=Lt(E);se(E)?l.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,st,it,E.width,E.height):i.renderbufferStorageMultisample(i.RENDERBUFFER,st,it,E.width,E.height)}else i.renderbufferStorage(i.RENDERBUFFER,it,E.width,E.height);i.framebufferRenderbuffer(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.RENDERBUFFER,L)}else if(E.depthBuffer&&E.stencilBuffer){let it=Lt(E);Q&&se(E)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,it,i.DEPTH24_STENCIL8,E.width,E.height):se(E)?l.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,it,i.DEPTH24_STENCIL8,E.width,E.height):i.renderbufferStorage(i.RENDERBUFFER,i.DEPTH_STENCIL,E.width,E.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.RENDERBUFFER,L)}else{let it=E.textures;for(let at=0;at<it.length;at++){let st=it[at],Kt=r.convert(st.format,st.colorSpace),Ft=r.convert(st.type),dt=w(st.internalFormat,Kt,Ft,st.colorSpace),mt=Lt(E);Q&&se(E)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,mt,dt,E.width,E.height):se(E)?l.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,mt,dt,E.width,E.height):i.renderbufferStorage(i.RENDERBUFFER,dt,E.width,E.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function Wt(L,E){if(E&&E.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(e.bindFramebuffer(i.FRAMEBUFFER,L),!(E.depthTexture&&E.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");(!n.get(E.depthTexture).__webglTexture||E.depthTexture.image.width!==E.width||E.depthTexture.image.height!==E.height)&&(E.depthTexture.image.width=E.width,E.depthTexture.image.height=E.height,E.depthTexture.needsUpdate=!0),I(E.depthTexture,0);let it=n.get(E.depthTexture).__webglTexture,at=Lt(E);if(E.depthTexture.format===Ir)se(E)?l.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,it,0,at):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,it,0);else if(E.depthTexture.format===Go)se(E)?l.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,it,0,at):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,it,0);else throw new Error("Unknown depthTexture format")}function kt(L){let E=n.get(L),Q=L.isWebGLCubeRenderTarget===!0;if(L.depthTexture&&!E.__autoAllocateDepthBuffer){if(Q)throw new Error("target.depthTexture not supported in Cube render targets");Wt(E.__webglFramebuffer,L)}else if(Q){E.__webglDepthbuffer=[];for(let it=0;it<6;it++)e.bindFramebuffer(i.FRAMEBUFFER,E.__webglFramebuffer[it]),E.__webglDepthbuffer[it]=i.createRenderbuffer(),ht(E.__webglDepthbuffer[it],L,!1)}else e.bindFramebuffer(i.FRAMEBUFFER,E.__webglFramebuffer),E.__webglDepthbuffer=i.createRenderbuffer(),ht(E.__webglDepthbuffer,L,!1);e.bindFramebuffer(i.FRAMEBUFFER,null)}function H(L,E,Q){let it=n.get(L);E!==void 0&&ft(it.__webglFramebuffer,L,L.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),Q!==void 0&&kt(L)}function Se(L){let E=L.texture,Q=n.get(L),it=n.get(E);L.addEventListener("dispose",P);let at=L.textures,st=L.isWebGLCubeRenderTarget===!0,Kt=at.length>1,Ft=m(L)||a;if(Kt||(it.__webglTexture===void 0&&(it.__webglTexture=i.createTexture()),it.__version=E.version,o.memory.textures++),st){Q.__webglFramebuffer=[];for(let dt=0;dt<6;dt++)if(a&&E.mipmaps&&E.mipmaps.length>0){Q.__webglFramebuffer[dt]=[];for(let mt=0;mt<E.mipmaps.length;mt++)Q.__webglFramebuffer[dt][mt]=i.createFramebuffer()}else Q.__webglFramebuffer[dt]=i.createFramebuffer()}else{if(a&&E.mipmaps&&E.mipmaps.length>0){Q.__webglFramebuffer=[];for(let dt=0;dt<E.mipmaps.length;dt++)Q.__webglFramebuffer[dt]=i.createFramebuffer()}else Q.__webglFramebuffer=i.createFramebuffer();if(Kt)if(s.drawBuffers)for(let dt=0,mt=at.length;dt<mt;dt++){let Zt=n.get(at[dt]);Zt.__webglTexture===void 0&&(Zt.__webglTexture=i.createTexture(),o.memory.textures++)}else console.warn("THREE.WebGLRenderer: WebGLMultipleRenderTargets can only be used with WebGL2 or WEBGL_draw_buffers extension.");if(a&&L.samples>0&&se(L)===!1){Q.__webglMultisampledFramebuffer=i.createFramebuffer(),Q.__webglColorRenderbuffer=[],e.bindFramebuffer(i.FRAMEBUFFER,Q.__webglMultisampledFramebuffer);for(let dt=0;dt<at.length;dt++){let mt=at[dt];Q.__webglColorRenderbuffer[dt]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,Q.__webglColorRenderbuffer[dt]);let Zt=r.convert(mt.format,mt.colorSpace),lt=r.convert(mt.type),ze=w(mt.internalFormat,Zt,lt,mt.colorSpace,L.isXRRenderTarget===!0),re=Lt(L);i.renderbufferStorageMultisample(i.RENDERBUFFER,re,ze,L.width,L.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+dt,i.RENDERBUFFER,Q.__webglColorRenderbuffer[dt])}i.bindRenderbuffer(i.RENDERBUFFER,null),L.depthBuffer&&(Q.__webglDepthRenderbuffer=i.createRenderbuffer(),ht(Q.__webglDepthRenderbuffer,L,!0)),e.bindFramebuffer(i.FRAMEBUFFER,null)}}if(st){e.bindTexture(i.TEXTURE_CUBE_MAP,it.__webglTexture),W(i.TEXTURE_CUBE_MAP,E,Ft);for(let dt=0;dt<6;dt++)if(a&&E.mipmaps&&E.mipmaps.length>0)for(let mt=0;mt<E.mipmaps.length;mt++)ft(Q.__webglFramebuffer[dt][mt],L,E,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+dt,mt);else ft(Q.__webglFramebuffer[dt],L,E,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+dt,0);y(E,Ft)&&_(i.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(Kt){for(let dt=0,mt=at.length;dt<mt;dt++){let Zt=at[dt],lt=n.get(Zt);e.bindTexture(i.TEXTURE_2D,lt.__webglTexture),W(i.TEXTURE_2D,Zt,Ft),ft(Q.__webglFramebuffer,L,Zt,i.COLOR_ATTACHMENT0+dt,i.TEXTURE_2D,0),y(Zt,Ft)&&_(i.TEXTURE_2D)}e.unbindTexture()}else{let dt=i.TEXTURE_2D;if((L.isWebGL3DRenderTarget||L.isWebGLArrayRenderTarget)&&(a?dt=L.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY:console.error("THREE.WebGLTextures: THREE.Data3DTexture and THREE.DataArrayTexture only supported with WebGL2.")),e.bindTexture(dt,it.__webglTexture),W(dt,E,Ft),a&&E.mipmaps&&E.mipmaps.length>0)for(let mt=0;mt<E.mipmaps.length;mt++)ft(Q.__webglFramebuffer[mt],L,E,i.COLOR_ATTACHMENT0,dt,mt);else ft(Q.__webglFramebuffer,L,E,i.COLOR_ATTACHMENT0,dt,0);y(E,Ft)&&_(dt),e.unbindTexture()}L.depthBuffer&&kt(L)}function wt(L){let E=m(L)||a,Q=L.textures;for(let it=0,at=Q.length;it<at;it++){let st=Q[it];if(y(st,E)){let Kt=L.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:i.TEXTURE_2D,Ft=n.get(st).__webglTexture;e.bindTexture(Kt,Ft),_(Kt),e.unbindTexture()}}}function Mt(L){if(a&&L.samples>0&&se(L)===!1){let E=L.textures,Q=L.width,it=L.height,at=i.COLOR_BUFFER_BIT,st=[],Kt=L.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Ft=n.get(L),dt=E.length>1;if(dt)for(let mt=0;mt<E.length;mt++)e.bindFramebuffer(i.FRAMEBUFFER,Ft.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+mt,i.RENDERBUFFER,null),e.bindFramebuffer(i.FRAMEBUFFER,Ft.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+mt,i.TEXTURE_2D,null,0);e.bindFramebuffer(i.READ_FRAMEBUFFER,Ft.__webglMultisampledFramebuffer),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,Ft.__webglFramebuffer);for(let mt=0;mt<E.length;mt++){st.push(i.COLOR_ATTACHMENT0+mt),L.depthBuffer&&st.push(Kt);let Zt=Ft.__ignoreDepthValues!==void 0?Ft.__ignoreDepthValues:!1;if(Zt===!1&&(L.depthBuffer&&(at|=i.DEPTH_BUFFER_BIT),L.stencilBuffer&&(at|=i.STENCIL_BUFFER_BIT)),dt&&i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,Ft.__webglColorRenderbuffer[mt]),Zt===!0&&(i.invalidateFramebuffer(i.READ_FRAMEBUFFER,[Kt]),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[Kt])),dt){let lt=n.get(E[mt]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,lt,0)}i.blitFramebuffer(0,0,Q,it,0,0,Q,it,at,i.NEAREST),c&&i.invalidateFramebuffer(i.READ_FRAMEBUFFER,st)}if(e.bindFramebuffer(i.READ_FRAMEBUFFER,null),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),dt)for(let mt=0;mt<E.length;mt++){e.bindFramebuffer(i.FRAMEBUFFER,Ft.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+mt,i.RENDERBUFFER,Ft.__webglColorRenderbuffer[mt]);let Zt=n.get(E[mt]).__webglTexture;e.bindFramebuffer(i.FRAMEBUFFER,Ft.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+mt,i.TEXTURE_2D,Zt,0)}e.bindFramebuffer(i.DRAW_FRAMEBUFFER,Ft.__webglMultisampledFramebuffer)}}function Lt(L){return Math.min(s.maxSamples,L.samples)}function se(L){let E=n.get(L);return a&&L.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&E.__useRenderToTexture!==!1}function Vt(L){let E=o.render.frame;u.get(L)!==E&&(u.set(L,E),L.update())}function Yt(L,E){let Q=L.colorSpace,it=L.format,at=L.type;return L.isCompressedTexture===!0||L.isVideoTexture===!0||L.format===jd||Q!==Yi&&Q!==Xs&&(fe.getTransfer(Q)===Ae?a===!1?t.has("EXT_sRGB")===!0&&it===Fe?(L.format=jd,L.minFilter=De,L.generateMipmaps=!1):E=qc.sRGBToLinear(E):(it!==Fe||at!==sn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",Q)),E}function Te(L){return typeof HTMLImageElement!="undefined"&&L instanceof HTMLImageElement?(h.width=L.naturalWidth||L.width,h.height=L.naturalHeight||L.height):typeof VideoFrame!="undefined"&&L instanceof VideoFrame?(h.width=L.displayWidth,h.height=L.displayHeight):(h.width=L.width,h.height=L.height),h}this.allocateTextureUnit=B,this.resetTextureUnits=k,this.setTexture2D=I,this.setTexture2DArray=N,this.setTexture3D=z,this.setTextureCube=et,this.rebindTextures=H,this.setupRenderTarget=Se,this.updateRenderTargetMipmap=wt,this.updateMultisampleRenderTarget=Mt,this.setupDepthRenderbuffer=kt,this.setupFrameBufferTexture=ft,this.useMultisampledRTT=se}function PE(i,t,e){let n=e.isWebGL2;function s(r,o=Xs){let a,l=fe.getTransfer(o);if(r===sn)return i.UNSIGNED_BYTE;if(r===d1)return i.UNSIGNED_SHORT_4_4_4_4;if(r===f1)return i.UNSIGNED_SHORT_5_5_5_1;if(r===_w)return i.BYTE;if(r===xw)return i.SHORT;if(r===Xa)return i.UNSIGNED_SHORT;if(r===u1)return i.INT;if(r===qi)return i.UNSIGNED_INT;if(r===ps)return i.FLOAT;if(r===Ur)return n?i.HALF_FLOAT:(a=t.get("OES_texture_half_float"),a!==null?a.HALF_FLOAT_OES:null);if(r===ww)return i.ALPHA;if(r===Fe)return i.RGBA;if(r===Mw)return i.LUMINANCE;if(r===Sw)return i.LUMINANCE_ALPHA;if(r===Ir)return i.DEPTH_COMPONENT;if(r===Go)return i.DEPTH_STENCIL;if(r===jd)return a=t.get("EXT_sRGB"),a!==null?a.SRGB_ALPHA_EXT:null;if(r===Aw)return i.RED;if(r===p1)return i.RED_INTEGER;if(r===Ew)return i.RG;if(r===m1)return i.RG_INTEGER;if(r===g1)return i.RGBA_INTEGER;if(r===pd||r===md||r===gd||r===bd)if(l===Ae)if(a=t.get("WEBGL_compressed_texture_s3tc_srgb"),a!==null){if(r===pd)return a.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(r===md)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(r===gd)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(r===bd)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(a=t.get("WEBGL_compressed_texture_s3tc"),a!==null){if(r===pd)return a.COMPRESSED_RGB_S3TC_DXT1_EXT;if(r===md)return a.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(r===gd)return a.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(r===bd)return a.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(r===W0||r===V0||r===$0||r===q0)if(a=t.get("WEBGL_compressed_texture_pvrtc"),a!==null){if(r===W0)return a.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(r===V0)return a.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(r===$0)return a.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(r===q0)return a.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(r===b1)return a=t.get("WEBGL_compressed_texture_etc1"),a!==null?a.COMPRESSED_RGB_ETC1_WEBGL:null;if(r===X0||r===Y0)if(a=t.get("WEBGL_compressed_texture_etc"),a!==null){if(r===X0)return l===Ae?a.COMPRESSED_SRGB8_ETC2:a.COMPRESSED_RGB8_ETC2;if(r===Y0)return l===Ae?a.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:a.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(r===K0||r===Z0||r===J0||r===j0||r===Q0||r===tg||r===eg||r===ng||r===ig||r===sg||r===rg||r===og||r===ag||r===lg)if(a=t.get("WEBGL_compressed_texture_astc"),a!==null){if(r===K0)return l===Ae?a.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:a.COMPRESSED_RGBA_ASTC_4x4_KHR;if(r===Z0)return l===Ae?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:a.COMPRESSED_RGBA_ASTC_5x4_KHR;if(r===J0)return l===Ae?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:a.COMPRESSED_RGBA_ASTC_5x5_KHR;if(r===j0)return l===Ae?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:a.COMPRESSED_RGBA_ASTC_6x5_KHR;if(r===Q0)return l===Ae?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:a.COMPRESSED_RGBA_ASTC_6x6_KHR;if(r===tg)return l===Ae?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:a.COMPRESSED_RGBA_ASTC_8x5_KHR;if(r===eg)return l===Ae?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:a.COMPRESSED_RGBA_ASTC_8x6_KHR;if(r===ng)return l===Ae?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:a.COMPRESSED_RGBA_ASTC_8x8_KHR;if(r===ig)return l===Ae?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:a.COMPRESSED_RGBA_ASTC_10x5_KHR;if(r===sg)return l===Ae?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:a.COMPRESSED_RGBA_ASTC_10x6_KHR;if(r===rg)return l===Ae?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:a.COMPRESSED_RGBA_ASTC_10x8_KHR;if(r===og)return l===Ae?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:a.COMPRESSED_RGBA_ASTC_10x10_KHR;if(r===ag)return l===Ae?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:a.COMPRESSED_RGBA_ASTC_12x10_KHR;if(r===lg)return l===Ae?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:a.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(r===yd||r===cg||r===hg)if(a=t.get("EXT_texture_compression_bptc"),a!==null){if(r===yd)return l===Ae?a.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:a.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(r===cg)return a.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(r===hg)return a.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(r===Tw||r===ug||r===dg||r===fg)if(a=t.get("EXT_texture_compression_rgtc"),a!==null){if(r===yd)return a.COMPRESSED_RED_RGTC1_EXT;if(r===ug)return a.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(r===dg)return a.COMPRESSED_RED_GREEN_RGTC2_EXT;if(r===fg)return a.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return r===Lr?n?i.UNSIGNED_INT_24_8:(a=t.get("WEBGL_depth_texture"),a!==null?a.UNSIGNED_INT_24_8_WEBGL:null):i[r]!==void 0?i[r]:null}return{convert:s}}var pf=class extends en{constructor(t=[]){super(),this.isArrayCamera=!0,this.cameras=t}},Pn=class extends ci{constructor(){super(),this.isGroup=!0,this.type="Group"}},LE={type:"move"},Wa=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Pn,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Pn,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new V,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new V),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Pn,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new V,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new V),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){let e=this._hand;if(e)for(let n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let s=null,r=null,o=null,a=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){o=!0;for(let b of t.hand.values()){let p=e.getJointPose(b,n),m=this._getHandJoint(c,b);p!==null&&(m.matrix.fromArray(p.transform.matrix),m.matrix.decompose(m.position,m.rotation,m.scale),m.matrixWorldNeedsUpdate=!0,m.jointRadius=p.radius),m.visible=p!==null}let h=c.joints["index-finger-tip"],u=c.joints["thumb-tip"],f=h.position.distanceTo(u.position),d=.02,g=.005;c.inputState.pinching&&f>d+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&f<=d-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(r=e.getPose(t.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));a!==null&&(s=e.getPose(t.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(a.matrix.fromArray(s.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,s.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(s.linearVelocity)):a.hasLinearVelocity=!1,s.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(s.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(LE)))}return a!==null&&(a.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=o!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){let n=new Pn;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}},IE=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,UE=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepthEXT = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepthEXT = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,mf=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e,n){if(this.texture===null){let s=new Yn,r=t.properties.get(s);r.__webglTexture=e.texture,(e.depthNear!=n.depthNear||e.depthFar!=n.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=s}}render(t,e){if(this.texture!==null){if(this.mesh===null){let n=e.cameras[0].viewport,s=new we({extensions:{fragDepth:!0},vertexShader:IE,fragmentShader:UE,uniforms:{depthColor:{value:this.texture},depthWidth:{value:n.z},depthHeight:{value:n.w}}});this.mesh=new be(new nh(20,20),s)}t.render(this.mesh,e)}}reset(){this.texture=null,this.mesh=null}},gf=class extends Ks{constructor(t,e){super();let n=this,s=null,r=1,o=null,a="local-floor",l=1,c=null,h=null,u=null,f=null,d=null,g=null,b=new mf,p=e.getContextAttributes(),m=null,v=null,y=[],_=[],w=new Bt,S=null,A=new en;A.layers.enable(1),A.viewport=new un;let R=new en;R.layers.enable(2),R.viewport=new un;let P=[A,R],x=new pf;x.layers.enable(1),x.layers.enable(2);let T=null,D=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(W){let J=y[W];return J===void 0&&(J=new Wa,y[W]=J),J.getTargetRaySpace()},this.getControllerGrip=function(W){let J=y[W];return J===void 0&&(J=new Wa,y[W]=J),J.getGripSpace()},this.getHand=function(W){let J=y[W];return J===void 0&&(J=new Wa,y[W]=J),J.getHandSpace()};function U(W){let J=_.indexOf(W.inputSource);if(J===-1)return;let rt=y[J];rt!==void 0&&(rt.update(W.inputSource,W.frame,c||o),rt.dispatchEvent({type:W.type,data:W.inputSource}))}function k(){s.removeEventListener("select",U),s.removeEventListener("selectstart",U),s.removeEventListener("selectend",U),s.removeEventListener("squeeze",U),s.removeEventListener("squeezestart",U),s.removeEventListener("squeezeend",U),s.removeEventListener("end",k),s.removeEventListener("inputsourceschange",B);for(let W=0;W<y.length;W++){let J=_[W];J!==null&&(_[W]=null,y[W].disconnect(J))}T=null,D=null,b.reset(),t.setRenderTarget(m),d=null,f=null,u=null,s=null,v=null,bt.stop(),n.isPresenting=!1,t.setPixelRatio(S),t.setSize(w.width,w.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(W){r=W,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(W){a=W,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||o},this.setReferenceSpace=function(W){c=W},this.getBaseLayer=function(){return f!==null?f:d},this.getBinding=function(){return u},this.getFrame=function(){return g},this.getSession=function(){return s},this.setSession=async function(W){if(s=W,s!==null){if(m=t.getRenderTarget(),s.addEventListener("select",U),s.addEventListener("selectstart",U),s.addEventListener("selectend",U),s.addEventListener("squeeze",U),s.addEventListener("squeezestart",U),s.addEventListener("squeezeend",U),s.addEventListener("end",k),s.addEventListener("inputsourceschange",B),p.xrCompatible!==!0&&await e.makeXRCompatible(),S=t.getPixelRatio(),t.getSize(w),s.renderState.layers===void 0||t.capabilities.isWebGL2===!1){let J={antialias:s.renderState.layers===void 0?p.antialias:!0,alpha:!0,depth:p.depth,stencil:p.stencil,framebufferScaleFactor:r};d=new XRWebGLLayer(s,e,J),s.updateRenderState({baseLayer:d}),t.setPixelRatio(1),t.setSize(d.framebufferWidth,d.framebufferHeight,!1),v=new Ln(d.framebufferWidth,d.framebufferHeight,{format:Fe,type:sn,colorSpace:t.outputColorSpace,stencilBuffer:p.stencil})}else{let J=null,rt=null,tt=null;p.depth&&(tt=p.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,J=p.stencil?Go:Ir,rt=p.stencil?Lr:qi);let ft={colorFormat:e.RGBA8,depthFormat:tt,scaleFactor:r};u=new XRWebGLBinding(s,e),f=u.createProjectionLayer(ft),s.updateRenderState({layers:[f]}),t.setPixelRatio(1),t.setSize(f.textureWidth,f.textureHeight,!1),v=new Ln(f.textureWidth,f.textureHeight,{format:Fe,type:sn,depthTexture:new $o(f.textureWidth,f.textureHeight,rt,void 0,void 0,void 0,void 0,void 0,void 0,J),stencilBuffer:p.stencil,colorSpace:t.outputColorSpace,samples:p.antialias?4:0});let ht=t.properties.get(v);ht.__ignoreDepthValues=f.ignoreDepthValues}v.isXRRenderTarget=!0,this.setFoveation(l),c=null,o=await s.requestReferenceSpace(a),bt.setContext(s),bt.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode};function B(W){for(let J=0;J<W.removed.length;J++){let rt=W.removed[J],tt=_.indexOf(rt);tt>=0&&(_[tt]=null,y[tt].disconnect(rt))}for(let J=0;J<W.added.length;J++){let rt=W.added[J],tt=_.indexOf(rt);if(tt===-1){for(let ht=0;ht<y.length;ht++)if(ht>=_.length){_.push(rt),tt=ht;break}else if(_[ht]===null){_[ht]=rt,tt=ht;break}if(tt===-1)break}let ft=y[tt];ft&&ft.connect(rt)}}let F=new V,I=new V;function N(W,J,rt){F.setFromMatrixPosition(J.matrixWorld),I.setFromMatrixPosition(rt.matrixWorld);let tt=F.distanceTo(I),ft=J.projectionMatrix.elements,ht=rt.projectionMatrix.elements,Wt=ft[14]/(ft[10]-1),kt=ft[14]/(ft[10]+1),H=(ft[9]+1)/ft[5],Se=(ft[9]-1)/ft[5],wt=(ft[8]-1)/ft[0],Mt=(ht[8]+1)/ht[0],Lt=Wt*wt,se=Wt*Mt,Vt=tt/(-wt+Mt),Yt=Vt*-wt;J.matrixWorld.decompose(W.position,W.quaternion,W.scale),W.translateX(Yt),W.translateZ(Vt),W.matrixWorld.compose(W.position,W.quaternion,W.scale),W.matrixWorldInverse.copy(W.matrixWorld).invert();let Te=Wt+Vt,L=kt+Vt,E=Lt-Yt,Q=se+(tt-Yt),it=H*kt/L*Te,at=Se*kt/L*Te;W.projectionMatrix.makePerspective(E,Q,it,at,Te,L),W.projectionMatrixInverse.copy(W.projectionMatrix).invert()}function z(W,J){J===null?W.matrixWorld.copy(W.matrix):W.matrixWorld.multiplyMatrices(J.matrixWorld,W.matrix),W.matrixWorldInverse.copy(W.matrixWorld).invert()}this.updateCamera=function(W){if(s===null)return;b.texture!==null&&(W.near=b.depthNear,W.far=b.depthFar),x.near=R.near=A.near=W.near,x.far=R.far=A.far=W.far,(T!==x.near||D!==x.far)&&(s.updateRenderState({depthNear:x.near,depthFar:x.far}),T=x.near,D=x.far,A.near=T,A.far=D,R.near=T,R.far=D,A.updateProjectionMatrix(),R.updateProjectionMatrix(),W.updateProjectionMatrix());let J=W.parent,rt=x.cameras;z(x,J);for(let tt=0;tt<rt.length;tt++)z(rt[tt],J);rt.length===2?N(x,A,R):x.projectionMatrix.copy(A.projectionMatrix),et(W,x,J)};function et(W,J,rt){rt===null?W.matrix.copy(J.matrixWorld):(W.matrix.copy(rt.matrixWorld),W.matrix.invert(),W.matrix.multiply(J.matrixWorld)),W.matrix.decompose(W.position,W.quaternion,W.scale),W.updateMatrixWorld(!0),W.projectionMatrix.copy(J.projectionMatrix),W.projectionMatrixInverse.copy(J.projectionMatrixInverse),W.isPerspectiveCamera&&(W.fov=Qd*2*Math.atan(1/W.projectionMatrix.elements[5]),W.zoom=1)}this.getCamera=function(){return x},this.getFoveation=function(){if(!(f===null&&d===null))return l},this.setFoveation=function(W){l=W,f!==null&&(f.fixedFoveation=W),d!==null&&d.fixedFoveation!==void 0&&(d.fixedFoveation=W)},this.hasDepthSensing=function(){return b.texture!==null};let nt=null;function ot(W,J){if(h=J.getViewerPose(c||o),g=J,h!==null){let rt=h.views;d!==null&&(t.setRenderTargetFramebuffer(v,d.framebuffer),t.setRenderTarget(v));let tt=!1;rt.length!==x.cameras.length&&(x.cameras.length=0,tt=!0);for(let ht=0;ht<rt.length;ht++){let Wt=rt[ht],kt=null;if(d!==null)kt=d.getViewport(Wt);else{let Se=u.getViewSubImage(f,Wt);kt=Se.viewport,ht===0&&(t.setRenderTargetTextures(v,Se.colorTexture,f.ignoreDepthValues?void 0:Se.depthStencilTexture),t.setRenderTarget(v))}let H=P[ht];H===void 0&&(H=new en,H.layers.enable(ht),H.viewport=new un,P[ht]=H),H.matrix.fromArray(Wt.transform.matrix),H.matrix.decompose(H.position,H.quaternion,H.scale),H.projectionMatrix.fromArray(Wt.projectionMatrix),H.projectionMatrixInverse.copy(H.projectionMatrix).invert(),H.viewport.set(kt.x,kt.y,kt.width,kt.height),ht===0&&(x.matrix.copy(H.matrix),x.matrix.decompose(x.position,x.quaternion,x.scale)),tt===!0&&x.cameras.push(H)}let ft=s.enabledFeatures;if(ft&&ft.includes("depth-sensing")){let ht=u.getDepthInformation(rt[0]);ht&&ht.isValid&&ht.texture&&b.init(t,ht,s.renderState)}}for(let rt=0;rt<y.length;rt++){let tt=_[rt],ft=y[rt];tt!==null&&ft!==void 0&&ft.update(tt,J,c||o)}b.render(t,x),nt&&nt(W,J),J.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:J}),g=null}let bt=new M1;bt.setAnimationLoop(ot),this.setAnimationLoop=function(W){nt=W},this.dispose=function(){}}},Er=new ys,DE=new de;function NE(i,t){function e(p,m){p.matrixAutoUpdate===!0&&p.updateMatrix(),m.value.copy(p.matrix)}function n(p,m){m.color.getRGB(p.fogColor.value,w1(i)),m.isFog?(p.fogNear.value=m.near,p.fogFar.value=m.far):m.isFogExp2&&(p.fogDensity.value=m.density)}function s(p,m,v,y,_){m.isMeshBasicMaterial||m.isMeshLambertMaterial?r(p,m):m.isMeshToonMaterial?(r(p,m),u(p,m)):m.isMeshPhongMaterial?(r(p,m),h(p,m)):m.isMeshStandardMaterial?(r(p,m),f(p,m),m.isMeshPhysicalMaterial&&d(p,m,_)):m.isMeshMatcapMaterial?(r(p,m),g(p,m)):m.isMeshDepthMaterial?r(p,m):m.isMeshDistanceMaterial?(r(p,m),b(p,m)):m.isMeshNormalMaterial?r(p,m):m.isLineBasicMaterial?(o(p,m),m.isLineDashedMaterial&&a(p,m)):m.isPointsMaterial?l(p,m,v,y):m.isSpriteMaterial?c(p,m):m.isShadowMaterial?(p.color.value.copy(m.color),p.opacity.value=m.opacity):m.isShaderMaterial&&(m.uniformsNeedUpdate=!1)}function r(p,m){p.opacity.value=m.opacity,m.color&&p.diffuse.value.copy(m.color),m.emissive&&p.emissive.value.copy(m.emissive).multiplyScalar(m.emissiveIntensity),m.map&&(p.map.value=m.map,e(m.map,p.mapTransform)),m.alphaMap&&(p.alphaMap.value=m.alphaMap,e(m.alphaMap,p.alphaMapTransform)),m.bumpMap&&(p.bumpMap.value=m.bumpMap,e(m.bumpMap,p.bumpMapTransform),p.bumpScale.value=m.bumpScale,m.side===zn&&(p.bumpScale.value*=-1)),m.normalMap&&(p.normalMap.value=m.normalMap,e(m.normalMap,p.normalMapTransform),p.normalScale.value.copy(m.normalScale),m.side===zn&&p.normalScale.value.negate()),m.displacementMap&&(p.displacementMap.value=m.displacementMap,e(m.displacementMap,p.displacementMapTransform),p.displacementScale.value=m.displacementScale,p.displacementBias.value=m.displacementBias),m.emissiveMap&&(p.emissiveMap.value=m.emissiveMap,e(m.emissiveMap,p.emissiveMapTransform)),m.specularMap&&(p.specularMap.value=m.specularMap,e(m.specularMap,p.specularMapTransform)),m.alphaTest>0&&(p.alphaTest.value=m.alphaTest);let v=t.get(m),y=v.envMap,_=v.envMapRotation;if(y&&(p.envMap.value=y,Er.copy(_),Er.x*=-1,Er.y*=-1,Er.z*=-1,y.isCubeTexture&&y.isRenderTargetTexture===!1&&(Er.y*=-1,Er.z*=-1),p.envMapRotation.value.setFromMatrix4(DE.makeRotationFromEuler(Er)),p.flipEnvMap.value=y.isCubeTexture&&y.isRenderTargetTexture===!1?-1:1,p.reflectivity.value=m.reflectivity,p.ior.value=m.ior,p.refractionRatio.value=m.refractionRatio),m.lightMap){p.lightMap.value=m.lightMap;let w=i._useLegacyLights===!0?Math.PI:1;p.lightMapIntensity.value=m.lightMapIntensity*w,e(m.lightMap,p.lightMapTransform)}m.aoMap&&(p.aoMap.value=m.aoMap,p.aoMapIntensity.value=m.aoMapIntensity,e(m.aoMap,p.aoMapTransform))}function o(p,m){p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,m.map&&(p.map.value=m.map,e(m.map,p.mapTransform))}function a(p,m){p.dashSize.value=m.dashSize,p.totalSize.value=m.dashSize+m.gapSize,p.scale.value=m.scale}function l(p,m,v,y){p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,p.size.value=m.size*v,p.scale.value=y*.5,m.map&&(p.map.value=m.map,e(m.map,p.uvTransform)),m.alphaMap&&(p.alphaMap.value=m.alphaMap,e(m.alphaMap,p.alphaMapTransform)),m.alphaTest>0&&(p.alphaTest.value=m.alphaTest)}function c(p,m){p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,p.rotation.value=m.rotation,m.map&&(p.map.value=m.map,e(m.map,p.mapTransform)),m.alphaMap&&(p.alphaMap.value=m.alphaMap,e(m.alphaMap,p.alphaMapTransform)),m.alphaTest>0&&(p.alphaTest.value=m.alphaTest)}function h(p,m){p.specular.value.copy(m.specular),p.shininess.value=Math.max(m.shininess,1e-4)}function u(p,m){m.gradientMap&&(p.gradientMap.value=m.gradientMap)}function f(p,m){p.metalness.value=m.metalness,m.metalnessMap&&(p.metalnessMap.value=m.metalnessMap,e(m.metalnessMap,p.metalnessMapTransform)),p.roughness.value=m.roughness,m.roughnessMap&&(p.roughnessMap.value=m.roughnessMap,e(m.roughnessMap,p.roughnessMapTransform)),t.get(m).envMap&&(p.envMapIntensity.value=m.envMapIntensity)}function d(p,m,v){p.ior.value=m.ior,m.sheen>0&&(p.sheenColor.value.copy(m.sheenColor).multiplyScalar(m.sheen),p.sheenRoughness.value=m.sheenRoughness,m.sheenColorMap&&(p.sheenColorMap.value=m.sheenColorMap,e(m.sheenColorMap,p.sheenColorMapTransform)),m.sheenRoughnessMap&&(p.sheenRoughnessMap.value=m.sheenRoughnessMap,e(m.sheenRoughnessMap,p.sheenRoughnessMapTransform))),m.clearcoat>0&&(p.clearcoat.value=m.clearcoat,p.clearcoatRoughness.value=m.clearcoatRoughness,m.clearcoatMap&&(p.clearcoatMap.value=m.clearcoatMap,e(m.clearcoatMap,p.clearcoatMapTransform)),m.clearcoatRoughnessMap&&(p.clearcoatRoughnessMap.value=m.clearcoatRoughnessMap,e(m.clearcoatRoughnessMap,p.clearcoatRoughnessMapTransform)),m.clearcoatNormalMap&&(p.clearcoatNormalMap.value=m.clearcoatNormalMap,e(m.clearcoatNormalMap,p.clearcoatNormalMapTransform),p.clearcoatNormalScale.value.copy(m.clearcoatNormalScale),m.side===zn&&p.clearcoatNormalScale.value.negate())),m.iridescence>0&&(p.iridescence.value=m.iridescence,p.iridescenceIOR.value=m.iridescenceIOR,p.iridescenceThicknessMinimum.value=m.iridescenceThicknessRange[0],p.iridescenceThicknessMaximum.value=m.iridescenceThicknessRange[1],m.iridescenceMap&&(p.iridescenceMap.value=m.iridescenceMap,e(m.iridescenceMap,p.iridescenceMapTransform)),m.iridescenceThicknessMap&&(p.iridescenceThicknessMap.value=m.iridescenceThicknessMap,e(m.iridescenceThicknessMap,p.iridescenceThicknessMapTransform))),m.transmission>0&&(p.transmission.value=m.transmission,p.transmissionSamplerMap.value=v.texture,p.transmissionSamplerSize.value.set(v.width,v.height),m.transmissionMap&&(p.transmissionMap.value=m.transmissionMap,e(m.transmissionMap,p.transmissionMapTransform)),p.thickness.value=m.thickness,m.thicknessMap&&(p.thicknessMap.value=m.thicknessMap,e(m.thicknessMap,p.thicknessMapTransform)),p.attenuationDistance.value=m.attenuationDistance,p.attenuationColor.value.copy(m.attenuationColor)),m.anisotropy>0&&(p.anisotropyVector.value.set(m.anisotropy*Math.cos(m.anisotropyRotation),m.anisotropy*Math.sin(m.anisotropyRotation)),m.anisotropyMap&&(p.anisotropyMap.value=m.anisotropyMap,e(m.anisotropyMap,p.anisotropyMapTransform))),p.specularIntensity.value=m.specularIntensity,p.specularColor.value.copy(m.specularColor),m.specularColorMap&&(p.specularColorMap.value=m.specularColorMap,e(m.specularColorMap,p.specularColorMapTransform)),m.specularIntensityMap&&(p.specularIntensityMap.value=m.specularIntensityMap,e(m.specularIntensityMap,p.specularIntensityMapTransform))}function g(p,m){m.matcap&&(p.matcap.value=m.matcap)}function b(p,m){let v=t.get(m).light;p.referencePosition.value.setFromMatrixPosition(v.matrixWorld),p.nearDistance.value=v.shadow.camera.near,p.farDistance.value=v.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function BE(i,t,e,n){let s={},r={},o=[],a=e.isWebGL2?i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS):0;function l(v,y){let _=y.program;n.uniformBlockBinding(v,_)}function c(v,y){let _=s[v.id];_===void 0&&(g(v),_=h(v),s[v.id]=_,v.addEventListener("dispose",p));let w=y.program;n.updateUBOMapping(v,w);let S=t.render.frame;r[v.id]!==S&&(f(v),r[v.id]=S)}function h(v){let y=u();v.__bindingPointIndex=y;let _=i.createBuffer(),w=v.__size,S=v.usage;return i.bindBuffer(i.UNIFORM_BUFFER,_),i.bufferData(i.UNIFORM_BUFFER,w,S),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,y,_),_}function u(){for(let v=0;v<a;v++)if(o.indexOf(v)===-1)return o.push(v),v;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function f(v){let y=s[v.id],_=v.uniforms,w=v.__cache;i.bindBuffer(i.UNIFORM_BUFFER,y);for(let S=0,A=_.length;S<A;S++){let R=Array.isArray(_[S])?_[S]:[_[S]];for(let P=0,x=R.length;P<x;P++){let T=R[P];if(d(T,S,P,w)===!0){let D=T.__offset,U=Array.isArray(T.value)?T.value:[T.value],k=0;for(let B=0;B<U.length;B++){let F=U[B],I=b(F);typeof F=="number"||typeof F=="boolean"?(T.__data[0]=F,i.bufferSubData(i.UNIFORM_BUFFER,D+k,T.__data)):F.isMatrix3?(T.__data[0]=F.elements[0],T.__data[1]=F.elements[1],T.__data[2]=F.elements[2],T.__data[3]=0,T.__data[4]=F.elements[3],T.__data[5]=F.elements[4],T.__data[6]=F.elements[5],T.__data[7]=0,T.__data[8]=F.elements[6],T.__data[9]=F.elements[7],T.__data[10]=F.elements[8],T.__data[11]=0):(F.toArray(T.__data,k),k+=I.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,D,T.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function d(v,y,_,w){let S=v.value,A=y+"_"+_;if(w[A]===void 0)return typeof S=="number"||typeof S=="boolean"?w[A]=S:w[A]=S.clone(),!0;{let R=w[A];if(typeof S=="number"||typeof S=="boolean"){if(R!==S)return w[A]=S,!0}else if(R.equals(S)===!1)return R.copy(S),!0}return!1}function g(v){let y=v.uniforms,_=0,w=16;for(let A=0,R=y.length;A<R;A++){let P=Array.isArray(y[A])?y[A]:[y[A]];for(let x=0,T=P.length;x<T;x++){let D=P[x],U=Array.isArray(D.value)?D.value:[D.value];for(let k=0,B=U.length;k<B;k++){let F=U[k],I=b(F),N=_%w;N!==0&&w-N<I.boundary&&(_+=w-N),D.__data=new Float32Array(I.storage/Float32Array.BYTES_PER_ELEMENT),D.__offset=_,_+=I.storage}}}let S=_%w;return S>0&&(_+=w-S),v.__size=_,v.__cache={},this}function b(v){let y={boundary:0,storage:0};return typeof v=="number"||typeof v=="boolean"?(y.boundary=4,y.storage=4):v.isVector2?(y.boundary=8,y.storage=8):v.isVector3||v.isColor?(y.boundary=16,y.storage=12):v.isVector4?(y.boundary=16,y.storage=16):v.isMatrix3?(y.boundary=48,y.storage=48):v.isMatrix4?(y.boundary=64,y.storage=64):v.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",v),y}function p(v){let y=v.target;y.removeEventListener("dispose",p);let _=o.indexOf(y.__bindingPointIndex);o.splice(_,1),i.deleteBuffer(s[y.id]),delete s[y.id],delete r[y.id]}function m(){for(let v in s)i.deleteBuffer(s[v]);o=[],s={},r={}}return{bind:l,update:c,dispose:m}}var $a=class{constructor(t={}){let{canvas:e=zw(),context:n=null,depth:s=!0,stencil:r=!0,alpha:o=!1,antialias:a=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:u=!1}=t;this.isWebGLRenderer=!0;let f;n!==null?f=n.getContextAttributes().alpha:f=o;let d=new Uint32Array(4),g=new Int32Array(4),b=null,p=null,m=[],v=[];this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=Vi,this._useLegacyLights=!1,this.toneMapping=Ys,this.toneMappingExposure=1;let y=this,_=!1,w=0,S=0,A=null,R=-1,P=null,x=new un,T=new un,D=null,U=new Pt(0),k=0,B=e.width,F=e.height,I=1,N=null,z=null,et=new un(0,0,B,F),nt=new un(0,0,B,F),ot=!1,bt=new Vo,W=!1,J=!1,rt=null,tt=new de,ft=new Bt,ht=new V,Wt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};function kt(){return A===null?I:1}let H=n;function Se(C,G){for(let Y=0;Y<C.length;Y++){let K=C[Y],q=e.getContext(K,G);if(q!==null)return q}return null}try{let C={alpha:!0,depth:s,stencil:r,antialias:a,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:u};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${Rf}`),e.addEventListener("webglcontextlost",ke,!1),e.addEventListener("webglcontextrestored",O,!1),e.addEventListener("webglcontextcreationerror",pt,!1),H===null){let G=["webgl2","webgl","experimental-webgl"];if(y.isWebGL1Renderer===!0&&G.shift(),H=Se(G,C),H===null)throw Se(G)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}typeof WebGLRenderingContext!="undefined"&&H instanceof WebGLRenderingContext&&console.warn("THREE.WebGLRenderer: WebGL 1 support was deprecated in r153 and will be removed in r163."),H.getShaderPrecisionFormat===void 0&&(H.getShaderPrecisionFormat=function(){return{rangeMin:1,rangeMax:1,precision:1}})}catch(C){throw console.error("THREE.WebGLRenderer: "+C.message),C}let wt,Mt,Lt,se,Vt,Yt,Te,L,E,Q,it,at,st,Kt,Ft,dt,mt,Zt,lt,ze,re,It,Tt,Ct;function ce(){wt=new QS(H),Mt=new XS(H,wt,t),wt.init(Mt),It=new PE(H,wt,Mt),Lt=new CE(H,wt,Mt),se=new nA(H),Vt=new bE,Yt=new RE(H,wt,Lt,Vt,Mt,It,se),Te=new KS(y),L=new jS(y),E=new lM(H,Mt),Tt=new $S(H,wt,E,Mt),Q=new tA(H,E,se,Tt),it=new oA(H,Q,E,se),lt=new rA(H,Mt,Yt),dt=new YS(Vt),at=new gE(y,Te,L,wt,Mt,Tt,dt),st=new NE(y,Vt),Kt=new vE,Ft=new AE(wt,Mt),Zt=new VS(y,Te,L,Lt,it,f,l),mt=new kE(y,it,Mt),Ct=new BE(H,se,Mt,Lt),ze=new qS(H,wt,se,Mt),re=new eA(H,wt,se,Mt),se.programs=at.programs,y.capabilities=Mt,y.extensions=wt,y.properties=Vt,y.renderLists=Kt,y.shadowMap=mt,y.state=Lt,y.info=se}ce();let qt=new gf(y,H);this.xr=qt,this.getContext=function(){return H},this.getContextAttributes=function(){return H.getContextAttributes()},this.forceContextLoss=function(){let C=wt.get("WEBGL_lose_context");C&&C.loseContext()},this.forceContextRestore=function(){let C=wt.get("WEBGL_lose_context");C&&C.restoreContext()},this.getPixelRatio=function(){return I},this.setPixelRatio=function(C){C!==void 0&&(I=C,this.setSize(B,F,!1))},this.getSize=function(C){return C.set(B,F)},this.setSize=function(C,G,Y=!0){if(qt.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}B=C,F=G,e.width=Math.floor(C*I),e.height=Math.floor(G*I),Y===!0&&(e.style.width=C+"px",e.style.height=G+"px"),this.setViewport(0,0,C,G)},this.getDrawingBufferSize=function(C){return C.set(B*I,F*I).floor()},this.setDrawingBufferSize=function(C,G,Y){B=C,F=G,I=Y,e.width=Math.floor(C*Y),e.height=Math.floor(G*Y),this.setViewport(0,0,C,G)},this.getCurrentViewport=function(C){return C.copy(x)},this.getViewport=function(C){return C.copy(et)},this.setViewport=function(C,G,Y,K){C.isVector4?et.set(C.x,C.y,C.z,C.w):et.set(C,G,Y,K),Lt.viewport(x.copy(et).multiplyScalar(I).round())},this.getScissor=function(C){return C.copy(nt)},this.setScissor=function(C,G,Y,K){C.isVector4?nt.set(C.x,C.y,C.z,C.w):nt.set(C,G,Y,K),Lt.scissor(T.copy(nt).multiplyScalar(I).round())},this.getScissorTest=function(){return ot},this.setScissorTest=function(C){Lt.setScissorTest(ot=C)},this.setOpaqueSort=function(C){N=C},this.setTransparentSort=function(C){z=C},this.getClearColor=function(C){return C.copy(Zt.getClearColor())},this.setClearColor=function(){Zt.setClearColor.apply(Zt,arguments)},this.getClearAlpha=function(){return Zt.getClearAlpha()},this.setClearAlpha=function(){Zt.setClearAlpha.apply(Zt,arguments)},this.clear=function(C=!0,G=!0,Y=!0){let K=0;if(C){let q=!1;if(A!==null){let _t=A.texture.format;q=_t===g1||_t===m1||_t===p1}if(q){let _t=A.texture.type,Rt=_t===sn||_t===qi||_t===Xa||_t===Lr||_t===d1||_t===f1,Dt=Zt.getClearColor(),zt=Zt.getClearAlpha(),ne=Dt.r,$t=Dt.g,Xt=Dt.b;Rt?(d[0]=ne,d[1]=$t,d[2]=Xt,d[3]=zt,H.clearBufferuiv(H.COLOR,0,d)):(g[0]=ne,g[1]=$t,g[2]=Xt,g[3]=zt,H.clearBufferiv(H.COLOR,0,g))}else K|=H.COLOR_BUFFER_BIT}G&&(K|=H.DEPTH_BUFFER_BIT),Y&&(K|=H.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),H.clear(K)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",ke,!1),e.removeEventListener("webglcontextrestored",O,!1),e.removeEventListener("webglcontextcreationerror",pt,!1),Kt.dispose(),Ft.dispose(),Vt.dispose(),Te.dispose(),L.dispose(),it.dispose(),Tt.dispose(),Ct.dispose(),at.dispose(),qt.dispose(),qt.removeEventListener("sessionstart",Qn),qt.removeEventListener("sessionend",_e),rt&&(rt.dispose(),rt=null),Sn.stop()};function ke(C){C.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),_=!0}function O(){console.log("THREE.WebGLRenderer: Context Restored."),_=!1;let C=se.autoReset,G=mt.enabled,Y=mt.autoUpdate,K=mt.needsUpdate,q=mt.type;ce(),se.autoReset=C,mt.enabled=G,mt.autoUpdate=Y,mt.needsUpdate=K,mt.type=q}function pt(C){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",C.statusMessage)}function X(C){let G=C.target;G.removeEventListener("dispose",X),ct(G)}function ct(C){gt(C),Vt.remove(C)}function gt(C){let G=Vt.get(C).programs;G!==void 0&&(G.forEach(function(Y){at.releaseProgram(Y)}),C.isShaderMaterial&&at.releaseShaderCache(C))}this.renderBufferDirect=function(C,G,Y,K,q,_t){G===null&&(G=Wt);let Rt=q.isMesh&&q.matrixWorld.determinant()<0,Dt=mv(C,G,Y,K,q);Lt.setMaterial(K,Rt);let zt=Y.index,ne=1;if(K.wireframe===!0){if(zt=Q.getWireframeAttribute(Y),zt===void 0)return;ne=2}let $t=Y.drawRange,Xt=Y.attributes.position,Be=$t.start*ne,Vn=($t.start+$t.count)*ne;_t!==null&&(Be=Math.max(Be,_t.start*ne),Vn=Math.min(Vn,(_t.start+_t.count)*ne)),zt!==null?(Be=Math.max(Be,0),Vn=Math.min(Vn,zt.count)):Xt!=null&&(Be=Math.max(Be,0),Vn=Math.min(Vn,Xt.count));let je=Vn-Be;if(je<0||je===1/0)return;Tt.setup(q,K,Dt,Y,zt);let ts,Pe=ze;if(zt!==null&&(ts=E.get(zt),Pe=re,Pe.setIndex(ts)),q.isMesh)K.wireframe===!0?(Lt.setLineWidth(K.wireframeLinewidth*kt()),Pe.setMode(H.LINES)):Pe.setMode(H.TRIANGLES);else if(q.isLine){let Jt=K.linewidth;Jt===void 0&&(Jt=1),Lt.setLineWidth(Jt*kt()),q.isLineSegments?Pe.setMode(H.LINES):q.isLineLoop?Pe.setMode(H.LINE_LOOP):Pe.setMode(H.LINE_STRIP)}else q.isPoints?Pe.setMode(H.POINTS):q.isSprite&&Pe.setMode(H.TRIANGLES);if(q.isBatchedMesh)Pe.renderMultiDraw(q._multiDrawStarts,q._multiDrawCounts,q._multiDrawCount);else if(q.isInstancedMesh)Pe.renderInstances(Be,je,q.count);else if(Y.isInstancedBufferGeometry){let Jt=Y._maxInstanceCount!==void 0?Y._maxInstanceCount:1/0,fu=Math.min(Y.instanceCount,Jt);Pe.renderInstances(Be,je,fu)}else Pe.render(Be,je)};function oe(C,G,Y){C.transparent===!0&&C.side===nn&&C.forceSinglePass===!1?(C.side=zn,C.needsUpdate=!0,Pl(C,G,Y),C.side=yn,C.needsUpdate=!0,Pl(C,G,Y),C.side=nn):Pl(C,G,Y)}this.compile=function(C,G,Y=null){Y===null&&(Y=C),p=Ft.get(Y),p.init(),v.push(p),Y.traverseVisible(function(q){q.isLight&&q.layers.test(G.layers)&&(p.pushLight(q),q.castShadow&&p.pushShadow(q))}),C!==Y&&C.traverseVisible(function(q){q.isLight&&q.layers.test(G.layers)&&(p.pushLight(q),q.castShadow&&p.pushShadow(q))}),p.setupLights(y._useLegacyLights);let K=new Set;return C.traverse(function(q){let _t=q.material;if(_t)if(Array.isArray(_t))for(let Rt=0;Rt<_t.length;Rt++){let Dt=_t[Rt];oe(Dt,Y,q),K.add(Dt)}else oe(_t,Y,q),K.add(_t)}),v.pop(),p=null,K},this.compileAsync=function(C,G,Y=null){let K=this.compile(C,G,Y);return new Promise(q=>{function _t(){if(K.forEach(function(Rt){Vt.get(Rt).currentProgram.isReady()&&K.delete(Rt)}),K.size===0){q(C);return}setTimeout(_t,10)}wt.get("KHR_parallel_shader_compile")!==null?_t():setTimeout(_t,10)})};let ve=null;function on(C){ve&&ve(C)}function Qn(){Sn.stop()}function _e(){Sn.start()}let Sn=new M1;Sn.setAnimationLoop(on),typeof self!="undefined"&&Sn.setContext(self),this.setAnimationLoop=function(C){ve=C,qt.setAnimationLoop(C),C===null?Sn.stop():Sn.start()},qt.addEventListener("sessionstart",Qn),qt.addEventListener("sessionend",_e),this.render=function(C,G){if(G!==void 0&&G.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(_===!0)return;C.matrixWorldAutoUpdate===!0&&C.updateMatrixWorld(),G.parent===null&&G.matrixWorldAutoUpdate===!0&&G.updateMatrixWorld(),qt.enabled===!0&&qt.isPresenting===!0&&(qt.cameraAutoUpdate===!0&&qt.updateCamera(G),G=qt.getCamera()),C.isScene===!0&&C.onBeforeRender(y,C,G,A),p=Ft.get(C,v.length),p.init(),v.push(p),tt.multiplyMatrices(G.projectionMatrix,G.matrixWorldInverse),bt.setFromProjectionMatrix(tt),J=this.localClippingEnabled,W=dt.init(this.clippingPlanes,J),b=Kt.get(C,m.length),b.init(),m.push(b),Di(C,G,0,y.sortObjects),b.finish(),y.sortObjects===!0&&b.sort(N,z),this.info.render.frame++,W===!0&&dt.beginShadows();let Y=p.state.shadowsArray;if(mt.render(Y,C,G),W===!0&&dt.endShadows(),this.info.autoReset===!0&&this.info.reset(),(qt.enabled===!1||qt.isPresenting===!1||qt.hasDepthSensing()===!1)&&Zt.render(b,C),p.setupLights(y._useLegacyLights),G.isArrayCamera){let K=G.cameras;for(let q=0,_t=K.length;q<_t;q++){let Rt=K[q];Vp(b,C,Rt,Rt.viewport)}}else Vp(b,C,G);A!==null&&(Yt.updateMultisampleRenderTarget(A),Yt.updateRenderTargetMipmap(A)),C.isScene===!0&&C.onAfterRender(y,C,G),Tt.resetDefaultState(),R=-1,P=null,v.pop(),v.length>0?p=v[v.length-1]:p=null,m.pop(),m.length>0?b=m[m.length-1]:b=null};function Di(C,G,Y,K){if(C.visible===!1)return;if(C.layers.test(G.layers)){if(C.isGroup)Y=C.renderOrder;else if(C.isLOD)C.autoUpdate===!0&&C.update(G);else if(C.isLight)p.pushLight(C),C.castShadow&&p.pushShadow(C);else if(C.isSprite){if(!C.frustumCulled||bt.intersectsSprite(C)){K&&ht.setFromMatrixPosition(C.matrixWorld).applyMatrix4(tt);let Rt=it.update(C),Dt=C.material;Dt.visible&&b.push(C,Rt,Dt,Y,ht.z,null)}}else if((C.isMesh||C.isLine||C.isPoints)&&(!C.frustumCulled||bt.intersectsObject(C))){let Rt=it.update(C),Dt=C.material;if(K&&(C.boundingSphere!==void 0?(C.boundingSphere===null&&C.computeBoundingSphere(),ht.copy(C.boundingSphere.center)):(Rt.boundingSphere===null&&Rt.computeBoundingSphere(),ht.copy(Rt.boundingSphere.center)),ht.applyMatrix4(C.matrixWorld).applyMatrix4(tt)),Array.isArray(Dt)){let zt=Rt.groups;for(let ne=0,$t=zt.length;ne<$t;ne++){let Xt=zt[ne],Be=Dt[Xt.materialIndex];Be&&Be.visible&&b.push(C,Rt,Be,Y,ht.z,Xt)}}else Dt.visible&&b.push(C,Rt,Dt,Y,ht.z,null)}}let _t=C.children;for(let Rt=0,Dt=_t.length;Rt<Dt;Rt++)Di(_t[Rt],G,Y,K)}function Vp(C,G,Y,K){let q=C.opaque,_t=C.transmissive,Rt=C.transparent;p.setupLightsView(Y),W===!0&&dt.setGlobalState(y.clippingPlanes,Y),_t.length>0&&pv(q,_t,G,Y),K&&Lt.viewport(x.copy(K)),q.length>0&&Rl(q,G,Y),_t.length>0&&Rl(_t,G,Y),Rt.length>0&&Rl(Rt,G,Y),Lt.buffers.depth.setTest(!0),Lt.buffers.depth.setMask(!0),Lt.buffers.color.setMask(!0),Lt.setPolygonOffset(!1)}function pv(C,G,Y,K){if((Y.isScene===!0?Y.overrideMaterial:null)!==null)return;let _t=Mt.isWebGL2;rt===null&&(rt=new Ln(1,1,{generateMipmaps:!0,type:wt.has("EXT_color_buffer_half_float")?Ur:sn,minFilter:Pr,samples:_t?4:0})),y.getDrawingBufferSize(ft),_t?rt.setSize(ft.x,ft.y):rt.setSize(tf(ft.x),tf(ft.y));let Rt=y.getRenderTarget();y.setRenderTarget(rt),y.getClearColor(U),k=y.getClearAlpha(),k<1&&y.setClearColor(16777215,.5),y.clear();let Dt=y.toneMapping;y.toneMapping=Ys,Rl(C,Y,K),Yt.updateMultisampleRenderTarget(rt),Yt.updateRenderTargetMipmap(rt);let zt=!1;for(let ne=0,$t=G.length;ne<$t;ne++){let Xt=G[ne],Be=Xt.object,Vn=Xt.geometry,je=Xt.material,ts=Xt.group;if(je.side===nn&&Be.layers.test(K.layers)){let Pe=je.side;je.side=zn,je.needsUpdate=!0,$p(Be,Y,K,Vn,je,ts),je.side=Pe,je.needsUpdate=!0,zt=!0}}zt===!0&&(Yt.updateMultisampleRenderTarget(rt),Yt.updateRenderTargetMipmap(rt)),y.setRenderTarget(Rt),y.setClearColor(U,k),y.toneMapping=Dt}function Rl(C,G,Y){let K=G.isScene===!0?G.overrideMaterial:null;for(let q=0,_t=C.length;q<_t;q++){let Rt=C[q],Dt=Rt.object,zt=Rt.geometry,ne=K===null?Rt.material:K,$t=Rt.group;Dt.layers.test(Y.layers)&&$p(Dt,G,Y,zt,ne,$t)}}function $p(C,G,Y,K,q,_t){C.onBeforeRender(y,G,Y,K,q,_t),C.modelViewMatrix.multiplyMatrices(Y.matrixWorldInverse,C.matrixWorld),C.normalMatrix.getNormalMatrix(C.modelViewMatrix),q.onBeforeRender(y,G,Y,K,C,_t),q.transparent===!0&&q.side===nn&&q.forceSinglePass===!1?(q.side=zn,q.needsUpdate=!0,y.renderBufferDirect(Y,G,K,q,C,_t),q.side=yn,q.needsUpdate=!0,y.renderBufferDirect(Y,G,K,q,C,_t),q.side=nn):y.renderBufferDirect(Y,G,K,q,C,_t),C.onAfterRender(y,G,Y,K,q,_t)}function Pl(C,G,Y){G.isScene!==!0&&(G=Wt);let K=Vt.get(C),q=p.state.lights,_t=p.state.shadowsArray,Rt=q.state.version,Dt=at.getParameters(C,q.state,_t,G,Y),zt=at.getProgramCacheKey(Dt),ne=K.programs;K.environment=C.isMeshStandardMaterial?G.environment:null,K.fog=G.fog,K.envMap=(C.isMeshStandardMaterial?L:Te).get(C.envMap||K.environment),K.envMapRotation=K.environment!==null&&C.envMap===null?G.environmentRotation:C.envMapRotation,ne===void 0&&(C.addEventListener("dispose",X),ne=new Map,K.programs=ne);let $t=ne.get(zt);if($t!==void 0){if(K.currentProgram===$t&&K.lightsStateVersion===Rt)return Xp(C,Dt),$t}else Dt.uniforms=at.getUniforms(C),C.onBuild(Y,Dt,y),C.onBeforeCompile(Dt,y),$t=at.acquireProgram(Dt,zt),ne.set(zt,$t),K.uniforms=Dt.uniforms;let Xt=K.uniforms;return(!C.isShaderMaterial&&!C.isRawShaderMaterial||C.clipping===!0)&&(Xt.clippingPlanes=dt.uniform),Xp(C,Dt),K.needsLights=bv(C),K.lightsStateVersion=Rt,K.needsLights&&(Xt.ambientLightColor.value=q.state.ambient,Xt.lightProbe.value=q.state.probe,Xt.directionalLights.value=q.state.directional,Xt.directionalLightShadows.value=q.state.directionalShadow,Xt.spotLights.value=q.state.spot,Xt.spotLightShadows.value=q.state.spotShadow,Xt.rectAreaLights.value=q.state.rectArea,Xt.ltc_1.value=q.state.rectAreaLTC1,Xt.ltc_2.value=q.state.rectAreaLTC2,Xt.pointLights.value=q.state.point,Xt.pointLightShadows.value=q.state.pointShadow,Xt.hemisphereLights.value=q.state.hemi,Xt.directionalShadowMap.value=q.state.directionalShadowMap,Xt.directionalShadowMatrix.value=q.state.directionalShadowMatrix,Xt.spotShadowMap.value=q.state.spotShadowMap,Xt.spotLightMatrix.value=q.state.spotLightMatrix,Xt.spotLightMap.value=q.state.spotLightMap,Xt.pointShadowMap.value=q.state.pointShadowMap,Xt.pointShadowMatrix.value=q.state.pointShadowMatrix),K.currentProgram=$t,K.uniformsList=null,$t}function qp(C){if(C.uniformsList===null){let G=C.currentProgram.getUniforms();C.uniformsList=Fo.seqWithValue(G.seq,C.uniforms)}return C.uniformsList}function Xp(C,G){let Y=Vt.get(C);Y.outputColorSpace=G.outputColorSpace,Y.batching=G.batching,Y.instancing=G.instancing,Y.instancingColor=G.instancingColor,Y.instancingMorph=G.instancingMorph,Y.skinning=G.skinning,Y.morphTargets=G.morphTargets,Y.morphNormals=G.morphNormals,Y.morphColors=G.morphColors,Y.morphTargetsCount=G.morphTargetsCount,Y.numClippingPlanes=G.numClippingPlanes,Y.numIntersection=G.numClipIntersection,Y.vertexAlphas=G.vertexAlphas,Y.vertexTangents=G.vertexTangents,Y.toneMapping=G.toneMapping}function mv(C,G,Y,K,q){G.isScene!==!0&&(G=Wt),Yt.resetTextureUnits();let _t=G.fog,Rt=K.isMeshStandardMaterial?G.environment:null,Dt=A===null?y.outputColorSpace:A.isXRRenderTarget===!0?A.texture.colorSpace:Yi,zt=(K.isMeshStandardMaterial?L:Te).get(K.envMap||Rt),ne=K.vertexColors===!0&&!!Y.attributes.color&&Y.attributes.color.itemSize===4,$t=!!Y.attributes.tangent&&(!!K.normalMap||K.anisotropy>0),Xt=!!Y.morphAttributes.position,Be=!!Y.morphAttributes.normal,Vn=!!Y.morphAttributes.color,je=Ys;K.toneMapped&&(A===null||A.isXRRenderTarget===!0)&&(je=y.toneMapping);let ts=Y.morphAttributes.position||Y.morphAttributes.normal||Y.morphAttributes.color,Pe=ts!==void 0?ts.length:0,Jt=Vt.get(K),fu=p.state.lights;if(W===!0&&(J===!0||C!==P)){let ti=C===P&&K.id===R;dt.setState(K,C,ti)}let Ce=!1;K.version===Jt.__version?(Jt.needsLights&&Jt.lightsStateVersion!==fu.state.version||Jt.outputColorSpace!==Dt||q.isBatchedMesh&&Jt.batching===!1||!q.isBatchedMesh&&Jt.batching===!0||q.isInstancedMesh&&Jt.instancing===!1||!q.isInstancedMesh&&Jt.instancing===!0||q.isSkinnedMesh&&Jt.skinning===!1||!q.isSkinnedMesh&&Jt.skinning===!0||q.isInstancedMesh&&Jt.instancingColor===!0&&q.instanceColor===null||q.isInstancedMesh&&Jt.instancingColor===!1&&q.instanceColor!==null||q.isInstancedMesh&&Jt.instancingMorph===!0&&q.morphTexture===null||q.isInstancedMesh&&Jt.instancingMorph===!1&&q.morphTexture!==null||Jt.envMap!==zt||K.fog===!0&&Jt.fog!==_t||Jt.numClippingPlanes!==void 0&&(Jt.numClippingPlanes!==dt.numPlanes||Jt.numIntersection!==dt.numIntersection)||Jt.vertexAlphas!==ne||Jt.vertexTangents!==$t||Jt.morphTargets!==Xt||Jt.morphNormals!==Be||Jt.morphColors!==Vn||Jt.toneMapping!==je||Mt.isWebGL2===!0&&Jt.morphTargetsCount!==Pe)&&(Ce=!0):(Ce=!0,Jt.__version=K.version);let hr=Jt.currentProgram;Ce===!0&&(hr=Pl(K,G,q));let Yp=!1,ka=!1,pu=!1,pn=hr.getUniforms(),ur=Jt.uniforms;if(Lt.useProgram(hr.program)&&(Yp=!0,ka=!0,pu=!0),K.id!==R&&(R=K.id,ka=!0),Yp||P!==C){pn.setValue(H,"projectionMatrix",C.projectionMatrix),pn.setValue(H,"viewMatrix",C.matrixWorldInverse);let ti=pn.map.cameraPosition;ti!==void 0&&ti.setValue(H,ht.setFromMatrixPosition(C.matrixWorld)),Mt.logarithmicDepthBuffer&&pn.setValue(H,"logDepthBufFC",2/(Math.log(C.far+1)/Math.LN2)),(K.isMeshPhongMaterial||K.isMeshToonMaterial||K.isMeshLambertMaterial||K.isMeshBasicMaterial||K.isMeshStandardMaterial||K.isShaderMaterial)&&pn.setValue(H,"isOrthographic",C.isOrthographicCamera===!0),P!==C&&(P=C,ka=!0,pu=!0)}if(q.isSkinnedMesh){pn.setOptional(H,q,"bindMatrix"),pn.setOptional(H,q,"bindMatrixInverse");let ti=q.skeleton;ti&&(Mt.floatVertexTextures?(ti.boneTexture===null&&ti.computeBoneTexture(),pn.setValue(H,"boneTexture",ti.boneTexture,Yt)):console.warn("THREE.WebGLRenderer: SkinnedMesh can only be used with WebGL 2. With WebGL 1 OES_texture_float and vertex textures support is required."))}q.isBatchedMesh&&(pn.setOptional(H,q,"batchingTexture"),pn.setValue(H,"batchingTexture",q._matricesTexture,Yt));let mu=Y.morphAttributes;if((mu.position!==void 0||mu.normal!==void 0||mu.color!==void 0&&Mt.isWebGL2===!0)&&lt.update(q,Y,hr),(ka||Jt.receiveShadow!==q.receiveShadow)&&(Jt.receiveShadow=q.receiveShadow,pn.setValue(H,"receiveShadow",q.receiveShadow)),K.isMeshGouraudMaterial&&K.envMap!==null&&(ur.envMap.value=zt,ur.flipEnvMap.value=zt.isCubeTexture&&zt.isRenderTargetTexture===!1?-1:1),ka&&(pn.setValue(H,"toneMappingExposure",y.toneMappingExposure),Jt.needsLights&&gv(ur,pu),_t&&K.fog===!0&&st.refreshFogUniforms(ur,_t),st.refreshMaterialUniforms(ur,K,I,F,rt),Fo.upload(H,qp(Jt),ur,Yt)),K.isShaderMaterial&&K.uniformsNeedUpdate===!0&&(Fo.upload(H,qp(Jt),ur,Yt),K.uniformsNeedUpdate=!1),K.isSpriteMaterial&&pn.setValue(H,"center",q.center),pn.setValue(H,"modelViewMatrix",q.modelViewMatrix),pn.setValue(H,"normalMatrix",q.normalMatrix),pn.setValue(H,"modelMatrix",q.matrixWorld),K.isShaderMaterial||K.isRawShaderMaterial){let ti=K.uniformsGroups;for(let gu=0,yv=ti.length;gu<yv;gu++)if(Mt.isWebGL2){let Kp=ti[gu];Ct.update(Kp,hr),Ct.bind(Kp,hr)}else console.warn("THREE.WebGLRenderer: Uniform Buffer Objects can only be used with WebGL 2.")}return hr}function gv(C,G){C.ambientLightColor.needsUpdate=G,C.lightProbe.needsUpdate=G,C.directionalLights.needsUpdate=G,C.directionalLightShadows.needsUpdate=G,C.pointLights.needsUpdate=G,C.pointLightShadows.needsUpdate=G,C.spotLights.needsUpdate=G,C.spotLightShadows.needsUpdate=G,C.rectAreaLights.needsUpdate=G,C.hemisphereLights.needsUpdate=G}function bv(C){return C.isMeshLambertMaterial||C.isMeshToonMaterial||C.isMeshPhongMaterial||C.isMeshStandardMaterial||C.isShadowMaterial||C.isShaderMaterial&&C.lights===!0}this.getActiveCubeFace=function(){return w},this.getActiveMipmapLevel=function(){return S},this.getRenderTarget=function(){return A},this.setRenderTargetTextures=function(C,G,Y){Vt.get(C.texture).__webglTexture=G,Vt.get(C.depthTexture).__webglTexture=Y;let K=Vt.get(C);K.__hasExternalTextures=!0,K.__autoAllocateDepthBuffer=Y===void 0,K.__autoAllocateDepthBuffer||wt.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),K.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(C,G){let Y=Vt.get(C);Y.__webglFramebuffer=G,Y.__useDefaultFramebuffer=G===void 0},this.setRenderTarget=function(C,G=0,Y=0){A=C,w=G,S=Y;let K=!0,q=null,_t=!1,Rt=!1;if(C){let zt=Vt.get(C);zt.__useDefaultFramebuffer!==void 0?(Lt.bindFramebuffer(H.FRAMEBUFFER,null),K=!1):zt.__webglFramebuffer===void 0?Yt.setupRenderTarget(C):zt.__hasExternalTextures&&Yt.rebindTextures(C,Vt.get(C.texture).__webglTexture,Vt.get(C.depthTexture).__webglTexture);let ne=C.texture;(ne.isData3DTexture||ne.isDataArrayTexture||ne.isCompressedArrayTexture)&&(Rt=!0);let $t=Vt.get(C).__webglFramebuffer;C.isWebGLCubeRenderTarget?(Array.isArray($t[G])?q=$t[G][Y]:q=$t[G],_t=!0):Mt.isWebGL2&&C.samples>0&&Yt.useMultisampledRTT(C)===!1?q=Vt.get(C).__webglMultisampledFramebuffer:Array.isArray($t)?q=$t[Y]:q=$t,x.copy(C.viewport),T.copy(C.scissor),D=C.scissorTest}else x.copy(et).multiplyScalar(I).floor(),T.copy(nt).multiplyScalar(I).floor(),D=ot;if(Lt.bindFramebuffer(H.FRAMEBUFFER,q)&&Mt.drawBuffers&&K&&Lt.drawBuffers(C,q),Lt.viewport(x),Lt.scissor(T),Lt.setScissorTest(D),_t){let zt=Vt.get(C.texture);H.framebufferTexture2D(H.FRAMEBUFFER,H.COLOR_ATTACHMENT0,H.TEXTURE_CUBE_MAP_POSITIVE_X+G,zt.__webglTexture,Y)}else if(Rt){let zt=Vt.get(C.texture),ne=G||0;H.framebufferTextureLayer(H.FRAMEBUFFER,H.COLOR_ATTACHMENT0,zt.__webglTexture,Y||0,ne)}R=-1},this.readRenderTargetPixels=function(C,G,Y,K,q,_t,Rt){if(!(C&&C.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Dt=Vt.get(C).__webglFramebuffer;if(C.isWebGLCubeRenderTarget&&Rt!==void 0&&(Dt=Dt[Rt]),Dt){Lt.bindFramebuffer(H.FRAMEBUFFER,Dt);try{let zt=C.texture,ne=zt.format,$t=zt.type;if(ne!==Fe&&It.convert(ne)!==H.getParameter(H.IMPLEMENTATION_COLOR_READ_FORMAT)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}let Xt=$t===Ur&&(wt.has("EXT_color_buffer_half_float")||Mt.isWebGL2&&wt.has("EXT_color_buffer_float"));if($t!==sn&&It.convert($t)!==H.getParameter(H.IMPLEMENTATION_COLOR_READ_TYPE)&&!($t===ps&&(Mt.isWebGL2||wt.has("OES_texture_float")||wt.has("WEBGL_color_buffer_float")))&&!Xt){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}G>=0&&G<=C.width-K&&Y>=0&&Y<=C.height-q&&H.readPixels(G,Y,K,q,It.convert(ne),It.convert($t),_t)}finally{let zt=A!==null?Vt.get(A).__webglFramebuffer:null;Lt.bindFramebuffer(H.FRAMEBUFFER,zt)}}},this.copyFramebufferToTexture=function(C,G,Y=0){let K=Math.pow(2,-Y),q=Math.floor(G.image.width*K),_t=Math.floor(G.image.height*K);Yt.setTexture2D(G,0),H.copyTexSubImage2D(H.TEXTURE_2D,Y,0,0,C.x,C.y,q,_t),Lt.unbindTexture()},this.copyTextureToTexture=function(C,G,Y,K=0){let q=G.image.width,_t=G.image.height,Rt=It.convert(Y.format),Dt=It.convert(Y.type);Yt.setTexture2D(Y,0),H.pixelStorei(H.UNPACK_FLIP_Y_WEBGL,Y.flipY),H.pixelStorei(H.UNPACK_PREMULTIPLY_ALPHA_WEBGL,Y.premultiplyAlpha),H.pixelStorei(H.UNPACK_ALIGNMENT,Y.unpackAlignment),G.isDataTexture?H.texSubImage2D(H.TEXTURE_2D,K,C.x,C.y,q,_t,Rt,Dt,G.image.data):G.isCompressedTexture?H.compressedTexSubImage2D(H.TEXTURE_2D,K,C.x,C.y,G.mipmaps[0].width,G.mipmaps[0].height,Rt,G.mipmaps[0].data):H.texSubImage2D(H.TEXTURE_2D,K,C.x,C.y,Rt,Dt,G.image),K===0&&Y.generateMipmaps&&H.generateMipmap(H.TEXTURE_2D),Lt.unbindTexture()},this.copyTextureToTexture3D=function(C,G,Y,K,q=0){if(y.isWebGL1Renderer){console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: can only be used with WebGL2.");return}let _t=Math.round(C.max.x-C.min.x),Rt=Math.round(C.max.y-C.min.y),Dt=C.max.z-C.min.z+1,zt=It.convert(K.format),ne=It.convert(K.type),$t;if(K.isData3DTexture)Yt.setTexture3D(K,0),$t=H.TEXTURE_3D;else if(K.isDataArrayTexture||K.isCompressedArrayTexture)Yt.setTexture2DArray(K,0),$t=H.TEXTURE_2D_ARRAY;else{console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: only supports THREE.DataTexture3D and THREE.DataTexture2DArray.");return}H.pixelStorei(H.UNPACK_FLIP_Y_WEBGL,K.flipY),H.pixelStorei(H.UNPACK_PREMULTIPLY_ALPHA_WEBGL,K.premultiplyAlpha),H.pixelStorei(H.UNPACK_ALIGNMENT,K.unpackAlignment);let Xt=H.getParameter(H.UNPACK_ROW_LENGTH),Be=H.getParameter(H.UNPACK_IMAGE_HEIGHT),Vn=H.getParameter(H.UNPACK_SKIP_PIXELS),je=H.getParameter(H.UNPACK_SKIP_ROWS),ts=H.getParameter(H.UNPACK_SKIP_IMAGES),Pe=Y.isCompressedTexture?Y.mipmaps[q]:Y.image;H.pixelStorei(H.UNPACK_ROW_LENGTH,Pe.width),H.pixelStorei(H.UNPACK_IMAGE_HEIGHT,Pe.height),H.pixelStorei(H.UNPACK_SKIP_PIXELS,C.min.x),H.pixelStorei(H.UNPACK_SKIP_ROWS,C.min.y),H.pixelStorei(H.UNPACK_SKIP_IMAGES,C.min.z),Y.isDataTexture||Y.isData3DTexture?H.texSubImage3D($t,q,G.x,G.y,G.z,_t,Rt,Dt,zt,ne,Pe.data):K.isCompressedArrayTexture?H.compressedTexSubImage3D($t,q,G.x,G.y,G.z,_t,Rt,Dt,zt,Pe.data):H.texSubImage3D($t,q,G.x,G.y,G.z,_t,Rt,Dt,zt,ne,Pe),H.pixelStorei(H.UNPACK_ROW_LENGTH,Xt),H.pixelStorei(H.UNPACK_IMAGE_HEIGHT,Be),H.pixelStorei(H.UNPACK_SKIP_PIXELS,Vn),H.pixelStorei(H.UNPACK_SKIP_ROWS,je),H.pixelStorei(H.UNPACK_SKIP_IMAGES,ts),q===0&&K.generateMipmaps&&H.generateMipmap($t),Lt.unbindTexture()},this.initTexture=function(C){C.isCubeTexture?Yt.setTextureCube(C,0):C.isData3DTexture?Yt.setTexture3D(C,0):C.isDataArrayTexture||C.isCompressedArrayTexture?Yt.setTexture2DArray(C,0):Yt.setTexture2D(C,0),Lt.unbindTexture()},this.resetState=function(){w=0,S=0,A=null,Lt.reset(),Tt.reset()},typeof __THREE_DEVTOOLS__!="undefined"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return ms}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;let e=this.getContext();e.drawingBufferColorSpace=t===Pf?"display-p3":"srgb",e.unpackColorSpace=fe.workingColorSpace===oh?"display-p3":"srgb"}get useLegacyLights(){return console.warn("THREE.WebGLRenderer: The property .useLegacyLights has been deprecated. Migrate your lighting according to the following guide: https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733."),this._useLegacyLights}set useLegacyLights(t){console.warn("THREE.WebGLRenderer: The property .useLegacyLights has been deprecated. Migrate your lighting according to the following guide: https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733."),this._useLegacyLights=t}},bf=class extends $a{};bf.prototype.isWebGL1Renderer=!0;var Js=class extends ci{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new ys,this.environmentRotation=new ys,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__!="undefined"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){let e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),e.object.environmentRotation=this.environmentRotation.toArray(),e}};var qo=class extends Yn{constructor(t=null,e=1,n=1,s,r,o,a,l,c=ue,h=ue,u,f){super(null,o,a,l,c,h,s,r,u,f),this.isDataTexture=!0,this.image={data:t,width:e,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var yf=class extends Nr{constructor(t){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new Pt(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}},o1=new de,vf=new Kc,Dc=new Xi,Nc=new V,sh=class extends ci{constructor(t=new Ee,e=new yf){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}raycast(t,e){let n=this.geometry,s=this.matrixWorld,r=t.params.Points.threshold,o=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Dc.copy(n.boundingSphere),Dc.applyMatrix4(s),Dc.radius+=r,t.ray.intersectsSphere(Dc)===!1)return;o1.copy(s).invert(),vf.copy(t.ray).applyMatrix4(o1);let a=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=n.index,u=n.attributes.position;if(c!==null){let f=Math.max(0,o.start),d=Math.min(c.count,o.start+o.count);for(let g=f,b=d;g<b;g++){let p=c.getX(g);Nc.fromBufferAttribute(u,p),a1(Nc,p,l,s,t,e,this)}}else{let f=Math.max(0,o.start),d=Math.min(u.count,o.start+o.count);for(let g=f,b=d;g<b;g++)Nc.fromBufferAttribute(u,g),a1(Nc,g,l,s,t,e,this)}}updateMorphTargets(){let e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){let s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}};function a1(i,t,e,n,s,r,o){let a=vf.distanceSqToPoint(i);if(a<e){let l=new V;vf.closestPointToPoint(i,l),l.applyMatrix4(n);let c=s.ray.origin.distanceTo(l);if(c<s.near||c>s.far)return;r.push({distance:c,distanceToRay:Math.sqrt(a),point:l,index:t,face:null,object:o})}}function Bc(i,t,e){return!i||!e&&i.constructor===t?i:typeof t.BYTES_PER_ELEMENT=="number"?new t(i):Array.prototype.slice.call(i)}function FE(i){return ArrayBuffer.isView(i)&&!(i instanceof DataView)}var Xo=class{constructor(t,e,n,s){this.parameterPositions=t,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new e.constructor(n),this.sampleValues=e,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(t){let e=this.parameterPositions,n=this._cachedIndex,s=e[n],r=e[n-1];n:{t:{let o;e:{i:if(!(t<s)){for(let a=n+2;;){if(s===void 0){if(t<r)break i;return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===a)break;if(r=s,s=e[++n],t<s)break t}o=e.length;break e}if(!(t>=r)){let a=e[1];t<a&&(n=2,r=a);for(let l=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===l)break;if(s=r,r=e[--n-1],t>=r)break t}o=n,n=0;break e}break n}for(;n<o;){let a=n+o>>>1;t<e[a]?o=a:n=a+1}if(s=e[n],r=e[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,s)}return this.interpolate_(n,r,t,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(t){let e=this.resultBuffer,n=this.sampleValues,s=this.valueSize,r=t*s;for(let o=0;o!==s;++o)e[o]=n[r+o];return e}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},_f=class extends Xo{constructor(t,e,n,s){super(t,e,n,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:pg,endingEnd:pg}}intervalChanged_(t,e,n){let s=this.parameterPositions,r=t-2,o=t+1,a=s[r],l=s[o];if(a===void 0)switch(this.getSettings_().endingStart){case mg:r=t,a=2*e-n;break;case gg:r=s.length-2,a=e+s[r]-s[r+1];break;default:r=t,a=n}if(l===void 0)switch(this.getSettings_().endingEnd){case mg:o=t,l=2*n-e;break;case gg:o=1,l=n+s[1]-s[0];break;default:o=t-1,l=e}let c=(n-e)*.5,h=this.valueSize;this._weightPrev=c/(e-a),this._weightNext=c/(l-n),this._offsetPrev=r*h,this._offsetNext=o*h}interpolate_(t,e,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=t*a,c=l-a,h=this._offsetPrev,u=this._offsetNext,f=this._weightPrev,d=this._weightNext,g=(n-e)/(s-e),b=g*g,p=b*g,m=-f*p+2*f*b-f*g,v=(1+f)*p+(-1.5-2*f)*b+(-.5+f)*g+1,y=(-1-d)*p+(1.5+d)*b+.5*g,_=d*p-d*b;for(let w=0;w!==a;++w)r[w]=m*o[h+w]+v*o[c+w]+y*o[l+w]+_*o[u+w];return r}},xf=class extends Xo{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t,e,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=t*a,c=l-a,h=(n-e)/(s-e),u=1-h;for(let f=0;f!==a;++f)r[f]=o[c+f]*u+o[l+f]*h;return r}},wf=class extends Xo{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t){return this.copySampleValue_(t-1)}},Si=class{constructor(t,e,n,s){if(t===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(e===void 0||e.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+t);this.name=t,this.times=Bc(e,this.TimeBufferType),this.values=Bc(n,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(t){let e=t.constructor,n;if(e.toJSON!==this.toJSON)n=e.toJSON(t);else{n={name:t.name,times:Bc(t.times,Array),values:Bc(t.values,Array)};let s=t.getInterpolation();s!==t.DefaultInterpolation&&(n.interpolation=s)}return n.type=t.ValueTypeName,n}InterpolantFactoryMethodDiscrete(t){return new wf(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodLinear(t){return new xf(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodSmooth(t){return new _f(this.times,this.values,this.getValueSize(),t)}setInterpolation(t){let e;switch(t){case Oc:e=this.InterpolantFactoryMethodDiscrete;break;case zc:e=this.InterpolantFactoryMethodLinear;break;case vd:e=this.InterpolantFactoryMethodSmooth;break}if(e===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(t!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return console.warn("THREE.KeyframeTrack:",n),this}return this.createInterpolant=e,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Oc;case this.InterpolantFactoryMethodLinear:return zc;case this.InterpolantFactoryMethodSmooth:return vd}}getValueSize(){return this.values.length/this.times.length}shift(t){if(t!==0){let e=this.times;for(let n=0,s=e.length;n!==s;++n)e[n]+=t}return this}scale(t){if(t!==1){let e=this.times;for(let n=0,s=e.length;n!==s;++n)e[n]*=t}return this}trim(t,e){let n=this.times,s=n.length,r=0,o=s-1;for(;r!==s&&n[r]<t;)++r;for(;o!==-1&&n[o]>e;)--o;if(++o,r!==0||o!==s){r>=o&&(o=Math.max(o,1),r=o-1);let a=this.getValueSize();this.times=n.slice(r,o),this.values=this.values.slice(r*a,o*a)}return this}validate(){let t=!0,e=this.getValueSize();e-Math.floor(e)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),t=!1);let n=this.times,s=this.values,r=n.length;r===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),t=!1);let o=null;for(let a=0;a!==r;a++){let l=n[a];if(typeof l=="number"&&isNaN(l)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,a,l),t=!1;break}if(o!==null&&o>l){console.error("THREE.KeyframeTrack: Out of order keys.",this,a,l,o),t=!1;break}o=l}if(s!==void 0&&FE(s))for(let a=0,l=s.length;a!==l;++a){let c=s[a];if(isNaN(c)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,a,c),t=!1;break}}return t}optimize(){let t=this.times.slice(),e=this.values.slice(),n=this.getValueSize(),s=this.getInterpolation()===vd,r=t.length-1,o=1;for(let a=1;a<r;++a){let l=!1,c=t[a],h=t[a+1];if(c!==h&&(a!==1||c!==t[0]))if(s)l=!0;else{let u=a*n,f=u-n,d=u+n;for(let g=0;g!==n;++g){let b=e[u+g];if(b!==e[f+g]||b!==e[d+g]){l=!0;break}}}if(l){if(a!==o){t[o]=t[a];let u=a*n,f=o*n;for(let d=0;d!==n;++d)e[f+d]=e[u+d]}++o}}if(r>0){t[o]=t[r];for(let a=r*n,l=o*n,c=0;c!==n;++c)e[l+c]=e[a+c];++o}return o!==t.length?(this.times=t.slice(0,o),this.values=e.slice(0,o*n)):(this.times=t,this.values=e),this}clone(){let t=this.times.slice(),e=this.values.slice(),n=this.constructor,s=new n(this.name,t,e);return s.createInterpolant=this.createInterpolant,s}};Si.prototype.TimeBufferType=Float32Array;Si.prototype.ValueBufferType=Float32Array;Si.prototype.DefaultInterpolation=zc;var Fr=class extends Si{};Fr.prototype.ValueTypeName="bool";Fr.prototype.ValueBufferType=Array;Fr.prototype.DefaultInterpolation=Oc;Fr.prototype.InterpolantFactoryMethodLinear=void 0;Fr.prototype.InterpolantFactoryMethodSmooth=void 0;var Mf=class extends Si{};Mf.prototype.ValueTypeName="color";var Sf=class extends Si{};Sf.prototype.ValueTypeName="number";var Af=class extends Xo{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t,e,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=(n-e)/(s-e),c=t*a;for(let h=c+a;c!==h;c+=4)Zs.slerpFlat(r,0,o,c-a,o,c,l);return r}},qa=class extends Si{InterpolantFactoryMethodLinear(t){return new Af(this.times,this.values,this.getValueSize(),t)}};qa.prototype.ValueTypeName="quaternion";qa.prototype.DefaultInterpolation=zc;qa.prototype.InterpolantFactoryMethodSmooth=void 0;var Or=class extends Si{};Or.prototype.ValueTypeName="string";Or.prototype.ValueBufferType=Array;Or.prototype.DefaultInterpolation=Oc;Or.prototype.InterpolantFactoryMethodLinear=void 0;Or.prototype.InterpolantFactoryMethodSmooth=void 0;var Ef=class extends Si{};Ef.prototype.ValueTypeName="vector";var Tf=class{constructor(t,e,n){let s=this,r=!1,o=0,a=0,l,c=[];this.onStart=void 0,this.onLoad=t,this.onProgress=e,this.onError=n,this.itemStart=function(h){a++,r===!1&&s.onStart!==void 0&&s.onStart(h,o,a),r=!0},this.itemEnd=function(h){o++,s.onProgress!==void 0&&s.onProgress(h,o,a),o===a&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(h){s.onError!==void 0&&s.onError(h)},this.resolveURL=function(h){return l?l(h):h},this.setURLModifier=function(h){return l=h,this},this.addHandler=function(h,u){return c.push(h,u),this},this.removeHandler=function(h){let u=c.indexOf(h);return u!==-1&&c.splice(u,2),this},this.getHandler=function(h){for(let u=0,f=c.length;u<f;u+=2){let d=c[u],g=c[u+1];if(d.global&&(d.lastIndex=0),d.test(h))return g}return null}}},OE=new Tf,kf=class{constructor(t){this.manager=t!==void 0?t:OE,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(t,e){let n=this;return new Promise(function(s,r){n.load(t,s,e,r)})}parse(){}setCrossOrigin(t){return this.crossOrigin=t,this}setWithCredentials(t){return this.withCredentials=t,this}setPath(t){return this.path=t,this}setResourcePath(t){return this.resourcePath=t,this}setRequestHeader(t){return this.requestHeader=t,this}};kf.DEFAULT_MATERIAL_NAME="__DEFAULT";var If="\\[\\]\\.:\\/",zE=new RegExp("["+If+"]","g"),Uf="[^"+If+"]",HE="[^"+If.replace("\\.","")+"]",GE=/((?:WC+[\/:])*)/.source.replace("WC",Uf),WE=/(WCOD+)?/.source.replace("WCOD",HE),VE=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Uf),$E=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Uf),qE=new RegExp("^"+GE+WE+VE+$E+"$"),XE=["material","materials","bones","map"],Cf=class{constructor(t,e,n){let s=n||Re.parseTrackName(e);this._targetGroup=t,this._bindings=t.subscribe_(e,s)}getValue(t,e){this.bind();let n=this._targetGroup.nCachedObjects_,s=this._bindings[n];s!==void 0&&s.getValue(t,e)}setValue(t,e){let n=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=n.length;s!==r;++s)n[s].setValue(t,e)}bind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].bind()}unbind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].unbind()}},Re=class i{constructor(t,e,n){this.path=e,this.parsedPath=n||i.parseTrackName(e),this.node=i.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,e,n){return t&&t.isAnimationObjectGroup?new i.Composite(t,e,n):new i(t,e,n)}static sanitizeNodeName(t){return t.replace(/\s/g,"_").replace(zE,"")}static parseTrackName(t){let e=qE.exec(t);if(e===null)throw new Error("PropertyBinding: Cannot parse trackName: "+t);let n={nodeName:e[2],objectName:e[3],objectIndex:e[4],propertyName:e[5],propertyIndex:e[6]},s=n.nodeName&&n.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=n.nodeName.substring(s+1);XE.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,s),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+t);return n}static findNode(t,e){if(e===void 0||e===""||e==="."||e===-1||e===t.name||e===t.uuid)return t;if(t.skeleton){let n=t.skeleton.getBoneByName(e);if(n!==void 0)return n}if(t.children){let n=function(r){for(let o=0;o<r.length;o++){let a=r[o];if(a.name===e||a.uuid===e)return a;let l=n(a.children);if(l)return l}return null},s=n(t.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(t,e){t[e]=this.targetObject[this.propertyName]}_getValue_array(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)t[e++]=n[s]}_getValue_arrayElement(t,e){t[e]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(t,e){this.resolvedProperty.toArray(t,e)}_setValue_direct(t,e){this.targetObject[this.propertyName]=t[e]}_setValue_direct_setNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++]}_setValue_array_setNeedsUpdate(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(t,e){this.resolvedProperty[this.propertyIndex]=t[e]}_setValue_arrayElement_setNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(t,e){this.resolvedProperty.fromArray(t,e)}_setValue_fromArray_setNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(t,e){this.bind(),this.getValue(t,e)}_setValue_unbound(t,e){this.bind(),this.setValue(t,e)}bind(){let t=this.node,e=this.parsedPath,n=e.objectName,s=e.propertyName,r=e.propertyIndex;if(t||(t=i.findNode(this.rootNode,e.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let c=e.objectIndex;switch(n){case"materials":if(!t.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}t=t.material.materials;break;case"bones":if(!t.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}t=t.skeleton.bones;for(let h=0;h<t.length;h++)if(t[h].name===c){c=h;break}break;case"map":if("map"in t){t=t.map;break}if(!t.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}t=t.material.map;break;default:if(t[n]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}t=t[n]}if(c!==void 0){if(t[c]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,t);return}t=t[c]}}let o=t[s];if(o===void 0){let c=e.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+c+"."+s+" but it wasn't found.",t);return}let a=this.Versioning.None;this.targetObject=t,t.needsUpdate!==void 0?a=this.Versioning.NeedsUpdate:t.matrixWorldNeedsUpdate!==void 0&&(a=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!t.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!t.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}t.morphTargetDictionary[r]!==void 0&&(r=t.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=r}else o.fromArray!==void 0&&o.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(l=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][a]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};Re.Composite=Cf;Re.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};Re.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};Re.prototype.GetterByBindingType=[Re.prototype._getValue_direct,Re.prototype._getValue_array,Re.prototype._getValue_arrayElement,Re.prototype._getValue_toArray];Re.prototype.SetterByBindingTypeAndVersioning=[[Re.prototype._setValue_direct,Re.prototype._setValue_direct_setNeedsUpdate,Re.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[Re.prototype._setValue_array,Re.prototype._setValue_array_setNeedsUpdate,Re.prototype._setValue_array_setMatrixWorldNeedsUpdate],[Re.prototype._setValue_arrayElement,Re.prototype._setValue_arrayElement_setNeedsUpdate,Re.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[Re.prototype._setValue_fromArray,Re.prototype._setValue_fromArray_setNeedsUpdate,Re.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var TC=new Float32Array(1);typeof __THREE_DEVTOOLS__!="undefined"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Rf}}));typeof window!="undefined"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Rf);var In=512,We=16,vs=In/We,Ai=vs*vs,Ka=new WeakMap;function js(i){return[i%vs*We,Math.floor(i/vs)*We]}function R1(i,t){let e;try{e=Gl(i,t)}catch(n){console.warn("[atlas] texture failed",Ni[i],n),e=C1()}return e.length!==We*We*4&&(e=C1()),e.slice()}function P1(i,t,e){let[n,s]=js(t);for(let r=0;r<We;r++)i.set(e.subarray(r*We*4,(r+1)*We*4),((s+r)*In+n)*4)}function L1(i,t="default"){let e=Ni.length;e>Ai&&console.warn(`[atlas] ${e} textures do not fit in ${Ai} tiles`);let n=[],s=new Uint8Array(In*In*4);for(let a=0;a<e&&a<Ai;a++){let l=R1(a,t);n.push(l),P1(s,a,l)}let r=new qo(s,In,In,Fe,sn);r.name="atlas",r.magFilter=ue,r.wrapS=ge,r.wrapT=ge,r.flipY=!1,r.generateMipmaps=!1,r.unpackAlignment=4;let o={texture:r,tiles:n,pack:t};return Df(o,i),o}function I1(i,t){let e=i.texture,n=e.image.data;for(let s=0;s<i.tiles.length;s++){let r=R1(s,t);i.tiles[s].set(r),P1(n,s,r)}if(i.pack=t,Ka.has(i))if(e.mipmaps.length>0){let s=U1(n),r=Ka.get(i);for(let o=1;o<s.length&&o<r.length;o++)r[o].data.set(s[o].data)}else Ka.delete(i);e.needsUpdate=!0}function Df(i,t){let e=i.texture,n=t?Cr:ue;if(!(e.minFilter===n&&(t?e.mipmaps.length>0:e.mipmaps.length===0)&&e.version>0)){if(t){let s=Ka.get(i);s||(s=U1(e.image.data),Ka.set(i,s)),e.mipmaps=s}else e.mipmaps=[];e.minFilter=n,e.needsUpdate=!0}}function U1(i){let t=[{data:i,width:In,height:In}],e=new Float32Array(Ai);for(let s=0;s<Ai;s++){if(dr[s]!==1)continue;let[r,o]=js(s),a=0;for(let l=0;l<We;l++)for(let c=0;c<We;c++)i[((o+l)*In+r+c)*4+3]>=128&&a++;e[s]=a/(We*We)}let n=new Float32Array(We*We);for(let s=1;s<=4;s++){let r=In>>s,o=We>>s,a=1<<s,l=a*a,c=new Uint8Array(r*r*4);for(let h=0;h<Ai;h++){let u=dr[h],[f,d]=js(h),g=f>>s,b=d>>s,p=0;for(let m=0;m<o;m++)for(let v=0;v<o;v++){let y=0,_=0,w=0,S=0,A=0,R=0,P=0,x=f+v*a,T=d+m*a;for(let k=0;k<a;k++){let B=((T+k)*In+x)*4;for(let F=0;F<a;F++,B+=4){let I=i[B+3];y+=i[B],_+=i[B+1],w+=i[B+2],S+=I,A+=i[B]*I,R+=i[B+1]*I,P+=i[B+2]*I}}let D=((b+m)*r+g+v)*4;u===1&&S>0?(c[D]=Math.round(A/S),c[D+1]=Math.round(R/S),c[D+2]=Math.round(P/S)):(c[D]=Math.round(y/l),c[D+1]=Math.round(_/l),c[D+2]=Math.round(w/l));let U=S/l;u===1?n[p++]=U:c[D+3]=Math.round(U)}if(u===1){let m=YE(n,p,e[h]),v=0;for(let y=0;y<o;y++)for(let _=0;_<o;_++){let w=((b+y)*r+g+_)*4;c[w+3]=Math.min(255,Math.round(n[v++]*m))}}}t.push({data:c,width:r,height:r})}for(let s=5;In>>s>=1;s++){let r=t[s-1],o=In>>s,a=new Uint8Array(o*o*4);for(let l=0;l<o;l++)for(let c=0;c<o;c++)for(let h=0;h<4;h++){let u=r.data,f=r.width,d=u[(2*l*f+2*c)*4+h]+u[(2*l*f+2*c+1)*4+h]+u[((2*l+1)*f+2*c)*4+h]+u[((2*l+1)*f+2*c+1)*4+h];a[(l*o+c)*4+h]=d+2>>2}t.push({data:a,width:o,height:o})}return t}function YE(i,t,e){if(t===0)return 1;let n=c=>{let h=0;for(let u=0;u<t;u++)i[u]*c>=127.5&&h++;return h/t};if(e<=0)return 1;let s=.25,r=64;if(n(r)<e)return r;for(let c=0;c<24;c++){let h=Math.sqrt(s*r);n(h)>=e?r=h:s=h}let o=n(r),a=n(s),l=Math.abs(a-e)<Math.abs(o-e)?s:r;return Math.max(1,l)}function C1(){let i=new Uint8ClampedArray(We*We*4);for(let t=0;t<We;t++)for(let e=0;e<We;e++){let n=(e>>3^t>>3)&1,s=(t*We+e)*4;i[s]=n?248:0,i[s+1]=0,i[s+2]=n?248:0,i[s+3]=255}return i}var Zo=62+14/16,KE=`#define HP highp
`,ZE=`
#ifdef GL_FRAGMENT_PRECISION_HIGH
#define HP highp
#else
#define HP mediump
#endif
`,zr=`
uniform HP vec3 uSkyTop;
uniform HP vec3 uSkyHorizon;
uniform HP vec3 uGlowColor;
uniform HP vec3 uGlowDir;
uniform HP float uGlow;
`,Hr=`
vec3 skyColor(vec3 d) {
  float up = clamp(d.y, 0.0, 1.0);
  float k = 1.0 - up;
  vec3 c = mix(uSkyTop, uSkyHorizon, k * k * k);
  if (uGlow > 0.001) {
    vec2 hd = d.xz / max(length(d.xz), 0.0001);
    float f = dot(hd, uGlowDir.xz) * 0.5 + 0.5;
    float g = uGlow * f * f * f * exp(-abs(d.y) * 3.2);
    c = mix(c, uGlowColor, clamp(g, 0.0, 1.0));
  }
  return c;
}
`,JE=`
vec4 packDepth(highp float v) {
  highp vec4 r = vec4(fract(v * vec3(16777216.0, 65536.0, 256.0)), v);
  r.yzw -= r.xyz * (1.0 / 256.0);
  return r * (256.0 / 255.0);
}
`,Jo=`
float lightCurve(float l) { return l / (4.0 - 3.0 * l); }
// sum of sky and block light -> final multiplier: ambient floor, then the brightness
// option as a gamma lift (0 = moody, 1 = bright), like the original game's lightmap.
vec3 finishLight(vec3 c) {
  c = clamp(c, 0.0, 1.0) * 0.95 + 0.05;
  vec3 ic = 1.0 - c;
  ic *= ic; ic *= ic;
  return mix(c, 1.0 - ic, uBrightness);
}
`,jE=`
attribute vec2 auv;
attribute vec4 atint;
attribute vec4 alight;

uniform float uTime;
uniform float uAtlasSize;
uniform vec3 uCamWrap;
uniform float uFogNear;
uniform float uFogFar;
uniform vec3 uFogColor;
uniform vec3 uSkyLightColor;
uniform vec3 uBlockLightColor;
uniform float uBrightness;
${zr}
#ifdef USE_SHADOWS
uniform mat4 uShadowMatrix;
uniform vec3 uLightDir;
uniform float uShadowNormalOffset;
uniform vec2 uShadowFade;
varying HP vec4 vShadow;
varying float vShadowFade;
varying float vSkyB;
varying vec3 vBlock;
#endif
#if defined(CLIP_PLANE) || defined(PLANAR)
varying HP float vWorldY;
#endif
#ifdef HAND
uniform vec2 uHandLight;
#endif

varying HP vec2 vUv;
varying vec3 vColor;
varying vec4 vFog;
#ifdef LAYER_OPAQUE
varying vec3 vTint;
#endif
#if defined(LAYER_WATER) || defined(LAYER_LAVA)
varying HP vec2 vFace;
varying HP vec3 vRel;
varying vec3 vNormal;
varying vec3 vTintW;
varying float vSkyVis;
#endif

${Hr}
${Jo}

void main() {
  float flags = floor(alight.w * 255.0 + 0.5);
  float face = mod(flags, 8.0);
  float axis = floor(face * 0.5);
  float sgn = 1.0 - 2.0 * mod(face, 2.0);
  vec3 n = vec3(equal(vec3(axis), vec3(0.0, 1.0, 2.0))) * sgn; // zero for face 6 (no normal)

  vec4 mv = modelViewMatrix * vec4(position, 1.0);
#ifdef HAND
  vec3 rel = vec3(0.0);
#else
  // World-space offset from the camera (precise: modelViewMatrix is built in doubles on the CPU)
  vec3 rel = mv.xyz * mat3(viewMatrix);
  // World position wrapped every 1024 blocks, for animation patterns
  vec3 wpat = uCamWrap + rel;
#ifdef WAVING
  float wave = mod(floor(flags / 8.0), 4.0);
  if (wave > 0.5) {
    float t = uTime;
    vec3 d = vec3(0.0);
    if (wave < 1.5) {
      // plants: only the top vertices sway, with slow gusts
      float top = step(31.5, flags);
      float gust = 0.6 + 0.4 * sin(t * 0.63 + wpat.x * 0.071 + wpat.z * 0.053);
      d.x = (sin(t * 1.93 + wpat.x * 0.73 + wpat.z * 0.41) + 0.4 * sin(t * 3.71 + wpat.z * 1.37)) * 0.07 * gust * top;
      d.z = (sin(t * 1.61 + wpat.z * 0.67 - wpat.x * 0.29) + 0.4 * sin(t * 3.13 + wpat.x * 1.19)) * 0.055 * gust * top;
    } else if (wave < 2.5) {
      // leaves: small wobble; neighbours share corners so the canopy never cracks
      d.x = sin(t * 1.7 + wpat.x * 0.9 + wpat.y * 0.6 + wpat.z * 0.3) * 0.026;
      d.y = sin(t * 2.3 + wpat.z * 0.8 + wpat.x * 0.4 + wpat.y * 0.5) * 0.016;
      d.z = sin(t * 1.9 + wpat.y * 0.7 + wpat.z * 0.9 - wpat.x * 0.3) * 0.026;
    } else {
      // liquid surface: gentle swell, only ever downwards so it stays below the side faces
      float s = sin(t * 1.4 + wpat.x * 0.55 + wpat.z * 0.31) + sin(t * 1.9 - wpat.z * 0.47 + wpat.x * 0.23);
      d.y = -(0.5 + 0.25 * s) * 0.05;
    }
    rel += d;
    wpat += d;
    mv.xyz += mat3(viewMatrix) * d;
  }
#endif
#if defined(CLIP_PLANE) || defined(PLANAR)
  vWorldY = wpat.y;
#endif
#endif
  gl_Position = projectionMatrix * mv;
  vUv = auv / uAtlasSize;

#ifndef DEPTH
#ifdef HAND
  vec2 lv = uHandLight;
#else
  vec2 lv = alight.xy;
#endif
  float shade = alight.z;
  float sb = lightCurve(lv.x);
  float bb = lightCurve(lv.y);
#ifdef FANCY
  // torches reach a little further and burn a little warmer
  bb = min(bb * 1.22, 1.2);
  vec3 blkL = vec3(bb * 1.04, bb * ((bb * 0.55 + 0.4) * 0.58 + 0.36), bb * (bb * bb * 0.5 + 0.28)) * uBlockLightColor;
#else
  vec3 blkL = vec3(bb, bb * ((bb * 0.6 + 0.4) * 0.6 + 0.4), bb * (bb * bb * 0.6 + 0.4)) * uBlockLightColor;
#endif
  vec3 skyL = sb * uSkyLightColor;
  float masked = step(0.5, atint.a);
#ifdef LAYER_OPAQUE
  vTint = mix(vec3(1.0), atint.rgb, masked);          // masked tint: applied per texel in the FS
  vec3 faceTint = mix(atint.rgb, vec3(1.0), masked);
#else
  vec3 faceTint = atint.rgb;
#endif
#if defined(LAYER_WATER)
  faceTint = vec3(1.0);
  vTintW = atint.rgb;
  vSkyVis = lv.x * lv.x;
#endif
#if defined(LAYER_LAVA) || defined(FULLBRIGHT)
  vColor = faceTint * mix(1.0, shade, 0.25);
#elif defined(USE_SHADOWS)
  vSkyB = sb;
  vBlock = blkL;
  vColor = faceTint * shade;
#else
  vColor = finishLight(skyL + blkL) * shade * faceTint;
#endif

#ifdef HAND
  vFog = vec4(0.0);
#else
  float dist = max(length(rel.xz), abs(rel.y));
  float fog = clamp((dist - uFogNear) / max(uFogFar - uFogNear, 0.001), 0.0, 1.0);
  vFog = vec4(fog > 0.0 ? skyColor(rel / max(length(rel), 0.0001)) : uFogColor, fog);
#endif

#ifdef USE_SHADOWS
  float noNormal = step(5.5, face);
  float ndl = mix(dot(n, uLightDir), 1.0, noNormal);
  vec3 off = mix(n, uLightDir, noNormal);
  // normal offset: about one shadow texel, more at grazing light (no acne, no peter-panning
  // on blocks: receivers move out of their own surface, casters stay where they are)
  float graze = 1.0 - clamp(abs(ndl), 0.0, 1.0);
  vShadow.xyz = (uShadowMatrix * vec4(rel + off * uShadowNormalOffset * (0.7 + 1.3 * graze), 1.0)).xyz;
  // faces turned away from the light are in their own shadow (smoothly, to hide acne at grazing angles)
  vShadow.w = clamp(ndl * 4.0 + 0.25, 0.0, 1.0);
  vShadowFade = smoothstep(uShadowFade.x, uShadowFade.y, length(rel.xz));
#endif

#if (defined(LAYER_WATER) || defined(LAYER_LAVA)) && !defined(HAND)
  vec3 an = abs(n);
  vFace = an.y > 0.5 ? wpat.xz : (an.x > 0.5 ? wpat.zy : wpat.xy);
  vRel = rel;
  vNormal = n;
#endif
#endif
}
`,QE=`
#ifdef USE_SHADOWS
uniform sampler2D uShadowMap;
uniform HP float uShadowTexel;
uniform HP float uShadowBias;
uniform vec3 uAmbientLight;
uniform vec3 uDirectLight;
varying HP vec4 vShadow;
varying float vShadowFade;
varying float vSkyB;
varying vec3 vBlock;
HP float unpackDepth(HP vec4 v) {
  return dot(v, vec4(255.0 / 256.0 / 16777216.0, 255.0 / 256.0 / 65536.0, 255.0 / 256.0 / 256.0, 255.0 / 256.0));
}
float shadowTap(HP vec2 uv, HP float z) { return step(z, unpackDepth(texture2D(uShadowMap, uv))); }
float shadowRow(HP vec2 uv, HP float z, HP float t, vec2 w) {
  return shadowTap(uv - vec2(t, 0.0), z) * w.x + shadowTap(uv, z) + shadowTap(uv + vec2(t, 0.0), z)
       + shadowTap(uv + vec2(2.0 * t, 0.0), z) * w.y;
}
// 3x3 texel box filter, bilinearly weighted: 16 taps, soft edges about 3 texels wide
float shadowLit() {
  HP vec3 sp = vShadow.xyz;
  if (sp.x <= 0.0 || sp.x >= 1.0 || sp.y <= 0.0 || sp.y >= 1.0 || sp.z >= 1.0) return 1.0;
  HP float t = uShadowTexel;
  HP float z = sp.z - uShadowBias;
  HP vec2 tc = sp.xy / t - 0.5;
  HP vec2 f = fract(tc);
  HP vec2 b = (floor(tc) + 0.5) * t;
  vec2 wx = vec2(1.0 - f.x, f.x);
  float s = shadowRow(b - vec2(0.0, t), z, t, wx) * (1.0 - f.y)
          + shadowRow(b, z, t, wx)
          + shadowRow(b + vec2(0.0, t), z, t, wx)
          + shadowRow(b + vec2(0.0, 2.0 * t), z, t, wx) * f.y;
  return s * (1.0 / 9.0);
}
// how much direct sun (or moon) light reaches this fragment, 0..1
float sunLit() {
  if (vShadow.w <= 0.0) return 0.0;
  if (vShadowFade >= 0.999) return vShadow.w;
  return mix(shadowLit(), 1.0, vShadowFade) * vShadow.w;
}
// cool sky ambient everywhere, warm direct light where the sun reaches; block light untouched
vec3 shadowedLight(float lit) {
  vec3 amb = vSkyB * uAmbientLight + vBlock;
  return mix(finishLight(amb), finishLight(amb + vSkyB * uDirectLight), lit);
}
#endif
`,Nf=`
precision mediump float;
uniform sampler2D uAtlas;
uniform HP float uBrightness;
varying HP vec2 vUv;
varying vec3 vColor;
varying vec4 vFog;
${Jo}
${QE}
#if defined(CLIP_PLANE) || defined(PLANAR)
varying HP float vWorldY;
#endif
#ifdef CLIP_PLANE
uniform HP float uClipY;
#endif
`,Ko=`
${Nf}
#ifdef LAYER_OPAQUE
varying vec3 vTint;
#endif
#ifdef ULTRA
uniform sampler2D uEmissive;
uniform float uEmissiveBoost;
#endif
void main() {
#ifdef CLIP_PLANE
  if (vWorldY < uClipY) discard;
#endif
  vec4 tex = texture2D(uAtlas, vUv);
#if defined(LAYER_CUTOUT)
  if (tex.a < 0.5) discard;
#endif
  vec3 c = tex.rgb;
#ifdef LAYER_OPAQUE
  c *= mix(vTint, vec3(1.0), tex.a);
#endif
#if defined(USE_SHADOWS) && !defined(FULLBRIGHT)
  c *= vColor * shadowedLight(sunLit());
#else
  c *= vColor;
#endif
#if defined(ULTRA) && !defined(LAYER_TRANSLUCENT)
  // light sources: their bright texels glow (HDR, picked up by the bloom pass)
  float em = texture2D(uEmissive, vUv).r;
  float lum = dot(tex.rgb, vec3(0.3, 0.59, 0.11));
  c = mix(c, tex.rgb * uEmissiveBoost, em * smoothstep(0.4, 0.8, lum));
#endif
#ifdef LAYER_TRANSLUCENT
  gl_FragColor = vec4(mix(c, vFog.rgb, vFog.a), tex.a);
#else
  gl_FragColor = vec4(mix(c, vFog.rgb, vFog.a), 1.0);
#endif
}
`,tT=`
${Nf}
uniform HP float uAtlasSize;
uniform HP float uTime;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform HP vec3 uFogColor;
uniform vec2 uWaterTile;
uniform float uUnderwater;
${zr}
#ifdef FANCY
uniform HP vec3 uLightDir;
#endif
#ifdef PLANAR
uniform sampler2D uReflection;
uniform HP vec2 uScreenInv;
uniform HP float uPlanarY;
uniform float uPlanarOn;
#endif
#ifdef ULTRA
uniform float uGlintBoost;
#endif
varying HP vec2 vFace;
varying HP vec3 vRel;
varying vec3 vNormal;
varying vec3 vTintW;
varying float vSkyVis;
${Hr}
void main() {
  HP float t = uTime;
  float isTop = step(0.5, abs(vNormal.y));
  // one ripple value per texture pixel (16 per block)
  HP vec2 cell = floor(vFace * 16.0);
  cell.y += (1.0 - isTop) * floor(t * 12.0);   // falling pattern on the sides
  HP vec2 q = cell + 0.5;
  HP float a1 = dot(q, vec2(0.37, 0.21)) + t * 1.9;
  HP float a2 = dot(q, vec2(-0.17, 0.33)) + t * 1.4;
  HP float a3 = dot(q, vec2(0.29, -0.41)) - t * 2.3;
  HP float a4 = dot(q, vec2(0.61, 0.53)) + t * 3.1;
  float h = sin(a1) * 0.45 + sin(a2) * 0.35 + sin(a3) * 0.3 + sin(a4) * 0.12;
  vec2 g = cos(a1) * 0.45 * vec2(0.37, 0.21) + cos(a2) * 0.35 * vec2(-0.17, 0.33)
         + cos(a3) * 0.3 * vec2(0.29, -0.41) + cos(a4) * 0.12 * vec2(0.61, 0.53);
  HP float dist = length(vRel);
  float detail = 1.0 - smoothstep(20.0, 72.0, dist);   // calm far water: no sparkle aliasing
  g *= detail;

  // animated texture pixel (whole-pixel scrolling, like the classic animated water)
  HP vec2 tp = mod(cell + vec2(floor(t * 1.5), floor(t * 2.5)), 16.0);
  // (bias: the quantised uv has huge derivatives at pixel edges, keep the full-size level)
  float tx = mix(0.75, texture2D(uAtlas, (uWaterTile + tp + 0.5) / uAtlasSize, -16.0).r, detail);

  vec3 V = -vRel / max(dist, 0.0001);
  vec3 tang = vec3(abs(vNormal.z), 0.0, abs(vNormal.x));
  vec3 N;
#ifdef FANCY
  // smooth wind ripples: five directional waves in world space, calmer in the distance
  HP vec2 p = vFace;
  HP float ph;
  vec2 gs = vec2(0.0);
  ph = dot(p, vec2(0.80, 0.60)) * 1.3 + t * 1.6;    gs += cos(ph) * 0.078 * vec2(0.80, 0.60);
  ph = dot(p, vec2(-0.45, 0.89)) * 2.1 + t * 2.1;   gs += cos(ph) * 0.074 * vec2(-0.45, 0.89);
  ph = dot(p, vec2(0.20, -0.98)) * 3.7 + t * 2.9;   gs += cos(ph) * 0.066 * vec2(0.20, -0.98);
  ph = dot(p, vec2(-0.93, -0.37)) * 5.3 + t * 3.7;  gs += cos(ph) * 0.053 * vec2(-0.93, -0.37);
  ph = dot(p, vec2(0.62, -0.78)) * 8.9 + t * 5.1;   gs += cos(ph) * 0.040 * vec2(0.62, -0.78);
  float far = smoothstep(16.0, 110.0, dist);
  gs = gs * mix(1.0, 0.3, far) + g * 0.35;
  if (isTop > 0.5) N = normalize(vec3(-gs.x, 1.0, -gs.y)) * sign(vNormal.y);
  else N = normalize(vNormal + tang * g.x * 0.6);
#else
  if (isTop > 0.5) {
    N = normalize(vec3(-g.x * 1.4, 1.0, -g.y * 1.4)) * sign(vNormal.y);
  } else {
    N = normalize(vNormal + tang * g.x * 0.6);
  }
#endif
  if (!gl_FrontFacing) N = -N;
  float cosT = clamp(dot(N, V), 0.0, 1.0);
  float ic = 1.0 - cosT;
  float ic2 = ic * ic;
  float fres = 0.02 + 0.98 * ic2 * ic2 * ic;

#ifdef USE_SHADOWS
  float lit = sunLit();
  vec3 light = vColor * shadowedLight(lit);
#else
  float lit = 1.0;
  vec3 light = vColor;
#endif

  HP vec3 R = reflect(-V, N);
#ifdef FANCY
  // ---- reflective water: sky (or the planar reflection), fresnel, a bright glint path
  vec3 refl = skyColor(normalize(vec3(R.x, abs(R.y) + 0.015, R.z))) * mix(0.25, 1.0, vSkyVis);
#ifdef PLANAR
  float pw = uPlanarOn * isTop * step(0.0, vNormal.y) * (1.0 - smoothstep(0.1, 0.4, abs(vWorldY - uPlanarY)));
  if (pw > 0.001 && gl_FrontFacing) {
    HP vec2 suv = gl_FragCoord.xy * uScreenInv;
    vec2 dn = (viewMatrix * vec4(N.x, 0.0, N.z, 0.0)).xy;
    suv += dn * (0.045 / (1.0 + dist * 0.04));
    suv.y = 1.0 - suv.y;             // the mirror camera image is upside down
    vec3 pr = texture2D(uReflection, clamp(suv, vec2(0.002), vec2(0.998))).rgb;
    refl = mix(refl, pr, pw);
  }
#endif
  float shallow = 1.0 - exp(-1.7 / max(cosT, 0.05));
  float a0 = mix(0.5, 0.88, shallow);
  vec3 body = vTintW * light * (0.36 + 0.3 * tx + 0.05 * h * detail);
  float fr = mix(fres, 1.0, 0.04);
  HP float sd = max(dot(R, uLightDir), 0.0);
  float sp = pow(sd, 1600.0) * 6.0 + pow(sd, 180.0) * 1.1 + pow(sd, 20.0) * 0.07;
  vec3 spec = uSunColor * sp * vSkyVis * lit;
#ifdef ULTRA
  spec *= uGlintBoost;
#endif
  vec3 prem = refl * fr + body * a0 * (1.0 - fr) + spec;
  float alpha = clamp(fr + a0 * (1.0 - fr) + dot(spec, vec3(0.333)), 0.0, 1.0);
  vec3 col = prem / max(alpha, 0.001);
#else
  // ---- simple water (Off pack)
  vec3 refl = skyColor(normalize(vec3(R.x, abs(R.y) + 0.02, R.z))) * vSkyVis;
  vec3 body = vTintW * light * (0.5 + 0.55 * tx + 0.07 * h * detail);
  // deeper-looking water at grazing angles (longer path through the water)
  float absorb = 1.0 - exp(-2.2 / max(cosT, 0.06));
  float alpha = mix(0.48, 0.9, absorb);
  vec3 col = mix(body, refl, fres * 0.8);
  alpha = max(alpha, fres * 0.95);

  // sun glints: tight pixel sparkles plus a soft sheen, suppressed in shade and caves
  float sd = max(dot(R, uSunDir), 0.0);
  float sd2 = sd * sd; float sd4 = sd2 * sd2; float sd8 = sd4 * sd4; float sd16 = sd8 * sd8;
  float sd64 = sd16 * sd16; sd64 *= sd64;
  float spark = sd64 * sd64 * sd16 * (0.6 + 0.4 * h) * detail;   // ~ pow(sd, 144)
  vec3 spec = uSunColor * (spark * 1.1 + sd16 * 0.08) * vSkyVis * lit;
  col += spec;
  alpha = min(1.0, alpha + dot(spec, vec3(0.333)));
#endif

  if (!gl_FrontFacing && uUnderwater > 0.5) {
    // looking up from below: Snell's window to the sky, total internal reflection outside it
    float win = smoothstep(0.6, 0.76, cosT) * vSkyVis;
    col = mix(uFogColor * 1.15, mix(uSkyTop, uSkyHorizon, 0.4) * 0.9 + body * 0.25, win);
    alpha = mix(0.92, 0.55, win);
  }
  col = mix(col, vFog.rgb, vFog.a);
  alpha = mix(alpha, 1.0, vFog.a);
  gl_FragColor = vec4(col, alpha);
}
`,D1=`
${Nf}
uniform HP float uAtlasSize;
uniform HP float uTime;
uniform vec2 uLavaTile;
varying HP vec2 vFace;
varying HP vec3 vRel;
varying vec3 vNormal;
void main() {
#ifdef CLIP_PLANE
  if (vWorldY < uClipY) discard;
#endif
  HP float t = uTime;
  float side = 1.0 - step(0.5, abs(vNormal.y));
  HP vec2 cell = floor(vFace * 16.0);
  cell.y += side * floor(t * 4.0);              // flowing lava creeps down the sides
  HP vec2 w = cell * 0.19;
  float n1 = sin(w.x + t * 0.55 + 1.7 * sin(w.y * 0.83 + t * 0.31));
  float n2 = sin(w.y * 1.13 - t * 0.47 + 1.9 * sin(w.x * 0.71 - t * 0.37));
  float heat = 0.5 + 0.25 * (n1 + n2);
  // churn: texture pixels displaced by whole pixels along a slowly turning field
  HP vec2 tp = mod(cell + floor(vec2(n2, n1) * 1.6 + 0.5) + vec2(floor(t * 0.7), floor(t * 0.45)), 16.0);
  vec3 tex = texture2D(uAtlas, (uLavaTile + tp + 0.5) / uAtlasSize, -16.0).rgb;
  float h2 = heat * heat; float h4 = h2 * h2;
  vec3 c = tex * (0.78 + 0.5 * heat) + vec3(0.42, 0.16, 0.0) * h4 * h2;
  // far away: the plain (mipmapped) tile, so distant lava lakes do not shimmer
  float far = smoothstep(28.0, 72.0, length(vRel));
  c = mix(c, texture2D(uAtlas, vUv).rgb * 1.05, far);
  c *= vColor;
#ifdef ULTRA
  c *= 1.15 + 1.6 * h4;                          // HDR: the hot crust glows through the bloom
#endif
  gl_FragColor = vec4(mix(c, vFog.rgb, vFog.a), 1.0);
}
`,N1=`
uniform sampler2D uAtlas;
varying HP vec2 vUv;
${JE}
void main() {
#ifdef LAYER_CUTOUT
  if (texture2D(uAtlas, vUv).a < 0.5) discard;
#endif
  gl_FragColor = packDepth(gl_FragCoord.z);
}
`;function eT(){let i=new Float32Array(Ai),t=new Uint8Array(Ai);for(let s=1;s<xt;s++)for(let r=0;r<6;r++){let o=Ut[s*6+r];o>=Ai||(ao[s]>0?i[o]=Math.max(i[o],Math.min(1,ao[s]/15+.1)):t[o]=1)}let e=new Uint8Array(vs*vs*4);for(let s=0;s<Ai;s++){let r=t[s]?0:Math.round(i[s]*255);e[s*4]=r,e[s*4+1]=r,e[s*4+2]=r,e[s*4+3]=255}let n=new qo(e,vs,vs,Fe,sn);return n.name="emissive-mask",n.magFilter=ue,n.minFilter=ue,n.wrapS=ge,n.wrapT=ge,n.flipY=!1,n.generateMipmaps=!1,n.needsUpdate=!0,n}function nT(i){let[t,e]=js(Mu.water_still),[n,s]=js(Mu.lava_still);return{uTime:{value:0},uAtlas:{value:i.texture},uAtlasSize:{value:In},uSunDir:{value:new V(0,1,0)},uLightDir:{value:new V(0,1,0)},uDaylight:{value:1},uFogColor:{value:new Pt(.75,.85,1)},uFogNear:{value:40},uFogFar:{value:64},uSkyTop:{value:new Pt(.47,.65,1)},uSkyHorizon:{value:new Pt(.75,.85,1)},uGlowColor:{value:new Pt(1,.5,.2)},uGlowDir:{value:new V(1,0,0)},uGlow:{value:0},uBrightness:{value:.5},uBlockLightColor:{value:new Pt(1,1,1)},uSkyLightColor:{value:new Pt(1,1,1)},uAmbientLight:{value:new Pt(.4,.42,.47)},uDirectLight:{value:new Pt(.6,.58,.53)},uSunColor:{value:new Pt(1,.95,.8)},uWaving:{value:0},uUnderwater:{value:0},uCamWrap:{value:new V},uShadowMap:{value:null},uShadowMatrix:{value:new de},uShadowTexel:{value:1/2048},uShadowStrength:{value:0},uShadowBias:{value:2e-4},uShadowNormalOffset:{value:.1},uShadowFade:{value:new Bt(48,60)},uWaterTile:{value:new Bt(t,e)},uLavaTile:{value:new Bt(n,s)},uEmissive:{value:null},uEmissiveBoost:{value:1.7},uGlintBoost:{value:3.5},uClipY:{value:Zo},uReflection:{value:null},uScreenInv:{value:new Bt(1/1280,1/720)},uPlanarY:{value:Zo},uPlanarOn:{value:0}}}function Ei(i,t,e,n,s={}){let r=new we({name:i,uniforms:n,vertexShader:KE+jE,fragmentShader:ZE+e,defines:{[t]:1,...s}});return r.side=yn,r.fog=!1,r.lights=!1,r}function Za(i,t,e){let n=t in i.defines;e!==n&&(e?i.defines[t]=1:delete i.defines[t],i.needsUpdate=!0)}function B1(i){let t=nT(i),e=eT();t.uEmissive.value=e;let n=Ei("terrain-opaque","LAYER_OPAQUE",Ko,t),s=Ei("terrain-cutout","LAYER_CUTOUT",Ko,t),r=Ei("terrain-translucent","LAYER_TRANSLUCENT",Ko,t);r.transparent=!0,r.depthWrite=!1,r.blending=gs;let o=Ei("terrain-water","LAYER_WATER",tT,t);o.transparent=!0,o.depthWrite=!0,o.side=nn,o.blending=gs;let a=Ei("terrain-lava","LAYER_LAVA",D1,t),l=Ei("depth-opaque","LAYER_OPAQUE",N1,t,{DEPTH:1}),c=Ei("depth-cutout","LAYER_CUTOUT",N1,t,{DEPTH:1});l.side=nn,c.side=nn;let h=Ei("refl-opaque","LAYER_OPAQUE",Ko,t,{CLIP_PLANE:1}),u=Ei("refl-cutout","LAYER_CUTOUT",Ko,t,{CLIP_PLANE:1}),f=Ei("refl-lava","LAYER_LAVA",D1,t,{CLIP_PLANE:1}),d=[n,s,r,o,a],g=[h,u,f],b=[...d,l,c,...g],p=[n,s,r,o,h,u],m={shadows:!1,waving:!1,fancy:!1,ultra:!1,planar:!1},v=()=>{for(let y of p)Za(y,"USE_SHADOWS",m.shadows);for(let y of b)Za(y,"WAVING",m.waving);for(let y of[...d,...g])Za(y,"FANCY",m.fancy),Za(y,"ULTRA",m.ultra);Za(o,"PLANAR",m.planar),t.uWaving.value=m.waving?1:0,t.uPlanarOn.value=m.planar?1:0,m.shadows||(t.uShadowStrength.value=0)};return{opaque:n,cutout:s,translucent:r,water:o,lava:a,uniforms:t,byLayer:[n,s,r,o,a],depth:{opaque:l,cutout:c},refl:{opaque:h,cutout:u,lava:f},setShadows(y){m.shadows=y,v()},setWaving(y){m.waving=y,v()},setPack(y){Object.assign(m,y),v()},releaseReflection(){for(let y of g)y.dispose()},dispose(){for(let y of b)y.dispose();e.dispose()}}}function F1(i){let t={value:new Bt(1,0)},e={...i,uHandLight:t},n=(h,u,f={})=>Ei(h,u,Ko,e,{HAND:1,...f}),s=n("hand-opaque","LAYER_OPAQUE"),r=n("hand-cutout","LAYER_CUTOUT");r.side=nn;let o=n("hand-translucent","LAYER_TRANSLUCENT");o.transparent=!0,o.depthWrite=!1;let a=n("hand-water","LAYER_TRANSLUCENT");a.transparent=!0,a.depthWrite=!1;let l=n("hand-lava","LAYER_CUTOUT",{FULLBRIGHT:1}),c=[s,r,o,a,l];return{byLayer:c,light:t,dispose(){for(let h of c)h.dispose()}}}var iT=new Xi(new V(2048,2048,2048),3547);function lh(i,t=iT){let e=new Ee;return e.setAttribute("position",new Ht(i.positions,3)),e.setAttribute("auv",new Ht(i.uvs,2)),e.setAttribute("atint",new Ht(i.tints,4,!0)),e.setAttribute("alight",new Ht(i.lights,4,!0)),e.setIndex(new Ht(i.indices,1)),e.setDrawRange(0,i.indexCount),t?e.boundingSphere=t.clone():e.computeBoundingSphere(),e}var sT=`
varying vec2 vUv;
void main() { vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }
`,rT=`
uniform sampler2D tColor;
uniform vec2 uTexel;
uniform float uThreshold;
varying vec2 vUv;
void main() {
  vec3 c = texture2D(tColor, vUv + vec2(-uTexel.x, -uTexel.y)).rgb + texture2D(tColor, vUv + vec2(uTexel.x, -uTexel.y)).rgb
         + texture2D(tColor, vUv + vec2(-uTexel.x, uTexel.y)).rgb + texture2D(tColor, vUv + vec2(uTexel.x, uTexel.y)).rgb;
  c *= 0.25;
  float l = max(c.r, max(c.g, c.b));
  float k = clamp((l - uThreshold) / max(l, 0.0001), 0.0, 1.0);
  k = k * k * (3.0 - 2.0 * k);
  gl_FragColor = vec4(c * k, 1.0);
}
`,oT=`
uniform sampler2D tColor;
uniform vec2 uDir;
varying vec2 vUv;
void main() {
  vec3 c = texture2D(tColor, vUv).rgb * 0.2270270270;
  c += texture2D(tColor, vUv + uDir * 1.3846153846).rgb * 0.3162162162;
  c += texture2D(tColor, vUv - uDir * 1.3846153846).rgb * 0.3162162162;
  c += texture2D(tColor, vUv + uDir * 3.2307692308).rgb * 0.0702702703;
  c += texture2D(tColor, vUv - uDir * 3.2307692308).rgb * 0.0702702703;
  gl_FragColor = vec4(c, 1.0);
}
`,aT=`
uniform sampler2D tColor;
uniform sampler2D tDepth;
uniform vec2 uLight;
uniform float uUseDepth;
uniform float uAspect;
varying vec2 vUv;
float sky(vec2 uv) {
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return 0.0;
  float open;
  if (uUseDepth > 0.5) open = step(0.99995, texture2D(tDepth, uv).r);
  else { vec3 c = texture2D(tColor, uv).rgb; open = smoothstep(0.75, 1.0, max(c.r, max(c.g, c.b))); }
  vec2 d = (uv - uLight) * vec2(uAspect, 1.0);
  return open * exp(-dot(d, d) * 9.0);
}
void main() {
  vec2 delta = (vUv - uLight) / 28.0;
  vec2 uv = vUv;
  float sum = 0.0, w = 1.0;
  for (int i = 0; i < 28; i++) {
    sum += sky(uv) * w;
    w *= 0.955;
    uv -= delta;
  }
  gl_FragColor = vec4(vec3(sum / 12.0), 1.0);
}
`,lT=`
uniform sampler2D tColor;
uniform sampler2D tBloom;
uniform sampler2D tBloom2;
uniform sampler2D tRays;
uniform sampler2D tDepth;
uniform float uUseDepth;
uniform float uBloom;
uniform vec3 uRayColor;
uniform float uRayStrength;
uniform vec3 uFogColor;
uniform vec3 uSunColor;
uniform vec3 uLightDir;
uniform float uFogDensity;
uniform float uFogFar;
uniform vec3 uCamPos;
uniform mat4 uInvProj;
uniform mat4 uInvView;
uniform float uUnderwater;
varying vec2 vUv;
vec3 rolloff(vec3 c) {
  // hue-preserving shoulder from 0.9 towards 1 (so a bright blue sky stays blue), and only
  // real HDR light (torch flames, lava, glints) above 1 burns slightly towards white
  float m = max(c.r, max(c.g, c.b));
  if (m <= 0.9) return c;
  float f = 0.9 + 0.1 * (1.0 - exp(-(m - 0.9) * 10.0));
  return c * (f / m) + vec3(1.0 - exp(-max(m - 1.0, 0.0) * 0.6)) * 0.35;
}
void main() {
  vec3 col = texture2D(tColor, vUv).rgb;
  if (uUseDepth > 0.5 && uUnderwater < 0.5) {
    float d = texture2D(tDepth, vUv).r;
    if (d < 0.99995) {
      vec4 vp = uInvProj * vec4(vUv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0);
      vp /= vp.w;
      vec3 wp = (uInvView * vec4(vp.xyz, 1.0)).xyz;
      vec3 ray = wp - uCamPos;
      float dist = length(ray);
      vec3 dir = ray / max(dist, 0.0001);
      // thicker in valleys and near water level, thinner on mountain tops
      float h = clamp(exp(-(wp.y - 58.0) * 0.045), 0.25, 2.5);
      float f = (1.0 - exp(-dist * uFogDensity * h)) * (1.0 - smoothstep(uFogFar * 0.85, uFogFar, dist) * 0.6);
      float sunward = pow(max(dot(dir, uLightDir), 0.0), 6.0);
      vec3 fogc = mix(uFogColor, uSunColor * 1.15, sunward * 0.55);
      col = mix(col, fogc, clamp(f, 0.0, 0.85));
    }
  }
  vec3 bloom = texture2D(tBloom, vUv).rgb * 0.6 + texture2D(tBloom2, vUv).rgb * 0.9;
  col += bloom * uBloom;
  col += texture2D(tRays, vUv).r * uRayColor * uRayStrength;
  col = rolloff(col);
  // a touch more saturation and contrast
  float l = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(l), col, 1.1);
  col = (col - 0.5) * 1.04 + 0.5;
  vec2 q = vUv - 0.5;
  col *= 1.0 - dot(q, q) * 0.2;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`,cT=`
uniform sampler2D tColor;
varying vec2 vUv;
void main() { gl_FragColor = vec4(texture2D(tColor, vUv).rgb, 1.0); }
`;function Ja(i,t,e,n=!0){return new Ln(Math.max(1,i),Math.max(1,t),{format:Fe,type:e,minFilter:n?De:ue,magFilter:n?De:ue,wrapS:ge,wrapT:ge,depthBuffer:!1,stencilBuffer:!1,generateMipmaps:!1})}function ja(i,t){return new we({vertexShader:sT,fragmentShader:i,uniforms:t,depthTest:!1,depthWrite:!1,blending:li})}var ch=class{constructor(t){this.fsScene=new Js;this.fsCam=new Br(-1,1,1,-1,0,1);this.w=1;this.h=1;this.tmp=new V;this.invProj=new de;this.invView=new de;this.gl=t;let e=t.extensions;this.hdr=t.capabilities.isWebGL2?e.has("EXT_color_buffer_float")||e.has("EXT_color_buffer_half_float"):e.has("OES_texture_half_float")&&e.has("OES_texture_half_float_linear")&&e.has("EXT_color_buffer_half_float"),this.depth=t.capabilities.isWebGL2||e.has("WEBGL_depth_texture");let n=this.hdr?Ur:sn;if(this.scene=new Ln(1,1,{format:Fe,type:n,minFilter:De,magFilter:De,wrapS:ge,wrapT:ge,depthBuffer:!0,stencilBuffer:!1,generateMipmaps:!1}),this.depth){let r=new $o(1,1);r.type=t.capabilities.isWebGL2?qi:Xa,r.minFilter=ue,r.magFilter=ue,this.scene.depthTexture=r}this.half=Ja(1,1,n),this.halfB=Ja(1,1,n),this.quarter=Ja(1,1,n),this.quarterB=Ja(1,1,n),this.rays=Ja(1,1,sn);let s=new Ee;s.setAttribute("position",new Ht(new Float32Array([-1,-1,0,3,-1,0,-1,3,0]),3)),this.mBright=ja(rT,{tColor:{value:null},uTexel:{value:new Bt},uThreshold:{value:this.hdr?.85:.78}}),this.mBlur=ja(oT,{tColor:{value:null},uDir:{value:new Bt}}),this.mRays=ja(aT,{tColor:{value:null},tDepth:{value:null},uLight:{value:new Bt},uUseDepth:{value:this.depth?1:0},uAspect:{value:1}}),this.mComp=ja(lT,{tColor:{value:null},tBloom:{value:null},tBloom2:{value:null},tRays:{value:null},tDepth:{value:null},uUseDepth:{value:this.depth?1:0},uBloom:{value:.9},uRayColor:{value:new Pt},uRayStrength:{value:0},uFogColor:{value:new Pt},uSunColor:{value:new Pt},uLightDir:{value:new V(0,1,0)},uFogDensity:{value:.004},uFogFar:{value:64},uCamPos:{value:new V},uInvProj:{value:new de},uInvView:{value:new de},uUnderwater:{value:0}}),this.mCopy=ja(cT,{tColor:{value:null}}),this.quad=new be(s,this.mCopy),this.quad.frustumCulled=!1,this.fsScene.add(this.quad)}setSize(t,e){if(t===this.w&&e===this.h)return;this.w=t,this.h=e,this.scene.setSize(t,e),this.scene.depthTexture&&(this.scene.depthTexture.image.width=t,this.scene.depthTexture.image.height=e);let n=Math.max(1,t>>1),s=Math.max(1,e>>1),r=Math.max(1,t>>2),o=Math.max(1,e>>2);this.half.setSize(n,s),this.halfB.setSize(n,s),this.quarter.setSize(r,o),this.quarterB.setSize(r,o),this.rays.setSize(r,o)}get target(){return this.scene}draw(t,e){this.quad.material=t,this.gl.setRenderTarget(e),this.gl.render(this.fsScene,this.fsCam)}finish(t){var h;let e=this.scene.texture,n=(h=this.scene.depthTexture)!=null?h:null;this.mBright.uniforms.tColor.value=e,this.mBright.uniforms.uTexel.value.set(.5/this.w,.5/this.h),this.draw(this.mBright,this.half);let s=(u,f,d,g,b)=>{this.mBlur.uniforms.tColor.value=u.texture,this.mBlur.uniforms.uDir.value.set(1/g,0),this.draw(this.mBlur,f),this.mBlur.uniforms.tColor.value=f.texture,this.mBlur.uniforms.uDir.value.set(0,1/b),this.draw(this.mBlur,d)};s(this.half,this.halfB,this.half,this.half.width,this.half.height),this.mCopy.uniforms.tColor.value=this.half.texture,this.draw(this.mCopy,this.quarter),s(this.quarter,this.quarterB,this.quarter,this.quarter.width,this.quarter.height),s(this.quarter,this.quarterB,this.quarter,this.quarter.width,this.quarter.height);let r=t.camera,o=this.tmp.copy(r.position).addScaledVector(t.lightDir,1e3).project(r),a=this.tmp.set(0,0,-1).applyQuaternion(r.quaternion).dot(t.lightDir),l=0;if(a>0&&!t.underwater&&t.lightStrength>.01){let u=o.x*.5+.5,f=o.y*.5+.5,d=Math.max(0,Math.max(Math.abs(u-.5),Math.abs(f-.5))-.5);if(l=t.lightStrength*Math.min(1,a*1.6)*Math.max(0,1-d*2.5),l>.01){let g=this.mRays.uniforms;g.tColor.value=e,g.tDepth.value=n,g.uLight.value.set(u,f),g.uAspect.value=this.w/Math.max(1,this.h),this.draw(this.mRays,this.rays)}}let c=this.mComp.uniforms;c.tColor.value=e,c.tBloom.value=this.half.texture,c.tBloom2.value=this.quarter.texture,c.tRays.value=this.rays.texture,c.tDepth.value=n,c.uRayColor.value.copy(t.rayColor),c.uRayStrength.value=l*.45,c.uFogColor.value.copy(t.fogColor),c.uSunColor.value.copy(t.sunColor),c.uLightDir.value.copy(t.lightDir),c.uFogDensity.value=.0022+t.dawnDusk*.005,c.uFogFar.value=t.fogFar,c.uCamPos.value.copy(r.position),this.invProj.copy(r.projectionMatrixInverse),this.invView.copy(r.matrixWorld),c.uInvProj.value.copy(this.invProj),c.uInvView.value.copy(this.invView),c.uUnderwater.value=t.underwater?1:0,this.draw(this.mComp,null)}dispose(){var t;for(let e of[this.scene,this.half,this.halfB,this.quarter,this.quarterB,this.rays])e.dispose();(t=this.scene.depthTexture)==null||t.dispose();for(let e of[this.mBright,this.mBlur,this.mRays,this.mComp,this.mCopy])e.dispose();this.quad.geometry.dispose()}};var dh=`
#ifdef GL_FRAGMENT_PRECISION_HIGH
#define HP highp
#else
#define HP mediump
#endif
`,hT=192,uT=4,Gr=12,Bf=128,dT=.6,hh=.38,Qs=45,fT=`
varying vec3 vDir;
void main() {
  vDir = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,pT=`
${dh}
${zr}
uniform vec3 uSunDir;
uniform vec3 uHaze;
varying vec3 vDir;
${Hr}
void main() {
  vec3 d = normalize(vDir);
  vec3 c = skyColor(d);
  float s = max(dot(d, uSunDir), 0.0);
  float s2 = s * s; float s4 = s2 * s2; float s8 = s4 * s4;
  c += uHaze * (s8 * 0.6 + s8 * s8 * s8 * 0.8);
  // 1/255 dither: no banding in the dusk gradient
  float n = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  gl_FragColor = vec4(c + (n - 0.5) / 255.0, 1.0);
}
`,O1=`
varying vec2 vUv;
void main() {
  vUv = uv * 2.0 - 1.0;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,mT=`
${dh}
uniform vec3 uTint;
uniform float uAlpha;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
void main() {
  vec2 a = abs(vUv);
  float m = max(a.x, a.y);
  vec2 px = floor((vUv * 0.5 + 0.5) * 32.0);
  float pm = max(abs(px.x - 15.5), abs(px.y - 15.5));  // square distance in pixels (0.5 .. 15.5)
  vec3 col = vec3(0.0);
  if (pm < 5.0) {
    col = vec3(1.0, 0.99, 0.9) - hash(px) * vec3(0.0, 0.03, 0.08);
  } else if (pm < 7.0) {
    col = vec3(1.0, 0.86, 0.42) + (hash(px) - 0.5) * vec3(0.0, 0.06, 0.1);
  } else {
    // stepped halo, one ring per two pixels, fading out
    float ring = floor((pm - 7.0) / 2.0);
    col = uTint * 0.42 * pow(0.62, ring) * (1.0 - smoothstep(0.75, 1.0, m));
  }
  gl_FragColor = vec4(col * uAlpha, 1.0);
}
`,gT=`
${dh}
uniform float uAlpha;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  vec2 px = floor((vUv * 0.5 + 0.5) * 24.0);
  float pm = max(abs(px.x - 11.5), abs(px.y - 11.5));
  vec3 col = vec3(0.0);
  if (pm < 6.0) {
    vec2 q = px - 6.0;
    float mare = step(0.72, hash(floor(q / 2.0) + 3.0));
    float spot = step(0.86, hash(q + 17.0));
    col = vec3(0.86, 0.89, 0.96) * (1.0 - 0.28 * mare - 0.16 * spot);
    if (pm >= 5.0) col *= 0.9;
  } else if (pm < 9.0) {
    col = vec3(0.16, 0.19, 0.3) * (9.0 - pm) / 3.0;
  }
  gl_FragColor = vec4(col * uAlpha, 1.0);
}
`,bT=`
attribute float aSize;
attribute float aPhase;
uniform float uAlpha;
uniform float uTime;
uniform float uPixelRatio;
varying float vB;
void main() {
  vec3 dir = normalize(position);
  vec3 wd = normalize(mat3(modelMatrix) * position);
  // hidden behind the moon (which sits at local -X) and faded near the horizon
  float behindMoon = step(dir.x, -0.992);
  float tw = 0.78 + 0.22 * sin(uTime * (1.3 + aPhase) + aPhase * 40.0);
  vB = uAlpha * tw * smoothstep(-0.02, 0.22, wd.y) * (1.0 - behindMoon) * (0.55 + 0.45 * fract(aPhase * 7.31));
  gl_PointSize = aSize * uPixelRatio;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  if (vB <= 0.003) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
}
`,yT=`
${dh}
varying float vB;
void main() { gl_FragColor = vec4(vec3(0.92, 0.94, 1.0) * vB, 1.0); }
`,vT=`
#define HP highp
attribute float aShade;
${zr}
uniform vec3 uFogColor;
uniform float uCloudFar;
uniform vec3 uCloudColor;
varying vec4 vC;
${Hr}
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vec3 rel = mv.xyz * mat3(viewMatrix);
  float dist = length(rel.xz);
  float fog = smoothstep(uCloudFar * 0.45, uCloudFar, dist);
  vec3 sky = skyColor(rel / max(length(rel), 0.001));
  // a hint of the sky shows through (the clouds read as slightly translucent)
  vec3 c = mix(uCloudColor * aShade, sky, 0.12);
  vC = vec4(mix(c, sky, fog), 1.0);
  gl_Position = projectionMatrix * mv;
}
`,_T=`
precision mediump float;
varying vec4 vC;
void main() { gl_FragColor = vC; }
`;function z1(i){let t=new Ee,e=new Float32Array([Qs,-i,-i,Qs,-i,i,Qs,i,i,Qs,i,-i]),n=new Float32Array([0,0,1,0,1,1,0,1]);return t.setAttribute("position",new Ht(e,3)),t.setAttribute("uv",new Ht(n,2)),t.setIndex([0,1,2,0,2,3]),t}function xT(i){let t=new Ee,e=new Float32Array([-i,-i,-i,i,-i,-i,i,i,-i,-i,i,-i,-i,-i,i,i,-i,i,i,i,i,-i,i,i]);return t.setAttribute("position",new Ht(e,3)),t.setIndex([0,1,2,0,2,3,5,4,7,5,7,6,4,0,3,4,3,7,1,5,6,1,6,2,3,2,6,3,6,7,4,5,1,4,1,0]),t}function wT(i=1337){let t=Bf,e=i>>>0,n=()=>{e=e+1831565813>>>0;let a=e;return a=Math.imul(a^a>>>15,a|1),a^=a+Math.imul(a^a>>>7,a|61),((a^a>>>14)>>>0)/4294967296},s=new Float32Array(t*t);for(let[a,l]of[[8,.55],[16,.3],[32,.15]]){let c=new Float32Array(a*a);for(let u=0;u<c.length;u++)c[u]=n();let h=t/a;for(let u=0;u<t;u++)for(let f=0;f<t;f++){let d=f/h,g=u/h,b=Math.floor(d),p=Math.floor(g),m=d-b,v=g-p,y=m*m*(3-2*m),_=v*v*(3-2*v),w=b%a,S=(b+1)%a,A=p%a,R=(p+1)%a,P=c[A*a+w]+(c[A*a+S]-c[A*a+w])*y,x=c[R*a+w]+(c[R*a+S]-c[R*a+w])*y;s[u*t+f]+=(P+(x-P)*_)*l}}let r=new Uint8Array(t*t);for(let a=0;a<t*t;a++)r[a]=s[a]>.56?1:0;let o=r.slice();for(let a=0;a<t;a++)for(let l=0;l<t;l++){let c=a*t+l;if(!r[c])continue;r[a*t+(l+1)%t]+r[a*t+(l+t-1)%t]+r[(a+1)%t*t+l]+r[(a+t-1)%t*t+l]===0&&(o[c]=0)}return o}var Qa=(i,t,e)=>{let n=Math.min(1,Math.max(0,(e-i)/(t-i)));return n*n*(3-2*n)},ye=(i,t,e)=>i+(t-i)*e,uh=class{constructor(t,e){this.group=new Pn;this.celestial=new Pn;this.cloudMap=wT();this.cloudKey="";this.cloudRadius=192;this.cloudsOn=!0;this.hidden=!1;this.fog=new Pt;this.axis=new V(0,-Math.sin(hh),Math.cos(hh));this.u=e,this.group.name="sky",t.add(this.group),this.hazeU={value:new Pt(0,0,0)};let n=new we({name:"sky-dome",uniforms:{...e,uHaze:this.hazeU},vertexShader:fT,fragmentShader:pT,side:nn,depthTest:!1,depthWrite:!1,blending:li});this.dome=new be(xT(Qs+5),n),this.dome.renderOrder=-100,this.dome.frustumCulled=!1,this.group.add(this.dome),this.sunU={uTint:{value:new Pt(1,.8,.4)},uAlpha:{value:1}},this.sun=new be(z1(9),new we({name:"sky-sun",uniforms:this.sunU,vertexShader:O1,fragmentShader:mT,side:yn,depthTest:!1,depthWrite:!1,blending:Oo})),this.moonU={uAlpha:{value:1}},this.moon=new be(z1(5.2),new we({name:"sky-moon",uniforms:this.moonU,vertexShader:O1,fragmentShader:gT,side:yn,depthTest:!1,depthWrite:!1,blending:Oo})),this.moon.rotation.y=Math.PI,this.starU={uAlpha:{value:0},uTime:{value:0},uPixelRatio:{value:1}},this.stars=new sh(this.buildStars(),new we({name:"sky-stars",uniforms:this.starU,vertexShader:bT,fragmentShader:yT,depthTest:!1,depthWrite:!1,blending:Oo}));for(let s of[this.sun,this.moon,this.stars])s.frustumCulled=!1,this.celestial.add(s);this.stars.renderOrder=-99,this.moon.renderOrder=-98,this.sun.renderOrder=-97,this.group.add(this.celestial),this.cloudU={uCloudFar:{value:192},uCloudColor:{value:new Pt(1,1,1)}},this.cloudMat=new we({name:"sky-clouds",uniforms:{...e,...this.cloudU},vertexShader:vT,fragmentShader:_T,side:yn}),this.clouds=new be(new Ee,this.cloudMat),this.clouds.frustumCulled=!1,this.clouds.renderOrder=10,t.add(this.clouds)}setClouds(t,e=this.cloudRadius){this.cloudsOn=t;let n=Math.max(96,Math.min(384,e));n!==this.cloudRadius&&(this.cloudRadius=n,this.cloudKey=""),this.clouds.visible=t&&!this.hidden}setHidden(t){this.hidden=t,this.celestial.visible=!t,this.clouds.visible=this.cloudsOn&&!t}setPixelRatio(t){this.starU.uPixelRatio.value=t}get objects(){return[this.group,this.clouds]}update(t,e,n){let s=this.u,r=t*Math.PI*2,o=Math.sin(r),a=s.uSunDir.value;a.set(Math.cos(r),Math.sin(r)*Math.cos(hh),Math.sin(r)*Math.sin(hh)).normalize();let l=Qa(-.22,.28,o),c=Math.min(1,Math.max(0,o/.4*.5+.5)),h=Math.abs(o)<.4?Math.pow(Math.sin(c*Math.PI),2):0,u=c*.3+.7,f=c*c*.62+.22,d=.2;s.uSkyTop.value.setRGB(ye(.012,.45,l),ye(.018,.64,l),ye(.05,1,l));let b=s.uSkyHorizon.value;b.setRGB(ye(.035,.74,l),ye(.045,.84,l),ye(.09,1,l)),b.setRGB(ye(b.r,u*.95,h*.25),ye(b.g,f*.9,h*.25),ye(b.b,.42,h*.25)),s.uGlowColor.value.setRGB(u,f,d),s.uGlow.value=h*.85,s.uGlowDir.value.set(a.x>=0?1:-1,0,0),this.fog.copy(b),s.uFogColor.value.copy(b),this.hazeU.value.setRGB(1,.92,.75).multiplyScalar(.18*Qa(-.1,.2,a.y)*(.5+.5*l)),s.uDaylight.value=l;let m=ye(.2,1,l),v=1-l;s.uSkyLightColor.value.setRGB(m*ye(1,.6,v)*ye(1,1,h),m*ye(1,.68,v)*ye(1,.86,h*l),m*ye(1,1,v)*ye(1,.74,h*l));let _=a.y>0,w=s.uLightDir.value;_?w.copy(a):w.copy(a).multiplyScalar(-1);let S=Math.abs(a.y),A=Qa(.04,.16,S);s.uShadowStrength.value=(_?.5:.22)*A;let R=s.uSunColor.value;return _?R.setRGB(1,ye(.62,.95,c),ye(.35,.82,c)).multiplyScalar(A):R.setRGB(.45,.52,.7).multiplyScalar(A*.6),this.group.position.set(n.x,n.y,n.z),this.celestial.quaternion.setFromAxisAngle(this.axis,r),this.sunU.uAlpha.value=Qa(-.12,.02,a.y),this.sunU.uTint.value.setRGB(1,ye(.55,.85,c),ye(.25,.5,c)),this.moonU.uAlpha.value=Qa(-.12,.02,-a.y)*ye(1,.35,l),this.starU.uAlpha.value=Math.min(1,Math.max(0,(.12-o)*2.6))*.95,this.starU.uTime.value=e%3600,this.group.updateMatrixWorld(!0),this.cloudsOn&&!this.hidden&&this.updateClouds(e,n,l,h,u,f),{fog:this.fog,daylight:l}}updateClouds(t,e,n,s,r,o){let a=this.cloudU.uCloudColor.value,l=ye(.1,1,n);a.setRGB(l*ye(1,r,s*.55)*ye(1,.75,1-n),l*ye(1,o*1.05,s*.55)*ye(1,.8,1-n),l*ye(1,.72,s*.55));let c=t*dT%(Bf*Gr),h=Math.floor((e.x-c)/Gr),u=Math.floor(e.z/Gr),f=`${h},${u},${this.cloudRadius}`;f!==this.cloudKey&&(this.cloudKey=f,this.buildClouds(h,u)),this.clouds.position.set(h*Gr+c,hT,u*Gr),this.cloudU.uCloudFar.value=this.cloudRadius,this.clouds.updateMatrixWorld(!0)}buildClouds(t,e){let n=Math.ceil(this.cloudRadius/Gr)+1,s=Bf,r=this.cloudMap,o=(b,p)=>r[(p%s+s)%s*s+(b%s+s)%s],a=[],l=[],c=[],h=Gr,u=uT,f=(b,p)=>{let m=a.length/3;a.push(...b),l.push(p,p,p,p),c.push(m,m+1,m+2,m,m+2,m+3)};for(let b=-n;b<=n;b++)for(let p=-n;p<=n;p++){if(p*p+b*b>n*n)continue;let m=t+p,v=e+b;if(!o(m,v))continue;let y=p*h,_=y+h,w=b*h,S=w+h;f([y,u,w,y,u,S,_,u,S,_,u,w],1),f([y,0,w,_,0,w,_,0,S,y,0,S],.72),o(m+1,v)||f([_,0,w,_,u,w,_,u,S,_,0,S],.86),o(m-1,v)||f([y,0,w,y,0,S,y,u,S,y,u,w],.86),o(m,v+1)||f([y,0,S,_,0,S,_,u,S,y,u,S],.93),o(m,v-1)||f([y,0,w,y,u,w,_,u,w,_,0,w],.93)}let d=new Ee;d.setAttribute("position",new Ht(new Float32Array(a),3)),d.setAttribute("aShade",new Ht(new Float32Array(l),1));let g=a.length/3;d.setIndex(new Ht(g>65535?new Uint32Array(c):new Uint16Array(c),1)),this.clouds.geometry.dispose(),this.clouds.geometry=d}buildStars(){let e=new Float32Array(4200),n=new Float32Array(1400),s=new Float32Array(1400),r=90210,o=()=>(r=Math.imul(r,1103515245)+12345>>>0,r/4294967296);for(let l=0;l<1400;l++){let c=0,h=0,u=0,f=0;do c=o()*2-1,h=o()*2-1,u=o()*2-1,f=c*c+h*h+u*u;while(f>1||f<.01);f=Math.sqrt(f),e[l*3]=c/f*(Qs-1),e[l*3+1]=h/f*(Qs-1),e[l*3+2]=u/f*(Qs-1);let d=o();n[l]=d<.7?1:d<.95?2:3,s[l]=o()}let a=new Ee;return a.setAttribute("position",new Ht(e,3)),a.setAttribute("aSize",new Ht(n,1)),a.setAttribute("aPhase",new Ht(s,1)),a}dispose(){for(let t of[this.dome,this.sun,this.moon,this.clouds])t.geometry.dispose(),t.material.dispose();this.stars.geometry.dispose(),this.stars.material.dispose(),this.group.removeFromParent(),this.clouds.removeFromParent()}};var Ve=1024,MT=26,ST=16,AT=.667,ET=`
#define HP highp
attribute vec3 aCenter;
attribute vec2 aCorner;
attribute vec2 aUv;
attribute vec4 aTint;
attribute float aSize;
uniform float uAtlasSize;
uniform vec2 uParticleLight;
uniform vec3 uSkyLightColor;
uniform vec3 uBlockLightColor;
uniform float uBrightness;
uniform float uFogNear;
uniform float uFogFar;
${zr}
varying vec2 vUv;
varying vec4 vTint;
varying vec3 vColor;
varying vec4 vFog;
${Hr}
${Jo}
void main() {
  vec4 mv = modelViewMatrix * vec4(aCenter, 1.0);
  mv.xy += aCorner * aSize;
  gl_Position = projectionMatrix * mv;
  vUv = aUv / uAtlasSize;
  vTint = aTint;
  float sb = lightCurve(uParticleLight.x);
  float bb = lightCurve(uParticleLight.y);
  vec3 blk = vec3(bb, bb * ((bb * 0.6 + 0.4) * 0.6 + 0.4), bb * (bb * bb * 0.6 + 0.4)) * uBlockLightColor;
  vColor = finishLight(sb * uSkyLightColor + blk) * 0.9;
  vec3 rel = mv.xyz * mat3(viewMatrix);
  float dist = max(length(rel.xz), abs(rel.y));
  vFog = vec4(skyColor(rel / max(length(rel), 0.0001)), clamp((dist - uFogNear) / max(uFogFar - uFogNear, 0.001), 0.0, 1.0));
}
`,TT=`
#ifdef GL_FRAGMENT_PRECISION_HIGH
#define HP highp
#else
#define HP mediump
#endif
precision mediump float;
uniform sampler2D uAtlas;
varying HP vec2 vUv;
varying vec4 vTint;
varying vec3 vColor;
varying vec4 vFog;
void main() {
  vec4 t = texture2D(uAtlas, vUv, -16.0);
  float masked = step(0.5, vTint.a);
  if (masked < 0.5 && t.a < 0.5) discard;
  vec3 c = t.rgb * mix(vTint.rgb, mix(vTint.rgb, vec3(1.0), t.a), masked) * vColor;
  gl_FragColor = vec4(mix(c, vFog.rgb, vFog.a), 1.0);
}
`,fh=class{constructor(t){this.n=0;this.px=new Float64Array(Ve);this.py=new Float64Array(Ve);this.pz=new Float64Array(Ve);this.vx=new Float32Array(Ve);this.vy=new Float32Array(Ve);this.vz=new Float32Array(Ve);this.age=new Float32Array(Ve);this.life=new Float32Array(Ve);this.floorY=new Float32Array(Ve);this.size=new Float32Array(Ve);this.uv=new Float32Array(Ve*2);this.tint=new Uint8Array(Ve*4);this.aCenter=new Float32Array(Ve*12);this.aUv=new Float32Array(Ve*8);this.aTint=new Uint8Array(Ve*16);this.aSize=new Float32Array(Ve*4);this.collider=null;this.seed=12345;this.light={value:new Bt(1,0)},this.mat=new we({name:"particles",uniforms:{...t,uParticleLight:this.light},vertexShader:ET,fragmentShader:TT});let e=new Ee,n=new Float32Array(Ve*8),s=new Uint16Array(Ve*6);for(let h=0;h<Ve;h++){n.set([-1,-1,1,-1,1,1,-1,1],h*8);let u=h*4;s.set([u,u+1,u+2,u,u+2,u+3],h*6)}let r=(h,u,f=!1)=>{let d=new Ht(h,u,f);return d.setUsage(v1),d},o=r(this.aCenter,3),a=r(this.aUv,2),l=r(this.aTint,4,!0),c=r(this.aSize,1);e.setAttribute("aCenter",o),e.setAttribute("position",o),e.setAttribute("aCorner",new Ht(n,2)),e.setAttribute("aUv",a),e.setAttribute("aTint",l),e.setAttribute("aSize",c),e.setIndex(new Ht(s,1)),e.setDrawRange(0,0),this.attrs=[o,a,l,c],this.geo=e,this.mesh=new be(e,this.mat),this.mesh.frustumCulled=!1,this.mesh.visible=!1,this.mesh.matrixAutoUpdate=!1}get count(){return this.n}setCollider(t){this.collider=t}setLight(t,e){this.light.value.set(t/15,e/15)}rnd(){return this.seed=Math.imul(this.seed,1664525)+1013904223>>>0,this.seed/4294967296}spawnBreak(t,e,n,s){let r=En(s);if(!r)return;let o=an[r],a=jt[r],l=a===j.cross||a===j.torch||a===j.lantern||a===j.rod,c=a===j.carpet||a===j.layer||a===j.lily,h=l?.3:.5,u=c?.15:l?.7:1,f=255,d=255,g=255,b=yi[r];if(b){let m=b===1?ri.grass:b===2?ri.foliage:ri.water;f=m[0],d=m[1],g=m[2]}let p=o===An.opaque||o===An.lava?255:0;for(let m=0;m<MT;m++){this.n>=Ve&&this.kill(0);let v=this.n++,y=(this.rnd()-.5)*2*h,_=this.rnd()*u,w=(this.rnd()-.5)*2*h;this.px[v]=t+.5+y,this.py[v]=e+_,this.pz[v]=n+.5+w;let S=1.4+this.rnd()*1.8;this.vx[v]=y*S*2+(this.rnd()-.5)*1.2,this.vy[v]=(_-u*.35)*S+1.2+this.rnd()*2.2,this.vz[v]=w*S*2+(this.rnd()-.5)*1.2,this.age[v]=0,this.life[v]=Math.min(1.6,.2/(this.rnd()*.9+.1))+.15,this.size[v]=.05+this.rnd()*.05,this.floorY[v]=e;let A=ns[r]?4:this.rnd()<.2?2:4,R=Ut[r*6+A],[P,x]=js(R);this.uv[v*2]=P+Math.floor(this.rnd()*13),this.uv[v*2+1]=x+Math.floor(this.rnd()*13),this.tint[v*4]=f,this.tint[v*4+1]=d,this.tint[v*4+2]=g,this.tint[v*4+3]=p}}kill(t){let e=--this.n;if(t!==e){this.px[t]=this.px[e],this.py[t]=this.py[e],this.pz[t]=this.pz[e],this.vx[t]=this.vx[e],this.vy[t]=this.vy[e],this.vz[t]=this.vz[e],this.age[t]=this.age[e],this.life[t]=this.life[e],this.size[t]=this.size[e],this.floorY[t]=this.floorY[e],this.uv[t*2]=this.uv[e*2],this.uv[t*2+1]=this.uv[e*2+1];for(let n=0;n<4;n++)this.tint[t*4+n]=this.tint[e*4+n]}}update(t,e,n,s){let r=Math.pow(AT,t),o=this.collider;for(let d=0;d<this.n;d++){if(this.age[d]+=t,this.age[d]>=this.life[d]){this.kill(d),d--;continue}this.vy[d]-=ST*t,this.vx[d]*=r,this.vy[d]*=r,this.vz[d]*=r;let g=this.px[d]+this.vx[d]*t,b=this.py[d]+this.vy[d]*t,p=this.pz[d]+this.vz[d]*t,m=this.size[d],v=!1;o?(o(Math.floor(g),Math.floor(this.py[d]),Math.floor(this.pz[d]))?this.vx[d]=0:this.px[d]=g,o(Math.floor(this.px[d]),Math.floor(this.py[d]),Math.floor(p))?this.vz[d]=0:this.pz[d]=p,this.vy[d]<0&&o(Math.floor(this.px[d]),Math.floor(b-m),Math.floor(this.pz[d]))?(this.py[d]=Math.floor(b-m)+1+m,v=!0):this.vy[d]>0&&o(Math.floor(this.px[d]),Math.floor(b+m),Math.floor(this.pz[d]))?this.vy[d]=0:this.py[d]=b):(this.px[d]=g,this.pz[d]=p,b-m<this.floorY[d]&&this.vy[d]<0?(this.py[d]=this.floorY[d]+m,v=!0):this.py[d]=b),v&&(this.vy[d]=0,this.vx[d]*=Math.pow(.05,t),this.vz[d]*=Math.pow(.05,t))}let a=this.n;if(this.mesh.visible=a>0,!a)return;let l=this.aCenter,c=this.aUv,h=this.aTint,u=this.aSize;for(let d=0;d<a;d++){let g=this.px[d]-e,b=this.py[d]-n,p=this.pz[d]-s,m=this.uv[d*2],v=this.uv[d*2+1],y=this.size[d];for(let _=0;_<4;_++){let w=d*4+_;l[w*3]=g,l[w*3+1]=b,l[w*3+2]=p,u[w]=y;for(let S=0;S<4;S++)h[w*4+S]=this.tint[d*4+S]}c[d*8]=m,c[d*8+1]=v+4,c[d*8+2]=m+4,c[d*8+3]=v+4,c[d*8+4]=m+4,c[d*8+5]=v,c[d*8+6]=m,c[d*8+7]=v}let f=[3,2,4,1];for(let d=0;d<this.attrs.length;d++){let g=this.attrs[d];g.clearUpdateRanges(),g.addUpdateRange(0,a*4*f[d]),g.needsUpdate=!0}this.geo.setDrawRange(0,a*6),this.mesh.position.set(e,n,s),this.mesh.updateMatrix(),this.mesh.matrixWorld.copy(this.mesh.matrix)}clear(){this.n=0,this.mesh.visible=!1,this.geo.setDrawRange(0,0)}dispose(){this.geo.dispose(),this.mat.dispose()}};var tl=(i,t)=>t<<4|i,Me=(i,t)=>(i+32768)*65536+(t+32768),_s=i=>Math.floor(i/65536)-32768,xs=i=>i%65536-32768,_n=(i,t,e)=>Me(i,e)*16+t,jo=i=>i%16,Wr=i=>Math.floor(i/16),Ke=[0,1,0,-1],Ze=[-1,0,1,0],H1=[1,-1,0,0,0,0],G1=[0,0,1,-1,0,0],W1=[0,0,0,0,1,-1],V1=[1,0,3,2,5,4],Vr=[5,0,4,1],el=[1,3,-1,-1,2,0],vn=18,nl=vn*vn*vn,ph=(i,t,e)=>((t+1)*vn+(e+1))*vn+(i+1),il=(i,t)=>(t+1)*vn+(i+1),$1=1200;var er=new Uint8Array(65536),Kn=new Uint8Array(65536),tr=new Uint8Array(65536),Gf=[[1,0],[0,.5],[.5,1],[0,2/16],[0,1/16]];for(let i=0;i<65536;i++){let t=i&1023;if(t>=xt||t===0)continue;let e=i>>10,n=jt[t],s=an[t]===An.opaque;if(Fs[t]||n===j.slab&&(e&3)===2){er[i]=1,Kn[i]=63;continue}s&&(n===j.slab?e&3?(Kn[i]=4,tr[i]=2):(Kn[i]=8,tr[i]=1):n===j.stairs?e&4?(Kn[i]=4,tr[i]=2):(Kn[i]=8,tr[i]=1):n===j.layer?(Kn[i]=8,tr[i]=3):n===j.carpet&&(Kn[i]=8,tr[i]=4))}var Ff=new Uint8Array(xt),Z1=new Uint8Array(xt);for(let i=0;i<xt;i++){let t=Le[i].name;t.endsWith("_glazed_terracotta")&&(Ff[i]=1),jt[i]===j.cube&&(t==="glass"||t==="tinted_glass"||t.endsWith("_stained_glass"))&&(Z1[i]=1)}var K1,kT=(K1=yt.iron_bars)!=null?K1:-1;function Qo(i,t){let e=i&1023,n=lo[e],s=e*6;if(n===0)return Ut[s+t];let r=i>>10;if(n===1){let c=r&3;return c===1?t===0?Ut[s+2]:t===1?Ut[s+3]:Ut[s+4]|65536:c===2?t===4?Ut[s+2]:t===5?Ut[s+3]:t===0||t===1?Ut[s+4]|65536:Ut[s+4]:Ut[s+t]}let o=r&3;if(t===2)return Ut[s+2]|(Ff[e]?o+1&3:o)<<16;if(t===3)return Ut[s+3]|(4-o&3)<<16;let a=el[t]-o+4&3,l=Ut[s+Vr[a]];return Ff[e]?l|a<<16:l}var Of=i=>jt[i&1023]===j.stairs;function zf(i,t,e){let n=t&1023;if(n===0)return!1;let s=i&1023,r=jt[s],o=jt[n];if(er[t&65535])return!0;switch(r){case j.fence:if(o===j.fence&&fr[n]===fr[s])return!0;break;case j.pane:if(o===j.pane||Z1[n])return!0;break;case j.wall:if(o===j.wall)return!0;break;default:return!1}return r!==j.pane&&o===j.stairs&&(t>>10&3)===(e+2&3)}function bh(i,t){let e=0;for(let n=0;n<4;n++)zf(i,t(Ke[n],0,Ze[n]),n)&&(e|=1<<n);return e}var CT=0,J1=1,j1=2,Q1=3,tb=4;function q1(i,t,e){let n=t(Ke[e],0,Ze[e]);return!Of(n)||(n>>10&3)!==(i>>10&3)||(n>>12&1)!==(i>>12&1)}function eb(i,t){let e=i>>10,n=e&3,s=e>>2&1,r=t(Ke[n],0,Ze[n]);if(Of(r)&&(r>>12&1)===s){let a=r>>10&3;if((a&1)!==(n&1)&&q1(i,t,a+2&3))return a===(n+3&3)?Q1:tb}let o=t(-Ke[n],0,-Ze[n]);if(Of(o)&&(o>>12&1)===s){let a=o>>10&3;if((a&1)!==(n&1)&&q1(i,t,a))return a===(n+3&3)?J1:j1}return CT}function nb(i,t){let e=bh(i,t),n=t(0,1,0),s=n&1023,r=jt[s],o=e===5||e===10,a=er[n&65535]===1,l=0;for(let h=0;h<4;h++)e&1<<h&&(a||r===j.wall&&zf(n,t(Ke[h],1,Ze[h]),h))&&(l|=1<<h);let c=!o;if(!c&&s!==0)if(r===j.wall){let h=0;for(let u=0;u<4;u++)zf(n,t(Ke[u],1,Ze[u]),u)&&(h|=1<<u);h!==5&&h!==10&&(c=!0)}else(r===j.torch||r===j.lantern||r===j.rod||!a&&xe[s]&&l===0)&&(c=!0);return e|(c?16:0)|l<<5}function ib(i,t){switch(jt[i&1023]){case j.stairs:return eb(i,t);case j.fence:case j.pane:return bh(i,t);case j.wall:return nb(i,t);default:return 0}}var Ot=(i,t,e,n,s,r)=>[i/16,t/16,e/16,n/16,s/16,r/16];function $r(i,t){let[e,n,s,r,o,a]=i;for(let l=0;l<(t&3);l++){let c=1-a,h=1-s,u=e,f=r;e=c,r=h,s=u,a=f}return[e,n,s,r,o,a]}var rn=i=>[i,i,i,i,i,i];function sl(i){switch(i&3){case 0:return[0,0,1,.5];case 1:return[.5,0,1,1];case 2:return[0,.5,1,1];default:return[0,0,.5,1]}}function mh(i,t){let e=sl(i),n=sl(t);return[Math.max(e[0],n[0]),Math.max(e[1],n[1]),Math.min(e[2],n[2]),Math.min(e[3],n[3])]}function sb(i,t){let e=i>>10,n=e&3,s=e>>2&1,r=[s?[0,.5,0,1,1,1]:[0,0,0,1,.5,1]],o=s?0:.5,a=s?.5:1,l=n+3&3,c=n+1&3,h=n+2&3,u=[];switch(t){case J1:u.push(sl(n),mh(h,l));break;case j1:u.push(sl(n),mh(h,c));break;case Q1:u.push(mh(n,l));break;case tb:u.push(mh(n,c));break;default:u.push(sl(n))}for(let f of u)r.push([f[0],o,f[1],f[2],a,f[3]]);return r}function rb(i){let t=i>>10&3;return t===2?[0,0,0,1,1,1]:t===1?[0,.5,0,1,1,1]:[0,0,0,1,.5,1]}function ob(i){let t=i>>10,e=t&3,n=t>>2&1,r=t>>4&1?e+1&3:e+3&3,o=e+2&3,a=n?r:o,l=3/16,c;switch(a){case 0:c=[0,0,0,1,1,l];break;case 1:c=[1-l,0,0,1,1,1];break;case 2:c=[0,0,1-l,1,1,1];break;default:c=[0,0,0,l,1,1]}let h=Ke[o]+Ke[r],u=Ze[o]+Ze[r];return{box:c,hingeX:h>0?1:0,hingeZ:u>0?1:0}}function ab(i){let t=i>>10,e=t&3,n=t>>2&1,s=t>>3&1,r=3/16;if(!n)return s?[0,1-r,0,1,1,1]:[0,0,0,1,r,1];switch(e){case 0:return[0,0,0,1,1,r];case 1:return[1-r,0,0,1,1,1];case 2:return[0,0,1-r,1,1,1];default:return[0,0,0,r,1,1]}}var gh=22.5*Math.PI/180;function RT(i){switch(i&3){case 1:return{box:[0,.21875,7/16,2/16,.84375,9/16],rotate:{axis:"z",angle:-gh,origin:[1/16,.21875,.5]}};case 3:return{box:[14/16,.21875,7/16,1,.84375,9/16],rotate:{axis:"z",angle:gh,origin:[15/16,.21875,.5]}};case 2:return{box:[7/16,.21875,0,9/16,.84375,2/16],rotate:{axis:"x",angle:gh,origin:[.5,.21875,1/16]}};default:return{box:[7/16,.21875,14/16,9/16,.84375,1],rotate:{axis:"x",angle:-gh,origin:[.5,.21875,15/16]}}}}var X1=[[7,6,9,16],[7,6,9,16],[7,6,9,8],[7,14,9,16],[7,6,9,16],[7,6,9,16]];function lb(i,t,e=0){let n=i&1023,s=i>>10,r=n*6,o=Ut[r];switch(jt[n]){case j.cube:{let a=[];for(let l=0;l<6;l++)a.push(Qo(i,l)&65535);return[{box:[0,0,0,1,1,1],tex:a}]}case j.slab:{let a=[Ut[r],Ut[r+1],Ut[r+2],Ut[r+3],Ut[r+4],Ut[r+5]];return[{box:rb(i),tex:a}]}case j.stairs:{let a=[Ut[r],Ut[r+1],Ut[r+2],Ut[r+3],Ut[r+4],Ut[r+5]];return sb(i,t).map(l=>({box:l,tex:a.slice()}))}case j.fence:{let a=[{box:Ot(6,0,6,10,16,10),tex:rn(o)}];for(let l=0;l<4;l++)t&1<<l&&(a.push({box:$r(Ot(7,12,0,9,15,6),l),tex:rn(o)}),a.push({box:$r(Ot(7,6,0,9,9,6),l),tex:rn(o)}));return a}case j.wall:{let a=[];t&16&&a.push({box:Ot(4,0,4,12,16,12),tex:rn(o)});for(let l=0;l<4;l++){if(!(t&1<<l))continue;let c=t&1<<5+l?16:14;a.push({box:$r(Ot(5,0,0,11,c,8),l),tex:rn(o)})}return a.length||a.push({box:Ot(4,0,4,12,16,12),tex:rn(o)}),a}case j.pane:{let a=t&15?t&15:15,l=n===kT?1:0,c=[Ot(7,0,7,9,16,9)];for(let h=0;h<4;h++)a&1<<h&&c.push($r(Ot(7,0,0,9,16,7),h));return c.map(h=>{let u=Math.round(h[0]*16),f=Math.round(h[3]*16),d=Math.round(h[2]*16),g=Math.round(h[5]*16),b=f-u<=2,p=g-d<=2,m=f-u>=g-d?[u,0,f,1]:[l,d,l+1,g],v=[l,0,l+1,16],y=[p?v:null,p?v:null,m,m,b?v:null,b?v:null];return{box:h,tex:rn(o),uv:y}})}case j.torch:{if(s===0)return[{box:Ot(7,0,7,9,10,9),tex:rn(o),uv:X1,shade:!1,ao:!1}];let a=RT(s-1);return[{box:a.box,tex:rn(o),uv:X1,rotate:a.rotate,shade:!1,ao:!1}]}case j.door:{let a=s>>3&1?Ut[r+2]:Ut[r+3],l=ob(i),[c,,h,u,,f]=l.box,d=[null,null,null,null,null,null],g=u-c<.5,b=g?[0,1]:[4,5];for(let p of b){let m=p===1||p===4,v=g?l.hingeZ===0:l.hingeX===0;d[p]=m===v?[0,0,16,16]:[16,0,0,16]}return[{box:l.box,tex:rn(a),uv:d}]}case j.trapdoor:return[{box:ab(i),tex:rn(o)}];case j.layer:return[{box:Ot(0,0,0,16,2,16),tex:rn(o)}];case j.carpet:return[{box:Ot(0,0,0,16,1,16),tex:rn(o)}];case j.cactus:{let a=Ut[r+4],l=Ut[r+2],c=Ut[r+3];return[{box:[0,0,0,1,1,1],tex:[-1,-1,l,c,-1,-1]},{box:Ot(0,0,1,16,16,15),tex:[-1,-1,-1,-1,a,a]},{box:Ot(1,0,0,15,16,16),tex:[a,a,-1,-1,-1,-1]}]}case j.lantern:{let a=s&1?1:0,l=[[5,9,11,16],[5,9,11,16],[0,0,6,6],[0,0,6,6],[5,9,11,16],[5,9,11,16]],c=[[6,7,10,9],[6,7,10,9],[1,1,5,5],[1,1,5,5],[6,7,10,9],[6,7,10,9]],h=[[7,6,9,7],[7,6,9,7],[7,6,9,7],[7,6,9,7],[7,6,9,7],[7,6,9,7]],u=[{box:Ot(5,a,5,11,7+a,11),tex:rn(o),uv:l},{box:Ot(6,7+a,6,10,9+a,10),tex:rn(o),uv:c}];return a?u.push({box:Ot(7.5,10,7.5,8.5,16,8.5),tex:[o,o,-1,-1,o,o],uv:h}):u.push({box:Ot(7,9,7,9,10,9),tex:rn(o),uv:h}),u}case j.chest:{let a=[];for(let l=0;l<6;l++)a.push(Qo(i,l)&65535);return[{box:Ot(1,0,1,15,14,15),tex:a}]}case j.rod:{let a=s&3,l=a===1?{axis:"z",angle:-Math.PI/2,origin:[.5,.5,.5]}:a===2?{axis:"x",angle:Math.PI/2,origin:[.5,.5,.5]}:void 0,c=[[0,0,4,1],[0,0,4,1],[0,0,4,4],[0,0,4,4],[0,0,4,1],[0,0,4,1]],h=[[7,0,9,15],[7,0,9,15],[7,0,9,2],[7,0,9,2],[7,0,9,15],[7,0,9,15]];return[{box:Ot(6,0,6,10,1,10),tex:rn(o),uv:c,rotate:l,ao:!1,shade:!1},{box:Ot(7,1,7,9,16,9),tex:rn(o),uv:h,rotate:l,ao:!1,shade:!1}]}case j.lily:{let l=e&3;return[{box:[0,.00625,0,1,.00625,1],tex:[-1,-1,o,o,-1,-1],uv:[null,null,[0,0,16,16],[0,16,16,0],null,null],rotate:l?{axis:"y",angle:-l*Math.PI/2,origin:[.5,.5,.5]}:void 0}]}default:return[]}}var cb=[0,0,0,1,1,1],Hf=new Map;{let i=(t,e)=>{for(let n of t)yt[n]!==void 0&&Hf.set(yt[n],e)};i(["short_grass","fern","dead_bush"],Ot(2,0,2,14,13,14)),i(["dandelion","poppy","blue_orchid","allium","azure_bluet","red_tulip","orange_tulip","white_tulip","pink_tulip","oxeye_daisy","cornflower","lily_of_the_valley"],Ot(5,0,5,11,10,11)),i(["brown_mushroom","red_mushroom"],Ot(5,0,5,11,6,11)),i(["sugar_cane"],Ot(2,0,2,14,16,14)),i(["cobweb"],cb),i(["seagrass"],Ot(2,0,2,14,12,14));for(let t=0;t<xt;t++)Le[t].name.endsWith("_sapling")&&Hf.set(t,Ot(2,0,2,14,12,14))}function Y1(i,t,e){let n=[];t&&n.push(t);for(let s=0;s<4;s++)i&1<<s&&n.push($r(e,s));return n}function hb(i,t,e){let n=i&1023,s=i>>10;if(n===0||n>=xt)return[];switch(jt[n]){case j.cube:return[cb.slice()];case j.slab:return[rb(i)];case j.stairs:return sb(i,eb(i,t));case j.fence:{let r=e?24:16;return Y1(bh(i,t),Ot(6,0,6,10,r,10),Ot(6,0,0,10,r,6))}case j.pane:{let r=bh(i,t);return r||(r=15),Y1(r,Ot(7,0,7,9,16,9),Ot(7,0,0,9,16,7))}case j.wall:{let r=nb(i,t),o=[],a=e?24:16;(r&16||!(r&15))&&o.push(Ot(4,0,4,12,a,12));for(let l=0;l<4;l++){if(!(r&1<<l))continue;let c=e?24:r&1<<5+l?16:14;o.push($r(Ot(5,0,0,11,c,8),l))}return o}case j.torch:return e?[]:s===0?[Ot(6,0,6,10,10,10)]:[$r(Ot(5.5,3,11,10.5,13,16),s-1&3)];case j.door:return[ob(i).box];case j.trapdoor:return[ab(i)];case j.layer:return e?[]:[Ot(0,0,0,16,2,16)];case j.carpet:return[Ot(0,0,0,16,1,16)];case j.cactus:return e?[Ot(1,0,1,15,15,15)]:[Ot(1,0,1,15,16,15)];case j.lantern:{let r=s&1?1:0;return[Ot(5,r,5,11,7+r,11),Ot(6,7+r,6,10,9+r,10)]}case j.chest:return[Ot(1,0,1,15,14,15)];case j.rod:{let r=s&3;return[r===1?Ot(0,6,6,16,10,10):r===2?Ot(6,6,0,10,10,16):Ot(6,0,6,10,16,10)]}case j.lily:return[Ot(1,0,1,15,1.5,15)];case j.cross:{if(e)return[];let r=Hf.get(n);return[r?r.slice():Ot(2,0,2,14,14,14)]}default:return[]}}function yh(i,t){return xe[i&1023]?hb(i,t,!0):[]}function vh(i,t){return hb(i,t,!1)}var Wf=new Uint8Array(xt);for(let i of["short_grass","fern","dandelion","poppy","blue_orchid","allium","azure_bluet","red_tulip","orange_tulip","white_tulip","pink_tulip","oxeye_daisy","cornflower","lily_of_the_valley"])yt[i]!==void 0&&(Wf[yt[i]]=1);function _h(i,t,e,n=0){let s=Math.imul(i|0,668265261)^Math.imul(e|0,374761393)^Math.imul(t|0,2654435761)^n;return s=Math.imul(s^s>>>15,2246822507),s=Math.imul(s^s>>>13,3266489909),(s^s>>>16)>>>0}var ws=1,Ki=vn,nr=vn*vn,ub=[ws,nr,Ki],Zf=[ws,-ws,nr,-nr,Ki,-Ki],Jf=[2,1,8,4,32,16],Sh=[0,0,1,1,2,2],Ah=[.6,.6,1,.5,.8,.8],bb=[.45,.65,.82,1],db=[0,17,17/2,17/3,17/4],Xr=[[[1,0,1],[1,0,0],[1,1,0],[1,1,1]],[[0,0,0],[0,0,1],[0,1,1],[0,1,0]],[[0,1,1],[1,1,1],[1,1,0],[0,1,0]],[[0,0,0],[1,0,0],[1,0,1],[0,0,1]],[[0,0,1],[1,0,1],[1,1,1],[0,1,1]],[[1,0,0],[0,0,0],[0,1,0],[1,1,0]]],Ms=new Uint8Array(72),yb=new Int32Array(24),vb=new Int32Array(24),_b=new Uint8Array(6),xb=new Uint8Array(6);for(let i=0;i<6;i++){let t=Sh[i],e=t===0?1:0,n=t===2?1:2;for(let a=0;a<4;a++){let l=Xr[i][a];for(let c=0;c<3;c++)Ms[(i*4+a)*3+c]=l[c];yb[i*4+a]=(l[e]?1:-1)*ub[e],vb[i*4+a]=(l[n]?1:-1)*ub[n]}let s=Xr[i][0],r=Xr[i][1],o=Xr[i][3];for(let a=0;a<3;a++)r[a]!==s[a]&&(_b[i]=a),o[a]!==s[a]&&(xb[i]=a)}var wh=[0,16,16,0],Yf=[16,16,0,0],Mh=new Uint8Array(65536);for(let i=0;i<65536;i++){let t=i&1023;t<xt&&(er[i]||ei[t])&&(Mh[i]=1)}var PT=new Float32Array(Gf.map(i=>i[0])),LT=new Float32Array(Gf.map(i=>i[1])),IT=j.cube,UT=j.slab,DT=j.cross,NT=j.fluid,BT=j.lily,FT=j.pane,OT=j.fence,zT=j.door,HT=j.cactus,jf=yt.water,gb,Kf=(gb=yt.seagrass)!=null?gb:-1,GT=Ie(yt.bedrock),Yr=new Uint16Array(1024);for(let i=0;i<xt;i++)he[i]&&(Yr[i]=i);Kf>=0&&(Yr[Kf]=jf);var wb=new Uint8Array(xt);for(let i of["grass_block","snowy_grass_block","dirt","sand","red_sand","mycelium","podzol"])yt[i]!==void 0&&(wb[yt[i]]=1);var qr=class{constructor(){this.pos=new Int16Array(3*8192);this.uv=new Uint16Array(2*8192);this.tint=new Uint8Array(4*8192);this.light=new Uint8Array(4*8192);this.idx=new Uint32Array(12288);this.vc=0;this.ic=0}reserve(t,e){if((this.vc+t)*3>this.pos.length){let n=Math.max(this.pos.length/3*2,this.vc+t),s=new Int16Array(n*3);s.set(this.pos),this.pos=s;let r=new Uint16Array(n*2);r.set(this.uv),this.uv=r;let o=new Uint8Array(n*4);o.set(this.tint),this.tint=o;let a=new Uint8Array(n*4);a.set(this.light),this.light=a}if(this.ic+e>this.idx.length){let n=new Uint32Array(Math.max(this.idx.length*2,this.ic+e));n.set(this.idx),this.idx=n}}finish(){let t=this.vc,e=this.ic;if(t===0||e===0)return null;let n;return t<=65535?(n=new Uint16Array(e),n.set(this.idx.subarray(0,e))):n=this.idx.slice(0,e),{positions:this.pos.slice(0,t*3),uvs:this.uv.slice(0,t*2),tints:this.tint.slice(0,t*4),lights:this.light.slice(0,t*4),indices:n,vertexCount:t,indexCount:e}}},ea=[new qr,new qr,new qr,new qr,new qr],pi=new Uint16Array(nl),fi=new Uint8Array(nl),xn=new Uint8Array(vn*vn*9),Mb=!1,Qf=!0,Kr=!1,Sb=0,hl=255,ul=255,dl=255,tp=0,WT=(i,t,e)=>pi[Sb+i+e*Ki+t*nr];function Ss(i,t,e,n,s,r,o,a,l,c){let h=i.vc++,u=h*3,f=h*2,d=h*4;i.pos[u]=t,i.pos[u+1]=e,i.pos[u+2]=n,i.uv[f]=s,i.uv[f+1]=r;let g=i.tint;g[d]=hl,g[d+1]=ul,g[d+2]=dl,g[d+3]=tp;let b=i.light;b[d]=o,b[d+1]=a,b[d+2]=l,b[d+3]=c}function ta(i,t,e,n){let s=i.idx,r=i.ic;e?(s[r++]=t+1,s[r++]=t+2,s[r++]=t+3,s[r++]=t+1,s[r++]=t+3,s[r++]=t):(s[r++]=t,s[r++]=t+1,s[r++]=t+2,s[r++]=t,s[r++]=t+2,s[r++]=t+3),n&&(e?(s[r++]=t+1,s[r++]=t+3,s[r++]=t+2,s[r++]=t+1,s[r++]=t,s[r++]=t+3):(s[r++]=t,s[r++]=t+2,s[r++]=t+1,s[r++]=t,s[r++]=t+3,s[r++]=t+2)),i.ic=r}function ep(i,t,e){let n=yi[i];if(n){let s=il(t,e)*9+(n-1)*3;hl=xn[s],ul=xn[s+1],dl=xn[s+2]}else hl=255,ul=255,dl=255;tp=ns[i]?255:0}function np(i,t){let e=il(i,t)*9;return(xn[e]|xn[e+1]<<8|xn[e+2]<<16)^Math.imul(xn[e+3]|xn[e+4]<<8|xn[e+5]<<16,2654435761)^Math.imul(xn[e+6]|xn[e+7]<<8|xn[e+8]<<16,2246822507)}var hi=new Float32Array(4),ui=new Float32Array(4),di=new Uint8Array(4);function Ab(i,t){let e=fi[i],n=e>>4,s=e&15,r=t*4;for(let o=0;o<4;o++){let a=yb[r+o],l=vb[r+o],c=i+a,h=i+l,u=c+l,f=pi[c],d=pi[h],g=pi[u],b=er[f],p=er[d],m=n,v=s,y=1;if(!b){let S=fi[c];m+=S>>4,v+=S&15,y++}if(!p){let S=fi[h];m+=S>>4,v+=S&15,y++}if(!(b&&p)&&!er[g]){let S=fi[u];m+=S>>4,v+=S&15,y++}hi[o]=m*db[y],ui[o]=v*db[y];let _=Mh[f],w=Mh[d];di[o]=_&&w?0:3-_-w-Mh[g]}}function VT(i){let t=fi[i],e=(t>>4)*17,n=(t&15)*17;hi[0]=hi[1]=hi[2]=hi[3]=e,ui[0]=ui[1]=ui[2]=ui[3]=n,di[0]=di[1]=di[2]=di[3]=3}function $T(i,t,e,n,s,r){let o=ei[r]===1,a=o&&!Mb,l=ea[a?0:an[r]],c=Dl[r]===1,h=o&&!Kr?16:0;ep(r,i,e);for(let u=0;u<6;u++){let f=n+Zf[u],d=pi[f];if(Kn[d]&Jf[u])continue;if(d!==0){let P=d&1023;if(c&&P===r||a&&ei[P])continue}let g=Qo(s,u),b=g&65535,p=g>>>16;u===2&&wb[r]&&!Kr&&(p=p+_h(i,t,e,np(i,e))&3),Qf?Ab(f,u):VT(f);let m=(b&31)<<4,v=b>>5<<4;l.reserve(4,6);let y=l.vc,_=Ah[u]*255,w=u|h,S=u*12;for(let P=0;P<4;P++){let x=P+p&3;Ss(l,i+Ms[S+P*3]<<8,t+Ms[S+P*3+1]<<8,e+Ms[S+P*3+2]<<8,m+wh[x],v+Yf[x],hi[P]+.5|0,ui[P]+.5|0,_*bb[di[P]]+.5|0,w)}let A=di[0]*64+hi[0]+ui[0]+di[2]*64+hi[2]+ui[2],R=di[1]*64+hi[1]+ui[1]+di[3]*64+hi[3]+ui[3];ta(l,y,A<R,!1)}}function qT(i,t,e,n,s){let r=ea[an[s]],o=fi[n],a=(o>>4)*17,l=(o&15)*17;ep(s,i,e);let c=0,h=0;if(Wf[s]&&!Kr){let P=_h(i,t,e,np(i,e));c=((P&15)/15-.5)*(6/16),h=((P>>>4&15)/15-.5)*(6/16)}let u=xu[s]===1&&!Kr,f=6|(u?8:0),d=f|(u?32:0),g=Qo(s,0)&65535,b=(g&31)<<4,p=g>>5<<4,m=.05,v=.95,y=Math.round((i+m+c)*256),_=Math.round((i+v+c)*256),w=Math.round((e+m+h)*256),S=Math.round((e+v+h)*256),A=t<<8,R=t+1<<8;r.reserve(8,24);for(let P=0;P<2;P++){let x=P?S:w,T=P?w:S,D=r.vc;Ss(r,y,A,x,b,p+16,a,l,255,f),Ss(r,_,A,T,b+16,p+16,a,l,255,f),Ss(r,_,R,T,b+16,p,a,l,255,d),Ss(r,y,R,x,b,p,a,l,255,d),ta(r,D,!1,!0)}}var Vf=14/16;function Eb(i){let t=i&1023;if(!he[t])return Vf;let e=i>>10;return e&8?Vf:Vf-(e&7)/9}function cl(i,t){let e=pi[i],n=e&1023;return Yr[n]===t?Yr[pi[i+nr]&1023]===t?1:Eb(e):xe[n]?-1:0}function xh(i,t,e,n,s){if(t>=1||e>=1)return 1;let r=0,o=0;if(t>0||e>0){let a=cl(n,s);if(a>=1)return 1;a>=.8?(r+=a*10,o+=10):a>=0&&(r+=a,o+=1)}return i>=.8?(r+=i*10,o+=10):i>=0&&(r+=i,o+=1),t>=.8?(r+=t*10,o+=10):t>=0&&(r+=t,o+=1),e>=.8?(r+=e*10,o+=10):e>=0&&(r+=e,o+=1),o>0?r/o:i}var $f=(i,t)=>Math.max(i>>4,t>>4)<<4|Math.max(i&15,t&15),Ne=new Float32Array(4),XT=[0,256,256,0],YT=[256,256,0,0],KT=[2,3,1,0];function fb(i,t,e,n,s,r){let o=r===jf,a=ea[an[r]];if(yi[r]){let m=il(i,e)*9+(yi[r]-1)*3;hl=xn[m],ul=xn[m+1],dl=xn[m+2]}else hl=ul=dl=255;tp=0;let l=fi[n],c=pi[n+nr],h=Yr[c&1023]===r;if(h)Ne[0]=Ne[1]=Ne[2]=Ne[3]=1;else{let m=Eb(s),v=cl(n-Ki,r),y=cl(n+Ki,r),_=cl(n-ws,r),w=cl(n+ws,r);Ne[0]=xh(m,v,_,n-Ki-ws,r),Ne[1]=xh(m,v,w,n-Ki+ws,r),Ne[2]=xh(m,y,_,n+Ki-ws,r),Ne[3]=xh(m,y,w,n+Ki+ws,r)}let u=Qo(r,2)&65535,f=(u&31)<<4,d=u>>5<<4,g=i<<8,b=t<<8,p=e<<8;if(!h&&!(Kn[c]&8&&Ne[0]>=1&&Ne[1]>=1&&Ne[2]>=1&&Ne[3]>=1)){let m=$f(l,fi[n+nr]),v=(m>>4)*17,y=(m&15)*17,_=2|(o&&!Kr?24:0),w=Ne[0]+Ne[2]-Ne[1]-Ne[3],S=Ne[0]+Ne[1]-Ne[2]-Ne[3],A=0;Math.abs(w)+Math.abs(S)>.001&&(A=Math.abs(w)>Math.abs(S)?w>0?3:1:S>0?0:2),a.reserve(4,12);let R=a.vc;for(let P=0;P<4;P++){let x=P+A&3;Ss(a,g+XT[P],b+Math.round(Ne[KT[P]]*256),p+YT[P],f+wh[x],d+Yf[x],v,y,255,_)}ta(a,R,!1,!1)}for(let m=0;m<6;m++){if(m===2||m===3)continue;let v=n+Zf[m],y=pi[v];if(Yr[y&1023]===r||Kn[y]&Jf[m])continue;let _=$f(l,fi[v]),w=(_>>4)*17,S=(_&15)*17,A=Ah[m]*255+.5|0;a.reserve(4,12);let R=a.vc,P=m*12;for(let x=0;x<4;x++){let T=Ms[P+x*3],D=Ms[P+x*3+1],U=Ms[P+x*3+2],k=D?Ne[T+U*2]:0,B=Math.round(16*(1-k));Ss(a,g+(T<<8),b+Math.round(k*256),p+(U<<8),f+wh[x],d+B,w,S,A,m)}ta(a,R,!1,!1)}{let m=n-nr,v=pi[m];if(Yr[v&1023]!==r&&!(Kn[v]&4)){let y=$f(l,fi[m]),_=(y>>4)*17,w=(y&15)*17,S=Ah[3]*255+.5|0;a.reserve(4,12);let A=a.vc,R=3*12;for(let P=0;P<4;P++)Ss(a,g+(Ms[R+P*3]<<8),b,p+(Ms[R+P*3+2]<<8),f+wh[P],d+Yf[P],_,w,S,3);ta(a,A,!1,!1)}}}var pb=new Map;function ZT(i,t,e,n,s,r){let o,a;switch(i){case 0:o=1-n,a=1-e;break;case 1:o=n,a=1-e;break;case 2:o=t,a=n;break;case 3:o=t,a=1-n;break;case 4:o=t,a=1-e;break;default:o=1-t,a=1-e}s[r]=Math.min(16,Math.max(0,o*16)),s[r+1]=Math.min(16,Math.max(0,a*16))}var dn=1e-5;function JT(i,t,e){let n=i[t].box,s=Sh[e],r=(e&1)===0,o=r?n[s+3]:n[s],a=(s+1)%3,l=(s+2)%3;for(let c=0;c<i.length;c++){if(c===t)continue;let h=i[c];if(h.rotate)continue;let u=!0;for(let g=0;g<6;g++)if(!(h.tex[g]>=0)){u=!1;break}if(!u)continue;let f=h.box;if(!(f[3]-f[0]<=dn||f[4]-f[1]<=dn||f[5]-f[2]<=dn||!(r?f[s]<=o+dn&&f[s+3]>o+dn:f[s]<o-dn&&f[s+3]>=o-dn))&&f[a]<=n[a]+dn&&f[a+3]>=n[a+3]-dn&&f[l]<=n[l]+dn&&f[l+3]>=n[l+3]-dn)return!0}return!1}function jT(i,t){let e=Math.cos(t.angle),n=Math.sin(t.angle),[s,r,o]=t.origin;for(let a=0;a<4;a++){let l=i[a*3]-s,c=i[a*3+1]-r,h=i[a*3+2]-o,u=l,f=c,d=h;t.axis==="x"?(f=c*e-h*n,d=c*n+h*e):t.axis==="y"?(u=l*e+h*n,d=-l*n+h*e):(u=l*e-c*n,f=l*n+c*e),i[a*3]=u+s,i[a*3+1]=f+r,i[a*3+2]=d+o}}function QT(i,t){let e=jt[t],n=[],s=new Float32Array(8);for(let r=0;r<i.length;r++){let o=i[r],a=o.box;for(let l=0;l<6;l++){let c=o.tex[l];if(!(c>=0))continue;let h=Sh[l],u=(h+1)%3,f=(h+2)%3;if(a[u+3]-a[u]<=dn||a[f+3]-a[f]<=dn||!o.rotate&&JT(i,r,l))continue;let d=new Float32Array(12);for(let k=0;k<4;k++){for(let B=0;B<3;B++)d[k*3+B]=Xr[l][k][B]?a[B+3]:a[B];ZT(l,d[k*3],d[k*3+1],d[k*3+2],s,k*2)}let g=o.uv?o.uv[l]:null;g&&(s[0]=g[0],s[1]=g[3],s[2]=g[2],s[3]=g[3],s[4]=g[2],s[5]=g[1],s[6]=g[0],s[7]=g[1]);let b=(c&31)<<4,p=c>>5<<4,m=new Uint16Array(8);for(let k=0;k<4;k++)m[k*2]=b+Math.round(s[k*2]),m[k*2+1]=p+Math.round(s[k*2+1]);let v=l,y=!0;if(o.rotate){jT(d,o.rotate);let k=d[3]-d[0],B=d[4]-d[1],F=d[5]-d[2],I=d[9]-d[0],N=d[10]-d[1],z=d[11]-d[2],et=B*z-F*N,nt=F*I-k*z,ot=k*N-B*I,bt=Math.hypot(et,nt,ot)||1,W=Math.abs(et),J=Math.abs(nt),rt=Math.abs(ot);if(W>=J&&W>=rt?v=et>0?0:1:J>=rt?v=nt>0?2:3:v=ot>0?4:5,y=Math.max(W,J,rt)/bt>.9999,y)for(let tt=0;tt<12;tt++)d[tt]=Math.round(d[tt]*4096)/4096}let _=-1,w=Sh[v];if(y){let k=d[w];(v&1?Math.abs(k)<dn:Math.abs(k-1)<dn)&&(_=v)}let S=1,A=0;for(let k=0;k<4;k++)S=Math.min(S,d[k*3+1]),A=Math.max(A,d[k*3+1]);let R=new Float32Array(16),P=_b[v],x=xb[v],T=Xr[v][0][P],D=Xr[v][0][x];for(let k=0;k<4;k++){let B=Math.min(1,Math.max(0,Math.abs(d[k*3+P]-T))),F=Math.min(1,Math.max(0,Math.abs(d[k*3+x]-D)));R[k*4]=(1-B)*(1-F),R[k*4+1]=B*(1-F),R[k*4+2]=B*F,R[k*4+3]=(1-B)*F}let U=0;_>=0&&(e===FT||e===OT?U=2:(e===zT||e===HT)&&(_===2||_===3)&&(U=1)),n.push({p:d,uv:m,w:R,face:v,bface:_,rb0:S,rb1:A,shade:o.shade===!1?1:Ah[v],smooth:o.ao!==!1&&y,cullSame:U})}}return n}var rl=new Float32Array(48),ol=new Float32Array(48),al=new Float32Array(48),ll=new Float32Array(48),mb=new Int32Array(12),qf=0;function t3(i,t,e,n,s,r,o){Sb=n;let a=ib(s,WT),l=o===BT&&!Kr?_h(i,t,e,np(i,e))&3:0,c=s+a*65536+l*33554432,h=pb.get(c);if(h||(h=QT(lb(s,a,l),r),pb.set(c,h)),!h.length)return;let u=ea[an[r]];ep(r,i,e),qf++;let f=fr[r];for(let d=0;d<h.length;d++){let g=h[d],b=n;if(g.bface>=0){let D=n+Zf[g.bface],U=pi[D];if(Kn[U]&Jf[g.bface])continue;if(U!==0){let k=U&1023;if(g.bface!==2&&g.bface!==3){let B=tr[U];if(B&&g.rb0>=PT[B]-dn&&g.rb1<=LT[B]+dn)continue}if(k===r&&Dl[r]||g.cullSame===1&&k===r||g.cullSame===2&&jt[k]===o&&fr[k]===f)continue}b=D}let p=g.face,m=Qf&&g.smooth,v=(p*2+(g.bface>=0?1:0))*4;if(m&&mb[v>>2]!==qf){mb[v>>2]=qf,Ab(b,p);for(let D=0;D<4;D++)rl[v+D]=hi[D],ol[v+D]=ui[D],al[v+D]=bb[di[D]],ll[v+D]=di[D]*64+hi[D]+ui[D]}let y=fi[b],_=(y>>4)*17,w=(y&15)*17;u.reserve(4,6);let S=u.vc,A=g.shade*255,R=g.w,P=g.p,x=0,T=0;for(let D=0;D<4;D++){let U=_,k=w,B=1;if(m){let F=R[D*4],I=R[D*4+1],N=R[D*4+2],z=R[D*4+3];U=rl[v]*F+rl[v+1]*I+rl[v+2]*N+rl[v+3]*z,k=ol[v]*F+ol[v+1]*I+ol[v+2]*N+ol[v+3]*z,B=al[v]*F+al[v+1]*I+al[v+2]*N+al[v+3]*z;let et=ll[v]*F+ll[v+1]*I+ll[v+2]*N+ll[v+3]*z;D===0||D===2?x+=et:T+=et}Ss(u,Math.round((i+P[D*3])*256),Math.round((t+P[D*3+1])*256),Math.round((e+P[D*3+2])*256),g.uv[D*2],g.uv[D*2+1],U+.5|0,k+.5|0,A*B+.5|0,p)}ta(u,S,x<T,!1)}}function Eh(){return{blocks:new Uint16Array(nl),light:new Uint8Array(nl),tint:new Uint8Array(vn*vn*9)}}function ip(i,t,e,n,s){let r=s.blocks,o=s.light,a=s.tint,l=i.getChunk(t,n);for(let c=-1;c<=1;c++){let h=c<0?-1:c===0?0:16,u=c<0?-1:c===0?15:16;for(let f=-1;f<=1;f++){let d=f<0?-1:f===0?0:16,g=f<0?-1:f===0?15:16,b=f===0&&c===0?l:i.getChunk(t+f,n+c),p=b?b.blocks:null,m=b?b.light:null;for(let v=-1;v<=16;v++){let y=e*16+v;for(let _=h;_<=u;_++){let w=ph(d,v,_);if(!p||!m||y>255)for(let S=d;S<=g;S++,w++)r[w]=0,o[w]=240;else if(y<0)for(let S=d;S<=g;S++,w++)r[w]=GT,o[w]=0;else{let S=y<<8|(_&15)<<4;for(let A=d;A<=g;A++,w++){let R=S|A&15;r[w]=p[R],o[w]=m[R]}}}}for(let v=h;v<=u;v++)for(let y=d;y<=g;y++){let _=il(y,v)*9,w=null,S=0;if(b?(w=b.tint,S=tl(y&15,v&15)*9):l&&(w=l.tint,S=tl(Math.min(15,Math.max(0,y)),Math.min(15,Math.max(0,v)))*9),w)for(let A=0;A<9;A++)a[_+A]=w[S+A];else for(let A=0;A<9;A++)a[_+A]=Tb[A]}}}}var Tb=new Uint8Array([...ri.grass,...ri.foliage,...ri.water].map(i=>Math.round(i)));function kb(i,t,e){pi=i.blocks,fi=i.light,xn=i.tint,Mb=!!t.fancyLeaves,Qf=!!t.smoothLighting,Kr=e;for(let n of ea)n.vc=0,n.ic=0}function Cb(i,t,e,n,s){let r=s&1023;if(r===0||r>=xt)return;let o=jt[r];o===IT||o===UT&&(s>>10&3)===2?$T(i,t,e,n,s,r):o===DT?qT(i,t,e,n,r):o===NT?fb(i,t,e,n,s,r):t3(i,t,e,n,s,r,o),r===Kf&&fb(i,t,e,n,s,jf)}function Rb(){return ea.map(i=>i.finish())}function Pb(i,t){kb(i,t,!1);let e=i.blocks;for(let n=0;n<16;n++)for(let s=0;s<16;s++){let r=ph(0,n,s);for(let o=0;o<16;o++,r++){let a=e[r];a!==0&&Cb(o,n,s,r,a)}}return Rb()}var Xf=null;function Lb(i){Xf||(Xf=Eh());let t=Xf;t.blocks.fill(0),t.light.fill(240);for(let n=0;n<vn*vn;n++)t.tint.set(Tb,n*9);let e=ph(0,0,0);return t.blocks[e]=i,kb(t,{fancyLeaves:!0,smoothLighting:!1},!0),Cb(0,0,0,e,i),Rb()}var Ib=.3,Ub=.14,e3=`
attribute float aShade;
attribute vec2 aPix;
uniform vec2 uHandLight;
uniform vec3 uSkyLightColor;
uniform vec3 uBlockLightColor;
uniform float uBrightness;
varying vec2 vPix;
varying vec3 vColor;
${Jo}
void main() {
  vPix = aPix;
  float sb = lightCurve(uHandLight.x);
  float bb = lightCurve(uHandLight.y);
  vec3 blk = vec3(bb, bb * ((bb * 0.6 + 0.4) * 0.6 + 0.4), bb * (bb * bb * 0.6 + 0.4)) * uBlockLightColor;
  vColor = finishLight(sb * uSkyLightColor + blk) * aShade;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,n3=`
precision mediump float;
varying vec2 vPix;
varying vec3 vColor;
float hash(vec2 p) { return fract(sin(dot(p, vec2(37.1, 171.7))) * 43758.5453); }
void main() {
  vec2 p = floor(vPix);
  vec3 skin = vec3(0.84, 0.62, 0.47);
  vec3 c = skin * (0.93 + 0.07 * hash(p));
  if (p.y < 3.0) {
    vec3 cloth = vec3(0.24, 0.47, 0.33);
    c = cloth * (0.86 + 0.14 * hash(p + 5.0)) * (p.y > 1.5 ? 0.85 : 1.0);
  }
  gl_FragColor = vec4(c * vColor, 1.0);
}
`;function i3(){let l=[],c=[],h=[],u=[],f=(b,p,m)=>{let v=l.length/3;l.push(...b),c.push(p,p,p,p),h.push(...m),u.push(v,v+1,v+2,v,v+2,v+3)},d=[0,12,4,12,4,0,0,0];f([.125,-.75,.125,.125,-.75,-.125,.125,0,-.125,.125,0,.125],.6,d),f([-.125,-.75,-.125,-.125,-.75,.125,-.125,0,.125,-.125,0,-.125],.6,d),f([-.125,-.75,.125,.125,-.75,.125,.125,0,.125,-.125,0,.125],.8,d),f([.125,-.75,-.125,-.125,-.75,-.125,-.125,0,-.125,.125,0,-.125],.8,d),f([-.125,0,.125,.125,0,.125,.125,0,-.125,-.125,0,-.125],1,[0,0,4,0,4,2,0,2]),f([-.125,-.75,-.125,.125,-.75,-.125,.125,-.75,.125,-.125,-.75,.125],.5,[0,11,4,11,4,12,0,12]);let g=new Ee;return g.setAttribute("position",new Ht(new Float32Array(l),3)),g.setAttribute("aShade",new Ht(new Float32Array(c),1)),g.setAttribute("aPix",new Ht(new Float32Array(h),2)),g.setIndex(u),g.computeBoundingSphere(),g}var Th=class{constructor(t){this.scene=new Js;this.camera=new en(70,1,.05,10);this.root=new Pn;this.pivot=new Pn;this.item=new Pn;this.current=-1;this.pending=0;this.equip=1;this.lowering=!1;this.swingT=-1;this.lagYaw=0;this.lagPitch=0;this.lagInit=!1;this.lightCur=new Bt(1,0);this.mats=F1(t),this.light=this.mats.light,this.armMat=new we({name:"hand-arm",uniforms:{...t,uHandLight:this.light},vertexShader:e3,fragmentShader:n3,side:yn}),this.arm=new be(i3(),this.armMat),this.scene.add(this.root),this.root.add(this.pivot),this.pivot.add(this.item),this.pivot.add(this.arm),this.scene.matrixWorldAutoUpdate=!0,this.setBlock(0)}setBlock(t){let e=En(t);if(this.current===-1){this.apply(e);return}e===this.current&&!this.lowering||(this.pending=e,this.lowering=!0)}swing(){(this.swingT<0||this.swingT>Ib*.5)&&(this.swingT=0)}apply(t){var n;this.current=t;for(let s of this.item.children.slice()){let r=s;r.geometry.dispose(),this.item.remove(r)}if(this.arm.visible=t===0,this.item.visible=t!==0,!t)return;let e=null;try{e=Lb(t)}catch(s){console.warn("[hand] meshBlockItem failed",s)}if(e)for(let s=0;s<e.length;s++){let r=e[s];if(!r||!r.indexCount)continue;let o=new be(lh(r,null),(n=this.mats.byLayer[s])!=null?n:this.mats.byLayer[0]);o.scale.setScalar(1/256),o.position.set(-.5,-.5,-.5),o.renderOrder=s,o.frustumCulled=!1,this.item.add(o)}}update(t){let e=Math.min(.1,Math.max(0,t.dt));this.camera.aspect!==t.aspect&&(this.camera.aspect=t.aspect,this.camera.updateProjectionMatrix());let n=1-Math.exp(-e*12);this.lightCur.x+=(t.light.sky/15-this.lightCur.x)*n,this.lightCur.y+=(t.light.block/15-this.lightCur.y)*n,this.light.value.copy(this.lightCur),this.lowering?(this.equip-=e/Ub,this.equip<=0&&(this.equip=0,this.lowering=!1,this.apply(this.pending))):this.equip<1&&(this.equip=Math.min(1,this.equip+e/Ub));let s=0;this.swingT>=0&&(this.swingT+=e,s=this.swingT/Ib,s>=1&&(this.swingT=-1,s=0)),this.lagInit||(this.lagYaw=t.yaw,this.lagPitch=t.pitch,this.lagInit=!0);let r=t.yaw-this.lagYaw;r=Math.atan2(Math.sin(r),Math.cos(r));let o=1-Math.exp(-e*14);this.lagYaw+=r*o,this.lagPitch+=(t.pitch-this.lagPitch)*o;let a=Math.max(-.12,Math.min(.12,(t.pitch-this.lagPitch)*.6)),l=Math.max(-.12,Math.min(.12,r*.6)),c=t.bob.phase,h=t.bob.amount*.1;this.root.position.set(Math.sin(c)*h*.5*.6,-Math.abs(Math.cos(c)*h)*.6,0),this.root.rotation.set(a,l,Math.sin(c)*h*.05);let u=Math.sqrt(s),f=Math.sin(u*Math.PI),d=Math.sin(s*s*Math.PI),g=(1-this.equip)*-.6,b=this.pivot;this.current?(b.position.set(.5-.4*f,-.44+g+.2*Math.sin(u*Math.PI*2),-.8-.2*Math.sin(s*Math.PI)),b.rotation.set(.12-f*1.3,-d*.35,-f*.35,"YXZ"),this.item.position.set(0,0,0),this.item.rotation.set(0,Math.PI/4,0),this.item.scale.setScalar(.3)):(b.position.set(.5-.3*f,-.42+g+.12*Math.sin(u*Math.PI*2),-.62-.35*Math.sin(s*Math.PI)),b.rotation.set(0-f*.9,.1+d*.3,0,"YXZ"),this.arm.position.set(.08,.38,.32),this.arm.rotation.set(-1.95,.35,.28,"XYZ"))}render(t){t.clearDepth(),t.render(this.scene,this.camera)}dispose(){for(let t of this.item.children)t.geometry.dispose();this.arm.geometry.dispose(),this.armMat.dispose(),this.mats.dispose()}};var s3=.002,r3=`
attribute vec3 aA;
attribute vec3 aB;
attribute vec2 aCorner;   // x: 0 = start, 1 = end; y: side -1 / 1
uniform vec2 uResolution;
uniform float uWidth;
uniform float uNear;
void main() {
  vec4 a = modelViewMatrix * vec4(aA, 1.0);
  vec4 b = modelViewMatrix * vec4(aB, 1.0);
  float nz = -uNear * 1.05;
  if (a.z > nz && b.z > nz) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  if (a.z > nz) a = mix(a, b, (a.z - nz) / (a.z - b.z));
  if (b.z > nz) b = mix(b, a, (b.z - nz) / (b.z - a.z));
  vec4 ca = projectionMatrix * a;
  vec4 cb = projectionMatrix * b;
  vec2 sa = ca.xy / ca.w * uResolution * 0.5;
  vec2 sb = cb.xy / cb.w * uResolution * 0.5;
  vec2 dir = sb - sa;
  float len = length(dir);
  dir = len > 0.0001 ? dir / len : vec2(1.0, 0.0);
  vec2 nrm = vec2(-dir.y, dir.x);
  vec4 c = aCorner.x < 0.5 ? ca : cb;
  vec2 off = (nrm * aCorner.y + dir * (aCorner.x < 0.5 ? -1.0 : 1.0)) * uWidth * 0.5;
  c.xy += off / uResolution * 2.0 * c.w;
  c.z -= 0.0004 * c.w;
  gl_Position = c;
}
`,o3=`
precision mediump float;
uniform vec4 uColor;
void main() { gl_FragColor = uColor; }
`;function a3(i,t=s3){let e=i.map(a=>[a[0]-t,a[1]-t,a[2]-t,a[3]+t,a[4]+t,a[5]+t]),n=a=>{for(let l of e)if(a[0]>l[0]&&a[0]<l[3]&&a[1]>l[1]&&a[1]<l[4]&&a[2]>l[2]&&a[2]<l[5])return!0;return!1},s=[],r=new Set,o=1e-4;for(let a=0;a<3;a++){let l=(a+1)%3,c=(a+2)%3,h=new Set;for(let g of e)h.add(g[a]),h.add(g[a+3]);let u=Array.from(h).sort((g,b)=>g-b),f=new Set,d=new Set;for(let g of e)f.add(g[l]),f.add(g[l+3]),d.add(g[c]),d.add(g[c+3]);for(let g of f)for(let b of d){let p=NaN,m=NaN,v=()=>{if(p===p){let y=`${a}:${g}:${b}:${p}`;if(!r.has(y)){r.add(y);let _=[0,0,0],w=[0,0,0];_[a]=p,w[a]=m,_[l]=w[l]=g,_[c]=w[c]=b,s.push(_[0],_[1],_[2],w[0],w[1],w[2])}}p=m=NaN};for(let y=0;y+1<u.length;y++){let _=u[y],w=u[y+1];if(w-_<1e-9)continue;let S=(_+w)/2,A=[0,0,0,0],R=0;for(let T of[-o,o])for(let D of[-o,o]){let U=[0,0,0];U[a]=S,U[l]=g+T,U[c]=b+D,A[R++]=n(U)?1:0}let P=A[0]+A[1]+A[2]+A[3];P===1||P===3||P===2&&A[0]===A[3]?(m===_||(v(),p=_),m=w):v()}v()}}return s}var kh=class{constructor(){this.lastKey=[];this.lastNull=!0;this.res={value:new Bt(1280,720)},this.width={value:2},this.near={value:.05},this.mat=new we({name:"highlight",uniforms:{uResolution:this.res,uWidth:this.width,uNear:this.near,uColor:{value:new Float32Array([0,0,0,.45])}},vertexShader:r3,fragmentShader:o3,transparent:!0,depthWrite:!1,side:nn}),this.mesh=new be(new Ee,this.mat),this.mesh.frustumCulled=!1,this.mesh.visible=!1,this.mesh.renderOrder=50,this.mesh.matrixAutoUpdate=!1}setResolution(t,e,n){this.res.value.set(t,e),this.width.value=Math.max(1.5,Math.min(4,e/420)),this.near.value=n}set(t,e,n,s){if(!t||t.length===0){this.mesh.visible=!1,this.lastNull=!0;return}let r=this.lastKey,o=!this.lastNull&&r.length===t.length*6+3&&r[0]===e&&r[1]===n&&r[2]===s;if(o){for(let b=0;b<t.length&&o;b++)for(let p=0;p<6;p++)if(r[3+b*6+p]!==t[b][p]){o=!1;break}}if(this.mesh.visible=!0,this.mesh.position.set(e,n,s),this.mesh.updateMatrix(),this.mesh.matrixWorld.copy(this.mesh.matrix),o)return;this.lastNull=!1,r.length=0,r.push(e,n,s);for(let b of t)r.push(b[0],b[1],b[2],b[3],b[4],b[5]);let a=a3(t),l=a.length/6,c=new Float32Array(l*12),h=new Float32Array(l*12),u=new Float32Array(l*8),f=new Uint16Array(l*6),d=[0,-1,0,1,1,1,1,-1];for(let b=0;b<l;b++){for(let m=0;m<4;m++){for(let v=0;v<3;v++)c[(b*4+m)*3+v]=a[b*6+v],h[(b*4+m)*3+v]=a[b*6+3+v];u[(b*4+m)*2]=d[m*2],u[(b*4+m)*2+1]=d[m*2+1]}let p=b*4;f.set([p,p+1,p+2,p,p+2,p+3],b*6)}let g=new Ee;g.setAttribute("aA",new Ht(c,3)),g.setAttribute("aB",new Ht(h,3)),g.setAttribute("aCorner",new Ht(u,2)),g.setAttribute("position",new Ht(c,3)),g.setIndex(new Ht(f,1)),this.mesh.geometry.dispose(),this.mesh.geometry=g}dispose(){this.mesh.geometry.dispose(),this.mat.dispose()}};var Ch=5,l3=.04,c3=8*Math.sqrt(3),Db=.05,Nb=1024,Un=i=>i-Math.floor(i/Nb)*Nb,Bb=(i,t,e)=>{let n=Math.min(1,Math.max(0,(e-i)/(t-i)));return n*n*(3-2*n)},Rh=class{constructor(t,e,n){this.scene=new Js;this.layerGroups=[];this.sections=new Map;this.columns=new Map;this.frustum=new Vo;this.projScreen=new de;this.sphere=new Xi(new V,c3);this.fogFar=64;this.visibleSections=0;this.shotQueue=[];this.shadowRT=null;this.shadowCam=new Br(-64,64,64,-64,.5,320);this.shadowRadius=64;this.white=new Pt(1,1,1);this.tmpV=new V;this.tmpM=new de;this.flicker=1;this.flickerTarget=1;this.flickerT=0;this.lastFov=-1;this.lastAspect=-1;this.disposed=!1;this.post=null;this.reflRT=null;this.mirrorCam=new en;this.rayColor=new Pt;this.reflShift=new de;var h,u;this.canvas=t,this.atlas=e,this.settings={...n};let s=console.warn,r=console.error;console.warn=(...f)=>{typeof f[0]=="string"&&f[0].includes("WebGL 1 support was deprecated")||s.apply(console,f)},console.error=(...f)=>{typeof f[0]=="string"&&f[0].includes("A WebGL context could not be created")||r.apply(console,f)};try{this.gl=new $a({canvas:t,antialias:!1,alpha:!1,depth:!0,stencil:!1,powerPreference:"high-performance",preserveDrawingBuffer:!1,premultipliedAlpha:!0})}finally{console.warn=s,console.error=r}let o=this.gl;o.outputColorSpace=Yi,o.autoClear=!1,o.info.autoReset=!1,o.sortObjects=!0,o.shadowMap.enabled=!1;let a=o.getContext(),l=String((h=a.getParameter(a.RENDERER))!=null?h:"unknown"),c=String((u=a.getParameter(a.VENDOR))!=null?u:"unknown");try{let f=a.getExtension("WEBGL_debug_renderer_info");if(f){let d=a.getParameter(f.UNMASKED_RENDERER_WEBGL),g=a.getParameter(f.UNMASKED_VENDOR_WEBGL);d&&(l=String(d)),g&&(c=String(g))}}catch{}this.info={webgl2:o.capabilities.isWebGL2,renderer:l,vendor:c},this.camera=new en(n.fov,1,Db,400),this.camera.rotation.order="YXZ",this.mats=B1(e),this.scene.matrixWorldAutoUpdate=!0;for(let f=0;f<Ch;f++){let d=new Pn;d.name=`layer${f}`,d.matrixAutoUpdate=!1,this.layerGroups.push(d),this.scene.add(d)}this.sky=new uh(this.scene,this.mats.uniforms),this.particles=new fh(this.mats.uniforms),this.scene.add(this.particles.mesh),this.highlight=new kh,this.scene.add(this.highlight.mesh),this.hand=new Th(this.mats.uniforms),this.applySettings(n),this.resize()}setSection(t,e,n,s){var l;let r=_n(t,e,n),o=this.sections.get(r);if(!s||!s.some(c=>c&&c.indexCount>0)){o&&this.dropSection(r,o);return}if(!o){o={cx:t,sy:e,cz:n,wx:t*16+8,wy:e*16+8,wz:n*16+8,meshes:[null,null,null,null,null],visible:!0},this.sections.set(r,o);let c=Me(t,n),h=this.columns.get(c);h||(h=new Set,this.columns.set(c,h)),h.add(r)}for(let c=0;c<Ch;c++){let h=(l=s[c])!=null?l:null,u=o.meshes[c];if(!h||h.indexCount===0){u&&(u.geometry.dispose(),this.layerGroups[c].remove(u),o.meshes[c]=null);continue}let f=lh(h);if(u)u.geometry.dispose(),u.geometry=f;else{let d=new be(f,this.mats.byLayer[c]);d.matrixAutoUpdate=!1,d.matrixWorldAutoUpdate=!1,d.frustumCulled=!1,d.position.set(t*16,e*16,n*16),d.scale.setScalar(1/256),d.updateMatrix(),d.matrixWorld.copy(d.matrix),d.visible=o.visible,this.layerGroups[c].add(d),o.meshes[c]=d}}}dropSection(t,e){for(let r=0;r<Ch;r++){let o=e.meshes[r];o&&(o.geometry.dispose(),this.layerGroups[r].remove(o))}this.sections.delete(t);let n=Me(e.cx,e.cz),s=this.columns.get(n);s&&(s.delete(t),s.size||this.columns.delete(n))}removeColumn(t,e){let n=Me(t,e),s=this.columns.get(n);if(s){for(let r of Array.from(s)){let o=this.sections.get(r);o&&this.dropSection(r,o)}this.columns.delete(n)}}clear(){for(let[t,e]of Array.from(this.sections))this.dropSection(t,e);this.sections.clear(),this.columns.clear(),this.particles.clear(),this.highlight.set(null,0,0,0)}applySettings(t){this.settings={...t};let e=this.mats.uniforms;this.fogFar=Math.max(2,t.renderDistance)*16,e.uBrightness.value=Math.min(1,Math.max(0,t.brightness));let n=Math.min(320,Math.max(160,this.fogFar*2));this.sky.setClouds(t.clouds,n),this.camera.far=Math.max(this.fogFar*1.25+32,n+140),this.lastFov=-1;let s=t.shaderPack||"off",r=s!=="off",o=s==="ultra";this.mats.setPack({shadows:!!t.shadows,waving:!!t.waving,fancy:r,ultra:o,planar:o}),this.setShadows(!!t.shadows,t.shadowQuality||2048),this.setUltra(o),Df(this.atlas,!!t.mipmaps),this.resize()}setShadows(t,e){var n;if(t){if(!this.shadowRT||this.shadowRT.width!==e){(n=this.shadowRT)==null||n.dispose();let s=new Ln(e,e,{format:Fe,type:sn,minFilter:ue,magFilter:ue,wrapS:ge,wrapT:ge,depthBuffer:!0,stencilBuffer:!1,generateMipmaps:!1});s.texture.name="shadow",this.shadowRT=s}this.shadowRadius=Math.min(64,Math.max(32,this.fogFar*.75)),this.mats.uniforms.uShadowMap.value=this.shadowRT.texture,this.mats.uniforms.uShadowTexel.value=1/e}else this.shadowRT&&(this.shadowRT.dispose(),this.shadowRT=null,this.mats.uniforms.uShadowMap.value=null);this.mats.setShadows(t)}setUltra(t){var e;t?(this.post||(this.post=new ch(this.gl)),this.reflRT||(this.reflRT=new Ln(1,1,{format:Fe,type:sn,minFilter:De,magFilter:De,wrapS:ge,wrapT:ge,depthBuffer:!0,stencilBuffer:!1,generateMipmaps:!1}),this.reflRT.texture.name="water-reflection",this.mats.uniforms.uReflection.value=this.reflRT.texture)):((e=this.post)==null||e.dispose(),this.post=null,this.reflRT&&(this.reflRT.dispose(),this.reflRT=null,this.mats.uniforms.uReflection.value=null,this.mats.releaseReflection()))}resize(){var a,l;let t=Math.max(1,Math.floor(window.innerWidth||this.canvas.clientWidth||1)),e=Math.max(1,Math.floor(window.innerHeight||this.canvas.clientHeight||1)),n=Math.min(window.devicePixelRatio||1,2)*Math.min(1,Math.max(.25,this.settings.resolutionScale||1));this.gl.setPixelRatio(n),this.gl.setSize(t,e,!0),this.camera.aspect=t/e,this.camera.updateProjectionMatrix();let s=this.gl.getContext(),r=s.drawingBufferWidth,o=s.drawingBufferHeight;this.highlight.setResolution(r,o,Db),this.sky.setPixelRatio(n),(a=this.post)==null||a.setSize(r,o),(l=this.reflRT)==null||l.setSize(Math.max(1,r>>1),Math.max(1,o>>1)),this.mats.uniforms.uScreenInv.value.set(1/r,1/o)}setHighlight(t,e,n,s){this.highlight.set(t,e,n,s)}breakParticles(t,e,n,s){this.particles.spawnBreak(t,e,n,s)}setParticleCollider(t){this.particles.setCollider(t)}setHeldBlock(t){this.hand.setBlock(t)}swing(){this.hand.swing()}render(t){if(this.disposed)return;let e=this.gl,n=this.mats.uniforms,s=this.camera;e.info.reset(),s.position.set(t.eye.x,t.eye.y,t.eye.z),s.rotation.set(t.pitch,t.yaw,0,"YXZ");let r=(t.bob.amount||0)*l3;if(r>0){let g=t.bob.phase;s.updateMatrix(),s.translateX(Math.sin(g)*r*.5),s.translateY(-Math.abs(Math.cos(g)*r)),s.rotation.z=-Math.sin(g)*r*3*Math.PI/180,s.rotation.x=t.pitch-Math.abs(Math.cos(g-.2)*r)*5*Math.PI/180}(t.fov!==this.lastFov||s.aspect!==this.lastAspect)&&(s.fov=t.fov,s.updateProjectionMatrix(),this.lastFov=t.fov,this.lastAspect=s.aspect),s.updateMatrixWorld(!0),n.uTime.value=t.time%14400,this.flickerT-=t.dt,this.flickerT<=0&&(this.flickerT=.08+Math.random()*.12,this.flickerTarget=.96+Math.random()*.06),this.flicker+=(this.flickerTarget-this.flicker)*Math.min(1,t.dt*10),n.uBlockLightColor.value.setRGB(this.flicker,this.flicker*.995,this.flicker*.985);let o=this.sky.update(t.dayTime,t.time,s.position),a=n.uFogColor.value;if(t.inLava)this.overrideFog(.62,.12,.01,0,1.6),n.uUnderwater.value=0,this.sky.setHidden(!0);else if(t.underwater){let g=Math.min(1,Math.max(0,t.handLight.sky/15)),b=.2+.8*Math.max(o.daylight*g,t.handLight.block/30);this.overrideFog(.07*b,.19*b,.42*b,0,12+22*o.daylight*g),n.uUnderwater.value=1,this.sky.setHidden(!0)}else n.uFogNear.value=this.fogFar*.62,n.uFogFar.value=this.fogFar*.98,n.uUnderwater.value=0,this.sky.setHidden(!1);n.uCamWrap.value.set(Un(s.position.x),Un(s.position.y),Un(s.position.z));let l=Math.floor(s.position.x),c=Math.floor(s.position.y),h=Math.floor(s.position.z);this.particles.setLight(t.handLight.sky,t.handLight.block),this.particles.update(t.dt,l,c,h),this.hand.update({dt:t.dt,aspect:s.aspect,yaw:t.yaw,pitch:t.pitch,bob:t.bob,light:t.handLight});let u=!!this.shadowRT&&n.uShadowStrength.value>.001&&!t.underwater&&!t.inLava;this.shadowRT&&!u&&(n.uShadowStrength.value=0),u&&this.renderShadows(s.position),this.cull(s,!0);let f=!1;this.reflRT&&!t.underwater&&!t.inLava&&s.position.y>Zo+.05&&this.seaVisible()&&(this.renderReflection(a),this.cull(s,!0),f=!0),n.uPlanarOn.value=f?1:0;let d=this.post;if(e.setRenderTarget(d?d.target:null),e.setClearColor(a,1),e.clear(!0,!0,!1),e.render(this.scene,s),d){let g=n.uSunDir.value,b=Math.min(1,n.uGlow.value/.85),p=g.y>0?Bb(0,.12,g.y)*(.6+.4*b):Bb(0,.12,-g.y)*.18;this.rayColor.copy(n.uSunColor.value),d.finish({camera:s,lightDir:n.uLightDir.value,lightStrength:p,rayColor:this.rayColor,fogColor:a,sunColor:n.uSunColor.value,fogFar:this.fogFar,dawnDusk:b,underwater:t.underwater||t.inLava})}t.showHand&&this.hand.render(e),this.shotQueue.length&&this.capture()}seaVisible(){let t=Math.floor(Zo/16);for(let e of this.sections.values())if(e.visible&&e.sy===t&&e.meshes[3])return!0;return!1}renderReflection(t){let e=this.gl,n=this.mats.uniforms,s=this.camera,r=this.mirrorCam;r.copy(s,!1),r.position.y=2*Zo-s.position.y,r.rotation.set(-s.rotation.x,s.rotation.y,-s.rotation.z,"YXZ"),r.updateMatrixWorld(!0);let o=this.sky.objects[0];o.position.y=r.position.y,o.updateMatrixWorld(!0);let a=[this.particles.mesh,this.highlight.mesh,this.layerGroups[2],this.layerGroups[3]],l=a.map(f=>f.visible);for(let f of a)f.visible=!1;let c=(f,d)=>{for(let g of f.children)g.material=d};c(this.layerGroups[0],this.mats.refl.opaque),c(this.layerGroups[1],this.mats.refl.cutout),c(this.layerGroups[4],this.mats.refl.lava),this.cull(r,!0),n.uCamWrap.value.set(Un(r.position.x),Un(r.position.y),Un(r.position.z));let h=n.uShadowMatrix.value;this.tmpM.copy(h),h.multiply(this.reflShift.makeTranslation(0,r.position.y-s.position.y,0)),e.setRenderTarget(this.reflRT),e.setClearColor(t,1),e.clear(!0,!0,!1),e.render(this.scene,r),c(this.layerGroups[0],this.mats.opaque),c(this.layerGroups[1],this.mats.cutout),c(this.layerGroups[4],this.mats.lava),a.forEach((f,d)=>{f.visible=l[d]}),h.copy(this.tmpM),o.position.y=s.position.y,o.updateMatrixWorld(!0);let u=s.position;n.uCamWrap.value.set(Un(u.x),Un(u.y),Un(u.z))}overrideFog(t,e,n,s,r){let o=this.mats.uniforms;for(let a of["uFogColor","uSkyTop","uSkyHorizon"])o[a].value.setRGB(t,e,n);o.uGlow.value=0,o.uFogNear.value=s,o.uFogFar.value=r}cull(t,e){this.projScreen.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this.frustum.setFromProjectionMatrix(this.projScreen);let n=this.camera.position.x,s=this.camera.position.z,r=this.fogFar+12,o=r*r,a=0,l=this.sphere;for(let c of this.sections.values()){let h=!0;if(e){let u=c.wx-n,f=c.wz-s;h=u*u+f*f<=o}if(h&&(l.center.set(c.wx,c.wy,c.wz),h=this.frustum.intersectsSphere(l)),h!==c.visible){c.visible=h;for(let u=0;u<Ch;u++){let f=c.meshes[u];f&&(f.visible=h)}}h&&a++}e&&(this.visibleSections=a)}renderShadows(t){let e=this.gl,n=this.mats.uniforms,s=this.shadowRT,r=n.uLightDir.value,o=this.shadowRadius,a=160,l=this.shadowCam;l.left=-o,l.right=o,l.top=o,l.bottom=-o,l.near=1,l.far=a*2,l.updateProjectionMatrix();let c=Math.abs(r.y)>.99?this.tmpV.set(0,0,-1):this.tmpV.set(0,1,0);l.up.copy(c),l.position.set(0,0,0),l.lookAt(-r.x,-r.y,-r.z),l.updateMatrixWorld(!0);let h=2*o/s.width,u=new V().setFromMatrixColumn(l.matrixWorld,0),f=new V().setFromMatrixColumn(l.matrixWorld,1),d=new V().setFromMatrixColumn(l.matrixWorld,2),g=t.x*u.x+t.y*u.y+t.z*u.z,b=t.x*f.x+t.y*f.y+t.z*f.z,p=t.x*d.x+t.y*d.y+t.z*d.z,m=Math.floor(g/h)*h,v=Math.floor(b/h)*h,y=new V().addScaledVector(u,m).addScaledVector(f,v).addScaledVector(d,p);l.position.copy(y).addScaledVector(r,a),l.updateMatrixWorld(!0);let _=this.tmpM.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1);n.uShadowMatrix.value.multiplyMatrices(_,l.projectionMatrix).multiply(l.matrixWorldInverse).multiply(new de().makeTranslation(this.camera.position.x,this.camera.position.y,this.camera.position.z)),n.uShadowBias.value=.03/(l.far-l.near);let S=[...this.sky.objects,this.particles.mesh,this.highlight.mesh,this.layerGroups[2],this.layerGroups[3],this.layerGroups[4]],A=S.map(x=>x.visible);for(let x of S)x.visible=!1;let R=(x,T)=>{for(let D of x.children)D.material=T};R(this.layerGroups[0],this.mats.depth.opaque),R(this.layerGroups[1],this.mats.depth.cutout),this.cull(l,!1),n.uCamWrap.value.set(Un(l.position.x),Un(l.position.y),Un(l.position.z)),e.setRenderTarget(s),e.setClearColor(this.white,1),e.clear(!0,!0,!1),e.render(this.scene,l),e.setRenderTarget(null),R(this.layerGroups[0],this.mats.opaque),R(this.layerGroups[1],this.mats.cutout),S.forEach((x,T)=>{x.visible=A[T]});let P=this.camera.position;n.uCamWrap.value.set(Un(P.x),Un(P.y),Un(P.z))}screenshot(){return new Promise((t,e)=>{this.shotQueue.push({resolve:t,reject:e})})}capture(){let t=this.shotQueue.splice(0);try{this.canvas.toBlob(e=>{for(let n of t)e?n.resolve(e):n.reject(new Error("toBlob failed"))},"image/png")}catch(e){for(let n of t)n.reject(e)}}stats(){let t=this.gl.info.render;return{drawCalls:t.calls,triangles:t.triangles,sections:this.sections.size,visibleSections:this.visibleSections}}get three(){return this.gl}dispose(){var t;if(!this.disposed){this.disposed=!0,this.clear(),this.sky.dispose(),this.particles.dispose(),this.highlight.dispose(),this.hand.dispose(),this.mats.dispose(),(t=this.shadowRT)==null||t.dispose(),this.setUltra(!1),this.gl.dispose();for(let e of this.shotQueue.splice(0))e.reject(new Error("renderer disposed"))}}};var h3=new Set(["Tab","Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Slash","Quote","Backspace"]),u3=new Set(["KeyA","KeyB","KeyD","KeyE","KeyF","KeyG","KeyH","KeyJ","KeyK","KeyL","KeyO","KeyP","KeyQ","KeyS","KeyU","KeyW","KeyY","KeyZ","Space","Equal","Minus","NumpadAdd","NumpadSubtract","Digit0","Digit1","Digit2","Digit3","Digit4","Digit5","Digit6","Digit7","Digit8","Digit9"]),d3=new Set(["button","checkbox","radio","range","submit","reset","color","file","image"]),sp=1300,Fb=500;function f3(i){let t=i;if(!t||typeof t.tagName!="string")return!1;let e=t.tagName;return e==="TEXTAREA"||e==="SELECT"?!0:e==="INPUT"?!d3.has(t.type):t.isContentEditable===!0}function Ob(i){let t=i;if(!t||typeof t.tagName!="string")return!1;let e=t.tagName;return e==="BUTTON"||e==="INPUT"||e==="SELECT"||e==="TEXTAREA"||e==="A"||t.isContentEditable===!0}function zb(i){if(i.code)return i.code;let t=i.key;if(!t)return"";if(t===" ")return"Space";if(t.length===1){let e=t.toUpperCase();if(e>="A"&&e<="Z")return"Key"+e;if(e>="0"&&e<="9")return"Digit"+e}return t==="Shift"?"ShiftLeft":t==="Control"?"ControlLeft":t==="Alt"?"AltLeft":t==="Esc"?"Escape":t}function rp(i){return i.length===6&&i.startsWith("Mouse")?i.charCodeAt(5)-48:-1}var Hb=i=>new Promise(t=>setTimeout(t,i)),fl=()=>typeof performance!="undefined"?performance.now():Date.now(),Ph=class{constructor(t){this.mouseDX=0;this.mouseDY=0;this.wheel=0;this.buttons=[!1,!1,!1];this.clicked=[!1,!1,!1];this.onLockChange=null;this.onKey=null;this.lastLockError=null;this._enabled=!0;this._virtualLock=!1;this.held=new Set;this.edges=new Set;this.wasLocked=!1;this.selfExit=!1;this.userExitAt=-1e9;this.anyExitAt=-1e9;this.lockedAt=-1e9;this.lastMoveAt=-1e9;this.lastMoveMag=0;this.wheelAcc=0;this.wheelAt=0;this.unadjusted=null;this.pending=null;this.pulses=new Set;this.onLockEvent=()=>{var n;let t=document.pointerLockElement===this.target;if(t===this.wasLocked)return;this.wasLocked=t;let e=fl();t?(this.lockedAt=e,this.lastMoveMag=0,this.clearMouse()):(this.anyExitAt=e,this.selfExit||(this.userExitAt=e),this.selfExit=!1,this.buttons[0]=this.buttons[1]=this.buttons[2]=!1),this._virtualLock||(n=this.onLockChange)==null||n.call(this,t)};this.onKeyDown=t=>{let e=zb(t);if(!e)return;let n=f3(t.target);n||this.held.has(e)||(this.held.add(e),this._enabled&&!t.repeat&&this.edges.add(e));let s=this._enabled||this.locked;e==="F1"||e==="F2"||e==="F3"?t.preventDefault():n||((s&&h3.has(e)||!s&&(e==="Space"||e.startsWith("Arrow"))&&!Ob(t.target))&&t.preventDefault(),s&&(t.ctrlKey||t.metaKey)&&u3.has(e)&&t.preventDefault()),!t.repeat&&this.onKey&&this.onKey(e,t)};this.onKeyUp=t=>{let e=zb(t);this.held.delete(e),(e==="MetaLeft"||e==="MetaRight")&&this.held.clear()};this.releaseAll=()=>{this.held.clear(),this.edges.clear(),this.buttons[0]=this.buttons[1]=this.buttons[2]=!1};this.onMouseDown=t=>{if(t.button===1&&t.preventDefault(),t.button<0||t.button>4||!this._enabled||document.pointerLockElement!==this.target)return;t.button>2&&t.preventDefault();let e="Mouse"+t.button;t.button<=2&&(this.buttons[t.button]=!0,this.clicked[t.button]=!0),this.held.has(e)||(this.held.add(e),this.edges.add(e)),this.onKey&&this.onKey(e,t)};this.onMouseUp=t=>{t.button>=0&&t.button<=2&&(this.buttons[t.button]=!1),t.button>=0&&t.button<=4&&this.held.delete("Mouse"+t.button)};this.onMouseMove=t=>{if(document.pointerLockElement!==this.target||!this._enabled)return;let e=t.movementX||0,n=t.movementY||0,s=fl(),r=Math.max(Math.abs(e),Math.abs(n));if(r>Fb){let o=s-this.lockedAt<400,a=s-this.lastMoveAt>50||this.lastMoveMag<Fb*.25;if(o||a){this.lastMoveAt=s,this.lastMoveMag=0;return}}this.lastMoveAt=s,this.lastMoveMag=r,this.mouseDX+=e,this.mouseDY+=n};this.onWheel=t=>{if(t.ctrlKey&&t.preventDefault(),!this._enabled||!this.locked)return;t.preventDefault();let e=t.deltaY;if(!e)return;if(t.deltaMode===1){this.wheel+=Math.sign(e)*Math.max(1,Math.round(Math.abs(e)/3));return}if(t.deltaMode===2){this.wheel+=Math.sign(e);return}let n=fl();if(Math.abs(e)>=50)this.wheel+=Math.sign(e)*Math.max(1,Math.round(Math.abs(e)/100)),this.wheelAcc=0;else for((n-this.wheelAt>250||Math.sign(this.wheelAcc)!==Math.sign(e))&&(this.wheelAcc=0),this.wheelAcc+=e;Math.abs(this.wheelAcc)>=50;){let s=Math.sign(this.wheelAcc);this.wheel+=s,this.wheelAcc-=s*50}this.wheelAt=n};this.target=t,window.addEventListener("keydown",this.onKeyDown),window.addEventListener("keyup",this.onKeyUp),window.addEventListener("blur",this.releaseAll),document.addEventListener("visibilitychange",()=>{document.hidden&&this.releaseAll()}),t.addEventListener("mousedown",this.onMouseDown),window.addEventListener("mouseup",this.onMouseUp),document.addEventListener("mousemove",this.onMouseMove),window.addEventListener("wheel",this.onWheel,{passive:!1}),t.addEventListener("contextmenu",e=>e.preventDefault()),document.addEventListener("contextmenu",e=>{(this.locked||this._enabled&&e.target===t)&&e.preventDefault()}),t.addEventListener("auxclick",e=>{e.button===1&&e.preventDefault()}),window.addEventListener("mousedown",e=>{e.button===1&&(this.locked||e.target===t||!Ob(e.target))&&e.preventDefault()}),document.addEventListener("pointerlockchange",this.onLockEvent),document.addEventListener("pointerlockerror",()=>{this.lastLockError="pointerlockerror"})}get enabled(){return this._enabled}set enabled(t){t!==this._enabled&&(this._enabled=t,this.edges.clear(),this.clearMouse())}get locked(){return this._virtualLock||typeof document!="undefined"&&document.pointerLockElement===this.target}get virtualLock(){return this._virtualLock}set virtualLock(t){var n;if(t===this._virtualLock)return;let e=this.locked;this._virtualLock=t,this.locked!==e&&((n=this.onLockChange)==null||n.call(this,this.locked))}down(t){return this._enabled&&this.held.has(t)}pressed(t){return this._enabled&&this.edges.has(t)}actionDown(t){if(!this._enabled)return!1;let e=Os(t),n=rp(e);return n>=0&&n<=2&&this.buttons[n]?!0:this.held.has(e)||e==="ShiftLeft"&&this.held.has("ShiftRight")||e==="ControlLeft"&&this.held.has("ControlRight")}actionPressed(t){if(!this._enabled)return!1;let e=Os(t),n=rp(e);return n>=0&&n<=2&&this.clicked[n]?!0:this.edges.has(e)||e==="ShiftLeft"&&this.edges.has("ShiftRight")||e==="ControlLeft"&&this.edges.has("ControlRight")}setAction(t,e){let n=Os(t),s=rp(n);if(s>=0&&s<=2){e&&!this.buttons[s]&&(this.clicked[s]=!0),this.buttons[s]=e;return}e?this.held.has(n)||(this.held.add(n),this.edges.add(n)):this.held.delete(n)}tapAction(t){this.setAction(t,!0),this.pulses.add(t)}requestLock(){if(this.locked)return Promise.resolve(!0);if(this.pending)return this.pending;let t=this.lock().catch(e=>(this.lastLockError=String(e),!1));return this.pending=t,t.then(()=>{this.pending===t&&(this.pending=null)}),t}exitLock(){if(typeof document!="undefined"&&document.pointerLockElement===this.target){this.selfExit=!0;try{document.exitPointerLock()}catch{}}}endFrame(){if(this.pulses.size){for(let t of this.pulses)this.setAction(t,!1);this.pulses.clear()}this.edges.clear(),this.mouseDX=0,this.mouseDY=0,this.wheel=0,this.clicked[0]=this.clicked[1]=this.clicked[2]=!1}async lock(){if(typeof this.target.requestPointerLock!="function")return this.lastLockError="pointer lock unsupported",!1;let e=this.userExitAt+sp-fl();if(e>0&&(await Hb(e),!this._enabled||this.locked))return this.locked;let n=await this.attempt(this.unadjusted!==!1);if(n==="unsupported"&&(this.unadjusted=!1,n=await this.attempt(!1)),n==="ok")return this.unadjusted===null&&(this.unadjusted=!0),!0;let s=fl()-this.anyExitAt;return n==="failed"&&s<sp&&this._enabled?(await Hb(sp-s),this._enabled?this.locked?!0:await this.attempt(this.unadjusted!==!1)==="ok":this.locked):this.locked}attempt(t){let e=this.target;return new Promise(n=>{let s=!1,r,o=h=>{s||(s=!0,r!==void 0&&clearTimeout(r),document.removeEventListener("pointerlockchange",a),document.removeEventListener("pointerlockerror",l),n(h))},a=()=>{document.pointerLockElement===e&&o("ok")},l=()=>{this.lastLockError="pointerlockerror",o("failed")};document.addEventListener("pointerlockchange",a),document.addEventListener("pointerlockerror",l),r=setTimeout(()=>o(document.pointerLockElement===e?"ok":"failed"),2e3);let c;try{c=t?e.requestPointerLock({unadjustedMovement:!0}):e.requestPointerLock()}catch(h){this.lastLockError=String(h);let u=h==null?void 0:h.name;o(t&&(u==="NotSupportedError"||h instanceof TypeError)?"unsupported":"failed");return}c&&typeof c.then=="function"&&c.then(()=>o("ok"),h=>{this.lastLockError=String(h);let u=h==null?void 0:h.name;o(t&&u==="NotSupportedError"?"unsupported":"failed")})})}clearMouse(){this.mouseDX=0,this.mouseDY=0,this.wheel=0,this.buttons[0]=this.buttons[1]=this.buttons[2]=!1,this.clicked[0]=this.clicked[1]=this.clicked[2]=!1}};var Gb={break:{gain:1,len:1},place:{gain:.8,len:.75},step:{gain:.32,len:.55},use:{gain:.75,len:1},splash:{gain:.8,len:1},click:{gain:.5,len:1}},op=class{constructor(t,e,n,s,r){this.ctx=t;this.out=e;this.noise=n;this.t0=s;this.rnd=r;this.end=0}noiseBurst(t,e,n,s,r,o,a,l=0){let c=this.ctx,h=this.t0+t,u=o+a*6,f=c.createBufferSource();f.buffer=this.noise;let d=c.createBiquadFilter();d.type=e,d.frequency.setValueAtTime(n,h),l>0&&d.frequency.exponentialRampToValueAtTime(l,h+u),d.Q.value=s;let g=c.createGain();g.gain.setValueAtTime(0,h),g.gain.linearRampToValueAtTime(r,h+Math.max(.001,o)),g.gain.setTargetAtTime(0,h+Math.max(.001,o),a),f.connect(d),d.connect(g),g.connect(this.out);let b=this.rnd()*Math.max(0,this.noise.duration-u-.01);f.start(h,b),f.stop(h+u),this.end=Math.max(this.end,h+u)}tone(t,e,n,s,r,o,a,l=.05){let c=this.ctx,h=this.t0+t,u=o+a*6,f=c.createOscillator();f.type=e,f.frequency.setValueAtTime(Math.max(20,n),h),s!==n&&f.frequency.exponentialRampToValueAtTime(Math.max(20,s),h+Math.max(.005,l));let d=c.createGain();d.gain.setValueAtTime(0,h),d.gain.linearRampToValueAtTime(r,h+Math.max(.001,o)),d.gain.setTargetAtTime(0,h+Math.max(.001,o),a),f.connect(d),d.connect(this.out),f.start(h),f.stop(h+u),this.end=Math.max(this.end,h+u)}grains(t,e,n,s,r,o,a){for(let l=0;l<t;l++){let c=l/t*e+this.rnd()*(e/t),h=s*(.7+this.rnd()*.6);this.noiseBurst(c,n,h,r,o*(.5+this.rnd()*.5),.001,a*(.6+this.rnd()*.8))}}},Lh=class{constructor(){this.ctx=null;this.master=null;this.noise=null;this.volume=.6;this.ends=[];this.offline=!1;this.seed=2654435769;this.listening=!1;this.onGesture=()=>{this.unlock();let t=this.ctx;if(t&&t.state==="running"&&this.listening){this.listening=!1;for(let e of["pointerdown","mousedown","keydown","touchend"])window.removeEventListener(e,this.onGesture,!0)}};if(typeof window!="undefined"){this.listening=!0;for(let t of["pointerdown","mousedown","keydown","touchend"])window.addEventListener(t,this.onGesture,!0)}}unlock(){if(typeof window!="undefined")try{if(!this.ctx){let e=window.AudioContext||window.webkitAudioContext;if(!e)return;this.attach(new e({latencyHint:"interactive"}))}let t=this.ctx;t.state==="suspended"&&typeof t.resume=="function"&&t.resume().catch(()=>{})}catch{}}setVolume(t){this.volume=Math.max(0,Math.min(1,Number.isFinite(t)?t:0)),this.master&&this.ctx&&this.master.gain.setTargetAtTime(this.masterGain(),this.ctx.currentTime,.02)}play(t,e,n){var h;let s=this.ctx;if(!s||!this.master||!this.noise||this.volume<=0||!this.offline&&s.state!=="running")return;let r=s.currentTime;if(this.ends=this.ends.filter(u=>u>r),this.ends.length>=24)return;let o=(n!=null?n:1)*(.92+this.rand()*.16),a=s.createGain(),l=(h=Gb[t])!=null?h:Gb.place;a.gain.value=l.gain,a.connect(this.master);let c=new op(s,a,this.noise,r+.005,()=>this.rand());try{this.synth(c,t,e,o,l.len)}catch{}this.ends.push(c.end||r+.2)}attach(t,e){this.ctx=t,this.offline=typeof OfflineAudioContext!="undefined"&&t instanceof OfflineAudioContext;let n=t.createDynamicsCompressor();n.threshold.value=-10,n.knee.value=8,n.ratio.value=4,n.attack.value=.002,n.release.value=.15,n.connect(e!=null?e:t.destination),this.master=t.createGain(),this.master.gain.value=this.masterGain(),this.master.connect(n);let s=Math.floor(t.sampleRate*1.5);this.noise=t.createBuffer(1,s,t.sampleRate);let r=this.noise.getChannelData(0);for(let o=0;o<s;o++)r[o]=this.rand()*2-1}masterGain(){return this.volume*this.volume*.9+this.volume*.1}rand(){let t=this.seed;return t^=t<<13,t>>>=0,t^=t>>>17,t^=t<<5,t>>>=0,this.seed=t,t/4294967296}synth(t,e,n,s,r){let o=()=>this.rand();if(e==="click"){t.tone(0,"square",1100*s,900*s,.18,.001,.012,.02),t.tone(0,"sine",2200*s,2e3*s,.12,.001,.008);return}if(e==="splash"||n==="liquid"){this.splash(t,e,s);return}if(e==="use"){this.useSound(t,n,s);return}let a=e==="break",l=e==="step";switch(n){case"stone":{let c=a?3:l?1:2;for(let h=0;h<c;h++)t.noiseBurst(h*.018+o()*.01,"bandpass",(1700+o()*1300)*s,1.1,.9,.001,.025*r);t.tone(0,"triangle",170*s,70*s,a?.5:.35,.001,.03*r),t.noiseBurst(0,"highpass",5e3*s,.7,.25,.001,.008);break}case"wood":{let c=(210+o()*60)*s;t.tone(0,"triangle",c*1.7,c,.6,.001,.045*r,.03),t.tone(0,"sine",c*2.9,c*2.5,.25,.001,.025*r),t.noiseBurst(0,"bandpass",950*s,2.2,.55,.001,.03*r),a&&(t.tone(.045,"triangle",c*1.4,c*.9,.35,.001,.04),t.grains(4,.08,"highpass",2600*s,.8,.25,.012));break}case"grass":t.grains(a?9:l?4:6,(a?.17:.1)*r,"bandpass",4200*s,.7,.75,.014),t.noiseBurst(0,"highpass",2500*s,.6,.25,.006,.04*r);break;case"gravel":t.grains(a?12:l?5:8,(a?.18:.11)*r,"bandpass",1300*s,1,.85,.016),t.noiseBurst(0,"lowpass",700*s,.7,.35,.004,.05*r);break;case"sand":t.noiseBurst(0,"lowpass",2600*s,.6,.55,.02,.07*r),t.grains(a?5:3,.12*r,"bandpass",2200*s,.7,.3,.02);break;case"glass":if(a){t.noiseBurst(0,"highpass",3800*s,.7,.7,.001,.07);for(let c=0;c<6;c++)t.tone(o()*.07,"sine",(2400+o()*3600)*s,(2300+o()*3400)*s,.16,.001,.06+o()*.1)}else t.noiseBurst(0,"bandpass",3400*s,1.4,.7,.001,.018*r),t.tone(0,"sine",(2600+o()*900)*s,2500*s,l?.08:.14,.001,.05*r),t.tone(0,"triangle",220*s,110*s,.2,.001,.02);break;case"wool":t.noiseBurst(0,"lowpass",520*s,.8,.9,.008,.05*r),t.tone(0,"sine",110*s,70*s,.35,.004,.04*r);break;case"metal":{let c=(a?700:1150)*s*(.95+o()*.1);t.tone(0,"sine",c,c,.32,.001,.16*r),t.tone(0,"sine",c*2.76,c*2.76,.18,.001,.08*r),t.tone(0,"sine",c*5.4,c*5.4,.08,.001,.04*r),t.noiseBurst(0,"highpass",5e3*s,.7,.35,.001,.01),a&&t.tone(.03,"triangle",c*.5,c*.45,.25,.001,.08);break}case"snow":t.grains(a?7:l?3:5,.12*r,"lowpass",1500*s,.7,.6,.02),t.noiseBurst(0,"lowpass",900*s,.6,.3,.01,.05*r);break;case"slime":{let c=(180+o()*40)*s;t.tone(0,"sine",c*.7,c*1.6,.5,.005,.06*r,.06),t.tone(.04,"sine",c*1.5,c*.8,.3,.005,.05*r,.05),t.noiseBurst(0,"bandpass",500*s,1.5,.45,.01,.06*r,1600*s);break}default:t.noiseBurst(0,"bandpass",2e3*s,1,.8,.001,.03*r)}}splash(t,e,n){let s=()=>this.rand(),r=e==="step"||e==="place";t.noiseBurst(0,"bandpass",2600*n,.8,r?.5:.85,.01,r?.06:.14,420*n),t.noiseBurst(0,"lowpass",900*n,.6,r?.25:.45,.02,r?.05:.12);let o=r?2:5;for(let a=0;a<o;a++){let l=(350+s()*500)*n;t.tone(.05+s()*.25,"sine",l,l*2.2,.12,.002,.02,.04)}}useSound(t,e,n){if(e==="wood"){let s=(130+this.rand()*30)*n;t.tone(0,"sawtooth",s,s*.8,.09,.03,.06,.2),t.noiseBurst(0,"bandpass",700*n,4,.25,.03,.06),t.tone(.12,"triangle",380*n,200*n,.55,.001,.04,.03),t.noiseBurst(.12,"bandpass",1e3*n,2,.45,.001,.025)}else e==="metal"?(t.tone(0,"square",220*n,180*n,.12,.002,.05),t.tone(.06,"sine",900*n,900*n,.3,.001,.12),t.noiseBurst(.06,"highpass",4e3*n,.7,.3,.001,.015)):this.synth(t,"place",e,n,.8)}};var pl=["grass_block","stone","oak_planks","oak_log","cobblestone","glass","torch","oak_stairs","bricks"].map(i=>{var t;return(t=yt[i])!=null?t:0}),Ih=class{constructor(){this.slots=pl.slice();this.selected=0;this.listeners=[]}onChange(t){this.listeners.push(t)}emit(){for(let t of this.listeners)t()}current(){var t;return(t=this.slots[this.selected])!=null?t:0}select(t){let e=(t%9+9)%9;e!==this.selected&&(this.selected=e,this.emit())}scroll(t){t&&this.select(this.selected+t)}set(t,e){t<0||t>8||(this.slots[t]=e,this.emit())}firstFree(){return this.slots.indexOf(0)}pick(t){if(!t)return;let e=this.slots.indexOf(t);if(e>=0){this.select(e);return}let n=this.firstFree();if(n>=0){this.slots[n]=t,this.selected=n,this.emit();return}this.set(this.selected,t)}load(t,e){var n;for(let s=0;s<9;s++)this.slots[s]=(n=t[s])!=null?n:0;this.selected=Math.max(0,Math.min(8,e|0)),this.emit()}};var As=new Uint8Array(65536),Ti=new Uint8Array(65536),na=new Uint8Array(65536),Zr=4,aa=8;(function(){for(let t=0;t<65536;t++){let e=t&1023,n=t>>10;if(e>=xt||e===0)continue;let s=Ul[e],r=0,o=jt[e];o===j.slab?n===2?s=an[e]===An.opaque?15:s:r=n===1?Zr:aa:o===j.stairs&&(r=(n&4?Zr:aa)|1<<Vr[n&3]),As[t]=s,Ti[t]=s>=15?0:r,na[t]=ao[e]}})();function Wb(i){if(Ti[i]&Zr)return 0;let t=As[i];return t===0?15:t>=15?0:15-t}var ml=class{constructor(t){this.head=0;this.tail=0;this.buf=new Int32Array(1<<t),this.mask=(1<<t)-1}push(t){this.buf[this.tail]=t,this.tail=this.tail+1&this.mask,this.tail===this.head&&this.grow()}grow(){let t=this.buf,e=t.length,n=new Int32Array(e*2);n.set(t.subarray(this.head),0),n.set(t.subarray(0,this.head),e-this.head),this.buf=n,this.mask=e*2-1,this.head=0,this.tail=e}clear(){this.head=this.tail=0}},Es=5,ki=25,Hn=12,ia=new Int8Array(ki),sa=new Int8Array(ki),ra=new Int8Array(ki),oa=new Int8Array(ki),qb=new Uint8Array(ki);for(let i=0;i<ki;i++){let t=i%Es,e=i/Es|0;ia[i]=t<Es-1?i+1:-1,sa[i]=t>0?i-1:-1,ra[i]=e<Es-1?i+Es:-1,oa[i]=e>0?i-Es:-1,qb[i]=(e+1)*7+t+1}var Uh=2,Dh=1,Vb=aa,$b=Zr,Nh=32,Bh=16,Fh=class{constructor(t){this.ocx=0;this.ocz=0;this.wc=new Array(ki).fill(null);this.wb=new Array(ki).fill(null);this.wl=new Array(ki).fill(null);this.aq=new ml(15);this.bq=new ml(15);this.rq=new ml(14);this.dm=new Uint16Array(49);this.noTouchSlot=-1;this.sunH=new Uint16Array(256);this.work=0;this.host=t}setWindow(t,e,n){var r;this.ocx=t,this.ocz=e;let s=this.host.chunks;for(let o=0;o<ki;o++){let a=o%Es-2,l=(o/Es|0)-2,c=o===Hn&&n?n:(r=s.get(Me(t+a,e+l)))!=null?r:null;this.wc[o]=c,this.wb[o]=c?c.blocks:null,this.wl[o]=c?c.light:null}}releaseWindow(){for(let t=0;t<ki;t++)this.wc[t]=null,this.wb[t]=null,this.wl[t]=null}touch(t,e){if(t===this.noTouchSlot)return;let n=e>>8,s=n&15,r=n>>4,o=1<<r;s===0?r>0&&(o|=1<<r-1):s===15&&r<15&&(o|=1<<r+1);let a=this.dm,l=qb[t],c=e&15,h=e>>4&15;a[l]|=o,c===0?a[l-1]|=o:c===15&&(a[l+1]|=o),h===0?(a[l-7]|=o,c===0?a[l-8]|=o:c===15&&(a[l-6]|=o)):h===15&&(a[l+7]|=o,c===0?a[l+6]|=o:c===15&&(a[l+8]|=o))}flushDirty(){var n;let t=this.dm,e=this.host.dirtySections;for(let s=0;s<49;s++){let r=t[s];if(!r)continue;t[s]=0;let o=s%7-3,a=(s/7|0)-3,l=o>=-2&&o<=2&&a>=-2&&a<=2?this.wc[(a+2)*Es+o+2]:(n=this.host.chunks.get(Me(this.ocx+o,this.ocz+a)))!=null?n:null;if(l)for(let c=0;c<16;c++)r&1<<c&&l.counts[c]>0&&e.add(_n(l.cx,c,l.cz))}}relaxSky(t,e,n,s,r){let o=this.wl[t];if(!o)return;let a=this.wb[t][e];if(Ti[a]&s)return;let l=As[a],c=r&&n===15&&l===0?15:n-(l>1?l:1);if(c<=0)return;let h=o[e];h>>4>=c||(o[e]=h&15|c<<4,this.touch(t,e),this.aq.push(t<<16|e))}propagateSky(){let t=this.aq,e=this.wl,n=this.wb,s=0;for(;t.head!==t.tail;){let r=t.buf[t.head];t.head=t.head+1&t.mask,s++;let o=r>>>16,a=r&65535,l=e[o][a]>>4;if(l<=1)continue;let c=Ti[n[o][a]],h=a&15,u=a>>4&15,f=a>>8;if(f>0&&!(c&aa)&&this.relaxSky(o,a-256,l,$b,!0),f<255&&!(c&Zr)&&this.relaxSky(o,a+256,l,Vb,!1),!(c&1))if(h<15)this.relaxSky(o,a+1,l,Uh,!1);else{let d=ia[o];d>=0&&this.relaxSky(d,a-15,l,Uh,!1)}if(!(c&2))if(h>0)this.relaxSky(o,a-1,l,Dh,!1);else{let d=sa[o];d>=0&&this.relaxSky(d,a+15,l,Dh,!1)}if(!(c&16))if(u<15)this.relaxSky(o,a+16,l,Nh,!1);else{let d=ra[o];d>=0&&this.relaxSky(d,a-240,l,Nh,!1)}if(!(c&32))if(u>0)this.relaxSky(o,a-16,l,Bh,!1);else{let d=oa[o];d>=0&&this.relaxSky(d,a+240,l,Bh,!1)}}t.clear(),this.work+=s}relaxBlock(t,e,n,s){let r=this.wl[t];if(!r)return;let o=this.wb[t][e];if(Ti[o]&s)return;let a=As[o],l=n-(a>1?a:1);if(l<=0)return;let c=r[e];(c&15)>=l||(r[e]=c&240|l,this.touch(t,e),this.bq.push(t<<16|e))}propagateBlock(){let t=this.bq,e=this.wl,n=this.wb,s=0;for(;t.head!==t.tail;){let r=t.buf[t.head];t.head=t.head+1&t.mask,s++;let o=r>>>16,a=r&65535,l=e[o][a]&15;if(l<=1)continue;let c=Ti[n[o][a]],h=a&15,u=a>>4&15,f=a>>8;if(f>0&&!(c&aa)&&this.relaxBlock(o,a-256,l,$b),f<255&&!(c&Zr)&&this.relaxBlock(o,a+256,l,Vb),!(c&1))if(h<15)this.relaxBlock(o,a+1,l,Uh);else{let d=ia[o];d>=0&&this.relaxBlock(d,a-15,l,Uh)}if(!(c&2))if(h>0)this.relaxBlock(o,a-1,l,Dh);else{let d=sa[o];d>=0&&this.relaxBlock(d,a+15,l,Dh)}if(!(c&16))if(u<15)this.relaxBlock(o,a+16,l,Nh);else{let d=ra[o];d>=0&&this.relaxBlock(d,a-240,l,Nh)}if(!(c&32))if(u>0)this.relaxBlock(o,a-16,l,Bh);else{let d=oa[o];d>=0&&this.relaxBlock(d,a+240,l,Bh)}}t.clear(),this.work+=s}unSky(t,e,n,s){let r=this.wl[t];if(!r)return;let o=r[e],a=o>>4;if(a!==0)if(a<n||s&&n===15&&a===15){if(r[e]=o&15,this.touch(t,e),this.rq.push(t<<20|e<<4|a),e>>8===255){let l=Wb(this.wb[t][e]);l>0&&(r[e]=r[e]&15|l<<4,this.aq.push(t<<16|e))}}else this.aq.push(t<<16|e)}unpropagateSky(){let t=this.rq,e=0;for(;t.head!==t.tail;){let n=t.buf[t.head];t.head=t.head+1&t.mask,e++;let s=n>>>20,r=n>>>4&65535,o=n&15,a=r&15,l=r>>4&15,c=r>>8;if(c>0&&this.unSky(s,r-256,o,!0),c<255&&this.unSky(s,r+256,o,!1),a<15)this.unSky(s,r+1,o,!1);else{let h=ia[s];h>=0&&this.unSky(h,r-15,o,!1)}if(a>0)this.unSky(s,r-1,o,!1);else{let h=sa[s];h>=0&&this.unSky(h,r+15,o,!1)}if(l<15)this.unSky(s,r+16,o,!1);else{let h=ra[s];h>=0&&this.unSky(h,r-240,o,!1)}if(l>0)this.unSky(s,r-16,o,!1);else{let h=oa[s];h>=0&&this.unSky(h,r+240,o,!1)}}t.clear(),this.work+=e}unBlock(t,e,n){let s=this.wl[t];if(!s)return;let r=s[e],o=r&15;if(o!==0)if(o<n){s[e]=r&240,this.touch(t,e),this.rq.push(t<<20|e<<4|o);let a=na[this.wb[t][e]];a>0&&(s[e]=s[e]&240|a,this.bq.push(t<<16|e))}else this.bq.push(t<<16|e)}unpropagateBlock(){let t=this.rq,e=0;for(;t.head!==t.tail;){let n=t.buf[t.head];t.head=t.head+1&t.mask,e++;let s=n>>>20,r=n>>>4&65535,o=n&15,a=r&15,l=r>>4&15,c=r>>8;if(c>0&&this.unBlock(s,r-256,o),c<255&&this.unBlock(s,r+256,o),a<15)this.unBlock(s,r+1,o);else{let h=ia[s];h>=0&&this.unBlock(h,r-15,o)}if(a>0)this.unBlock(s,r-1,o);else{let h=sa[s];h>=0&&this.unBlock(h,r+15,o)}if(l<15)this.unBlock(s,r+16,o);else{let h=ra[s];h>=0&&this.unBlock(h,r-240,o)}if(l>0)this.unBlock(s,r-16,o);else{let h=oa[s];h>=0&&this.unBlock(h,r+240,o)}}t.clear(),this.work+=e}seedAround(t,e,n,s){let r=e&15,o=e>>4&15,a=e>>8;a>0&&this.seedCell(t,e-256,n,s),a<255&&this.seedCell(t,e+256,n,s),r<15?this.seedCell(t,e+1,n,s):this.seedCell(ia[t],e-15,n,s),r>0?this.seedCell(t,e-1,n,s):this.seedCell(sa[t],e+15,n,s),o<15?this.seedCell(t,e+16,n,s):this.seedCell(ra[t],e-240,n,s),o>0?this.seedCell(t,e-16,n,s):this.seedCell(oa[t],e+240,n,s)}seedCell(t,e,n,s){if(t<0)return;let r=this.wl[t];if(!r)return;let o=r[e];n&&o>>4>1&&this.aq.push(t<<16|e),s&&(o&15)>1&&this.bq.push(t<<16|e)}update(t,e,n,s,r,o){let a=As[r]!==As[o]||Ti[r]!==Ti[o];if(!(a||na[r]!==na[o]))return;this.setWindow(t.cx,t.cz,t),this.noTouchSlot=-1;let c=n<<8|s<<4|e,h=t.light;if(a){let d=h[c]>>4;if(d>0&&(h[c]&=15,this.touch(Hn,c),this.rq.push(Hn<<20|c<<4|d),this.unpropagateSky()),this.seedAround(Hn,c,!0,!1),n===255){let g=Wb(o);g>h[c]>>4&&(h[c]=h[c]&15|g<<4,this.touch(Hn,c),this.aq.push(Hn<<16|c))}this.propagateSky()}let u=h[c]&15;u>0&&(h[c]&=240,this.touch(Hn,c),this.rq.push(Hn<<20|c<<4|u),this.unpropagateBlock()),this.seedAround(Hn,c,!1,!0);let f=na[o];f>(h[c]&15)&&(h[c]=h[c]&240|f,this.touch(Hn,c),this.bq.push(Hn<<16|c)),this.propagateBlock(),this.flushDirty(),this.releaseWindow()}initChunk(t){this.setWindow(t.cx,t.cz,t),this.noTouchSlot=Hn;let e=t.light,n=t.blocks,s=t.counts;e.fill(0);let r=-1;for(let u=15;u>=0;u--)if(s[u]>0){r=u;break}let o=(r+1)*16-1;o<255&&e.fill(240,o+1<<8);let a=this.sunH,l=this.aq,c=this.bq,h=Hn<<16;for(let u=0;u<16;u++)for(let f=0;f<16;f++){let d=15,g=0,b=o+1;for(let p=o;p>=0;p--){let m=p<<8|u<<4|f,v=n[m],y=Ti[v];if(g&aa||y&Zr)break;let _=As[v];if((d!==15||_!==0)&&(d-=_>1?_:1,d<=0))break;e[m]=d<<4,d===15?b=p:d>1&&l.push(h|m),g=y}a[u<<4|f]=b}for(let u=0;u<16;u++)for(let f=0;f<16;f++){let d=u<<4|f,g=a[d],b=g;f>0&&a[d-1]>b&&(b=a[d-1]),f<15&&a[d+1]>b&&(b=a[d+1]),u>0&&a[d-16]>b&&(b=a[d-16]),u<15&&a[d+16]>b&&(b=a[d+16]);for(let p=g;p<b;p++)l.push(h|p<<8|d)}for(let u=0;u<=r;u++){if(!s[u])continue;let f=u+1<<12;for(let d=u<<12;d<f;d++){let g=na[n[d]];g&&(e[d]|=g,c.push(h|d))}}this.borderSeeds(t,r,13,15,0,1),this.borderSeeds(t,r,11,0,15,1),this.borderSeeds(t,r,17,15,0,16),this.borderSeeds(t,r,7,0,15,16),this.propagateSky(),this.propagateBlock(),this.noTouchSlot=-1,this.flushDirty(),t.lit=!0,this.releaseWindow()}borderSeeds(t,e,n,s,r,o){let a=this.wc[n];if(!a)return;let l=-1;for(let _=15;_>=0;_--)if(a.counts[_]>0){l=_;break}let c=Math.min(255,(Math.max(e,l)+1)*16+15),h=t.light,u=t.blocks,f=a.light,d=a.blocks,g,b;o===1?(g=s===15?1:2,b=s===15?2:1):(g=s===15?16:32,b=s===15?32:16);let p=this.aq,m=this.bq,v=Hn<<16,y=n<<16;for(let _=0;_<=c;_++)for(let w=0;w<16;w++){let S=o===1?_<<8|w<<4|s:_<<8|s<<4|w,A=o===1?_<<8|w<<4|r:_<<8|r<<4|w,R=u[S],P=d[A];if(Ti[R]&g||Ti[P]&b)continue;let x=h[S],T=f[A];if(x===T)continue;let D=As[R],U=As[P],k=D>1?D:1,B=U>1?U:1,F=x>>4,I=T>>4;F-B>I?p.push(v|S):I-k>F&&p.push(y|A);let N=x&15,z=T&15;z-k>N?m.push(y|A):N-B>z&&m.push(v|S)}}};var Jr=yt.water,Ts=yt.lava,ap=8,p3=Ie(yt.obsidian),Xb=Ie(yt.bedrock),m3=Ie(yt.cobblestone),g3=Ie(yt.stone),b3=.25,y3=1.5,jr=new Uint8Array(1024);jr[0]=1;for(let i=1;i<xt;i++){if(he[i])continue;let t=(jt[i]===j.cross||jt[i]===j.torch)&&!xe[i];(Ra[i]||t)&&(jr[i]=1)}yt.seagrass!==void 0&&(jr[yt.seagrass]=0);yt.cobweb!==void 0&&(jr[yt.cobweb]=0);var la=[0,1,0,-1],ca=[-1,0,1,0],Yb=[2,3,0,1],ha=1048576,gl=2097152,Kb=(i,t,e)=>((i+ha)*gl+(e+ha))*256+t,Oh=class{constructor(){this.keys=new Float64Array(1024);this.due=new Float64Array(1024);this.head=0;this.size=0}push(t,e){this.size===this.keys.length&&this.grow();let n=(this.head+this.size)%this.keys.length;this.keys[n]=t,this.due[n]=e,this.size++}frontDue(){return this.size?this.due[this.head]:1/0}shift(){let t=this.keys[this.head];return this.head=(this.head+1)%this.keys.length,this.size--,t}grow(){let t=this.keys.length,e=new Float64Array(t*2),n=new Float64Array(t*2);for(let s=0;s<this.size;s++){let r=(this.head+s)%t;e[s]=this.keys[r],n[s]=this.due[r]}this.keys=e,this.due=n,this.head=0}clear(){this.head=0,this.size=0}},Zb=i=>i===0||i&ap?8:8-(i&7),zh=class{constructor(t){this.time=0;this.maxUpdates=512;this.budgetMs=4;this.lastUpdates=0;this.wq=new Oh;this.lq=new Oh;this.wPending=new Set;this.lPending=new Set;this.contact=new Set;this.stamp=1;this.passStamp=new Uint32Array(121);this.passVal=new Uint8Array(121);this.holeStamp=new Uint32Array(121);this.holeVal=new Uint8Array(121);this.sx=0;this.sy=0;this.sz=0;this.skind=0;this.world=t}get(t,e,n){if(e<0)return Xb;if(e>255)return 0;let s=this.world.getChunk(t>>4,n>>4);return s?s.blocks[e<<8|(n&15)<<4|t&15]:Xb}get pending(){return this.wq.size+this.lq.size+this.contact.size}schedule(t,e,n){if(e<0||e>255)return;let s=this.get(t,e,n)&1023;if(s===Jr){let r=Kb(t,e,n);this.wPending.has(r)||(this.wPending.add(r),this.wq.push(r,this.time+b3))}else if(s===Ts){let r=Kb(t,e,n);this.contact.add(r),this.lPending.has(r)||(this.lPending.add(r),this.lq.push(r,this.time+y3))}}scheduleAround(t,e,n){this.schedule(t,e,n),this.schedule(t+1,e,n),this.schedule(t-1,e,n),this.schedule(t,e+1,n),this.schedule(t,e-1,n),this.schedule(t,e,n+1),this.schedule(t,e,n-1)}clear(){this.wq.clear(),this.lq.clear(),this.wPending.clear(),this.lPending.clear(),this.contact.clear()}tick(t){t>0&&(this.time+=t);let e=this.maxUpdates,n=Jb(),s=0;if(this.contact.size){let a=Array.from(this.contact);this.contact.clear();for(let l of a){if(e<=0){this.contact.add(l);continue}e--,s++,this.lavaContact(l)}}let r=this.wq,o=this.lq;for(;e>0;){let a=r.frontDue(),l=o.frontDue(),c=a<=l;if((c?a:l)>this.time+1e-6)break;let u=c?r.shift():o.shift();if((c?this.wPending:this.lPending).delete(u),this.update(u),e--,s++,!(s&15)&&Jb()-n>this.budgetMs)break}this.lastUpdates=s}update(t){let e=t%256,n=(t-e)/256,s=n%gl,r=s-ha,o=(n-s)/gl-ha,a=this.world,l=this.get(o,e,r),c=l&1023;if(!(c!==Jr&&c!==Ts)){if(c===Ts&&this.touchesWater(o,e,r)){this.solidify(o,e,r,l);return}if(l>>10){let h=this.newLiquid(o,e,r,c);if(h===0){a.setQuiet(o,e,r,0);return}h!==l&&(a.setQuiet(o,e,r,h),l=h)}this.spread(o,e,r,l)}}lavaContact(t){let e=t%256,n=(t-e)/256,s=n%gl,r=s-ha,o=(n-s)/gl-ha,a=this.get(o,e,r);(a&1023)===Ts&&this.touchesWater(o,e,r)&&this.solidify(o,e,r,a)}touchesWater(t,e,n){if((this.get(t,e+1,n)&1023)===Jr)return!0;for(let s=0;s<4;s++)if((this.get(t+la[s],e,n+ca[s])&1023)===Jr)return!0;return!1}solidify(t,e,n,s){this.world.setQuiet(t,e,n,s>>10?m3:p3)}newLiquid(t,e,n,s){let r=0,o=0;for(let l=0;l<4;l++){let c=this.get(t+la[l],e,n+ca[l]);if((c&1023)!==s)continue;let h=c>>10;h===0&&o++;let u=Zb(h);u>r&&(r=u)}if(s===Jr&&o>=2){let l=this.get(t,e-1,n),c=l&1023;if(xe[c]&&!he[c]||c===s&&!(l>>10))return Ie(s,0)}if((this.get(t,e+1,n)&1023)===s)return Ie(s,ap);let a=r-(s===Ts?2:1);return a<=0?0:Ie(s,8-a)}canFlowInto(t,e,n){let s=t&1023;return s===0?!0:s===e?!1:he[s]?n&&e===Ts&&s===Jr:jr[s]===1}spread(t,e,n,s){let r=this.world,o=s&1023,a=s>>10;if(e>0){let l=this.get(t,e-1,n);if(this.canFlowInto(l,o,!0)){if(o===Ts&&(l&1023)===Jr)r.setQuiet(t,e-1,n,g3);else{let c=this.newLiquid(t,e-1,n,o);c!==0&&c!==l&&r.setQuiet(t,e-1,n,c)}this.sourceNeighbors(t,e,n,o)>=3&&this.spreadToSides(t,e,n,s);return}}(a===0||!this.isHole(this.get(t,e-1,n),o))&&this.spreadToSides(t,e,n,s)}sourceNeighbors(t,e,n,s){let r=Ie(s,0),o=0;for(let a=0;a<4;a++)this.get(t+la[a],e,n+ca[a])===r&&o++;return o}spreadToSides(t,e,n,s){let r=s&1023,o=s>>10;if((o&ap?7:Zb(o)-(r===Ts?2:1))<=0)return;let l=this.spreadDirs(t,e,n,r),c=this.world;for(let h=0;h<4;h++){if(!(l&1<<h))continue;let u=t+la[h],f=n+ca[h],d=this.get(u,e,f);if(!this.canFlowInto(d,r,!1))continue;let g=this.newLiquid(u,e,f,r);g!==0&&g!==d&&c.setQuiet(u,e,f,g)}}isHole(t,e){let n=t&1023;return n===0||n===e||he[n]===1||jr[n]===1}canPass(t,e){let n=t&1023;return n===e?t>>10!==0:n===0||!he[n]&&jr[n]===1}passAt(t,e){let n=(e+5)*11+t+5;return this.passStamp[n]!==this.stamp&&(this.passStamp[n]=this.stamp,this.passVal[n]=this.canPass(this.get(this.sx+t,this.sy,this.sz+e),this.skind)?1:0),this.passVal[n]===1}holeAt(t,e){let n=(e+5)*11+t+5;return this.holeStamp[n]!==this.stamp&&(this.holeStamp[n]=this.stamp,this.holeVal[n]=this.sy>0&&this.isHole(this.get(this.sx+t,this.sy-1,this.sz+e),this.skind)?1:0),this.holeVal[n]===1}slopeDistance(t,e,n,s,r){let o=1e3;for(let a=0;a<4;a++){if(a===s)continue;let l=t+la[a],c=e+ca[a];if(this.passAt(l,c)){if(this.holeAt(l,c))return n;if(n<r){let h=this.slopeDistance(l,c,n+1,Yb[a],r);h<o&&(o=h)}}}return o}spreadDirs(t,e,n,s){this.stamp++,this.sx=t,this.sy=e,this.sz=n,this.skind=s;let r=s===Ts?2:4,o=1e3,a=0;for(let l=0;l<4;l++){let c=la[l],h=ca[l];if(!this.passAt(c,h))continue;let u=this.holeAt(c,h)?0:this.slopeDistance(c,h,1,Yb[l],r);u<o&&(o=u,a=0),u<=o&&(a|=1<<l)}return a}},Jb=typeof performance!="undefined"?()=>performance.now():()=>Date.now();var v3=Ie(yt.bedrock),Hh=class{constructor(t){this.chunks=new Map;this.dirtySections=new Set;this.onBlockChange=null;this.lastKey=NaN;this.lastChunk=void 0;this.seed=t,this.lighting=new Fh(this),this.fluids=new zh(this)}getChunk(t,e){let n=Me(t,e);if(n===this.lastKey)return this.lastChunk;let s=this.chunks.get(n);return this.lastKey=n,this.lastChunk=s,s}get(t,e,n){if(e<0)return v3;if(e>255)return 0;let s=this.getChunk(t>>4,n>>4);return s?s.blocks[e<<8|(n&15)<<4|t&15]:0}getLight(t,e,n){if(e>255)return 240;if(e<0)return 0;let s=this.getChunk(t>>4,n>>4);return s?s.light[e<<8|(n&15)<<4|t&15]:240}getSky(t,e,n){return this.getLight(t,e,n)>>4}getBlockLight(t,e,n){return this.getLight(t,e,n)&15}set(t,e,n,s){this.apply(t,e,n,s,!0)}setQuiet(t,e,n,s){this.apply(t,e,n,s,!1)}apply(t,e,n,s,r){if(e<0||e>255)return;let o=this.getChunk(t>>4,n>>4);if(!o)return;s&1023||(s=0);let a=t&15,l=n&15,c=o.blocks[e<<8|l<<4|a];c!==s&&(o.set(a,e,l,s),o.modified=!0,o.lit&&this.lighting.update(o,a,e,l,c,s),this.markAround(o,a,e,l),this.fluids.scheduleAround(t,e,n),r&&this.onBlockChange&&this.onBlockChange(t,e,n,c,s))}markAround(t,e,n,s){let r=n>>4,o=n&15;this.dirtySections.add(_n(t.cx,r,t.cz));let a=e===0?-1:0,l=e===15?1:0,c=s===0?-1:0,h=s===15?1:0,u=o===0&&r>0?-1:0,f=o===15&&r<15?1:0;for(let d=c;d<=h;d++)for(let g=a;g<=l;g++){let b=g===0&&d===0?t:this.chunks.get(Me(t.cx+g,t.cz+d));if(b)for(let p=u;p<=f;p++)b.counts[r+p]>0&&this.dirtySections.add(_n(b.cx,r+p,b.cz))}}addChunk(t){let e=Me(t.cx,t.cz);this.chunks.set(e,t),this.lastKey=NaN,this.lastChunk=void 0,this.lighting.initChunk(t);for(let n=0;n<16;n++)t.counts[n]>0&&this.dirtySections.add(_n(t.cx,n,t.cz));for(let n=-1;n<=1;n++)for(let s=-1;s<=1;s++){if(!s&&!n)continue;let r=this.chunks.get(Me(t.cx+s,t.cz+n));if(!(!r||!r.lit))for(let o=0;o<16;o++)r.counts[o]>0&&this.dirtySections.add(_n(r.cx,o,r.cz))}}removeChunk(t,e){let n=Me(t,e),s=this.chunks.get(n);if(s){this.chunks.delete(n),this.lastKey=NaN,this.lastChunk=void 0;for(let r=0;r<16;r++)this.dirtySections.delete(_n(t,r,e));return s}}topY(t,e){let n=this.getChunk(t>>4,e>>4);if(!n)return-1;let s=n.blocks,r=(e&15)<<4|t&15;for(let o=15;o>=0;o--)if(n.counts[o]){for(let a=o*16+15;a>=o*16;a--)if(s[a<<8|r]!==0)return a}return-1}tick(t){this.fluids.tick(t)}};var _3="blockforge",x3=1,Cs="worlds",Zi="chunks",w3=5e3,Qr=new Uint8Array(65536),lp=new Int16Array(1024).fill(-1);function M3(i){if(i<=Qr.length)return;let t=Qr.length*2;for(;t<i;)t*=2;let e=new Uint8Array(t);e.set(Qr),Qr=e}function S3(i){let t=[],e=[],n=0,s=i.length,r=0;try{for(;r<s;){let o=i[r],a=r+1;for(;a<s&&i[a]===o;)a++;let l=o&1023,c=lp[l];c<0&&(c=t.length,lp[l]=c,t.push(l<xt?Le[l].name:"air"),e.push(l)),M3(n+8),n=jb(Qr,n,c*64+(o>>10)),n=jb(Qr,n,a-r-1),r=a}}finally{for(let o of e)lp[o]=-1}return{names:t,data:Qr.slice(0,n)}}function jb(i,t,e){for(;e>=128;)i[t++]=e&127|128,e>>>=7;return i[t++]=e,t}function A3(i,t,e=new Uint16Array(65536)){let n=new Uint16Array(i.length);for(let l=0;l<i.length;l++){let c=yt[i[l]];n[l]=c!==void 0&&c<xt?c:0}let s=e.length,r=t.length,o=0,a=0;for(;o<r&&a<s;){let l=0,c=0,h;do h=t[o++],l|=(h&127)<<c,c+=7;while(h&128&&o<r);let u=0;c=0;do h=t[o++],u|=(h&127)<<c,c+=7;while(h&128&&o<r);u+=1;let f=l>>>6,d=l&63,g=f<n.length?n[f]:0,b=g===0?0:g|d<<10,p=a+u>s?s:a+u;if(p-a>16)e.fill(b,a,p);else for(let m=a;m<p;m++)e[m]=b;a=p}return e}function Qb(i,t){let{names:e,data:n}=S3(t.blocks);return{w:i,cx:t.cx,cz:t.cz,v:2,names:e,data:n,biome:t.biome.slice(0,256),tint:t.tint.slice(0,256*9)}}var sy=new WeakSet;function cp(i){let t=i;if(!t||t.v!==2||!Array.isArray(t.names)||!(t.data instanceof Uint8Array))return null;let e=A3(t.names,t.data);sy.add(e);let n=new Uint8Array(256);t.biome instanceof Uint8Array&&n.set(t.biome.subarray(0,256));let s=new Uint8Array(256*9);return t.tint instanceof Uint8Array&&s.set(t.tint.subarray(0,256*9)),{blocks:e,biome:n,tint:s}}var ua=null,mp=!1,ty=new Set;function Dn(i,t){ty.has(i)||(ty.add(i),console.warn(`[storage] ${i}`,t))}function E3(){var i;try{return(i=globalThis.indexedDB)!=null?i:null}catch{return null}}function ks(){return mp?Promise.resolve(null):ua||(ua=new Promise(i=>{let t=!1,e=null,n=(r,o)=>{if(t){if(r)try{r.close()}catch{}return}t=!0,e!==null&&clearTimeout(e),r||(mp=!0,o!==void 0&&Dn("IndexedDB unavailable, worlds are kept in memory for this session",o)),i(r)},s=E3();if(!s){n(null,"no indexedDB");return}try{let r=s.open(_3,x3);r.onupgradeneeded=()=>{try{let o=r.result;o.objectStoreNames.contains(Cs)||o.createObjectStore(Cs,{keyPath:"id"}),o.objectStoreNames.contains(Zi)||o.createObjectStore(Zi,{keyPath:["w","cx","cz"]})}catch(o){n(null,o)}},r.onsuccess=()=>{let o=r.result;o.onversionchange=()=>{try{o.close()}catch{}ua=null},o.onclose=()=>{ua=null},n(o)},r.onerror=o=>{var a;(a=o.preventDefault)==null||a.call(o),n(null,r.error)},r.onblocked=()=>{},e=setTimeout(()=>n(null,"open timed out"),w3)}catch(r){n(null,r)}}),ua)}function Gh(i){return new Promise((t,e)=>{i.onsuccess=()=>t(i.result),i.onerror=n=>{var s;(s=n.preventDefault)==null||s.call(n),e(i.error)}})}function T3(i){var t;try{(t=i.commit)==null||t.call(i)}catch{}}function ry(i){return new Promise((t,e)=>{i.oncomplete=()=>t(),i.onerror=n=>{var s;(s=n.preventDefault)==null||s.call(n),e(i.error)},i.onabort=()=>{var n;return e((n=i.error)!=null?n:new Error("transaction aborted"))}})}var hp=i=>IDBKeyRange.bound([i,-1/0,-1/0],[i,1/0,1/0]),da=new Map,pa=new Map;function up(i){return JSON.parse(JSON.stringify(i))}function k3(i){let t=pa.get(i);return t||(t=new Map,pa.set(i,t)),t}var ey=!1;function C3(){var i,t;if(!ey){ey=!0;try{let e=globalThis.navigator,n=(t=(i=e==null?void 0:e.storage)==null?void 0:i.persist)==null?void 0:t.call(i);n&&n.catch(()=>{})}catch{}}}var gp="blockforge.session.",yl="blockforge.journal.";function Rs(){var i;try{return(i=globalThis.localStorage)!=null?i:null}catch{return null}}function fa(i){let t="";for(let e=0;e<i.length;e+=32768)t+=String.fromCharCode.apply(null,Array.from(i.subarray(e,e+32768)));return btoa(t)}function dp(i){let t=atob(i),e=new Uint8Array(t.length);for(let n=0;n<t.length;n++)e[n]=t.charCodeAt(n);return e}var Wh=(i,t,e)=>`${yl}${i}|${t}|${e}`,bl=null;function Ps(){if(bl)return bl;bl=new Set;let i=Rs();if(i)try{for(let t=0;t<i.length;t++){let e=i.key(t);e&&e.startsWith(yl)&&bl.add(e)}}catch{}return bl}var $h=new Map,Vh=0;function ny(i){let t=Rs();if(!t||!Ps().has(i))return null;try{let e=t.getItem(i);if(!e)return Ps().delete(i),null;let n=JSON.parse(e);return{w:i.slice(yl.length,i.indexOf("|")),cx:n.cx,cz:n.cz,v:2,names:n.names,data:dp(n.data),biome:dp(n.biome),tint:dp(n.tint)}}catch(e){return Dn("could not read an emergency chunk copy",e),null}}function iy(i,t){var n;if(!Ps().has(i))return;let e=$h.get(i);if(!(e!==void 0&&e>t)){try{(n=Rs())==null||n.removeItem(i)}catch{}Ps().delete(i),$h.delete(i)}}function R3(i){var t;try{let e=(t=Rs())==null?void 0:t.getItem(gp+i);return e?JSON.parse(e):null}catch{return null}}function fp(i){let t=R3(i.id);if(!t||!(t.t>(i.lastPlayed||0)))return i;let e={...i,lastPlayed:t.t,selected:t.selected,dayTime:t.dayTime,timeMode:t.timeMode};return t.player&&(e.player=t.player),Array.isArray(t.hotbar)&&(e.hotbar=t.hotbar),Array.isArray(t.hotbarNames)&&(e.hotbarNames=t.hotbarNames),e}async function pp(i,t){let e=await ks();if(!e)throw new Error("no database");let n=e.transaction(i,"readwrite"),s=ry(n);n.objectStore(i).put(t),T3(n),await s}var fn={async listWorlds(){let i=new Map,t=await ks();if(t)try{let e=await Gh(t.transaction(Cs,"readonly").objectStore(Cs).getAll());for(let n of e)n&&typeof n.id=="string"&&i.set(n.id,n)}catch(e){Dn("could not list worlds",e)}for(let[e,n]of da)i.set(e,up(n));return Array.from(i.values()).map(fp).sort((e,n)=>(n.lastPlayed||0)-(e.lastPlayed||0))},async getWorld(i){let t=da.get(i);if(t)return fp(up(t));let e=await ks();if(!e)return null;try{let n=await Gh(e.transaction(Cs,"readonly").objectStore(Cs).get(i));return n?fp(n):null}catch(n){return Dn("could not read a world",n),null}},async saveWorld(i){let t;try{t=up(i)}catch(n){Dn("world metadata is not serialisable",n);return}if(da.set(t.id,t),!!await ks())try{await pp(Cs,t),da.get(t.id)===t&&da.delete(t.id),C3()}catch(n){Dn("could not save a world, keeping it in memory",n)}},async deleteWorld(i){var e,n;da.delete(i),pa.delete(i);try{(e=Rs())==null||e.removeItem(gp+i)}catch{}for(let s of Array.from(Ps()))if(s.startsWith(`${yl}${i}|`)){try{(n=Rs())==null||n.removeItem(s)}catch{}Ps().delete(s)}let t=await ks();if(t)try{let s=t.transaction([Cs,Zi],"readwrite");s.objectStore(Cs).delete(i),s.objectStore(Zi).delete(hp(i)),await ry(s)}catch(s){Dn("could not delete a world",s)}},async savedChunkKeys(i){let t=new Set,e=await ks();if(e)try{let r=e.transaction(Zi,"readonly").objectStore(Zi);if(typeof r.getAllKeys=="function"){let o=await Gh(r.getAllKeys(hp(i)));for(let a of o){let l=a;t.add(Me(l[1],l[2]))}}else await new Promise((o,a)=>{let l=r.openKeyCursor(hp(i));l.onsuccess=()=>{let c=l.result;if(!c){o();return}let h=c.key;t.add(Me(h[1],h[2])),c.continue()},l.onerror=()=>a(l.error)})}catch(r){Dn("could not list saved chunks",r)}let n=pa.get(i);if(n)for(let r of n.keys())t.add(r);let s=`${yl}${i}|`;for(let r of Array.from(Ps())){if(!r.startsWith(s))continue;let o=ny(r);if(o&&(t.add(Me(o.cx,o.cz)),e)){let a=Vh;pp(Zi,o).then(()=>iy(r,a)).catch(l=>Dn("could not move an emergency chunk copy",l))}}return t},async loadChunk(i,t,e){var o;let n=(o=pa.get(i))==null?void 0:o.get(Me(t,e));if(n)return cp(n);let s=ny(Wh(i,t,e));if(s)return cp(s);let r=await ks();if(!r)return null;try{let a=await Gh(r.transaction(Zi,"readonly").objectStore(Zi).get([i,t,e]));return cp(a)}catch(a){return Dn("could not read a chunk",a),null}},async saveChunk(i,t){let e;try{e=Qb(i,t)}catch(a){Dn("could not encode a chunk",a);return}let n=Me(t.cx,t.cz),s=k3(i);s.set(n,e);let r=++Vh;if(await ks())try{await pp(Zi,e),s.get(n)===e&&s.delete(n),iy(Wh(i,t.cx,t.cz),r)}catch(a){Dn("could not save a chunk, keeping it in memory",a)}},remap(i,t){if(sy.has(i))return;let e=new Uint16Array(1024);for(let n=0;n<t.length&&n<1024;n++){let s=yt[t[n]];e[n]=s!==void 0&&s<xt?s:0}for(let n=0;n<i.length;n++){let s=i[n];if(s===0)continue;let r=e[s&1023];i[n]=r===0?0:r|s&64512}},saveSession(i){var e;let t={t:Date.now(),player:i.player,hotbar:i.hotbar,hotbarNames:i.hotbarNames,selected:i.selected,dayTime:i.dayTime,timeMode:i.timeMode};try{(e=Rs())==null||e.setItem(gp+i.id,JSON.stringify(t))}catch(n){Dn("could not write the session copy",n)}},journalChunk(i,t){let e=Rs();if(e)try{let n=Qb(i,t),s={t:Date.now(),cx:n.cx,cz:n.cz,names:n.names,data:fa(n.data),biome:fa(n.biome),tint:fa(n.tint)},r=Wh(i,t.cx,t.cz);e.setItem(r,JSON.stringify(s)),Ps().add(r),$h.set(r,++Vh)}catch(n){Dn("could not write an emergency chunk copy",n)}},journalPending(i){let t=pa.get(i);if(!(!t||mp))for(let e of t.values()){let n=Rs();if(!n)return;try{let s=Wh(i,e.cx,e.cz),r={t:Date.now(),cx:e.cx,cz:e.cz,names:e.names,data:fa(e.data),biome:fa(e.biome),tint:fa(e.tint)};n.setItem(s,JSON.stringify(r)),Ps().add(s),$h.set(s,++Vh)}catch(s){Dn("could not write an emergency chunk copy",s)}}},async mode(){return await ks()?"indexeddb":"memory"}};var P3=.5*(Math.sqrt(3)-1),vl=(3-Math.sqrt(3))/6,L3=1/3,Ji=1/6,mi=new Float64Array([1,1,0,-1,1,0,1,-1,0,-1,-1,0,1,0,1,-1,0,1,1,0,-1,-1,0,-1,0,1,1,0,-1,1,0,1,-1,0,-1,-1]),ma=new Float64Array([1,0,-1,0,0,1,0,-1,.7071067811865476,.7071067811865476,-.7071067811865476,.7071067811865476,.7071067811865476,-.7071067811865476,-.7071067811865476,-.7071067811865476]);function bp(i){return i^=i>>>16,i=Math.imul(i,2146121005),i^=i>>>15,i=Math.imul(i,2221713035),i^=i>>>16,i>>>0}function Ls(i,t,e){return bp((i^Math.imul(t|0,668265261)^Math.imul(e|0,374761393))>>>0)}function yp(i,t,e,n){return bp((i^Math.imul(t|0,668265261)^Math.imul(e|0,2654435761)^Math.imul(n|0,374761393))>>>0)}var ga=class{constructor(t=0){this.s=t>>>0}seed(t){return this.s=t>>>0,this}u32(){let t=this.s=this.s+1831565813>>>0;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),(t^t>>>14)>>>0}next(){return this.u32()/4294967296}int(t){return Math.floor(this.next()*t)}range(t,e){return t+Math.floor(this.next()*(e-t+1))}chance(t){return this.next()<t}},qh=class{constructor(t){this.perm=new Uint8Array(512);this.perm12=new Uint8Array(512);this.perm8=new Uint8Array(512);let e=new Uint8Array(256);for(let s=0;s<256;s++)e[s]=s;let n=new ga(bp(t>>>0^1540483477));for(let s=255;s>0;s--){let r=n.int(s+1),o=e[s];e[s]=e[r],e[r]=o}for(let s=0;s<512;s++){let r=e[s&255];this.perm[s]=r,this.perm12[s]=r%12,this.perm8[s]=r&7}}noise2(t,e){let n=this.perm,s=this.perm8,r=(t+e)*P3,o=Math.floor(t+r),a=Math.floor(e+r),l=(o+a)*vl,c=t-(o-l),h=e-(a-l),u,f;c>h?(u=1,f=0):(u=0,f=1);let d=c-u+vl,g=h-f+vl,b=c-1+2*vl,p=h-1+2*vl,m=o&255,v=a&255,y=0,_=.5-c*c-h*h;if(_>0){let A=s[m+n[v]]<<1;_*=_,y+=_*_*(ma[A]*c+ma[A+1]*h)}let w=.5-d*d-g*g;if(w>0){let A=s[m+u+n[v+f]]<<1;w*=w,y+=w*w*(ma[A]*d+ma[A+1]*g)}let S=.5-b*b-p*p;if(S>0){let A=s[m+1+n[v+1]]<<1;S*=S,y+=S*S*(ma[A]*b+ma[A+1]*p)}return 99.204*y}noise3(t,e,n){let s=this.perm,r=this.perm12,o=(t+e+n)*L3,a=Math.floor(t+o),l=Math.floor(e+o),c=Math.floor(n+o),h=(a+l+c)*Ji,u=t-(a-h),f=e-(l-h),d=n-(c-h),g,b,p,m,v,y;u>=f?f>=d?(g=1,b=0,p=0,m=1,v=1,y=0):u>=d?(g=1,b=0,p=0,m=1,v=0,y=1):(g=0,b=0,p=1,m=1,v=0,y=1):f<d?(g=0,b=0,p=1,m=0,v=1,y=1):u<d?(g=0,b=1,p=0,m=0,v=1,y=1):(g=0,b=1,p=0,m=1,v=1,y=0);let _=u-g+Ji,w=f-b+Ji,S=d-p+Ji,A=u-m+2*Ji,R=f-v+2*Ji,P=d-y+2*Ji,x=u-1+3*Ji,T=f-1+3*Ji,D=d-1+3*Ji,U=a&255,k=l&255,B=c&255,F=0,I=.6-u*u-f*f-d*d;if(I>0){let nt=r[U+s[k+s[B]]]*3;I*=I,F+=I*I*(mi[nt]*u+mi[nt+1]*f+mi[nt+2]*d)}let N=.6-_*_-w*w-S*S;if(N>0){let nt=r[U+g+s[k+b+s[B+p]]]*3;N*=N,F+=N*N*(mi[nt]*_+mi[nt+1]*w+mi[nt+2]*S)}let z=.6-A*A-R*R-P*P;if(z>0){let nt=r[U+m+s[k+v+s[B+y]]]*3;z*=z,F+=z*z*(mi[nt]*A+mi[nt+1]*R+mi[nt+2]*P)}let et=.6-x*x-T*T-D*D;if(et>0){let nt=r[U+1+s[k+1+s[B+1]]]*3;et*=et,F+=et*et*(mi[nt]*x+mi[nt+1]*T+mi[nt+2]*D)}return 32*F}},oy=[0,37.17,-91.43,151.9,-203.3,263.7,-317.1,389.5,-431.9,499.3],ay=[0,-53.71,71.29,-127.3,181.7,-241.1,293.9,-347.3,409.1,-461.7];function Is(i,t,e,n,s=2,r=.5){let o=0,a=1,l=0,c=1;for(let h=0;h<n;h++)o+=a*i.noise2(t*c+oy[h%10],e*c+ay[h%10]),l+=a,a*=r,c*=s;return o/l}function ly(i,t,e,n,s=2,r=.5){let o=0,a=1,l=0,c=1,h=1;for(let u=0;u<n;u++){let f=1-Math.abs(i.noise2(t*c+oy[u%10],e*c+ay[u%10]));f*=f,f*=h,h=f*1.6>1?1:f*1.6,o+=f*a,l+=a,a*=r,c*=s}return o/l}var vy=["Ocean","Deep Ocean","Beach","Plains","Forest","Birch Forest","Desert","Snowy Tundra","Mountains","Snowy Peaks","Swamp","Cherry Grove","River","Stony Shore"];var eo=0,Us=1,no=2,ji=3,or=4,io=5,xa=6,wa=7,Li=8,Ma=9,jn=10,Aa=11,Ii=12,Sa=13;function At(i){let t=yt[i];if(t===void 0)throw new Error(`generator: unknown block ${i}`);return t}var Ci=0,vp=At("bedrock"),wn=At("stone"),_l=At("deepslate"),Up=At("tuff"),Yh=At("granite"),Kh=At("diorite"),Zh=At("andesite"),Pi=At("dirt"),Zn=At("grass_block"),ba=At("snowy_grass_block"),xl=At("podzol"),_p=At("coarse_dirt"),to=At("mud"),sr=At("clay"),Mn=At("sand"),xp=At("sandstone"),Nn=At("gravel"),wp=At("snow_block"),Mp=At("snow"),cy=At("ice"),wl=At("packed_ice"),I3=At("calcite"),ya=At("water"),Sp=At("lava"),Ap=At("oak_log"),Ep=At("oak_leaves"),U3=At("birch_log"),D3=At("birch_leaves"),N3=At("spruce_log"),hy=At("spruce_leaves"),Tp=At("cherry_log"),B3=At("cherry_leaves"),Xh=At("dark_oak_log"),F3=At("dark_oak_leaves"),Ml=At("short_grass"),kp=At("fern"),uy=At("dead_bush"),dy=At("cactus"),O3=At("sugar_cane"),z3=At("lily_pad"),H3=At("seagrass"),G3=At("pumpkin"),fy=At("brown_mushroom"),W3=At("red_mushroom"),ar=At("dandelion"),ro=At("poppy"),V3=At("blue_orchid"),_y=At("allium"),xy=At("azure_bluet"),$3=At("red_tulip"),q3=At("orange_tulip"),wy=At("white_tulip"),Dp=At("pink_tulip"),Np=At("oxeye_daisy"),My=At("cornflower"),Sy=At("lily_of_the_valley"),Ay=["coal","iron","copper","gold","redstone","lapis","diamond","emerald"],py=Ay.map(i=>At(`${i}_ore`)),my=Ay.map(i=>At(`deepslate_${i}_ore`)),gy=[[0,20,15,5,128,0],[0,6,17,60,128,0],[2,12,10,20,96,1],[1,10,9,5,72,1],[1,3,9,5,24,0],[3,2,9,5,32,1],[4,6,8,5,16,0],[5,2,7,5,32,1],[6,1,8,5,16,0]],by=[[Yh,1,2,52,0,64],[Kh,1,2,52,0,64],[Zh,1,2,52,0,64],[Yh,1,.25,52,64,128],[Kh,1,.25,52,64,128],[Zh,1,.25,52,64,128],[Up,2,2,52,0,16],[Pi,1,4,30,0,160],[Nn,1,5,30,0,160]],rr=-.5,X3=.42,Y3=.05,K3=9,Ri=0,Sl=1,Cp=2,yy=3,Rp=4,Pp=5,Al=6,Lp=7,va=[-1.2,-.62,-.45,-.3,-.2,-.14,-.1,-.06,0,.3,1.2],_a=[29,35,42,48,54,58.5,61.6,63.2,64.8,70,82];function Z3(i){if(i<=va[0])return _a[0];for(let t=1;t<va.length;t++)if(i<va[t]){let e=(i-va[t-1])/(va[t]-va[t-1]);return _a[t-1]+(_a[t]-_a[t-1])*e}return _a[_a.length-1]}function $e(i,t,e){let n=(e-i)/(t-i);return n<=0?0:n>=1?1:n*n*(3-2*n)}var so=i=>[parseInt(i.slice(1,3),16),parseInt(i.slice(3,5),16),parseInt(i.slice(5,7),16)],Ey=[];function Gn(i,t,e,n){Ey[i]=[...so(t),...so(e),...so(n)]}Gn(eo,"#8eb971","#71a74d","#3f76e4");Gn(Us,"#8eb971","#71a74d","#3a69d6");Gn(no,"#91bd59","#77ab2f","#3f76e4");Gn(ji,"#91bd59","#77ab2f","#3f76e4");Gn(or,"#79c05a","#59ae30","#3f76e4");Gn(io,"#88bb67","#6ba941","#3f76e4");Gn(xa,"#bfb755","#aea42a","#3f8ee4");Gn(wa,"#80b497","#60a17b","#3938c9");Gn(Li,"#8ab689","#6da36b","#3f6ee0");Gn(Ma,"#80b497","#60a17b","#3938c9");Gn(jn,"#6a7039","#6a7039","#617b64");Gn(Aa,"#b6db61","#b6db61","#5db7ef");Gn(Ii,"#8eb971","#71a74d","#3f76e4");Gn(Sa,"#8ab689","#6da36b","#3d5fd9");var J3=so("#3d57d6"),j3=so("#45adf2"),Q3=so("#80b497"),tk=so("#60a17b"),Qi=[];Qi[ji]=[ar,ro,xy,Np,My,$3,q3,wy,Dp,ar,ro];Qi[or]=[ar,ro,Sy,ro,ar];Qi[io]=[ar,ro,Sy,Np];Qi[jn]=[V3];Qi[Aa]=[Dp,Dp,wy,_y];Qi[Li]=[_y,xy,My,ar,Np,ro];Qi[Ii]=[ar,ro];Qi[no]=[ar];var ek=461845907,nk=739982445,ik=695872825,sk=1799596469,rk=1597334677,ok=1013904242,ak=2084215391,lk=1327217884,ck=295875524,hk=195936478,Oe=18,Ip=Oe*Oe,Jn=9,gi=65,Jh=class{constructor(t){this.sB=0;this.sT=0;this.sHum=0;this.sC=0;this.sMtn=0;this.sChan=0;this.hm=new Int16Array(Ip);this.bm=new Uint8Array(Ip);this.tm=new Float32Array(Ip);this.frozen=new Uint8Array(256);this.slopes=new Uint8Array(256);this.carveTop=new Int16Array(256);this.tintGrid=new Float32Array(Jn*Jn*9);this.tintBlur=new Float32Array(Jn*Jn*9);this.caveC=new Float32Array(25*gi);this.caveA=new Float32Array(25*gi);this.caveB=new Float32Array(25*gi);this.colC=new Float32Array(gi);this.colA=new Float32Array(gi);this.colB=new Float32Array(gi);this.cheeseThr=new Float32Array(257);this.spagW2=new Float32Array(257);this.rng=new ga;this.rng2=new ga;this.blocks=new Uint16Array(0);this.X0=0;this.Z0=0;this.fFill=0;this.fDepth=0;this.fUnder=0;this.fUnderDepth=0;this.spawn=null;this.seed=t|0;let e=0,n=()=>new qh(this.seed+Math.imul(++e,2654435761)|0);this.nCont=n(),this.nWarp=n(),this.nEro=n(),this.nRidge=n(),this.nAmp=n(),this.nHill=n(),this.nDet=n(),this.nRiver=n(),this.nSwamp=n(),this.nTemp=n(),this.nHum=n(),this.nVar=n(),this.nJit=n(),this.nPatch=n(),this.nPatch2=n(),this.nFlower=n(),this.nFlowerType=n(),this.nGrass=n(),this.nForest=n(),this.nEnt=n(),this.nSnow=n(),this.nCheese=n(),this.nCheese2=n(),this.nSpagA=n(),this.nSpagB=n(),this.nSpagW=n();for(let s=0;s<=256;s++){this.cheeseThr[s]=.45+.2*$e(24,100,s)+.12*$e(4,-2,s);let r=.083+.017*$e(80,20,s);this.spagW2[s]=r*r}}sample(t,e){let n=this.nJit.noise2(t*.015625,e*.015625)*.026+this.nJit.noise2(t*.058823529411764705+31.7,e*.058823529411764705-11.3)*.004,s=Is(this.nTemp,t*(1/1500),e*(1/1500),3)*1.45+n,r=Is(this.nHum,t*(1/1150),e*(1/1150),3)*1.45-n,o=Is(this.nVar,t*(1/640),e*(1/640),2)*1.55+n,a=t+this.nWarp.noise2(t*(1/420),e*(1/420))*80,l=e+this.nWarp.noise2(e*(1/420)+57.1,t*(1/420)-23.9)*80,c=Is(this.nCont,a*(1/1800),l*(1/1800),5)*1.75+.1,h=Is(this.nEro,t*(1/1250),e*(1/1250),3)*1.55,u=Z3(c),f=$e(-.12,.25,c),d=$e(-.2,.08,c)*$e(-.18,-.66,h);if(d>0){let _=ly(this.nRidge,t*.0016129032258064516,e*.0016129032258064516,5),w=.82+.25*this.nAmp.noise2(t*(1/1100),e*(1/1100)),S=d*d*(3-2*d);u+=S*(20+190*_*Math.sqrt(_))*w}let g=f*(3+16*$e(.55,-.2,h))*(1-.6*d)+(1-f)*2.5;u+=Is(this.nHill,t*(1/200),e*(1/200),4)*1.35*g,u+=Is(this.nDet,t*(1/40),e*(1/40),2)*(.9+1.4*f);let b=$e(.36,.5,r)*$e(-.36,-.22,s)*$e(-.28,0,h)*(1-$e(.04,.2,d))*$e(-.07,.03,c);b>0&&(u+=(61.8+this.nSwamp.noise2(t*(1/13),e*(1/13))*1.8-u)*b);let p=0,m=1-$e(.25,.6,d);if(m>0){let _=Math.abs(Is(this.nRiver,t*.0014285714285714286,e*.0014285714285714286,3)*1.7);if(_<.2){let w=1-(1-$e(.035,.2,_))*m;if(u>63&&(u=63+(u-63)*w),p=(1-$e(0,.045,_))*m,p>0){let S=56.5+this.nDet.noise2(t*.043478260869565216,e*.043478260869565216)*1.5;u>S&&(u+=(S-u)*p)}}}u>185&&(u=185+55*(1-Math.exp((185-u)/55)));let v=Math.floor(u);v<2?v=2:v>250&&(v=250);let y;if(v<62&&c<-.13)y=c<-.5?Us:eo;else if(p>.4&&v<=63)y=Ii;else if(c<-.03+n&&d>.07&&v<78&&v>=59)y=Sa;else if(c<-.035+n*.6&&v<=66&&v>=60)y=no;else if(d>.32&&v>=92){let _=148+this.nSnow.noise2(t*.016666666666666666,e*.016666666666666666)*10-(s<rr+.1?30:0);y=v>=_?Ma:Li}else s<rr?y=wa:s>X3&&r<Y3?y=xa:b>.5?y=jn:o>.42&&s>-.3&&s<.32&&r>-.3&&r<.36&&h<.12?y=Aa:o<-.33&&s>-.42&&s<.3&&r>-.12?y=io:r>.02?y=or:y=ji;return this.sB=y,this.sT=s,this.sHum=r,this.sC=c,this.sMtn=d,this.sChan=p,v}heightAt(t,e){return this.sample(Math.floor(t),Math.floor(e))}biomeAt(t,e){return this.sample(Math.floor(t),Math.floor(e)),this.sB}slopeAt(t,e){let n=this.sample(t+1,e),s=this.sample(t-1,e),r=this.sample(t,e+1),o=this.sample(t,e-1);return Math.max(Math.abs(n-s),Math.abs(r-o))}snowline(t,e){return 122+this.nSnow.noise2(t*(1/37),e*(1/37))*7}isEntrance(t,e){return this.nEnt.noise2(t*(1/85),e*(1/85))>.62}surface(t,e,n,s,r,o){let a=this.nPatch.noise2(t*.09090909090909091,e*.09090909090909091),l=Ls(this.seed^ck,t,e),c=3+(l&1);if(this.fFill=Pi,this.fDepth=c,this.fUnder=wn,this.fUnderDepth=0,n<62){let h=62-n,u;return s===eo||s===Us?u=h>16||s===Us?a>-.35?Nn:Mn:a>.55&&h<12?sr:a<-.45?Nn:Mn:s===Ii?u=a>.5?sr:a<-.4?Nn:Mn:s===jn?u=a>-.1?to:a<-.55?sr:Pi:s===xa||s===no?u=Mn:s===wa||s===Ma||s===Li||s===Sa?u=a>.1?Nn:Pi:u=a>.55?sr:a>.05?Mn:a>-.45?Pi:Nn,this.fFill=u===sr||u===to?Pi:u,this.fDepth=u===sr?2:c,u===Mn&&(this.fUnder=xp,this.fUnderDepth=2),u}switch(s){case xa:return this.fFill=Mn,this.fDepth=c+1,this.fUnder=xp,this.fUnderDepth=3+(l>>>1&1),Mn;case no:return this.fFill=Mn,this.fDepth=c,this.fUnder=xp,this.fUnderDepth=2,Mn;case Sa:return r>2||a>.15?(this.fFill=wn,wn):(this.fFill=Nn,this.fDepth=2,Nn);case Ma:return r>=6?(this.fFill=wn,a>.5?I3:wn):a>.62?(this.fFill=Nn,this.fDepth=2,Nn):a<-.66&&r<=2?(this.fFill=wl,this.fDepth=2,wl):(this.fFill=wp,this.fDepth=1+(l&1),wp);case Li:if(r>=5||r>=3&&n>128)return this.fFill=wn,a>.66?Nn:wn;if(r>=3&&a>.45)return this.fFill=Nn,this.fDepth=2,Nn;this.fDepth=1+(l&1);{let h=this.nPatch2.noise2(t*.029411764705882353,e*.029411764705882353)+a*.15;if(n<114&&h<-.8)return xl;if(h>.9)return _p}return Zn;case wa:return r>=6?(this.fFill=wn,wn):this.nPatch2.noise2(t*(1/22),e*(1/22))>.86?(this.fFill=wl,this.fDepth=2,wl):ba;case jn:return a>.52?to:Zn;case Ii:return n<=62?o<rr?Nn:(this.fFill=Mn,a>.2?Zn:Mn):o<rr?ba:Zn;default:return r>=8?(this.fFill=wn,wn):Zn}}generate(t,e){let n=new Uint16Array(65536),s=new Uint8Array(256),r=new Uint8Array(256*9);this.blocks=n;let o=this.X0=t*16,a=this.Z0=e*16,l=this.hm,c=this.bm,h=this.tm;for(let f=0;f<Oe;f++)for(let d=0;d<Oe;d++){let g=f*Oe+d;l[g]=this.sample(o+d-1,a+f-1),c[g]=this.sB,h[g]=this.sT}let u=0;for(let f=0;f<16;f++)for(let d=0;d<16;d++){let g=(f+1)*Oe+d+1,b=l[g],p=c[g],m=h[g],v=o+d,y=a+f;b>u&&(u=b);let _=Math.max(Math.abs(l[g+1]-l[g-1]),Math.abs(l[g+Oe]-l[g-Oe])),w=this.surface(v,y,b,p,_,m),S=f<<4|d;this.slopes[S]=_>255?255:_;let A=b-this.fDepth,R=A-this.fUnderDepth,P=this.fFill,x=this.fUnder;n[S]=vp;for(let D=1;D<b;D++){let U;D>A?U=P:D>R?U=x:D>=20?U=wn:D<12?U=_l:U=(yp(this.seed^nk,v,D,y)&7)<20-D?_l:wn,D<=4&&yp(this.seed^ek,v,D,y)%5<5-D&&(U=vp),n[D<<8|S]=U}n[b<<8|S]=w;let T=m<rr||p===Ma?1:0;if(!T&&(p===Li||p===Sa)&&b>=this.snowline(v,y)&&(T=1),this.frozen[S]=T,b<62){for(let D=b+1;D<=62;D++)n[D<<8|S]=ya;T&&(!(p===eo||p===Us)||this.nPatch2.noise2(v*(1/44),y*(1/44))*.75+this.nPatch.noise2(v*(1/9),y*(1/9))*.25>-.12)&&(n[15872|S]=cy)}}this.blobs(t,e),this.caves(u),this.ores(t,e),this.trees(),this.decorate(t,e);for(let f=0;f<16;f++)for(let d=0;d<16;d++)s[f<<4|d]=c[(f+1)*Oe+d+1];return this.tints(r),this.blocks=new Uint16Array(0),{cx:t,cz:e,blocks:n,biome:s,tint:r}}vein(t,e,n,s,r,o,a,l,c,h,u){let f=this.X0,d=this.Z0,g=this.blocks,b=t.next()*Math.PI,p=r/8,m=Math.sin(b)*p,v=Math.cos(b)*p,y=e+m,_=e-m,w=s+v,S=s-v,A=n+t.int(3)-1,R=n+t.int(3)-1,P=(2*r/16+1)/2+1;if(Math.max(y,_)+P<f||Math.min(y,_)-P>f+16||Math.max(w,S)+P<d||Math.min(w,S)-P>d+16)return;let x=u;for(let T=0;T<x;T++){let D=x>1?T/(x-1):.5,U=y+(_-y)*D,k=A+(R-A)*D,B=w+(S-w)*D,F=t.next()*r/16,I=((Math.sin(Math.PI*D)+1)*F+1)/2,N=I*I,z=Math.floor(U-I),et=Math.floor(U+I),nt=Math.floor(B-I),ot=Math.floor(B+I),bt=Math.floor(k-I),W=Math.floor(k+I);if(z<f&&(z=f),et>f+15&&(et=f+15),nt<d&&(nt=d),ot>d+15&&(ot=d+15),bt<c&&(bt=c),W>h&&(W=h),!(z>et||nt>ot||bt>W))for(let J=bt;J<=W;J++){let rt=J+.5-k,tt=rt*rt;if(!(tt>=N))for(let ft=nt;ft<=ot;ft++){let ht=ft+.5-B,Wt=tt+ht*ht;if(Wt>=N)continue;let kt=J<<8|ft-d<<4;for(let H=z;H<=et;H++){let Se=H+.5-U;if(Wt+Se*Se>=N)continue;let wt=kt|H-f,Mt=g[wt];l===4?Mt===wn||Mt===Yh||Mt===Kh||Mt===Zh?g[wt]=o:(Mt===_l||Mt===Up)&&(g[wt]=a):(l&1&&Mt===wn||l&2&&Mt===_l)&&(g[wt]=o)}}}}}blobs(t,e){let n=this.rng,s=this.rng2;for(let r=e-1;r<=e+1;r++)for(let o=t-1;o<=t+1;o++){n.seed(Ls(this.seed^rk,o,r));for(let a=0;a<by.length;a++){let[l,c,h,u,f,d]=by[a],g=Math.floor(h);n.next()<h-g&&g++;for(let b=0;b<g;b++){let p=o*16+n.int(16),m=r*16+n.int(16),v=f+n.int(d-f+1);s.seed(n.u32()),this.vein(s,p,v,m,u,l,l,c,Math.max(1,f-4),Math.min(255,d+4),12)}}}}ores(t,e){let n=this.rng,s=this.rng2,r=this.blocks;for(let a=e-1;a<=e+1;a++)for(let l=t-1;l<=t+1;l++){n.seed(Ls(this.seed^ok,l,a));for(let c=0;c<gy.length;c++){let[h,u,f,d,g,b]=gy[c],p=u,m=f;h===6&&n.next()<.5&&p++;for(let v=0;v<p;v++){let y=l*16+n.int(16),_=a*16+n.int(16),w=g-d,S=b===1?d+Math.floor((n.next()+n.next())*.5*(w+1)):d+n.int(w+1);h===6&&v>0&&(m=4),s.seed(n.u32()),this.vein(s,y,S,_,m,py[h],my[h],4,d,g,Math.max(2,Math.ceil(m*.75)))}}}n.seed(Ls(this.seed^hk,t,e));let o=3+n.int(6);for(let a=0;a<o;a++){let l=n.int(16),c=n.int(16),h=5+n.int(96),u=this.bm[(c+1)*Oe+l+1];if(u!==Li&&u!==Ma)continue;let f=h<<8|c<<4|l,d=r[f];d===wn||d===Yh||d===Kh||d===Zh?r[f]=py[7]:(d===_l||d===Up)&&(r[f]=my[7])}}caves(t){let e=this.hm,n=this.blocks,s=this.X0,r=this.Z0,o=0;for(let p=0;p<16;p++)for(let m=0;m<16;m++){let v=(p+1)*Oe+m+1,y=e[v],_=e[v+1],w=e[v-1],S=e[v+Oe],A=e[v-Oe],R=Math.min(y,_,w,S,A),P;R<62?P=R-6:this.isEntrance(s+m,r+p)&&R>=64?P=y:P=y-5,P>250&&(P=250),this.carveTop[p<<4|m]=P,P>o&&(o=P)}if(o<1)return;let a=Math.min(gi,(Math.min(t,o)>>2)+2),l=this.caveC,c=this.caveA,h=this.caveB;for(let p=0;p<5;p++)for(let m=0;m<5;m++){let v=s+m*4,y=r+p*4,_=(p*5+m)*gi;for(let w=0;w<a;w++){let S=w*4;l[_+w]=this.nCheese.noise3(v*(1/88),S*(1/44),y*(1/88))*.68+this.nCheese2.noise3(v*(1/30),S*(1/22),y*(1/30))*.32,c[_+w]=this.nSpagA.noise3(v*(1/52),S*(1/30),y*(1/52)),h[_+w]=this.nSpagB.noise3(v*(1/52),S*(1/30),y*(1/52))}}let u=this.colC,f=this.colA,d=this.colB,g=this.cheeseThr,b=this.spagW2;for(let p=0;p<16;p++){let m=p>>2,v=(p&3)*.25;for(let y=0;y<16;y++){let _=p<<4|y,w=this.carveTop[_];if(w<1)continue;let S=y>>2,A=(y&3)*.25,R=(m*5+S)*gi,P=R+gi,x=R+5*gi,T=x+gi,D=(1-A)*(1-v),U=A*(1-v),k=(1-A)*v,B=A*v,F=Math.min(a,(w>>2)+2);for(let I=0;I<F;I++)u[I]=l[R+I]*D+l[P+I]*U+l[x+I]*k+l[T+I]*B,f[I]=c[R+I]*D+c[P+I]*U+c[x+I]*k+c[T+I]*B,d[I]=h[R+I]*D+h[P+I]*U+h[x+I]*k+h[T+I]*B;for(let I=1;I<=w;I++){let N=I>>2,z=(I&3)*.25,nt=u[N]+(u[N+1]-u[N])*z>g[I];if(!nt){let W=f[N]+(f[N+1]-f[N])*z;if(W*W<b[I]){let J=d[N]+(d[N+1]-d[N])*z;nt=W*W+J*J<b[I]}}if(!nt)continue;let ot=I<<8|_,bt=n[ot];bt===vp||bt===ya||(n[ot]=I<=10?Sp:Ci)}}}}put(t,e,n,s,r){let o=t-this.X0,a=n-this.Z0;if(o<0||o>15||a<0||a>15||e<1||e>255)return;let l=e<<8|a<<4|o,c=this.blocks[l];r?(c===Ci||ei[c&1023]||c===ya||c===Ml||c===Mp)&&(this.blocks[l]=s):c===Ci&&(this.blocks[l]=s)}rootDirt(t,e,n){let s=t-this.X0,r=n-this.Z0;if(s<0||s>15||r<0||r>15||e<1)return;let o=e<<8|r<<4|s,a=this.blocks[o];(a===Zn||a===ba||a===xl||a===to)&&(this.blocks[o]=Pi)}treeDensity(t,e,n,s){let r=this.nForest.noise2(e*.010416666666666666,n*.010416666666666666);switch(t){case or:return .5+.32*r;case io:return .46+.28*r;case ji:return r>.55?.12:.012;case jn:return .16+.08*r;case wa:return r>.4?.12:.025;case Li:return s<116?.13+.15*r:s<126?.04:0;case Aa:return .16+.08*r;case Ii:return 0;default:return 0}}trees(){let t=this.X0,e=this.Z0,n=K3,s=Math.floor((t-n)/4),r=Math.floor((t+15+n)/4),o=Math.floor((e-n)/4),a=Math.floor((e+15+n)/4),l=this.rng;for(let c=o;c<=a;c++)for(let h=s;h<=r;h++){let u=Ls(this.seed^sk,h,c),f=h*4+(u&3),d=c*4+(u>>>2&3);if(f<t-n||f>t+15+n||d<e-n||d>e+15+n)continue;let g=(u>>>8&65535)/65536;if(g>.82)continue;let b=this.sample(f,d),p=this.sB;if(g>=this.treeDensity(p,f,d,b)||b<62-(p===jn?1:0)||b>236||this.isEntrance(f,d))continue;let m=this.sT,v=this.slopeAt(f,d);if(v>3)continue;let y=this.surface(f,d,b,p,v,m);if(b>=62&&y!==Zn&&y!==Pi&&y!==xl&&y!==ba&&y!==_p||b<62&&y!==to&&y!==Pi&&y!==sr)continue;l.seed(u^2654435769);let _=l.next(),w;switch(p){case or:w=_<.66?Ri:_<.86?Sl:_<.95?Rp:Pp;break;case io:w=_<.82?Sl:_<.97?Lp:Ri;break;case ji:w=_<.88?Ri:Rp;break;case jn:w=Al;break;case wa:w=Cp;break;case Li:w=m>.25?_<.75?Ri:Sl:_<.88?Cp:Ri;break;case Aa:w=yy;break;default:w=Ri}w===Pp&&(this.sample(f+1,d)!==b||this.sample(f,d+1)!==b||this.sample(f+1,d+1)!==b)&&(w=Ri),this.tree(w,f,b+1,d,l)}}leafDisc(t,e,n,s,r,o,a){for(let l=-s;l<=s;l++)for(let c=-s;c<=s;c++)s>0&&(c===s||c===-s)&&(l===s||l===-s)&&o.next()>=a||this.put(t+c,e,n+l,r,!1)}tree(t,e,n,s,r){switch(t){case Ri:case Sl:case Lp:case Al:{let o=t===Ri||t===Al?Ap:U3,a=t===Ri||t===Al?Ep:D3,l=t===Ri?4+r.int(3):t===Sl?5+r.int(3):t===Lp?8+r.int(3):5+r.int(3),c=t===Al?1:0,h=n+l;for(let u=h-3;u<=h;u++){let f=u-h,d=(f>=-1?1:2)+c;this.leafDisc(e,u,s,d,a,r,f===0?0:.5)}for(let u=n;u<h;u++)this.put(e,u,s,o,!0);this.rootDirt(e,n-1,s);return}case Cp:{let o=6+r.int(4),a=1+r.int(2),l=2+r.int(2),c=n+o,h=r.int(2),u=1,f=0;this.put(e,c+1,s,hy,!1);for(let d=c;d>=n+a;d--)this.leafDisc(e,d,s,h,hy,r,0),h>=u?(h=f,f=1,u=Math.min(u+1,l)):h++;for(let d=n;d<=c;d++)this.put(e,d,s,N3,!0);this.rootDirt(e,n-1,s);return}case Rp:{let o=8+r.int(5),a=n+o,l=3+r.int(3);for(let c=0;c<l;c++){let h=r.next()*Math.PI*2,u=2+r.next()*2.5,f=n+Math.floor(o*(.5+r.next()*.4)),d=Math.round(e+Math.cos(h)*u),g=Math.round(s+Math.sin(h)*u),b=f+1+r.int(2);this.cluster(d,b,g,Ep,r,2.6,2);let p=Math.ceil(u)+1,m=Math.abs(Math.cos(h))>Math.abs(Math.sin(h))?1:2;for(let v=1;v<=p;v++){let y=v/p;this.put(Math.round(e+(d-e)*y),Math.round(f+(b-f)*y),Math.round(s+(g-s)*y),Ie(Ap,m),!0)}}this.cluster(e,a,s,Ep,r,2.8,2);for(let c=n;c<a;c++)this.put(e,c,s,Ap,!0);this.rootDirt(e,n-1,s);return}case Pp:{let o=6+r.int(3),a=n+o,l=e+.5,c=s+.5;for(let h=a-2;h<=a+1;h++){let u=h-a,f=u===1?2.2:u===0?4.2:u===-1?4.6:3.4,d=Math.ceil(f)+1;for(let g=-d;g<=d+1;g++)for(let b=-d;b<=d+1;b++){let p=e+b-l,m=s+g-c,v=p*p+m*m,y=v>(f-1)*(f-1);v<=f*f&&(!y||r.next()<.6)&&this.put(e+b,h,s+g,F3,!1)}}for(let h=n;h<=a;h++)this.put(e,h,s,Xh,!0),this.put(e+1,h,s,Xh,!0),this.put(e,h,s+1,Xh,!0),this.put(e+1,h,s+1,Xh,!0);this.rootDirt(e,n-1,s),this.rootDirt(e+1,n-1,s),this.rootDirt(e,n-1,s+1),this.rootDirt(e+1,n-1,s+1);return}case yy:{let o=4+r.int(2),a=n+o,l=2+r.int(2),c=r.int(4);for(let h=0;h<l;h++){let u=c+h*(l===2?2:1)+(l===3&&h===2?1:0)&3,f=u===1?1:u===3?-1:0,d=u===0?-1:u===2?1:0,g=2+r.int(3),b=a-2+r.int(2),p=f!==0?1:2,m=e,v=s;for(let _=1;_<=g;_++)m=e+f*_,v=s+d*_,this.put(m,b+(_>1?1:0),v,Ie(Tp,p),!0);let y=1+r.int(2);for(let _=2;_<=y+1;_++)this.put(m,b+_,v,Tp,!0);this.cherryCanopy(m,b+y+2,v,r)}for(let h=n;h<a;h++)this.put(e,h,s,Tp,!0);this.cherryCanopy(e,a+1,s,r),this.rootDirt(e,n-1,s);return}}}cluster(t,e,n,s,r,o,a){let l=Math.ceil(o);for(let c=-a;c<=1;c++){let h=c===1?o-1.2:c===-a?o-.9:o,u=h*h;for(let f=-l;f<=l;f++)for(let d=-l;d<=l;d++){let g=d*d+f*f;g>u||g>(h-1)*(h-1)&&r.next()<.25||this.put(t+d,e+c,n+f,s,!1)}}}cherryCanopy(t,e,n,s){for(let o=-2;o<=1;o++){let a=o===1?1.8:o===0?3.3:o===-1?3.1:2.2,l=a*a;for(let c=-3;c<=3;c++)for(let h=-3;h<=3;h++){let u=h*h+c*c;u>l||o===-2&&(u<2||s.next()<.55)||u>(a-1)*(a-1)&&s.next()<.2||this.put(t+h,e+o,n+c,B3,!1)}}}decorate(t,e){let n=this.blocks,s=this.hm,r=this.bm,o=this.X0,a=this.Z0,l=this.seed;for(let c=0;c<16;c++)for(let h=0;h<16;h++){let u=c<<4|h,f=(c+1)*Oe+h+1,d=s[f],g=r[f],b=o+h,p=a+c,m=n[d<<8|u];if(m===Ci||m===Sp)continue;let v=this.frozen[u],y=Ls(l^ik,b,p),_=(y&65535)/65536,w=(y>>>16)/65536;if(d<62){if(v)continue;let A=62-d;if(g===jn&&A<=2)_<.09&&n[16128|u]===Ci&&(n[16128|u]=z3);else if(A>=2&&A<=14&&(m===Mn||m===Nn||m===Pi||m===sr)){let R=this.nGrass.noise2(b*.07142857142857142,p*.07142857142857142),P=g===Ii?.22:.12+.3*$e(-.2,.6,R);_<P&&n[d+1<<8|u]===ya&&(n[d+1<<8|u]=H3)}continue}let S=d+1<<8|u;if(!(d>=255||n[S]!==Ci)&&!v){if(d===62&&(m===Zn||m===Mn||m===Pi||m===xl||m===to)&&this.waterBeside(f,h,c)&&_<.22&&this.nFlower.noise2(b*(1/20),p*(1/20))>-.3){let A=1+(y>>>20)%3;for(let R=1;R<=A&&n[d+R<<8|u]===Ci;R++)n[d+R<<8|u]=O3;continue}m===Zn?this.plant(g,b,p,d,u,_,w):m===xl||m===_p?_<.1?n[S]=kp:_<.15?n[S]=Ml:_<.16&&(n[S]=fy):m===Mn&&g===xa?_<.012&&(n[S]=uy):m===to&&g===jn&&_<.05&&(n[S]=Ml)}}this.cacti(t,e),this.pumpkins(t,e),this.snowCover()}waterBeside(t,e,n){let s=this.hm,r=(o,a,l)=>s[o]>=62?!1:a>=0&&a<16&&l>=0&&l<16?this.blocks[15872|l<<4|a]===ya:this.tm[o]>=rr;return r(t+1,e+1,n)||r(t-1,e-1,n)||r(t+Oe,e,n+1)||r(t-Oe,e,n-1)}shaded(t,e){let n=this.blocks;for(let s=e+2;s<Math.min(256,e+18);s++)if(ei[n[s<<8|t]&1023])return!0;return!1}plant(t,e,n,s,r,o,a){var p;let l=this.blocks,c=s+1<<8|r,h=this.nGrass.noise2(e*(1/19),n*(1/19)),u=this.nFlower.noise2(e*(1/26),n*(1/26)),f=0,d=0,g=0,b=0;switch(t){case ji:f=.22+.22*h,g=u>.4?.12:.006;break;case or:f=.14+.1*h,d=.02,g=u>.5?.05:.005,b=.03;break;case io:f=.16+.1*h,d=.015,g=u>.45?.06:.006,b=.015;break;case jn:f=.16+.08*h,d=.03,g=.012,b=.02;break;case Aa:f=.28+.12*h,g=u>.2?.06:.01;break;case Li:f=.2+.12*h,d=s<118?.05:.01,g=u>.3?.07:.004;break;case Ii:case no:f=.1,g=.003;break;default:f=.15}if(o<g){let m=(p=Qi[t])!=null?p:Qi[ji],v=Math.floor((this.nFlowerType.noise2(e*(1/40),n*(1/40))*.5+.5)*m.length);a<.2&&(v=Math.floor(a*5*m.length)),l[c]=m[Math.max(0,Math.min(m.length-1,v))];return}if(b>0&&o<g+b&&this.shaded(r,s)){l[c]=a<.6?fy:W3;return}if(o<g+b+d){l[c]=kp;return}o<g+b+d+f&&(l[c]=a<.08&&t!==ji?kp:Ml)}cacti(t,e){let n=this.blocks,s=this.hm,r=this.bm;for(let o=0;o<4;o++)for(let a=0;a<4;a++){let l=Ls(this.seed^ak,t*4+a,e*4+o);if((l&65535)/65536>.08)continue;let c=a*4+1+(l>>>16&1),h=o*4+1+(l>>>17&1),u=(h+1)*Oe+c+1,f=s[u];if(r[u]!==xa||f<63||f>240)continue;let d=h<<4|c;if(n[f<<8|d]!==Mn||s[u+1]>f||s[u-1]>f||s[u+Oe]>f||s[u-Oe]>f)continue;let g=1+(l>>>18)%3;for(let b=1;b<=g;b++){let p=f+b<<8|d;if(n[p]!==Ci&&n[p]!==uy)break;n[p]=dy}}}pumpkins(t,e){let n=Ls(this.seed^lk,t,e);if((n&65535)/65536>.035)return;let s=this.blocks,r=this.hm,o=this.bm,a=4+(n>>>16&7),l=4+(n>>>19&7),c=this.rng2.seed(n);for(let h=-3;h<=3;h++)for(let u=-3;u<=3;u++){let f=c.next()<.22,d=a+u,g=l+h;if(!f)continue;let b=(g+1)*Oe+d+1,p=o[b];if(p!==ji&&p!==or&&p!==io&&p!==Li)continue;let m=r[b],v=g<<4|d;if(s[m<<8|v]!==Zn)continue;let y=m+1<<8|v;(s[y]===Ci||s[y]===Ml)&&(s[y]=G3)}}snowCover(){let t=this.blocks,e=this.hm;for(let n=0;n<256;n++){if(!this.frozen[n])continue;let s=n&15,r=n>>4,o=e[(r+1)*Oe+s+1],a=Math.min(254,o+40);for(;a>0&&t[a<<8|n]===Ci;)a--;let l=t[a<<8|n];if(l===Zn&&(t[a<<8|n]=ba),!(l===ya||l===cy||l===wl||l===Sp||l===Mp||l===wp||l===dy)&&!(a===o&&this.slopes[n]>=5&&l!==Zn)&&((Fs[l&1023]||ei[l&1023])&&a<255&&t[a+1<<8|n]===Ci&&(t[a+1<<8|n]=Mp),a>o)){let c=o<<8|n;t[c]===Zn&&(t[c]=ba)}}}tints(t){let e=this.tintGrid,n=this.tintBlur,s=this.X0-8,r=this.Z0-8;for(let o=0;o<Jn;o++)for(let a=0;a<Jn;a++){let l=s+a*4,c=r+o*4,h=this.sample(l,c),u=this.sB,f=this.sT,d=Ey[u],g=(o*Jn+a)*9;for(let m=0;m<9;m++)e[g+m]=d[m];if(u===eo||u===Us||u===Ii||u===no||u===Sa){let m=$e(-.15,-.55,f),v=$e(.35,.7,f);for(let y=0;y<3;y++)e[g+6+y]=e[g+6+y]+(J3[y]-e[g+6+y])*m,e[g+6+y]=e[g+6+y]+(j3[y]-e[g+6+y])*v*(u===Us?.6:1)}let b=Math.max($e(95,150,h),$e(rr+.25,rr,f))*(u===jn?0:1);if(b>0)for(let m=0;m<3;m++)e[g+m]+=(Q3[m]-e[g+m])*b,e[g+3+m]+=(tk[m]-e[g+3+m])*b;let p=this.sHum*6;e[g]-=p*.5,e[g+1]+=p*.3,e[g+3]-=p*.5,e[g+4]+=p*.3}for(let o=1;o<Jn-1;o++)for(let a=1;a<Jn-1;a++){let l=(o*Jn+a)*9;for(let c=0;c<9;c++){let h=0;for(let u=-1;u<=1;u++)for(let f=-1;f<=1;f++)h+=e[((o+u)*Jn+a+f)*9+c];n[l+c]=h/9}}for(let o=0;o<16;o++){let a=(o+8)/4,l=Math.floor(a),c=a-l;for(let h=0;h<16;h++){let u=(h+8)/4,f=Math.floor(u),d=u-f,g=(l*Jn+f)*9,b=g+9,p=g+Jn*9,m=p+9,v=(1-d)*(1-c),y=d*(1-c),_=(1-d)*c,w=d*c,S=(o<<4|h)*9;for(let A=0;A<9;A++){let R=n[g+A]*v+n[b+A]*y+n[p+A]*_+n[m+A]*w;t[S+A]=R<0?0:R>255?255:Math.round(R)}}}}findSpawn(){var a;if(this.spawn)return{x:this.spawn.x,z:this.spawn.z};let t=8,e=null,n=null,s=l=>l===ji||l===or,r=l=>l!==eo&&l!==Us&&l!==Ii&&l!==jn;for(let l=0;l<=400&&!n;l++){for(let c=0;c<Math.max(1,l*8)&&!n;c++){let h,u,f=l*2;l===0?(h=0,u=0):c<f?(h=-l+c,u=-l):c<f*2?(h=l,u=-l+(c-f)):c<f*3?(h=l-(c-f*2),u=l):(h=-l,u=l-(c-f*3));let d=h*t,g=u*t,b=this.sample(d,g),p=this.sB;if(!(b<63||b>140||!r(p)||this.isEntrance(d,g))&&!(this.slopeAt(d,g)>2)){if(s(p)){let m=this.verifySpawn(d,g);m&&(n=m)}else!e&&l>0&&(e=this.verifySpawn(d,g));if(!n&&e&&l>128)break}}if(!n&&e&&l>128)break}let o=(a=n!=null?n:e)!=null?a:{x:0,z:0};return this.spawn=o,{x:o.x,z:o.z}}verifySpawn(t,e){let n=Math.floor(t/16),s=Math.floor(e/16),o=this.generate(n,s).blocks,a=null,l=1e9;for(let c=0;c<16;c++)for(let h=0;h<16;h++){let u=n*16+h,f=s*16+c,d=this.sample(u,f);if(d<63||d>250||this.sB===Ii||this.sB===eo||this.sB===Us)continue;let g=c<<4|h,b=o[d<<8|g]&1023;if(!Fs[b]||ei[b])continue;let p=!0;for(let v=d+1;v<=d+3;v++){let y=o[v<<8|g]&1023;if(xe[y]||he[y]){p=!1;break}}if(!p)continue;let m=(u-t)*(u-t)+(f-e)*(f-e);m<l&&(l=m,a={x:u,z:f})}return a}};var Ty='"use strict";(()=>{var Rs=.5*(Math.sqrt(3)-1),Fe=(3-Math.sqrt(3))/6,Ns=1/3,oe=1/6,X=new Float64Array([1,1,0,-1,1,0,1,-1,0,-1,-1,0,1,0,1,-1,0,1,1,0,-1,-1,0,-1,0,1,1,0,-1,1,0,1,-1,0,-1,-1]),Me=new Float64Array([1,0,-1,0,0,1,0,-1,.7071067811865476,.7071067811865476,-.7071067811865476,.7071067811865476,.7071067811865476,-.7071067811865476,-.7071067811865476,-.7071067811865476]);function at(o){return o^=o>>>16,o=Math.imul(o,2146121005),o^=o>>>15,o=Math.imul(o,2221713035),o^=o>>>16,o>>>0}function le(o,e,s){return at((o^Math.imul(e|0,668265261)^Math.imul(s|0,374761393))>>>0)}function it(o,e,s,t){return at((o^Math.imul(e|0,668265261)^Math.imul(s|0,2654435761)^Math.imul(t|0,374761393))>>>0)}var Te=class{constructor(e=0){this.s=e>>>0}seed(e){return this.s=e>>>0,this}u32(){let e=this.s=this.s+1831565813>>>0;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),(e^e>>>14)>>>0}next(){return this.u32()/4294967296}int(e){return Math.floor(this.next()*e)}range(e,s){return e+Math.floor(this.next()*(s-e+1))}chance(e){return this.next()<e}},Ze=class{constructor(e){this.perm=new Uint8Array(512);this.perm12=new Uint8Array(512);this.perm8=new Uint8Array(512);let s=new Uint8Array(256);for(let n=0;n<256;n++)s[n]=n;let t=new Te(at(e>>>0^1540483477));for(let n=255;n>0;n--){let p=t.int(n+1),m=s[n];s[n]=s[p],s[p]=m}for(let n=0;n<512;n++){let p=s[n&255];this.perm[n]=p,this.perm12[n]=p%12,this.perm8[n]=p&7}}noise2(e,s){let t=this.perm,n=this.perm8,p=(e+s)*Rs,m=Math.floor(e+p),u=Math.floor(s+p),d=(m+u)*Fe,i=e-(m-d),c=s-(u-d),r,l;i>c?(r=1,l=0):(r=0,l=1);let a=i-r+Fe,f=c-l+Fe,g=i-1+2*Fe,y=c-1+2*Fe,b=m&255,x=u&255,_=0,k=.5-i*i-c*c;if(k>0){let E=n[b+t[x]]<<1;k*=k,_+=k*k*(Me[E]*i+Me[E+1]*c)}let S=.5-a*a-f*f;if(S>0){let E=n[b+r+t[x+l]]<<1;S*=S,_+=S*S*(Me[E]*a+Me[E+1]*f)}let v=.5-g*g-y*y;if(v>0){let E=n[b+1+t[x+1]]<<1;v*=v,_+=v*v*(Me[E]*g+Me[E+1]*y)}return 99.204*_}noise3(e,s,t){let n=this.perm,p=this.perm12,m=(e+s+t)*Ns,u=Math.floor(e+m),d=Math.floor(s+m),i=Math.floor(t+m),c=(u+d+i)*oe,r=e-(u-c),l=s-(d-c),a=t-(i-c),f,g,y,b,x,_;r>=l?l>=a?(f=1,g=0,y=0,b=1,x=1,_=0):r>=a?(f=1,g=0,y=0,b=1,x=0,_=1):(f=0,g=0,y=1,b=1,x=0,_=1):l<a?(f=0,g=0,y=1,b=0,x=1,_=1):r<a?(f=0,g=1,y=0,b=0,x=1,_=1):(f=0,g=1,y=0,b=1,x=1,_=0);let k=r-f+oe,S=l-g+oe,v=a-y+oe,E=r-b+2*oe,T=l-x+2*oe,B=a-_+2*oe,z=r-1+3*oe,P=l-1+3*oe,M=a-1+3*oe,O=u&255,j=d&255,V=i&255,ae=0,A=.6-r*r-l*l-a*a;if(A>0){let C=p[O+n[j+n[V]]]*3;A*=A,ae+=A*A*(X[C]*r+X[C+1]*l+X[C+2]*a)}let I=.6-k*k-S*S-v*v;if(I>0){let C=p[O+f+n[j+g+n[V+y]]]*3;I*=I,ae+=I*I*(X[C]*k+X[C+1]*S+X[C+2]*v)}let G=.6-E*E-T*T-B*B;if(G>0){let C=p[O+b+n[j+x+n[V+_]]]*3;G*=G,ae+=G*G*(X[C]*E+X[C+1]*T+X[C+2]*B)}let Z=.6-z*z-P*P-M*M;if(Z>0){let C=p[O+1+n[j+1+n[V+1]]]*3;Z*=Z,ae+=Z*Z*(X[C]*z+X[C+1]*P+X[C+2]*M)}return 32*ae}},$t=[0,37.17,-91.43,151.9,-203.3,263.7,-317.1,389.5,-431.9,499.3],zt=[0,-53.71,71.29,-127.3,181.7,-241.1,293.9,-347.3,409.1,-461.7];function ce(o,e,s,t,n=2,p=.5){let m=0,u=1,d=0,i=1;for(let c=0;c<t;c++)m+=u*o.noise2(e*i+$t[c%10],s*i+zt[c%10]),d+=u,u*=p,i*=n;return m/d}function Gt(o,e,s,t,n=2,p=.5){let m=0,u=1,d=0,i=1,c=1;for(let r=0;r<t;r++){let l=1-Math.abs(o.noise2(e*i+$t[r%10],s*i+zt[r%10]));l*=l,l*=c,c=l*1.6>1?1:l*1.6,m+=l*u,d+=u,u*=p,i*=n}return m/d}var he=["white","orange","magenta","light_blue","yellow","lime","pink","gray","light_gray","cyan","purple","blue","brown","green","red","black"],Os=["oak","spruce","birch","jungle","acacia","dark_oak","mangrove","cherry"],de=o=>o.split("_").map(e=>e[0].toUpperCase()+e.slice(1)).join(" "),$e=[],h=o=>($e.push(o),o);h({name:"air",display:"Air",cat:"natural",tex:"missing",solid:!1,transparent:!0,opacity:0,replaceable:!0,item:!1,layer:"cutout",shape:"cross"});h({name:"grass_block",display:"Grass Block",cat:"natural",tex:{top:"grass_top",bottom:"dirt",side:"grass_side"},tint:"grass",tintMask:!0,sound:"grass"});h({name:"snowy_grass_block",display:"Snowy Grass Block",cat:"natural",tex:{top:"snow",bottom:"dirt",side:"grass_side_snowy"},sound:"snow"});h({name:"dirt",display:"Dirt",cat:"natural",tex:"dirt",sound:"gravel"});h({name:"coarse_dirt",display:"Coarse Dirt",cat:"natural",tex:"coarse_dirt",sound:"gravel"});h({name:"podzol",display:"Podzol",cat:"natural",tex:{top:"podzol_top",bottom:"dirt",side:"podzol_side"},sound:"gravel"});h({name:"rooted_dirt",display:"Rooted Dirt",cat:"natural",tex:"rooted_dirt",sound:"gravel"});h({name:"mycelium",display:"Mycelium",cat:"natural",tex:{top:"mycelium_top",bottom:"dirt",side:"mycelium_side"},sound:"grass"});h({name:"dirt_path",display:"Dirt Path",cat:"natural",tex:{top:"path_top",bottom:"dirt",side:"path_side"},sound:"grass"});h({name:"mud",display:"Mud",cat:"natural",tex:"mud",sound:"gravel"});h({name:"clay",display:"Clay",cat:"natural",tex:"clay",sound:"gravel"});h({name:"moss_block",display:"Moss Block",cat:"natural",tex:"moss",sound:"grass"});h({name:"sand",display:"Sand",cat:"natural",tex:"sand",sound:"sand"});h({name:"red_sand",display:"Red Sand",cat:"natural",tex:"red_sand",sound:"sand"});h({name:"gravel",display:"Gravel",cat:"natural",tex:"gravel",sound:"gravel"});h({name:"stone",display:"Stone",cat:"natural",tex:"stone"});h({name:"granite",display:"Granite",cat:"natural",tex:"granite"});h({name:"diorite",display:"Diorite",cat:"natural",tex:"diorite"});h({name:"andesite",display:"Andesite",cat:"natural",tex:"andesite"});h({name:"deepslate",display:"Deepslate",cat:"natural",tex:{top:"deepslate_top",bottom:"deepslate_top",side:"deepslate"},orient:"axis"});h({name:"tuff",display:"Tuff",cat:"natural",tex:"tuff"});h({name:"calcite",display:"Calcite",cat:"natural",tex:"calcite"});h({name:"dripstone_block",display:"Dripstone Block",cat:"natural",tex:"dripstone"});h({name:"bedrock",display:"Bedrock",cat:"natural",tex:"bedrock"});h({name:"snow_block",display:"Snow Block",cat:"natural",tex:"snow",sound:"snow"});h({name:"snow",display:"Snow",cat:"natural",tex:"snow",shape:"layer",sound:"snow",replaceable:!0,support:"solid"});h({name:"ice",display:"Ice",cat:"natural",tex:"ice",layer:"translucent",cullSelf:!0,opacity:1,sound:"glass"});h({name:"packed_ice",display:"Packed Ice",cat:"natural",tex:"packed_ice",sound:"glass"});h({name:"blue_ice",display:"Blue Ice",cat:"natural",tex:"blue_ice",sound:"glass"});h({name:"obsidian",display:"Obsidian",cat:"natural",tex:"obsidian"});h({name:"crying_obsidian",display:"Crying Obsidian",cat:"natural",tex:"crying_obsidian",light:10});h({name:"netherrack",display:"Netherrack",cat:"natural",tex:"netherrack"});h({name:"soul_sand",display:"Soul Sand",cat:"natural",tex:"soul_sand",sound:"sand"});h({name:"soul_soil",display:"Soul Soil",cat:"natural",tex:"soul_soil",sound:"sand"});h({name:"magma_block",display:"Magma Block",cat:"natural",tex:"magma",light:3});h({name:"basalt",display:"Basalt",cat:"natural",tex:{end:"basalt_top",side:"basalt_side"},orient:"axis"});h({name:"blackstone",display:"Blackstone",cat:"natural",tex:{top:"blackstone_top",bottom:"blackstone_top",side:"blackstone"}});h({name:"end_stone",display:"End Stone",cat:"natural",tex:"end_stone"});h({name:"amethyst_block",display:"Block of Amethyst",cat:"natural",tex:"amethyst",sound:"glass"});h({name:"bone_block",display:"Bone Block",cat:"natural",tex:{end:"bone_top",side:"bone_side"},orient:"axis"});var ds=[["coal","Coal"],["iron","Iron"],["copper","Copper"],["gold","Gold"],["redstone","Redstone"],["lapis","Lapis Lazuli"],["diamond","Diamond"],["emerald","Emerald"]];for(let[o,e]of ds)h({name:`${o}_ore`,display:`${e} Ore`,cat:"ores",tex:`ore_stone_${o}`,light:0});for(let[o,e]of ds)h({name:`deepslate_${o}_ore`,display:`Deepslate ${e} Ore`,cat:"ores",tex:`ore_deepslate_${o}`});h({name:"nether_gold_ore",display:"Nether Gold Ore",cat:"ores",tex:"ore_nether_gold"});h({name:"nether_quartz_ore",display:"Nether Quartz Ore",cat:"ores",tex:"ore_nether_quartz"});var Ls=[["coal_block","Block of Coal"],["iron_block","Block of Iron"],["copper_block","Block of Copper"],["gold_block","Block of Gold"],["redstone_block","Block of Redstone"],["lapis_block","Block of Lapis Lazuli"],["diamond_block","Block of Diamond"],["emerald_block","Block of Emerald"],["netherite_block","Block of Netherite"],["raw_iron_block","Block of Raw Iron"],["raw_copper_block","Block of Raw Copper"],["raw_gold_block","Block of Raw Gold"],["exposed_copper","Exposed Copper"],["weathered_copper","Weathered Copper"],["oxidized_copper","Oxidized Copper"]];for(let[o,e]of Ls)h({name:o,display:e,cat:"ores",tex:o,sound:"metal"});for(let o of Os){let e=de(o),s=o;h({name:`${o}_log`,display:`${e} Log`,cat:"wood",tex:{end:`${s}_log_top`,side:`${s}_log`},orient:"axis",sound:"wood"}),h({name:`${o}_wood`,display:`${e} Wood`,cat:"wood",tex:`${s}_log`,orient:"axis",sound:"wood"}),h({name:`stripped_${o}_log`,display:`Stripped ${e} Log`,cat:"wood",tex:{end:`stripped_${o}_log_top`,side:`stripped_${o}_log`},orient:"axis",sound:"wood"}),h({name:`${o}_planks`,display:`${e} Planks`,cat:"wood",tex:`${o}_planks`,sound:"wood"});let t=o!=="spruce"&&o!=="birch"&&o!=="cherry";h({name:`${o}_leaves`,display:`${e} Leaves`,cat:"wood",tex:`${o}_leaves`,layer:"cutout",opacity:1,tint:t?"foliage":"none",sound:"grass",wave:"leaves"}),h({name:`${o}_slab`,display:`${e} Slab`,cat:"wood",tex:`${o}_planks`,shape:"slab",sound:"wood"}),h({name:`${o}_stairs`,display:`${e} Stairs`,cat:"wood",tex:`${o}_planks`,shape:"stairs",sound:"wood"}),h({name:`${o}_fence`,display:`${e} Fence`,cat:"wood",tex:`${o}_planks`,shape:"fence",family:"wood_fence",sound:"wood"}),h({name:`${o}_door`,display:`${e} Door`,cat:"wood",tex:{top:`${o}_door_top`,bottom:`${o}_door_bottom`,side:`${o}_door_bottom`},shape:"door",layer:"cutout",sound:"wood"}),h({name:`${o}_trapdoor`,display:`${e} Trapdoor`,cat:"wood",tex:`${o}_trapdoor`,shape:"trapdoor",layer:"cutout",sound:"wood"}),h({name:`${o}_sapling`,display:`${e} Sapling`,cat:"wood",tex:`${o}_sapling`,shape:"cross",layer:"cutout",solid:!1,support:"soil",sound:"grass",wave:"plant"})}var Is=[["cobblestone","Cobblestone","cobblestone"],["mossy_cobblestone","Mossy Cobblestone","mossy_cobblestone"],["smooth_stone","Smooth Stone","smooth_stone"],["stone_bricks","Stone Bricks","stone_bricks"],["mossy_stone_bricks","Mossy Stone Bricks","mossy_stone_bricks"],["cracked_stone_bricks","Cracked Stone Bricks","cracked_stone_bricks"],["chiseled_stone_bricks","Chiseled Stone Bricks","chiseled_stone_bricks"],["bricks","Bricks","bricks"],["polished_granite","Polished Granite","polished_granite"],["polished_diorite","Polished Diorite","polished_diorite"],["polished_andesite","Polished Andesite","polished_andesite"],["cobbled_deepslate","Cobbled Deepslate","cobbled_deepslate"],["polished_deepslate","Polished Deepslate","polished_deepslate"],["deepslate_bricks","Deepslate Bricks","deepslate_bricks"],["deepslate_tiles","Deepslate Tiles","deepslate_tiles"],["polished_tuff","Polished Tuff","polished_tuff"],["mud_bricks","Mud Bricks","mud_bricks"],["packed_mud","Packed Mud","packed_mud"],["prismarine","Prismarine","prismarine"],["prismarine_bricks","Prismarine Bricks","prismarine_bricks"],["dark_prismarine","Dark Prismarine","dark_prismarine"],["nether_bricks","Nether Bricks","nether_bricks"],["red_nether_bricks","Red Nether Bricks","red_nether_bricks"],["cracked_nether_bricks","Cracked Nether Bricks","cracked_nether_bricks"],["chiseled_nether_bricks","Chiseled Nether Bricks","chiseled_nether_bricks"],["polished_blackstone","Polished Blackstone","polished_blackstone"],["polished_blackstone_bricks","Polished Blackstone Bricks","polished_blackstone_bricks"],["end_stone_bricks","End Stone Bricks","end_stone_bricks"],["purpur_block","Purpur Block","purpur"],["terracotta","Terracotta","terracotta"]];for(let[o,e,s]of Is)h({name:o,display:e,cat:"building",tex:s});h({name:"sandstone",display:"Sandstone",cat:"building",tex:{top:"sandstone_top",bottom:"sandstone_bottom",side:"sandstone"}});h({name:"chiseled_sandstone",display:"Chiseled Sandstone",cat:"building",tex:{top:"sandstone_top",bottom:"sandstone_top",side:"chiseled_sandstone"}});h({name:"cut_sandstone",display:"Cut Sandstone",cat:"building",tex:{top:"sandstone_top",bottom:"sandstone_top",side:"cut_sandstone"}});h({name:"smooth_sandstone",display:"Smooth Sandstone",cat:"building",tex:"sandstone_top"});h({name:"red_sandstone",display:"Red Sandstone",cat:"building",tex:{top:"red_sandstone_top",bottom:"red_sandstone_bottom",side:"red_sandstone"}});h({name:"chiseled_red_sandstone",display:"Chiseled Red Sandstone",cat:"building",tex:{top:"red_sandstone_top",bottom:"red_sandstone_top",side:"chiseled_red_sandstone"}});h({name:"cut_red_sandstone",display:"Cut Red Sandstone",cat:"building",tex:{top:"red_sandstone_top",bottom:"red_sandstone_top",side:"cut_red_sandstone"}});h({name:"smooth_red_sandstone",display:"Smooth Red Sandstone",cat:"building",tex:"red_sandstone_top"});h({name:"quartz_block",display:"Block of Quartz",cat:"building",tex:{top:"quartz_top",bottom:"quartz_top",side:"quartz_side"}});h({name:"chiseled_quartz_block",display:"Chiseled Quartz Block",cat:"building",tex:{end:"chiseled_quartz_top",side:"chiseled_quartz"},orient:"axis"});h({name:"quartz_pillar",display:"Quartz Pillar",cat:"building",tex:{end:"quartz_pillar_top",side:"quartz_pillar"},orient:"axis"});h({name:"quartz_bricks",display:"Quartz Bricks",cat:"building",tex:"quartz_bricks"});h({name:"smooth_quartz",display:"Smooth Quartz Block",cat:"building",tex:"quartz_top"});h({name:"purpur_pillar",display:"Purpur Pillar",cat:"building",tex:{end:"purpur_pillar_top",side:"purpur_pillar"},orient:"axis"});h({name:"glass",display:"Glass",cat:"building",tex:"glass",layer:"cutout",cullSelf:!0,sound:"glass"});h({name:"tinted_glass",display:"Tinted Glass",cat:"building",tex:"tinted_glass",layer:"translucent",cullSelf:!0,opacity:15,sound:"glass"});h({name:"glass_pane",display:"Glass Pane",cat:"building",tex:"glass",shape:"pane",layer:"cutout",family:"pane",sound:"glass"});h({name:"iron_bars",display:"Iron Bars",cat:"building",tex:"iron_bars",shape:"pane",layer:"cutout",family:"pane",sound:"metal"});var Ps=[["stone","Stone","stone",!1],["cobblestone","Cobblestone","cobblestone",!0],["mossy_cobblestone","Mossy Cobblestone","mossy_cobblestone",!0],["smooth_stone","Smooth Stone","smooth_stone_slab_side",!1],["stone_brick","Stone Brick","stone_bricks",!0],["brick","Brick","bricks",!0],["sandstone","Sandstone","sandstone_top",!0],["red_sandstone","Red Sandstone","red_sandstone_top",!0],["quartz","Quartz","quartz_top",!1],["granite","Granite","granite",!0],["diorite","Diorite","diorite",!0],["andesite","Andesite","andesite",!0],["polished_andesite","Polished Andesite","polished_andesite",!1],["cobbled_deepslate","Cobbled Deepslate","cobbled_deepslate",!0],["deepslate_brick","Deepslate Brick","deepslate_bricks",!0],["prismarine","Prismarine","prismarine",!0],["nether_brick","Nether Brick","nether_bricks",!0],["blackstone","Blackstone","blackstone",!0],["end_stone_brick","End Stone Brick","end_stone_bricks",!0],["purpur","Purpur","purpur",!1],["mud_brick","Mud Brick","mud_bricks",!0]];for(let[o,e,s,t]of Ps){let n=o==="smooth_stone"?{top:"smooth_stone",bottom:"smooth_stone",side:s}:s;h({name:`${o}_slab`,display:`${e} Slab`,cat:"building",tex:n,shape:"slab"}),o!=="smooth_stone"&&h({name:`${o}_stairs`,display:`${e} Stairs`,cat:"building",tex:s,shape:"stairs"}),t&&h({name:`${o}_wall`,display:`${e} Wall`,cat:"building",tex:s,shape:"wall",family:"wall"})}for(let o of he)h({name:`${o}_wool`,display:`${de(o)} Wool`,cat:"colored",tex:`wool_${o}`,sound:"wool"});for(let o of he)h({name:`${o}_carpet`,display:`${de(o)} Carpet`,cat:"colored",tex:`wool_${o}`,shape:"carpet",sound:"wool",support:"solid"});for(let o of he)h({name:`${o}_concrete`,display:`${de(o)} Concrete`,cat:"colored",tex:`concrete_${o}`});for(let o of he)h({name:`${o}_concrete_powder`,display:`${de(o)} Concrete Powder`,cat:"colored",tex:`powder_${o}`,sound:"sand"});for(let o of he)h({name:`${o}_terracotta`,display:`${de(o)} Terracotta`,cat:"colored",tex:`terracotta_${o}`});for(let o of he)h({name:`${o}_glazed_terracotta`,display:`${de(o)} Glazed Terracotta`,cat:"colored",tex:`glazed_${o}`,orient:"horizontal"});for(let o of he)h({name:`${o}_stained_glass`,display:`${de(o)} Stained Glass`,cat:"colored",tex:`stained_glass_${o}`,layer:"translucent",cullSelf:!0,sound:"glass"});for(let o of he)h({name:`${o}_stained_glass_pane`,display:`${de(o)} Stained Glass Pane`,cat:"colored",tex:`stained_glass_${o}`,shape:"pane",layer:"translucent",family:"pane",sound:"glass"});h({name:"glowstone",display:"Glowstone",cat:"light",tex:"glowstone",light:15,sound:"glass"});h({name:"sea_lantern",display:"Sea Lantern",cat:"light",tex:"sea_lantern",light:15,sound:"glass"});h({name:"torch",display:"Torch",cat:"light",tex:"torch",shape:"torch",layer:"cutout",light:14,solid:!1,sound:"wood"});h({name:"soul_torch",display:"Soul Torch",cat:"light",tex:"soul_torch",shape:"torch",layer:"cutout",light:10,solid:!1,sound:"wood"});h({name:"lantern",display:"Lantern",cat:"light",tex:"lantern",shape:"lantern",layer:"cutout",light:15,sound:"metal"});h({name:"soul_lantern",display:"Soul Lantern",cat:"light",tex:"soul_lantern",shape:"lantern",layer:"cutout",light:10,sound:"metal"});h({name:"shroomlight",display:"Shroomlight",cat:"light",tex:"shroomlight",light:15,sound:"wool"});h({name:"jack_o_lantern",display:"Jack o\'Lantern",cat:"light",tex:{top:"pumpkin_top",bottom:"pumpkin_top",side:"pumpkin_side",front:"jack_o_lantern"},orient:"horizontal",light:15,sound:"wood"});h({name:"redstone_lamp",display:"Redstone Lamp",cat:"light",tex:"redstone_lamp_on",light:15,sound:"glass"});h({name:"ochre_froglight",display:"Ochre Froglight",cat:"light",tex:{end:"froglight_ochre_top",side:"froglight_ochre"},orient:"axis",light:15});h({name:"verdant_froglight",display:"Verdant Froglight",cat:"light",tex:{end:"froglight_verdant_top",side:"froglight_verdant"},orient:"axis",light:15});h({name:"pearlescent_froglight",display:"Pearlescent Froglight",cat:"light",tex:{end:"froglight_pearl_top",side:"froglight_pearl"},orient:"axis",light:15});h({name:"end_rod",display:"End Rod",cat:"light",tex:"end_rod",shape:"rod",layer:"cutout",light:14,sound:"glass"});h({name:"campfire_log_glow",display:"Glowing Embers",cat:"light",tex:"embers",light:12,sound:"wood"});h({name:"bookshelf",display:"Bookshelf",cat:"decor",tex:{top:"oak_planks",bottom:"oak_planks",side:"bookshelf"},sound:"wood"});h({name:"crafting_table",display:"Crafting Table",cat:"decor",tex:{top:"crafting_table_top",bottom:"oak_planks",side:"crafting_table_side",front:"crafting_table_front"},orient:"horizontal",sound:"wood"});h({name:"furnace",display:"Furnace",cat:"decor",tex:{top:"furnace_top",bottom:"furnace_top",side:"furnace_side",front:"furnace_front"},orient:"horizontal"});h({name:"blast_furnace",display:"Blast Furnace",cat:"decor",tex:{top:"blast_furnace_top",bottom:"blast_furnace_top",side:"blast_furnace_side",front:"blast_furnace_front"},orient:"horizontal"});h({name:"chest",display:"Chest",cat:"decor",tex:{top:"chest_top",bottom:"chest_top",side:"chest_side",front:"chest_front"},shape:"chest",orient:"horizontal",layer:"cutout",sound:"wood"});h({name:"barrel",display:"Barrel",cat:"decor",tex:{end:"barrel_top",side:"barrel_side"},orient:"axis",sound:"wood"});h({name:"note_block",display:"Note Block",cat:"decor",tex:"note_block",sound:"wood"});h({name:"jukebox",display:"Jukebox",cat:"decor",tex:{top:"jukebox_top",bottom:"jukebox_side",side:"jukebox_side"},sound:"wood"});h({name:"tnt",display:"TNT",cat:"decor",tex:{top:"tnt_top",bottom:"tnt_bottom",side:"tnt_side"},sound:"grass"});h({name:"target",display:"Target",cat:"decor",tex:{top:"target_top",bottom:"target_top",side:"target_side"},sound:"grass"});h({name:"pumpkin",display:"Pumpkin",cat:"decor",tex:{top:"pumpkin_top",bottom:"pumpkin_top",side:"pumpkin_side"},sound:"wood"});h({name:"carved_pumpkin",display:"Carved Pumpkin",cat:"decor",tex:{top:"pumpkin_top",bottom:"pumpkin_top",side:"pumpkin_side",front:"carved_pumpkin"},orient:"horizontal",sound:"wood"});h({name:"melon",display:"Melon",cat:"decor",tex:{top:"melon_top",bottom:"melon_top",side:"melon_side"},sound:"wood"});h({name:"hay_block",display:"Hay Bale",cat:"decor",tex:{end:"hay_top",side:"hay_side"},orient:"axis",sound:"grass"});h({name:"sponge",display:"Sponge",cat:"decor",tex:"sponge",sound:"grass"});h({name:"wet_sponge",display:"Wet Sponge",cat:"decor",tex:"wet_sponge",sound:"grass"});h({name:"slime_block",display:"Slime Block",cat:"decor",tex:"slime",layer:"translucent",cullSelf:!0,sound:"slime"});h({name:"honey_block",display:"Honey Block",cat:"decor",tex:"honey",layer:"translucent",cullSelf:!0,sound:"slime"});h({name:"honeycomb_block",display:"Honeycomb Block",cat:"decor",tex:"honeycomb",sound:"wool"});h({name:"dried_kelp_block",display:"Dried Kelp Block",cat:"decor",tex:{top:"kelp_top",bottom:"kelp_top",side:"kelp_side"},sound:"grass"});h({name:"brown_mushroom_block",display:"Brown Mushroom Block",cat:"decor",tex:"mushroom_brown",sound:"wood"});h({name:"red_mushroom_block",display:"Red Mushroom Block",cat:"decor",tex:"mushroom_red",sound:"wood"});h({name:"mushroom_stem",display:"Mushroom Stem",cat:"decor",tex:"mushroom_stem",sound:"wood"});h({name:"cobweb",display:"Cobweb",cat:"decor",tex:"cobweb",shape:"cross",layer:"cutout",solid:!1,sound:"wool"});h({name:"cactus",display:"Cactus",cat:"decor",tex:{top:"cactus_top",bottom:"cactus_bottom",side:"cactus_side"},shape:"cactus",layer:"cutout",support:"cactus",sound:"wool"});h({name:"sugar_cane",display:"Sugar Cane",cat:"decor",tex:"sugar_cane",shape:"cross",layer:"cutout",solid:!1,support:"cane",sound:"grass"});h({name:"short_grass",display:"Short Grass",cat:"decor",tex:"tall_grass",shape:"cross",layer:"cutout",solid:!1,tint:"grass",replaceable:!0,support:"soil",sound:"grass",wave:"plant"});h({name:"fern",display:"Fern",cat:"decor",tex:"fern",shape:"cross",layer:"cutout",solid:!1,tint:"grass",replaceable:!0,support:"soil",sound:"grass",wave:"plant"});h({name:"dead_bush",display:"Dead Bush",cat:"decor",tex:"dead_bush",shape:"cross",layer:"cutout",solid:!1,replaceable:!0,support:"sand",sound:"grass",wave:"plant"});var Us=[["dandelion","Dandelion"],["poppy","Poppy"],["blue_orchid","Blue Orchid"],["allium","Allium"],["azure_bluet","Azure Bluet"],["red_tulip","Red Tulip"],["orange_tulip","Orange Tulip"],["white_tulip","White Tulip"],["pink_tulip","Pink Tulip"],["oxeye_daisy","Oxeye Daisy"],["cornflower","Cornflower"],["lily_of_the_valley","Lily of the Valley"]];for(let[o,e]of Us)h({name:o,display:e,cat:"decor",tex:`flower_${o}`,shape:"cross",layer:"cutout",solid:!1,support:"soil",sound:"grass",wave:"plant"});h({name:"brown_mushroom",display:"Brown Mushroom",cat:"decor",tex:"brown_mushroom",shape:"cross",layer:"cutout",solid:!1,support:"solid",sound:"grass"});h({name:"red_mushroom",display:"Red Mushroom",cat:"decor",tex:"red_mushroom",shape:"cross",layer:"cutout",solid:!1,support:"solid",sound:"grass"});h({name:"lily_pad",display:"Lily Pad",cat:"decor",tex:"lily_pad",shape:"lily",layer:"cutout",solid:!0,tint:"foliage",support:"water",sound:"grass"});h({name:"seagrass",display:"Seagrass",cat:"decor",tex:"seagrass",shape:"cross",layer:"cutout",solid:!1,item:!1,sound:"grass",wave:"plant"});h({name:"water",display:"Water",cat:"fluids",tex:"water",shape:"fluid",layer:"water",fluid:!0,solid:!1,opacity:1,replaceable:!0,cullSelf:!0,tint:"water",sound:"liquid"});h({name:"lava",display:"Lava",cat:"fluids",tex:"lava",shape:"fluid",layer:"lava",fluid:!0,solid:!1,light:15,opacity:0,replaceable:!0,cullSelf:!0,sound:"liquid"});var R=$e.length,ut={};$e.forEach((o,e)=>{ut[o.name]=e});var Fs=["cube","slab","stairs","fence","wall","cross","torch","door","trapdoor","pane","fluid","layer","carpet","cactus","lantern","chest","rod","lily"],$s=Object.fromEntries(Fs.map((o,e)=>[o,e])),zs=["opaque","cutout","translucent","water","lava"],ct=Object.fromEntries(zs.map((o,e)=>[o,e])),Gs=new Uint8Array(R),dt=new Uint8Array(R),Hs=new Uint8Array(R),us=new Uint8Array(R),Je=new Uint8Array(R),et=new Uint8Array(R),pt=new Uint8Array(R),Ws=new Uint8Array(R),Ks=new Uint8Array(R),qs=new Uint8Array(R),js=new Uint8Array(R),Vs=new Uint8Array(R),Xs=new Uint8Array(R),Be=new Uint8Array(R),Ys=new Uint8Array(R),Zs=new Uint8Array(R),lt=[""],Qs=["none","grass","foliage","water"],qt,jt,Vt,Xt,Yt,Zt;for(let o=0;o<R;o++){let e=$e[o],s=(qt=e.shape)!=null?qt:"cube",t=(jt=e.layer)!=null?jt:"opaque";Gs[o]=$s[s],dt[o]=ct[t],Hs[o]=(Vt=e.light)!=null?Vt:0;let n=s==="cube"&&t==="opaque";if(Je[o]=n&&e.transparent!==!0?1:0,us[o]=(Xt=e.opacity)!=null?Xt:n?15:0,et[o]=(Yt=e.solid)==null||Yt?1:0,pt[o]=e.fluid?1:0,Ws[o]=e.cullSelf?1:0,Ks[o]=e.replaceable?1:0,qs[o]=Qs.indexOf((Zt=e.tint)!=null?Zt:"none"),js[o]=e.tintMask?1:0,Vs[o]=e.orient==="axis"?1:e.orient==="horizontal"?2:0,Xs[o]=e.wave==="plant"?1:e.wave==="leaves"?2:0,Be[o]=e.name.endsWith("_leaves")?1:0,e.family){let p=lt.indexOf(e.family);p<0&&(p=lt.length,lt.push(e.family)),Ys[o]=p}Zs[o]=o!==0&&!e.fluid?1:0}et[0]=0;us[0]=0;var Ht=[],Wt=new Map;function Qe(o){let e=Wt.get(o);return e===void 0&&(e=Ht.length,Ht.push(o),Wt.set(o,e)),e}Qe("missing");var ps=new Uint16Array(R*6),Qt,Jt,es,ts,ss,os,ns,rs,as,is,ls,cs;for(let o=0;o<R;o++){let e=$e[o].tex,s;if(typeof e=="string")s=[e,e,e,e,e,e];else{let t=(es=(Jt=(Qt=e.side)!=null?Qt:e.all)!=null?Jt:e.end)!=null?es:"missing",n=(ss=(ts=e.top)!=null?ts:e.end)!=null?ss:t,p=(ns=(os=e.bottom)!=null?os:e.end)!=null?ns:n;s=[(rs=e.east)!=null?rs:t,(as=e.west)!=null?as:t,n,p,(is=e.south)!=null?is:t,(cs=(ls=e.north)!=null?ls:e.front)!=null?cs:t]}for(let t=0;t<6;t++)ps[o*6+t]=Qe(s[t])}var Lo={water_still:Qe("water"),lava_still:Qe("lava")},Kt=new Uint8Array(1024);for(let o=0;o<R;o++){let e=dt[o]===ct.cutout?1:dt[o]===ct.translucent?2:0;for(let s=0;s<6;s++){let t=ps[o*6+s];e>Kt[t]&&(Kt[t]=e)}}var Js=10,ht=(o,e=0)=>o|e<<Js;if(R>1024)throw new Error("Too many blocks for 10-bit ids");var mt=18,Po=mt*mt*mt;var we=0,ue=1,Se=2,ne=3,be=4,ve=5,Oe=6,Le=7,te=8,Ie=9,q=10,Ue=11,se=12,Pe=13;function w(o){let e=ut[o];if(e===void 0)throw new Error(`generator: unknown block ${o}`);return e}var Q=0,ft=w("bedrock"),U=w("stone"),ze=w("deepslate"),Dt=w("tuff"),st=w("granite"),ot=w("diorite"),nt=w("andesite"),ee=w("dirt"),W=w("grass_block"),De=w("snowy_grass_block"),Ge=w("podzol"),bt=w("coarse_dirt"),ke=w("mud"),me=w("clay"),F=w("sand"),_t=w("sandstone"),$=w("gravel"),yt=w("snow_block"),gt=w("snow"),hs=w("ice"),He=w("packed_ice"),to=w("calcite"),Ce=w("water"),xt=w("lava"),kt=w("oak_log"),wt=w("oak_leaves"),so=w("birch_log"),oo=w("birch_leaves"),no=w("spruce_log"),ms=w("spruce_leaves"),St=w("cherry_log"),ro=w("cherry_leaves"),tt=w("dark_oak_log"),ao=w("dark_oak_leaves"),We=w("short_grass"),vt=w("fern"),fs=w("dead_bush"),bs=w("cactus"),io=w("sugar_cane"),lo=w("lily_pad"),co=w("seagrass"),uo=w("pumpkin"),_s=w("brown_mushroom"),po=w("red_mushroom"),_e=w("dandelion"),Ee=w("poppy"),ho=w("blue_orchid"),Ss=w("allium"),vs=w("azure_bluet"),mo=w("red_tulip"),fo=w("orange_tulip"),As=w("white_tulip"),Ct=w("pink_tulip"),Rt=w("oxeye_daisy"),Es=w("cornflower"),Ms=w("lily_of_the_valley"),Ts=["coal","iron","copper","gold","redstone","lapis","diamond","emerald"],ys=Ts.map(o=>w(`${o}_ore`)),gs=Ts.map(o=>w(`deepslate_${o}_ore`)),xs=[[0,20,15,5,128,0],[0,6,17,60,128,0],[2,12,10,20,96,1],[1,10,9,5,72,1],[1,3,9,5,24,0],[3,2,9,5,32,1],[4,6,8,5,16,0],[5,2,7,5,32,1],[6,1,8,5,16,0]],ks=[[st,1,2,52,0,64],[ot,1,2,52,0,64],[nt,1,2,52,0,64],[st,1,.25,52,64,128],[ot,1,.25,52,64,128],[nt,1,.25,52,64,128],[Dt,2,2,52,0,16],[ee,1,4,30,0,160],[$,1,5,30,0,160]],fe=-.5,bo=.42,_o=.05,yo=9,J=0,Ke=1,At=2,ws=3,Et=4,Mt=5,qe=6,Tt=7,Re=[-1.2,-.62,-.45,-.3,-.2,-.14,-.1,-.06,0,.3,1.2],Ne=[29,35,42,48,54,58.5,61.6,63.2,64.8,70,82];function go(o){if(o<=Re[0])return Ne[0];for(let e=1;e<Re.length;e++)if(o<Re[e]){let s=(o-Re[e-1])/(Re[e]-Re[e-1]);return Ne[e-1]+(Ne[e]-Ne[e-1])*s}return Ne[Ne.length-1]}function L(o,e,s){let t=(s-o)/(e-o);return t<=0?0:t>=1?1:t*t*(3-2*t)}var Ae=o=>[parseInt(o.slice(1,3),16),parseInt(o.slice(3,5),16),parseInt(o.slice(5,7),16)],Bs=[];function H(o,e,s,t){Bs[o]=[...Ae(e),...Ae(s),...Ae(t)]}H(we,"#8eb971","#71a74d","#3f76e4");H(ue,"#8eb971","#71a74d","#3a69d6");H(Se,"#91bd59","#77ab2f","#3f76e4");H(ne,"#91bd59","#77ab2f","#3f76e4");H(be,"#79c05a","#59ae30","#3f76e4");H(ve,"#88bb67","#6ba941","#3f76e4");H(Oe,"#bfb755","#aea42a","#3f8ee4");H(Le,"#80b497","#60a17b","#3938c9");H(te,"#8ab689","#6da36b","#3f6ee0");H(Ie,"#80b497","#60a17b","#3938c9");H(q,"#6a7039","#6a7039","#617b64");H(Ue,"#b6db61","#b6db61","#5db7ef");H(se,"#8eb971","#71a74d","#3f76e4");H(Pe,"#8ab689","#6da36b","#3d5fd9");var xo=Ae("#3d57d6"),ko=Ae("#45adf2"),wo=Ae("#80b497"),So=Ae("#60a17b"),re=[];re[ne]=[_e,Ee,vs,Rt,Es,mo,fo,As,Ct,_e,Ee];re[be]=[_e,Ee,Ms,Ee,_e];re[ve]=[_e,Ee,Ms,Rt];re[q]=[ho];re[Ue]=[Ct,Ct,As,Ss];re[te]=[Ss,vs,Es,_e,Rt,Ee];re[se]=[_e,Ee];re[Se]=[_e];var vo=461845907,Ao=739982445,Eo=695872825,Mo=1799596469,To=1597334677,Bo=1013904242,Do=2084215391,Co=1327217884,Ro=295875524,No=195936478,N=18,Bt=N*N,K=9,Y=65,rt=class{constructor(e){this.sB=0;this.sT=0;this.sHum=0;this.sC=0;this.sMtn=0;this.sChan=0;this.hm=new Int16Array(Bt);this.bm=new Uint8Array(Bt);this.tm=new Float32Array(Bt);this.frozen=new Uint8Array(256);this.slopes=new Uint8Array(256);this.carveTop=new Int16Array(256);this.tintGrid=new Float32Array(K*K*9);this.tintBlur=new Float32Array(K*K*9);this.caveC=new Float32Array(25*Y);this.caveA=new Float32Array(25*Y);this.caveB=new Float32Array(25*Y);this.colC=new Float32Array(Y);this.colA=new Float32Array(Y);this.colB=new Float32Array(Y);this.cheeseThr=new Float32Array(257);this.spagW2=new Float32Array(257);this.rng=new Te;this.rng2=new Te;this.blocks=new Uint16Array(0);this.X0=0;this.Z0=0;this.fFill=0;this.fDepth=0;this.fUnder=0;this.fUnderDepth=0;this.spawn=null;this.seed=e|0;let s=0,t=()=>new Ze(this.seed+Math.imul(++s,2654435761)|0);this.nCont=t(),this.nWarp=t(),this.nEro=t(),this.nRidge=t(),this.nAmp=t(),this.nHill=t(),this.nDet=t(),this.nRiver=t(),this.nSwamp=t(),this.nTemp=t(),this.nHum=t(),this.nVar=t(),this.nJit=t(),this.nPatch=t(),this.nPatch2=t(),this.nFlower=t(),this.nFlowerType=t(),this.nGrass=t(),this.nForest=t(),this.nEnt=t(),this.nSnow=t(),this.nCheese=t(),this.nCheese2=t(),this.nSpagA=t(),this.nSpagB=t(),this.nSpagW=t();for(let n=0;n<=256;n++){this.cheeseThr[n]=.45+.2*L(24,100,n)+.12*L(4,-2,n);let p=.083+.017*L(80,20,n);this.spagW2[n]=p*p}}sample(e,s){let t=this.nJit.noise2(e*.015625,s*.015625)*.026+this.nJit.noise2(e*.058823529411764705+31.7,s*.058823529411764705-11.3)*.004,n=ce(this.nTemp,e*(1/1500),s*(1/1500),3)*1.45+t,p=ce(this.nHum,e*(1/1150),s*(1/1150),3)*1.45-t,m=ce(this.nVar,e*(1/640),s*(1/640),2)*1.55+t,u=e+this.nWarp.noise2(e*(1/420),s*(1/420))*80,d=s+this.nWarp.noise2(s*(1/420)+57.1,e*(1/420)-23.9)*80,i=ce(this.nCont,u*(1/1800),d*(1/1800),5)*1.75+.1,c=ce(this.nEro,e*(1/1250),s*(1/1250),3)*1.55,r=go(i),l=L(-.12,.25,i),a=L(-.2,.08,i)*L(-.18,-.66,c);if(a>0){let k=Gt(this.nRidge,e*.0016129032258064516,s*.0016129032258064516,5),S=.82+.25*this.nAmp.noise2(e*(1/1100),s*(1/1100)),v=a*a*(3-2*a);r+=v*(20+190*k*Math.sqrt(k))*S}let f=l*(3+16*L(.55,-.2,c))*(1-.6*a)+(1-l)*2.5;r+=ce(this.nHill,e*(1/200),s*(1/200),4)*1.35*f,r+=ce(this.nDet,e*(1/40),s*(1/40),2)*(.9+1.4*l);let g=L(.36,.5,p)*L(-.36,-.22,n)*L(-.28,0,c)*(1-L(.04,.2,a))*L(-.07,.03,i);g>0&&(r+=(61.8+this.nSwamp.noise2(e*(1/13),s*(1/13))*1.8-r)*g);let y=0,b=1-L(.25,.6,a);if(b>0){let k=Math.abs(ce(this.nRiver,e*.0014285714285714286,s*.0014285714285714286,3)*1.7);if(k<.2){let S=1-(1-L(.035,.2,k))*b;if(r>63&&(r=63+(r-63)*S),y=(1-L(0,.045,k))*b,y>0){let v=56.5+this.nDet.noise2(e*.043478260869565216,s*.043478260869565216)*1.5;r>v&&(r+=(v-r)*y)}}}r>185&&(r=185+55*(1-Math.exp((185-r)/55)));let x=Math.floor(r);x<2?x=2:x>250&&(x=250);let _;if(x<62&&i<-.13)_=i<-.5?ue:we;else if(y>.4&&x<=63)_=se;else if(i<-.03+t&&a>.07&&x<78&&x>=59)_=Pe;else if(i<-.035+t*.6&&x<=66&&x>=60)_=Se;else if(a>.32&&x>=92){let k=148+this.nSnow.noise2(e*.016666666666666666,s*.016666666666666666)*10-(n<fe+.1?30:0);_=x>=k?Ie:te}else n<fe?_=Le:n>bo&&p<_o?_=Oe:g>.5?_=q:m>.42&&n>-.3&&n<.32&&p>-.3&&p<.36&&c<.12?_=Ue:m<-.33&&n>-.42&&n<.3&&p>-.12?_=ve:p>.02?_=be:_=ne;return this.sB=_,this.sT=n,this.sHum=p,this.sC=i,this.sMtn=a,this.sChan=y,x}heightAt(e,s){return this.sample(Math.floor(e),Math.floor(s))}biomeAt(e,s){return this.sample(Math.floor(e),Math.floor(s)),this.sB}slopeAt(e,s){let t=this.sample(e+1,s),n=this.sample(e-1,s),p=this.sample(e,s+1),m=this.sample(e,s-1);return Math.max(Math.abs(t-n),Math.abs(p-m))}snowline(e,s){return 122+this.nSnow.noise2(e*(1/37),s*(1/37))*7}isEntrance(e,s){return this.nEnt.noise2(e*(1/85),s*(1/85))>.62}surface(e,s,t,n,p,m){let u=this.nPatch.noise2(e*.09090909090909091,s*.09090909090909091),d=le(this.seed^Ro,e,s),i=3+(d&1);if(this.fFill=ee,this.fDepth=i,this.fUnder=U,this.fUnderDepth=0,t<62){let c=62-t,r;return n===we||n===ue?r=c>16||n===ue?u>-.35?$:F:u>.55&&c<12?me:u<-.45?$:F:n===se?r=u>.5?me:u<-.4?$:F:n===q?r=u>-.1?ke:u<-.55?me:ee:n===Oe||n===Se?r=F:n===Le||n===Ie||n===te||n===Pe?r=u>.1?$:ee:r=u>.55?me:u>.05?F:u>-.45?ee:$,this.fFill=r===me||r===ke?ee:r,this.fDepth=r===me?2:i,r===F&&(this.fUnder=_t,this.fUnderDepth=2),r}switch(n){case Oe:return this.fFill=F,this.fDepth=i+1,this.fUnder=_t,this.fUnderDepth=3+(d>>>1&1),F;case Se:return this.fFill=F,this.fDepth=i,this.fUnder=_t,this.fUnderDepth=2,F;case Pe:return p>2||u>.15?(this.fFill=U,U):(this.fFill=$,this.fDepth=2,$);case Ie:return p>=6?(this.fFill=U,u>.5?to:U):u>.62?(this.fFill=$,this.fDepth=2,$):u<-.66&&p<=2?(this.fFill=He,this.fDepth=2,He):(this.fFill=yt,this.fDepth=1+(d&1),yt);case te:if(p>=5||p>=3&&t>128)return this.fFill=U,u>.66?$:U;if(p>=3&&u>.45)return this.fFill=$,this.fDepth=2,$;this.fDepth=1+(d&1);{let c=this.nPatch2.noise2(e*.029411764705882353,s*.029411764705882353)+u*.15;if(t<114&&c<-.8)return Ge;if(c>.9)return bt}return W;case Le:return p>=6?(this.fFill=U,U):this.nPatch2.noise2(e*(1/22),s*(1/22))>.86?(this.fFill=He,this.fDepth=2,He):De;case q:return u>.52?ke:W;case se:return t<=62?m<fe?$:(this.fFill=F,u>.2?W:F):m<fe?De:W;default:return p>=8?(this.fFill=U,U):W}}generate(e,s){let t=new Uint16Array(65536),n=new Uint8Array(256),p=new Uint8Array(256*9);this.blocks=t;let m=this.X0=e*16,u=this.Z0=s*16,d=this.hm,i=this.bm,c=this.tm;for(let l=0;l<N;l++)for(let a=0;a<N;a++){let f=l*N+a;d[f]=this.sample(m+a-1,u+l-1),i[f]=this.sB,c[f]=this.sT}let r=0;for(let l=0;l<16;l++)for(let a=0;a<16;a++){let f=(l+1)*N+a+1,g=d[f],y=i[f],b=c[f],x=m+a,_=u+l;g>r&&(r=g);let k=Math.max(Math.abs(d[f+1]-d[f-1]),Math.abs(d[f+N]-d[f-N])),S=this.surface(x,_,g,y,k,b),v=l<<4|a;this.slopes[v]=k>255?255:k;let E=g-this.fDepth,T=E-this.fUnderDepth,B=this.fFill,z=this.fUnder;t[v]=ft;for(let M=1;M<g;M++){let O;M>E?O=B:M>T?O=z:M>=20?O=U:M<12?O=ze:O=(it(this.seed^Ao,x,M,_)&7)<20-M?ze:U,M<=4&&it(this.seed^vo,x,M,_)%5<5-M&&(O=ft),t[M<<8|v]=O}t[g<<8|v]=S;let P=b<fe||y===Ie?1:0;if(!P&&(y===te||y===Pe)&&g>=this.snowline(x,_)&&(P=1),this.frozen[v]=P,g<62){for(let M=g+1;M<=62;M++)t[M<<8|v]=Ce;P&&(!(y===we||y===ue)||this.nPatch2.noise2(x*(1/44),_*(1/44))*.75+this.nPatch.noise2(x*(1/9),_*(1/9))*.25>-.12)&&(t[15872|v]=hs)}}this.blobs(e,s),this.caves(r),this.ores(e,s),this.trees(),this.decorate(e,s);for(let l=0;l<16;l++)for(let a=0;a<16;a++)n[l<<4|a]=i[(l+1)*N+a+1];return this.tints(p),this.blocks=new Uint16Array(0),{cx:e,cz:s,blocks:t,biome:n,tint:p}}vein(e,s,t,n,p,m,u,d,i,c,r){let l=this.X0,a=this.Z0,f=this.blocks,g=e.next()*Math.PI,y=p/8,b=Math.sin(g)*y,x=Math.cos(g)*y,_=s+b,k=s-b,S=n+x,v=n-x,E=t+e.int(3)-1,T=t+e.int(3)-1,B=(2*p/16+1)/2+1;if(Math.max(_,k)+B<l||Math.min(_,k)-B>l+16||Math.max(S,v)+B<a||Math.min(S,v)-B>a+16)return;let z=r;for(let P=0;P<z;P++){let M=z>1?P/(z-1):.5,O=_+(k-_)*M,j=E+(T-E)*M,V=S+(v-S)*M,ae=e.next()*p/16,A=((Math.sin(Math.PI*M)+1)*ae+1)/2,I=A*A,G=Math.floor(O-A),Z=Math.floor(O+A),C=Math.floor(V-A),ye=Math.floor(V+A),ge=Math.floor(j-A),ie=Math.floor(j+A);if(G<l&&(G=l),Z>l+15&&(Z=l+15),C<a&&(C=a),ye>a+15&&(ye=a+15),ge<i&&(ge=i),ie>c&&(ie=c),!(G>Z||C>ye||ge>ie))for(let xe=ge;xe<=ie;xe++){let Lt=xe+.5-j,It=Lt*Lt;if(!(It>=I))for(let Ve=C;Ve<=ye;Ve++){let Pt=Ve+.5-V,Ut=It+Pt*Pt;if(Ut>=I)continue;let Cs=xe<<8|Ve-a<<4;for(let Xe=G;Xe<=Z;Xe++){let Ft=Xe+.5-O;if(Ut+Ft*Ft>=I)continue;let Ye=Cs|Xe-l,pe=f[Ye];d===4?pe===U||pe===st||pe===ot||pe===nt?f[Ye]=m:(pe===ze||pe===Dt)&&(f[Ye]=u):(d&1&&pe===U||d&2&&pe===ze)&&(f[Ye]=m)}}}}}blobs(e,s){let t=this.rng,n=this.rng2;for(let p=s-1;p<=s+1;p++)for(let m=e-1;m<=e+1;m++){t.seed(le(this.seed^To,m,p));for(let u=0;u<ks.length;u++){let[d,i,c,r,l,a]=ks[u],f=Math.floor(c);t.next()<c-f&&f++;for(let g=0;g<f;g++){let y=m*16+t.int(16),b=p*16+t.int(16),x=l+t.int(a-l+1);n.seed(t.u32()),this.vein(n,y,x,b,r,d,d,i,Math.max(1,l-4),Math.min(255,a+4),12)}}}}ores(e,s){let t=this.rng,n=this.rng2,p=this.blocks;for(let u=s-1;u<=s+1;u++)for(let d=e-1;d<=e+1;d++){t.seed(le(this.seed^Bo,d,u));for(let i=0;i<xs.length;i++){let[c,r,l,a,f,g]=xs[i],y=r,b=l;c===6&&t.next()<.5&&y++;for(let x=0;x<y;x++){let _=d*16+t.int(16),k=u*16+t.int(16),S=f-a,v=g===1?a+Math.floor((t.next()+t.next())*.5*(S+1)):a+t.int(S+1);c===6&&x>0&&(b=4),n.seed(t.u32()),this.vein(n,_,v,k,b,ys[c],gs[c],4,a,f,Math.max(2,Math.ceil(b*.75)))}}}t.seed(le(this.seed^No,e,s));let m=3+t.int(6);for(let u=0;u<m;u++){let d=t.int(16),i=t.int(16),c=5+t.int(96),r=this.bm[(i+1)*N+d+1];if(r!==te&&r!==Ie)continue;let l=c<<8|i<<4|d,a=p[l];a===U||a===st||a===ot||a===nt?p[l]=ys[7]:(a===ze||a===Dt)&&(p[l]=gs[7])}}caves(e){let s=this.hm,t=this.blocks,n=this.X0,p=this.Z0,m=0;for(let y=0;y<16;y++)for(let b=0;b<16;b++){let x=(y+1)*N+b+1,_=s[x],k=s[x+1],S=s[x-1],v=s[x+N],E=s[x-N],T=Math.min(_,k,S,v,E),B;T<62?B=T-6:this.isEntrance(n+b,p+y)&&T>=64?B=_:B=_-5,B>250&&(B=250),this.carveTop[y<<4|b]=B,B>m&&(m=B)}if(m<1)return;let u=Math.min(Y,(Math.min(e,m)>>2)+2),d=this.caveC,i=this.caveA,c=this.caveB;for(let y=0;y<5;y++)for(let b=0;b<5;b++){let x=n+b*4,_=p+y*4,k=(y*5+b)*Y;for(let S=0;S<u;S++){let v=S*4;d[k+S]=this.nCheese.noise3(x*(1/88),v*(1/44),_*(1/88))*.68+this.nCheese2.noise3(x*(1/30),v*(1/22),_*(1/30))*.32,i[k+S]=this.nSpagA.noise3(x*(1/52),v*(1/30),_*(1/52)),c[k+S]=this.nSpagB.noise3(x*(1/52),v*(1/30),_*(1/52))}}let r=this.colC,l=this.colA,a=this.colB,f=this.cheeseThr,g=this.spagW2;for(let y=0;y<16;y++){let b=y>>2,x=(y&3)*.25;for(let _=0;_<16;_++){let k=y<<4|_,S=this.carveTop[k];if(S<1)continue;let v=_>>2,E=(_&3)*.25,T=(b*5+v)*Y,B=T+Y,z=T+5*Y,P=z+Y,M=(1-E)*(1-x),O=E*(1-x),j=(1-E)*x,V=E*x,ae=Math.min(u,(S>>2)+2);for(let A=0;A<ae;A++)r[A]=d[T+A]*M+d[B+A]*O+d[z+A]*j+d[P+A]*V,l[A]=i[T+A]*M+i[B+A]*O+i[z+A]*j+i[P+A]*V,a[A]=c[T+A]*M+c[B+A]*O+c[z+A]*j+c[P+A]*V;for(let A=1;A<=S;A++){let I=A>>2,G=(A&3)*.25,C=r[I]+(r[I+1]-r[I])*G>f[A];if(!C){let ie=l[I]+(l[I+1]-l[I])*G;if(ie*ie<g[A]){let xe=a[I]+(a[I+1]-a[I])*G;C=ie*ie+xe*xe<g[A]}}if(!C)continue;let ye=A<<8|k,ge=t[ye];ge===ft||ge===Ce||(t[ye]=A<=10?xt:Q)}}}}put(e,s,t,n,p){let m=e-this.X0,u=t-this.Z0;if(m<0||m>15||u<0||u>15||s<1||s>255)return;let d=s<<8|u<<4|m,i=this.blocks[d];p?(i===Q||Be[i&1023]||i===Ce||i===We||i===gt)&&(this.blocks[d]=n):i===Q&&(this.blocks[d]=n)}rootDirt(e,s,t){let n=e-this.X0,p=t-this.Z0;if(n<0||n>15||p<0||p>15||s<1)return;let m=s<<8|p<<4|n,u=this.blocks[m];(u===W||u===De||u===Ge||u===ke)&&(this.blocks[m]=ee)}treeDensity(e,s,t,n){let p=this.nForest.noise2(s*.010416666666666666,t*.010416666666666666);switch(e){case be:return .5+.32*p;case ve:return .46+.28*p;case ne:return p>.55?.12:.012;case q:return .16+.08*p;case Le:return p>.4?.12:.025;case te:return n<116?.13+.15*p:n<126?.04:0;case Ue:return .16+.08*p;case se:return 0;default:return 0}}trees(){let e=this.X0,s=this.Z0,t=yo,n=Math.floor((e-t)/4),p=Math.floor((e+15+t)/4),m=Math.floor((s-t)/4),u=Math.floor((s+15+t)/4),d=this.rng;for(let i=m;i<=u;i++)for(let c=n;c<=p;c++){let r=le(this.seed^Mo,c,i),l=c*4+(r&3),a=i*4+(r>>>2&3);if(l<e-t||l>e+15+t||a<s-t||a>s+15+t)continue;let f=(r>>>8&65535)/65536;if(f>.82)continue;let g=this.sample(l,a),y=this.sB;if(f>=this.treeDensity(y,l,a,g)||g<62-(y===q?1:0)||g>236||this.isEntrance(l,a))continue;let b=this.sT,x=this.slopeAt(l,a);if(x>3)continue;let _=this.surface(l,a,g,y,x,b);if(g>=62&&_!==W&&_!==ee&&_!==Ge&&_!==De&&_!==bt||g<62&&_!==ke&&_!==ee&&_!==me)continue;d.seed(r^2654435769);let k=d.next(),S;switch(y){case be:S=k<.66?J:k<.86?Ke:k<.95?Et:Mt;break;case ve:S=k<.82?Ke:k<.97?Tt:J;break;case ne:S=k<.88?J:Et;break;case q:S=qe;break;case Le:S=At;break;case te:S=b>.25?k<.75?J:Ke:k<.88?At:J;break;case Ue:S=ws;break;default:S=J}S===Mt&&(this.sample(l+1,a)!==g||this.sample(l,a+1)!==g||this.sample(l+1,a+1)!==g)&&(S=J),this.tree(S,l,g+1,a,d)}}leafDisc(e,s,t,n,p,m,u){for(let d=-n;d<=n;d++)for(let i=-n;i<=n;i++)n>0&&(i===n||i===-n)&&(d===n||d===-n)&&m.next()>=u||this.put(e+i,s,t+d,p,!1)}tree(e,s,t,n,p){switch(e){case J:case Ke:case Tt:case qe:{let m=e===J||e===qe?kt:so,u=e===J||e===qe?wt:oo,d=e===J?4+p.int(3):e===Ke?5+p.int(3):e===Tt?8+p.int(3):5+p.int(3),i=e===qe?1:0,c=t+d;for(let r=c-3;r<=c;r++){let l=r-c,a=(l>=-1?1:2)+i;this.leafDisc(s,r,n,a,u,p,l===0?0:.5)}for(let r=t;r<c;r++)this.put(s,r,n,m,!0);this.rootDirt(s,t-1,n);return}case At:{let m=6+p.int(4),u=1+p.int(2),d=2+p.int(2),i=t+m,c=p.int(2),r=1,l=0;this.put(s,i+1,n,ms,!1);for(let a=i;a>=t+u;a--)this.leafDisc(s,a,n,c,ms,p,0),c>=r?(c=l,l=1,r=Math.min(r+1,d)):c++;for(let a=t;a<=i;a++)this.put(s,a,n,no,!0);this.rootDirt(s,t-1,n);return}case Et:{let m=8+p.int(5),u=t+m,d=3+p.int(3);for(let i=0;i<d;i++){let c=p.next()*Math.PI*2,r=2+p.next()*2.5,l=t+Math.floor(m*(.5+p.next()*.4)),a=Math.round(s+Math.cos(c)*r),f=Math.round(n+Math.sin(c)*r),g=l+1+p.int(2);this.cluster(a,g,f,wt,p,2.6,2);let y=Math.ceil(r)+1,b=Math.abs(Math.cos(c))>Math.abs(Math.sin(c))?1:2;for(let x=1;x<=y;x++){let _=x/y;this.put(Math.round(s+(a-s)*_),Math.round(l+(g-l)*_),Math.round(n+(f-n)*_),ht(kt,b),!0)}}this.cluster(s,u,n,wt,p,2.8,2);for(let i=t;i<u;i++)this.put(s,i,n,kt,!0);this.rootDirt(s,t-1,n);return}case Mt:{let m=6+p.int(3),u=t+m,d=s+.5,i=n+.5;for(let c=u-2;c<=u+1;c++){let r=c-u,l=r===1?2.2:r===0?4.2:r===-1?4.6:3.4,a=Math.ceil(l)+1;for(let f=-a;f<=a+1;f++)for(let g=-a;g<=a+1;g++){let y=s+g-d,b=n+f-i,x=y*y+b*b,_=x>(l-1)*(l-1);x<=l*l&&(!_||p.next()<.6)&&this.put(s+g,c,n+f,ao,!1)}}for(let c=t;c<=u;c++)this.put(s,c,n,tt,!0),this.put(s+1,c,n,tt,!0),this.put(s,c,n+1,tt,!0),this.put(s+1,c,n+1,tt,!0);this.rootDirt(s,t-1,n),this.rootDirt(s+1,t-1,n),this.rootDirt(s,t-1,n+1),this.rootDirt(s+1,t-1,n+1);return}case ws:{let m=4+p.int(2),u=t+m,d=2+p.int(2),i=p.int(4);for(let c=0;c<d;c++){let r=i+c*(d===2?2:1)+(d===3&&c===2?1:0)&3,l=r===1?1:r===3?-1:0,a=r===0?-1:r===2?1:0,f=2+p.int(3),g=u-2+p.int(2),y=l!==0?1:2,b=s,x=n;for(let k=1;k<=f;k++)b=s+l*k,x=n+a*k,this.put(b,g+(k>1?1:0),x,ht(St,y),!0);let _=1+p.int(2);for(let k=2;k<=_+1;k++)this.put(b,g+k,x,St,!0);this.cherryCanopy(b,g+_+2,x,p)}for(let c=t;c<u;c++)this.put(s,c,n,St,!0);this.cherryCanopy(s,u+1,n,p),this.rootDirt(s,t-1,n);return}}}cluster(e,s,t,n,p,m,u){let d=Math.ceil(m);for(let i=-u;i<=1;i++){let c=i===1?m-1.2:i===-u?m-.9:m,r=c*c;for(let l=-d;l<=d;l++)for(let a=-d;a<=d;a++){let f=a*a+l*l;f>r||f>(c-1)*(c-1)&&p.next()<.25||this.put(e+a,s+i,t+l,n,!1)}}}cherryCanopy(e,s,t,n){for(let m=-2;m<=1;m++){let u=m===1?1.8:m===0?3.3:m===-1?3.1:2.2,d=u*u;for(let i=-3;i<=3;i++)for(let c=-3;c<=3;c++){let r=c*c+i*i;r>d||m===-2&&(r<2||n.next()<.55)||r>(u-1)*(u-1)&&n.next()<.2||this.put(e+c,s+m,t+i,ro,!1)}}}decorate(e,s){let t=this.blocks,n=this.hm,p=this.bm,m=this.X0,u=this.Z0,d=this.seed;for(let i=0;i<16;i++)for(let c=0;c<16;c++){let r=i<<4|c,l=(i+1)*N+c+1,a=n[l],f=p[l],g=m+c,y=u+i,b=t[a<<8|r];if(b===Q||b===xt)continue;let x=this.frozen[r],_=le(d^Eo,g,y),k=(_&65535)/65536,S=(_>>>16)/65536;if(a<62){if(x)continue;let E=62-a;if(f===q&&E<=2)k<.09&&t[16128|r]===Q&&(t[16128|r]=lo);else if(E>=2&&E<=14&&(b===F||b===$||b===ee||b===me)){let T=this.nGrass.noise2(g*.07142857142857142,y*.07142857142857142),B=f===se?.22:.12+.3*L(-.2,.6,T);k<B&&t[a+1<<8|r]===Ce&&(t[a+1<<8|r]=co)}continue}let v=a+1<<8|r;if(!(a>=255||t[v]!==Q)&&!x){if(a===62&&(b===W||b===F||b===ee||b===Ge||b===ke)&&this.waterBeside(l,c,i)&&k<.22&&this.nFlower.noise2(g*(1/20),y*(1/20))>-.3){let E=1+(_>>>20)%3;for(let T=1;T<=E&&t[a+T<<8|r]===Q;T++)t[a+T<<8|r]=io;continue}b===W?this.plant(f,g,y,a,r,k,S):b===Ge||b===bt?k<.1?t[v]=vt:k<.15?t[v]=We:k<.16&&(t[v]=_s):b===F&&f===Oe?k<.012&&(t[v]=fs):b===ke&&f===q&&k<.05&&(t[v]=We)}}this.cacti(e,s),this.pumpkins(e,s),this.snowCover()}waterBeside(e,s,t){let n=this.hm,p=(m,u,d)=>n[m]>=62?!1:u>=0&&u<16&&d>=0&&d<16?this.blocks[15872|d<<4|u]===Ce:this.tm[m]>=fe;return p(e+1,s+1,t)||p(e-1,s-1,t)||p(e+N,s,t+1)||p(e-N,s,t-1)}shaded(e,s){let t=this.blocks;for(let n=s+2;n<Math.min(256,s+18);n++)if(Be[t[n<<8|e]&1023])return!0;return!1}plant(e,s,t,n,p,m,u){var y;let d=this.blocks,i=n+1<<8|p,c=this.nGrass.noise2(s*(1/19),t*(1/19)),r=this.nFlower.noise2(s*(1/26),t*(1/26)),l=0,a=0,f=0,g=0;switch(e){case ne:l=.22+.22*c,f=r>.4?.12:.006;break;case be:l=.14+.1*c,a=.02,f=r>.5?.05:.005,g=.03;break;case ve:l=.16+.1*c,a=.015,f=r>.45?.06:.006,g=.015;break;case q:l=.16+.08*c,a=.03,f=.012,g=.02;break;case Ue:l=.28+.12*c,f=r>.2?.06:.01;break;case te:l=.2+.12*c,a=n<118?.05:.01,f=r>.3?.07:.004;break;case se:case Se:l=.1,f=.003;break;default:l=.15}if(m<f){let b=(y=re[e])!=null?y:re[ne],x=Math.floor((this.nFlowerType.noise2(s*(1/40),t*(1/40))*.5+.5)*b.length);u<.2&&(x=Math.floor(u*5*b.length)),d[i]=b[Math.max(0,Math.min(b.length-1,x))];return}if(g>0&&m<f+g&&this.shaded(p,n)){d[i]=u<.6?_s:po;return}if(m<f+g+a){d[i]=vt;return}m<f+g+a+l&&(d[i]=u<.08&&e!==ne?vt:We)}cacti(e,s){let t=this.blocks,n=this.hm,p=this.bm;for(let m=0;m<4;m++)for(let u=0;u<4;u++){let d=le(this.seed^Do,e*4+u,s*4+m);if((d&65535)/65536>.08)continue;let i=u*4+1+(d>>>16&1),c=m*4+1+(d>>>17&1),r=(c+1)*N+i+1,l=n[r];if(p[r]!==Oe||l<63||l>240)continue;let a=c<<4|i;if(t[l<<8|a]!==F||n[r+1]>l||n[r-1]>l||n[r+N]>l||n[r-N]>l)continue;let f=1+(d>>>18)%3;for(let g=1;g<=f;g++){let y=l+g<<8|a;if(t[y]!==Q&&t[y]!==fs)break;t[y]=bs}}}pumpkins(e,s){let t=le(this.seed^Co,e,s);if((t&65535)/65536>.035)return;let n=this.blocks,p=this.hm,m=this.bm,u=4+(t>>>16&7),d=4+(t>>>19&7),i=this.rng2.seed(t);for(let c=-3;c<=3;c++)for(let r=-3;r<=3;r++){let l=i.next()<.22,a=u+r,f=d+c;if(!l)continue;let g=(f+1)*N+a+1,y=m[g];if(y!==ne&&y!==be&&y!==ve&&y!==te)continue;let b=p[g],x=f<<4|a;if(n[b<<8|x]!==W)continue;let _=b+1<<8|x;(n[_]===Q||n[_]===We)&&(n[_]=uo)}}snowCover(){let e=this.blocks,s=this.hm;for(let t=0;t<256;t++){if(!this.frozen[t])continue;let n=t&15,p=t>>4,m=s[(p+1)*N+n+1],u=Math.min(254,m+40);for(;u>0&&e[u<<8|t]===Q;)u--;let d=e[u<<8|t];if(d===W&&(e[u<<8|t]=De),!(d===Ce||d===hs||d===He||d===xt||d===gt||d===yt||d===bs)&&!(u===m&&this.slopes[t]>=5&&d!==W)&&((Je[d&1023]||Be[d&1023])&&u<255&&e[u+1<<8|t]===Q&&(e[u+1<<8|t]=gt),u>m)){let i=m<<8|t;e[i]===W&&(e[i]=De)}}}tints(e){let s=this.tintGrid,t=this.tintBlur,n=this.X0-8,p=this.Z0-8;for(let m=0;m<K;m++)for(let u=0;u<K;u++){let d=n+u*4,i=p+m*4,c=this.sample(d,i),r=this.sB,l=this.sT,a=Bs[r],f=(m*K+u)*9;for(let b=0;b<9;b++)s[f+b]=a[b];if(r===we||r===ue||r===se||r===Se||r===Pe){let b=L(-.15,-.55,l),x=L(.35,.7,l);for(let _=0;_<3;_++)s[f+6+_]=s[f+6+_]+(xo[_]-s[f+6+_])*b,s[f+6+_]=s[f+6+_]+(ko[_]-s[f+6+_])*x*(r===ue?.6:1)}let g=Math.max(L(95,150,c),L(fe+.25,fe,l))*(r===q?0:1);if(g>0)for(let b=0;b<3;b++)s[f+b]+=(wo[b]-s[f+b])*g,s[f+3+b]+=(So[b]-s[f+3+b])*g;let y=this.sHum*6;s[f]-=y*.5,s[f+1]+=y*.3,s[f+3]-=y*.5,s[f+4]+=y*.3}for(let m=1;m<K-1;m++)for(let u=1;u<K-1;u++){let d=(m*K+u)*9;for(let i=0;i<9;i++){let c=0;for(let r=-1;r<=1;r++)for(let l=-1;l<=1;l++)c+=s[((m+r)*K+u+l)*9+i];t[d+i]=c/9}}for(let m=0;m<16;m++){let u=(m+8)/4,d=Math.floor(u),i=u-d;for(let c=0;c<16;c++){let r=(c+8)/4,l=Math.floor(r),a=r-l,f=(d*K+l)*9,g=f+9,y=f+K*9,b=y+9,x=(1-a)*(1-i),_=a*(1-i),k=(1-a)*i,S=a*i,v=(m<<4|c)*9;for(let E=0;E<9;E++){let T=t[f+E]*x+t[g+E]*_+t[y+E]*k+t[b+E]*S;e[v+E]=T<0?0:T>255?255:Math.round(T)}}}}findSpawn(){var u;if(this.spawn)return{x:this.spawn.x,z:this.spawn.z};let e=8,s=null,t=null,n=d=>d===ne||d===be,p=d=>d!==we&&d!==ue&&d!==se&&d!==q;for(let d=0;d<=400&&!t;d++){for(let i=0;i<Math.max(1,d*8)&&!t;i++){let c,r,l=d*2;d===0?(c=0,r=0):i<l?(c=-d+i,r=-d):i<l*2?(c=d,r=-d+(i-l)):i<l*3?(c=d-(i-l*2),r=d):(c=-d,r=d-(i-l*3));let a=c*e,f=r*e,g=this.sample(a,f),y=this.sB;if(!(g<63||g>140||!p(y)||this.isEntrance(a,f))&&!(this.slopeAt(a,f)>2)){if(n(y)){let b=this.verifySpawn(a,f);b&&(t=b)}else!s&&d>0&&(s=this.verifySpawn(a,f));if(!t&&s&&d>128)break}}if(!t&&s&&d>128)break}let m=(u=t!=null?t:s)!=null?u:{x:0,z:0};return this.spawn=m,{x:m.x,z:m.z}}verifySpawn(e,s){let t=Math.floor(e/16),n=Math.floor(s/16),m=this.generate(t,n).blocks,u=null,d=1e9;for(let i=0;i<16;i++)for(let c=0;c<16;c++){let r=t*16+c,l=n*16+i,a=this.sample(r,l);if(a<63||a>250||this.sB===se||this.sB===we||this.sB===ue)continue;let f=i<<4|c,g=m[a<<8|f]&1023;if(!Je[g]||Be[g])continue;let y=!0;for(let x=a+1;x<=a+3;x++){let _=m[x<<8|f]&1023;if(et[_]||pt[_]){y=!1;break}}if(!y)continue;let b=(r-e)*(r-e)+(l-s)*(l-s);b<d&&(d=b,u={x:r,z:l})}return u}};var Ot=self,je=null,Nt=[];function Ds(o){var e;try{let s=je.generate(o.cx,o.cz);Ot.postMessage({type:"chunk",id:o.id,cx:s.cx,cz:s.cz,blocks:s.blocks,biome:s.biome,tint:s.tint},[s.blocks.buffer,s.biome.buffer,s.tint.buffer])}catch(s){Ot.postMessage({type:"error",id:o.id,cx:o.cx,cz:o.cz,message:String((e=s==null?void 0:s.message)!=null?e:s)})}}Ot.onmessage=o=>{let e=o.data;if(e){if(e.type==="init"){(!je||je.seed!==(e.seed|0))&&(je=new rt(e.seed));let s=Nt;Nt=[];for(let t of s)Ds(t)}else if(e.type==="gen"){if(!je){Nt.push(e);return}Ds(e)}}};})();\n';var ky='"use strict";(()=>{var ae=["white","orange","magenta","light_blue","yellow","lime","pink","gray","light_gray","cyan","purple","blue","brown","green","red","black"],Uo=["oak","spruce","birch","jungle","acacia","dark_oak","mangrove","cherry"],ee=e=>e.split("_").map(t=>t[0].toUpperCase()+t.slice(1)).join(" "),ye=[],c=e=>(ye.push(e),e);c({name:"air",display:"Air",cat:"natural",tex:"missing",solid:!1,transparent:!0,opacity:0,replaceable:!0,item:!1,layer:"cutout",shape:"cross"});c({name:"grass_block",display:"Grass Block",cat:"natural",tex:{top:"grass_top",bottom:"dirt",side:"grass_side"},tint:"grass",tintMask:!0,sound:"grass"});c({name:"snowy_grass_block",display:"Snowy Grass Block",cat:"natural",tex:{top:"snow",bottom:"dirt",side:"grass_side_snowy"},sound:"snow"});c({name:"dirt",display:"Dirt",cat:"natural",tex:"dirt",sound:"gravel"});c({name:"coarse_dirt",display:"Coarse Dirt",cat:"natural",tex:"coarse_dirt",sound:"gravel"});c({name:"podzol",display:"Podzol",cat:"natural",tex:{top:"podzol_top",bottom:"dirt",side:"podzol_side"},sound:"gravel"});c({name:"rooted_dirt",display:"Rooted Dirt",cat:"natural",tex:"rooted_dirt",sound:"gravel"});c({name:"mycelium",display:"Mycelium",cat:"natural",tex:{top:"mycelium_top",bottom:"dirt",side:"mycelium_side"},sound:"grass"});c({name:"dirt_path",display:"Dirt Path",cat:"natural",tex:{top:"path_top",bottom:"dirt",side:"path_side"},sound:"grass"});c({name:"mud",display:"Mud",cat:"natural",tex:"mud",sound:"gravel"});c({name:"clay",display:"Clay",cat:"natural",tex:"clay",sound:"gravel"});c({name:"moss_block",display:"Moss Block",cat:"natural",tex:"moss",sound:"grass"});c({name:"sand",display:"Sand",cat:"natural",tex:"sand",sound:"sand"});c({name:"red_sand",display:"Red Sand",cat:"natural",tex:"red_sand",sound:"sand"});c({name:"gravel",display:"Gravel",cat:"natural",tex:"gravel",sound:"gravel"});c({name:"stone",display:"Stone",cat:"natural",tex:"stone"});c({name:"granite",display:"Granite",cat:"natural",tex:"granite"});c({name:"diorite",display:"Diorite",cat:"natural",tex:"diorite"});c({name:"andesite",display:"Andesite",cat:"natural",tex:"andesite"});c({name:"deepslate",display:"Deepslate",cat:"natural",tex:{top:"deepslate_top",bottom:"deepslate_top",side:"deepslate"},orient:"axis"});c({name:"tuff",display:"Tuff",cat:"natural",tex:"tuff"});c({name:"calcite",display:"Calcite",cat:"natural",tex:"calcite"});c({name:"dripstone_block",display:"Dripstone Block",cat:"natural",tex:"dripstone"});c({name:"bedrock",display:"Bedrock",cat:"natural",tex:"bedrock"});c({name:"snow_block",display:"Snow Block",cat:"natural",tex:"snow",sound:"snow"});c({name:"snow",display:"Snow",cat:"natural",tex:"snow",shape:"layer",sound:"snow",replaceable:!0,support:"solid"});c({name:"ice",display:"Ice",cat:"natural",tex:"ice",layer:"translucent",cullSelf:!0,opacity:1,sound:"glass"});c({name:"packed_ice",display:"Packed Ice",cat:"natural",tex:"packed_ice",sound:"glass"});c({name:"blue_ice",display:"Blue Ice",cat:"natural",tex:"blue_ice",sound:"glass"});c({name:"obsidian",display:"Obsidian",cat:"natural",tex:"obsidian"});c({name:"crying_obsidian",display:"Crying Obsidian",cat:"natural",tex:"crying_obsidian",light:10});c({name:"netherrack",display:"Netherrack",cat:"natural",tex:"netherrack"});c({name:"soul_sand",display:"Soul Sand",cat:"natural",tex:"soul_sand",sound:"sand"});c({name:"soul_soil",display:"Soul Soil",cat:"natural",tex:"soul_soil",sound:"sand"});c({name:"magma_block",display:"Magma Block",cat:"natural",tex:"magma",light:3});c({name:"basalt",display:"Basalt",cat:"natural",tex:{end:"basalt_top",side:"basalt_side"},orient:"axis"});c({name:"blackstone",display:"Blackstone",cat:"natural",tex:{top:"blackstone_top",bottom:"blackstone_top",side:"blackstone"}});c({name:"end_stone",display:"End Stone",cat:"natural",tex:"end_stone"});c({name:"amethyst_block",display:"Block of Amethyst",cat:"natural",tex:"amethyst",sound:"glass"});c({name:"bone_block",display:"Bone Block",cat:"natural",tex:{end:"bone_top",side:"bone_side"},orient:"axis"});var Yt=[["coal","Coal"],["iron","Iron"],["copper","Copper"],["gold","Gold"],["redstone","Redstone"],["lapis","Lapis Lazuli"],["diamond","Diamond"],["emerald","Emerald"]];for(let[e,t]of Yt)c({name:`${e}_ore`,display:`${t} Ore`,cat:"ores",tex:`ore_stone_${e}`,light:0});for(let[e,t]of Yt)c({name:`deepslate_${e}_ore`,display:`Deepslate ${t} Ore`,cat:"ores",tex:`ore_deepslate_${e}`});c({name:"nether_gold_ore",display:"Nether Gold Ore",cat:"ores",tex:"ore_nether_gold"});c({name:"nether_quartz_ore",display:"Nether Quartz Ore",cat:"ores",tex:"ore_nether_quartz"});var Lo=[["coal_block","Block of Coal"],["iron_block","Block of Iron"],["copper_block","Block of Copper"],["gold_block","Block of Gold"],["redstone_block","Block of Redstone"],["lapis_block","Block of Lapis Lazuli"],["diamond_block","Block of Diamond"],["emerald_block","Block of Emerald"],["netherite_block","Block of Netherite"],["raw_iron_block","Block of Raw Iron"],["raw_copper_block","Block of Raw Copper"],["raw_gold_block","Block of Raw Gold"],["exposed_copper","Exposed Copper"],["weathered_copper","Weathered Copper"],["oxidized_copper","Oxidized Copper"]];for(let[e,t]of Lo)c({name:e,display:t,cat:"ores",tex:e,sound:"metal"});for(let e of Uo){let t=ee(e),n=e;c({name:`${e}_log`,display:`${t} Log`,cat:"wood",tex:{end:`${n}_log_top`,side:`${n}_log`},orient:"axis",sound:"wood"}),c({name:`${e}_wood`,display:`${t} Wood`,cat:"wood",tex:`${n}_log`,orient:"axis",sound:"wood"}),c({name:`stripped_${e}_log`,display:`Stripped ${t} Log`,cat:"wood",tex:{end:`stripped_${e}_log_top`,side:`stripped_${e}_log`},orient:"axis",sound:"wood"}),c({name:`${e}_planks`,display:`${t} Planks`,cat:"wood",tex:`${e}_planks`,sound:"wood"});let o=e!=="spruce"&&e!=="birch"&&e!=="cherry";c({name:`${e}_leaves`,display:`${t} Leaves`,cat:"wood",tex:`${e}_leaves`,layer:"cutout",opacity:1,tint:o?"foliage":"none",sound:"grass",wave:"leaves"}),c({name:`${e}_slab`,display:`${t} Slab`,cat:"wood",tex:`${e}_planks`,shape:"slab",sound:"wood"}),c({name:`${e}_stairs`,display:`${t} Stairs`,cat:"wood",tex:`${e}_planks`,shape:"stairs",sound:"wood"}),c({name:`${e}_fence`,display:`${t} Fence`,cat:"wood",tex:`${e}_planks`,shape:"fence",family:"wood_fence",sound:"wood"}),c({name:`${e}_door`,display:`${t} Door`,cat:"wood",tex:{top:`${e}_door_top`,bottom:`${e}_door_bottom`,side:`${e}_door_bottom`},shape:"door",layer:"cutout",sound:"wood"}),c({name:`${e}_trapdoor`,display:`${t} Trapdoor`,cat:"wood",tex:`${e}_trapdoor`,shape:"trapdoor",layer:"cutout",sound:"wood"}),c({name:`${e}_sapling`,display:`${t} Sapling`,cat:"wood",tex:`${e}_sapling`,shape:"cross",layer:"cutout",solid:!1,support:"soil",sound:"grass",wave:"plant"})}var Oo=[["cobblestone","Cobblestone","cobblestone"],["mossy_cobblestone","Mossy Cobblestone","mossy_cobblestone"],["smooth_stone","Smooth Stone","smooth_stone"],["stone_bricks","Stone Bricks","stone_bricks"],["mossy_stone_bricks","Mossy Stone Bricks","mossy_stone_bricks"],["cracked_stone_bricks","Cracked Stone Bricks","cracked_stone_bricks"],["chiseled_stone_bricks","Chiseled Stone Bricks","chiseled_stone_bricks"],["bricks","Bricks","bricks"],["polished_granite","Polished Granite","polished_granite"],["polished_diorite","Polished Diorite","polished_diorite"],["polished_andesite","Polished Andesite","polished_andesite"],["cobbled_deepslate","Cobbled Deepslate","cobbled_deepslate"],["polished_deepslate","Polished Deepslate","polished_deepslate"],["deepslate_bricks","Deepslate Bricks","deepslate_bricks"],["deepslate_tiles","Deepslate Tiles","deepslate_tiles"],["polished_tuff","Polished Tuff","polished_tuff"],["mud_bricks","Mud Bricks","mud_bricks"],["packed_mud","Packed Mud","packed_mud"],["prismarine","Prismarine","prismarine"],["prismarine_bricks","Prismarine Bricks","prismarine_bricks"],["dark_prismarine","Dark Prismarine","dark_prismarine"],["nether_bricks","Nether Bricks","nether_bricks"],["red_nether_bricks","Red Nether Bricks","red_nether_bricks"],["cracked_nether_bricks","Cracked Nether Bricks","cracked_nether_bricks"],["chiseled_nether_bricks","Chiseled Nether Bricks","chiseled_nether_bricks"],["polished_blackstone","Polished Blackstone","polished_blackstone"],["polished_blackstone_bricks","Polished Blackstone Bricks","polished_blackstone_bricks"],["end_stone_bricks","End Stone Bricks","end_stone_bricks"],["purpur_block","Purpur Block","purpur"],["terracotta","Terracotta","terracotta"]];for(let[e,t,n]of Oo)c({name:e,display:t,cat:"building",tex:n});c({name:"sandstone",display:"Sandstone",cat:"building",tex:{top:"sandstone_top",bottom:"sandstone_bottom",side:"sandstone"}});c({name:"chiseled_sandstone",display:"Chiseled Sandstone",cat:"building",tex:{top:"sandstone_top",bottom:"sandstone_top",side:"chiseled_sandstone"}});c({name:"cut_sandstone",display:"Cut Sandstone",cat:"building",tex:{top:"sandstone_top",bottom:"sandstone_top",side:"cut_sandstone"}});c({name:"smooth_sandstone",display:"Smooth Sandstone",cat:"building",tex:"sandstone_top"});c({name:"red_sandstone",display:"Red Sandstone",cat:"building",tex:{top:"red_sandstone_top",bottom:"red_sandstone_bottom",side:"red_sandstone"}});c({name:"chiseled_red_sandstone",display:"Chiseled Red Sandstone",cat:"building",tex:{top:"red_sandstone_top",bottom:"red_sandstone_top",side:"chiseled_red_sandstone"}});c({name:"cut_red_sandstone",display:"Cut Red Sandstone",cat:"building",tex:{top:"red_sandstone_top",bottom:"red_sandstone_top",side:"cut_red_sandstone"}});c({name:"smooth_red_sandstone",display:"Smooth Red Sandstone",cat:"building",tex:"red_sandstone_top"});c({name:"quartz_block",display:"Block of Quartz",cat:"building",tex:{top:"quartz_top",bottom:"quartz_top",side:"quartz_side"}});c({name:"chiseled_quartz_block",display:"Chiseled Quartz Block",cat:"building",tex:{end:"chiseled_quartz_top",side:"chiseled_quartz"},orient:"axis"});c({name:"quartz_pillar",display:"Quartz Pillar",cat:"building",tex:{end:"quartz_pillar_top",side:"quartz_pillar"},orient:"axis"});c({name:"quartz_bricks",display:"Quartz Bricks",cat:"building",tex:"quartz_bricks"});c({name:"smooth_quartz",display:"Smooth Quartz Block",cat:"building",tex:"quartz_top"});c({name:"purpur_pillar",display:"Purpur Pillar",cat:"building",tex:{end:"purpur_pillar_top",side:"purpur_pillar"},orient:"axis"});c({name:"glass",display:"Glass",cat:"building",tex:"glass",layer:"cutout",cullSelf:!0,sound:"glass"});c({name:"tinted_glass",display:"Tinted Glass",cat:"building",tex:"tinted_glass",layer:"translucent",cullSelf:!0,opacity:15,sound:"glass"});c({name:"glass_pane",display:"Glass Pane",cat:"building",tex:"glass",shape:"pane",layer:"cutout",family:"pane",sound:"glass"});c({name:"iron_bars",display:"Iron Bars",cat:"building",tex:"iron_bars",shape:"pane",layer:"cutout",family:"pane",sound:"metal"});var Go=[["stone","Stone","stone",!1],["cobblestone","Cobblestone","cobblestone",!0],["mossy_cobblestone","Mossy Cobblestone","mossy_cobblestone",!0],["smooth_stone","Smooth Stone","smooth_stone_slab_side",!1],["stone_brick","Stone Brick","stone_bricks",!0],["brick","Brick","bricks",!0],["sandstone","Sandstone","sandstone_top",!0],["red_sandstone","Red Sandstone","red_sandstone_top",!0],["quartz","Quartz","quartz_top",!1],["granite","Granite","granite",!0],["diorite","Diorite","diorite",!0],["andesite","Andesite","andesite",!0],["polished_andesite","Polished Andesite","polished_andesite",!1],["cobbled_deepslate","Cobbled Deepslate","cobbled_deepslate",!0],["deepslate_brick","Deepslate Brick","deepslate_bricks",!0],["prismarine","Prismarine","prismarine",!0],["nether_brick","Nether Brick","nether_bricks",!0],["blackstone","Blackstone","blackstone",!0],["end_stone_brick","End Stone Brick","end_stone_bricks",!0],["purpur","Purpur","purpur",!1],["mud_brick","Mud Brick","mud_bricks",!0]];for(let[e,t,n,o]of Go){let r=e==="smooth_stone"?{top:"smooth_stone",bottom:"smooth_stone",side:n}:n;c({name:`${e}_slab`,display:`${t} Slab`,cat:"building",tex:r,shape:"slab"}),e!=="smooth_stone"&&c({name:`${e}_stairs`,display:`${t} Stairs`,cat:"building",tex:n,shape:"stairs"}),o&&c({name:`${e}_wall`,display:`${t} Wall`,cat:"building",tex:n,shape:"wall",family:"wall"})}for(let e of ae)c({name:`${e}_wool`,display:`${ee(e)} Wool`,cat:"colored",tex:`wool_${e}`,sound:"wool"});for(let e of ae)c({name:`${e}_carpet`,display:`${ee(e)} Carpet`,cat:"colored",tex:`wool_${e}`,shape:"carpet",sound:"wool",support:"solid"});for(let e of ae)c({name:`${e}_concrete`,display:`${ee(e)} Concrete`,cat:"colored",tex:`concrete_${e}`});for(let e of ae)c({name:`${e}_concrete_powder`,display:`${ee(e)} Concrete Powder`,cat:"colored",tex:`powder_${e}`,sound:"sand"});for(let e of ae)c({name:`${e}_terracotta`,display:`${ee(e)} Terracotta`,cat:"colored",tex:`terracotta_${e}`});for(let e of ae)c({name:`${e}_glazed_terracotta`,display:`${ee(e)} Glazed Terracotta`,cat:"colored",tex:`glazed_${e}`,orient:"horizontal"});for(let e of ae)c({name:`${e}_stained_glass`,display:`${ee(e)} Stained Glass`,cat:"colored",tex:`stained_glass_${e}`,layer:"translucent",cullSelf:!0,sound:"glass"});for(let e of ae)c({name:`${e}_stained_glass_pane`,display:`${ee(e)} Stained Glass Pane`,cat:"colored",tex:`stained_glass_${e}`,shape:"pane",layer:"translucent",family:"pane",sound:"glass"});c({name:"glowstone",display:"Glowstone",cat:"light",tex:"glowstone",light:15,sound:"glass"});c({name:"sea_lantern",display:"Sea Lantern",cat:"light",tex:"sea_lantern",light:15,sound:"glass"});c({name:"torch",display:"Torch",cat:"light",tex:"torch",shape:"torch",layer:"cutout",light:14,solid:!1,sound:"wood"});c({name:"soul_torch",display:"Soul Torch",cat:"light",tex:"soul_torch",shape:"torch",layer:"cutout",light:10,solid:!1,sound:"wood"});c({name:"lantern",display:"Lantern",cat:"light",tex:"lantern",shape:"lantern",layer:"cutout",light:15,sound:"metal"});c({name:"soul_lantern",display:"Soul Lantern",cat:"light",tex:"soul_lantern",shape:"lantern",layer:"cutout",light:10,sound:"metal"});c({name:"shroomlight",display:"Shroomlight",cat:"light",tex:"shroomlight",light:15,sound:"wool"});c({name:"jack_o_lantern",display:"Jack o\'Lantern",cat:"light",tex:{top:"pumpkin_top",bottom:"pumpkin_top",side:"pumpkin_side",front:"jack_o_lantern"},orient:"horizontal",light:15,sound:"wood"});c({name:"redstone_lamp",display:"Redstone Lamp",cat:"light",tex:"redstone_lamp_on",light:15,sound:"glass"});c({name:"ochre_froglight",display:"Ochre Froglight",cat:"light",tex:{end:"froglight_ochre_top",side:"froglight_ochre"},orient:"axis",light:15});c({name:"verdant_froglight",display:"Verdant Froglight",cat:"light",tex:{end:"froglight_verdant_top",side:"froglight_verdant"},orient:"axis",light:15});c({name:"pearlescent_froglight",display:"Pearlescent Froglight",cat:"light",tex:{end:"froglight_pearl_top",side:"froglight_pearl"},orient:"axis",light:15});c({name:"end_rod",display:"End Rod",cat:"light",tex:"end_rod",shape:"rod",layer:"cutout",light:14,sound:"glass"});c({name:"campfire_log_glow",display:"Glowing Embers",cat:"light",tex:"embers",light:12,sound:"wood"});c({name:"bookshelf",display:"Bookshelf",cat:"decor",tex:{top:"oak_planks",bottom:"oak_planks",side:"bookshelf"},sound:"wood"});c({name:"crafting_table",display:"Crafting Table",cat:"decor",tex:{top:"crafting_table_top",bottom:"oak_planks",side:"crafting_table_side",front:"crafting_table_front"},orient:"horizontal",sound:"wood"});c({name:"furnace",display:"Furnace",cat:"decor",tex:{top:"furnace_top",bottom:"furnace_top",side:"furnace_side",front:"furnace_front"},orient:"horizontal"});c({name:"blast_furnace",display:"Blast Furnace",cat:"decor",tex:{top:"blast_furnace_top",bottom:"blast_furnace_top",side:"blast_furnace_side",front:"blast_furnace_front"},orient:"horizontal"});c({name:"chest",display:"Chest",cat:"decor",tex:{top:"chest_top",bottom:"chest_top",side:"chest_side",front:"chest_front"},shape:"chest",orient:"horizontal",layer:"cutout",sound:"wood"});c({name:"barrel",display:"Barrel",cat:"decor",tex:{end:"barrel_top",side:"barrel_side"},orient:"axis",sound:"wood"});c({name:"note_block",display:"Note Block",cat:"decor",tex:"note_block",sound:"wood"});c({name:"jukebox",display:"Jukebox",cat:"decor",tex:{top:"jukebox_top",bottom:"jukebox_side",side:"jukebox_side"},sound:"wood"});c({name:"tnt",display:"TNT",cat:"decor",tex:{top:"tnt_top",bottom:"tnt_bottom",side:"tnt_side"},sound:"grass"});c({name:"target",display:"Target",cat:"decor",tex:{top:"target_top",bottom:"target_top",side:"target_side"},sound:"grass"});c({name:"pumpkin",display:"Pumpkin",cat:"decor",tex:{top:"pumpkin_top",bottom:"pumpkin_top",side:"pumpkin_side"},sound:"wood"});c({name:"carved_pumpkin",display:"Carved Pumpkin",cat:"decor",tex:{top:"pumpkin_top",bottom:"pumpkin_top",side:"pumpkin_side",front:"carved_pumpkin"},orient:"horizontal",sound:"wood"});c({name:"melon",display:"Melon",cat:"decor",tex:{top:"melon_top",bottom:"melon_top",side:"melon_side"},sound:"wood"});c({name:"hay_block",display:"Hay Bale",cat:"decor",tex:{end:"hay_top",side:"hay_side"},orient:"axis",sound:"grass"});c({name:"sponge",display:"Sponge",cat:"decor",tex:"sponge",sound:"grass"});c({name:"wet_sponge",display:"Wet Sponge",cat:"decor",tex:"wet_sponge",sound:"grass"});c({name:"slime_block",display:"Slime Block",cat:"decor",tex:"slime",layer:"translucent",cullSelf:!0,sound:"slime"});c({name:"honey_block",display:"Honey Block",cat:"decor",tex:"honey",layer:"translucent",cullSelf:!0,sound:"slime"});c({name:"honeycomb_block",display:"Honeycomb Block",cat:"decor",tex:"honeycomb",sound:"wool"});c({name:"dried_kelp_block",display:"Dried Kelp Block",cat:"decor",tex:{top:"kelp_top",bottom:"kelp_top",side:"kelp_side"},sound:"grass"});c({name:"brown_mushroom_block",display:"Brown Mushroom Block",cat:"decor",tex:"mushroom_brown",sound:"wood"});c({name:"red_mushroom_block",display:"Red Mushroom Block",cat:"decor",tex:"mushroom_red",sound:"wood"});c({name:"mushroom_stem",display:"Mushroom Stem",cat:"decor",tex:"mushroom_stem",sound:"wood"});c({name:"cobweb",display:"Cobweb",cat:"decor",tex:"cobweb",shape:"cross",layer:"cutout",solid:!1,sound:"wool"});c({name:"cactus",display:"Cactus",cat:"decor",tex:{top:"cactus_top",bottom:"cactus_bottom",side:"cactus_side"},shape:"cactus",layer:"cutout",support:"cactus",sound:"wool"});c({name:"sugar_cane",display:"Sugar Cane",cat:"decor",tex:"sugar_cane",shape:"cross",layer:"cutout",solid:!1,support:"cane",sound:"grass"});c({name:"short_grass",display:"Short Grass",cat:"decor",tex:"tall_grass",shape:"cross",layer:"cutout",solid:!1,tint:"grass",replaceable:!0,support:"soil",sound:"grass",wave:"plant"});c({name:"fern",display:"Fern",cat:"decor",tex:"fern",shape:"cross",layer:"cutout",solid:!1,tint:"grass",replaceable:!0,support:"soil",sound:"grass",wave:"plant"});c({name:"dead_bush",display:"Dead Bush",cat:"decor",tex:"dead_bush",shape:"cross",layer:"cutout",solid:!1,replaceable:!0,support:"sand",sound:"grass",wave:"plant"});var Io=[["dandelion","Dandelion"],["poppy","Poppy"],["blue_orchid","Blue Orchid"],["allium","Allium"],["azure_bluet","Azure Bluet"],["red_tulip","Red Tulip"],["orange_tulip","Orange Tulip"],["white_tulip","White Tulip"],["pink_tulip","Pink Tulip"],["oxeye_daisy","Oxeye Daisy"],["cornflower","Cornflower"],["lily_of_the_valley","Lily of the Valley"]];for(let[e,t]of Io)c({name:e,display:t,cat:"decor",tex:`flower_${e}`,shape:"cross",layer:"cutout",solid:!1,support:"soil",sound:"grass",wave:"plant"});c({name:"brown_mushroom",display:"Brown Mushroom",cat:"decor",tex:"brown_mushroom",shape:"cross",layer:"cutout",solid:!1,support:"solid",sound:"grass"});c({name:"red_mushroom",display:"Red Mushroom",cat:"decor",tex:"red_mushroom",shape:"cross",layer:"cutout",solid:!1,support:"solid",sound:"grass"});c({name:"lily_pad",display:"Lily Pad",cat:"decor",tex:"lily_pad",shape:"lily",layer:"cutout",solid:!0,tint:"foliage",support:"water",sound:"grass"});c({name:"seagrass",display:"Seagrass",cat:"decor",tex:"seagrass",shape:"cross",layer:"cutout",solid:!1,item:!1,sound:"grass",wave:"plant"});c({name:"water",display:"Water",cat:"fluids",tex:"water",shape:"fluid",layer:"water",fluid:!0,solid:!1,opacity:1,replaceable:!0,cullSelf:!0,tint:"water",sound:"liquid"});c({name:"lava",display:"Lava",cat:"fluids",tex:"lava",shape:"fluid",layer:"lava",fluid:!0,solid:!1,light:15,opacity:0,replaceable:!0,cullSelf:!0,sound:"liquid"});var st=ye,S=ye.length,F={};ye.forEach((e,t)=>{F[e.name]=t});var Po=["cube","slab","stairs","fence","wall","cross","torch","door","trapdoor","pane","fluid","layer","carpet","cactus","lantern","chest","rod","lily"],g=Object.fromEntries(Po.map((e,t)=>[e,t])),zo=["opaque","cutout","translucent","water","lava"],Re=Object.fromEntries(zo.map((e,t)=>[e,t])),$=new Uint8Array(S),Q=new Uint8Array(S),Do=new Uint8Array(S),jt=new Uint8Array(S),rt=new Uint8Array(S),xe=new Uint8Array(S),De=new Uint8Array(S),Ne=new Uint8Array(S),No=new Uint8Array(S),Me=new Uint8Array(S),at=new Uint8Array(S),ct=new Uint8Array(S),lt=new Uint8Array(S),Be=new Uint8Array(S),pe=new Uint8Array(S),$o=new Uint8Array(S),nt=[""],Fo=["none","grass","foliage","water"],Et,Ct,Ut,Lt,Ot,Gt;for(let e=0;e<S;e++){let t=ye[e],n=(Et=t.shape)!=null?Et:"cube",o=(Ct=t.layer)!=null?Ct:"opaque";$[e]=g[n],Q[e]=Re[o],Do[e]=(Ut=t.light)!=null?Ut:0;let r=n==="cube"&&o==="opaque";if(rt[e]=r&&t.transparent!==!0?1:0,jt[e]=(Lt=t.opacity)!=null?Lt:r?15:0,xe[e]=(Ot=t.solid)==null||Ot?1:0,De[e]=t.fluid?1:0,Ne[e]=t.cullSelf?1:0,No[e]=t.replaceable?1:0,Me[e]=Fo.indexOf((Gt=t.tint)!=null?Gt:"none"),at[e]=t.tintMask?1:0,ct[e]=t.orient==="axis"?1:t.orient==="horizontal"?2:0,lt[e]=t.wave==="plant"?1:t.wave==="leaves"?2:0,Be[e]=t.name.endsWith("_leaves")?1:0,t.family){let s=nt.indexOf(t.family);s<0&&(s=nt.length,nt.push(t.family)),pe[e]=s}$o[e]=e!==0&&!t.fluid?1:0}xe[0]=0;jt[0]=0;var At=[],vt=new Map;function ze(e){let t=vt.get(e);return t===void 0&&(t=At.length,At.push(e),vt.set(e,t)),t}ze("missing");var R=new Uint16Array(S*6),It,Pt,zt,Dt,Nt,$t,Ft,qt,Ht,Vt,Wt,Xt;for(let e=0;e<S;e++){let t=ye[e].tex,n;if(typeof t=="string")n=[t,t,t,t,t,t];else{let o=(zt=(Pt=(It=t.side)!=null?It:t.all)!=null?Pt:t.end)!=null?zt:"missing",r=(Nt=(Dt=t.top)!=null?Dt:t.end)!=null?Nt:o,s=(Ft=($t=t.bottom)!=null?$t:t.end)!=null?Ft:r;n=[(qt=t.east)!=null?qt:o,(Ht=t.west)!=null?Ht:o,r,s,(Vt=t.south)!=null?Vt:o,(Xt=(Wt=t.north)!=null?Wt:t.front)!=null?Xt:o]}for(let o=0;o<6;o++)R[e*6+o]=ze(n[o])}var An={water_still:ze("water"),lava_still:ze("lava")},Tt=new Uint8Array(1024);for(let e=0;e<S;e++){let t=Q[e]===Re.cutout?1:Q[e]===Re.translucent?2:0;for(let n=0;n<6;n++){let o=R[e*6+n];t>Tt[o]&&(Tt[o]=t)}}var qo=10,Kt=(e,t=0)=>e|t<<qo;if(S>1024)throw new Error("Too many blocks for 10-bit ids");var u=e=>{let t=parseInt(e.replace("#",""),16);return[t>>16&255,t>>8&255,t&255]};var Ae=e=>[e,e,e];var Tn={stone:u("#7d7d7d"),dirt:u("#86603e"),sand:u("#dccf9e"),redSand:u("#bf6a26"),deepslate:u("#4d4d52"),netherrack:u("#6e2d2b"),endStone:u("#dcdf9e"),granite:u("#9a6b57"),diorite:u("#c9c9c6"),andesite:u("#868787"),tuff:u("#6c6d65"),calcite:u("#dfe0dc"),clay:u("#a0a6b4"),mud:u("#3c3a3c"),snow:u("#f4fbfb"),blackstone:u("#2e2a30"),basalt:u("#4b4a4f"),obsidian:u("#140f1f")};var En={oak:{planks:u("#b38d58"),bark:u("#6b5232"),stripped:u("#b18e57"),leaves:Ae(150),tinted:!0},spruce:{planks:u("#735632"),bark:u("#3c2a15"),stripped:u("#76593a"),leaves:u("#4b6f48"),tinted:!1},birch:{planks:u("#c8b67a"),bark:u("#d8d6cf"),stripped:u("#c4ad73"),leaves:u("#7ca052"),tinted:!1},jungle:{planks:u("#a07350"),bark:u("#584519"),stripped:u("#ab8455"),leaves:Ae(158),tinted:!0},acacia:{planks:u("#a85a32"),bark:u("#686056"),stripped:u("#ae5d3b"),leaves:Ae(146),tinted:!0},dark_oak:{planks:u("#432b14"),bark:u("#3c2e1a"),stripped:u("#60492f"),leaves:Ae(130),tinted:!0},mangrove:{planks:u("#763630"),bark:u("#5a3d2c"),stripped:u("#7a382f"),leaves:Ae(140),tinted:!0},cherry:{planks:u("#e3b2ac"),bark:u("#38212c"),stripped:u("#d8939a"),leaves:u("#eab0c8"),tinted:!1}};var Cn={coal:[u("#2a2a2a"),u("#1a1a1a"),u("#4a4a4a")],iron:[u("#d8af93"),u("#b88a6c"),u("#f0d8c4")],copper:[u("#e07a4a"),u("#4a9a7a"),u("#ffb088")],gold:[u("#fcd84a"),u("#d8a020"),u("#fff6b0")],redstone:[u("#e01a10"),u("#a00a08"),u("#ff6a50")],lapis:[u("#2450c0"),u("#1a3490"),u("#6a90f0")],diamond:[u("#5ae8e0"),u("#2ab8b0"),u("#c8fff8")],emerald:[u("#28d860"),u("#10a040"),u("#a0ffc0")],nether_gold:[u("#fcd84a"),u("#d8a020"),u("#fff6b0")],nether_quartz:[u("#ece6dc"),u("#c8c0b4"),u("#ffffff")]};var $e={grass:u("#7bbd56"),foliage:u("#5fab36"),water:u("#3f76e4")};var te=[0,1,0,-1],oe=[-1,0,1,0];var Zt=[5,0,4,1],Qt=[1,3,-1,-1,2,0],V=18,it=V*V*V,Jt=(e,t,n)=>((t+1)*V+(n+1))*V+(e+1),Fe=(e,t)=>(t+1)*V+(e+1);var le=new Uint8Array(65536),q=new Uint8Array(65536),ce=new Uint8Array(65536),pt=[[1,0],[0,.5],[.5,1],[0,2/16],[0,1/16]];for(let e=0;e<65536;e++){let t=e&1023;if(t>=S||t===0)continue;let n=e>>10,o=$[t],r=Q[t]===Re.opaque;if(rt[t]||o===g.slab&&(n&3)===2){le[e]=1,q[e]=63;continue}r&&(o===g.slab?n&3?(q[e]=4,ce[e]=2):(q[e]=8,ce[e]=1):o===g.stairs?n&4?(q[e]=4,ce[e]=2):(q[e]=8,ce[e]=1):o===g.layer?(q[e]=8,ce[e]=3):o===g.carpet&&(q[e]=8,ce[e]=4))}var ut=new Uint8Array(S),so=new Uint8Array(S);for(let e=0;e<S;e++){let t=st[e].name;t.endsWith("_glazed_terracotta")&&(ut[e]=1),$[e]===g.cube&&(t==="glass"||t==="tinted_glass"||t.endsWith("_stained_glass"))&&(so[e]=1)}var no,Ho=(no=F.iron_bars)!=null?no:-1;function ke(e,t){let n=e&1023,o=ct[n],r=n*6;if(o===0)return R[r+t];let s=e>>10;if(o===1){let f=s&3;return f===1?t===0?R[r+2]:t===1?R[r+3]:R[r+4]|65536:f===2?t===4?R[r+2]:t===5?R[r+3]:t===0||t===1?R[r+4]|65536:R[r+4]:R[r+t]}let l=s&3;if(t===2)return R[r+2]|(ut[n]?l+1&3:l)<<16;if(t===3)return R[r+3]|(4-l&3)<<16;let a=Qt[t]-l+4&3,i=R[r+Zt[a]];return ut[n]?i|a<<16:i}var dt=e=>$[e&1023]===g.stairs;function ft(e,t,n){let o=t&1023;if(o===0)return!1;let r=e&1023,s=$[r],l=$[o];if(le[t&65535])return!0;switch(s){case g.fence:if(l===g.fence&&pe[o]===pe[r])return!0;break;case g.pane:if(l===g.pane||so[o])return!0;break;case g.wall:if(l===g.wall)return!0;break;default:return!1}return s!==g.pane&&l===g.stairs&&(t>>10&3)===(n+2&3)}function ro(e,t){let n=0;for(let o=0;o<4;o++)ft(e,t(te[o],0,oe[o]),o)&&(n|=1<<o);return n}var Vo=0,ao=1,co=2,lo=3,io=4;function eo(e,t,n){let o=t(te[n],0,oe[n]);return!dt(o)||(o>>10&3)!==(e>>10&3)||(o>>12&1)!==(e>>12&1)}function Wo(e,t){let n=e>>10,o=n&3,r=n>>2&1,s=t(te[o],0,oe[o]);if(dt(s)&&(s>>12&1)===r){let a=s>>10&3;if((a&1)!==(o&1)&&eo(e,t,a+2&3))return a===(o+3&3)?lo:io}let l=t(-te[o],0,-oe[o]);if(dt(l)&&(l>>12&1)===r){let a=l>>10&3;if((a&1)!==(o&1)&&eo(e,t,a))return a===(o+3&3)?ao:co}return Vo}function Xo(e,t){let n=ro(e,t),o=t(0,1,0),r=o&1023,s=$[r],l=n===5||n===10,a=le[o&65535]===1,i=0;for(let d=0;d<4;d++)n&1<<d&&(a||s===g.wall&&ft(o,t(te[d],1,oe[d]),d))&&(i|=1<<d);let f=!l;if(!f&&r!==0)if(s===g.wall){let d=0;for(let p=0;p<4;p++)ft(o,t(te[p],1,oe[p]),p)&&(d|=1<<p);d!==5&&d!==10&&(f=!0)}else(s===g.torch||s===g.lantern||s===g.rod||!a&&xe[r]&&i===0)&&(f=!0);return n|(f?16:0)|i<<5}function uo(e,t){switch($[e&1023]){case g.stairs:return Wo(e,t);case g.fence:case g.pane:return ro(e,t);case g.wall:return Xo(e,t);default:return 0}}var T=(e,t,n,o,r,s)=>[e/16,t/16,n/16,o/16,r/16,s/16];function qe(e,t){let[n,o,r,s,l,a]=e;for(let i=0;i<(t&3);i++){let f=1-a,d=1-r,p=n,_=s;n=f,s=d,r=p,a=_}return[n,o,r,s,l,a]}var I=e=>[e,e,e,e,e,e];function ve(e){switch(e&3){case 0:return[0,0,1,.5];case 1:return[.5,0,1,1];case 2:return[0,.5,1,1];default:return[0,0,.5,1]}}function He(e,t){let n=ve(e),o=ve(t);return[Math.max(n[0],o[0]),Math.max(n[1],o[1]),Math.min(n[2],o[2]),Math.min(n[3],o[3])]}function Yo(e,t){let n=e>>10,o=n&3,r=n>>2&1,s=[r?[0,.5,0,1,1,1]:[0,0,0,1,.5,1]],l=r?0:.5,a=r?.5:1,i=o+3&3,f=o+1&3,d=o+2&3,p=[];switch(t){case ao:p.push(ve(o),He(d,i));break;case co:p.push(ve(o),He(d,f));break;case lo:p.push(He(o,i));break;case io:p.push(He(o,f));break;default:p.push(ve(o))}for(let _ of p)s.push([_[0],l,_[1],_[2],a,_[3]]);return s}function jo(e){let t=e>>10&3;return t===2?[0,0,0,1,1,1]:t===1?[0,.5,0,1,1,1]:[0,0,0,1,.5,1]}function Ko(e){let t=e>>10,n=t&3,o=t>>2&1,s=t>>4&1?n+1&3:n+3&3,l=n+2&3,a=o?s:l,i=3/16,f;switch(a){case 0:f=[0,0,0,1,1,i];break;case 1:f=[1-i,0,0,1,1,1];break;case 2:f=[0,0,1-i,1,1,1];break;default:f=[0,0,0,i,1,1]}let d=te[l]+te[s],p=oe[l]+oe[s];return{box:f,hingeX:d>0?1:0,hingeZ:p>0?1:0}}function Zo(e){let t=e>>10,n=t&3,o=t>>2&1,r=t>>3&1,s=3/16;if(!o)return r?[0,1-s,0,1,1,1]:[0,0,0,1,s,1];switch(n){case 0:return[0,0,0,1,1,s];case 1:return[1-s,0,0,1,1,1];case 2:return[0,0,1-s,1,1,1];default:return[0,0,0,s,1,1]}}var Ve=22.5*Math.PI/180;function Qo(e){switch(e&3){case 1:return{box:[0,.21875,7/16,2/16,.84375,9/16],rotate:{axis:"z",angle:-Ve,origin:[1/16,.21875,.5]}};case 3:return{box:[14/16,.21875,7/16,1,.84375,9/16],rotate:{axis:"z",angle:Ve,origin:[15/16,.21875,.5]}};case 2:return{box:[7/16,.21875,0,9/16,.84375,2/16],rotate:{axis:"x",angle:Ve,origin:[.5,.21875,1/16]}};default:return{box:[7/16,.21875,14/16,9/16,.84375,1],rotate:{axis:"x",angle:-Ve,origin:[.5,.21875,15/16]}}}}var to=[[7,6,9,16],[7,6,9,16],[7,6,9,8],[7,14,9,16],[7,6,9,16],[7,6,9,16]];function fo(e,t,n=0){let o=e&1023,r=e>>10,s=o*6,l=R[s];switch($[o]){case g.cube:{let a=[];for(let i=0;i<6;i++)a.push(ke(e,i)&65535);return[{box:[0,0,0,1,1,1],tex:a}]}case g.slab:{let a=[R[s],R[s+1],R[s+2],R[s+3],R[s+4],R[s+5]];return[{box:jo(e),tex:a}]}case g.stairs:{let a=[R[s],R[s+1],R[s+2],R[s+3],R[s+4],R[s+5]];return Yo(e,t).map(i=>({box:i,tex:a.slice()}))}case g.fence:{let a=[{box:T(6,0,6,10,16,10),tex:I(l)}];for(let i=0;i<4;i++)t&1<<i&&(a.push({box:qe(T(7,12,0,9,15,6),i),tex:I(l)}),a.push({box:qe(T(7,6,0,9,9,6),i),tex:I(l)}));return a}case g.wall:{let a=[];t&16&&a.push({box:T(4,0,4,12,16,12),tex:I(l)});for(let i=0;i<4;i++){if(!(t&1<<i))continue;let f=t&1<<5+i?16:14;a.push({box:qe(T(5,0,0,11,f,8),i),tex:I(l)})}return a.length||a.push({box:T(4,0,4,12,16,12),tex:I(l)}),a}case g.pane:{let a=t&15?t&15:15,i=o===Ho?1:0,f=[T(7,0,7,9,16,9)];for(let d=0;d<4;d++)a&1<<d&&f.push(qe(T(7,0,0,9,16,7),d));return f.map(d=>{let p=Math.round(d[0]*16),_=Math.round(d[3]*16),b=Math.round(d[2]*16),h=Math.round(d[5]*16),B=_-p<=2,v=h-b<=2,y=_-p>=h-b?[p,0,_,1]:[i,b,i+1,h],m=[i,0,i+1,16],M=[v?m:null,v?m:null,y,y,B?m:null,B?m:null];return{box:d,tex:I(l),uv:M}})}case g.torch:{if(r===0)return[{box:T(7,0,7,9,10,9),tex:I(l),uv:to,shade:!1,ao:!1}];let a=Qo(r-1);return[{box:a.box,tex:I(l),uv:to,rotate:a.rotate,shade:!1,ao:!1}]}case g.door:{let a=r>>3&1?R[s+2]:R[s+3],i=Ko(e),[f,,d,p,,_]=i.box,b=[null,null,null,null,null,null],h=p-f<.5,B=h?[0,1]:[4,5];for(let v of B){let y=v===1||v===4,m=h?i.hingeZ===0:i.hingeX===0;b[v]=y===m?[0,0,16,16]:[16,0,0,16]}return[{box:i.box,tex:I(a),uv:b}]}case g.trapdoor:return[{box:Zo(e),tex:I(l)}];case g.layer:return[{box:T(0,0,0,16,2,16),tex:I(l)}];case g.carpet:return[{box:T(0,0,0,16,1,16),tex:I(l)}];case g.cactus:{let a=R[s+4],i=R[s+2],f=R[s+3];return[{box:[0,0,0,1,1,1],tex:[-1,-1,i,f,-1,-1]},{box:T(0,0,1,16,16,15),tex:[-1,-1,-1,-1,a,a]},{box:T(1,0,0,15,16,16),tex:[a,a,-1,-1,-1,-1]}]}case g.lantern:{let a=r&1?1:0,i=[[5,9,11,16],[5,9,11,16],[0,0,6,6],[0,0,6,6],[5,9,11,16],[5,9,11,16]],f=[[6,7,10,9],[6,7,10,9],[1,1,5,5],[1,1,5,5],[6,7,10,9],[6,7,10,9]],d=[[7,6,9,7],[7,6,9,7],[7,6,9,7],[7,6,9,7],[7,6,9,7],[7,6,9,7]],p=[{box:T(5,a,5,11,7+a,11),tex:I(l),uv:i},{box:T(6,7+a,6,10,9+a,10),tex:I(l),uv:f}];return a?p.push({box:T(7.5,10,7.5,8.5,16,8.5),tex:[l,l,-1,-1,l,l],uv:d}):p.push({box:T(7,9,7,9,10,9),tex:I(l),uv:d}),p}case g.chest:{let a=[];for(let i=0;i<6;i++)a.push(ke(e,i)&65535);return[{box:T(1,0,1,15,14,15),tex:a}]}case g.rod:{let a=r&3,i=a===1?{axis:"z",angle:-Math.PI/2,origin:[.5,.5,.5]}:a===2?{axis:"x",angle:Math.PI/2,origin:[.5,.5,.5]}:void 0,f=[[0,0,4,1],[0,0,4,1],[0,0,4,4],[0,0,4,4],[0,0,4,1],[0,0,4,1]],d=[[7,0,9,15],[7,0,9,15],[7,0,9,2],[7,0,9,2],[7,0,9,15],[7,0,9,15]];return[{box:T(6,0,6,10,1,10),tex:I(l),uv:f,rotate:i,ao:!1,shade:!1},{box:T(7,1,7,9,16,9),tex:I(l),uv:d,rotate:i,ao:!1,shade:!1}]}case g.lily:{let i=n&3;return[{box:[0,.00625,0,1,.00625,1],tex:[-1,-1,l,l,-1,-1],uv:[null,null,[0,0,16,16],[0,16,16,0],null,null],rotate:i?{axis:"y",angle:-i*Math.PI/2,origin:[.5,.5,.5]}:void 0}]}default:return[]}}var Jo=[0,0,0,1,1,1],oo=new Map;{let e=(t,n)=>{for(let o of t)F[o]!==void 0&&oo.set(F[o],n)};e(["short_grass","fern","dead_bush"],T(2,0,2,14,13,14)),e(["dandelion","poppy","blue_orchid","allium","azure_bluet","red_tulip","orange_tulip","white_tulip","pink_tulip","oxeye_daisy","cornflower","lily_of_the_valley"],T(5,0,5,11,10,11)),e(["brown_mushroom","red_mushroom"],T(5,0,5,11,6,11)),e(["sugar_cane"],T(2,0,2,14,16,14)),e(["cobweb"],Jo),e(["seagrass"],T(2,0,2,14,12,14));for(let t=0;t<S;t++)st[t].name.endsWith("_sapling")&&oo.set(t,T(2,0,2,14,12,14))}var bt=new Uint8Array(S);for(let e of["short_grass","fern","dandelion","poppy","blue_orchid","allium","azure_bluet","red_tulip","orange_tulip","white_tulip","pink_tulip","oxeye_daisy","cornflower","lily_of_the_valley"])F[e]!==void 0&&(bt[F[e]]=1);function We(e,t,n,o=0){let r=Math.imul(e|0,668265261)^Math.imul(n|0,374761393)^Math.imul(t|0,2654435761)^o;return r=Math.imul(r^r>>>15,2246822507),r=Math.imul(r^r>>>13,3266489909),(r^r>>>16)>>>0}var ne=1,J=V,ie=V*V,po=[ne,ie,J],xt=[ne,-ne,ie,-ie,J,-J],kt=[2,1,8,4,32,16],Ke=[0,0,1,1,2,2],Ze=[.6,.6,1,.5,.8,.8],yo=[.45,.65,.82,1],bo=[0,17,17/2,17/3,17/4],me=[[[1,0,1],[1,0,0],[1,1,0],[1,1,1]],[[0,0,0],[0,0,1],[0,1,1],[0,1,0]],[[0,1,1],[1,1,1],[1,1,0],[0,1,0]],[[0,0,0],[1,0,0],[1,0,1],[0,0,1]],[[0,0,1],[1,0,1],[1,1,1],[0,1,1]],[[1,0,0],[0,0,0],[0,1,0],[1,1,0]]],se=new Uint8Array(72),xo=new Int32Array(24),ko=new Int32Array(24),wo=new Uint8Array(6),So=new Uint8Array(6);for(let e=0;e<6;e++){let t=Ke[e],n=t===0?1:0,o=t===2?1:2;for(let a=0;a<4;a++){let i=me[e][a];for(let f=0;f<3;f++)se[(e*4+a)*3+f]=i[f];xo[e*4+a]=(i[n]?1:-1)*po[n],ko[e*4+a]=(i[o]?1:-1)*po[o]}let r=me[e][0],s=me[e][1],l=me[e][3];for(let a=0;a<3;a++)s[a]!==r[a]&&(wo[e]=a),l[a]!==r[a]&&(So[e]=a)}var Ye=[0,16,16,0],gt=[16,16,0,0],je=new Uint8Array(65536);for(let e=0;e<65536;e++){let t=e&1023;t<S&&(le[e]||Be[t])&&(je[e]=1)}var en=new Float32Array(pt.map(e=>e[0])),tn=new Float32Array(pt.map(e=>e[1])),on=g.cube,nn=g.slab,sn=g.cross,rn=g.fluid,an=g.lily,cn=g.pane,ln=g.fence,un=g.door,dn=g.cactus,wt=F.water,go,yt=(go=F.seagrass)!=null?go:-1,Fn=Kt(F.bedrock),he=new Uint16Array(1024);for(let e=0;e<S;e++)De[e]&&(he[e]=e);yt>=0&&(he[yt]=wt);var Ro=new Uint8Array(S);for(let e of["grass_block","snowy_grass_block","dirt","sand","red_sand","mycelium","podzol"])F[e]!==void 0&&(Ro[F[e]]=1);var be=class{constructor(){this.pos=new Int16Array(3*8192);this.uv=new Uint16Array(2*8192);this.tint=new Uint8Array(4*8192);this.light=new Uint8Array(4*8192);this.idx=new Uint32Array(12288);this.vc=0;this.ic=0}reserve(t,n){if((this.vc+t)*3>this.pos.length){let o=Math.max(this.pos.length/3*2,this.vc+t),r=new Int16Array(o*3);r.set(this.pos),this.pos=r;let s=new Uint16Array(o*2);s.set(this.uv),this.uv=s;let l=new Uint8Array(o*4);l.set(this.tint),this.tint=l;let a=new Uint8Array(o*4);a.set(this.light),this.light=a}if(this.ic+n>this.idx.length){let o=new Uint32Array(Math.max(this.idx.length*2,this.ic+n));o.set(this.idx),this.idx=o}}finish(){let t=this.vc,n=this.ic;if(t===0||n===0)return null;let o;return t<=65535?(o=new Uint16Array(n),o.set(this.idx.subarray(0,n))):o=this.idx.slice(0,n),{positions:this.pos.slice(0,t*3),uvs:this.uv.slice(0,t*2),tints:this.tint.slice(0,t*4),lights:this.light.slice(0,t*4),indices:o,vertexCount:t,indexCount:n}}},Se=[new be,new be,new be,new be,new be],K=new Uint16Array(it),j=new Uint8Array(it),D=new Uint8Array(V*V*9),Mo=!1,St=!0,_e=!1,Bo=0,Oe=255,Ge=255,Ie=255,Rt=0,fn=(e,t,n)=>K[Bo+e+n*J+t*ie];function re(e,t,n,o,r,s,l,a,i,f){let d=e.vc++,p=d*3,_=d*2,b=d*4;e.pos[p]=t,e.pos[p+1]=n,e.pos[p+2]=o,e.uv[_]=r,e.uv[_+1]=s;let h=e.tint;h[b]=Oe,h[b+1]=Ge,h[b+2]=Ie,h[b+3]=Rt;let B=e.light;B[b]=l,B[b+1]=a,B[b+2]=i,B[b+3]=f}function we(e,t,n,o){let r=e.idx,s=e.ic;n?(r[s++]=t+1,r[s++]=t+2,r[s++]=t+3,r[s++]=t+1,r[s++]=t+3,r[s++]=t):(r[s++]=t,r[s++]=t+1,r[s++]=t+2,r[s++]=t,r[s++]=t+2,r[s++]=t+3),o&&(n?(r[s++]=t+1,r[s++]=t+3,r[s++]=t+2,r[s++]=t+1,r[s++]=t,r[s++]=t+3):(r[s++]=t,r[s++]=t+2,r[s++]=t+1,r[s++]=t,r[s++]=t+3,r[s++]=t+2)),e.ic=s}function Mt(e,t,n){let o=Me[e];if(o){let r=Fe(t,n)*9+(o-1)*3;Oe=D[r],Ge=D[r+1],Ie=D[r+2]}else Oe=255,Ge=255,Ie=255;Rt=at[e]?255:0}function Bt(e,t){let n=Fe(e,t)*9;return(D[n]|D[n+1]<<8|D[n+2]<<16)^Math.imul(D[n+3]|D[n+4]<<8|D[n+5]<<16,2654435761)^Math.imul(D[n+6]|D[n+7]<<8|D[n+8]<<16,2246822507)}var W=new Float32Array(4),X=new Float32Array(4),Y=new Uint8Array(4);function Ao(e,t){let n=j[e],o=n>>4,r=n&15,s=t*4;for(let l=0;l<4;l++){let a=xo[s+l],i=ko[s+l],f=e+a,d=e+i,p=f+i,_=K[f],b=K[d],h=K[p],B=le[_],v=le[b],y=o,m=r,M=1;if(!B){let A=j[f];y+=A>>4,m+=A&15,M++}if(!v){let A=j[d];y+=A>>4,m+=A&15,M++}if(!(B&&v)&&!le[h]){let A=j[p];y+=A>>4,m+=A&15,M++}W[l]=y*bo[M],X[l]=m*bo[M];let E=je[_],U=je[b];Y[l]=E&&U?0:3-E-U-je[h]}}function pn(e){let t=j[e],n=(t>>4)*17,o=(t&15)*17;W[0]=W[1]=W[2]=W[3]=n,X[0]=X[1]=X[2]=X[3]=o,Y[0]=Y[1]=Y[2]=Y[3]=3}function bn(e,t,n,o,r,s){let l=Be[s]===1,a=l&&!Mo,i=Se[a?0:Q[s]],f=Ne[s]===1,d=l&&!_e?16:0;Mt(s,e,n);for(let p=0;p<6;p++){let _=o+xt[p],b=K[_];if(q[b]&kt[p])continue;if(b!==0){let k=b&1023;if(f&&k===s||a&&Be[k])continue}let h=ke(r,p),B=h&65535,v=h>>>16;p===2&&Ro[s]&&!_e&&(v=v+We(e,t,n,Bt(e,n))&3),St?Ao(_,p):pn(_);let y=(B&31)<<4,m=B>>5<<4;i.reserve(4,6);let M=i.vc,E=Ze[p]*255,U=p|d,A=p*12;for(let k=0;k<4;k++){let G=k+v&3;re(i,e+se[A+k*3]<<8,t+se[A+k*3+1]<<8,n+se[A+k*3+2]<<8,y+Ye[G],m+gt[G],W[k]+.5|0,X[k]+.5|0,E*yo[Y[k]]+.5|0,U)}let P=Y[0]*64+W[0]+X[0]+Y[2]*64+W[2]+X[2],L=Y[1]*64+W[1]+X[1]+Y[3]*64+W[3]+X[3];we(i,M,P<L,!1)}}function mn(e,t,n,o,r){let s=Se[Q[r]],l=j[o],a=(l>>4)*17,i=(l&15)*17;Mt(r,e,n);let f=0,d=0;if(bt[r]&&!_e){let k=We(e,t,n,Bt(e,n));f=((k&15)/15-.5)*(6/16),d=((k>>>4&15)/15-.5)*(6/16)}let p=lt[r]===1&&!_e,_=6|(p?8:0),b=_|(p?32:0),h=ke(r,0)&65535,B=(h&31)<<4,v=h>>5<<4,y=.05,m=.95,M=Math.round((e+y+f)*256),E=Math.round((e+m+f)*256),U=Math.round((n+y+d)*256),A=Math.round((n+m+d)*256),P=t<<8,L=t+1<<8;s.reserve(8,24);for(let k=0;k<2;k++){let G=k?A:U,Z=k?U:A,w=s.vc;re(s,M,P,G,B,v+16,a,i,255,_),re(s,E,P,Z,B+16,v+16,a,i,255,_),re(s,E,L,Z,B+16,v,a,i,255,b),re(s,M,L,G,B,v,a,i,255,b),we(s,w,!1,!0)}}var mt=14/16;function vo(e){let t=e&1023;if(!De[t])return mt;let n=e>>10;return n&8?mt:mt-(n&7)/9}function Le(e,t){let n=K[e],o=n&1023;return he[o]===t?he[K[e+ie]&1023]===t?1:vo(n):xe[o]?-1:0}function Xe(e,t,n,o,r){if(t>=1||n>=1)return 1;let s=0,l=0;if(t>0||n>0){let a=Le(o,r);if(a>=1)return 1;a>=.8?(s+=a*10,l+=10):a>=0&&(s+=a,l+=1)}return e>=.8?(s+=e*10,l+=10):e>=0&&(s+=e,l+=1),t>=.8?(s+=t*10,l+=10):t>=0&&(s+=t,l+=1),n>=.8?(s+=n*10,l+=10):n>=0&&(s+=n,l+=1),l>0?s/l:e}var ht=(e,t)=>Math.max(e>>4,t>>4)<<4|Math.max(e&15,t&15),O=new Float32Array(4),hn=[0,256,256,0],_n=[256,256,0,0],gn=[2,3,1,0];function mo(e,t,n,o,r,s){let l=s===wt,a=Se[Q[s]];if(Me[s]){let y=Fe(e,n)*9+(Me[s]-1)*3;Oe=D[y],Ge=D[y+1],Ie=D[y+2]}else Oe=Ge=Ie=255;Rt=0;let i=j[o],f=K[o+ie],d=he[f&1023]===s;if(d)O[0]=O[1]=O[2]=O[3]=1;else{let y=vo(r),m=Le(o-J,s),M=Le(o+J,s),E=Le(o-ne,s),U=Le(o+ne,s);O[0]=Xe(y,m,E,o-J-ne,s),O[1]=Xe(y,m,U,o-J+ne,s),O[2]=Xe(y,M,E,o+J-ne,s),O[3]=Xe(y,M,U,o+J+ne,s)}let p=ke(s,2)&65535,_=(p&31)<<4,b=p>>5<<4,h=e<<8,B=t<<8,v=n<<8;if(!d&&!(q[f]&8&&O[0]>=1&&O[1]>=1&&O[2]>=1&&O[3]>=1)){let y=ht(i,j[o+ie]),m=(y>>4)*17,M=(y&15)*17,E=2|(l&&!_e?24:0),U=O[0]+O[2]-O[1]-O[3],A=O[0]+O[1]-O[2]-O[3],P=0;Math.abs(U)+Math.abs(A)>.001&&(P=Math.abs(U)>Math.abs(A)?U>0?3:1:A>0?0:2),a.reserve(4,12);let L=a.vc;for(let k=0;k<4;k++){let G=k+P&3;re(a,h+hn[k],B+Math.round(O[gn[k]]*256),v+_n[k],_+Ye[G],b+gt[G],m,M,255,E)}we(a,L,!1,!1)}for(let y=0;y<6;y++){if(y===2||y===3)continue;let m=o+xt[y],M=K[m];if(he[M&1023]===s||q[M]&kt[y])continue;let E=ht(i,j[m]),U=(E>>4)*17,A=(E&15)*17,P=Ze[y]*255+.5|0;a.reserve(4,12);let L=a.vc,k=y*12;for(let G=0;G<4;G++){let Z=se[k+G*3],w=se[k+G*3+1],N=se[k+G*3+2],x=w?O[Z+N*2]:0,C=Math.round(16*(1-x));re(a,h+(Z<<8),B+Math.round(x*256),v+(N<<8),_+Ye[G],b+C,U,A,P,y)}we(a,L,!1,!1)}{let y=o-ie,m=K[y];if(he[m&1023]!==s&&!(q[m]&4)){let M=ht(i,j[y]),E=(M>>4)*17,U=(M&15)*17,A=Ze[3]*255+.5|0;a.reserve(4,12);let P=a.vc,L=3*12;for(let k=0;k<4;k++)re(a,h+(se[L+k*3]<<8),B,v+(se[L+k*3+2]<<8),_+Ye[k],b+gt[k],E,U,A,3);we(a,P,!1,!1)}}}var ho=new Map;function yn(e,t,n,o,r,s){let l,a;switch(e){case 0:l=1-o,a=1-n;break;case 1:l=o,a=1-n;break;case 2:l=t,a=o;break;case 3:l=t,a=1-o;break;case 4:l=t,a=1-n;break;default:l=1-t,a=1-n}r[s]=Math.min(16,Math.max(0,l*16)),r[s+1]=Math.min(16,Math.max(0,a*16))}var z=1e-5;function xn(e,t,n){let o=e[t].box,r=Ke[n],s=(n&1)===0,l=s?o[r+3]:o[r],a=(r+1)%3,i=(r+2)%3;for(let f=0;f<e.length;f++){if(f===t)continue;let d=e[f];if(d.rotate)continue;let p=!0;for(let h=0;h<6;h++)if(!(d.tex[h]>=0)){p=!1;break}if(!p)continue;let _=d.box;if(!(_[3]-_[0]<=z||_[4]-_[1]<=z||_[5]-_[2]<=z||!(s?_[r]<=l+z&&_[r+3]>l+z:_[r]<l-z&&_[r+3]>=l-z))&&_[a]<=o[a]+z&&_[a+3]>=o[a+3]-z&&_[i]<=o[i]+z&&_[i+3]>=o[i+3]-z)return!0}return!1}function kn(e,t){let n=Math.cos(t.angle),o=Math.sin(t.angle),[r,s,l]=t.origin;for(let a=0;a<4;a++){let i=e[a*3]-r,f=e[a*3+1]-s,d=e[a*3+2]-l,p=i,_=f,b=d;t.axis==="x"?(_=f*n-d*o,b=f*o+d*n):t.axis==="y"?(p=i*n+d*o,b=-i*o+d*n):(p=i*n-f*o,_=i*o+f*n),e[a*3]=p+r,e[a*3+1]=_+s,e[a*3+2]=b+l}}function wn(e,t){let n=$[t],o=[],r=new Float32Array(8);for(let s=0;s<e.length;s++){let l=e[s],a=l.box;for(let i=0;i<6;i++){let f=l.tex[i];if(!(f>=0))continue;let d=Ke[i],p=(d+1)%3,_=(d+2)%3;if(a[p+3]-a[p]<=z||a[_+3]-a[_]<=z||!l.rotate&&xn(e,s,i))continue;let b=new Float32Array(12);for(let x=0;x<4;x++){for(let C=0;C<3;C++)b[x*3+C]=me[i][x][C]?a[C+3]:a[C];yn(i,b[x*3],b[x*3+1],b[x*3+2],r,x*2)}let h=l.uv?l.uv[i]:null;h&&(r[0]=h[0],r[1]=h[3],r[2]=h[2],r[3]=h[3],r[4]=h[2],r[5]=h[1],r[6]=h[0],r[7]=h[1]);let B=(f&31)<<4,v=f>>5<<4,y=new Uint16Array(8);for(let x=0;x<4;x++)y[x*2]=B+Math.round(r[x*2]),y[x*2+1]=v+Math.round(r[x*2+1]);let m=i,M=!0;if(l.rotate){kn(b,l.rotate);let x=b[3]-b[0],C=b[4]-b[1],H=b[5]-b[2],ue=b[9]-b[0],de=b[10]-b[1],fe=b[11]-b[2],ge=C*fe-H*de,Qe=H*ue-x*fe,Je=x*de-C*ue,Co=Math.hypot(ge,Qe,Je)||1,et=Math.abs(ge),tt=Math.abs(Qe),ot=Math.abs(Je);if(et>=tt&&et>=ot?m=ge>0?0:1:tt>=ot?m=Qe>0?2:3:m=Je>0?4:5,M=Math.max(et,tt,ot)/Co>.9999,M)for(let Pe=0;Pe<12;Pe++)b[Pe]=Math.round(b[Pe]*4096)/4096}let E=-1,U=Ke[m];if(M){let x=b[U];(m&1?Math.abs(x)<z:Math.abs(x-1)<z)&&(E=m)}let A=1,P=0;for(let x=0;x<4;x++)A=Math.min(A,b[x*3+1]),P=Math.max(P,b[x*3+1]);let L=new Float32Array(16),k=wo[m],G=So[m],Z=me[m][0][k],w=me[m][0][G];for(let x=0;x<4;x++){let C=Math.min(1,Math.max(0,Math.abs(b[x*3+k]-Z))),H=Math.min(1,Math.max(0,Math.abs(b[x*3+G]-w)));L[x*4]=(1-C)*(1-H),L[x*4+1]=C*(1-H),L[x*4+2]=C*H,L[x*4+3]=(1-C)*H}let N=0;E>=0&&(n===cn||n===ln?N=2:(n===un||n===dn)&&(E===2||E===3)&&(N=1)),o.push({p:b,uv:y,w:L,face:m,bface:E,rb0:A,rb1:P,shade:l.shade===!1?1:Ze[m],smooth:l.ao!==!1&&M,cullSame:N})}}return o}var Te=new Float32Array(48),Ee=new Float32Array(48),Ce=new Float32Array(48),Ue=new Float32Array(48),_o=new Int32Array(12),_t=0;function Sn(e,t,n,o,r,s,l){Bo=o;let a=uo(r,fn),i=l===an&&!_e?We(e,t,n,Bt(e,n))&3:0,f=r+a*65536+i*33554432,d=ho.get(f);if(d||(d=wn(fo(r,a,i),s),ho.set(f,d)),!d.length)return;let p=Se[Q[s]];Mt(s,e,n),_t++;let _=pe[s];for(let b=0;b<d.length;b++){let h=d[b],B=o;if(h.bface>=0){let w=o+xt[h.bface],N=K[w];if(q[N]&kt[h.bface])continue;if(N!==0){let x=N&1023;if(h.bface!==2&&h.bface!==3){let C=ce[N];if(C&&h.rb0>=en[C]-z&&h.rb1<=tn[C]+z)continue}if(x===s&&Ne[s]||h.cullSame===1&&x===s||h.cullSame===2&&$[x]===l&&pe[x]===_)continue}B=w}let v=h.face,y=St&&h.smooth,m=(v*2+(h.bface>=0?1:0))*4;if(y&&_o[m>>2]!==_t){_o[m>>2]=_t,Ao(B,v);for(let w=0;w<4;w++)Te[m+w]=W[w],Ee[m+w]=X[w],Ce[m+w]=yo[Y[w]],Ue[m+w]=Y[w]*64+W[w]+X[w]}let M=j[B],E=(M>>4)*17,U=(M&15)*17;p.reserve(4,6);let A=p.vc,P=h.shade*255,L=h.w,k=h.p,G=0,Z=0;for(let w=0;w<4;w++){let N=E,x=U,C=1;if(y){let H=L[w*4],ue=L[w*4+1],de=L[w*4+2],fe=L[w*4+3];N=Te[m]*H+Te[m+1]*ue+Te[m+2]*de+Te[m+3]*fe,x=Ee[m]*H+Ee[m+1]*ue+Ee[m+2]*de+Ee[m+3]*fe,C=Ce[m]*H+Ce[m+1]*ue+Ce[m+2]*de+Ce[m+3]*fe;let ge=Ue[m]*H+Ue[m+1]*ue+Ue[m+2]*de+Ue[m+3]*fe;w===0||w===2?G+=ge:Z+=ge}re(p,Math.round((e+k[w*3])*256),Math.round((t+k[w*3+1])*256),Math.round((n+k[w*3+2])*256),h.uv[w*2],h.uv[w*2+1],N+.5|0,x+.5|0,P*C+.5|0,v)}we(p,A,G<Z,!1)}}var qn=new Uint8Array([...$e.grass,...$e.foliage,...$e.water].map(e=>Math.round(e)));function Rn(e,t,n){K=e.blocks,j=e.light,D=e.tint,Mo=!!t.fancyLeaves,St=!!t.smoothLighting,_e=n;for(let o of Se)o.vc=0,o.ic=0}function Mn(e,t,n,o,r){let s=r&1023;if(s===0||s>=S)return;let l=$[s];l===on||l===nn&&(r>>10&3)===2?bn(e,t,n,o,r,s):l===sn?mn(e,t,n,o,s):l===rn?mo(e,t,n,o,r,s):Sn(e,t,n,o,r,s,l),s===yt&&mo(e,t,n,o,r,wt)}function Bn(){return Se.map(e=>e.finish())}function To(e,t){Rn(e,t,!1);let n=e.blocks;for(let o=0;o<16;o++)for(let r=0;r<16;r++){let s=Jt(0,o,r);for(let l=0;l<16;l++,s++){let a=n[s];a!==0&&Mn(l,o,r,s,a)}}return Bn()}var Eo=self;Eo.onmessage=e=>{let t=e.data;if(!t||typeof t.id!="number")return;let n;try{n=To({blocks:t.blocks,light:t.light,tint:t.tint},t.opts)}catch(r){console.error("[mesh.worker]",r),n=[null,null,null,null,null]}let o=[];for(let r of n)r&&o.push(r.positions.buffer,r.uvs.buffer,r.tints.buffer,r.lights.buffer,r.indices.buffer);Eo.postMessage({id:t.id,mesh:n},o)};})();\n';var jh=class{constructor(t){this.modified=!1;this.lit=!1;this.cx=t.cx,this.cz=t.cz,this.blocks=t.blocks.length===65536?t.blocks:uk(t.blocks),this.light=new Uint8Array(65536),this.biome=t.biome&&t.biome.length>=256?t.biome:new Uint8Array(256),this.tint=t.tint&&t.tint.length>=256*9?t.tint:new Uint8Array(256*9),this.counts=new Uint16Array(16),this.recount()}get(t,e,n){return e<0||e>255?0:this.blocks[e<<8|n<<4|t]}set(t,e,n,s){if(e<0||e>255)return;s&1023||(s=0);let r=e<<8|n<<4|t,o=this.blocks[r];o!==s&&(this.blocks[r]=s,o===0?this.counts[e>>4]++:s===0&&this.counts[e>>4]--,this.modified=!0)}recount(){let t=this.blocks,e=this.counts;for(let n=0;n<16;n++){let s=0,r=n+1<<12;for(let o=n<<12;o<r;o++)t[o]!==0&&s++;e[n]=s}}};function uk(i){let t=new Uint16Array(65536);return t.set(i.subarray(0,Math.min(i.length,65536))),t}var Qh=class{constructor(t,e,n){this.onMessage=n;this.workers=[];this.url=URL.createObjectURL(new Blob([t],{type:"text/javascript"}));for(let s=0;s<e;s++){let r=new Worker(this.url),o={w:r,busy:0};r.onmessage=a=>{o.busy=Math.max(0,o.busy-1),this.onMessage(a.data)},r.onerror=a=>{console.error("[worker]",a.message)},this.workers.push(o)}}free(t){let e=null;for(let n of this.workers)n.busy<t&&(!e||n.busy<e.busy)&&(e=n);return e}get inFlight(){return this.workers.reduce((t,e)=>t+e.busy,0)}broadcast(t){for(let e of this.workers)e.w.postMessage(t)}terminate(){for(let t of this.workers)t.w.terminate();URL.revokeObjectURL(this.url)}},Ds=class Ds{constructor(t,e,n){this.gen=null;this.genPool=null;this.meshPool=null;this.centerCx=0;this.centerCz=0;this.wanted=[];this.wantedDirty=!0;this.requested=new Set;this.arrived=[];this.nextJob=1;this.meshSeq=new Map;this.meshInFlight=new Map;this.meshJobs=new Map;this.meshed=new Set;this.padded=Eh();this.urgent=new Set;this.saving=new Set;this.saveTimer=null;this.firstEditAt=0;this.lastEditAt=0;this.disposed=!1;this.stats={loaded:0,genQueue:0,meshQueue:0,genMs:0,meshMs:0,lightMs:0};this.world=t,this.renderer=e,this.opts=n;let s=Math.max(2,navigator.hardwareConcurrency||2),r=Math.max(1,Math.min(2,s-2)),o=Math.max(1,Math.min(2,s-2));try{this.genPool=new Qh(Ty,r,a=>this.onGenMessage(a)),this.genPool.broadcast({type:"init",seed:n.seed})}catch(a){console.warn("[chunks] generation workers unavailable, generating on the main thread",a),this.genPool=null}try{this.meshPool=new Qh(ky,o,a=>this.onMeshMessage(a))}catch(a){console.warn("[chunks] mesh workers unavailable, meshing on the main thread",a),this.meshPool=null}t.onBlockChange=(a,l,c)=>{this.noteEdit();let h=Math.floor(a/16),u=Math.floor(c/16),f=l>>4;for(let d=-1;d<=1;d++)for(let g=-1;g<=1;g++)for(let b=-1;b<=1;b++){let p=f+b;if(p<0||p>=16)continue;let m=_n(h+d,p,u+g);this.world.dirtySections.has(m)&&this.urgent.add(m)}}}noteEdit(){let t=performance.now();this.lastEditAt=t,this.saveTimer===null&&(this.firstEditAt=t,this.saveTimer=setTimeout(()=>this.onSaveTimer(),Ds.SAVE_QUIET_MS))}onSaveTimer(){if(this.saveTimer=null,this.disposed)return;let t=performance.now(),e=t-this.lastEditAt,n=t-this.firstEditAt;if(e<Ds.SAVE_QUIET_MS-5&&n<Ds.SAVE_MAX_WAIT_MS){this.saveTimer=setTimeout(()=>this.onSaveTimer(),Math.max(10,Math.min(Ds.SAVE_QUIET_MS-e,Ds.SAVE_MAX_WAIT_MS-n)));return}this.saveAll()}get savePending(){return this.saveTimer!==null}flushOnExit(){if(this.disposed)return Promise.resolve();this.saveTimer!==null&&(clearTimeout(this.saveTimer),this.saveTimer=null),fn.journalPending(this.opts.worldId);for(let t of this.world.chunks.values())t.modified&&fn.journalChunk(this.opts.worldId,t);return this.saveAll()}mainGen(){return this.gen||(this.gen=new Jh(this.opts.seed)),this.gen}get renderDistance(){return this.opts.renderDistance}get meshOptions(){return this.opts.meshOptions}setRenderDistance(t){if(t!==this.opts.renderDistance){this.opts.renderDistance=t,this.wantedDirty=!0;for(let e of Array.from(this.meshed)){let n=Wr(e);this.inViewRange(_s(n),xs(n))||(this.renderer.setSection(_s(n),jo(e),xs(n),null),this.meshed.delete(e),this.world.dirtySections.add(e))}}}setMeshOptions(t){this.opts.meshOptions={...t},this.remeshAll()}remeshAll(){for(let t of this.world.chunks.values())for(let e=0;e<16;e++)this.world.dirtySections.add(_n(t.cx,e,t.cz))}inViewRange(t,e){let n=t-this.centerCx,s=e-this.centerCz,r=this.opts.renderDistance+.5;return n*n+s*s<=r*r}inLoadRange(t,e,n){let s=t-this.centerCx,r=e-this.centerCz,o=this.opts.renderDistance+n+.5;return s*s+r*r<=o*o}areaReady(t,e,n){let s=Math.floor(t/16),r=Math.floor(e/16);for(let o=-n;o<=n;o++)for(let a=-n;a<=n;a++){let l=this.world.getChunk(s+o,r+a);if(!l||!l.lit)return!1;for(let c=0;c<16;c++){let h=_n(s+o,c,r+a);if(this.world.dirtySections.has(h)||this.meshInFlight.has(h))return!1}}return!0}progress(t,e,n){let s=Math.floor(t/16),r=Math.floor(e/16),o=0,a=0;for(let l=-n;l<=n;l++)for(let c=-n;c<=n;c++){if(o+=2,!this.world.getChunk(s+l,r+c))continue;a++;let u=!0;for(let f=0;f<16&&u;f++){let d=_n(s+l,f,r+c);(this.world.dirtySections.has(d)||this.meshInFlight.has(d))&&(u=!1)}u&&a++}return o?a/o:1}update(t,e,n){if(this.disposed)return;let s=Math.floor(t/16),r=Math.floor(e/16);(s!==this.centerCx||r!==this.centerCz)&&(this.centerCx=s,this.centerCz=r,this.wantedDirty=!0);let o=performance.now();this.wantedDirty&&(this.computeWanted(),this.unloadFar(),this.wantedDirty=!1),this.requestColumns(),this.flushUrgent(),this.integrateArrived(o,n*.5),this.dispatchMeshing(o,n),this.stats.loaded=this.world.chunks.size,this.stats.genQueue=this.requested.size+this.arrived.length,this.stats.meshQueue=this.world.dirtySections.size}computeWanted(){let t=this.opts.renderDistance+1,e=[];for(let n=-t;n<=t;n++)for(let s=-t;s<=t;s++)n*n+s*s>(t+.5)*(t+.5)||e.push([n*n+s*s,Me(this.centerCx+n,this.centerCz+s)]);e.sort((n,s)=>n[0]-s[0]),this.wanted=e.map(n=>n[1])}requestColumns(){for(let t of this.wanted){if(this.world.chunks.has(t)||this.requested.has(t))continue;let e=_s(t),n=xs(t);if(this.opts.savedKeys.has(t)){this.requested.add(t),this.loadSaved(e,n,t);continue}if(this.genPool){let s=this.genPool.free(2);if(!s)break;s.busy++,this.requested.add(t),s.w.postMessage({type:"gen",id:this.nextJob++,cx:e,cz:n})}else{if(this.arrived.length>0)break;let s=performance.now();this.arrived.push(this.mainGen().generate(e,n)),this.stats.genMs=performance.now()-s;break}}}async loadSaved(t,e,n){try{let s=await fn.loadChunk(this.opts.worldId,t,e);if(this.disposed)return;if(s){this.opts.remapPalette&&fn.remap(s.blocks,this.opts.remapPalette),this.arrived.push({cx:t,cz:e,blocks:s.blocks,biome:s.biome,tint:s.tint});return}}catch(s){console.warn("[chunks] failed to load saved chunk",t,e,s)}this.disposed||(this.opts.savedKeys.delete(n),this.requested.delete(n))}onGenMessage(t){this.disposed||!t||t.type!=="chunk"||this.arrived.push({cx:t.cx,cz:t.cz,blocks:t.blocks,biome:t.biome,tint:t.tint})}integrateArrived(t,e){if(this.arrived.length>1){let s=this.centerCx,r=this.centerCz;this.arrived.sort((o,a)=>(o.cx-s)**2+(o.cz-r)**2-((a.cx-s)**2+(a.cz-r)**2))}let n=0;for(;this.arrived.length&&!(n>0&&performance.now()-t>e);){let s=this.arrived.shift(),r=Me(s.cx,s.cz);if(this.requested.delete(r),this.world.chunks.has(r)||!this.inLoadRange(s.cx,s.cz,2))continue;let o=performance.now();this.world.addChunk(new jh(s)),this.stats.lightMs=performance.now()-o,n++}}columnReady(t,e){for(let n=-1;n<=1;n++)for(let s=-1;s<=1;s++){let r=this.world.getChunk(t+n,e+s);if(!r||!r.lit)return!1}return!0}flushUrgent(){if(this.urgent.size){for(let t of this.urgent){if(!this.world.dirtySections.has(t))continue;let e=Wr(t),n=_s(e),s=xs(e),r=jo(t);!this.inViewRange(n,s)||!this.columnReady(n,s)||(this.world.dirtySections.delete(t),this.meshSync(n,r,s,t))}this.urgent.clear()}}meshSync(t,e,n,s){var l;let r=this.world.getChunk(t,n);if(this.meshSeq.set(s,((l=this.meshSeq.get(s))!=null?l:0)+1),this.meshInFlight.delete(s),r.counts[e]===0){this.apply(t,e,n,s,null);return}let o=performance.now();ip(this.world,t,e,n,this.padded);let a=Pb(this.padded,this.opts.meshOptions);this.stats.meshMs=performance.now()-o,this.apply(t,e,n,s,a)}apply(t,e,n,s,r){let o=!r||r.every(a=>!a);this.renderer.setSection(t,e,n,o?null:r),o?this.meshed.delete(s):this.meshed.add(s)}dispatchMeshing(t,e){var l;let n=this.world.dirtySections;if(!n.size)return;let s=this.centerCx,r=this.centerCz,o=[];for(let c of n){if(this.meshInFlight.has(c))continue;let h=Wr(c),u=_s(h),f=xs(h);if(!this.inViewRange(u,f))continue;let d=(u-s)**2+(f-r)**2;o.push([d,c])}o.sort((c,h)=>c[0]-h[0]);let a=new Map;for(let[,c]of o){let h=Wr(c),u=_s(h),f=xs(h),d=jo(c),g=a.get(h);if(g===void 0&&(g=this.columnReady(u,f),a.set(h,g)),!g)continue;if(this.world.getChunk(u,f).counts[d]===0){n.delete(c),this.meshed.has(c)&&this.apply(u,d,f,c,null);continue}if(this.meshPool){let p=this.meshPool.free(3);if(!p||performance.now()-t>e)break;n.delete(c);let m=((l=this.meshSeq.get(c))!=null?l:0)+1;this.meshSeq.set(c,m),this.meshInFlight.set(c,m);let v=Eh();ip(this.world,u,d,f,v),p.busy++;let y=this.nextJob++;this.meshJobs.set(y,{k:c,seq:m}),p.w.postMessage({id:y,blocks:v.blocks,light:v.light,tint:v.tint,opts:this.opts.meshOptions},[v.blocks.buffer,v.light.buffer,v.tint.buffer])}else{if(performance.now()-t>e)break;n.delete(c),this.meshSync(u,d,f,c)}}}onMeshMessage(t){if(this.disposed||!t)return;let e=this.meshJobs.get(t.id);if(!e)return;this.meshJobs.delete(t.id);let{k:n,seq:s}=e;if(this.meshInFlight.get(n)!==s)return;this.meshInFlight.delete(n);let r=Wr(n),o=_s(r),a=xs(r),l=jo(n);if(!this.world.getChunk(o,a)||!this.inViewRange(o,a)){this.world.dirtySections.add(n);return}this.apply(o,l,a,n,t.mesh)}unloadFar(){for(let t of Array.from(this.world.chunks.values())){if(this.inLoadRange(t.cx,t.cz,3))continue;let e=Me(t.cx,t.cz);t.modified&&this.saveChunk(t),this.world.removeChunk(t.cx,t.cz),this.renderer.removeColumn(t.cx,t.cz);for(let n=0;n<16;n++){let s=_n(t.cx,n,t.cz);this.world.dirtySections.delete(s),this.meshed.delete(s),this.meshInFlight.delete(s),this.urgent.delete(s)}}}saveChunk(t){let e=Me(t.cx,t.cz);t.modified=!1,this.opts.savedKeys.add(e),this.saving.add(e),fn.saveChunk(this.opts.worldId,t).catch(n=>{console.warn("[chunks] save failed",n),t.modified=!0}).finally(()=>this.saving.delete(e))}async saveAll(){let t=[];for(let e of this.world.chunks.values())e.modified&&(e.modified=!1,this.opts.savedKeys.add(Me(e.cx,e.cz)),t.push(fn.saveChunk(this.opts.worldId,e).catch(n=>{console.warn("[chunks] save failed",n),e.modified=!0})));await Promise.all(t)}generator(){return this.mainGen()}dispose(){var t,e;this.disposed=!0,this.saveTimer!==null&&(clearTimeout(this.saveTimer),this.saveTimer=null),(t=this.genPool)==null||t.terminate(),(e=this.meshPool)==null||e.terminate(),this.world.onBlockChange=null;for(let n of this.meshed){let s=Wr(n);this.renderer.setSection(_s(s),jo(n),xs(s),null)}this.meshed.clear()}};Ds.SAVE_QUIET_MS=1500,Ds.SAVE_MAX_WAIT_MS=5e3;var tu=Ds;var Ui=.05,dk=5,lr=.3,Cy=1.8,fk=1.5,eu=1.62,pk=1.27,cr=.6,nu=.08,mk=.98,gk=.42,bk=.1,yk=1.3,iu=.3,Ry=.05,vk=.35,_k=.35,qe=1e-7,xk=Math.PI/180,Ea=Math.PI/2-.001,Tl=new Float32Array(xt).fill(.6),ru=new Float32Array(xt).fill(1),Bp=new Float32Array(xt).fill(1);function oo(i,t,e){let n=yt[t];n!==void 0&&(i[n]=e)}oo(Tl,"ice",.98);oo(Tl,"packed_ice",.98);oo(Tl,"blue_ice",.989);oo(Tl,"slime_block",.8);oo(ru,"soul_sand",.4);oo(ru,"honey_block",.4);oo(Bp,"honey_block",.5);var Uy,su=(Uy=yt.water)!=null?Uy:-1,Dy,wk=(Dy=yt.lava)!=null?Dy:-1,Ny,Py=(Ny=yt.slime_block)!=null?Ny:-1,By,Mk=(By=yt.cobweb)!=null?By:-1;function Ly(i,t){let e=i&Gt;if((t&Gt)===e)return 1;let n=i>>10;return n&8?8/9:(8-(n&7))/9}function Sk(i,t){let e=i&Gt;if((t&Gt)===e)return 1;let n=i>>10;return n&8?14/16:Math.max(1/16,14/16-(n&7)/9)}var Iy=i=>((i>Math.PI||i<-Math.PI)&&(i-=Math.floor((i+Math.PI)/(2*Math.PI))*2*Math.PI),i),El=class{constructor(){this.x=0;this.y=80;this.z=0;this.vx=0;this.vy=0;this.vz=0;this.yaw=0;this.pitch=0;this.flying=!1;this.sprinting=!1;this.sneaking=!1;this.onGround=!1;this.inWater=!1;this.inLava=!1;this.headInWater=!1;this.width=.6;this.height=1.8;this.horizontalCollision=!1;this.frozen=!1;this.ox=0;this.oy=80;this.oz=0;this.sx=0;this.sy=80;this.sz=0;this.alpha=0;this.acc=0;this.clock=0;this.eyeH=eu;this.oEyeH=eu;this.fovMod=1;this.oFovMod=1;this.bobAmt=0;this.oBobAmt=0;this.walkDist=0;this.oWalkDist=0;this.kF=!1;this.kB=!1;this.kL=!1;this.kR=!1;this.kJump=!1;this.kShift=!1;this.kSprint=!1;this.jumpLatch=!1;this.flyToggle=!1;this.sprintTap=!1;this.lastSpaceTap=-1e9;this.lastWTap=-1e9;this.tvx=0;this.tvy=0;this.tvz=0;this.noJumpDelay=0;this.crouched=!1;this.minorCollision=!1;this.waterHeight=0;this.lavaHeight=0;this.eyeUnder=!1;this.stuck=!1;this.edgeGuard=!1;this.w=null;this.boxes=new Float64Array(6*128);this.nBoxes=0;this.bb=new Float64Array(6);this.tb=new Float64Array(6);this.eb=new Float64Array(6);this.mb=new Float64Array(6);this.res=new Float64Array(3);this.qx=0;this.qy=0;this.qz=0;this.nb=(t,e,n)=>this.w.get(this.qx+t,this.qy+e,this.qz+n);this.lcx=NaN;this.lcz=NaN;this.lres=!1}toggleFlight(){this.flyToggle=!0}eyeHeight(){return this.oEyeH+(this.eyeH-this.oEyeH)*this.alpha}boxHeight(){return this.crouched?fk:Cy}update(t,e,n,s){if(this.w=n,t>0||(t=0),t>.25&&(t=.25),this.clock+=t,e.enabled){if(e.mouseDX||e.mouseDY){let a=Math.max(0,Math.min(1,(s.sensitivity||1)*.5))*.6+.2,l=a*a*a*8*.15*xk;this.yaw=Iy(this.yaw-e.mouseDX*l);let c=this.pitch-e.mouseDY*l*(s.invertY?-1:1);this.pitch=c>Ea?Ea:c<-Ea?-Ea:c}e.actionPressed("jump")&&(this.jumpLatch=!0,this.clock-this.lastSpaceTap<vk?(this.flyToggle=!this.flyToggle,this.lastSpaceTap=-1e9):this.lastSpaceTap=this.clock),e.actionPressed("forward")&&(this.clock-this.lastWTap<_k?(this.sprintTap=!0,this.lastWTap=-1e9):this.lastWTap=this.clock),this.kF=e.actionDown("forward"),this.kB=e.actionDown("back"),this.kL=e.actionDown("left"),this.kR=e.actionDown("right"),this.kJump=e.actionDown("jump"),this.kShift=e.actionDown("sneak"),this.kSprint=e.actionDown("sprint")}else this.kF=this.kB=this.kL=this.kR=this.kJump=this.kShift=this.kSprint=!1;this.acc+=t;let r=0;for(;this.acc>=Ui&&r<dk;)this.tick(),this.acc-=Ui,r++;this.acc>=Ui&&(this.acc=Ui*.999),this.alpha=this.acc/Ui,this.updateHead()}eye(){let t=this.renderPos();return{x:t[0],y:t[1]+this.eyeHeight(),z:t[2]}}look(){let t=Math.cos(this.pitch);return[-Math.sin(this.yaw)*t,Math.sin(this.pitch),-Math.cos(this.yaw)*t]}fovScale(){return this.oFovMod+(this.fovMod-this.oFovMod)*this.alpha}bob(){let t=this.alpha,e=this.oWalkDist+(this.walkDist-this.oWalkDist)*t,n=this.oBobAmt+(this.bobAmt-this.oBobAmt)*t;return{phase:e*Math.PI,amount:Math.max(0,Math.min(1,n/.1))}}serialize(){return{x:this.x,y:this.y,z:this.z,yaw:this.yaw,pitch:this.pitch,flying:this.flying}}restore(t){let e=(n,s)=>typeof n=="number"&&Number.isFinite(n)?n:s;this.x=e(t.x,.5),this.y=Math.max(0,Math.min(300,e(t.y,80))),this.z=e(t.z,.5),this.yaw=Iy(e(t.yaw,0)),this.pitch=Math.max(-Ea,Math.min(Ea,e(t.pitch,0))),this.flying=!!t.flying,this.vx=this.vy=this.vz=0,this.ox=this.sx=this.x,this.oy=this.sy=this.y,this.oz=this.sz=this.z,this.acc=0,this.alpha=0,this.crouched=this.sneaking=this.sprinting=!1,this.eyeH=this.oEyeH=eu,this.fovMod=this.oFovMod=1,this.bobAmt=this.oBobAmt=0,this.onGround=!1,this.noJumpDelay=0,this.flyToggle=this.sprintTap=this.jumpLatch=!1}renderPos(){if(this.x!==this.sx||this.y!==this.sy||this.z!==this.sz)return[this.x,this.y,this.z];let t=this.alpha;return[this.ox+(this.x-this.ox)*t,this.oy+(this.y-this.oy)*t,this.oz+(this.z-this.oz)*t]}tick(){let t=this.w;if(this.ox=this.x,this.oy=this.y,this.oz=this.z,this.oEyeH=this.eyeH,this.oFovMod=this.fovMod,this.oBobAmt=this.bobAmt,this.oWalkDist=this.walkDist,this.lcx=NaN,!this.loadedAt(Math.floor(this.x),Math.floor(this.z))){this.frozen=!0,this.vx=this.vy=this.vz=0,this.sx=this.x,this.sy=this.y,this.sz=this.z,this.jumpLatch=!1;return}this.frozen=!1,this.tvx=this.vx*Ui,this.tvy=this.vy*Ui,this.tvz=this.vz*Ui,this.updateFluids(t),this.noJumpDelay>0&&this.noJumpDelay--,this.flyToggle&&(this.flyToggle=!1,this.flying=!this.flying,this.flying&&this.onGround&&(this.tvy=Math.max(this.tvy,.2),this.onGround=!1));let e=this.kShift;e&&!this.flying?this.crouched=!0:this.crouched&&this.fits(Cy)&&(this.crouched=!1),this.sneaking=this.crouched;let n=(this.kF?1:0)-(this.kB?1:0),s=(this.kL?1:0)-(this.kR?1:0);this.crouched&&(n*=iu,s*=iu);let r=n>1e-5;!this.sprinting&&r&&!this.crouched&&(this.sprintTap&&(this.onGround||this.flying||this.eyeUnder)&&(this.sprinting=!0),this.kSprint&&(!this.inWater||this.eyeUnder||this.flying)&&(this.sprinting=!0)),this.sprintTap=!1,this.sprinting&&(!r||this.crouched||this.horizontalCollision&&!this.minorCollision||this.inWater&&!this.eyeUnder&&!this.flying)&&(this.sprinting=!1);let o=this.kJump||this.jumpLatch;if(this.jumpLatch=!1,this.flying){let c=0;e&&c--,o&&c++,this.tvy+=c*Ry*3}else this.inWater&&e&&(this.tvy-=.04);if(Math.abs(this.tvx)<.003&&(this.tvx=0),Math.abs(this.tvy)<.003&&(this.tvy=0),Math.abs(this.tvz)<.003&&(this.tvz=0),o&&!this.flying){let c=this.inLava?this.lavaHeight:this.waterHeight,h=this.inWater&&c>0,u=.4;!h||this.onGround&&!(c>u)?!this.inLava||this.onGround&&!(c>u)?(this.onGround||h&&c<=u)&&this.noJumpDelay===0&&(this.jumpFromGround(t),this.noJumpDelay=10):this.tvy+=.04:this.tvy+=.04}else this.noJumpDelay=0;this.edgeGuard=e&&!this.flying&&this.onGround,this.travel(t,s*.98,n*.98),this.onGround&&this.flying&&(this.flying=!1);let a=Math.min(.1,Math.sqrt(this.tvx*this.tvx+this.tvz*this.tvz));this.bobAmt+=((this.onGround?a:0)-this.bobAmt)*.4;let l=this.sprinting?this.flying?1.15:1.1:1;this.fovMod+=(l-this.fovMod)*.5,this.eyeH+=((this.crouched?pk:eu)-this.eyeH)*.5,this.vx=this.tvx/Ui,this.vy=this.tvy/Ui,this.vz=this.tvz/Ui,this.sx=this.x,this.sy=this.y,this.sz=this.z}jumpFromGround(t){let e=t.get(Math.floor(this.x),Math.floor(this.y),Math.floor(this.z))&Gt,n=Bp[e];n===1&&(n=Bp[this.blockBelow(t,.5000001)]),this.tvy=gk*n,this.sprinting&&(this.tvx-=Math.sin(this.yaw)*.2,this.tvz-=Math.cos(this.yaw)*.2)}travel(t,e,n){if(this.inWater&&!this.flying){let s=this.y,r=this.sprinting?.9:.8;this.moveRelative(.02,e,n),this.move(t,this.tvx,this.tvy,this.tvz),this.tvx*=r,this.tvy*=.8,this.tvz*=r,this.sprinting||(this.tvy-=nu/16),this.horizontalCollision&&this.freeAt(t,this.tvx,this.tvy+.6-this.y+s,this.tvz)&&(this.tvy=.3)}else if(this.inLava&&!this.flying){let s=this.y;this.moveRelative(.02,e,n),this.move(t,this.tvx,this.tvy,this.tvz),this.lavaHeight<=.4?(this.tvx*=.5,this.tvy*=.8,this.tvz*=.5,this.sprinting||(this.tvy-=nu/16)):(this.tvx*=.5,this.tvy*=.5,this.tvz*=.5),this.tvy-=nu/4,this.horizontalCollision&&this.freeAt(t,this.tvx,this.tvy+.6-this.y+s,this.tvz)&&(this.tvy=.3)}else{let s=Tl[this.blockBelow(t,.5000001)],r=this.onGround?s*.91:.91,o=this.onGround?bk*(this.sprinting?yk:1)*(.21600002/(s*s*s)):this.flying?Ry*(this.sprinting?2:1):this.sprinting?.026:.02,a=this.tvy;this.moveRelative(o,e,n),this.move(t,this.tvx,this.tvy,this.tvz),this.tvy=this.flying?a*.6:(this.tvy-nu)*mk,this.tvx*=r,this.tvz*=r}}moveRelative(t,e,n){let s=e*e+n*n;if(s<1e-7)return;let r=e,o=n;if(s>1){let c=Math.sqrt(s);r/=c,o/=c}r*=t,o*=t;let a=Math.sin(this.yaw),l=Math.cos(this.yaw);this.tvx+=-o*a-r*l,this.tvz+=-o*l+r*a}setBB(t=this.boxHeight()){let e=this.bb;return e[0]=this.x-lr,e[1]=this.y,e[2]=this.z-lr,e[3]=this.x+lr,e[4]=this.y+t,e[5]=this.z+lr,e}move(t,e,n,s){this.stuck&&(e*=.25,n*=.05,s*=.25,this.tvx=this.tvy=this.tvz=0);let r=this.setBB(),o=Math.abs(e),a=Math.abs(n),l=Math.abs(s);if(this.gather(t,r[0]-o-.01,r[1]-a-cr-.01,r[2]-l-.01,r[3]+o+.01,r[4]+a+cr+.01,r[5]+l+.01),this.edgeGuard&&n<=0){let v=e,y=s,_=.05;for(;v!==0&&this.free(v,-cr,0);)v=v<_&&v>=-_?0:v>0?v-_:v+_;for(;y!==0&&this.free(0,-cr,y);)y=y<_&&y>=-_?0:y>0?y-_:y+_;for(;v!==0&&y!==0&&this.free(v,-cr,y);)v=v<_&&v>=-_?0:v>0?v-_:v+_,y=y<_&&y>=-_?0:y>0?y-_:y+_;e=v,s=y}this.collide(e,n,s);let c=this.res[0],h=this.res[1],u=this.res[2];this.x+=c,this.y+=h,this.z+=u;let f=Math.abs(e-c)>1e-5,d=Math.abs(s-u)>1e-5,g=Math.abs(n-h)>1e-5;this.horizontalCollision=f||d,this.onGround=g&&n<0,this.minorCollision=this.horizontalCollision&&this.isMinorCollision(c,u),f&&(this.tvx=0),d&&(this.tvz=0);let b=this.blockId(t,Math.floor(this.x),Math.floor(this.y-.2),Math.floor(this.z));if(g&&(b===Py&&n<0&&!this.kShift&&this.tvy<0?this.tvy=-this.tvy:this.tvy=0),this.onGround&&b===Py&&!this.kShift){let v=Math.abs(this.tvy);if(v<.1){let y=.4+v*.2;this.tvx*=y,this.tvz*=y}}this.walkDist+=Math.sqrt(c*c+u*u)*.6;let p=this.blockId(t,Math.floor(this.x),Math.floor(this.y),Math.floor(this.z)),m=p===su?1:ru[p];m===1&&p!==su&&(m=ru[this.blockBelow(t,.5000001)]),m!==1&&(this.tvx*=m,this.tvz*=m)}isMinorCollision(t,e){let n=(this.kF?1:0)-(this.kB?1:0),s=(this.kL?1:0)-(this.kR?1:0);this.crouched&&(n*=iu,s*=iu);let r=Math.sin(this.yaw),o=Math.cos(this.yaw),a=-n*r-s*o,l=-n*o+s*r,c=a*a+l*l,h=t*t+e*e;if(c<1e-5||h<1e-5)return!1;let u=(a*t+l*e)/Math.sqrt(c*h);return Math.acos(Math.max(-1,Math.min(1,u)))<.13962634}collide(t,e,n){let s=this.bb;this.sweep(s,t,e,n);let r=this.res[0],o=this.res[1],a=this.res[2],l=Math.abs(r-t)>qe,c=Math.abs(o-e)>qe,h=Math.abs(a-n)>qe;if((this.onGround||c&&e<0)&&(l||h)){this.sweep(s,t,cr,n);let u=this.res[0],f=this.res[1],d=this.res[2],g=this.eb;g.set(s),t<0?g[0]+=t:g[3]+=t,n<0?g[2]+=n:g[5]+=n;let b=this.clip(g,1,cr);if(b<cr){let p=this.mb;p.set(s),p[1]+=b,p[4]+=b,this.sweep(p,t,0,n);let m=this.res[0],v=this.res[2];m*m+v*v>u*u+d*d&&(u=m,f=b,d=v)}if(u*u+d*d>r*r+a*a){let p=this.mb;p.set(s),p[0]+=u,p[3]+=u,p[1]+=f,p[4]+=f,p[2]+=d,p[5]+=d;let m=this.clip(p,1,-f+e);r=u,o=f+m,a=d}}this.res[0]=r,this.res[1]=o,this.res[2]=a}sweep(t,e,n,s){let r=this.tb;r.set(t);let o=this.clip(r,1,n);r[1]+=o,r[4]+=o;let a=this.clip(r,0,e);r[0]+=a,r[3]+=a;let l=this.clip(r,2,s);r[2]+=l,r[5]+=l,this.res[0]=a,this.res[1]=o,this.res[2]=l}clip(t,e,n){if(Math.abs(n)<qe)return 0;let s=this.boxes,r=this.nBoxes,o=e===0?1:0,a=e===2?1:2;for(let l=0;l<r;l++){let c=l*6;if(!(s[c+o+3]<=t[o]+qe||s[c+o]>=t[o+3]-qe)&&!(s[c+a+3]<=t[a]+qe||s[c+a]>=t[a+3]-qe))if(n>0){let h=s[c+e]-t[e+3];h>=-qe&&h<n&&(n=h)}else{let h=s[c+e+3]-t[e];h<=qe&&h>n&&(n=h)}}return Math.abs(n)<qe?0:n}free(t,e,n){let s=this.boxes,r=this.nBoxes,o=this.bb,a=o[0]+t,l=o[1]+e,c=o[2]+n,h=o[3]+t,u=o[4]+e,f=o[5]+n;for(let d=0;d<r;d++){let g=d*6;if(s[g]<h-qe&&s[g+3]>a+qe&&s[g+1]<u-qe&&s[g+4]>l+qe&&s[g+2]<f-qe&&s[g+5]>c+qe)return!1}return!0}fits(t){let e=this.w,n=this.setBB(t);this.gather(e,n[0],n[1],n[2],n[3],n[4],n[5]);let s=this.free(0,0,0);return this.setBB(),s}freeAt(t,e,n,s){let r=this.setBB(),o=r[0]+e,a=r[1]+n,l=r[2]+s,c=r[3]+e,h=r[4]+n,u=r[5]+s;if(this.gather(t,o,a,l,c,h,u),!this.free(e,n,s))return!1;for(let f=Math.floor(a);f<=Math.floor(h-qe);f++)for(let d=Math.floor(l);d<=Math.floor(u-qe);d++)for(let g=Math.floor(o);g<=Math.floor(c-qe);g++)if(he[t.get(g,f,d)&Gt])return!1;return!0}pushBox(t,e,n,s,r,o){let a=this.nBoxes*6;if(a+6>this.boxes.length){let c=new Float64Array(this.boxes.length*2);c.set(this.boxes),this.boxes=c}let l=this.boxes;l[a++]=t,l[a++]=e,l[a++]=n,l[a++]=s,l[a++]=r,l[a]=o,this.nBoxes++}gather(t,e,n,s,r,o,a){this.nBoxes=0;let l=Math.floor(e),c=Math.floor(r),h=Math.floor(s),u=Math.floor(a),f=Math.max(-2,Math.floor(n)-1),d=Math.min(256,Math.floor(o));for(let g=h;g<=u;g++)for(let b=l;b<=c;b++){if(!this.loadedAt(b,g)){this.pushBox(b,f,g,b+1,d+1,g+1);continue}for(let p=f;p<=d;p++){let m=t.get(b,p,g),v=m&Gt;if(!xe[v])continue;if(jt[v]===j.cube){this.pushBox(b,p,g,b+1,p+1,g+1);continue}this.qx=b,this.qy=p,this.qz=g;let y=yh(m,this.nb);for(let _=0;_<y.length;_++){let w=y[_];this.pushBox(b+w[0],p+w[1],g+w[2],b+w[3],p+w[4],g+w[5])}}}}loadedAt(t,e){let n=t>>4,s=e>>4;return n===this.lcx&&s===this.lcz?this.lres:(this.lcx=n,this.lcz=s,this.lres=this.w.getChunk(n,s)!==void 0,this.lres)}blockId(t,e,n,s){return t.get(e,n,s)&Gt}blockBelow(t,e){return this.blockId(t,Math.floor(this.x),Math.floor(this.y-e),Math.floor(this.z))}updateFluids(t){let e=this.boxHeight(),n=this.x-lr+.001,s=this.x+lr-.001,r=this.y+.001,o=this.y+e-.001,a=this.z-lr+.001,l=this.z+lr-.001,c=!1,h=!1,u=0,f=0,d=!1,g=Math.max(0,Math.floor(r)),b=Math.min(255,Math.floor(o));for(let w=g;w<=b;w++)for(let S=Math.floor(a);S<=Math.floor(l);S++)for(let A=Math.floor(n);A<=Math.floor(s);A++){let R=t.get(A,w,S),P=R&Gt;if(P===Mk){d=!0;continue}if(!he[P])continue;let x=w+Ly(R,t.get(A,w+1,S));x<r||(P===wk?(h=!0,x-r>f&&(f=x-r)):(c=!0,x-r>u&&(u=x-r)))}this.inWater=c,this.inLava=h,this.waterHeight=u,this.lavaHeight=f,this.stuck=d;let p=this.y+this.eyeH-.11111111,m=Math.floor(this.x),v=Math.floor(this.z),y=Math.floor(p),_=t.get(m,y,v);this.eyeUnder=(_&Gt)===su&&p<y+Ly(_,t.get(m,y+1,v))}updateHead(){let t=this.w;if(!t)return;let e=this.eye(),n=Math.floor(e.x),s=Math.floor(e.y),r=Math.floor(e.z),o=t.get(n,s,r);this.headInWater=(o&Gt)===su&&e.y<s+Sk(o,t.get(n,s+1,r))}};var Ak=[[0,0,0,1,1,1]],Ek=[[0,0,0,1,14/16,1]];function ou(i,t,e,n,s,r,o,a,l=!1){let c=Math.sqrt(s*s+r*r+o*o);if(!(c>0)||!(a>0))return null;s/=c,r/=c,o/=c;let h=Math.floor(t),u=Math.floor(e),f=Math.floor(n),d=s>0?1:s<0?-1:0,g=r>0?1:r<0?-1:0,b=o>0?1:o<0?-1:0,p=d?Math.abs(1/s):1/0,m=g?Math.abs(1/r):1/0,v=b?Math.abs(1/o):1/0,y=d>0?(h+1-t)/s:d<0?(t-h)/-s:1/0,_=g>0?(u+1-e)/r:g<0?(e-u)/-r:1/0,w=b>0?(f+1-n)/o:b<0?(n-f)/-o:1/0,S=s>0?1:0,A=r>0?3:2,R=o>0?5:4,P=Math.abs(s),x=Math.abs(r),T=Math.abs(o),D=P>=x&&P>=T?S:x>=T?A:R,U=0,k=0,B=0,F=(W,J,rt)=>i.get(U+W,k+J,B+rt),I=1/0,N=0,z=0,et=0,nt=0,ot=0,bt=0;for(let W=0;W<1024&&!(bt>a||bt>I);W++){if(u>=0&&u<=255){let J=i.get(h,u,f),rt=J&Gt,tt=null;if(wu[rt]?jt[rt]===j.cube?tt=Ak:(U=h,k=u,B=f,tt=vh(J,F)):l&&he[rt]&&!(J>>10&7)&&(tt=Ek),tt)for(let ft=0;ft<tt.length;ft++){let ht=tt[ft],Wt=-1/0,kt=1/0,H=D,Se=!0;for(let Mt=0;Mt<3&&Se;Mt++){let Lt=Mt===0?t:Mt===1?e:n,se=Mt===0?s:Mt===1?r:o,Vt=Mt===0?h:Mt===1?u:f,Yt=Vt+ht[Mt],Te=Vt+ht[Mt+3];if(se===0){(Lt<Yt||Lt>Te)&&(Se=!1);continue}let L=(Yt-Lt)/se,E=(Te-Lt)/se;if(L>E){let Q=L;L=E,E=Q}L>Wt&&(Wt=L,H=Mt===0?S:Mt===1?A:R),E<kt&&(kt=E),Wt>kt&&(Se=!1)}if(!Se||kt<0)continue;let wt=Wt;wt<0&&(wt=0,H=D),wt<=a&&wt<I&&(I=wt,N=h,z=u,et=f,nt=H,ot=J)}}if(y<_?y<w?(h+=d,bt=y,y+=p):(f+=b,bt=w,w+=v):_<w?(u+=g,bt=_,_+=m):(f+=b,bt=w,w+=v),bt===1/0)break}return I===1/0?null:{x:N,y:z,z:et,face:nt,px:t+s*I,py:e+r*I,pz:n+o*I,dist:I,block:ot}}var Tk=5,Fy=.25,Oy=.2,Wn=2,Ns=3,Ta=1e-7,kk=[[0,0,0,1,1,1]],hu=i=>{let t=new Uint8Array(xt);for(let e of i){let n=yt[e];n!==void 0&&(t[n]=1)}return t},Op=hu(["grass_block","snowy_grass_block","dirt","coarse_dirt","podzol","rooted_dirt","mycelium","moss_block","mud"]),zp=hu(["sand","red_sand"]),jy=new Uint8Array(xt),Ck=hu(["ice","packed_ice"]),Rk=hu(["mycelium","podzol"]),Qy=0,tv=1,ev=2,nv=3,iv=4,sv=5,rv=6,ov=new Uint8Array(xt);Le.forEach((i,t)=>{ov[t]=i.support==="soil"?tv:i.support==="sand"?ev:i.support==="solid"?nv:i.support==="water"?iv:i.support==="cactus"?sv:i.support==="cane"?rv:Qy,(zp[t]||Op[t]||i.name==="terracotta"||i.name.endsWith("_terracotta")&&!i.name.endsWith("glazed_terracotta"))&&(jy[t]=1)});var $y,lu=($y=yt.water)!=null?$y:-1,qy,Pk=(qy=yt.lava)!=null?qy:-1,Xy,Lk=(Xy=yt.ice)!=null?Xy:-1,Yy,Ik=(Yy=yt.cactus)!=null?Yy:-1,Ky,Uk=(Ky=yt.sugar_cane)!=null?Ky:-1,Zy,Hp=(Zy=yt.lily_pad)!=null?Zy:-1,Jy,zy=(Jy=yt.seagrass)!=null?Jy:-1,Dk=(i,t,e,n)=>(s,r,o)=>i.get(t+s,e+r,n+o);function Gp(i,t,e,n,s){let r=s&Gt;return xe[r]?jt[r]===j.cube?kk:yh(s,Dk(i,t,e,n)):[]}function av(i,t,e,n){let s=t>>1,r=(t&1)===0,o=s===0?1:0,a=s===2?1:2;for(let l of i)if(!(r?l[s+3]<1-1e-6:l[s]>1e-6)&&l[o]<=e&&l[o+3]>=e&&l[a]<=n&&l[a+3]>=n)return!0;return!1}var Hy=[.01,.25,.5,.75,.99],Gy=[7/16+.01,9/16-.01];function kl(i,t,e,n,s){if(e<0)return!0;if(e>255)return!1;let r=i.get(t,e,n),o=r&Gt;if(!xe[o])return!1;if(jt[o]===j.cube)return!0;let a=Gp(i,t,e,n,r);for(let l of Hy)for(let c of Hy)if(!av(a,s,l,c))return!1;return!0}function Cl(i,t,e,n,s){if(e<0)return!0;if(e>255)return!1;let r=i.get(t,e,n),o=r&Gt;if(!xe[o])return!1;if(jt[o]===j.cube)return!0;let a=Gp(i,t,e,n,r);for(let l of Gy)for(let c of Gy)if(!av(a,s,l,c))return!1;return!0}function au(i){let t=i&Gt;return xe[t]?jt[t]===j.cube||jt[t]===j.slab&&(i>>10&3)===2:!1}function Nk(i){let t=-Math.sin(i.yaw),e=-Math.cos(i.yaw);return Math.abs(t)>Math.abs(e)?t>0?1:3:e>0?2:0}var Wy=i=>i<=1?1:i<=3?0:2;function Vy(i,t,e,n,s,r){let o=Gp(i,e,n,s,r);if(!o.length)return!1;let a=t.boxHeight(),l=t.x-.3,c=t.x+.3,h=t.y,u=t.y+a,f=t.z-.3,d=t.z+.3;for(let g of o)if(e+g[0]<c-Ta&&e+g[3]>l+Ta&&n+g[1]<u-Ta&&n+g[4]>h+Ta&&s+g[2]<d-Ta&&s+g[5]>f+Ta)return!0;return!1}function lv(i,t,e,n,s){let r=s&Gt;if(!r)return!0;let o=s>>10,a=jt[r];if(a===j.torch){if(o===0)return Cl(i,t,e-1,n,Wn);let u=o-1;return u<0||u>3?!1:kl(i,t-Ke[u],e,n-Ze[u],Vr[u])}if(a===j.lantern)return o&1?Cl(i,t,e+1,n,Ns):Cl(i,t,e-1,n,Wn);if(a===j.door){if(o&8){let f=i.get(t,e-1,n);return(f&Gt)===r&&(f>>10&8)===0}let u=i.get(t,e+1,n);return(u&Gt)===r&&(u>>10&8)!==0&&kl(i,t,e-1,n,Wn)}if(a===j.layer){let u=i.get(t,e-1,n)&Gt;return!Ck[u]&&kl(i,t,e-1,n,Wn)}if(a===j.carpet){let u=i.get(t,e-1,n)&Gt;return u!==0&&!he[u]}let l=ov[r];if(l===Qy)return!0;let c=i.get(t,e-1,n),h=c&Gt;switch(l){case tv:return Op[h]===1;case ev:return jy[h]===1;case nv:return Fs[h]===1||Rk[h]===1;case iv:{let u=i.get(t,e+1,n)&Gt;return(h===lu&&(c>>10&7)===0||h===Lk)&&!he[u]}case sv:{for(let u=0;u<4;u++){let f=i.get(t+Ke[u],e,n+Ze[u])&Gt;if(xe[f]||f===Pk)return!1}return he[i.get(t,e+1,n)&Gt]?!1:h===Ik||zp[h]===1}case rv:{if(h===Uk)return!0;if(!Op[h]&&!zp[h])return!1;for(let u=0;u<4;u++)if((i.get(t+Ke[u],e-1,n+Ze[u])&Gt)===lu)return!0;return!1}}return!0}function Fp(i,t,e,n){let s=i&Gt;if(s===0)return!0;if(jt[s]===j.slab&&s===t){let r=i>>10&3;if(r===2)return!1;if(!n)return!0;let o=e.py-e.y>.5,a=e.face!==Wn&&e.face!==Ns;return r===0?e.face===Wn||o&&a:e.face===Ns||!o&&a}return Ra[s]?s!==t:!1}function Bk(i,t,e,n,s,r,o){let a=r+3&3,l=r+1&3,c=t+Ke[a],h=n+Ze[a],u=t+Ke[l],f=n+Ze[l],d=i.get(c,e,h),g=i.get(c,e+1,h),b=i.get(u,e,f),p=i.get(u,e+1,f),m=(au(d)?-1:0)+(au(g)?-1:0)+(au(b)?1:0)+(au(p)?1:0),v=(d&Gt)===s&&(d>>10&8)===0,y=(b&Gt)===s&&(b>>10&8)===0;if((!v||y)&&m<=0){if((!y||v)&&m>=0){let _=Ke[r],w=Ze[r],S=o.px-t,A=o.pz-n;return!((_>=0||!(A<.5))&&(_<=0||!(A>.5))&&(w>=0||!(S>.5))&&(w<=0||!(S<.5)))}return!1}return!0}function Fk(i,t,e,n){if(!(i>0&&i<xt))return null;let s=jt[i],r=t.face,o=t.block&Gt,a,l,c,h=!1;if(i===Hp&&he[o]){if(a=t.x,l=t.y+1,c=t.z,n.get(a,l,c)!==0)return null}else if(Fp(t.block,i,t,!0))a=t.x,l=t.y,c=t.z,h=!0;else if(a=t.x+H1[r],l=t.y+G1[r],c=t.z+W1[r],l<0||l>255||!Fp(n.get(a,l,c),i,t,!1))return null;if(l<0||l>255)return null;let u=n.get(a,l,c),f=u&Gt;if(he[f]&&(!xe[i]&&!he[i]||i===Hp)||he[i]&&f===i)return null;let d=t.py-l>.5,g=Nk(e),b=0,p;switch(s){case j.slab:f===i&&(u>>10&3)!==2?b=2:b=r!==Ns&&(r===Wn||!d)?0:1;break;case j.stairs:b=g|(r!==Ns&&(r===Wn||!d)?0:4);break;case j.torch:if(r===Ns)return null;if(r!==Wn){let v=el[r];b=kl(n,a-Ke[v],l,c-Ze[v],Vr[v])?v+1:0}break;case j.lantern:{let v=Cl(n,a,l+1,c,Ns),y=Cl(n,a,l-1,c,Wn);if(r===Ns||r!==Wn&&e.pitch>0?b=v?1:y?0:-1:b=y?0:v?1:-1,b<0)return null;break}case j.door:{if(l+1>255||!Fp(n.get(a,l+1,c),i,t,!1)||!kl(n,a,l-1,c,Wn))return null;b=g|(Bk(n,a,l,c,i,g,t)?16:0),p={x:a,y:l+1,z:c,v:Ie(i,b|8)};break}case j.trapdoor:{let v,y;!h&&r!==Wn&&r!==Ns?(v=el[V1[r]],y=d):(v=g,y=r!==Wn),b=v|(y?8:0);break}case j.rod:b=Wy(r);break;default:lo[i]===1?b=Wy(r):lo[i]===2&&(b=g+2&3)}let m=Ie(i,b);return s!==j.door&&!lv(n,a,l,c,m)||xe[i]&&Vy(n,e,a,l,c,m)||p&&Vy(n,e,p.x,p.y,p.z,p.v)?null:p?{x:a,y:l,z:c,v:m,extra:p}:{x:a,y:l,z:c,v:m}}var cu=class{constructor(t,e,n,s){this.breakDelay=0;this.useDelay=0;this.world=t,this.player=e,this.hotbar=n,this.hooks=s}update(t,e,n){if(e.actionPressed("pick")&&n){let s=n.block&Gt;co(s)&&this.hotbar.pick(s)}e.actionPressed("attack")?(this.breakDelay=Fy,n&&this.breakBlock(n.x,n.y,n.z),this.hooks.onSwing()):e.actionDown("attack")?n&&(this.breakDelay-=t,this.breakDelay<=0&&(this.breakDelay=Math.max(0,this.breakDelay+Fy),this.breakBlock(n.x,n.y,n.z),this.hooks.onSwing())):this.breakDelay=0,this.useDelay>0&&(this.useDelay-=t),e.actionPressed("use")?(this.useDelay=Oy,this.use(n)):e.actionDown("use")&&this.useDelay<=0&&(this.useDelay=Math.max(0,this.useDelay+Oy),this.use(n))}breakBlock(t,e,n){let s=this.world,r=s.get(t,e,n),o=r&Gt;if(!(!o||he[o])){if(s.set(t,e,n,o===zy?Ie(lu,0):0),this.hooks.onBreak(t,e,n,r),jt[o]===j.door){let a=r>>10&8?e-1:e+1,l=s.get(t,a,n);(l&Gt)===o&&(s.set(t,a,n,0),this.hooks.onBreak(t,a,n,l),this.settle(t,a,n))}this.settle(t,e,n)}}use(t){let e=this.player,n=this.world,s=this.hotbar.current();if(t){let a=t.block,l=a&Gt,c=jt[l];if((c===j.door||c===j.trapdoor)&&(!e.sneaking||!s)){this.toggle(t.x,t.y,t.z,a);return}}if(!s)return;let r=t;if(s===Hp){let a=e.eye(),l=e.look(),c=ou(n,a.x,a.y,a.z,l[0],l[1],l[2],Tk,!0);c&&he[c.block&Gt]&&(r=c)}if(!r)return;let o=Fk(s,r,e,n);o&&(n.set(o.x,o.y,o.z,o.v),o.extra&&n.set(o.extra.x,o.extra.y,o.extra.z,o.extra.v),this.hooks.onPlace(o.x,o.y,o.z,o.v),this.hooks.onSwing(),this.settle(o.x,o.y,o.z),o.extra&&this.settle(o.extra.x,o.extra.y,o.extra.z))}toggle(t,e,n,s){let r=this.world,o=s&Gt,a=s>>10,l=(a&4)===0,c=Ie(o,a&-5|(l?4:0));if(r.set(t,e,n,c),jt[o]===j.door){let h=a&8?e-1:e+1,u=r.get(t,h,n);(u&Gt)===o&&r.set(t,h,n,Ie(o,u>>10&-5|(l?4:0)))}this.hooks.onUse(t,e,n,c),this.hooks.onSwing()}settle(t,e,n){let s=this.world,r=[t,e,n],o=512;for(;r.length&&o>0;){let a=r.pop(),l=r.pop(),c=r.pop();for(let h=0;h<10;h++){let u=c,f=l,d=a;if(h<4?(u+=Ke[h],d+=Ze[h]):h===4?f++:h===5?f--:(u+=Ke[h-6],d+=Ze[h-6],f++),f<0||f>255)continue;let g=s.get(u,f,d),b=g&Gt;if(!(!b||he[b])&&!lv(s,u,f,d,g)&&(s.set(u,f,d,b===zy?Ie(lu,0):0),this.hooks.onBreak(u,f,d,g),r.push(u,f,d),--o<=0))break}}}};var uu=Le.map(i=>{var t;return(t=i.sound)!=null?t:"stone"}),Ok={sunrise:.02,noon:.25,sunset:.48,midnight:.75},zk=["north","east","south","west"],Hk=["Towards negative Z","Towards positive X","Towards positive Z","Towards negative X"],cv=5,hv=1,du=class{constructor(t){this.state="menu";this.menus=null;this.world=null;this.chunks=null;this.meta=null;this.player=new El;this.interaction=null;this.dayTime=.05;this.timeMode="cycle";this.time=0;this.last=0;this.hit=null;this.hudHidden=!1;this.autosaveAt=0;this.sessionAt=0;this.stepDist=0;this.wasInWater=!1;this.fps={frames:0,acc:0,value:0,min:999,max:0,frameMs:0};this.debugAcc=1;this.lastFrameAt=0;this.loadingToken=0;this.d=t,t.hotbar.onChange(()=>this.onHotbarChange()),t.input.onLockChange=e=>this.onLockChange(e),t.input.onKey=(e,n)=>this.onKey(e,n),t.inventory.onClose=()=>{this.state==="playing"&&(this.d.input.enabled=!0,this.lockOrPause())}}get settings(){return this.d.settings}get touchMode(){return this.d.settings.controls==="touch"&&!!this.d.touch}setTouchActive(t){this.d.touch&&(this.d.touch.setEnabled(t&&this.touchMode),this.d.input.virtualLock=t&&this.touchMode)}openInventory(){this.state!=="playing"||this.d.inventory.isOpen||(this.d.input.enabled=!1,this.d.inventory.open(),this.d.input.exitLock(),this.setTouchActive(!1))}async startWorld(t){var f,d,g,b;let e=++this.loadingToken;this.state="loading";let n=this.menus;n.showLoading("Preparing world",0),this.settings.fullscreen&&this.enterFullscreen(),this.d.sounds.unlock();let s=await fn.savedChunkKeys(t.id).catch(()=>new Set);if(e!==this.loadingToken)return;let r=Le.map(p=>p.name),o=t.palette.length===r.length&&t.palette.every((p,m)=>p===r[m]),a=new Hh(t.seed);this.world=a,this.meta=t,this.chunks=new tu(a,this.d.renderer,{worldId:t.id,seed:t.seed,savedKeys:s,remapPalette:o?null:t.palette,meshOptions:{fancyLeaves:this.settings.fancyLeaves,smoothLighting:this.settings.smoothLighting},renderDistance:this.settings.renderDistance}),this.timeMode=(f=t.timeMode)!=null?f:"cycle",this.dayTime=(d=t.dayTime)!=null?d:.05,t.hotbarNames&&t.hotbarNames.length===9?this.d.hotbar.load(t.hotbarNames.map(p=>p&&yt[p]&&co(yt[p])?yt[p]:0),(g=t.selected)!=null?g:0):t.hotbar&&t.hotbar.length===9&&o&&this.d.hotbar.load(t.hotbar,(b=t.selected)!=null?b:0);let l=new El;this.player=l;let c=!1;if(t.player)l.restore(t.player);else{let p=this.chunks.generator().findSpawn();l.restore({x:p.x+.5,y:Math.max(63,this.chunks.generator().heightAt(p.x,p.z)+1),z:p.z+.5,yaw:0,pitch:0,flying:!1}),c=!0}this.interaction=new cu(a,l,this.d.hotbar,{onBreak:(p,m,v,y)=>{this.d.renderer.breakParticles(p,m,v,y),this.d.sounds.play("break",uu[En(y)])},onPlace:(p,m,v,y)=>this.d.sounds.play("place",uu[En(y)]),onSwing:()=>this.d.renderer.swing(),onUse:(p,m,v,y)=>this.d.sounds.play("use",uu[En(y)])});let h=Math.min(2,this.settings.renderDistance),u=performance.now();if(await new Promise(p=>{let m=()=>{if(e!==this.loadingToken||!this.chunks){p();return}this.chunks.update(l.x,l.z,30);let v=this.chunks.progress(l.x,l.z,h);n.showLoading(v<.5?"Generating terrain":"Building terrain",v),this.chunks.areaReady(l.x,l.z,h)||performance.now()-u>45e3?p():requestAnimationFrame(m)};requestAnimationFrame(m)}),!(e!==this.loadingToken||!this.chunks)){if(c){let p=this.safeGroundY(Math.floor(l.x),Math.floor(l.z));l.y=p}t.lastPlayed=Date.now(),this.saveMeta(),this.time=0,this.autosaveAt=performance.now()+cv*1e3,this.sessionAt=performance.now()+hv*1e3,this.onHotbarChange(),this.d.hud.setVisible(!0),this.hudHidden=!1,this.state="playing",n.hide(),this.d.input.enabled=!0,this.d.renderer.applySettings(this.settings),await this.lockOrPause()}}safeGroundY(t,e){let n=this.world;for(let s=250;s>1;s--){let r=En(n.get(t,s,e));if(!(!r||!xe[r]||ei[r]||he[r])&&!xe[En(n.get(t,s+1,e))]&&!xe[En(n.get(t,s+2,e))])return s+1}return Math.max(63,n.topY(t,e)+1)}updateMeta(){let t=this.meta;return t?(t.player=this.player.serialize(),t.hotbar=this.d.hotbar.slots.slice(),t.hotbarNames=this.d.hotbar.slots.map(e=>e?Le[e].name:""),t.selected=this.d.hotbar.selected,t.dayTime=this.dayTime,t.timeMode=this.timeMode,t):null}saveSession(){if(this.state!=="playing"&&this.state!=="paused")return;let t=this.updateMeta();t&&fn.saveSession(t)}flushOnExit(){if(!this.meta||!this.chunks||this.state!=="playing"&&this.state!=="paused")return Promise.resolve();this.saveSession();let t=this.chunks.flushOnExit();return Promise.all([t,this.saveMeta()]).then(()=>{},e=>console.warn("[game] save on exit failed",e))}async saveMeta(){let t=this.meta;if(t){t.player=this.player.serialize(),t.hotbar=this.d.hotbar.slots.slice(),t.hotbarNames=this.d.hotbar.slots.map(e=>e?Le[e].name:""),t.selected=this.d.hotbar.selected,t.dayTime=this.dayTime,t.timeMode=this.timeMode,t.palette=Le.map(e=>e.name),t.lastPlayed=Date.now();try{await fn.saveWorld(t)}catch(e){console.warn("[game] could not save world",e)}}}async saveAll(){this.chunks&&await Promise.all([this.chunks.saveAll(),this.saveMeta()])}async saveAndQuit(){var t,e,n;this.loadingToken++,(t=this.menus)==null||t.showLoading("Saving world",1);try{await this.saveAll()}catch(s){console.warn(s)}(e=this.chunks)==null||e.dispose(),this.chunks=null,this.world=null,this.meta=null,this.interaction=null,this.hit=null,this.d.renderer.setHighlight(null,0,0,0),this.d.renderer.clear(),this.state="menu",this.d.input.enabled=!1,this.setTouchActive(!1),this.d.input.exitLock(),this.d.hud.setVisible(!1),this.d.hud.setUnderwaterTint(!1),document.fullscreenElement&&document.exitFullscreen().catch(()=>{}),(n=this.menus)==null||n.showTitle()}pause(){var t;this.state==="playing"&&(this.state="paused",this.d.input.enabled=!1,this.d.input.exitLock(),this.setTouchActive(!1),this.d.inventory.isOpen&&this.d.inventory.close(),(t=this.menus)==null||t.showPause(),this.saveSession(),this.saveAll())}resume(){var t;this.state==="paused"&&((t=this.menus)==null||t.hide(),this.state="playing",this.d.input.enabled=!0,this.lockOrPause())}async lockOrPause(){var e;if(this.touchMode){this.setTouchActive(!0);return}if(this.d.input.locked)return;!await this.d.input.requestLock()&&this.state==="playing"&&!this.d.inventory.isOpen&&(this.state="paused",this.d.input.enabled=!1,(e=this.menus)==null||e.showPause())}enterFullscreen(){let t=document.documentElement;document.fullscreenElement||!t.requestFullscreen||t.requestFullscreen().then(()=>{var n;let e=navigator.keyboard;(n=e==null?void 0:e.lock)==null||n.call(e).catch(()=>{})}).catch(()=>{})}setTimeMode(t){this.timeMode=t,t!=="cycle"&&(this.dayTime=Ok[t])}applySettings(t){var e;if(this.d.renderer.applySettings(t),this.d.sounds.setVolume(t.volume),(e=this.d.touch)==null||e.applySettings(t),this.chunks){this.chunks.setRenderDistance(t.renderDistance);let n={fancyLeaves:t.fancyLeaves,smoothLighting:t.smoothLighting},s=this.chunks.meshOptions;(s.fancyLeaves!==n.fancyLeaves||s.smoothLighting!==n.smoothLighting)&&this.chunks.setMeshOptions(n)}}onLockChange(t){var e;!t&&this.state==="playing"&&!this.d.inventory.isOpen&&!((e=this.menus)!=null&&e.isOpen())&&this.pause()}onKey(t,e){var r;let n=this.d.inventory;if(n.isOpen){if(n.handleKey(t)){e.preventDefault();return}return}if((r=this.menus)!=null&&r.isOpen()){t==="Escape"&&(this.menus.back(),e.preventDefault());return}if(this.state!=="playing")return;if(t==="Escape"){this.d.input.locked||this.pause();return}if(os("inventory",t)){this.openInventory(),e.preventDefault();return}if(os("hideHud",t)){this.hudHidden=!this.hudHidden,this.d.hud.setVisible(!this.hudHidden),e.preventDefault();return}if(os("screenshot",t)){this.screenshot(),e.preventDefault();return}if(os("debug",t)){this.d.hud.setDebugVisible(!this.d.hud.debugVisible),this.debugAcc=1,e.preventDefault();return}let s=nc.findIndex(o=>os(o,t));s>=0?this.d.hotbar.select(s):/^Numpad[1-9]$/.test(t)&&this.d.hotbar.select(Number(t.slice(6))-1)}onHotbarChange(){let t=this.d.hotbar.current();this.d.renderer.setHeldBlock(t),this.d.hud.showItemName(t?Su(t):"")}async screenshot(){try{let t=await this.d.renderer.screenshot(),e=new Date,n=a=>String(a).padStart(2,"0"),s=`blockforge_${e.getFullYear()}-${n(e.getMonth()+1)}-${n(e.getDate())}_${n(e.getHours())}.${n(e.getMinutes())}.${n(e.getSeconds())}.png`,r=URL.createObjectURL(t),o=document.createElement("a");o.href=r,o.download=s,document.body.appendChild(o),o.click(),o.remove(),setTimeout(()=>URL.revokeObjectURL(r),5e3),this.d.hud.message(`Saved screenshot as ${s}`)}catch(t){this.d.hud.message("Could not take a screenshot"),console.warn(t)}}frame(t){var l,c;let e=this.settings.maxFps;if(e>0&&t-this.lastFrameAt<1e3/e-1)return;let n=Math.min(.1,this.last?(t-this.last)/1e3:.016);this.last=t,this.lastFrameAt=t,this.countFps(n);let s=this.world,r=this.chunks;if(!s||!r||this.state==="menu"||this.state==="loading"){this.d.input.endFrame();return}let o=this.player,a=this.d.input;if(this.state==="playing"){this.time+=n,this.timeMode==="cycle"&&(this.dayTime=(this.dayTime+n/$1)%1),(l=this.d.touch)==null||l.update(n),a.enabled&&a.wheel&&this.d.hotbar.scroll(Math.sign(a.wheel));let h={x:o.x,z:o.z};o.update(n,a,s,this.settings),s.tick(n),this.footsteps(h.x,h.z);let u=o.eye(),f=o.look();this.hit=ou(s,u.x,u.y,u.z,f[0],f[1],f[2],5),a.enabled&&a.locked&&((c=this.interaction)==null||c.update(n,a,this.hit)),this.updateHighlight(),t>=this.autosaveAt&&(this.autosaveAt=t+cv*1e3,this.saveAll()),t>=this.sessionAt&&(this.sessionAt=t+hv*1e3,this.saveSession())}r.update(o.x,o.z,this.state==="playing"?6:10),this.d.hud.update(n),this.render(n),this.updateDebug(n),a.endFrame()}footsteps(t,e){let n=this.player,s=this.world;if(n.inWater!==this.wasInWater&&(n.inWater&&this.d.sounds.play("splash","liquid"),this.wasInWater=n.inWater),!n.onGround||n.flying){this.stepDist=0;return}if(this.stepDist+=Math.hypot(n.x-t,n.z-e),this.stepDist>1.7){this.stepDist=0;let r=En(s.get(Math.floor(n.x),Math.floor(n.y-.2),Math.floor(n.z)));r&&this.d.sounds.play("step",uu[r])}}updateHighlight(){let t=this.hit,e=this.world;if(!t||this.hudHidden){this.d.renderer.setHighlight(null,0,0,0);return}let n=(s,r,o)=>e.get(t.x+s,t.y+r,t.z+o);this.d.renderer.setHighlight(vh(t.block,n),t.x,t.y,t.z)}render(t){let e=this.player,n=this.world,s=e.eye(),r=Math.floor(s.x),o=Math.floor(s.y),a=Math.floor(s.z),l=n.getLight(r,o,a),c=this.settings.viewBobbing?e.bob():{phase:0,amount:0};this.d.hud.setUnderwaterTint(e.headInWater),this.d.renderer.render({dt:t,time:this.time,dayTime:this.dayTime,eye:s,yaw:e.yaw,pitch:e.pitch,fov:this.settings.fov*e.fovScale(),underwater:e.headInWater,inLava:e.inLava&&En(n.get(r,o,a))===yt.lava,handLight:{sky:l>>4,block:l&15},bob:c,showHand:!this.hudHidden})}countFps(t){let e=this.fps;e.frames++,e.acc+=t,e.frameMs=t*1e3,t>0&&(e.min=Math.min(e.min,1/t),e.max=Math.max(e.max,1/t)),e.acc>=1&&(e.value=Math.round(e.frames/e.acc),e.frames=0,e.acc=0,this.settings.showFps&&!this.d.hud.debugVisible&&this.state!=="menu"?this.d.hud.setFps(`${e.value} fps`):this.d.hud.setFps(null),e.min=999,e.max=0)}updateDebug(t){var w,S,A;if(!this.d.hud.debugVisible||!this.world||!this.chunks||(this.debugAcc+=t,this.debugAcc<.25))return;this.debugAcc=0;let e=this.player,n=this.world,s=this.d.renderer,r=Math.floor(e.x),o=Math.floor(e.y),a=Math.floor(e.z),l=Math.floor(r/16),c=Math.floor(a/16),h=n.getChunk(l,c),u=h?(w=vy[h.biome[tl(r&15,a&15)]])!=null?w:"?":"loading",f=(-e.yaw*180/Math.PI%360+360)%360,d=Math.round(f/90)%4,g=n.getLight(r,Math.floor(e.y+.1),a),b=s.stats(),p=this.chunks.stats,m=this.fps,v=[`BlockForge 1.0 (${"2026-10-08T12:19:43.715Z".slice(0,10)})`,`${m.value} fps (${m.frameMs.toFixed(1)} ms)`,`Draw calls: ${b.drawCalls}  Triangles: ${b.triangles.toLocaleString()}`,`Sections: ${b.visibleSections} / ${b.sections} visible`,`Chunks: ${p.loaded} loaded, gen queue ${p.genQueue}, mesh queue ${p.meshQueue}`,"",`XYZ: ${e.x.toFixed(3)} / ${e.y.toFixed(3)} / ${e.z.toFixed(3)}`,`Block: ${r} ${o} ${a}`,`Chunk: ${r&15} ${o&15} ${a&15} in ${l} ${o>>4} ${c}`,`Facing: ${zk[d]} (${Hk[d]}) (${f.toFixed(1)} / ${(e.pitch*-180/Math.PI).toFixed(1)})`,`Biome: ${u}`,`Light: ${g>>4} sky, ${g&15} block`,`Time: ${this.clock()} (${this.timeMode})`,`Mode: creative${e.flying?", flying":""}${e.sprinting?", sprinting":""}${e.sneaking?", sneaking":""}`];if(this.hit){let R=this.hit;v.push("",`Looking at: ${R.x} ${R.y} ${R.z}`,`${Su(En(R.block))} [${Le[En(R.block)].name}] meta ${_m(R.block)}`)}let y=performance.memory,_=[`Renderer: ${s.info.webgl2?"WebGL 2":"WebGL 1"}`,`GPU: ${s.info.renderer}`,`Vendor: ${s.info.vendor}`,`Display: ${innerWidth}x${innerHeight} @ ${(window.devicePixelRatio||1).toFixed(2)}x`,y?`Memory: ${Math.round(y.usedJSHeapSize/1048576)} / ${Math.round(y.jsHeapSizeLimit/1048576)} MB`:"Memory: n/a",`CPU threads: ${navigator.hardwareConcurrency||"?"}`,"",`Preset: ${this.settings.preset}, render distance ${this.settings.renderDistance}`,`Shadows: ${this.settings.shadows?"on":"off"}, leaves: ${this.settings.fancyLeaves?"fancy":"fast"}`,`Seed: ${(A=(S=this.meta)==null?void 0:S.seed)!=null?A:""}`,`Blocks in registry: ${xt-1}`,`Gen ${this.chunks.stats.genMs.toFixed(1)} ms, light ${this.chunks.stats.lightMs.toFixed(1)} ms, mesh ${this.chunks.stats.meshMs.toFixed(1)} ms`];this.d.hud.setDebug(v,_)}clock(){let t=Math.floor((this.dayTime*24+6)%24*60);return`${String(Math.floor(t/60)).padStart(2,"0")}:${String(t%60).padStart(2,"0")}`}};var Gk="1.0.0",uv=()=>new Promise(i=>requestAnimationFrame(()=>i())),Wp=i=>new Promise(t=>setTimeout(t,i));function dv(i){let t=document.getElementById("boot");t&&(t.textContent=i)}function fv(i,t){var o;let e=(o=document.getElementById("boot"))!=null?o:document.body.appendChild(document.createElement("div"));e.id="boot",e.innerHTML="";let n=document.createElement("div");n.style.cssText="max-width:640px;padding:24px;line-height:1.5;text-align:center";let s=document.createElement("div");s.style.cssText="font-size:24px;margin-bottom:12px",s.textContent=i;let r=document.createElement("div");r.style.cssText="font-size:16px;opacity:.85;white-space:pre-line",r.textContent=t,n.append(s,r),e.appendChild(n)}function Wk(i){let t=i.trim();if(!t){let n=new Uint32Array(1);try{crypto.getRandomValues(n)}catch{n[0]=Math.random()*2**32>>>0}return n[0]|0}if(/^-?\d+$/.test(t)){let n=Number(t);if(Number.isSafeInteger(n))return n|0}let e=0;for(let n=0;n<t.length;n++)e=Math.imul(31,e)+t.charCodeAt(n)|0;return e}function Vk(){let i=new Uint32Array(2);try{crypto.getRandomValues(i)}catch{i[0]=Date.now(),i[1]=Math.random()*1e9|0}return"w"+i[0].toString(36)+i[1].toString(36)}async function $k(){var R;let i=Jp();nd(i),Hu(i.resourcePack)||(i.resourcePack="default"),go(i.guiScale),Xu(i.resourcePack),dv("Painting textures\u2026"),await uv();let t=t0().catch(()=>{}),e=()=>M0().catch(P=>(console.warn("[packs] could not read the imported pack",P),"error")),n=i.resourcePack==="custom",s=e(),r=n?await Promise.race([s,Wp(6e3).then(()=>"late")]):"late";r&&r!=="late"&&r!=="error"?mo(r):r===null&&(i.resourcePack="default");let o=n&&(r==="late"||r==="error"),a=L1(i.mipmaps,o?"default":i.resourcePack);dv("Carving block icons\u2026"),await uv();let l=p0(a);await Promise.race([t,Wp(1500)]);let c=document.createElement("canvas");c.id="game",c.tabIndex=0,document.body.prepend(c);let h;try{h=new Rh(c,a,i)}catch(P){console.error(P),fv("BlockForge could not start 3D graphics",`Your browser did not give the page a WebGL context.

Try: Chrome or Edge settings > System > turn on "Use graphics acceleration when available", then restart the browser. On a managed school device, WebGL may be blocked by policy.`);return}let u=document.createElement("div");u.id="ui",document.body.appendChild(u);let f=new Ih,d=new Ph(c);d.enabled=!1;let g=new uc(u,l,f);g.setVisible(!1);let b=new dc(u,l,f),p=new Lh;p.setVolume(i.volume);let m=null,v=new fc(u,d,f,i,{openInventory:()=>m==null?void 0:m.openInventory(),pause:()=>m==null?void 0:m.pause(),isFlying:()=>!!(m!=null&&m.player.flying),toggleFly:()=>m==null?void 0:m.player.toggleFlight()}),y=new du({renderer:h,input:d,hud:g,inventory:b,hotbar:f,sounds:p,settings:i,touch:v});m=y;let _={listWorlds:()=>fn.listWorlds(),async createWorld(P,x){p.unlock();let T={id:Vk(),name:P.trim()||"New World",seed:Wk(x),created:Date.now(),lastPlayed:Date.now(),player:null,hotbar:pl.slice(),hotbarNames:pl.map(D=>D?Le[D].name:""),selected:0,dayTime:.05,timeMode:"cycle",palette:Le.map(D=>D.name),version:1};f.load(pl,0),await fn.saveWorld(T),await y.startWorld(T)},async playWorld(P){p.unlock();let x=await fn.getWorld(P);if(!x){S.showWorlds();return}await y.startWorld(x)},deleteWorld:P=>fn.deleteWorld(P),resume:()=>y.resume(),saveAndQuit:()=>y.saveAndQuit(),settingsChanged(P){Hu(P.resourcePack)||(P.resourcePack="default"),bi(P),go(P.guiScale),a.pack!==P.resourcePack&&w(P.resourcePack),y.applySettings(P)},getTimeMode:()=>y.timeMode,setTimeMode:P=>y.setTimeMode(P),offlineDownloadUrl:/^https?:$/.test(location.protocol)?"download":null,version:Gk,reapplyResourcePack:()=>w(i.resourcePack)};function w(P){let x=performance.now();try{I1(a,P),m0(l,a),Xu(P)}catch(T){console.warn("[packs] could not apply resource pack",P,T)}console.info(`[packs] ${P} applied in ${Math.round(performance.now()-x)} ms`)}let S=new hc(u,_,i);y.menus=S,(r==="late"||r==="error")&&(async()=>{let P=r==="error"?"error":await s;P==="error"&&(await Wp(3e3),P=await e()),P&&P!=="error"?(is()||mo(P),i.resourcePack==="custom"&&a.pack!=="custom"&&w("custom")):P===null&&i.resourcePack==="custom"&&!is()&&(i.resourcePack="default",_.settingsChanged(i))})(),c.addEventListener("mousedown",()=>{y.state==="playing"&&!d.locked&&!b.isOpen&&!S.isOpen()&&d.requestLock()}),window.addEventListener("resize",()=>h.resize()),window.addEventListener("beforeunload",P=>{(y.state==="playing"||y.state==="paused")&&(y.flushOnExit(),P.preventDefault(),P.returnValue="")}),window.addEventListener("pagehide",()=>{y.flushOnExit()}),document.addEventListener("freeze",()=>{y.flushOnExit()}),document.addEventListener("visibilitychange",()=>{document.hidden&&(y.state==="playing"||y.state==="paused")&&(y.flushOnExit(),y.state==="playing"&&y.pause())}),window.addEventListener("pointerdown",()=>p.unlock(),{once:!0}),(R=document.getElementById("boot"))==null||R.remove(),S.showTitle();let A=P=>{requestAnimationFrame(A);try{y.frame(P)}catch(x){console.error("[frame]",x)}};requestAnimationFrame(A),window.blockforge={game:y,renderer:h,settings:i,storage:fn,handlers:_,hud:g,inventory:b,menus:S,hotbar:f,touch:v,input:d,ID:yt,BLOCKS:Le,atlas:a,icons:l,applyPreset(P){Ll(i,P),_.settingsChanged(i)},debug:{play(){S.hide(),y.state="playing",d.enabled=!0}}}}$k().catch(i=>{console.error(i),fv("BlockForge failed to start",String(i&&i.message||i))});})();
/*! Bundled license information:

three/build/three.module.js:
  (**
   * @license
   * Copyright 2010-2023 Three.js Authors
   * SPDX-License-Identifier: MIT
   *)
*/
