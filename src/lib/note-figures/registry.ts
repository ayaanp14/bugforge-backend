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
import { FIGURES as loadBalancing } from "./load-balancing.js";
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
import { FIGURES as introductionToSystemDesign } from "./introduction-to-system-design.js";
import { FIGURES as scalability } from "./scalability.js";
import { FIGURES as caching } from "./caching.js";
import { FIGURES as contentDeliveryNetworks } from "./content-delivery-networks.js";
import { FIGURES as databaseReplication } from "./database-replication.js";
import { FIGURES as databaseSharding } from "./database-sharding.js";
import { FIGURES as capTheorem } from "./cap-theorem.js";
import { FIGURES as consistentHashing } from "./consistent-hashing.js";
import { FIGURES as messageQueues } from "./message-queues.js";
import { FIGURES as rateLimiting } from "./rate-limiting.js";
import { FIGURES as microservicesAndApiGateway } from "./microservices-and-api-gateway.js";
import { FIGURES as designAUrlShortener } from "./design-a-url-shortener.js";
import { FIGURES as designAChatApp } from "./design-a-chat-app.js";
import { FIGURES as designANewsFeed } from "./design-a-news-feed.js";
import { FIGURES as designANotificationSystem } from "./design-a-notification-system.js";
import { FIGURES as designFileStorage } from "./design-file-storage.js";
import { FIGURES as designRideHailing } from "./design-ride-hailing.js";
import { FIGURES as designAWebCrawler } from "./design-a-web-crawler.js";
import { FIGURES as whatHappensWhenYouTypeAUrl } from "./what-happens-when-you-type-a-url.js";
import { FIGURES as backOfTheEnvelopeEstimation } from "./back-of-the-envelope-estimation.js";
import { FIGURES as systemDesignInterviewFramework } from "./system-design-interview-framework.js";
import { FIGURES as designSearchAutocomplete } from "./design-search-autocomplete.js";
import { FIGURES as designAParkingLot } from "./design-a-parking-lot.js";
import { FIGURES as designAVendingMachine } from "./design-a-vending-machine.js";
import { FIGURES as designAnElevatorSystem } from "./design-an-elevator-system.js";
import { FIGURES as designAMovieTicketBookingSystem } from "./design-a-movie-ticket-booking-system.js";
import { FIGURES as designAnExpenseSharingApp } from "./design-an-expense-sharing-app.js";
import { FIGURES as introductionToLowLevelDesign } from "./introduction-to-low-level-design.js";
import { FIGURES as designAnLruCache } from "./design-an-lru-cache.js";
import { FIGURES as umlClassDiagrams } from "./uml-class-diagrams.js";
import { FIGURES as designPatternsInLld } from "./design-patterns-in-lld.js";

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
  "load-balancing": loadBalancing,
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
  "introduction-to-system-design": introductionToSystemDesign,
  "scalability": scalability,
  "caching": caching,
  "content-delivery-networks": contentDeliveryNetworks,
  "database-replication": databaseReplication,
  "database-sharding": databaseSharding,
  "cap-theorem": capTheorem,
  "consistent-hashing": consistentHashing,
  "message-queues": messageQueues,
  "rate-limiting": rateLimiting,
  "microservices-and-api-gateway": microservicesAndApiGateway,
  "design-a-url-shortener": designAUrlShortener,
  "design-a-chat-app": designAChatApp,
  "design-a-news-feed": designANewsFeed,
  "design-a-notification-system": designANotificationSystem,
  "design-file-storage": designFileStorage,
  "design-ride-hailing": designRideHailing,
  "design-a-web-crawler": designAWebCrawler,
  "what-happens-when-you-type-a-url": whatHappensWhenYouTypeAUrl,
  "back-of-the-envelope-estimation": backOfTheEnvelopeEstimation,
  "system-design-interview-framework": systemDesignInterviewFramework,
  "design-search-autocomplete": designSearchAutocomplete,
  "design-a-parking-lot": designAParkingLot,
  "design-a-vending-machine": designAVendingMachine,
  "design-an-elevator-system": designAnElevatorSystem,
  "design-a-movie-ticket-booking-system": designAMovieTicketBookingSystem,
  "design-an-expense-sharing-app": designAnExpenseSharingApp,
  "introduction-to-low-level-design": introductionToLowLevelDesign,
  "design-an-lru-cache": designAnLruCache,
  "uml-class-diagrams": umlClassDiagrams,
  "design-patterns-in-lld": designPatternsInLld,
};
