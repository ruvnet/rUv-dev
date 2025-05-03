 

# Implementation Plan for a Recursive-Reflection Multi‑Layer AI Agent (Mastra agGI Framework)

## Overview of the Multi‑Layer Reflection Architecture (LS1–LS3)

&#x20;**Figure 1:** *Basic two-layer reflection loop.* An initial response is **generated** and then **reflected** upon (critiqued) in a loop to refine the output. This reflection pattern gives the LLM multiple attempts to improve its answer by spotting flaws or omissions, akin to engaging a slower, “System 2” reasoning process on top of the fast instinctive response. We extend this idea with a **three-layer recursive reflection (LS1–LS3)** architecture that adds a third **evaluation** layer and integrates long-term memory. The layers are:

* **LS1 (Generator):** Generates an initial answer based on the user’s prompt (analogous to a System‑1 response).
* **LS2 (Critic/Reflector):** Analyzes LS1’s answer, offering **critiques, suggestions, and corrections**. This reflective critique is grounded in the prompt and the answer, potentially pointing out errors, missing info, or ways to improve clarity (like a teacher giving feedback).
* **LS3 (Evaluator/Scorer):** Evaluates the answer (and possibly the critique) for quality metrics – e.g. **coherence, novelty, efficiency** – and assigns a score. LS3 determines if the answer is good enough or if another iteration is needed. It embodies a “self-evaluation” layer to decide when to stop refining.

These layers operate **recursively**: LS1 produces an answer, LS2 reflects on it, LS3 scores it, and if the score is below a threshold, the system **re-prompts LS1 with the feedback** to generate a revised answer. This orchestrated cycle (Generate → Reflect → Score → Refine) may repeat multiple times until an acceptable answer emerges or a max iteration is reached. Such reflection-driven reprocessing trades extra compute time for improved answer quality, which is worthwhile for complex queries where quality trumps latency.

### Orchestrator Loop and Controller Flow (LangGraph/SPARC-Style)

To coordinate these layers, we implement an **orchestrator loop** that manages the sequence of steps and decisions. This controller can be modeled as a directed graph of states (inspired by LangGraph’s workflow graphs) with conditional transitions (similar to a SPARC scheduling approach) to handle looping and termination. Pseudocode for the orchestrator loop is given below:

```typescript
// Pseudocode for orchestrator loop (LS1: generate, LS2: reflect, LS3: score)
function orchestrateRecursiveQA(prompt: string): string {
  let iteration = 0;
  let bestAnswer = "";
  let feedback = "";
  let score = 0;
  const maxIterations = 3;
  const targetScore = 8;  // e.g., require score >= 8/10

  while (iteration < maxIterations) {
    iteration++;
    // 1. LS1: Generate answer (using Requesty.ai API)
    const answer = await LLM.generateAnswer(prompt + feedback);
    // 2. LS2: Reflect on answer (critic review via LLM)
    const critique = await LLM.generateCritique(prompt, answer);
    // 3. LS3: Score the answer for quality metrics
    score = await LLM.scoreAnswer(prompt, answer, critique);
    bestAnswer = answer;
    if (score < targetScore) {
      // 4. Re-prompt LS1 with feedback appended (prompt chaining)
      feedback = "\nCritique:\n" + critique + "\nPlease refine your answer accordingly.\n";
      continue;  // loop for another iteration with revised prompt
    } else {
      break;     // answer is good enough to finalize
    }
  }
  return bestAnswer;
}
```

In this loop, after each **emit** (answer generation) we **reflect** using a critic prompt, then **score** the result. If the score indicates the answer isn’t good enough, we **augment the prompt with the critique** and re-run LS1 (this is a form of prompt chaining). The orchestrator thus dynamically schedules the next “edge” in the workflow graph: normally the path goes from Generate to Reflect to Score, then either back to Generate (if not satisfied) or to End. This design is analogous to LangGraph’s conditional edges controlling loop execution. For example, in LangGraph one might add a conditional edge from a “revise” node back to generation based on a stop condition – here our stop condition is the score threshold or max iterations.

**Controller Flow:** The controlling logic ensures efficient use of iterations. We will prune reflection loops if they yield diminishing returns – e.g. if LS2’s critique in two consecutive rounds is very similar or the **embedding divergence** between successive answers is low (indicating little new information). We can quantify divergence by comparing embeddings of the answers/critiques and computing a Jensen–Shannon distance; if the content change is minimal, the loop breaks to avoid waste. Additionally, the controller can adjust which model to use at each layer for efficiency (for instance, a smaller, faster model for reflection and scoring, and a larger model for final answer). The use of a graph-based scheduler makes it easy to extend or modify the flow (e.g., adding a tool-use node in the loop) by simply adding nodes/edges, thanks to the agentic workflow design.

## Key Components and Integration

### LLM Interface via Requesty.ai API

All interactions with language models (generating answers, critiques, and evaluations) will use the **Requesty.ai** API. Requesty provides a **unified routing layer over multiple LLMs**, automatically directing requests to the optimal model for a given task. This means our agent can leverage different underlying models (OpenAI GPT-4, Anthropic Claude, etc.) through one API, and Requesty will handle selecting the best one (and provide logging, cost management, etc., out of the box).

**Usage:** We will configure an API client with our Requesty API key (stored in `.env`). For example, we might use `fetch` or Axios to call Requesty’s completion endpoint. Pseudocode for a Requesty call:

