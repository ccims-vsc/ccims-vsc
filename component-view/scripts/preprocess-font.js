
const Font = require("fonteditor-core").Font;
const fs = require("fs");

let buffer = fs.readFileSync("node_modules/vscode-codicons/dist/codicon.ttf");

let font = Font.create(buffer, {
  type: "ttf",
  subset: [
	  0xea73, // edit
	  0xeb4b, // save
	  0xeaa60, // plus
	  0xeb9d, // output
	  0xea76, // close
	  0xea81, // trash
	  0xea71, // circle-filled
	  0xea7d, // reply
	  0xeb99, // account
	  0xea7b, // file
	  0xeb14, // link-external
	  0xeab6, // chevron-right
	  0xeab4, // chevron-down
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