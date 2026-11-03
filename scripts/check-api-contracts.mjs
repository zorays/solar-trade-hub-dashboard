import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
const backend = path.resolve(process.argv[2] || "../backend/src");
if (!fs.existsSync(path.join(backend, "routes/index.js")))
  throw new Error(
    "Pass the reviewed backend src directory: npm run check:api -- /path/to/backend/src",
  );
const walk = (d) =>
  fs
    .readdirSync(d, { withFileTypes: true })
    .flatMap((e) =>
      e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)],
    );
const parse = (f) =>
  ts.createSourceFile(
    f,
    fs.readFileSync(f, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    f.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
function nodes(s, fn) {
  function visit(n) {
    fn(n);
    ts.forEachChild(n, visit);
  }
  visit(s);
}
function extract(f) {
  const s = parse(f),
    imports = new Map(),
    constants = new Map(),
    calls = [];
  nodes(s, (n) => {
    if (ts.isImportDeclaration(n) && n.importClause?.name)
      imports.set(
        n.importClause.name.text,
        path.resolve(path.dirname(f), n.moduleSpecifier.text) +
          (path.extname(n.moduleSpecifier.text) ? "" : ".js"),
      );
    if (
      ts.isVariableDeclaration(n) &&
      ts.isIdentifier(n.name) &&
      n.initializer &&
      ts.isStringLiteral(n.initializer)
    )
      constants.set(n.name.text, n.initializer.text);
  });
  function val(n) {
    if (!n) return null;
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n))
      return n.text;
    if (ts.isIdentifier(n)) return constants.get(n.text) || null;
    if (ts.isTemplateExpression(n))
      return (
        n.head.text +
        n.templateSpans
          .map((x) => (val(x.expression) || ":param") + x.literal.text)
          .join("")
      );
    return ":param";
  }
  nodes(s, (n) => {
    if (
      ts.isCallExpression(n) &&
      ts.isPropertyAccessExpression(n.expression) &&
      ["get", "post", "patch", "put", "delete", "use"].includes(
        n.expression.name.text,
      )
    ) {
      const object = n.expression.expression.getText(s);
      let chain = n.expression.expression;
      let routePath = null;
      while (
        ts.isCallExpression(chain) &&
        ts.isPropertyAccessExpression(chain.expression)
      ) {
        if (chain.expression.name.text === "route") {
          routePath = val(chain.arguments[0]);
          break;
        }
        chain = chain.expression.expression;
      }
      if (routePath) {
        calls.push({
          method: n.expression.name.text,
          path: routePath,
          args: [],
          file: f,
          line: s.getLineAndCharacterOfPosition(n.getStart(s)).line + 1,
        });
      }
      if (["router", "api", "app"].includes(object)) {
        calls.push({
          method: n.expression.name.text,
          path: val(n.arguments[0]),
          args: n.arguments.slice(1).map((x) => x.getText(s)),
          file: f,
          line: s.getLineAndCharacterOfPosition(n.getStart(s)).line + 1,
        });
      }
    }
  });
  return { imports, calls };
}
const routes = [];
function expand(f, prefix, stack = []) {
  if (stack.includes(f) || !fs.existsSync(f)) return;
  const { imports, calls } = extract(f);
  for (const c of calls) {
    if (!c.path || c.path === ":param") continue;
    if (c.method === "use") {
      for (const a of c.args) {
        if (imports.has(a))
          expand(imports.get(a), prefix + c.path, [...stack, f]);
      }
    } else routes.push({ ...c, path: (prefix + c.path).replace(/\/$/, "") });
  }
}
expand(backend + "/routes/index.js", "");
const normalize = (s) => s.replace(/:[^/]+/g, ":param").replace(/\/$/, "");
const client = walk("src")
  .filter((f) => /\.(tsx?|js)$/.test(f))
  .flatMap((f) => extract(f).calls.filter((c) => c.method !== "use"));
const missing = client.filter(
  (c) =>
    c.path &&
    c.path !== ":param" &&
    !c.path.includes("http") &&
    !routes.some(
      (r) => r.method === c.method && normalize(r.path) === normalize(c.path),
    ),
);
console.log(
  JSON.stringify(
    {
      backendRoutes: routes.length,
      frontendCalls: client.length,
      missing: missing.map((c) => ({
        method: c.method,
        path: c.path,
        file: c.file,
        line: c.line,
      })),
    },
    null,
    2,
  ),
);
if (missing.length) process.exitCode = 1;
console.log(
  "Static path/method comparison only. Dynamic URL variables, payloads, permissions and runtime behavior require separate testing.",
);
