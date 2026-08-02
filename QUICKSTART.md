# Quickstart — reproduce every result in ~10 minutes

Requires **Node.js ≥ 18** (tested on 22.23.1; `analyser/.nvmrc` pins it).

```bash
cd analyser && npm install && cd ..
```

Copy the dataset to the working name the scripts expect:

```bash
cp data/findings.jsonl corpus-runs.jsonl
```

---

## 1. Cross-tool exposure table (Table 1)

```bash
node - <<'EOF'
const rows=require("fs").readFileSync("corpus-runs.jsonl","utf8").trim().split("\n").map(JSON.parse);
const T=["v0","lovable","bolt","replit","claude"];
const C=["security-headers","client-secret:auto-move","cors-tighten","endpoint-auth","storage-rules"];
const a={};for(const r of rows){a[r.tool]??={};a[r.tool][r.checkId]??=new Set();a[r.tool][r.checkId].add(r.appId);}
const p=(s,n)=>String(s).padEnd(n);
console.log(p("check",26)+T.map(t=>p(t,9)).join(""));
for(const c of C){let l=p(c,26);for(const t of T)l+=p(`${a[t]?.[c]?.size??0}/15`,9);console.log(l);}
EOF
```

Counts here include intended-by-design findings. For the FP-adjusted version in
the manuscript, exclude rows whose label in `data/labels-rater1-rules.csv`
begins with `INTENDED`.

## 2. Labels and precision

```bash
node analysis/label-findings.mjs corpus-runs.jsonl --precision
```

Note the caveat the script prints: rule-proposed labels **cannot** measure a
false-positive rate, because the rules cannot detect their own errors. False
positives were sought by code inspection instead (step 3).

## 3. Rater agreement (Cohen's κ)

```bash
cp data/labels-rater1-rules.csv study_labels.csv   # if running outside the repo layout
node analysis/agreement.mjs
```

Expected: **n = 52, raw agreement 94.2 %, κ = 0.698**, with three disagreements,
all on permissive row-level-security `SELECT` policies for the admin-dashboard
specification.

## 4. Speed–safety frontier and knee (§3.4)

```bash
node analysis/make-figure.mjs corpus-runs.jsonl > figure1.svg
```

The script prints the knee, its yield, its friction, and the frontier size to
stderr. Two conditions are reported in the manuscript:

- **Primary** (no deployment origin available, as analysed): knee is a
  **two-check** gate at **0.018 s**.
- **Secondary** (a deployment origin is known, so CORS becomes automatically
  fixable): knee is a **three-check** gate at **0.037 s**.

Both are stable across all 20 friction-penalty combinations tested.

## 5. Re-run the analyser on the corpus (optional, ~2 min)

```bash
cd analyser
node study/build-manifest.mjs ../corpus > ../corpus/corpus.json
npm run corpus -- ../corpus/corpus.json --out=../fresh-findings.jsonl
```

`fresh-findings.jsonl` should match `data/findings.jsonl` in finding counts.
Timing fields will differ, since they record wall-clock measurements.

---

## Field reference — `findings.jsonl`

| field | meaning |
|---|---|
| `appId`, `tool`, `platform` | application identity and generating tool |
| `checkId`, `exposureClass` | which check fired, and the class of exposure |
| `location`, `detail` | file (and line) plus a human-readable description |
| `severityWeight` | 0–1 weight used for the yield axis |
| `fixApplied`, `reverified` | whether an automatic fix ran and was re-verified |
| `brokeApp`, `brokeAppMeasured` | predicted vs. runtime-measured breakage |
| `addedSeconds`, `humanDecision`, `extraDeploy` | friction components |
| `truePositive` | reserved for reviewer labels (null in the released data) |
