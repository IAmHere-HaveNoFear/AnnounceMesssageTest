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



// index.js

function loadMovesFromIndexedDB(moveList) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('pokemonMovesDB', 1);

    request.onerror = () => reject('Failed to open IndexedDB');

    request.onsuccess = event => {
      const db = event.target.result;
      const transaction = db.transaction('moves', 'readonly');
      const store = transaction.objectStore('moves');

      const movesData = {};
      let completed = 0;

      moveList.forEach(moveName => {
        const getRequest = store.get(moveName);

        getRequest.onsuccess = () => {
          if (getRequest.result) {
            movesData[moveName] = getRequest.result;
          }
          completed++;
          if (completed === moveList.length) {
            resolve(movesData);
          }
        };

        getRequest.onerror = () => {
          completed++;
          if (completed === moveList.length) {
            resolve(movesData); // Continue even on failed lookups
          }
        };
      });
    };
  });
}

async function loadMoves() {
  const ctx = SillyTavern.getContext();
  const raw = ctx.variables.local.get("activePokemon");

  let activePokemon;
  try {
    activePokemon = JSON.parse(raw);
  } catch (e) {
    console.error("Failed to parse activePokemon:", e);
    return;
  }

  const moveList = activePokemon?.movelist || [];

  try {
    const result = await loadMovesFromIndexedDB(moveList);

    ctx.variables.local.set("moveDB", JSON.stringify(result));
    console.log("✅ Moves loaded and saved to moveDB:", result);

  } catch (err) {
    console.error("❌ Error loading moves:", err);
  }
}

// Attach to global scope so you can call it with /js
window.myExtension = {
  loadMoves
};