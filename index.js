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
            resolve(movesData); // still resolve with partial data
          }
        };
      });
    };
  });
}

function getActivePokemon() {
  const raw = SillyTavern.getContext().variables.local.get("activePokemon");
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to parse activePokemon:", e);
    return null;
  }
}

async function loadMoves() {
  const ctx = SillyTavern.getContext();
  const activePokemon = getActivePokemon();

  if (!activePokemon || !Array.isArray(activePokemon.movelist)) {
    console.error("Invalid activePokemon or movelist.");
    ctx.variables.local.set("moveDB", "{}");
    return;
  }

  try {
    const data = await loadMovesFromIndexedDB(activePokemon.movelist);
    ctx.variables.local.set("moveDB", JSON.stringify(data));
    ctx.executeSlashCommands("/run onMovesLoaded");
  } catch (err) {
    console.error("Failed to load moves:", err);
    ctx.variables.local.set("moveDB", "{}");
  }
}

window.myExtension = {
  loadMoves
};
