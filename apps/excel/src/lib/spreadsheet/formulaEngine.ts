import { expandRange, isValidRef, parseCellRef } from "./reference";

export type ComputedValue = number | string;

export class FormulaError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

/* ── Tokenizer ──────────────────────────────────────────────────────────── */

type Token =
  | { type: "NUMBER"; value: number }
  | { type: "RANGE"; value: string }
  | { type: "REF"; value: string }
  | { type: "IDENT"; value: string }
  | { type: "OP"; value: string }
  | { type: "LPAREN" }
  | { type: "RPAREN" }
  | { type: "COMMA" };

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < expr.length) {
    const c = expr[i];

    if (/\s/.test(c)) { i++; continue; }
    if (c === "(") { tokens.push({ type: "LPAREN" }); i++; continue; }
    if (c === ")") { tokens.push({ type: "RPAREN" }); i++; continue; }
    if (c === ",") { tokens.push({ type: "COMMA" }); i++; continue; }
    if ("+-*/^".includes(c)) { tokens.push({ type: "OP", value: c }); i++; continue; }

    const rest = expr.slice(i);

    const rangeMatch = /^[A-Za-z]+\d+:[A-Za-z]+\d+/.exec(rest);
    if (rangeMatch) {
      tokens.push({ type: "RANGE", value: rangeMatch[0].toUpperCase() });
      i += rangeMatch[0].length;
      continue;
    }

    const refMatch = /^[A-Za-z]+\d+/.exec(rest);
    if (refMatch) {
      tokens.push({ type: "REF", value: refMatch[0].toUpperCase() });
      i += refMatch[0].length;
      continue;
    }

    const identMatch = /^[A-Za-z]+/.exec(rest);
    if (identMatch) {
      tokens.push({ type: "IDENT", value: identMatch[0].toUpperCase() });
      i += identMatch[0].length;
      continue;
    }

    const numMatch = /^\d+(\.\d+)?/.exec(rest);
    if (numMatch) {
      tokens.push({ type: "NUMBER", value: parseFloat(numMatch[0]) });
      i += numMatch[0].length;
      continue;
    }

    // Carácter no reconocido (p.ej. "!" de una referencia entre hojas, no soportada)
    throw new Error("PARSE");
  }

  return tokens;
}

/* ── AST ────────────────────────────────────────────────────────────────── */

type Node =
  | { type: "num"; value: number }
  | { type: "ref"; ref: string }
  | { type: "range"; ref: string }
  | { type: "bin"; op: string; left: Node; right: Node }
  | { type: "neg"; value: Node }
  | { type: "call"; name: string; args: Node[] };

/* ── Parser (recursivo-descendente) ────────────────────────────────────── */

class Parser {
  private pos = 0;
  constructor(private tokens: Token[]) {}

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private next(): Token {
    const t = this.tokens[this.pos];
    if (!t) throw new Error("PARSE");
    this.pos++;
    return t;
  }

  private isOp(value: string): boolean {
    const t = this.peek();
    return !!t && t.type === "OP" && t.value === value;
  }

  parseExpr(): Node {
    return this.parseAddSub();
  }

  expectEnd(): void {
    if (this.pos !== this.tokens.length) throw new Error("PARSE");
  }

  private parseAddSub(): Node {
    let node = this.parseMulDiv();
    while (this.isOp("+") || this.isOp("-")) {
      const op = this.next() as { type: "OP"; value: string };
      node = { type: "bin", op: op.value, left: node, right: this.parseMulDiv() };
    }
    return node;
  }

  private parseMulDiv(): Node {
    let node = this.parsePow();
    while (this.isOp("*") || this.isOp("/")) {
      const op = this.next() as { type: "OP"; value: string };
      node = { type: "bin", op: op.value, left: node, right: this.parsePow() };
    }
    return node;
  }

  private parsePow(): Node {
    let node = this.parseUnary();
    while (this.isOp("^")) {
      this.next();
      node = { type: "bin", op: "^", left: node, right: this.parseUnary() };
    }
    return node;
  }

  private parseUnary(): Node {
    if (this.isOp("-")) {
      this.next();
      return { type: "neg", value: this.parseUnary() };
    }
    if (this.isOp("+")) {
      this.next();
      return this.parseUnary();
    }
    return this.parsePrimary();
  }

  private parsePrimary(): Node {
    const t = this.next();

    if (t.type === "NUMBER") return { type: "num", value: t.value };
    if (t.type === "RANGE") return { type: "range", ref: t.value };
    if (t.type === "REF") return { type: "ref", ref: t.value };

    if (t.type === "LPAREN") {
      const node = this.parseExpr();
      if (this.next().type !== "RPAREN") throw new Error("PARSE");
      return node;
    }

    if (t.type === "IDENT") {
      if (this.next().type !== "LPAREN") throw new Error("PARSE");
      const args: Node[] = [];
      if (this.peek()?.type !== "RPAREN") {
        args.push(this.parseExpr());
        while (this.peek()?.type === "COMMA") {
          this.next();
          args.push(this.parseExpr());
        }
      }
      if (this.next().type !== "RPAREN") throw new Error("PARSE");
      return { type: "call", name: t.value, args };
    }

    throw new Error("PARSE");
  }
}