```typescript
// Example: call Requesty router for a completion
const response = await fetch("https://api.requesty.ai/v1/completion", {
  method: "POST",
  headers: { "Authorization": `Bearer ${REQUESTY_API_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "router",   // use Requesty Router to auto-select model
    prompt: userPrompt,
    max_tokens: 512,
    temperature: 0.7
  })
});
const result = await response.json();
const answerText = result.choices[0].text;
```

In practice, we will likely use the official Requesty SDK or a lightweight wrapper for convenience (if available), but the above illustrates the idea. We’ll create utility functions for each type of LLM call: e.g. `llm.generateAnswer(prompt)`, `llm.generateCritique(prompt, answer)`, and `llm.scoreAnswer(prompt, answer, critique)`. Each will call Requesty with an appropriate prompt template. For instance, `generateCritique` might send a prompt like: *“Critique the following answer for correctness, completeness, and style… \[answer] … Provide specific feedback.”*; and `scoreAnswer` might use a prompt to ask the model to **rate the answer’s coherence, novelty, and efficiency** on a scale, or directly produce a combined score. (We could also implement `scoreAnswer` as a specialized prompt that asks for three separate scores and then compute an aggregate.) All these prompts and their parameters will be configurable for tuning.

Using Requesty ensures that if one model fails or is overloaded, the router can fallback to another, maintaining high availability. It also allows easy switching of models (say, using a faster model during reflection, and a more powerful model for final answers) without changing our code – we can just adjust Requesty parameters or routes. The Requesty API key and preferred model settings will be placed in the `.env` config for flexibility.

### Vector Memory with Mem0 for Long-Term Memory

To give our agent persistence and the ability to learn from past interactions, we integrate **Mem0** as a vector memory store. **Mem0** is a *“self-improving memory layer for LLM applications”* that enables storing embeddings of conversational context and retrieving them later to provide the model with relevant information. By using Mem0, our agent can remember previous prompts and solutions, avoiding repeated mistakes and reusing successful reasoning patterns, thereby *“enhancing future conversations”* with context-rich responses.

**Storage:** After each cycle (or at least after finalizing an answer), we will **embed** key pieces of data and store them in Mem0. Specifically, we will take the user’s prompt, the final answer, and possibly the reflection notes, compute vector embeddings for each (using an embedding model like OpenAI’s text-embedding model or similar, which Mem0 can do under the hood), and store them as “memories.” Each memory entry will include metadata tags:

* `layer`: which layer or stage it came from (e.g., “LS1\_answer”, “LS2\_critique”),
* `prompt_id`: an identifier for the conversation or query,
* `score`: the evaluation score the answer received (so we know how good that attempt was).

Mem0’s Node SDK provides a simple interface to add and search memories. We’ll initialize Mem0 in our project (e.g. `npm install mem0ai`). For example:

```typescript
import { Memory } from 'mem0ai/oss';
const memory = new Memory({
  embedder: { provider: 'openai', config: { apiKey: process.env.OPENAI_API_KEY, model: 'text-embedding-3-small' } },
  vectorStore: { provider: 'memory', config: { collectionName: 'agent_memories', dimension: 1536 } }
});
// ... after generating an answer:
await memory.add(
  [{ role: "user", content: prompt }, { role: "assistant", content: answer }], 
  { metadata: { layer: "LS1", promptId: currentPromptId, score: finalScore } }
);
```

In this code, Mem0 will handle obtaining embeddings for the user prompt and assistant answer, and store them in an internal vector store (here using an in-memory vector DB with 1536-dim embeddings typical of OpenAI models). We would likely use a more persistent vector DB in production (Mem0 can integrate with many vector DBs or use its own persistence), but for simplicity a local store or in-memory collection suffices during development.

**Retrieval:** When a new prompt comes in or when the agent is reflecting, we can query Mem0 for relevant past knowledge. For example, before generating an answer, we might retrieve the top 3 most similar past prompts or Q\&A pairs:

```typescript
const similarMemories = await memory.search(currentPrompt, { metadata: { layer: "LS1" }, topK: 3 });
similarMemories.forEach(mem => {
   context += `\nPrevious Q: ${mem.messages[0].content}\nPrevious A: ${mem.messages[1].content}\n(Note: that answer had score ${mem.metadata.score})\n`;
});
```

Here, `memory.search(query, filters)` finds the stored memories whose embeddings are nearest to the query embedding. We filter by `layer: "LS1"` to retrieve past final answers (rather than critiques). Each retrieved memory’s content can be fed into the context for the LLM (perhaps summarized to avoid length issues) so that the agent can draw on relevant prior knowledge. We also see the prior score; if a similar question had a low-scoring answer previously, the agent knows to attempt a different approach this time (learning from mistakes), whereas if a prior answer was high-scoring, it might reuse that reasoning.

Mem0 thus serves as the agent’s **episodic memory**. Over time, this vector memory will grow, and Mem0’s optimizations (like forgetting less useful info or compressing older memories) can be applied. In our plan, we will implement basic storing and retrieval by tag. The tags `{layer, prompt_id, score}` attached to each memory allow us to target specific types of memories. For example, we might store multiple intermediate attempts for a given prompt\_id and later retrieve only the best one (highest score) to avoid clutter. We will ensure to **prune or compress memory** as needed – e.g., if many similar memories accumulate, we might remove those with low scores or use Jensen–Shannon divergence on their embeddings to merge duplicates.

### Model Context Protocol (MCP) Integration – SSE Stream and Discovery

We will make our agent accessible as an MCP-compliant AI service. **Model Context Protocol (MCP)** is an emerging standard that lets AI clients discover and interact with AI agents/tools in a uniform way. By integrating MCP, our agent can be easily plugged into compatible clients or orchestrators. There are two main parts to this integration:

* **Server-Sent Events (SSE) Streaming Endpoint (`/sse`):** We will provide a streaming API for the agent’s responses. Streaming allows tokens to be sent to the client as they are generated, improving responsiveness. Using Express, we’ll create a route (e.g. `GET /sse`) that upgrades the connection to an SSE stream. When a client connects, we’ll initiate the orchestrator loop for the given prompt (the prompt can be passed as a query param or the body of the request, depending on design). As the LLM generates tokens for the answer, we write them to the SSE stream (`res.write('data: ' + token + '\n\n')`). We will also stream intermediate reflections or tool calls if needed, using event identifiers – for example, we might send events like `event: critique` for reflection text, or simply include everything in one stream of the final answer for simplicity. Once the answer is complete (or the loop ends), we send a termination signal (`res.write('data: [DONE]\n\n')` and `res.end()`). Proper SSE headers (`Content-Type: text/event-stream`, disabling caching, etc.) will be set. This SSE transport allows easy integration with frontends and with MCP clients that expect a streaming interface.

* **Discovery Endpoint (`.well-known/mcp.json`):** To advertise our agent, we’ll host a JSON file at the URL `/.well-known/mcp.json` on our server. This file follows the MCP **directory specification** for tool discovery. An MCP-compatible client (like Claude or other AI tools) can fetch this well-known URL to discover what AI services are available at our endpoint. Our `mcp.json` will list our agent as an available server/tool. For example, it might look like:

  ```json
  {
    "version": "0.2",
    "servers": {
      "recursive-reflection-agent": {
        "transport": "sse",
        "url": "https://<our-domain>/sse",
        "inputs": { "type": "text", "description": "User prompt" },
        "outputs": { "type": "text", "description": "Streamed response" }
      }
    }
  }
  ```

  This advertises that there is a server named "recursive-reflection-agent" accessible via SSE at our `/sse` endpoint. (We will adjust fields according to the official MCP schema – the MCP TypeScript SDK will help ensure the JSON is correctly structured.) By hosting this file, we enable **decentralized discovery**: any client that knows our domain can find the agent interface without a central registry.

We will use the **official MCP TypeScript SDK** (e.g. `@mastra/mcp` or similar) to assist with this integration. The SDK can handle things like validating the structure of `mcp.json`, possibly registering our agent with an MCP registry, and managing connections. For example, if we were writing a client, we could use `MastraMCPClient` to connect to an SSE server by providing its URL. On the server side, our needs are simpler: we just need to serve the static `.well-known/mcp.json` and implement the SSE. The SDK will be most useful for ensuring compatibility; for instance, it may provide TypeScript types for the MCP schema and helper functions to construct the response. We will generate `mcp.json` at server start (or have a static file) that includes any necessary metadata. In future, if our agent offered multiple tools, we could list them all here (similar to how a site might list a “google-calendar” tool and others in the Mastra example).

By complying with MCP, we make our agent “plug-and-play” for any platform that supports MCP. In essence, just as **npm standardized package discovery and installation, MCP aims to standardize AI agent discovery and integration**. Our implementation will be forward-looking by including this from the start.

### File Structure and Modular Design

We will organize the project as a modular TypeScript codebase to facilitate extension and maintainability. Below is a proposed file/folder layout:

```
project-root/
├── src/
│   ├── orchestrator/                 
│   │   └── Orchestrator.ts        # Orchestrator class implementing the LS1-LS3 loop
│   ├── agents/
│   │   ├── GeneratorAgent.ts      # LS1 agent logic (calls Requesty for answers)
│   │   ├── CriticAgent.ts         # LS2 agent logic (calls Requesty for critique)
│   │   ├── ScoringAgent.ts        # LS3 agent logic (calls Requesty for evaluation)
│   ├── memory/
│   │   └── MemoryManager.ts       # wrapper around Mem0 for storing/retrieving memories
│   ├── server/
│   │   ├── server.ts              # Express app setup 
│   │   ├── routes/
│   │   │   ├── sseRoute.ts        # GET /sse route implementation
│   │   │   └── mcpRoute.ts        # GET /.well-known/mcp.json route
│   ├── utils/
│   │   ├── PromptTemplates.ts     # templates for prompts (generation, critique, scoring)
│   │   └── EmbedUtil.ts           # utility to compute embeddings (using Mem0 or API)
│   ├── index.ts                   # Entry point (starts the server or CLI, depending on mode)
│   └── cli.ts                     # CLI tool definitions (for npx usage)
├── tests/
│   ├── unit/
│   └── integration/
├── .env                           # API keys, config variables (not committed)
├── package.json
└── README.md
```

In this structure, each concern is separated:

* The `agents` folder holds classes or modules for each layer’s logic, so they can be developed and tested in isolation (for example, we can unit test the CriticAgent by feeding it some sample prompt+answer and checking that it returns a reasonable critique).
* The `orchestrator` orchestrates these agents according to the reflection loop, encapsulating the control logic (stop conditions, iteration count, etc.).
* The `memory` module abstracts Mem0 usage, providing methods like `saveMemory(prompt, answer, tags)` and `retrieveMemories(query, filterTags)`.
* The `server` contains the Express server setup and route handlers. The SSE route will likely use the Orchestrator to handle a request, and stream results. The MCP route simply serves a JSON (which could be generated via a small helper using SDK types).
* The `utils` may include prompt templates (so that the style and wording of the prompts for generation, reflection, scoring can be easily tweaked in one place) and any embedding helpers (if we decide to manually call an embedding API outside of Mem0, though Mem0 can manage it internally).
* The `cli.ts` will use something like [commander](https://www.npmjs.com/package/commander) or yargs to allow running the agent via command line (see CLI section below).

This modular layout makes the system **extensible**. For instance, to add a new reflection layer (say, a second critique), one could add another Agent class and adjust Orchestrator logic. Or to add a new tool (like web search), one might add a new module and integrate it into the workflow. The clear separation also aids testing (we can mock the LLM calls in unit tests for the agents, test the orchestrator loop with dummy agents, etc.).

Configuration like API keys, model choices, and server port will be in `.env` for easy change without code edits. We’ll use a library like `dotenv` to load these at startup. For example, `.env` will contain:

```
REQUESTY_API_KEY= <your_requesty_api_key>
OPENAI_API_KEY= <your_openai_key_for_embeddings>
MEM0_API_KEY= <if using mem0 platform, otherwise not needed for OSS>
PORT= 3000
```

## Step-by-Step Development Plan

We propose a phased development approach, with each phase adding a set of features and verifying them with tests. Below, each phase is outlined with its goals, implementation steps, and testing strategies:

### Phase 1: Project Setup and Basic Configuration

**Goals:** Initialize the project with TypeScript, set up the basic structure, and ensure we can load configuration.

**Tasks:**

* Initialize a Node.js project with `npm init` and install key dependencies: `express`, `dotenv`, `mem0ai`, etc., as well as dev dependencies for TypeScript (`typescript`, `ts-node`, `jest` for testing, etc.).
* Set up the TypeScript config (`tsconfig.json`) targeting ES6.
* Create the directory structure (`src/` and subfolders as outlined above).
* Implement a basic `server.ts` with Express: load `.env` (using `dotenv`), create an Express app, and add a simple health check route (e.g. GET `/ping` returning “pong”) to verify the server runs.
* Write a `.well-known/mcp.json` static file with a placeholder content (we’ll fill it in later phases).
* Prepare the CLI entry point (`cli.ts` or within `index.ts`) such that running `npm start` or `npx <project-name>` can start the server. For now, the CLI can simply start the Express server on the port from `.env`.

**Testing & Verification:**

* Run `npm run dev` (using ts-node or nodemon) and hit the health endpoint to ensure the server is up.
* Create a basic unit test for the config loader (ensuring that required env vars are present).
* No complex logic yet, so primarily ensure the scaffolding is correct. This phase sets the foundation for further development.

### Phase 2: Implement LS1 Generator (Answer Generation)

**Goals:** Implement the core answer generation using Requesty (the LS1 layer). In this phase, the system will take a prompt and return a single answer without reflection.

**Tasks:**

* In `GeneratorAgent.ts`, implement a `GeneratorAgent` class with a method like `generate(prompt: string): Promise<string>`. This method will call the Requesty API to get a completion. Use the Requesty API key from env. For now, we can hardcode a specific model or use the router default. Make sure to handle errors (e.g., API timeouts or errors should be caught and returned as error messages).
* Create prompt template for generation (in `PromptTemplates.ts`) if needed. Possibly something simple like: `"Answer the following question to the best of your ability:\n{{user_prompt}}\nAnswer:"` to send to the LLM.
* Integrate the GeneratorAgent into the Express route for SSE temporarily (or create a new route for testing): e.g., a non-streaming endpoint `POST /ask` that accepts a prompt, calls `GeneratorAgent.generate`, and returns the answer JSON. This gives us a quick way to test the LLM call without yet dealing with streaming.
* Ensure the Requesty call is working by trying with a test prompt.

**Testing:**

* Unit test GeneratorAgent: mock the fetch to Requesty (we can stub `GeneratorAgent.fetch` to return a preset response) and assert that `generate()` returns the expected string for a given prompt. Also test error handling by simulating a failed API call.
* Integration test: start the server and hit the `POST /ask` endpoint with a sample prompt (e.g., “What is the capital of France?”) and verify that a plausible answer (“Paris”) is returned. This confirms the Requesty integration is functional. We might mark these tests as requiring an API key (or use a special testing flag to not hit the real API every time).

By the end of Phase 2, we have a minimal viable agent that can answer questions (single-shot). This is essentially a baseline (no reflection yet).

### Phase 3: Implement LS2 Critic (Reflection Layer)

**Goals:** Add the ability for the agent to critique its own answer. This involves generating a reflection on the answer and planning to use it for improvement.

**Tasks:**

* Implement `CriticAgent.ts` with a method `critique(prompt: string, answer: string): Promise<string>`. This will call Requesty to get a critical analysis of the answer. The prompt template here might be something like: *“You are a critic. The following is a question and an answer. Provide a constructive critique of the answer, pointing out any errors or missing details:\nQuestion: {{q}}\nAnswer: {{a}}\nCritique:”*. The output could be a paragraph of feedback.
* Write the logic in the Orchestrator (Orchestrator.ts) to optionally use the CriticAgent. For now, we might not loop yet, but just show the critique alongside the answer. For example, Orchestrator can have a method `answerWithReflection(prompt)` that uses GeneratorAgent to get an answer and CriticAgent to get a critique of that answer.
* Expose an API (for testing) that returns both answer and critique. For instance, augment the `POST /ask` route to return `{ answer, critique }` in JSON.
* Make sure to handle cases where the critique might be empty or the LLM’s critique might be too harsh or irrelevant (we can iterate on the prompt for the critic if needed to get useful feedback).

**Testing:**

* Unit test CriticAgent with a stubbed LLM response: e.g., given a known prompt/answer pair, ensure `critique()` returns a string containing some expected keywords (like if the answer is obviously wrong, the critique should note it). Since we can’t fully predict LLM text, tests might just verify that a non-empty string is returned and that it addresses the answer.
* Integration test: call the combined endpoint with a question. Verify that:

  1. An answer is returned (same as before),
  2. A critique is returned that is reasonably related to the answer. For example, ask a factual question and intentionally have the agent give a wrong answer (we can simulate this by prompting in a way to produce a mistake) and see that the critique catches the mistake. This might require some manual inspection or very lenient assertions (like the critique contains phrases like “incorrect” or “doesn’t mention”). The goal is to ensure the pipeline works, not to perfectly evaluate the critique content.

At this stage, the agent performs a single reflection but doesn’t use it to improve the answer yet. We effectively have the *Emit* and *Reflect* parts of the loop working and tested.

### Phase 4: Implement LS3 Evaluation and Orchestrator Loop

**Goals:** Complete the reflection loop by adding the scoring mechanism and using it to drive iterative refinement. In this phase, the orchestrator will take the critique from LS2 and decide whether to loop back to LS1 with a revised prompt.

**Tasks:**

* Implement `ScoringAgent.ts` with a method `score(prompt: string, answer: string, critique: string): Promise<number>`. This agent will prompt the LLM to evaluate the answer. The prompt might ask for a numerical score (0–10) for coherence, correctness, and completeness of the answer, possibly with justification. Alternatively, the scorer could return a structured text that we parse. A simple approach: “On a scale of 1 to 10, how good is this answer given the question? Consider correctness, completeness, and efficiency of explanation. Justify briefly.” and parse the number. We can refine this prompt so that the first thing the model outputs is the score (for easy parsing) followed by a justification.
* Update **Orchestrator** to use ScoringAgent after getting the critique. Decide on a threshold score for satisfaction (e.g., >=8/10 as in pseudocode). If score is below threshold, orchestrator will incorporate the critique into the prompt and call GeneratorAgent again to get a revised answer. There are design choices here for how to incorporate the critique: we can prepend it to the user prompt as additional system instructions (as shown in pseudocode, perhaps something like “The assistant has an opportunity to correct its answer based on the following critique: … Now provide a new answer.”). Or we might simply instruct the generator to “try again and fix issues X, Y” per critique.
* Implement loop control: avoid infinite loops by having a max iteration count (from config, maybe 2 or 3). Also implement **reflection pruning**: if the second iteration’s critique is essentially repeating the first iteration’s feedback (which we could detect by similarity of critique texts or if score doesn’t improve), then break early.
* With the loop in place, orchestrator’s main method (say `getFinalAnswer(prompt)`) will either produce an improved answer after some iterations or the initial answer if it was already good.
* Modify the API endpoints:

  * For the SSE streaming (`/sse`), we can now stream *incremental results*. For example, we might stream the first answer and its critique, then indicate we are refining, then stream the final answer. However, streaming partial results to end-users might be confusing. More likely, for SSE we will stream just the final answer tokens as they are generated in the last iteration (and perhaps stream nothing during internal critique steps, or only log them server-side). For simplicity, we might not stream the first attempt at all, instead only stream the final output when ready (since the loop happens quickly in the background).
  * For a synchronous endpoint (if we keep `/ask` for JSON), we can return the final answer and perhaps include metadata like how many iterations were done, and maybe the final score.

**Testing:**

* Unit test ScoringAgent: since it returns a number, we can test the parsing logic. For example, simulate a scenario where the LLM responds with `"7 - The answer misses some details."` and verify we parse out 7 correctly. Also test that we cap or handle out-of-range values if the LLM does something unexpected.
* Unit test Orchestrator loop logic: we can mock the sub-agents (GeneratorAgent, CriticAgent, ScoringAgent) by creating dummy implementations that return preset values. For instance, set up a Generator that returns "Answer1", Critic that returns "Critique1", Scorer that returns 5 on first iteration, then a Generator that returns "Answer2" and Scorer returns 9 on second. Run Orchestrator.getFinalAnswer and assert that the final answer is "Answer2" (i.e., it looped, improved, and stopped). Also assert that it stopped after score 9 which is >= threshold. Try another scenario where first score is high and ensure it stops immediately.
* Integration test: Use a realistic prompt where the initial answer might be lacking. For example, a prompt: "Explain the significance of the number 42 in literature." The initial answer might be superficial. The critique could note missing Douglas Adams reference, and then the second answer should improve. Check that the final answer includes the expected information. This tests the full loop in practice.
* Another integration test: a prompt that the model gets right initially (e.g., a simple factual question). The score should be high, and it should not loop. Ensure that the final answer is the same as initial answer in that case.

This phase is the heart of the system – we now have the **Emit–Reflect–Score–Refine** cycle implemented. The agent should self-correct obvious issues. We will refine the prompts for critique and scoring as needed based on test results to ensure the reflection is constructive and the scoring correlates with actual quality.

### Phase 5: Integrate Vector Memory (Mem0) for Contextual Recall

**Goals:** Enhance the agent with persistent memory using Mem0. The agent will store interactions and leverage them for future queries.

**Tasks:**

* Initialize the Mem0 `MemoryManager` in our app (as shown in the Architecture section). Decide on using Mem0 in open-source mode vs using their cloud API. For open source, as we saw, we might need an OpenAI API key for embeddings. Alternatively, Mem0 might allow using its own embedding model if we provide no key (they have a default model `gpt-4o-mini` for internal LLM usage, but likely we’ll configure OpenAI for embedding to keep it simple).
* Implement `MemoryManager.saveInteraction(prompt, finalAnswer, critique?, score?)`. This will create a memory entry combining the user query and the assistant’s final answer (and optionally critique or other context as metadata). Use `memory.add()` from mem0 SDK to store it. Tag it with e.g. `userId` (if we want to identify different users or sessions; for now we can have a single user context or separate by conversation ID) and put the metadata tags. Ensure this is called after an answer is finalized.
* Implement `MemoryManager.retrieveSimilar(prompt)` which does `memory.search(prompt, { topK: N })` and returns the top results. We might filter by a minimum score in metadata to ignore poor past answers. If needed, implement advanced filtering: mem0’s API might not directly filter by metadata on search, so we may retrieve a bunch and then filter in code.
* Incorporate retrieval into the generation process: Before LS1 generates an answer, we query memory for similar questions. If any are found (and say the top one has a high score), we can **prompt augment** by injecting a summary of that Q\&A. For example, prepend to the user prompt: “Previous relevant question: X; answer was Y.” and perhaps instruct the LLM to use that as a reference. This effectively creates a **Retrieval-Augmented Generation** step. We must be careful that the model doesn’t just copy an old answer blindly (especially if the question is identical – but in that case, reusing a correct answer is fine). We can mitigate this by maybe adding a note like “you answered similarly in the past” or by merging it into the reflection step (the critic could potentially use memory too).
* Also use memory for reflection: If an answer is low-scoring and memory has a related high-score answer from before, we could fetch that and have the reflection incorporate it: e.g., “In the past, a similar question was answered this way… consider this in your revision.” This is an optimization that could significantly improve results if the agent has seen similar tasks.
* Ensure thread-safety or proper usage: if our server will handle multiple requests concurrently, the MemoryManager (and mem0) should be used in a way that isolates searches by user or prompt\_id. Mem0 supports a `userId` parameter which we will use as needed, possibly using something like a session ID or user name.

**Testing:**

* Unit test MemoryManager:

  * Test `saveInteraction` by calling it with a dummy prompt/answer and then directly query mem0 (via `memory.getAll`) to see if it was stored with correct metadata.
  * Test `retrieveSimilar` by pre-seeding some entries (we might bypass mem0 and inject an entry or use Memory.add) then querying with a prompt known to be similar. Verify it returns that entry. If mem0’s search is deterministic for identical prompts, we can simulate that.
* Integration test:

  1. Simulate a scenario: ask a question and get an answer. Then ask the *same* question again (or a very similar one). The second time, the agent should retrieve the memory of the first and ideally answer faster or with the same answer. We can check that the final answer of second attempt either exactly matches the first (best case) or at least the system possibly uses fewer tokens (if we measure, though that’s harder to assert in test).
  2. Another scenario: ask two related questions in sequence. The second question’s answer might benefit from knowing the first. For example: Q1: “Who won the 2018 World Cup?” (A1: France). Q2: “What was unique about the team that won the 2018 World Cup?” The second answer should ideally mention France without re-deriving it. With memory, the agent can recall that France won in 2018 from Q1’s memory instead of having to deduce or already know it. Check that the answer to Q2 references France (if our retrieval and prompt augmentation is working).
* Performance test (manual): As memory grows, ensure that adding and searching remains reasonably fast (mem0 in-memory should be fine for moderate numbers of entries). We might do a quick loop to add, say, 50 dummy memories and then search to see it still returns promptly.

Phase 5 gives our agent continuity across sessions. It can now “learn” from its reflections by storing them. This also positions us to evaluate improvements – over time, the idea is that the agent’s answers get better as it has more examples to draw from (self-improvement).

### Phase 6: Expose SSE Streaming and MCP Discovery Endpoints

**Goals:** Make the agent accessible via streaming and publish the MCP discovery file, completing the integration for external use.

**Tasks:**

* **SSE Endpoint:** Implement the `sseRoute.ts`. This will handle GET requests at `/sse`. The handler should:

  * Parse the incoming request for the prompt (perhaps as a query param `?q=` or if the client sends a POST we might want GET for SSE; typically SSE is GET with data either in query or in some pre-established channel).
  * Set headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`, and if needed `Access-Control-Allow-Origin` for CORS.
  * Immediately flush headers (`res.flushHeaders()` in Express) so the client receives the stream start.
  * Kick off the orchestrator loop for the given prompt. We have a design choice: do we stream tokens as they are generated by the LLM in each step, or do we wait until final? A compromise: we can stream the **final answer tokens** as LS1 generates them in the last iteration. That means we call GeneratorAgent in a streaming mode for the final iteration. If using OpenAI or similar via Requesty, we can possibly get streaming chunks. Requesty likely supports streaming responses as well (we should check their docs – if not, we can simulate by manually chunking the string, but real streaming from the API is ideal). Assuming streaming is possible: we’d call the LLM with streaming, and pipe those chunks out through our SSE.
  * Before final generation, we could optionally send an event indicating that reflection is happening (for transparency). For example: `res.write('event: status\ndata: Reflecting on answer\n\n')`. But to keep it simple for now, we might skip that.
  * As tokens come in for the answer, write `data: <token>\n\n` for each (or accumulate and send larger chunks to reduce overhead). The client will concatenate these.
  * After completion, perhaps send a last event, e.g., `data: [DONE]\n\n` or simply close the connection.
  * Handle client disconnects (if client closes connection mid-way, our server should stop the generation process if possible to save compute – we might need to cancel the Requesty request; if Requesty doesn’t support cancellation easily, this is a caveat).
