import { describe, it, expect } from "vitest";
import { parseMermaidFlowchart } from "@/app/(protected)/generate/utils/parser";

describe("Mermaid Flowchart Parser", () => {
  it("should parse an empty chart correctly", () => {
    const result = parseMermaidFlowchart("");
    expect(result.nodes).toEqual([]);
    expect(result.links).toEqual([]);
    expect(result.subgraphs).toEqual([]);
  });

  it("should parse nodes and classify their types correctly", () => {
    const chart = `
      flowchart TD
        client["Web Frontend App"]
        gateway["Kong Ingress"]
        service["UserService"]
        postgres[("PostgreSQL DB")]
        decision{"Is Authenticated?"}
    `;
    const result = parseMermaidFlowchart(chart);

    expect(result.nodes.length).toBe(5);

    const clientNode = result.nodes.find((n) => n.id === "client");
    expect(clientNode).toBeDefined();
    expect(clientNode?.type).toBe("client");
    expect(clientNode?.label).toBe("Web Frontend App");

    const gatewayNode = result.nodes.find((n) => n.id === "gateway");
    expect(gatewayNode).toBeDefined();
    expect(gatewayNode?.type).toBe("gateway");

    const serviceNode = result.nodes.find((n) => n.id === "service");
    expect(serviceNode).toBeDefined();
    expect(serviceNode?.type).toBe("service");

    const dbNode = result.nodes.find((n) => n.id === "postgres");
    expect(dbNode).toBeDefined();
    expect(dbNode?.type).toBe("database");

    const decisionNode = result.nodes.find((n) => n.id === "decision");
    expect(decisionNode).toBeDefined();
    expect(decisionNode?.type).toBe("decision");
  });

  it("should parse connections with labels", () => {
    const chart = `
      flowchart LR
        client -->|HTTP| gateway
        gateway -- REST --> service
        service --> postgres
    `;
    const result = parseMermaidFlowchart(chart);

    expect(result.links.length).toBe(3);

    expect(result.links[0]).toEqual({
      source: "client",
      target: "gateway",
      label: "HTTP",
    });

    expect(result.links[1]).toEqual({
      source: "gateway",
      target: "service",
      label: "REST",
    });

    expect(result.links[2]).toEqual({
      source: "service",
      target: "postgres",
    });
  });

  it("should parse subgraphs and parent bindings", () => {
    const chart = `
      flowchart TD
        subgraph ClientTier ["Client Apps"]
          client["Web App"]
        end
        subgraph BackendServices ["Backend Services"]
          service["PostService"]
        end
        client --> service
    `;
    const result = parseMermaidFlowchart(chart);

    expect(result.subgraphs.length).toBe(2);
    expect(result.subgraphs.find((s) => s.id === "ClientTier")?.label).toBe(
      "Client Apps",
    );
    expect(
      result.subgraphs.find((s) => s.id === "BackendServices")?.label,
    ).toBe("Backend Services");

    const clientNode = result.nodes.find((n) => n.id === "client");
    expect(clientNode?.parentId).toBe("ClientTier");

    const serviceNode = result.nodes.find((n) => n.id === "service");
    expect(serviceNode?.parentId).toBe("BackendServices");
  });
});
