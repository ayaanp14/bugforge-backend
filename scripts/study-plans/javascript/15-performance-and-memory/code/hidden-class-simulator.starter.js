"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// class <Name>: <props...>   — a constructor assigning these properties in order
// new <Name> <obj>           — instantiate
// set <obj> <prop>           — add a property later (a transition off the constructor's shape)
// delete <obj> <prop>        — dictionary mode
// site <name> <obj...>       — a property-access site and the objects it has seen
// TODO: transition tree from the root, per-object shapes, per-site IC state; print the tree, the objects and the sites