* **MCP Discovery:** Implement `mcpRoute.ts` to serve `.well-known/mcp.json`. We can either generate the JSON on the fly or serve a static file. Since it’s mostly static information about our service, we can prepare a JSON object at startup and just respond with `res.json(mcpObject)`. Use the MCP SDK’s types or validation if available to ensure compliance. The content, as discussed, should list our SSE endpoint. We will include any metadata we find relevant (model names, etc., if the spec allows, but at minimum the transport and URL).
* **CORS:** If we expect web-based clients to call our SSE (or fetch mcp.json), configure CORS as needed (Express can use the `cors` middleware to allow all origins or specific ones). This is especially needed for browsers trying to consume SSE from a different origin.
* **Authentication:** MCP spec allows for auth (the Mastra blog snippet shows adding Authorization header in SSE client). We might not implement auth in this prototype, but we’ll design the server to easily plug in an auth check (e.g., check a token in query headers for SSE). For now, open access is fine.

**Testing:**

* Manual test SSE using a tool: One can use curl or a browser to test SSE. E.g., open `http://localhost:3000/sse?prompt=Hello` in a browser or an SSE client and ensure it streams responses. We will test a prompt that has a multi-iteration reflection and watch the stream to see that the final answer comes through token by token.
* Automated integration test for SSE: This is tricky because it’s asynchronous streaming. We can simulate an SSE client in Node by requesting the endpoint and collecting data for a short time. Or we can use supertest in a way to get the response stream. For simplicity, this might be verified manually and with small scripts rather than in Jest (which isn’t well-suited for long-lived connections).
* Test `.well-known/mcp.json`: A simple HTTP GET should return the JSON. We verify the content programmatically in a test by JSON parsing it and checking expected fields (e.g., that it has our server name, correct URL, etc.). We can also run it through an MCP client from the SDK to ensure it’s recognized (for example, using `RegistryClient` in a test to load our file).
* If possible, test integration with a known MCP client: For example, if there’s a command-line MCP client or using Claude’s developer console to load an MCP tool. This would be more of an end-to-end validation: we could attempt to have another agent “discover” our agent via the mcp.json. This might be beyond our automated tests, but a good manual validation.

