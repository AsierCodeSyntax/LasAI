import os
import yaml
from typing import Optional
from pydantic import BaseModel, Field
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

from ..state import OverallState
from .tools.skill_reader import read_expert_skill
from .tools.db_tools import get_pending_news, save_analysis
from .tools.semantic_memory import check_semantic_memory

# We force the LLM to reply exactly with this structure
class EvaluationResult(BaseModel):
    reasoning: str = Field(description="Step-by-step mathematical calculation of the score based on Depth, Novelty, and Authority. You MUST write the math here before giving the score.")
    score: float = Field(description="Final Score from 0.0 to 10.0 based exactly on the reasoning calculation.")
    summary_short: str = Field(description="Direct, journalistic summary of the news. No intro phrases.")

def get_analyst_llm():
    """Instantiates the LLM with structured output support."""
    provider = os.environ.get("LLM_PROVIDER", "ollama").lower()
    if provider == "ollama":
        from langchain_openai import ChatOpenAI
        base_url = os.environ.get("OLLAMA_API_URL", "http://ollama:11434").replace("/api", "") + "/v1"
        llm = ChatOpenAI(
            base_url=base_url,
            api_key=os.environ.get("OLLAMA_API_KEY", "ollama"),
            model=os.environ.get("OLLAMA_MODEL", "gemma3:12b-cloud"),
            temperature=0.4,     
            max_retries=2,       
            timeout=45.0
        )
    else:
        from langchain_google_genai import ChatGoogleGenerativeAI
        api_key = os.environ.get("GEMINI_API_KEY", "PUT_YOUR_KEY_HERE_IF_IT_FAILS")
        api_key = api_key.replace('"', '').replace("'", "")
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash", 
            google_api_key=api_key,
            temperature=0.4,     # 2. AÑADIMOS TEMPERATURA AQUÍ TAMBIÉN
            max_retries=2,       
            timeout=45.0
        )
    return llm.with_structured_output(EvaluationResult)

def load_topics_yaml() -> dict:
    """Read the topics.yaml file dynamically."""
    yaml_path = "/workspace/topics.yaml"
    if not os.path.exists(yaml_path):
        print("⚠️ [Analyst] topics.yaml not found. Using default topics.")
        # Fallback to the 3 original topics if something fails
        return {
            "plone": {"name": "Plone CMS", "keywords": []},
            "django": {"name": "Django", "keywords": []},
            "ai": {"name": "Artificial Intelligence", "keywords": []}
        }
    with open(yaml_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f) or {}

def get_dynamic_rubric(topic_slug: str, topic_data: dict) -> str:
    """
    Combina el MASTER_GUIDE (reglas matemáticas y de formato) con la 
    rúbrica específica del topic (los Tiers).
    """
    # 1. Cargamos las reglas maestras obligatorias
    master_guide = read_expert_skill("MASTER_GUIDE")
    if not master_guide:
        master_guide = "⚠️ WARNING: MASTER_GUIDE not found. Please evaluate carefully."

    # 2. Intentamos cargar el archivo específico del topic (ej. DJANGO_EVALUATION.md)
    custom_rubric = read_expert_skill(f"{topic_slug.upper()}_EVALUATION")
    
    if custom_rubric:
        # Si existe, devolvemos la fusión de ambos
        return f"{master_guide}\n\n{custom_rubric}"
        
    # 3. Si no hay archivo .md, generamos los Tiers dinámicamente
    name = topic_data.get("name", topic_slug.capitalize())
    keywords = ", ".join(topic_data.get("keywords", []))
    
    dynamic_tiers = f"""
    # SKILL MODULE: {name} Technical Evaluation
    **Domain:** {name}, {keywords}

    ## 🧠 CONTEXT
    You are evaluating news, articles, and releases related to the {name} ecosystem. 
    You must distinguish between marketing fluff, beginner tutorials, and high-impact technical content that matters for production systems.

    ## ⚖️ SCORING RUBRIC (Base scores before Master Guide adjustments)

    ### TIER 1: Critical & Official (Base: 9.0 - 10.0)
    - **Content:** MAJOR official releases, critical security advisories (CVEs), foundational architectural changes, or technological breakthroughs.
    - **Keywords:** {keywords}

    ### TIER 2: Senior Engineering & Production (Base: 7.0 - 8.9)
    - **Content:** Deep technical articles addressing complex problems, advanced architecture, optimization, deployments, or production-grade solutions in {name}.

    ### TIER 3: Mid-Level & Standard Tutorials (Base: 4.0 - 6.9)
    - **Content:** Standard "how-to" guides, basic implementations, and overview articles. Useful but not groundbreaking.

    ### TIER 4: Junk, Clickbait, or Irrelevant (Base: 0.0 - 3.9)
    - **Content:** Generic listicles, SEO spam, non-technical fluff, pure corporate marketing/PR, or beginner content unrelated to advanced usage.
    
    ## 🛑 PENALTIES
    - Subtract 2.0 points if the article promotes outdated or bad technical practices.
    """
    
    # Devolvemos la fusión del Master Guide con los Tiers dinámicos
    return f"{master_guide}\n\n{dynamic_tiers}"


