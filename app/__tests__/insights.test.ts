import { describe, it, expect } from "vitest";
import {
  detectCycles,
  detectDeepChains,
  detectDatabaseBottlenecks,
  calculateHealthScore,
  SystemInsight,
} from "@/app/(protected)/generate/utils/insights";
import { GraphNode } from "@/app/(protected)/generate/utils/parser";

describe("Architecture Insights Logic", () => {
  describe("detectCycles", () => {
    it("should return empty if there are no cycles", () => {
      const nodes: GraphNode[] = [
        { id: "A", label: "A", shape: "rect", type: "service" },
        { id: "B", label: "B", shape: "rect", type: "service" },
      ];
      const links = [{ source: "A", target: "B" }];
      const cycles = detectCycles(nodes, links);
      expect(cycles).toEqual([]);
    });

    it("should detect simple cycles", () => {
      const nodes: GraphNode[] = [
        { id: "A", label: "A", shape: "rect", type: "service" },
        { id: "B", label: "B", shape: "rect", type: "service" },
      ];
      const links = [
        { source: "A", target: "B" },
        { source: "B", target: "A" },
      ];
      const cycles = detectCycles(nodes, links);
      expect(cycles.length).toBe(1);
      expect(cycles[0]).toContain("A");
      expect(cycles[0]).toContain("B");
    });
  });

  describe("detectDeepChains", () => {
    it("should detect paths exceeding 4 hops", () => {
      const nodes: GraphNode[] = [
        { id: "A", label: "A", shape: "rect", type: "client" },
        { id: "B", label: "B", shape: "rect", type: "gateway" },
        { id: "C", label: "C", shape: "rect", type: "service" },
        { id: "D", label: "D", shape: "rect", type: "service" },
        { id: "E", label: "E", shape: "rect", type: "service" },
      ];
      const links = [
        { source: "A", target: "B" },
        { source: "B", target: "C" },
        { source: "C", target: "D" },
        { source: "D", target: "E" },
      ];
      const chains = detectDeepChains(nodes, links);
      expect(chains.length).toBe(1);
      expect(chains[0]).toEqual(["A", "B", "C", "D", "E"]);
    });
  });

  describe("detectDatabaseBottlenecks", () => {
    it("should detect direct data access contentions (3+ services directly to one database)", () => {
      const nodes: GraphNode[] = [
        { id: "S1", label: "S1", shape: "rect", type: "service" },
        { id: "S2", label: "S2", shape: "rect", type: "service" },
        { id: "S3", label: "S3", shape: "rect", type: "service" },
        { id: "DB", label: "DB", shape: "database", type: "database" },
      ];
      const links = [
        { source: "S1", target: "DB" },
        { source: "S2", target: "DB" },
        { source: "S3", target: "DB" },
      ];
      const bottlenecks = detectDatabaseBottlenecks(nodes, links);
      expect(bottlenecks.length).toBe(1);
      expect(bottlenecks[0].dbId).toBe("DB");
      expect(bottlenecks[0].sources).toContain("S1");
      expect(bottlenecks[0].sources).toContain("S2");
      expect(bottlenecks[0].sources).toContain("S3");
    });
  });

  describe("calculateHealthScore", () => {
    it("should calculate perfect health score if there are no insights", () => {
      const result = calculateHealthScore([]);
      expect(result.score).toBe(100);
      expect(result.grade).toBe("A+");
    });

    it("should apply penalties properly based on severity", () => {
      const insights: SystemInsight[] = [
        {
          id: "1",
          type: "cycle",
          severity: "critical",
          title: "Cycle",
          description: "Desc",
          affectedNodes: [],
          affectedLinks: [],
        },
        {
          id: "2",
          type: "spof",
          severity: "warning",
          title: "SPOF",
          description: "Desc",
          affectedNodes: [],
          affectedLinks: [],
        },
        {
          id: "3",
          type: "isolated",
          severity: "optimization",
          title: "Isolated",
          description: "Desc",
          affectedNodes: [],
          affectedLinks: [],
        },
      ];
      const result = calculateHealthScore(insights);
      // Penalties: critical (-20), warning (-12), optimization (-5)
      // Score: 100 - 37 = 63 (Grade: D)
      expect(result.score).toBe(63);
      expect(result.grade).toBe("D");
    });
  });
});
