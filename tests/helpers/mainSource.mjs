import { readFileSync } from 'node:fs';
import ts from 'typescript';

export const source = readFileSync(new URL('../../main/main-function/index.ts', import.meta.url), 'utf8');
export const sourceFile = ts.createSourceFile('index.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

export function findNodes(predicate) {
  const nodes = [];
  function visit(node) {
    if (predicate(node)) nodes.push(node);
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return nodes;
}

export function functionText(name) {
  const declaration = findNodes(node => ts.isFunctionDeclaration(node) && node.name?.text === name)[0];
  if (declaration) return declaration.getText(sourceFile);
  const variable = findNodes(node => ts.isVariableDeclaration(node) && node.name.getText(sourceFile) === name)[0];
  if (!variable?.initializer) throw new Error(`Missing function: ${name}`);
  return `const ${name} = ${variable.initializer.getText(sourceFile)};`;
}

export function executeFunction(name, context = {}) {
  const compiled = ts.transpileModule(functionText(name), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  return Function(...Object.keys(context), `${compiled}\nreturn ${name};`)(...Object.values(context));
}

export { ts };
