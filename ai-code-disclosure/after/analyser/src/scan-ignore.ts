// Study-artifact files that live inside a corpus app dir but are NOT part of
// the generated app. The gate must never scan these — otherwise the fake key
// in an app-meta.json prompt is flagged as a client secret (a false positive).
export const IGNORE_FILES = new Set(["app-meta.json", "vibegate.smoke.json"]);
