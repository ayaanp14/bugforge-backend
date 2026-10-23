import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { checkStructSignature, isStructured, STRUCTURED_DRIVER_MARK, type StructSignature } from "./driver-structures.js";
import { ALL_LANGUAGES, applyDriver, renderStub, type Signature } from "./driver-codegen.js";
import { wrapCode } from "./judge0.js";

const plain: Signature = { funcName: "twoSum", params: [{ name: "nums", type: "int[]" }, { name: "target", type: "int" }], returns: "int[]" };
const tree: Signature = { funcName: "invertTree", params: [{ name: "root", type: "TreeNode" }], returns: "TreeNode" };
const lists: Signature = { funcName: "mergeKLists", params: [{ name: "lists", type: "ListNode[]" }], returns: "ListNode" };
const design: Signature = {
  funcName: "LRUCache", params: [{ name: "capacity", type: "int" }], returns: "void",
  methods: [{ name: "get", params: [{ name: "key", type: "int" }], returns: "int" }, { name: "put", params: [{ name: "key", type: "int" }, { name: "value", type: "int" }], returns: "void" }],
};
const s = (sig: Signature) => sig as unknown as StructSignature;

describe("structured signatures", () => {
  it("are told apart from the plain ones", () => {
    assert.equal(isStructured(s(plain)), false);
    assert.equal(isStructured(s(tree)), true);
    assert.equal(isStructured(s(lists)), true);
    assert.equal(isStructured(s(design)), true);
  });

  it("leave a plain signature on the old path: JS/Python untouched, no marker anywhere", () => {
    assert.equal(applyDriver("javascript", plain, "var twoSum = function(nums, target) {};"), "var twoSum = function(nums, target) {};");
    assert.equal(applyDriver("python", plain, "def twoSum(nums, target):\n    pass"), "def twoSum(nums, target):\n    pass");
    for (const lang of ALL_LANGUAGES) assert.ok(!applyDriver(lang, plain, renderStub(lang, plain)).includes(STRUCTURED_DRIVER_MARK), lang);
  });

  it("give JS/Python a complete program that wrapCode passes through", () => {
    for (const lang of ["javascript", "python"] as const) {
      const program = applyDriver(lang, tree, renderStub(lang, tree));
      assert.ok(program.includes(STRUCTURED_DRIVER_MARK));
      assert.equal(wrapCode(program, lang), program);
    }
  });

  it("render a stub and a driver for every language", () => {
    for (const sig of [tree, lists, design]) {
      for (const lang of ALL_LANGUAGES) {
        assert.ok(renderStub(lang, sig).length > 0, `${sig.funcName} ${lang} stub`);
        assert.ok(applyDriver(lang, sig, renderStub(lang, sig)).includes("__CODEKAIRO_BEGIN__"), `${sig.funcName} ${lang} driver`);
      }
    }
  });

  it("refuse shapes the drivers cannot honour", () => {
    assert.throws(() => checkStructSignature({ funcName: "C", params: [], returns: "void", methods: [{ name: "f", params: [{ name: "t", type: "TreeNode" }], returns: "int" }] }));
    assert.throws(() => checkStructSignature({ funcName: "C", params: [], returns: "int", methods: [{ name: "f", params: [], returns: "int" }] }));
    assert.throws(() => checkStructSignature({ funcName: "f", params: [{ name: "b", type: "bool" }], returns: "TreeNode" }));
    assert.throws(() => checkStructSignature({ funcName: "f", params: [{ name: "r", type: "TreeNode" }], returns: "ListNode[]" }));
  });
});