/* ── Funciones soportadas (alias en español incluidos) ─────────────────── */

const FUNCTIONS: Record<string, (nums: number[]) => number> = {
  SUM:     (nums) => nums.reduce((a, b) => a + b, 0),
  SUMA:    (nums) => FUNCTIONS.SUM(nums),
  AVERAGE: (nums) => (nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0),
  PROMEDIO:(nums) => FUNCTIONS.AVERAGE(nums),
  MIN:     (nums) => (nums.length ? Math.min(...nums) : 0),
  MAX:     (nums) => (nums.length ? Math.max(...nums) : 0),
  COUNT:   (nums) => nums.length,
  CONTAR:  (nums) => FUNCTIONS.COUNT(nums),
};

/* ── Evaluación ─────────────────────────────────────────────────────────── */

interface EvalContext {
  // Resuelve una celda a su valor computado. null = celda vacía.
  // Puede lanzar FormulaError (#REF!, #CIRC!, etc.) — se propaga tal cual.
  resolve(ref: string): ComputedValue | null;
}

function collectNumbers(args: Node[], ctx: EvalContext): number[] {
  const nums: number[] = [];
  for (const arg of args) {
    if (arg.type === "range") {
      for (const ref of expandRange(arg.ref)) {
        const v = ctx.resolve(ref);
        if (typeof v === "number") nums.push(v);
      }
    } else if (arg.type === "ref") {
      const v = ctx.resolve(arg.ref);
      if (typeof v === "number") nums.push(v);
    } else {
      nums.push(evaluateAst(arg, ctx));
    }
  }
  return nums;
}

function evaluateAst(node: Node, ctx: EvalContext): number {
  switch (node.type) {
    case "num":
      return node.value;

    case "neg":
      return -evaluateAst(node.value, ctx);

    case "bin": {
      const l = evaluateAst(node.left, ctx);
      const r = evaluateAst(node.right, ctx);
      switch (node.op) {
        case "+": return l + r;
        case "-": return l - r;
        case "*": return l * r;
        case "/":
          if (r === 0) throw new FormulaError("#DIV/0!");
          return l / r;
        case "^": return Math.pow(l, r);
        default: throw new FormulaError("#ERROR!");
      }
    }

    case "ref": {
      const v = ctx.resolve(node.ref);
      if (v === null) return 0;
      if (typeof v === "number") return v;
      const n = Number(v);
      if (Number.isNaN(n)) throw new FormulaError("#VALUE!");
      return n;
    }

    case "range":
      // Un rango solo es válido como argumento de función.
      throw new FormulaError("#ERROR!");

    case "call": {
      const fn = FUNCTIONS[node.name];
      if (!fn) throw new FormulaError("#ERROR!");
      return fn(collectNumbers(node.args, ctx));
    }
  }
}

// Evalúa el contenido crudo de una celda ("=SUMA(A1:A3)", "42", "hola").
function evaluateRaw(raw: string, ctx: EvalContext): ComputedValue {
  if (!raw.startsWith("=")) {
    const trimmed = raw.trim();
    if (trimmed !== "" && !Number.isNaN(Number(trimmed))) return Number(trimmed);
    return raw;
  }
  const tokens = tokenize(raw.slice(1));
  const parser = new Parser(tokens);
  const ast = parser.parseExpr();
  parser.expectEnd();
  return evaluateAst(ast, ctx);
}

/* ── Recalculo de hoja completa ────────────────────────────────────────── */

export interface SheetCellsLike {
  rowCount: number;
  colCount: number;
  cells: Record<string, { raw: string }>;
}

// Recalcula todas las celdas de la hoja. Memoiza en un Map creado en esta misma
// llamada (sin fugas entre pasadas) y detecta ciclos con un set "en la pila
// actual" (DFS), reseteado por cada celda evaluada desde el nivel superior.
export function computeSheet(sheet: SheetCellsLike): Record<string, ComputedValue> {
  const memo = new Map<string, ComputedValue | null>();
  const visiting = new Set<string>();
  const result: Record<string, ComputedValue> = {};

  function resolve(ref: string): ComputedValue | null {
    if (memo.has(ref)) return memo.get(ref)!;

    const parsed = parseCellRef(ref);
    if (!parsed || !isValidRef(parsed.col, parsed.row, sheet)) {
      throw new FormulaError("#REF!");
    }

    const cell = sheet.cells[ref];
    if (!cell || cell.raw === "") {
      memo.set(ref, null);
      return null;
    }

    if (visiting.has(ref)) throw new FormulaError("#CIRC!");
    visiting.add(ref);

    let value: ComputedValue | null;
    try {
      value = evaluateRaw(cell.raw, { resolve });
    } catch (e) {
      value = e instanceof FormulaError ? e.code : "#ERROR!";
    } finally {
      visiting.delete(ref);
    }

    memo.set(ref, value);
    return value;
  }

  for (const ref of Object.keys(sheet.cells)) {
    result[ref] = resolve(ref) ?? "";
  }

  return result;
}
