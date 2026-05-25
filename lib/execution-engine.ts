/**
 * =============================================================================
 * ExecutionEngine.ts
 * =============================================================================
 *
 * WHAT IS THIS FILE?
 * ------------------
 * This is the "brain" of a visual workflow builder (like n8n or Zapier).
 * You build a graph of nodes connected by edges, and this engine runs them
 * in the correct order — as fast as possible — using parallel execution.
 *
 * CORE IDEA — think of it like a cooking recipe:
 *   - Each NODE is a task (chop onions, boil water, fry onions)
 *   - Each EDGE is a dependency ("you must chop onions BEFORE frying them")
 *   - The engine figures out which tasks can happen at the same time
 *     and which must wait for others to finish first.
 *
 * OUR RUNNING EXAMPLE (used in comments throughout this file):
 * ------------------------------------------------------------
 *   Nodes:  A (text)  B (text)  C (llm)  D (llm)
 *   Edges:  A → C     B → C     C → D
 *
 *   What this means:
 *     - A and B have no dependencies → they can run immediately, in parallel
 *     - C depends on BOTH A and B → it must wait for both to finish
 *     - D depends on C → it runs last, after C is done
 *
 *   Visual layout:
 *
 *       [A]  [B]          ← Step 1: run A and B at the same time
 *        \   /
 *         [C]             ← Step 2: run C once A and B are both done
 *          |
 *         [D]             ← Step 3: run D once C is done
 *
 * ALGORITHM USED: Kahn's Algorithm (topological sort with parallel batches)
 *   Each node tracks how many unfinished inputs it has ("in-degree").
 *   Nodes with in-degree = 0 are "ready" and can run immediately.
 *   When a node finishes, it decrements the in-degree of its dependents.
 *   If a dependent's in-degree drops to 0, it becomes ready too.
 * =============================================================================
 */

import { WorkflowNode, WorkflowEdge, NodeExecutionResult, ExecutionScope } from './types';
import { validateDAG, topologicalSort, getDependencies, getConnectedInputs } from './validation';

/**
 * StatusCallback — a function the engine calls whenever a node changes state.
 *
 * This is how the UI stays in sync with the execution. For example, when node C
 * starts running, the engine calls: onStatusChange("C", "running")
 * The UI can then show a spinner on node C.
 *
 * @param nodeId  - which node changed (e.g. "C")
 * @param status  - what happened ("running" | "success" | "failed" | "pending")
 * @param data    - optional output data when status is "success"
 *
 * Example call when node A finishes:
 *   onStatusChange("A", "success", { text: "Hello from node A" })
 */
type StatusCallback = (
  nodeId: string,
  status: NodeExecutionResult['status'],
  data?: Record<string, any>
) => void;


// =============================================================================
// CLASS: ExecutionEngine
// =============================================================================

export class ExecutionEngine {

  /**
   * All nodes in the workflow.
   *
   * Example: [
   *   { id: "A", data: { type: "text", text: "Hello" } },
   *   { id: "B", data: { type: "text", text: "World" } },
   *   { id: "C", data: { type: "llm", userMessage: "Summarize this" } },
   *   { id: "D", data: { type: "llm", userMessage: "Translate to Spanish" } }
   * ]
   */
  private nodes: WorkflowNode[];

  /**
   * All edges (connections) between nodes.
   * Each edge has a source (where data comes from) and a target (where it goes).
   *
   * Example: [
   *   { source: "A", target: "C", sourceHandle: "output", targetHandle: "text-input" },
   *   { source: "B", target: "C", sourceHandle: "output", targetHandle: "text-input" },
   *   { source: "C", target: "D", sourceHandle: "output", targetHandle: "text-input" }
   * ]
   */
  private edges: WorkflowEdge[];

  /**
   * Stores the raw output of each completed node, keyed by node ID.
   * This is used by gatherInputs() to feed a node's output into its dependents.
   *
   * After A runs:  results.get("A") → { text: "Hello" }
   * After B runs:  results.get("B") → { text: "World" }
   * After C runs:  results.get("C") → { text: "Hello World — summarized by LLM" }
   */
  private results: Map<string, any> = new Map();

  /**
   * Stores detailed execution metadata for each node (status, timing, errors).
   * This is what gets returned at the end of execute() for the caller to inspect.
   *
   * Example entry for node C after it succeeds:
   * {
   *   nodeId: "C",
   *   status: "success",
   *   outputs: { text: "LLM response..." },
   *   executionTime: 1230,  ← milliseconds
   *   startedAt: "2024-01-01T10:00:01.000Z",
   *   completedAt: "2024-01-01T10:00:02.230Z"
   * }
   */
  private nodeResults: Record<string, NodeExecutionResult> = {};