By the end of Phase 6, our agent is a **service** that external clients can discover and query. We can share the URL and any MCP-aware client can hook into it .

### Phase 7: CLI Tool and Developer Utilities

**Goals:** Provide a convenient command-line interface (CLI) for installing and running the agent, and add developer utilities like environment setup and possibly data export.

**Tasks:**

* Set up the `bin` in `package.json` to point to our CLI script (e.g., `"bin": {"mastra-agent": "dist/cli.js"}` after build). This allows `npx mastra-agent` (if published to npm or via `npm link`) to run our CLI.
* Implement CLI commands using a library (Commander or Yargs). Desired commands:

  * `mastra-agent start` – starts the Express server (essentially running the same as `npm start`, using the config in `.env`).
  * `mastra-agent ask "<question>"` – runs a single prompt through the orchestrator locally and prints the final answer (and maybe critique if verbose). This should instantiate the Orchestrator and sub-agents without starting the full Express server, useful for quick testing. We can allow a `--stream` flag to stream tokens in the console.
  * `mastra-agent memdump` – for debugging, maybe print out current memory contents or stats (how many entries, etc.).
  * `mastra-agent test` – an optional convenience to run the test suite (could just call `npm test` internally).
* Ensure the CLI handles configuration (for example, if `.env` is needed, load it within the CLI as well).
* Write usage instructions in README.md (though documentation isn’t explicitly asked, it’s good to include usage examples for both API and CLI).

