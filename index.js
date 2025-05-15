import { registerSlashCommand } from "../../../slash-commands.js";

async function asyncJsCallback(code) {
    try {
        const fn = new Function(`return (async () => { ${code} })()`);
        return await fn();
    } catch (err) {
        return `Error: ${err.message}`;
    }
}

registerSlashCommand(
    'js',
    (_, code) => asyncJsCallback(code),
    [],
    '<span class="monospace">(javascript)</span> – run JavaScript and return the result, e.g. <tt>/js await fetch("https://example.com");</tt>',
    true,
    true
);
