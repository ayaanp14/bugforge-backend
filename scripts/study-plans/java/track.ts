import type { TrackSeed } from "../dsl.js";
import jvm from "./01-jvm/module.js";
import types from "./02-types/module.js";
import strings from "./03-strings/module.js";
import control from "./04-control/module.js";
import methods from "./05-methods/module.js";
import arrays from "./06-arrays/module.js";
import classes from "./07-classes/module.js";
import inheritance from "./08-inheritance/module.js";
import interfaces from "./09-interfaces/module.js";
import enumsRecords from "./10-enums-records/module.js";
import nestedLambdas from "./11-nested-lambdas/module.js";
import exceptions from "./12-exceptions/module.js";
import generics from "./13-generics/module.js";
import collections from "./14-collections/module.js";
import streams from "./15-streams/module.js";
import memory from "./16-memory/module.js";
import concurrency from "./17-concurrency/module.js";
import io from "./18-io/module.js";
import modernJava from "./19-modern-java/module.js";
import interviewIdioms from "./20-interview-idioms/module.js";

/**
 * The Java study plan: twenty modules from the JVM to interview idioms,
 * targeting the Java 17 feature set. Exercises compile on OpenJDK 18 (the
 * Paiza runner — STUDY_EXECUTOR in src/lib/program-judge.ts), so text
 * blocks, records, sealed types, pattern `instanceof` and switch
 * expressions are all fair game in exercises; the Java 21-only features
 * (pattern matching for switch, record patterns, virtual threads) are
 * taught in the Modern Java module as reading and quiz only.
 */
export const javaTrack: TrackSeed = {
  key: "java",
  title: "Java",
  blurb: "The language end to end — types, strings, OOP, generics, collections, streams, memory, concurrency, I/O and modern Java — with exercises judged on a real JDK.",
  language: "java",
  runtime: "OpenJDK 18",
  modules: [jvm, types, strings, control, methods, arrays, classes, inheritance, interfaces, enumsRecords, nestedLambdas, exceptions, generics, collections, streams, memory, concurrency, io, modernJava, interviewIdioms],
};