**Testing:**

* Manually test the CLI commands in a dev environment. Run `npx ts-node src/cli.ts ask "Some question"` and see that it prints an answer. Test `start` to ensure it starts the server and the server responds to requests.
* We can write automated tests for the CLI using an approach like spawning a child process and capturing output. For example, use Node’s `child_process.exec("node dist/cli.js ask '2+2?'")` in a test and verify the output contains "4". This can be done for a couple of simple cases. However, these integration tests might be fragile (since they involve the whole stack), so we will focus on manual verification for the CLI and ensure that our unit/integration tests from earlier phases cover the internals well.

Now our agent can be easily run by other developers: they can do `npm install` then `npm run build && npm start` to run the server, or use our CLI for different tasks. We’ll package all necessary instructions in the README.

### Phase 8: Testing, Evaluation, and Quality Assurance

**Goals:** Rigorously test the system (unit tests for components, integration tests end-to-end) and evaluate the agent’s performance on various criteria (coherence, novelty, efficiency).

**Tasks:**

* **Complete Unit Test Coverage:** By now, most modules have some tests. We will review and increase coverage, ensuring each critical function (agents, orchestrator branches, memory filtering logic, etc.) has tests for normal and edge cases. For example, test what happens if the LLM returns an empty critique, or if the memory search finds nothing, etc.

