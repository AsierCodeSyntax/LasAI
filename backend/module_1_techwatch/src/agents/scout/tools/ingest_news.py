import os
import yaml
import subprocess
from langchain_core.tools import tool

@tool
def ingest_news_tool() -> str:
    """
    Skill: News global ingest.
    Executes the automatic process of downloading and enriching news 
    for ALL topics configured in the system simultaneously.
    This must always be your last step.
    """
    print("📥 [Scout Skill: Ingest] Starting GLOBAL Ingestion for all topics...")
    workspace_dir = "/workspace"
    yaml_path = os.path.join(workspace_dir, "topics.yaml")
    
    if not os.path.exists(yaml_path):
        return "❌ Error: topics.yaml not found for ingestion."
        
    with open(yaml_path, "r", encoding="utf-8") as f:
        topics_data = yaml.safe_load(f) or {}
        
    results = []
    
    # 1. Execute Ingestions by Topic
    for topic in topics_data.keys():
        print(f"   -> Downloading RSS for: {topic.upper()}...")
        try:
            subprocess.run(["python", "src/ingest.py", "--topic", topic], check=True, cwd=workspace_dir, capture_output=True, text=True, timeout=120)
            subprocess.run(["python", "src/ingest_scrape.py", "--topic", topic], check=True, cwd=workspace_dir, capture_output=True, text=True, timeout=120)
            results.append(f"{topic}: OK")
        except subprocess.TimeoutExpired:
            print(f"      ⚠️ Timeout in {topic}")
            results.append(f"{topic}: Timeout")
        except subprocess.CalledProcessError as e:
            print(f"      ❌ Error in {topic}")
            print(f"      🛑 DETALLE DEL ERROR:\n{e.stderr}")
            results.append(f"{topic}: Error")
            
    # 2. Global Enrichment (enrich.py does it for all 'new' at once)
    print("   -> Executing Global Enrichment (Filters and Keywords)...")
    try:
        subprocess.run(["python", "src/enrich.py"], check=True, cwd=workspace_dir, capture_output=True, text=True, timeout=120)
    except Exception as e:
        return f"⚠️ Download succeeded, but enrichment failed: {e}"
        
    return "✅ Global ingestion completed. Results: " + ", ".join(results)