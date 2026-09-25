// ВАЖНО: WASM подключается как Vite-ассет, поэтому путь к swisseph.wasm
// резолвится на этапе сборки (хешированный файл в /assets/).
// Библиотека @swisseph/browser по умолчанию ищет "swisseph.wasm" рядом со своим
// чанком, но Vite переименовывает былm — поэтому передаём URL явно.
import sweWasmUrl from "@swisseph/browser/dist/swisseph.wasm?url";
let swe = null;
let modulePromise = null;
let readyPromise = null;

const WASM_INIT_TIMEOUT_MS = 20000;

function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => {
        reject(new Error(`Swiss Ephemeris WASM не загрузился за ${timeoutMs / 1000} секунд`));
      }, timeoutMs);
    })
  ]);
}

export async function loadSwissEphemerisModule() {
  if (!modulePromise) {
    modulePromise = import("@swisseph/browser")
      .then((module) => module)
      .catch((error) => {
        modulePromise = null;
        throw error;
      });
  }
  return modulePromise;
}

export async function getSwissEphemeris() {
  if (!readyPromise) {
    readyPromise = (async () => {
      const { SwissEphemeris } = await loadSwissEphemerisModule();
      swe = new SwissEphemeris();
      await withTimeout(swe.init(sweWasmUrl), WASM_INIT_TIMEOUT_MS);
      return swe;
    })().catch((error) => {
      swe = null;
      readyPromise = null;
      console.error("Swiss Ephemeris initialization failed:", error);
      throw error;
    });
  }

  return readyPromise;
}

