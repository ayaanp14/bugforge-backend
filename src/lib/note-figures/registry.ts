import type { Walkthrough } from "../walkthroughs/core.js";
import { FIGURES as abstraction } from "./abstraction.js";
import { FIGURES as associationAggregationComposition } from "./association-aggregation-composition.js";
import { FIGURES as classesAndObjects } from "./classes-and-objects.js";
import { FIGURES as classicSynchronizationProblems } from "./classic-synchronization-problems.js";
import { FIGURES as concurrencyControl } from "./concurrency-control.js";
import { FIGURES as cpuScheduling } from "./cpu-scheduling.js";
import { FIGURES as dataLinkLayer } from "./data-link-layer.js";
import { FIGURES as deadlocks } from "./deadlocks.js";
import { FIGURES as designPatterns } from "./design-patterns.js";
import { FIGURES as diskScheduling } from "./disk-scheduling.js";
import { FIGURES as dns } from "./dns.js";
import { FIGURES as encapsulation } from "./encapsulation.js";
import { FIGURES as erModel } from "./er-model.js";
import { FIGURES as exceptionHandling } from "./exception-handling.js";
import { FIGURES as fileSystems } from "./file-systems.js";
import { FIGURES as functionalDependencies } from "./functional-dependencies.js";
import { FIGURES as httpAndHttps } from "./http-and-https.js";
import { FIGURES as indexingAndBPlusTrees } from "./indexing-and-b-plus-trees.js";
import { FIGURES as inheritance } from "./inheritance.js";
import { FIGURES as interProcessCommunication } from "./inter-process-communication.js";
import { FIGURES as introductionToComputerNetworks } from "./introduction-to-computer-networks.js";
import { FIGURES as introductionToDbms } from "./introduction-to-dbms.js";
import { FIGURES as introductionToOop } from "./introduction-to-oop.js";
import { FIGURES as introductionToOperatingSystems } from "./introduction-to-operating-systems.js";
import { FIGURES as ipAddressingAndSubnetting } from "./ip-addressing-and-subnetting.js";
import { FIGURES as keysInDbms } from "./keys-in-dbms.js";
import { FIGURES as memoryManagement } from "./memory-management.js";
import { FIGURES as natDhcpAndPorts } from "./nat-dhcp-and-ports.js";
import { FIGURES as networkSecurityBasics } from "./network-security-basics.js";
import { FIGURES as normalization } from "./normalization.js";
import { FIGURES as objectEqualityAndCopying } from "./object-equality-and-copying.js";
import { FIGURES as osiModel } from "./osi-model.js";
import { FIGURES as pageReplacementAlgorithms } from "./page-replacement-algorithms.js";
import { FIGURES as polymorphism } from "./polymorphism.js";
import { FIGURES as processSynchronization } from "./process-synchronization.js";
import { FIGURES as processesAndThreads } from "./processes-and-threads.js";
import { FIGURES as routingAlgorithms } from "./routing-algorithms.js";
import { FIGURES as solidPrinciples } from "./solid-principles.js";
import { FIGURES as sqlAggregationAndSubqueries } from "./sql-aggregation-and-subqueries.js";
import { FIGURES as sqlBasics } from "./sql-basics.js";
import { FIGURES as sqlJoins } from "./sql-joins.js";
import { FIGURES as sqlVsNosql } from "./sql-vs-nosql.js";
import { FIGURES as tcpAndUdp } from "./tcp-and-udp.js";
import { FIGURES as tcpIpModel } from "./tcp-ip-model.js";
import { FIGURES as transactionsAndAcid } from "./transactions-and-acid.js";
import { FIGURES as virtualMemory } from "./virtual-memory.js";
import { FIGURES as whatHappensWhenYouTypeAUrl } from "./what-happens-when-you-type-a-url.js";

/**
 * Every CS note's figures by note slug, then figure name (one module per
 * note beside this file, `<note slug>.ts` exporting FIGURES — the roadmap
 * lessons' convention, lib/lesson-figures/registry.ts). A note slug is
 * unique across subjects (lib/cs-notes validateNotes), so it is the key.
 */
export const NOTE_FIGURES: Readonly<Record<string, Readonly<Record<string, () => Walkthrough>>>> = {
  abstraction: abstraction,
  "association-aggregation-composition": associationAggregationComposition,
  "classes-and-objects": classesAndObjects,
  "classic-synchronization-problems": classicSynchronizationProblems,
  "concurrency-control": concurrencyControl,
  "cpu-scheduling": cpuScheduling,
  "data-link-layer": dataLinkLayer,
  deadlocks: deadlocks,
  "design-patterns": designPatterns,
  "disk-scheduling": diskScheduling,
  dns: dns,
  encapsulation: encapsulation,
  "er-model": erModel,
  "exception-handling": exceptionHandling,
  "file-systems": fileSystems,
  "functional-dependencies": functionalDependencies,
  "http-and-https": httpAndHttps,
  "indexing-and-b-plus-trees": indexingAndBPlusTrees,
  inheritance: inheritance,
  "inter-process-communication": interProcessCommunication,
  "introduction-to-computer-networks": introductionToComputerNetworks,
  "introduction-to-dbms": introductionToDbms,
  "introduction-to-oop": introductionToOop,
  "introduction-to-operating-systems": introductionToOperatingSystems,
  "ip-addressing-and-subnetting": ipAddressingAndSubnetting,
  "keys-in-dbms": keysInDbms,
  "memory-management": memoryManagement,
  "nat-dhcp-and-ports": natDhcpAndPorts,
  "network-security-basics": networkSecurityBasics,
  normalization: normalization,
  "object-equality-and-copying": objectEqualityAndCopying,
  "osi-model": osiModel,
  "page-replacement-algorithms": pageReplacementAlgorithms,
  polymorphism: polymorphism,
  "process-synchronization": processSynchronization,
  "processes-and-threads": processesAndThreads,
  "routing-algorithms": routingAlgorithms,
  "solid-principles": solidPrinciples,
  "sql-aggregation-and-subqueries": sqlAggregationAndSubqueries,
  "sql-basics": sqlBasics,
  "sql-joins": sqlJoins,
  "sql-vs-nosql": sqlVsNosql,
  "tcp-and-udp": tcpAndUdp,
  "tcp-ip-model": tcpIpModel,
  "transactions-and-acid": transactionsAndAcid,
  "virtual-memory": virtualMemory,
  "what-happens-when-you-type-a-url": whatHappensWhenYouTypeAUrl,
};