  /**
   * Optional callback for real-time UI status updates.
   * If provided, the engine calls this whenever a node starts, succeeds, or fails.
   * The UI can use this to show spinners, green checkmarks, or red error icons.
   */
  private onStatusChange?: StatusCallback;


  /**
   * Constructor — sets up the engine with the workflow graph.
   *
   * @param nodes          - all nodes to potentially execute
   * @param edges          - all connections between nodes
   * @param onStatusChange - optional UI update callback
   *
   * Example usage:
   *   const engine = new ExecutionEngine(
   *     [nodeA, nodeB, nodeC, nodeD],
   *     [edgeAC, edgeBC, edgeCD],
   *     (nodeId, status) => console.log(`${nodeId} is now ${status}`)
   *   );
   */
  constructor(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    onStatusChange?: StatusCallback
  ) {
    this.nodes = nodes;
    this.edges = edges;
    this.onStatusChange = onStatusChange;
  }


  // ===========================================================================
  // PUBLIC METHOD: execute()
  // ===========================================================================

  /**
   * The main entry point. Call this to run the workflow (or part of it).
   *
   * It validates the graph, figures out which nodes to run based on `scope`,
   * then delegates to executeParallel() for the actual work.
   *
   * @param scope           - how much to run:
   *                          'full'    → run all nodes (A, B, C, D)
   *                          'partial' → run only the nodes in selectedNodeIds
   *                          'single'  → run exactly one node
   * @param selectedNodeIds - which node IDs to run (only used for partial/single)
   *
   * @returns {
   *   success: true/false,
   *   results: { A: {...}, B: {...}, C: {...}, D: {...} },
   *   error: "optional error message"
   * }
   *
   * Example — run the full workflow:
   *   const result = await engine.execute('full');
   *   // result.results["C"].outputs.text → LLM response from node C
   *
   * Example — run only nodes C and D (assumes A and B already ran):
   *   const result = await engine.execute('partial', ['C', 'D']);
   */
  async execute(
    scope: ExecutionScope,
    selectedNodeIds?: string[]
  ): Promise<{
    success: boolean;
    results: Record<string, NodeExecutionResult>;
    error?: string;
  }> {

    // -------------------------------------------------------------------------
    // STEP 1: Validate the graph
    // -------------------------------------------------------------------------
    // Before running anything, make sure the graph has no cycles.
    // A cycle would mean: A depends on B, B depends on A → impossible to resolve.
    // Example of a VALID graph:   A → C → D   (no cycles, safe to run)
    // Example of an INVALID graph: A → B → A  (cycle! would loop forever)
    const validation = validateDAG(this.nodes, this.edges);
    if (!validation.isValid) {
      return {
        success: false,
        results: {},
        error: validation.error, // e.g. "Cycle detected between nodes A and B"
      };
    }

    // -------------------------------------------------------------------------
    // STEP 2: Decide which nodes to run based on scope
    // -------------------------------------------------------------------------
    let nodesToExecute: WorkflowNode[] = [];

    switch (scope) {
      case 'full':
        // Run everything: A, B, C, and D
        nodesToExecute = this.nodes;
        break;

      case 'partial':
        // Run only specific nodes. Example: run just C and D
        //   selectedNodeIds = ['C', 'D']
        //   nodesToExecute  = [nodeC, nodeD]
        nodesToExecute = this.nodes.filter(n => selectedNodeIds?.includes(n.id));
        break;

      case 'single':
        // Run exactly one node. Example: re-run just node C
        //   selectedNodeIds = ['C']
        //   nodesToExecute  = [nodeC]
        if (selectedNodeIds && selectedNodeIds.length === 1) {
          nodesToExecute = this.nodes.filter(n => n.id === selectedNodeIds[0]);
        }
        break;
    }

    // Guard: if we ended up with nothing to execute, bail early
    if (nodesToExecute.length === 0) {
      return {
        success: false,
        results: {},
        error: 'No nodes to execute',
      };
    }

    // -------------------------------------------------------------------------
    // STEP 3: Filter edges to only those between the nodes we're running
    // -------------------------------------------------------------------------
    // If we're only running C and D (partial scope), we only care about
    // the edge C → D. We drop the edges A → C and B → C because A and B
    // aren't in our execution set.
    //
    // Before filter (all edges): [A→C, B→C, C→D]
    // After filter (C,D only):   [C→D]
    //
    // Both the source AND the target must be in nodesToExecute for the edge to count.
    const filteredEdges = this.edges.filter(
      e =>
        nodesToExecute.some(n => n.id === e.source) &&
        nodesToExecute.some(n => n.id === e.target)
    );

    // -------------------------------------------------------------------------
    // STEP 4: Run the nodes using Kahn's parallel algorithm
    // -------------------------------------------------------------------------
    try {
      await this.executeParallel(nodesToExecute, filteredEdges);

      // All nodes finished successfully
      return {
        success: true,
        results: this.nodeResults,
      };
    } catch (error) {
      // At least one node threw an error — return what we have so far
      return {
        success: false,
        results: this.nodeResults, // still includes results from nodes that DID succeed
        error: error instanceof Error ? error.message : 'Execution failed',
      };
    }
  }


