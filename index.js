import { registerSlashCommand } from "../../../slash-commands.js";

async function jsCallback(value) {
    try {
const asyncFunc = new Function(`"use strict"; return (async () => { ${value} })();`);

        return await asyncFunc();
    } catch (err) {
        return `Error: ${err.message}`;
    }
}

registerSlashCommand(
    'js',
    (_, value) => jsCallback(value),
    [],
    '<span class="monospace">(javascript)</span> – run async JavaScript and return the result, e.g. <tt>/js await fetch("...")</tt>',
    true,
    true
);
