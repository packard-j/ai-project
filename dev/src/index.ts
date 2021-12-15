import fc from "fast-check";
import { SearchAgent } from "./ai";
import { List } from "immutable";
import { stringify } from "csv";
import { arbitraryProblem } from "./generator";
import fs from "fs";
import { defaultFeatureVectors } from "./ai/features";
import { Agent } from "./ai/Agent";
import { RandomAssignmentAgent } from "./ai/RandomAssignmentAgent";
import { LocalSearchAgent } from "./ai/LocalSearchAgent";
import { Inventory, Order } from "./model";

const agents: Agent[] = [new RandomAssignmentAgent(), new LocalSearchAgent(10), new LocalSearchAgent(1000), new SearchAgent()];
const nonOptimalAgents: Agent[] = agents.slice(0, 3)

const document = stringify({ columns: ["Agent", "Products", "Orders", "Products * Orders", "Runtime (ms)", "Evaluation"], header: true });
const file = fs.createWriteStream("tests.csv");
document.pipe(file);
document.pipe(process.stdout);

function runProblem(agents: Agent[], orders: Order[], inventory: Inventory) {
  agents.forEach(agent => {
    const start = new Date().getTime();
    const finalState = agent.assign(List(orders), inventory, defaultFeatureVectors);
    const duration = new Date().getTime() - start;
    document.write([
      agent.name, inventory.products().size, orders.length,
      inventory.products().size * orders.length,
      duration,
      finalState.evaluate(defaultFeatureVectors)
    ]);
  })
}

// run all agents on smaller problems
fc.assert(fc.property(arbitraryProblem(4, {min:1, max: 5}, {min: 1, max: 5}), ([orders, inventory]) => {
  runProblem(agents, orders, inventory);
}), { numRuns: 100, seed: 0 });

// run non-optimal agents on larger problems
fc.assert(fc.property(arbitraryProblem(4, {min: 6, max: 10}, {min: 6, max: 10}), ([orders, inventory]) => {
  runProblem(nonOptimalAgents, orders, inventory);
}), { numRuns: 100, seed: 0 });

document.end();