  // ===========================================================================
  // PRIVATE METHOD: executeParallel()
  // ===========================================================================

  /**
   * The core execution engine — runs nodes in parallel using Kahn's Algorithm.
   *
   * HOW KAHN'S ALGORITHM WORKS (simple version):
   * ---------------------------------------------
   * 1. Give each node an "in-degree" = number of incoming edges (unfinished inputs)
   *    Example:  A=0, B=0, C=2 (needs A and B), D=1 (needs C)
   *
   * 2. All nodes with in-degree = 0 are "ready" — launch them all at once
   *    Example:  Launch A and B simultaneously (both have degree 0)
   *
   * 3. When a node finishes, subtract 1 from the in-degree of each node it feeds into
   *    Example:  A finishes → C goes from 2 → 1
   *              B finishes → C goes from 1 → 0  ← C is now ready!
   *
   * 4. Newly ready nodes (degree just became 0) get launched
   *    Example:  C launches → runs the LLM call
   *
   * 5. Repeat until all nodes are done
   *    Example:  C finishes → D goes from 1 → 0 → D launches → D finishes → done!
   *
   * @param nodes - the nodes to run (already filtered by scope)
   * @param edges - the edges between those nodes (already filtered by scope)
   */
  private async executeParallel(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[]
  ): Promise<void> {

    // -------------------------------------------------------------------------
    // BUILD THE GRAPH DATA STRUCTURES
    // -------------------------------------------------------------------------

    /**
     * inDegree: how many unfinished inputs each node is waiting for.
     *
     * Initial state for our example:
     *   inDegree = { A: 0, B: 0, C: 0, D: 0 }  ← all start at 0
     *
     * After processing edges (A→C, B→C, C→D):
     *   inDegree = { A: 0, B: 0, C: 2, D: 1 }
     *                             ↑        ↑
     *                     A and B feed C   C feeds D
     */
    const inDegree = new Map<string, number>();

    /**
     * adjacencyList: for each node, which nodes does it feed into?
     * (i.e. who should get their in-degree decremented when this node finishes)
     *
     * Example:
     *   adjacencyList = {
     *     A: ["C"],   ← when A finishes, decrement C's in-degree
     *     B: ["C"],   ← when B finishes, decrement C's in-degree
     *     C: ["D"],   ← when C finishes, decrement D's in-degree
     *     D: []       ← D has no dependents
     *   }
     */
    const adjacencyList = new Map<string, string[]>();

    /**
     * nodeMap: quick lookup of a full WorkflowNode by its ID.
     * We need this inside executeNode() to get the node's data (type, config, etc.)
     *
     * Example: nodeMap.get("C") → { id: "C", data: { type: "llm", userMessage: "..." } }
     */
    const nodeMap = new Map<string, WorkflowNode>();

    // Initialize all nodes with degree 0 and empty neighbor lists
    nodes.forEach(node => {
      inDegree.set(node.id, 0);
      adjacencyList.set(node.id, []);
      nodeMap.set(node.id, node);
    });

    // Process each edge to build in-degrees and adjacency list
    // Edge A→C means: "A must finish before C can start"
    //   → add "C" to A's neighbor list
    //   → increment C's in-degree by 1
    edges.forEach(edge => {
      // Add the target to the source's neighbor list
      // e.g. edge A→C: adjacencyList.get("A") becomes ["C"]
      const neighbors = adjacencyList.get(edge.source) || [];
      neighbors.push(edge.target);
      adjacencyList.set(edge.source, neighbors);

      // Increment the target's in-degree
      // e.g. edge A→C: inDegree["C"] goes from 0 → 1
      // then edge B→C: inDegree["C"] goes from 1 → 2
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    });

    // After processing all edges for our example:
    // inDegree      = { A:0, B:0, C:2, D:1 }
    // adjacencyList = { A:["C"], B:["C"], C:["D"], D:[] }

    // -------------------------------------------------------------------------
    // TRACKING STATE DURING EXECUTION
    // -------------------------------------------------------------------------

    /**
     * completed: nodes that have fully finished (success or failed).
     * The while-loop exits when completed.size === nodes.length.
     *
     * Progress through our example:
     *   After step 1: completed = { "A", "B" }
     *   After step 2: completed = { "A", "B", "C" }
     *   After step 3: completed = { "A", "B", "C", "D" } ← loop exits
     */
    const completed = new Set<string>();

    /**
     * inProgress: nodes currently running (async, not yet finished).
     * Used to avoid launching the same node twice and to detect when
     * we're waiting for in-flight nodes to complete.
     *
     * During step 1: inProgress = { "A", "B" }
     * After A finishes first: inProgress = { "B" }
     */
    const inProgress = new Set<string>();

    /**
     * hasError / errorMessage: if ANY node fails, we record it here
     * and stop the whole workflow on the next loop iteration.
     *
     * Example: if node C fails (LLM API error), hasError becomes true
     * and the next loop iteration throws, which means D never runs.
     */
    let hasError = false;
    let errorMessage = '';


    // -------------------------------------------------------------------------
    // HELPER: tryLaunchReady()
    // -------------------------------------------------------------------------

    /**
     * Scans inDegree and returns all node IDs that are ready to run right now.
     * A node is ready when ALL THREE conditions are true:
     *   1. inDegree === 0  (all its inputs are satisfied)
     *   2. not already in progress
     *   3. not already completed
     *
     * Example — called at the very start:
     *   inDegree = { A:0, B:0, C:2, D:1 }
     *   Returns: ["A", "B"]   ← only A and B have degree 0
     *
     * Example — called after A and B finish:
     *   inDegree = { A:0, B:0, C:0, D:1 }  ← C was decremented twice
     *   completed = { "A", "B" }
     *   Returns: ["C"]   ← C has degree 0 and isn't completed yet
     */
    const tryLaunchReady = (): string[] => {
      const ready: string[] = [];
      for (const [nodeId, degree] of inDegree.entries()) {
        if (
          degree === 0 &&
          !completed.has(nodeId) &&
          !inProgress.has(nodeId)
        ) {
          ready.push(nodeId);
        }
      }
      return ready;
    };


    // -------------------------------------------------------------------------
    // HELPER: executeNode()
    // -------------------------------------------------------------------------

    /**
     * Runs a single node from start to finish:
     *   1. Mark it as in-progress, fire the UI "running" callback
     *   2. Gather inputs from upstream nodes (from this.results map)
     *   3. Run the actual node logic (LLM call, image crop, etc.)
     *   4. Store the output in this.results and this.nodeResults
     *   5. Fire the UI "success" or "failed" callback
     *   6. In the finally block: mark as completed and decrement downstream in-degrees
     *
     * Example — executing node C:
     *   inputs = { "text-input": { text: "Hello" } }   ← from node A (via gatherInputs)
     *            + the B output also gets merged in
     *   output = { text: "LLM response combining A and B" }
     *   this.results.set("C", { text: "LLM response..." })
     *   inDegree["D"] goes from 1 → 0  ← D is now ready to launch
     */
    const executeNode = async (nodeId: string): Promise<void> => {
      const node = nodeMap.get(nodeId);
      if (!node) return; // safety check — should never happen

      // Mark as in-progress so tryLaunchReady() doesn't pick it up again
      inProgress.add(nodeId);
      const startTime = Date.now(); // used to calculate executionTime later

      // Notify the UI: "node C is now running" → show spinner on node C
      this.onStatusChange?.(nodeId, 'running');

      try {
        // Collect the outputs of all upstream nodes that feed into this node.
        // For node C: inputs = { "text-input": {text:"Hello"}, "text-input": {text:"World"} }
        const inputs = this.gatherInputs(nodeId);

        // Actually run the node (LLM API call, image crop, frame extract, etc.)
        // This is async and can take anywhere from milliseconds (text node)
        // to several seconds (LLM call or video frame extraction).
        const output = await this.runNode(node, inputs);

        // Store the raw output so downstream nodes can read it via gatherInputs()
        // e.g. this.results.set("C", { text: "LLM summary of A and B" })
        this.results.set(nodeId, output);

        // Store detailed execution metadata for the final results object
        this.nodeResults[nodeId] = {
          nodeId,
          status: 'success',
          outputs: output,
          executionTime: Date.now() - startTime, // e.g. 1230 (ms)
          startedAt: new Date(startTime).toISOString(),
          completedAt: new Date().toISOString(),
        };

        // Notify the UI: "node C succeeded" → show green checkmark
        this.onStatusChange?.(nodeId, 'success', output);

      } catch (error) {
        // Node failed (e.g. LLM API returned a 500 error for node C)
        this.nodeResults[nodeId] = {
          nodeId,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          executionTime: Date.now() - startTime,
          startedAt: new Date(startTime).toISOString(),
          completedAt: new Date().toISOString(),
        };

        // Notify the UI: "node C failed" → show red error icon on node C
        this.onStatusChange?.(nodeId, 'failed');

        // Set the error flag — the while-loop will read this on its next iteration
        // and throw, which prevents node D from ever running.
        hasError = true;
        errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Re-throw so Promise.all() knows this promise rejected
        throw error;

      } finally {
        // This block ALWAYS runs, whether the node succeeded or failed.

        // Remove from in-progress tracking
        inProgress.delete(nodeId);
        // Add to completed (we're done with this node regardless of outcome)
        completed.add(nodeId);

        // *** THE KEY KAHN'S STEP ***
        // Decrement the in-degree of every node that was waiting on this one.
        //
        // Example — node A just finished:
        //   adjacencyList.get("A") → ["C"]
        //   inDegree["C"] was 2 → now becomes 1
        //
        // Example — node B just finished:
        //   adjacencyList.get("B") → ["C"]
        //   inDegree["C"] was 1 → now becomes 0  ← C is now READY!
        const neighbors = adjacencyList.get(nodeId) || [];
        for (const neighbor of neighbors) {
          const currentDegree = inDegree.get(neighbor) || 0;
          inDegree.set(neighbor, currentDegree - 1);
        }
      }
    };


    // -------------------------------------------------------------------------
    // MAIN EXECUTION LOOP
    // -------------------------------------------------------------------------
    /**
     * This loop keeps running until every node has been completed.
     * Each iteration it checks: "are any nodes ready right now?"
     *
     * Walk-through for our A, B, C, D example:
     *
     * --- Iteration 1 ---
     *   completed = {}  (0 of 4 done) → keep looping
     *   hasError = false → continue
     *   tryLaunchReady() → ["A", "B"]  (both have inDegree 0)
     *   Promise.all([executeNode("A"), executeNode("B")])
     *     → A and B run at the same time
     *     → both finish → inDegree["C"] decremented twice: 2 → 1 → 0
     *     → completed = {"A", "B"}
     *
     * --- Iteration 2 ---
     *   completed = {"A","B"}  (2 of 4 done) → keep looping
     *   hasError = false → continue
     *   tryLaunchReady() → ["C"]  (inDegree["C"] is now 0)
     *   Promise.all([executeNode("C")])
     *     → C runs its LLM API call (1-2 seconds)
     *     → C finishes → inDegree["D"] decremented: 1 → 0
     *     → completed = {"A", "B", "C"}
     *
     * --- Iteration 3 ---
     *   completed = {"A","B","C"}  (3 of 4 done) → keep looping
     *   hasError = false → continue
     *   tryLaunchReady() → ["D"]  (inDegree["D"] is now 0)
     *   Promise.all([executeNode("D")])
     *     → D runs its LLM API call
     *     → D finishes → completed = {"A", "B", "C", "D"}
     *
     * --- Iteration 4 ---
     *   completed.size (4) === nodes.length (4) → EXIT LOOP ✓
     */
    while (completed.size < nodes.length) {

      // If a node threw an error in a previous iteration, stop everything.
      // Example: if C failed, we throw here and D never gets to run.
      if (hasError) {
        throw new Error(errorMessage);
      }

      // Ask: which nodes are ready to run right now?
      const readyNodes = tryLaunchReady();

      // Special case: nothing is ready AND nothing is running.
      // This can only happen if the graph has disconnected components that
      // we can't reach. Break out to avoid an infinite loop.
      // Example: if the graph is [A→B] and [C] (no connection to C),
      // and C's in-degree was somehow never set to 0, we'd get stuck here.
      if (readyNodes.length === 0 && inProgress.size === 0) {
        break; // No more nodes to execute — exit gracefully
      }

      // Some nodes are still running (inProgress is not empty) but nothing
      // new is ready yet. This is the "waiting" state — we sleep briefly
      // and try again in 100ms.
      //
      // Example: A is still running (slow), B finished already, C is waiting
      // for A. Nothing new to launch. We wait 100ms and check again.
      if (readyNodes.length === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
        continue; // Go back to the top of the while-loop
      }

      // We have nodes ready to run → launch them ALL at the same time!
      // Promise.all() starts them simultaneously and waits for all to finish
      // before moving to the next iteration of the while-loop.
      //
      // Example first iteration: readyNodes = ["A", "B"]
      //   → executeNode("A") and executeNode("B") both start immediately
      //   → we wait for BOTH to finish before the loop continues
      await Promise.all(readyNodes.map(nodeId => executeNode(nodeId)));
    }
    // When the while-loop exits, all nodes have been completed (or we hit an error).
  }


