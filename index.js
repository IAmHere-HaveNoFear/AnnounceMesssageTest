// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025 [Your Name Here]

// This is the backend (Node.js) part of your extension.
// It handles registering the slash command and communicating with the frontend.

// Import necessary modules from SillyTavern's backend
import { registerSlashCommand } from "../../slash-commands.js";
import { renderExtensionTemplateAsync } from "../../../extensions.js";
import { power_user } from "../../../power-user.js";
import { promptManager } from "../../../openai.js";
import { executeSlashCommandsWithOptions } from "../../../slash-commands.js";
import { eventSource, event_types, streamingProcessor, saveSettingsDebounced } from "../../../../script.js";
import { Handlebars, hljs } from "../../../../lib.js";
import { NAME } from "./common.js";
import { loadSettings } from "./settings.js";

// --- Hypothetical Function to Communicate with Frontend ---
// SillyTavern extensions need a way for the backend (Node.js)
// to trigger code execution in the frontend (browser JS).
// The exact API for this might vary or be undocumented.
// We'll use a placeholder function name here, 'callFrontendExtensionFunction'.
// This function would ideally send data (like your JS string) to the frontend
// and potentially wait for a result or confirmation of completion.

/**
 * Placeholder function to send a JavaScript string to the frontend
 * for execution and await its completion.
 * @param {string} jsCodeString The JavaScript code to execute in the frontend.
 * @returns {Promise<any>} A Promise that resolves with the result of the JS execution,
 *                           or signals completion for async code.
 */
async function sendJsCodeToFrontendAndAwait(jsCodeString) {
    console.log("[RunJS Extension] Sending JS code to frontend for execution...");

    // --- IMPLEMENTATION NEEDED ---
    // This is the core of your extension's backend logic.
    // You need to find the correct SillyTavern API call here
    // to trigger a function in your *frontend* extension code
    // (which you'll put in a separate file like 'public/frontend.js').
    // This API call should pass the jsCodeString and wait for the frontend
    // to signal that the execution is complete (especially for async code).

    // Possible patterns (need to verify with ST source/docs/community):
    // 1. A direct call to a registered frontend function ID.
    // 2. Sending a message via a backend-to-frontend communication channel.
    // 3. Using a helper function provided by the extensions API.

    // Example (highly speculative API name):
    // const result = await callFrontendExtensionFunction('RunJSFrontendExecutor', jsCodeString);
    // return result;

    // For now, as a placeholder, we'll just log and assume success after a delay
    // You MUST replace this with actual frontend communication logic.
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate async work

    console.log("[RunJS Extension] Frontend execution signal received (simulated).");
    // The actual result will likely be passed back via the frontend
    // setting ST variables using getContext(), not returned directly here.
    // So this backend function might just signal completion.
    return ""; // Or whatever makes sense for the pipe after the JS executes
    // --- END IMPLEMENTATION NEEDED ---
}


// --- Slash Command Callback Function ---
// This function runs in the Node.js backend when '/runjs' is typed in STscript.
// It takes the arguments provided to the command.
// The 'value' argument here will contain the full string of JavaScript code.
const runJsSlashCommandCallback = async (_, value) => {
    if (typeof value !== 'string' || value.trim().length === 0) {
        console.warn("[RunJS Extension] /runjs command called with no JavaScript code provided.");
        // You might want to send a system message to the user here
        // SillyTavern.getContext().sendSystemMessage('error', '/runjs requires JavaScript code.'); // Requires getContext in backend, less likely
        return "Error: No JavaScript code provided."; // Return error message to pipe
    }

    try {
        // Send the JS code string to the frontend for execution and await completion
        const result = await sendJsCodeToFrontendAndAwait(value);

        // Return the result to the STscript pipe.
        // NOTE: If the JS execution in the frontend primarily uses
        // getContext().variables.local.set() to return data,
        // this function might just return a success message or an empty string
        // after the async JS has finished running in the frontend.
        // The actual data would be in the ST variables.
        return result;

    } catch (error) {
        console.error("[RunJS Extension] Error executing /runjs command:", error);
        // Return an error message to the STscript pipe
        return `Error executing JavaScript: ${error.message}`;
    }
};


// --- Register the Slash Command ---
// This makes the '/runjs' command available in SillyTavern.
// 'runjs': The name of the command.
// runJsSlashCommandCallback: The function to call when the command is used.
// []: Array of argument definitions (empty array means it takes the rest of the line as one argument).
// '...': Help text displayed in ST's command list.
// true: isGated (requires power user or similar permissions, good for eval-like commands).
// false: isDebug (not a debug command).
registerSlashCommand(
    'runjs',
    runJsSlashCommandCallback,
    [], // Takes the rest of the line as the 'value' argument
    '<span class="monospace">(javascript code)</span> – Executes arbitrary JavaScript code in the browser frontend. Use with caution!',
    true, // isGated - only for trusted users
    false // isDebug
);

console.log("[RunJS Extension] '/runjs' command registered.");

// --- Frontend Registration (Conceptual) ---
// You will also need a separate file (e.g., public/frontend.js)
// in your extension's directory. This file will run in the browser
// and needs to:
// 1. Receive the JS code string sent from the backend (using whatever API
//    'callFrontendExtensionFunction' above uses).
// 2. Execute the received JS string using `Function(jsCodeString)();`.
// 3. Handle the asynchronous nature of the executed JS code (e.g.,
//    if the code returns a Promise, await it).
// 4. Signal back to the backend (or complete the awaited Promise)
//    when the JS execution is finished.
// 5. This frontend code is where you'll write your actual game logic
//    that interacts with IndexedDB and getContext().

// You might need to register a function in the frontend that the backend can call.
// Example (speculative API):
// registerFrontendFunction('RunJSFrontendExecutor', async (jsCodeString) => {
//    // Your JS execution logic here using Function() and await
//    // Handle passing results back if needed
// });
// This part goes in your *frontend* JS file, not index.js.