def analyst_node(state: OverallState) -> dict:
    print("🧠 [Analyst] Starting Expert Evaluation Pipeline...")
    
    llm_with_structure = get_analyst_llm()
    
    # --- DINAMIC CONFIGURATION ---
    topics_dict = load_topics_yaml()
    MAX_NEWS_PER_TOPIC = 200
    # ------------------------------
    
    total_evaluated = 0
    total_duplicates = 0

    for topic, topic_data in topics_dict.items():
        print(f"\n   🎯 [Analyst] Waking up {topic.upper()} Expert...")
        
        # 1. Fetch pending news for this specific topic
        pending_news = get_pending_news(topic, limit=MAX_NEWS_PER_TOPIC)
        if not pending_news:
            print(f"      No pending news for {topic.upper()}. Expert goes back to sleep.")
            continue
            
        # 2. Inject the skill / Dynamic Rubric into the Expert's brain
        rubric_content = get_dynamic_rubric(topic, topic_data)
            
        system_prompt = SystemMessage(content=f"""
        You are a Senior Technical Analyst. Your absolute area of expertise is {topic_data.get('name', topic.upper())}.
        You must evaluate technical news using the following rubric strictly.
        
        RUBRIC:
        {rubric_content}
        """)
        
        print(f"      Expert awake. Evaluating {len(pending_news)} news items...")
        
        # 3. Feed news to the expert one by one
        for row in pending_news:
            item_id, title, content, source_type = row
            
            # A) Ask Semantic Memory (Qdrant) FIRST
            mem_result = check_semantic_memory(item_id, topic, title, content, source_type)
            
            # If Qdrant says it's an echo/trend, skip the LLM entirely
            if mem_result["action"] == "duplicate":
                save_analysis(item_id, topic, status="duplicate")
                print(f"      🗑️  Item {item_id}: Marked as duplicate (Trend detected).")
                total_duplicates += 1
                continue
                
            # B) LLM Evaluation (The Expert evaluates ONLY this news using its injected skill)
            user_msg = HumanMessage(content=f"Evaluate this news:\n\nTitle: {title}\nSource Type: {source_type}\nContent: {content[:1500]}")
            
            try:
                # The expert returns the score and the summary based on the rubric
                eval_data: EvaluationResult = llm_with_structure.invoke([system_prompt, user_msg])
                
                # C) Combine Expert Score + Qdrant Modifier
                raw_score = eval_data.score
                modifier = mem_result["modifier"]
                final_score = max(0.0, min(10.0, raw_score + modifier))
                
                # D) Save results
                save_analysis(
                    item_id=item_id,
                    topic=topic,
                    status="evaluated",
                    summary=eval_data.summary_short,
                    final_score=final_score,
                    vector=mem_result["vector"]
                )
                print(f"      ✅ Item {item_id}: Evaluated. Final Score: {final_score}/10")
                total_evaluated += 1
                
            except Exception as e:
                print(f"      ❌ Failed to evaluate item {item_id}: {e}")

    final_message = f"Analyst evaluation completed. {total_evaluated} evaluated, {total_duplicates} duplicates skipped. Passes turn to Translator."
    print(f"\n✅ {final_message}")
    
    return {"messages": [AIMessage(content=final_message)]}