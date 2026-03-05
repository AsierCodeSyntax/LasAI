import os
import json
import yaml
import psycopg
from datetime import datetime

YAML_PATH = "/workspace/topics.yaml"
BUILD_DIR = "/workspace/build"
DB_URL = os.environ.get("DATABASE_URL")

def generate_dynamic_bulletin():
    print("📰 [Publisher] Starting dynamic news selection...")
    
    if not os.path.exists(YAML_PATH):
        print("❌ Error: topics.yaml not found")
        return
        
    with open(YAML_PATH, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}
    
    topics_dict = data.get("topics", data) if isinstance(data, dict) else data
    
    bulletin_data = {
        "generation_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "sections": [] 
    }
    
    total_news = 0

    with psycopg.connect(DB_URL) as conn:
        with conn.cursor() as cur:
            for slug, info in topics_dict.items():
                topic_name = info.get("name", slug.capitalize())
                topic_color = info.get("color", "#BED600")
                
                print(f"   🔍 Searching news for: {topic_name} ({slug})...")
                
                # 🧠 SPECIAL RULE FOR ARTIFICIAL INTELLIGENCE (Separate ArXiv and Official)
                if slug == "ai":
                    # 1. AI: Official Sources (Without ArXiv)
                    cur.execute("""
                        SELECT id, title, summary_short, url, llm_score 
                        FROM items 
                        WHERE topic = 'ai' 
                          AND source_id NOT LIKE '%arxiv%' 
                          AND status = 'translated' 
                          AND llm_score >= 6 
                          AND COALESCE(published_at, fetched_at) >= NOW() - INTERVAL '7 days'
                        ORDER BY llm_score DESC LIMIT 5
                    """)
                    items_official = [{"id": r[0], "title": r[1], "summary_short": r[2], "url": r[3], "llm_score": float(r[4])} for r in cur.fetchall()]                    
                    if items_official:
                        bulletin_data["sections"].append({
                            "slug": "ai_official",
                            "base_slug": "ai", # We use this for the LaTeX logo
                            "name": f"{topic_name}: Official Sources",
                            "color": topic_color,
                            "items": items_official
                        })
                        total_news += len(items_official)

                    # 2. AI: ArXiv Research (Only ArXiv)
                    cur.execute("""
                        SELECT id, title, summary_short, url, llm_score 
                        FROM items 
                        WHERE topic = 'ai' 
                          AND source_id LIKE '%arxiv%' 
                          AND status = 'translated' 
                          AND llm_score >= 6 
                          AND COALESCE(published_at, fetched_at) >= NOW() - INTERVAL '7 days'
                        ORDER BY llm_score DESC LIMIT 5
                    """)
                    items_arxiv = [{"id": r[0], "title": r[1], "summary_short": r[2], "url": r[3], "llm_score": float(r[4])} for r in cur.fetchall()]

                    if items_arxiv:
                        bulletin_data["sections"].append({
                            "slug": "ai_arxiv",
                            "base_slug": "ai",
                            "name": f"{topic_name}: ArXiv Research",
                            "color": topic_color,
                            "items": items_arxiv
                        })
                        total_news += len(items_arxiv)

                # 🌍 GENERAL RULE FOR THE REST OF DYNAMIC TOPICS
                else:
                    cur.execute("""
                        SELECT id, title, summary_short, url, llm_score 
                        FROM items 
                        WHERE topic = %s 
                          AND status = 'translated' 
                          AND llm_score >= 6 
                          AND COALESCE(published_at, fetched_at) >= NOW() - INTERVAL '14 days'
                        ORDER BY llm_score DESC LIMIT 5
                    """, (slug,))
                    
                    items = [{"id": r[0], "title": r[1], "summary_short": r[2], "url": r[3], "llm_score": float(r[4])} for r in cur.fetchall()]

                    if items:
                        bulletin_data["sections"].append({
                            "slug": slug,
                            "base_slug": slug,
                            "name": topic_name,
                            "color": topic_color,
                            "items": items
                        })
                        total_news += len(items)

    os.makedirs(BUILD_DIR, exist_ok=True)
    json_path = os.path.join(BUILD_DIR, "bulletin.json")
    
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(bulletin_data, f, indent=4, ensure_ascii=False)
        
    print(f"🚀 Selection completed with {total_news} total news.")

if __name__ == "__main__":
    generate_dynamic_bulletin()