* **Integration Tests:** Develop a suite of scenario-based tests:

  * Simple factual QA, expecting one step.
  * Complex question requiring reflection (maybe a trick riddle or a multi-fact question) where we expect the agent to do at least one loop and improve the answer. Verify improvement qualitatively by checking the final answer contains things the initial answer missed.
  * Memory usage scenario as described before (to ensure context recall).

* **Evaluation Metrics:** We will create an evaluation script (could be separate from the main app, perhaps in `tests/evaluation.test.ts` or a util script) that runs the agent on a set of sample prompts and records metrics:

  * **Coherence:** Does the answer stay on topic and logically consistent? We might approximate this by having the ScoringAgent also return a coherence sub-score, or we can post-hoc prompt an LLM to evaluate coherence. For automation, we might just rely on LS3’s scoring for coherence dimension.
  * **Novelty:** Particularly if the agent gets asked a question slightly different from ones in memory, do the answers show originality or just copy memory? We can test this by asking a question that the agent has seen before versus a new question, and ensure it adapts. Novelty might be measured by comparing the embedding of the new answer to those in memory – if it’s identical to a stored answer, novelty is low. We could compute an average JSD or cosine similarity between new answers and nearest memory. Ideally, on new questions the agent’s answers should have a certain minimum distance from any stored answer (indicating it’s not just regurgitating unrelated content).
  * **Efficiency:** We interpret this as conciseness and minimal redundancy in answers (and possibly the number of reflection iterations). We can measure answer length in tokens and how many iterations were used. If the agent often needs the maximum iterations, perhaps efficiency is low. We aim for high efficiency: achieving good answers in 1 or 2 iterations. We’ll gather stats like average iterations per query and average answer length. We can also use LS3’s scoring for “efficiency” if we included that in its rubric.

