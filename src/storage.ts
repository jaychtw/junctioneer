export interface Save {
  version: 1;
  completed: string[];
  language: "en" | "zh-TW";
  reducedMotion: boolean;
}
export const saveKey = "junctioneer.v1";
export const defaults = (): Save => ({
  version: 1,
  completed: [],
  language: "en",
  reducedMotion: false,
});
export function readSave(storage: Pick<Storage, "getItem">): {
  value: Save;
  warning: boolean;
} {
  try {
    const raw = storage.getItem(saveKey);
    if (!raw) return { value: defaults(), warning: false };
    const s = JSON.parse(raw);
    if (
      s?.version !== 1 ||
      !Array.isArray(s.completed) ||
      s.completed.some(
        (id: unknown) =>
          typeof id !== "string" || !/^L(0[1-9]|1[0-5])$/.test(id),
      ) ||
      !["en", "zh-TW"].includes(s.language) ||
      typeof s.reducedMotion !== "boolean"
    )
      throw new Error("Invalid save");
    return {
      value: {
        version: 1,
        completed: [...new Set<string>(s.completed)],
        language: s.language,
        reducedMotion: s.reducedMotion,
      },
      warning: false,
    };
  } catch {
    return { value: defaults(), warning: true };
  }
}
export function writeSave(
  storage: Pick<Storage, "setItem">,
  save: Save,
): boolean {
  try {
    storage.setItem(saveKey, JSON.stringify(save));
    return true;
  } catch {
    return false;
  }
}
export function complete(save: Save, id: string): Save {
  return { ...save, completed: [...new Set([...save.completed, id])] };
}
