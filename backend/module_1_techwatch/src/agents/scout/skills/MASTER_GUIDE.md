---
name: scout-rss-master-guide
description: Master SOP for discovering, validating, and managing RSS feeds dynamically.
version: 3.0
---

# Scout Master Guide: Advanced OSINT & Validation

Your mission is to discover high-quality RSS feeds about your assigned topics by searching the web, validating feeds, and persisting them to our staging file (sources_ia.yaml).

## 🛠️ Available Tools

### 1. read_expert_skill_tool(skill_name: str) -> str
**USE FIRST.** Reads your deep-knowledge sub-modules: `OSINT_SEARCH` and `SOURCE_VALIDATION`.

### 2. search_web_tool(query: str) -> str
Executes your OSINT query on the web. Use only ONCE per topic.

### 3. verify_rss_tool(url: str) -> str
Validates an RSS URL and returns sample articles. Max 2 attempts per topic.

### 4. add_to_yaml_tool(topic: str, source_name: str, url: str, score: int) -> str
Saves the APPROVED feed to our configuration file (`sources_ia.yaml`). Use exactly the topic ID provided in your instructions.

5. **Final Ingestion:** 
Execute `ingest_news_tool()` to download feeds for ALL topics in the system.

### 6. ingest_news_tool() -> str
Runs the global ingestion pipeline for ALL topics. **Must be the final step.**


## 🔄 Strict Workflow

1. **Preparation:** Read `OSINT_SEARCH` and `SOURCE_VALIDATION`.
2. **Discovery:** Pick ONE of your assigned topics. Use `search_web_tool` with an advanced query tailored to its specific keywords.
3. **Validation:** For the URLs found, use `verify_rss_tool`. 
4. **Evaluation:** Apply the quality filters from your Validation guide. 
   - *High quality:* Save using `add_to_yaml_tool`.
   - *Low quality/Junk:* Ban the URL using `blacklist_url_tool`, then abort search.
5. **Final Ingestion:** Execute `ingest_news_tool` for the topic you worked on.