  // ===========================================================================
  // PRIVATE METHOD: gatherInputs()
  // ===========================================================================

  /**
   * Collects the stored outputs of all upstream nodes that connect to `nodeId`,
   * and returns them as a map keyed by the handle name.
   *
   * This is how data flows through the graph. When node C is about to run,
   * this function reads A's output and B's output from this.results and
   * packages them into the `inputs` object that runNode() will receive.
   *
   * @param nodeId - the node we're about to run (e.g. "C")
   * @returns an object like:
   *   {
   *     "text-input": { text: "Hello" }       ← output of A
   *     "text-input": { text: "World" }       ← output of B
   *   }
   *
   * HOW IT WORKS:
   *   getConnectedInputs("C", edges) returns a Map like:
   *     { "text-input" → "A", "text-input" → "B" }
   *     (handle name → source node ID)
   *
   *   We then look up each source node's output in this.results:
   *     this.results.get("A") → { text: "Hello" }
   *     this.results.get("B") → { text: "World" }
   *
   * NOTE: if a source node hasn't run yet, its output won't be in this.results,
   * so that input handle will simply be absent. Kahn's algorithm prevents this
   * from happening — a node only runs after ALL its inputs are ready.
   */
  private gatherInputs(nodeId: string): Record<string, any> {
    // getConnectedInputs returns: Map<handleName, sourceNodeId>
    // Example for node C: Map { "text-input" → "A", "text-input" → "B" }
    const connections = getConnectedInputs(nodeId, this.edges);
    const inputs: Record<string, any> = {};

    connections.forEach((sourceNodeId, handle) => {
      // Look up the actual output data that the source node produced
      const sourceOutput = this.results.get(sourceNodeId);
      if (sourceOutput) {
        // e.g. inputs["text-input"] = { text: "Hello" }
        inputs[handle] = sourceOutput;
      }
    });

    return inputs;
    // For node C, returns: { "text-input": { text: "Hello" }, ... }
  }


