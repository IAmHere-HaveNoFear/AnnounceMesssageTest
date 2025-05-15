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

import {Dex} from '@pkmn/dex';

export async function loadKantoMovesToDB() {
	const request = indexedDB.open('MyPokeDB', 1);

	request.onupgradeneeded = function (event) {
		const db = event.target.result;
		if (!db.objectStoreNames.contains('moveDB')) {
			db.createObjectStore('moveDB', { keyPath: 'id' });
		}
	};

	request.onsuccess = function () {
		const db = request.result;
		const transaction = db.transaction(['moveDB'], 'readwrite');
		const store = transaction.objectStore('moveDB');

		// Get Gen 1 Kanto moves
		for (const id in Dex.moves.all()) {
			const move = Dex.moves.get(id);
			if (move.gen === 1) {
				const moveData = {
					id: move.id,
					name: move.name,
					type: move.type,
					basePower: move.basePower,
					category: move.category,
					accuracy: move.accuracy,
					pp: move.pp,
					priority: move.priority,
					target: move.target,
					flags: move.flags,
					desc: move.shortDesc,
				};
				store.put(moveData);
			}
		}

		transaction.oncomplete = () => console.log('Kanto moves saved to IndexedDB');
		transaction.onerror = () => console.error('Transaction error:', transaction.error);
	};

	request.onerror = function () {
		console.error('IndexedDB error:', request.error);
	};
}




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