* Using these metrics, we’ll run a batch of say 20 diverse prompts (covering different domains and difficulties) through the agent. We will compute the average coherence score, novelty (maybe average embedding divergence between each answer and that agent’s prior answers), and efficiency (average iterations). This evaluation loop might be semi-automated: we can write a script to do it and print results. The results will help us identify any weaknesses:

  * If coherence scores are low, maybe the agent is going off-track – we’d then adjust the prompt for LS2 or LS3 to emphasize staying on topic.
  * If novelty is too low (e.g., the agent is copying memory verbatim in situations it shouldn’t), we might adjust how memory is used (perhaps use it more as a guide than a direct source in the prompt).
  * If efficiency is low (e.g., always using max iterations), maybe our threshold is too high or the critique isn’t guiding well. We could then either lower the quality bar or improve the critique prompt to yield more actionable feedback that fixes issues in one go.

* **User Testing:** If possible, have a few sample end-users (or team members) try the agent via the CLI or a simple web UI and give feedback on answer quality and any technical issues. This qualitative feedback is valuable to complement automated metrics.

**Quality Assurance Checklist:** Before final deployment, ensure:

* All tests pass and coverage is acceptable.
* No sensitive info is logged (we’ll scrub API keys and ensure that if we log prompts or answers for debugging, it’s done securely or turned off in production).
* The system handles error cases gracefully (if Requesty is down, the SSE should send an error event or the CLI prints an error, rather than hanging).
* Performance: test with concurrently running a few orchestrations (simulate 2-3 simultaneous requests to /sse) to ensure memory and CPU usage are stable. The LangGraph-style design inherently could allow parallel flows; our implementation should handle that (Node’s event loop will interleave naturally, but if using the same mem0 instance, ensure it’s not a bottleneck – mem0 operations are likely fast, and the LLM calls are the slow part).
* Compliance: the MCP discovery JSON is correct (we can validate with the MCP SDK or a linter).