  // ===========================================================================
  // PRIVATE METHOD: runNode()
  // ===========================================================================

  /**
   * The actual execution logic for each node type.
   * This is a big switch statement — each case handles one kind of node.
   *
   * Think of this as the "worker" function. The rest of the engine handles
   * scheduling and ordering; this function just does the real work.
   *
   * @param node   - the node to run (has type, config, static data)
   * @param inputs - the collected outputs from upstream nodes (from gatherInputs)
   * @returns      - the node's output (varies by type)
   *
   * Return shapes by type:
   *   text         → { text: string }
   *   upload-image → { imageUrl: string }
   *   upload-video → { videoUrl: string }
   *   llm          → { text: string }   ← LLM response
   *   crop-image   → { imageUrl: string } ← cropped image URL
   *   extract-frame → { imageUrl: string } ← extracted video frame URL
   */
  private async runNode(
    node: WorkflowNode,
    inputs: Record<string, any>
  ): Promise<any> {

    switch (node.data.type) {

      // -----------------------------------------------------------------------
      // CASE: text
      // -----------------------------------------------------------------------
      /**
       * The simplest node — just returns its static text content.
       * No async, no API calls. Finishes instantly.
       *
       * Example — node A:
       *   node.data.text = "Hello from node A"
       *   returns: { text: "Hello from node A" }
       *
       * This output then sits in this.results.get("A") until node C needs it.
       */
      case 'text':
        return { text: node.data.text };


      // -----------------------------------------------------------------------
      // CASE: upload-image
      // -----------------------------------------------------------------------
      /**
       * Returns the URL of a previously uploaded image.
       * The image was already uploaded by the user when building the workflow.
       *
       * Example:
       *   node.data.imageUrl = "https://storage.example.com/img/abc123.jpg"
       *   returns: { imageUrl: "https://storage.example.com/img/abc123.jpg" }
       */
      case 'upload-image':
        return { imageUrl: node.data.imageUrl };


      // -----------------------------------------------------------------------
      // CASE: upload-video
      // -----------------------------------------------------------------------
      /**
       * Returns the URL of a previously uploaded video.
       *
       * Example:
       *   node.data.videoUrl = "https://storage.example.com/video/xyz.mp4"
       *   returns: { videoUrl: "https://storage.example.com/video/xyz.mp4" }
       */
      case 'upload-video':
        return { videoUrl: node.data.videoUrl };


      // -----------------------------------------------------------------------
      // CASE: llm
      // -----------------------------------------------------------------------
      /**
       * Sends a prompt to an LLM (Claude, GPT, etc.) and returns the response.
       *
       * BEFORE calling the API, it merges inputs from connected nodes:
       *   - "text-input" handle       → prepend that text to the user message
       *   - "image-input" handle      → add image to the request
       *   - "system-prompt-input"     → override the system prompt
       *   - "default" handle          → smart merge (text or image)
       *
       * Example — node C in our workflow:
       *   node.data.userMessage = "Summarize this for me"
       *   inputs["text-input"] = { text: "Hello" }     ← from node A
       *   (assume B also connects via "default")
       *   inputs["default"]    = { text: "World" }     ← from node B
       *
       *   After merging:
       *     finalMessage = "Hello\n\nWorld\n\nSummarize this for me"
       *
       *   POSTs to /api/execute/llm → returns { text: "LLM response here" }
       */
      case 'llm': {
        // Start with whatever message the user typed directly on node C
        let finalMessage = node.data.userMessage || '';

        // Start with any images the user attached directly to node C
        const connectedImages: string[] = [...(node.data.images || [])];

        // Merge inputs from all upstream connections
        Object.entries(inputs).forEach(([handle, value]) => {

          // A text node (A or B) connected via "text-input" handle:
          // Prepend its text before the user's message.
          // Example: finalMessage becomes "Hello\n\nSummarize this for me"
          if (handle === 'text-input' && value?.text) {
            finalMessage = `${value.text}\n\n${finalMessage}`;
          }

          // An image node connected via "image-input" or "image-input-2":
          // Add its URL to the images array to send alongside the text.
          if ((handle === 'image-input' || handle === 'image-input-2') && value?.imageUrl) {
            connectedImages.push(value.imageUrl);
          }

          // A text node connected to the "system-prompt-input" handle:
          // Use it to override the system prompt entirely.
          // Example: connect a text node saying "You are a translator" to set the system role.
          if (handle === 'system-prompt-input' && value?.text) {
            node.data.systemPrompt = value.text; // override
          }

          // A "default" connection — handles both text and image gracefully.
          // This is a catch-all for connections that don't specify a named handle.
          if (handle === 'default') {
            if (value?.text) {
              finalMessage = `${value.text}\n\n${finalMessage}`;
            }
            if (value?.imageUrl) {
              connectedImages.push(value.imageUrl);
            }
          }
        });

        // Now make the actual API call to the LLM backend
        // Payload example:
        // {
        //   model: "claude-3-5-sonnet",
        //   systemPrompt: "You are a helpful assistant",
        //   userMessage: "Hello\n\nWorld\n\nSummarize this for me",
        //   images: []
        // }
        const response = await fetch('/api/execute/llm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: node.data.model,
            systemPrompt: node.data.systemPrompt,
            userMessage: finalMessage,
            images: connectedImages,
          }),
        });

