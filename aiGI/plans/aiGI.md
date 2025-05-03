**Creating mermaid flowchart**

The user seems to want a prompt architecture and flow in a clear, structured mermaid format. Based on what they’ve requested, I’ll provide a flowchart with labels such as "orchestrator," "modes," and "flows." I’ll use markdown and apply the same style as the previous mermaid diagram. I’ll include an orchestrator that creates subtasks using "new\_mode" while utilizing a memory bank file. Since the user didn’t ask for JSON updates, I'll keep it to the diagram and potentially offer a description as well.

**Creating mermaid flowchart with memory**

To create the mermaid flowchart, I’ll structure it with the usual steps: orchestrator, spec, prompt generator, critic, scorer, reflection, code, and final assembly. I’ll include storing artifacts in memory bank files (MD and JSON), vector stores, and the use of new tasks. For clarity, I’ll collapse steps into loops where appropriate. The flowchart will outline the necessary interactions between tasks and phases. I’ll also provide a description to explain the diagram's elements.
 


```mermaid
flowchart TD
  %% Entry point
  UR([User Task Request])

  %% Specification phase
  UR --> SpecTask["new_task: spec-pseudocode"]
  SpecTask --> SpecMD[/"spec_phase1.md"/]
  SpecMD -.-> VectorStore((Vector Store))

  %% Layered reflection loop (LS1…LSn)
  SpecMD --> PromptTask1["new_task: prompt-generator"]
  PromptTask1 --> Prompts1[/"prompts_LS1.md"/]
  Prompts1 --> LLM1["LLM API Call"]
  LLM1 --> Resp1[/"responses_LS1.md"/]
  Resp1 -.-> VectorStore
  Resp1 --> CriticTask1["new_task: critic"]
  CriticTask1 --> Refl1[/"reflection_LS1.md"/]
  Refl1 -.-> VectorStore
  Refl1 --> ScorerTask1["new_task: scorer"]
  ScorerTask1 --> Scores1[["scores_LS1.json"]]
  Scores1 -.-> VectorStore
  Scores1 --> Decision1{Δ<ε?}
  Decision1 -->|No| PromptTask2["new_task: reflection"]
  Decision1 -->|Yes| CodePhase

  %% Next layer
  PromptTask2 --> Prompts2[/"prompts_LS2.md"/]
  Prompts2 --> LLM2["LLM API Call"]
  LLM2 --> Resp2[/"responses_LS2.md"/]
  Resp2 -.-> VectorStore
  Resp2 --> CriticTask2["new_task: critic"]
  CriticTask2 --> Refl2[/"reflection_LS2.md"/]
  Refl2 -.-> VectorStore
  Refl2 --> ScorerTask2["new_task: scorer"]
  ScorerTask2 --> Scores2[["scores_LS2.json"]]
  Scores2 -.-> VectorStore
  Scores2 --> Decision2{Δ<ε?}
  Decision2 -->|No| PromptTask3["new_task: reflection"]
  Decision2 -->|Yes| CodePhase

  %% Code implementation phase
  subgraph CodePhase["🧠 Auto-Coder & Testing"]
    CodePhase --> CodeTask["new_task: code"]
    CodeTask --> CodeFiles[/"*.ts & tests"/]
    CodeFiles -.-> VectorStore
    CodeFiles --> TestTask["new_task: test"]
    TestTask --> TestResults[["test_results.json"]]
    TestResults -->|fail| CriticTask2
    TestResults -->|pass| MCPOpt
  end

  %% Optional MCP integration
  subgraph MCPOpt["♾️ MCP Integration (optional)"]
    MCPOpt --> MCPTask["new_task: mcp"]
    MCPTask --> MCPCode[/"mcp_integration.ts"/]
    MCPCode -.-> VectorStore
    MCPCode --> FinalPhase
  end
  TestResults -->|pass| FinalPhase

  %% Final assembly
  subgraph FinalPhase["🏁 Final Assembly"]
    FinalPhase --> FinalTask["new_task: final-assembly"]
    FinalTask --> FinalMD[/"final.md"/]
    FinalMD -.-> VectorStore
    FinalMD --> Output([Final Deliverable])
  end
```

**Legend & Notes:**

* **new\_task:** orchestrator assigns each mode as a subtask.
* **Markdown files (`/*.md`):** memory bank per layer.
* **JSON files (`*.json`):** scoring & test metrics.
* **Vector Store:** stores embeddings & metadata for retrieval.
* **Decision Δ<ε?:** self-learning check; if improvement below threshold, continue reflection; else move to code.
* **MCP Integration:** optional service integration step before final assembly.
* **Final Deliverable:** consolidated output of specs, responses, code, tests, and metrics.
