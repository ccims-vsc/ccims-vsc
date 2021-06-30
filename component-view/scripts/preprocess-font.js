
const Font = require("fonteditor-core").Font;
const fs = require("fs");

let buffer = fs.readFileSync("node_modules/vscode-codicons/dist/codicon.ttf");

let font = Font.create(buffer, {
  type: "ttf",
  subset: [
	  0xea7b, // file
	  0xeb0c, // issues
	  0xea61, // lightbulb
	  0xeaaf, // bug
	  0xeba4, // pass
	  0xea6a, // star
	  0xeb59, // star-full
	],
  hinting: true,
  inflate: null,
  combinePath: false,
});


let write_buffer = font.write({
  type: "ttf",
  hinting: true,
  deflate: null,
  support: {head: {}, hhea: {}}
});
if (!fs.existsSync("src/fonts")) {
	fs.mkdirSync("src/fonts", { recursive: true })
}

fs.writeFileSync("src/fonts/codicon.ttf", write_buffer);