        if (!response.ok) {
          // Try to extract a meaningful error message from the response body
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || 'LLM execution failed');
        }

        const result = await response.json();
        // result.text = "The LLM's response to the prompt"
        return { text: result.text };
      }


      // -----------------------------------------------------------------------
      // CASE: crop-image
      // -----------------------------------------------------------------------
      /**
       * Crops an image to a specific rectangle and returns the new image URL.
       *
       * Gets the input image from (in priority order):
       *   1. The "default" handle (a generic connection)
       *   2. The "image-input" handle (an explicit image connection)
       *   3. The imageUrl stored directly on the node's data
       *
       * Example:
       *   inputs["image-input"] = { imageUrl: "https://.../photo.jpg" }
       *   node.data = { x: 100, y: 50, width: 300, height: 200 }
       *
       *   POSTs to /api/execute/crop-image
       *   Returns: { imageUrl: "https://.../cropped-photo.jpg" }
       */
      case 'crop-image': {
        const imageUrl =
          inputs['default']?.imageUrl ||
          inputs['image-input']?.imageUrl ||
          node.data.imageUrl;

        if (!imageUrl) {
          throw new Error('No image URL provided for crop operation');
        }

        const response = await fetch('/api/execute/crop-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl,
            x: node.data.x,         // e.g. 100  ← left edge of crop box
            y: node.data.y,         // e.g. 50   ← top edge of crop box
            width: node.data.width,   // e.g. 300  ← width of crop box
            height: node.data.height, // e.g. 200  ← height of crop box
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || 'Crop image execution failed');
        }

        const result = await response.json();
        return { imageUrl: result.croppedImageUrl };
      }


      // -----------------------------------------------------------------------
      // CASE: extract-frame
      // -----------------------------------------------------------------------
      /**
       * Extracts a single frame from a video at a specific timestamp.
       * This is the most complex case because the extraction happens asynchronously
       * on the server (using FFmpeg) and can take several seconds.
       *
       * TWO-PHASE PATTERN:
       *   Phase 1 — Trigger: POST to /api/execute/extract-frame → get back a runId
       *   Phase 2 — Poll:    GET /api/execute/status?runId=... every 2 seconds
       *                      until the job is COMPLETED or FAILED
       *
       * Example:
       *   inputs["video-input"] = { videoUrl: "https://.../video.mp4" }
       *   node.data = { timestampMode: "percentage", percentage: 50 }
       *               → extract the frame at the 50% point of the video
       *
       *   Phase 1: POST → { runId: "job_abc123" }
       *   Phase 2: Poll every 2s:
       *     attempt 1: { status: "RUNNING" }  → wait 2s, try again
       *     attempt 2: { status: "RUNNING" }  → wait 2s, try again
       *     attempt 3: { status: "COMPLETED", output: { frameUrl: "https://.../frame.jpg" } }
       *   Returns: { imageUrl: "https://.../frame.jpg" }
       *
       * Timeout: if status never becomes COMPLETED after 30 attempts (60 seconds), throw.
       */
      case 'extract-frame': {
        // Resolve the video URL from inputs or the node's own data
        const videoUrl =
          inputs['default']?.videoUrl ||
          inputs['video-input']?.videoUrl ||
          node.data.videoUrl;

        if (!videoUrl) {
          throw new Error('No video URL provided for frame extraction');
        }

        // --- PHASE 1: Trigger the async extraction job ---
        // Build the payload — either use a percentage (e.g. 50% through the video)
        // or an absolute timestamp (e.g. 30.5 seconds into the video)
        const extractPayload: any = { videoUrl };
        if (node.data.timestampMode === 'percentage') {
          extractPayload.percentage = node.data.percentage ?? 0;
          // Example: { videoUrl: "...", percentage: 50 }
        } else {
          extractPayload.timestamp = node.data.timestamp ?? 0;
          // Example: { videoUrl: "...", timestamp: 30.5 }
        }

        const response = await fetch('/api/execute/extract-frame', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(extractPayload),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || 'Extract frame trigger failed');
        }

        // Server responds immediately with a job ID (the actual work happens in background)
        // Example: { runId: "job_abc123" }
        const { runId, error: triggerError } = await response.json();
        if (triggerError) throw new Error(triggerError);

        // --- PHASE 2: Poll until the job finishes ---
        // We wrap this in a Promise so we can use setInterval (callback-based)
        // but still await it like a normal async call.
        const frameUrl = await new Promise<string>((resolve, reject) => {
          let attempts = 0;

          const poll = setInterval(async () => {
            attempts++;

            // Safety net: after 30 attempts × 2 seconds = 60 seconds, give up
            if (attempts > 30) {
              clearInterval(poll);
              reject(new Error('Extract frame timed out'));
              return;
            }

            try {
              // Check job status: GET /api/execute/status?runId=job_abc123
              const statusRes = await fetch(`/api/execute/status?runId=${runId}`);
              const result = await statusRes.json();

              if (result.status === 'COMPLETED') {
                // Job is done! Extract the frame URL from the result.
                clearInterval(poll); // stop polling
                const url = result.output?.frameUrl;
                if (!url) reject(new Error('No frame URL in output'));
                else resolve(url); // e.g. "https://.../frame_at_50pct.jpg"

              } else if (result.status === 'FAILED') {
                // FFmpeg job crashed on the server
                clearInterval(poll);
                reject(new Error('FFmpeg failed'));
              }
              // If status is still "RUNNING", we do nothing — setInterval fires again in 2s

            } catch (err) {
              // Network error while polling — give up immediately
              clearInterval(poll);
              reject(err);
            }
          }, 2000); // poll every 2000ms = 2 seconds
        });

        // frameUrl is now resolved (e.g. "https://.../frame.jpg")
        return { imageUrl: frameUrl };
      }


      // -----------------------------------------------------------------------
      // DEFAULT: unknown node type
      // -----------------------------------------------------------------------
      /**
       * If a node type is added to the graph but not handled here, throw an error.
       * This prevents silent failures where a node just does nothing.
       *
       * Example: if someone adds a "send-email" node type but forgets to add
       * a case for it here, they'll get:
       *   Error: Unknown node type: send-email
       */
      default:
        throw new Error(`Unknown node type: ${(node.data as any).type}`);
    }
  }
}
