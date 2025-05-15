import { registerSlashCommand } from "../../../slash-commands.js";

function runJavaScript(javascript) {
    Function(javascript)(); // <--- THIS is the key line
}

registerSlashCommand('runjs', (_, value) => runJavaScript(value), [], '<span class="monospace">(javascript)</span> – actually run JavaScript and return the result, e.g. <tt>/runjs alert("Hello, World!");</tt>', true, true);