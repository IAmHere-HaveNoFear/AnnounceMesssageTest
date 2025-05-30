import { registerSlashCommand } from "../../../slash-commands.js";

async function jsCallback(value) {
    try {
        const asyncFunc = new Function(`
            return (async () => {
                ${value}
            })();
        `);
        return await asyncFunc();
    } catch (err) {
        return `Error: ${err.message}`;
    }
}

registerSlashCommand(
    'runjs',
    (_, value) => jsCallback(value),
    [],
    '<span class="monospace">(javascript)</span> – run async JavaScript and return the result, e.g. <tt>/runjs await fetch("...")</tt>',
    true,
    true
);

// index.js (within your custom extension)

// ... (other imports and functions like jsCallback, registerSlashCommand) ...
// index.js (within your custom extension)

// Access the globally loaded Dex object
const dex = window.pkmn ? window.pkmn.dex : null;

// You might also need data if using Generations API
// const data = window.pkmn ? window.pkmn.data : null;
// const gens = data ? new data.Generations(dex) : null;


// Check if Dex loaded successfully
if (!dex) {
    console.error("FATAL ERROR: @pkmn/dex not loaded in global scope. Cannot register /runjs command correctly.");
    // You might want to throw an error or prevent command registration
} else {
    console.log("✅ @pkmn/dex found in global scope.");

    // Your jsCallback function needs to use this 'dex' variable
    async function jsCallback(value) {
        try {
            // Code to execute the user's JS string
            const asyncFunc = new Function(`
                // Inside this function, 'dex' should be available due to scope chain
                // Or you might need to pass it in if the Function() constructor's scope is limited
                const Dex = window.pkmn.dex; // Re-access global just to be safe
                ${value}
            `);
            return await asyncFunc();
        } catch (err) {
            // Handle errors
             console.error("Error executing /runjs command JS:", err);
            return `Error: ${err.message}`;
        }
    }

    // Register the command only if dex loaded
    registerSlashCommand(
        'runjs',
        (_, value) => jsCallback(value),
        [],
        '<span class="monospace">(javascript)</span> – run async JavaScript and return the result, e.g. <tt>/runjs await fetch("...")</tt>',
        true,
        true // This 'true' might relate to command behavior, check docs
    );

    // Your loadMovesFromPkmnDex function should also use the global dex object
    async function loadMovesFromPkmnDex(moveNames) {
         const Dex = window.pkmn.dex; // Access globally loaded Dex

         if (!Dex) {
             console.error("❌ @pkmn/dex not available in loadMovesFromPkmnDex.");
             return {}; // Or throw
         }

         // ... rest of your loadMovesFromPkmnDex logic using Dex ...
         const move = Dex.moves.get(moveName); // Use the global Dex variable
         // ...
    }

    // Your main function to be called by /runjs
    async function prepareBattleMoves() {
         // ... Your existing logic ...
         const detailedMovesData = await loadMovesFromPkmnDex(moveListNames); // This calls your local function
         // ...
    }

    // Expose the main function to the global scope
    window.myExtension = {
        prepareBattleMoves
    };

    console.log("✅ /runjs command and window.myExtension.prepareBattleMoves registered.");

} // End of if(!dex) check


// Helper function to load move data from @pkmn/dex
async function loadMovesFromPkmnDex(moveNames) {
    // Ensure @pkmn/dex is available in the global scope
    // This assumes you have loaded it via a script tag or bundler beforehand
    if (!window.pkmn || !window.pkmn.dex) {
        console.error("❌ @pkmn/dex not found in global scope.");
        // You might want a more robust error handling here,
        // like returning an empty object or throwing a specific error.
        return {};
    }

    const dex = window.pkmn.dex;
    const movesData = {};

    if (!Array.isArray(moveNames)) {
         console.warn("loadMovesFromPkmnDex received non-array for moveNames:", moveNames);
         return {}; // Return empty if no valid list
    }


    for (const moveName of moveNames) {
        try {
            // @pkmn/dex methods are often synchronous unless dealing with learnsets
            const move = dex.moves.get(moveName);
            if (move && move.exists) { // Check if the move was found and exists in the Dex
                // Extract the data you need. The structure of 'move' object
                // is defined by @pkmn/dex. 'desc' or 'shortDesc' are common for tooltips.
                movesData[move.id] = { // Store by move ID for consistency
                    name: move.name,
                    type: move.type,
                    power: move.power,
                    accuracy: move.accuracy,
                    // ... add other data points you need ...
                    description: move.desc || move.shortDesc || "No description available.", // Get description for tooltip
                    category: move.category,
                    flags: move.flags,
                    priority: move.priority,
                    // ... etc.
                };
            } else {
                console.warn(`🤷‍♀️ Move "${moveName}" not found or does not exist in @pkmn/dex.`);
                 // Optionally add a placeholder or error state for missing moves
                movesData[moveName] = { name: moveName, description: "Data not found." };
            }
        } catch (e) {
            console.error(`Error fetching data for move "${moveName}" from @pkmn/dex:`, e);
             // Optionally add a placeholder or error state on error
             movesData[moveName] = { name: moveName, description: "Error loading data." };
        }
    }

    return movesData; // Return the collected data
}

// Main function to be called by /runjs
async function prepareBattleMoves() {
    const ctx = SillyTavern.getContext(); // Get ST context

    // 1. Get the active Pokemon variable from STscript
    const activePokemonRaw = ctx.variables.local.get("activePokemon");

    let activePokemon;
    try {
        // activePokemon variable should ideally be stored as a structured object/JSON string
        // This assumes your STscript sets it as a JSON string.
        activePokemon = activePokemonRaw ? JSON.parse(activePokemonRaw) : null;
    } catch (e) {
        console.error("❌ Failed to parse activePokemon ST variable:", e);
        // Report error back to STscript status variable
        ctx.variables.local.set("moveDB_Status", "Error: Failed to parse activePokemon data.");
        return; // Stop execution
    }

    // 2. Get the movelist (array of move names) from the active Pokemon data
    const moveListNames = activePokemon?.movelist || [];

    if (moveListNames.length === 0) {
        console.warn("⚠️ activePokemon has no movelist.");
         // Report status and set an empty moveDB
         ctx.variables.local.set("moveDB", JSON.stringify({}));
         ctx.variables.local.set("moveDB_Status", "No moves found for active Pokemon.");
        return; // Stop execution
    }

    // 3. Use the JS function to load detailed move data from @pkmn/dex
    try {
        console.log("⏳ Loading move data from @pkmn/dex for:", moveListNames);
         ctx.variables.local.set("moveDB_Status", "Loading move data...");

        const detailedMovesData = await loadMovesFromPkmnDex(moveListNames);

        // 4. Set the STscript variable 'moveDB' with the retrieved data
        // JSON.stringify is often necessary when setting complex objects to ST variables
        ctx.variables.local.set("moveDB", JSON.stringify(detailedMovesData));

        console.log("✅ Move data loaded and saved to ST variable 'moveDB':", detailedMovesData);
         ctx.variables.local.set("moveDB_Status", "Move data loaded successfully.");


    } catch (err) {
        console.error("❌ Error in prepareBattleMoves:", err);
         ctx.variables.local.set("moveDB_Status", `Error loading moves: ${err.message || err}`);
    }
}

// Expose the main function to the global scope so /runjs can call it
window.myExtension = {
  prepareBattleMoves 
};
