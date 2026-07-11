<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: Project have knowledge graph. ALWAYS use
code-review-graph MCP tools BEFORE Grep/Glob/Read to explore
codebase.** Graph faster, cheaper (fewer tokens), give structural
context (callers, dependents, test coverage) file scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when graph don't cover what you need.

### Key Tools

| Tool | Use when |
| ------ | ---------- |
| `detect_changes` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context` | Need source snippets for review — token-efficient |
| `get_impact_radius` | Understanding blast radius of a change |
| `get_affected_flows` | Finding which execution paths are impacted |
| `query_graph` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes` | Finding functions/classes by name or keyword |
| `get_architecture_overview` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. Graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

Project indexed by GitNexus as **NVLabs** (2091 symbols, 4172 relationships, 133 execution flows). Use GitNexus MCP tools to understand code, assess impact, navigate safely.

> Index stale? Run `node .gitnexus/run.cjs analyze` from project root — auto-selects available runner. No `.gitnexus/run.cjs` yet? `npx gitnexus analyze` (npm 11 crash → `npm i -g gitnexus`; #1939).

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying function, class, or method, run `impact({target: "symbolName", direction: "upstream"})` and report blast radius (direct callers, affected processes, risk level) to user.
- **MUST run `detect_changes()` before committing** to verify changes only affect expected symbols and execution flows. For regression review, compare against default branch: `detect_changes({scope: "compare", base_ref: "main"})`.
- **MUST warn user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `query({query: "concept"})` to find execution flows instead of grepping. Returns process-grouped results ranked by relevance.
- When you need full context on specific symbol — callers, callees, which execution flows it participate in — use `context({name: "symbolName"})`.

## Never Do

- NEVER edit function, class, or method without first running `impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `rename` which understands call graph.
- NEVER commit changes without running `detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/NVLabs/context` | Codebase overview, check index freshness |
| `gitnexus://repo/NVLabs/clusters` | All functional areas |
| `gitnexus://repo/NVLabs/processes` | All execution flows |
| `gitnexus://repo/NVLabs/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->