By the end of Phase 8, we should have a robustly tested agent and some data on how well it meets the goals of coherence, novelty, and efficiency. This sets the stage for deployment or further tuning.

### Phase 9: Optimization and Refinement

**Goals:** Fine-tune the agent’s performance and efficiency based on evaluation results, and implement any remaining optimization strategies such as prompt tuning, reflection pruning improvements, and embedding divergence checks.

**Tasks:**

* **Prompt Optimization:** Revisit the prompt templates for Generator, Critic, and Scorer. Ensure the Generator’s instruction produces answers in the desired format (for instance, not overly verbose if efficiency is a goal – we can instruct it to be concise). Update the Critic prompt to yield actionable feedback (maybe ask it to list specific improvements). Update the Scorer prompt to weigh the factors appropriately. We might also adjust the scoring threshold or the way the score is computed (e.g., maybe take into account critique length or severity).
* **Reflection Pruning:** Implement more rigorous checks to avoid unnecessary loops:

  * If the **embedding similarity** between the new answer and the old answer is high (above some threshold), then the new answer didn’t change much – possibly the critique wasn’t effective or the answer was already optimal. We might break the loop in this case to avoid wasting an iteration.
  * If the critique text is very similar to the previous critique (we can measure Levenshtein distance or embedding similarity on critiques), break the loop.
  * We can also limit that if by second iteration the score didn’t improve by at least e.g. 20%, we stop (to avoid diminishing returns).
* **Memory Usage Tuning:** As memory grows, consider limiting the number of memories retrieved or decaying old ones. Possibly implement a periodic prune of memory: e.g., keep only the top 100 highest-scored memories to limit size (depending on use case).
* **Parallelizing where possible:** The LangGraph/SPARC idea of edge scheduling could allow some parallelism – for example, one could generate an answer and a critique in parallel using two different models (some research suggests you can prompt a model to critique an incomplete answer). However, that is complex and maybe out of scope. Our design currently is sequential. We’ll note this as a future optimization but likely not implement fully now. Instead, we focus on speeding up each iteration (maybe using a faster model for critique as mentioned).
* **Jensen-Shannon Divergence for Novelty:** Implement a utility to calculate J-S divergence between the token probability distributions of the answer vs. memory answers (this would require access to the raw logits/probabilities from the model, which we don’t readily have via Requesty unless it provides an API for logits – unlikely). Instead, we approximate novelty via embedding distance or by checking if the answer is almost an exact match to something in memory (which would indicate low novelty). If novelty is a concern (like the agent is copying too directly from memory), we could add a step to rephrase content from memory. For instance, if a memory snippet is used, instruct the generator to put it in its own words. This can be done by prompt engineering in LS1 when memory context is present (“using the following info, explain in your own words…”).
* **Resource optimization:** Ensure that each iteration’s data (prompt, critique, etc.) is not unnecessarily kept in memory after use – free up references to allow GC. Also, consider the cost: every LLM call costs tokens. Reflection adds overhead. Our use of memory aims to reduce tokens by not having to regurgitate background info. We can quantify token usage: instrument the code (if using OpenAI via Requesty we may get token counts) to see average tokens used with and without reflection. If we find it too high, we may try to condense the critique or only use memory instead of a full critique sometimes. There’s a balance to strike between quality and cost.

**Testing:**

* Re-run the evaluation suite from Phase 8 after these optimizations. Compare metrics:

  * Did average iterations drop? (Should, if pruning works).
  * Did any coherence or correctness measure drop as a result (hopefully not).
  * Are answers still of high quality but maybe shorter (improved efficiency).
* Perform regression testing to ensure no new issues were introduced: all previous unit and integration tests should still pass.
* Maybe add new tests for any new utility functions (like if we add a function to compare embeddings or to decide loop cut-off, test those logic branches with crafted data).

At this final phase, we incorporate lessons learned and polish the agent. The result is a system that is **optimized for agentic flow and efficiency**: it reflects just enough to improve answers, uses its knowledge base to avoid redundant work, and provides results quickly via streaming. We have also built in a framework that can be extended (e.g., adding more layers or tools) and easily maintained.

## Conclusion and Deployment

With the above development plan executed, we will have a fully implemented multi-layer AI agent system following the Mastra agentic framework and agGI architecture. It features recursive self-reflection (LS1-LS3) with an orchestrated feedback loop to refine answers, uses Requesty.ai for robust LLM access, incorporates Mem0 for persistent memory, and adheres to the MCP standard for interoperability. The project’s modular structure makes it easy to extend or integrate into larger applications.

For deployment, we can containerize the Express server (writing a simple Dockerfile), ensuring to include the `.well-known/mcp.json` in the web root. Once deployed, any MCP-compatible client can discover our agent and start streaming conversations to it, enabling seamless tool integration in the spirit of the growing AI agent ecosystem.

Developers can run `npx mastra-agent start` (or the equivalent CLI command) to launch the service locally, and use `npx mastra-agent ask "Your question?"` for quick tests. The README will provide these instructions and note any environment variables required. By following this plan, we ensure a **comprehensive, efficient, and modern AI agent implementation**, combining best-in-class techniques from reflection to memory and standardized interfaces.

**Sources:**

* Mastra Agent Framework & MCP integration
* Reflection loop concept and LangGraph orchestration
* Requesty.ai for LLM routing
* Mem0 memory for LLM agents
