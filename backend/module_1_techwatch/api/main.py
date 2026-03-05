import os
import json
import subprocess
import requests
import psycopg
import trafilatura 
import hashlib
import yaml
import re
from datetime import datetime, timezone, timedelta
from bs4 import BeautifulSoup
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List

YAML_PATH = "/workspace/topics.yaml" 
SKILLS_DIR = "/workspace/src/agents/analyst/skills"

app = FastAPI(title="TechWatch API", description="API for React Dashboard")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="/workspace/build"), name="static")

class ManualNewsInput(BaseModel):
    url: str
    topic: str

@app.get("/")
def read_root():
    return {"status": "TechWatch API is running and ready! 🚀"}

@app.get("/api/bulletin/latest")
def get_latest_bulletin():
    bulletin_path = "/workspace/build/bulletin.json"
    if not os.path.exists(bulletin_path):
        raise HTTPException(status_code=404, detail=" There is not already any bulletin.json generated.")
    with open(bulletin_path, "r", encoding="utf-8") as f:
        return json.load(f)

@app.post("/api/bulletin/run")
def run_bulletin_generation():
    try:
        subprocess.run(["python", "src/select_week.py"], check=True, cwd="/workspace")
        subprocess.run(["python", "src/generate_pdf.py"], check=True, cwd="/workspace")
        
        return {"message": "Draft and PDF successfully generated. Ready for review."}
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Error generating bulletin: {str(e)}")
@app.post("/api/news/manual")
def add_manual_news(news: ManualNewsInput):
    """Download the news manually using Trafilatura to extract only the clean article."""
    try:
        # 1. Try to download the URL with Trafilatura
        downloaded = trafilatura.fetch_url(news.url)
        
        # If Trafilatura fails due to some blockage, we use a normal request as a backup plan
        if not downloaded:
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
            res = requests.get(news.url, headers=headers, timeout=15)
            res.raise_for_status()
            downloaded = res.text

        # 2. Extract only the useful text and metadata (title)
        text_content = trafilatura.extract(downloaded)
        metadata = trafilatura.extract_metadata(downloaded)
        
        # If metadata has a title, we use it; otherwise, we try with BeautifulSoup
        if metadata and metadata.title:
            title = metadata.title
        else:
            soup = BeautifulSoup(downloaded, 'html.parser')
            title_tag = soup.find('title')
            title = title_tag.text.strip() if title_tag else news.url

        if not text_content:
            # If Trafilatura doesn't extract text, we use BeautifulSoup as a fallback
            soup = BeautifulSoup(downloaded, 'html.parser')
            for bad_tag in soup(["script", "style", "nav", "footer", "aside"]):
                bad_tag.decompose()
            text_content = soup.get_text(separator=" ", strip=True)
            
        # Limit to 5000 characters to avoid overwhelming the AI model
        text_content = text_content[:5000]

        content_hash = hashlib.sha256(text_content.encode("utf-8", errors="ignore")).hexdigest()
        raw_data = json.dumps({
            "source_type": "manual",
            "original_url": news.url,
            "method": "trafilatura"
        }, ensure_ascii=False)
        # 3. Save in DB as a perfect news item ready for the Analyst
        db_url = os.environ.get("DATABASE_URL")
        now = datetime.now(timezone.utc)
        
        inserted_id = None
        with psycopg.connect(db_url) as conn:
            with conn.cursor() as cur:
                # Now content_hash and raw fields are also included
                cur.execute(
                    """
                    INSERT INTO items 
                    (topic, source_id, source_type, title, url, canonical_url, published_at, fetched_at, content_text, content_hash, raw, status, priority, tags)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb, 'ready', 100, ARRAY['manual'])
                    ON CONFLICT (topic, canonical_url) DO NOTHING
                    RETURNING id;
                    """,
                    (
                        news.topic, 
                        "manual_submission", 
                        "manual", 
                        title, 
                        news.url, 
                        news.url,
                        now, 
                        now, 
                        text_content,
                        content_hash, 
                        raw_data      
                    )
                )
                result = cur.fetchone()
                if result:
                    inserted_id = result[0]
                conn.commit()
        
        if inserted_id:
            return {"message": f"!Success! New saved and cleaned with ID {inserted_id}."}
        else:
            return {"message": "The news item already exists in the database."}

    except Exception as e:
        print(f"❌ Error injecting manual news item: {e}")
        raise HTTPException(status_code=500, detail=f"Could not process the URL: {str(e)}")
    

@app.post("/api/bulletin/send")
def send_bulletin_email():
    """Executes the script that fetches the PDF and sends it via Gmail."""
    try:
        subprocess.run(["python", "src/send_manual_email.py"], check=True, cwd="/workspace")
        return {"message": "✅ Email sent successfully to the recipient!"}
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail="Error sending the email. Please check the credentials in Docker.")
    
@app.post("/api/bulletin/discard/{item_id}")
def discard_news_item(item_id: int):
    """Marks a news item as rejected and regenerates the bulletin with the next best option."""
    try:
        # 1. Change the status in the database to 'rejected'
        db_url = os.environ.get("DATABASE_URL")
        with psycopg.connect(db_url) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE items SET status = 'rejected' WHERE id = %s",
                    (item_id,)
                )
                conn.commit()

        # 2. Regenerate the JSON 
        subprocess.run(["python", "src/select_week.py"], check=True, cwd="/workspace")
        
        # 3. Regenerate the PDF
        subprocess.run(["python", "src/generate_pdf.py"], check=True, cwd="/workspace")

        return {"message": f"News item {item_id} rejected and bulletin regenerated."}
        
    except Exception as e:
        print(f"❌ Error while rejecting news item: {e}")
        raise HTTPException(status_code=500, detail=f"Could not discard the news item: {str(e)}")
@app.get("/api/archive")
def list_archived_bulletins():
    """Returns the list of all PDFs saved in the archive."""
    archive_dir = "/workspace/build/archive"
    
    # If the folder doesn't exist yet (because no archive has been generated), return an empty list
    if not os.path.exists(archive_dir):
        return {"pdfs": []}
        
    pdfs = []
    for filename in os.listdir(archive_dir):
        if filename.endswith(".pdf"):
            file_path = os.path.join(archive_dir, filename)
            # Extract the date from the filename (e.g., bulletin_2026-02-27.pdf -> 2026-02-27)
            date_str = filename.replace("bulletin_", "").replace(".pdf", "")
            size_mb = os.path.getsize(file_path) / (1024 * 1024)
            
            pdfs.append({
                "id": filename,
                "filename": filename,
                "url": f"/static/archive/{filename}",
                "date": date_str,
                "size_mb": round(size_mb, 2)
            })
            
    # Sort from most recent to oldest
    pdfs.sort(key=lambda x: x["date"], reverse=True)
    
    return {"pdfs": pdfs}
# ----- MODELS AND ENDPOINTS FOR TOPICS AND SOURCES MANAGEMENT -----
class TopicInput(BaseModel):
    name: str
    color: str
    keywords: list[str]

@app.get("/api/topics")
def get_all_topics():
    if not os.path.exists(YAML_PATH):
        return {}
    
    with open(YAML_PATH, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}
        
    topics_dict = data.get("topics", data) if isinstance(data, dict) else data
    
    # 🪄 MAGIC: Auto-Synchronization with orphan .md files
    for slug, info in topics_dict.items():
        md_path = os.path.join(SKILLS_DIR, f"{slug.upper()}_EVALUATION.md")
        
        # If the .md file exists physically...
        if os.path.exists(md_path):
            info["rubricMode"] = "custom"
            
            # If the YAML didn't have the texts saved, we extract them by reading the .md
            if "customRubric" not in info:
                with open(md_path, "r", encoding="utf-8") as f:
                    md_content = f.read()
                
                # We use regular expressions to pull the text between Tiers
                t1 = re.search(r'### TIER 1.*?\n(.*?)### TIER 2', md_content, re.DOTALL)
                t2 = re.search(r'### TIER 2.*?\n(.*?)### TIER 3', md_content, re.DOTALL)
                t3 = re.search(r'### TIER 3.*?\n(.*?)### TIER 4', md_content, re.DOTALL)
                t4 = re.search(r'### TIER 4.*?\n(.*?)## 🛑 PENALTIES', md_content, re.DOTALL)
                pen = re.search(r'## 🛑 PENALTIES\n(.*)', md_content, re.DOTALL)
                
                # We inject the data so React receives the filled form
                info["customRubric"] = {
                    "tier1": t1.group(1).strip() if t1 else "",
                    "tier2": t2.group(1).strip() if t2 else "",
                    "tier3": t3.group(1).strip() if t3 else "",
                    "tier4": t4.group(1).strip() if t4 else "",
                    "penalties": pen.group(1).strip() if pen else ""
                }
        else:
            # If there is no .md file, it is 100% dynamic
            info["rubricMode"] = "dynamic"
            
    return topics_dict

@app.post("/api/topics")
def create_topic(topic: TopicInput):
    """Creates a new topic in the yaml file."""
    yaml_path = "/workspace/topics.yaml"
    data = {}
    if os.path.exists(yaml_path):
        with open(yaml_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
            
    # Generate slug from the name (e.g., "Web Cybersecurity" -> "web_cybersecurity")
    slug = re.sub(r'[^a-z0-9]', '_', topic.name.lower().strip())
    
    data[slug] = {
        "name": topic.name,
        "color": topic.color,
        "keywords": [k.strip().lower() for k in topic.keywords if k.strip()]
    }
    
    with open(yaml_path, "w", encoding="utf-8") as f:
        yaml.dump(data, f, default_flow_style=False, allow_unicode=True, sort_keys=False)
        
    return {"message": "Topic successfully created", "slug": slug}

@app.delete("/api/topics/{slug}")
def delete_topic(slug: str):
    """Deletes a topic."""
    yaml_path = "/workspace/topics.yaml"
    if not os.path.exists(yaml_path):
        raise HTTPException(status_code=404, detail="Topics file not found.")
        
    with open(yaml_path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}
        
    if slug in data:
        del data[slug]
        with open(yaml_path, "w", encoding="utf-8") as f:
            yaml.dump(data, f, default_flow_style=False, allow_unicode=True, sort_keys=False)
        return {"message": "Topic deleted."}
    else:
        raise HTTPException(status_code=404, detail="Topic not found.")
    
# --- MODELS FOR RSS ---
class RSSSource(BaseModel):
    name: str
    url: str
    topic: str
    
class IAReputationScore(BaseModel):
    url: str
    score: float

def validate_rss_url(url: str) -> bool:
    """Quickly checks if a URL returns a valid XML/RSS."""
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        res = requests.get(url, headers=headers, timeout=10)
        res.raise_for_status()
        content = res.text.lower()
        if "<?xml" in content or "<rss" in content or "<feed" in content:
            return True
        return False
    except:
        return False

from urllib.parse import urlparse

def get_domain(url: str) -> str:
    """Extracts the base domain to cross-reference in the DB."""
    try:
        domain = urlparse(url).netloc
        if domain.startswith("www."):
            domain = domain[4:]
        return domain
    except:
        return url

@app.get("/api/sources")
def get_all_sources():
    """Reads and returns all sources from the YAMLs and cross-references with PostgreSQL for the average score."""
    sources = []
    
    # 1. READ MANUAL SOURCES (sources.yaml)
    yaml_path_manual = "/workspace/sources.yaml"
    if os.path.exists(yaml_path_manual):
        with open(yaml_path_manual, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
            topics = data.get("topics", {})
            for topic_name, topic_data in topics.items():
                if isinstance(topic_data, dict):
                    for src in topic_data.get("sources", []):
                        if isinstance(src, dict) and "url" in src:
                            sources.append({
                                "id": f"manual_{src.get('id', len(sources))}",
                                "name": src.get("name", "RSS Feed"),
                                "url": src["url"],
                                "topic": topic_name,
                                "type": "manual",
                                "status": "pending"
                            })

    # 2. READ AI SOURCES (sources_ia.yaml)
    yaml_path_ia = "/workspace/sources_ia.yaml"
    if os.path.exists(yaml_path_ia):
        with open(yaml_path_ia, "r", encoding="utf-8") as f:
            data_ia = yaml.safe_load(f) or {}
            for topic_name, topic_data in data_ia.items():
                if isinstance(topic_data, dict):
                    for src in topic_data.get("rss", []):
                        if isinstance(src, dict) and "url" in src:
                            sources.append({
                                "id": f"ia_{topic_name}_{len(sources)}",
                                "name": src.get("name", "AI Discovered Feed"),
                                "url": src["url"],
                                "topic": topic_name,
                                "type": "ai",
                                "status": "pending",
                                # We force float so the frontend reads it correctly
                                "score": float(src.get("score", 5.0)) 
                            })

    # 3. CALCULATE AVERAGE DB SCORE
    db_url = os.environ.get("DATABASE_URL")
    try:
        with psycopg.connect(db_url) as conn:
            with conn.cursor() as cur:
                for s in sources:
                    domain = get_domain(s["url"])
                    cur.execute("""
                        SELECT AVG(llm_score) FROM items 
                        WHERE url LIKE %s AND llm_score IS NOT NULL
                    """, (f"%{domain}%",))
                    result = cur.fetchone()
                    if result and result[0] is not None:
                        s["avg_score"] = float(result[0])
    except Exception as e:
        print(f"Warning: Could not calculate the average. {e}")

    return {"sources": sources}

@app.post("/api/sources/validate")
def validate_single_source(source: RSSSource):
    """Validates a URL and returns whether it is live or broken."""
    is_valid = validate_rss_url(source.url)
    if not is_valid:
        raise HTTPException(status_code=400, detail="The URL does not appear to be a valid RSS or is down.")
    return {"message": "Valid RSS", "status": "valid"}

@app.post("/api/sources")
def add_new_source(source: RSSSource):
    """Adds a new source to the manual YAML (sources.yaml)."""
    if not validate_rss_url(source.url):
        raise HTTPException(status_code=400, detail="The link is not a valid RSS.")
        
    yaml_path = "/workspace/sources.yaml"
    data = {}
    if os.path.exists(yaml_path):
        with open(yaml_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
            
    if "topics" not in data:
        data["topics"] = {}
        
    topic_key = source.topic.lower()
    if topic_key not in data["topics"]:
        data["topics"][topic_key] = {"sources": []}
        
    existing_urls = [s.get("url") for s in data["topics"][topic_key]["sources"] if isinstance(s, dict)]
    
    if source.url not in existing_urls:
        clean_id = re.sub(r'[^a-z0-9]', '_', source.name.lower())
        if not clean_id:
            clean_id = f"custom_rss_{len(existing_urls)}"
            
        new_source = {
            "id": clean_id,
            "type": "rss",
            "name": source.name,
            "url": source.url,
            "tags": ["custom"]
        }
        
        data["topics"][topic_key]["sources"].append(new_source)
        
        with open(yaml_path, "w", encoding="utf-8") as f:
            yaml.dump(data, f, default_flow_style=False, allow_unicode=True, sort_keys=False)
            
    return {"message": "Source saved successfully."}

@app.delete("/api/sources")
def delete_source(topic: str, url: str, type: str = "manual"):
    """Deletes a source from the corresponding YAML (manual or AI)."""
    yaml_path = "/workspace/sources.yaml" if type == "manual" else "/workspace/sources_ia.yaml"
    
    if not os.path.exists(yaml_path):
        return {"message": "YAML file does not exist."}
        
    with open(yaml_path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}
        
    topic_key = topic.lower()
    target_url = url.strip().rstrip("/")
    
    if type == "manual":
        if "topics" in data and topic_key in data["topics"] and "sources" in data["topics"][topic_key]:
            sources_list = data["topics"][topic_key]["sources"]
            new_sources_list = [s for s in sources_list if isinstance(s, dict) and s.get("url", "").strip().rstrip("/") != target_url]
            data["topics"][topic_key]["sources"] = new_sources_list
    else: # type == "ai"
        if topic_key in data and "rss" in data[topic_key]:
            sources_list = data[topic_key]["rss"]
            new_sources_list = [s for s in sources_list if isinstance(s, dict) and s.get("url", "").strip().rstrip("/") != target_url]
            data[topic_key]["rss"] = new_sources_list
            
    with open(yaml_path, "w", encoding="utf-8") as f:
        yaml.dump(data, f, default_flow_style=False, allow_unicode=True, sort_keys=False)
                
    return {"message": f"{type.capitalize()} source deleted successfully."}

@app.put("/api/sources/ia/score")
def update_ia_reputation(score_data: IAReputationScore):
    """Updates the manual score in the AI YAML."""
    yaml_path = "/workspace/sources_ia.yaml"
    if not os.path.exists(yaml_path):
        raise HTTPException(status_code=404, detail="AI YAML file does not exist.")
        
    with open(yaml_path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}
        
    updated = False
    target_url = score_data.url.strip().rstrip("/") # We normalize the URL to avoid errors with trailing slashes
    
    for topic, t_data in data.items():
        if isinstance(t_data, dict) and "rss" in t_data:
            for s in t_data["rss"]:
                if isinstance(s, dict):
                    s_url = s.get("url", "").strip().rstrip("/")
                    if s_url == target_url:
                        # If it is an exact integer, we save it as int so it looks nice in YAML (e.g., 8 instead of 8.0)
                        val = score_data.score
                        s["score"] = int(val) if val.is_integer() else val
                        updated = True
                    
    if updated:
        with open(yaml_path, "w", encoding="utf-8") as f:
            yaml.dump(data, f, default_flow_style=False, allow_unicode=True, sort_keys=False)
        return {"message": "Score updated"}
    else:
        raise HTTPException(status_code=404, detail="Source not found in AI YAML")

@app.get("/api/sources/articles")
def get_recent_articles_for_source(url: str):
    """Returns the last 3 translated articles from a source."""
    db_url = os.environ.get("DATABASE_URL")
    domain = get_domain(url)
    
    with psycopg.connect(db_url) as conn:
        with conn.cursor() as cur:
            # Added the filter AND status IN ('translated', 'published')
            cur.execute("""
                SELECT id, title, llm_score, url 
                FROM items 
                WHERE url LIKE %s 
                  AND llm_score IS NOT NULL 
                  AND status IN ('translated', 'published')
                ORDER BY id DESC LIMIT 3
            """, (f"%{domain}%",))
            
            articles = []
            for row in cur.fetchall():
                articles.append({
                    "id": row[0],
                    "title": row[1],
                    "llm_score": float(row[2]),
                    "url": row[3]
                })
                
    return {"articles": articles}


#dashboard stats endpoint
@app.get("/api/dashboard/stats")
def get_dashboard_stats():
    """Gathers real statistics from the DB and YAMLs for the dashboard."""
    db_url = os.environ.get("DATABASE_URL")
    now = datetime.now(timezone.utc)
    seven_days_ago = now - timedelta(days=7)

    
    # 1. Count active sources in the YAMLs
    active_sources = 0
    
    # File 1: sources.yaml (Structure: topics -> plone -> sources)
    if os.path.exists("/workspace/sources.yaml"):
        with open("/workspace/sources.yaml", "r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
            if "topics" in data:
                for t, t_data in data["topics"].items():
                    if isinstance(t_data, dict) and "sources" in t_data:
                        active_sources += len(t_data["sources"])

    # File 2: sources_ia.yaml (Structure: ai -> rss)
    if os.path.exists("/workspace/sources_ia.yaml"):
        with open("/workspace/sources_ia.yaml", "r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
            for t, t_data in data.items():
                # We verify that it is a dictionary and has the 'rss' key
                if isinstance(t_data, dict) and "rss" in t_data:
                    active_sources += len(t_data["rss"])

    with psycopg.connect(db_url) as conn:
        with conn.cursor() as cur:
            # 2. KPIs for the last 7 days
            cur.execute("SELECT COUNT(*) FROM items WHERE fetched_at >= %s", (seven_days_ago,))
            ingested_count = cur.fetchone()[0]

            cur.execute("SELECT COUNT(*) FROM items WHERE fetched_at >= %s AND llm_score >= 8", (seven_days_ago,))
            high_quality_count = cur.fetchone()[0]

            cur.execute("SELECT COUNT(*) FROM items WHERE fetched_at >= %s AND 'manual' = ANY(tags)", (seven_days_ago,))
            manual_count = cur.fetchone()[0]

            # 3. Volume Chart (Last 7 days)
            cur.execute("""
                SELECT DATE(fetched_at), COUNT(*)
                FROM items
                WHERE fetched_at >= %s
                GROUP BY DATE(fetched_at)
            """, (seven_days_ago,))
            daily_counts = dict(cur.fetchall())

            ingestion_data = []
            for i in range(6, -1, -1):
                day_date = (now - timedelta(days=i)).date()
                day_name = day_date.strftime("%a") # Mon, Tue, etc.
                ingestion_data.append({
                    "day": day_name,
                    "articles": daily_counts.get(day_date, 0)
                })

           # Load topics to use their real names
            topics_data = {}
            if os.path.exists("/workspace/topics.yaml"):
                with open("/workspace/topics.yaml", "r", encoding="utf-8") as f:
                    topics_data = yaml.safe_load(f) or {}

            def get_topic_name(slug):
                return topics_data.get(slug, {}).get("name", slug.upper())

            # 4. Average Quality by Topic
            cur.execute("""
                SELECT topic, AVG(llm_score)
                FROM items
                WHERE llm_score IS NOT NULL
                GROUP BY topic
            """)
            quality_data = [{"topic": get_topic_name(row[0]), "score": round(row[1], 1)} for row in cur.fetchall()]

            # 5. Source Distribution
            cur.execute("SELECT source_type, COUNT(*) FROM items GROUP BY source_type")
            source_dist = []
            for row in cur.fetchall():
                s_type = row[0] or "unknown"
                name = "RSS" if s_type == "rss" else "Scrape" if s_type == "scrape" else "Manual" if s_type == "manual" else s_type.capitalize()
                source_dist.append({"name": name, "value": row[1]})
            if not source_dist:
                source_dist = [{"name": "No data", "value": 1}] 

            # 6. Top 3 Articles of the day/week
            cur.execute("""
                SELECT id, title, topic, llm_score
                FROM items
                WHERE llm_score IS NOT NULL 
                ORDER BY llm_score DESC, published_at DESC
                LIMIT 3
            """)
            top_articles = []
            for row in cur.fetchall():
                top_articles.append({
                    "id": row[0],
                    "title": row[1],
                    "topic": get_topic_name(row[2]),
                    "score": float(row[3])
                })

    return {
        "kpis": {
            "active_sources": active_sources,
            "ingested": ingested_count,
            "high_quality": high_quality_count,
            "manual": manual_count
        },
        "ingestion_data": ingestion_data,
        "quality_by_topic": quality_data,
        "source_distribution": source_dist,
        "top_articles": top_articles
    }
# =====================================================================
#           TOPICS MANAGEMENT (Reading/Writing topics.yaml)
# =====================================================================

class TopicInput(BaseModel):
    name: str
    color: str
    keywords: List[str]

@app.get("/api/topics")
def get_all_topics():
    """Reads the topics.yaml adapting to your structure without a root 'topics:'."""
    yaml_path = "/workspace/topics.yaml"
    if not os.path.exists(yaml_path):
        return {}
    
    with open(yaml_path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}
        
    if "topics" in data and isinstance(data["topics"], dict):
        return data["topics"]
    return data

@app.post("/api/topics/{slug}")
def save_or_update_topic(slug: str, topic: TopicInput):
    """Creates or updates a topic in the YAML. Goodbye Error 422!"""
    yaml_path = "/workspace/topics.yaml"
    data = {}
    if os.path.exists(yaml_path):
        with open(yaml_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}

    root = data.get("topics") if "topics" in data else data
    if not isinstance(root, dict):
        root = {}

    root[slug] = {
        "name": topic.name,
        "color": topic.color,
        "keywords": topic.keywords
    }

    if "topics" in data:
        data["topics"] = root
    else:
        data = root

    with open(yaml_path, "w", encoding="utf-8") as f:
        yaml.dump(data, f, allow_unicode=True, sort_keys=False)

    return {"message": f"Topic '{slug}' saved successfully"}

@app.delete("/api/topics/{slug}")
def delete_topic_endpoint(slug: str):
    """Deletes a topic from the YAML."""
    yaml_path = "/workspace/topics.yaml"
    if os.path.exists(yaml_path):
        with open(yaml_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}

        root = data.get("topics") if "topics" in data else data
        if isinstance(root, dict) and slug in root:
            del root[slug]
            
            if "topics" in data:
                data["topics"] = root
            else:
                data = root

            with open(yaml_path, "w", encoding="utf-8") as f:
                yaml.dump(data, f, allow_unicode=True, sort_keys=False)

    return {"message": "Topic deleted"}


# =====================================================================
#           DYNAMIC MANAGEMENT OF HEADINGS (ANALYST SKILLS)
# =====================================================================

SKILLS_DIR = "/workspace/src/agents/analyst/skills"

class SkillFormInput(BaseModel):
    tier1_critical: str
    tier2_senior: str
    tier3_mid: str
    tier4_junk: str
    penalties: List[str]

@app.get("/api/topics/{slug}/skill")
def get_topic_skill(slug: str):
    """Returns the content of the .md if it exists, or warns that the dynamic one is used."""
    file_path = os.path.join(SKILLS_DIR, f"{slug.upper()}_EVALUATION.md")
    
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            return {"status": "custom", "content": f.read()}
            
    return {"status": "dynamic", "content": "The system is generating the rubric on the fly based on the keywords."}

@app.post("/api/topics/{slug}/skill/form")
def save_topic_skill_form(slug: str, form_data: SkillFormInput):
    """Receives a simple form from React and assembles a professional Markdown behind the scenes."""
    yaml_path = "/workspace/topics.yaml"
    topic_name = slug.capitalize()
    keywords_str = "TBD"
    
    if os.path.exists(yaml_path):
        with open(yaml_path, "r", encoding="utf-8") as f:
            topics_data = yaml.safe_load(f) or {}
            
        # Ensure we read the name and keywords correctly according to your structure
        root = topics_data.get("topics") if "topics" in topics_data else topics_data
        if isinstance(root, dict) and slug in root:
            topic_name = root[slug].get("name", topic_name)
            keywords_str = ", ".join(root[slug].get("keywords", []))

    penalties_md = "\n".join([f"- {p}" for p in form_data.penalties if p.strip()])
    if not penalties_md:
        penalties_md = "- No specific penalties defined."

    md_content = f"""# SKILL MODULE: {topic_name} Technical Evaluation
**Domain:** {topic_name}, {keywords_str}

## 🧠 CONTEXT
You are evaluating news, articles, and releases related to the {topic_name} ecosystem. You must distinguish between marketing fluff, beginner tutorials, and high-impact technical content that matters for production systems.

## ⚖️ SCORING RUBRIC (0.0 to 10.0)

### TIER 1: Critical & Official (Score: 9.0 - 10.0)
{form_data.tier1_critical}

### TIER 2: Senior Engineering & Production (Score: 7.0 - 8.9)
{form_data.tier2_senior}

### TIER 3: Mid-Level & Standard Tutorials (Score: 4.0 - 6.9)
{form_data.tier3_mid}

### TIER 4: Junk, Clickbait, or Irrelevant (Score: 0.0 - 3.9)
{form_data.tier4_junk}

## 🛑 PENALTIES
{penalties_md}
"""
    
    os.makedirs(SKILLS_DIR, exist_ok=True)
    file_path = os.path.join(SKILLS_DIR, f"{slug.upper()}_EVALUATION.md")
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(md_content)
        
    return {"message": f"Rubric for {topic_name} created successfully from the form."}

# TEMPORARILY DISABLED: We don't need to upload files for now, so we avoid installing python-multipart
# @app.post("/api/topics/{slug}/skill/upload")
# async def upload_topic_skill(slug: str, file: UploadFile = File(...)):
#    ...

class UploadMDInput(BaseModel):
    content: str

@app.post("/api/topics/{slug}/skill/upload")
def upload_topic_skill_json(slug: str, payload: UploadMDInput):
    """Uploads an .md file directly by reading the text from React."""
    os.makedirs(SKILLS_DIR, exist_ok=True)
    file_path = os.path.join(SKILLS_DIR, f"{slug.upper()}_EVALUATION.md")
    
    # 1. We save the physical file with the automatic name
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(payload.content)
        
    # 2. We synchronize the topics.yaml so it knows it is now Custom
    if os.path.exists(YAML_PATH):
        with open(YAML_PATH, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
        root = data.get("topics") if "topics" in data else data
        
        if isinstance(root, dict) and slug in root:
            root[slug]["rubricMode"] = "custom"
            
            if "topics" in data:
                data["topics"] = root
            else:
                data = root
                
            with open(YAML_PATH, "w", encoding="utf-8") as f:
                yaml.dump(data, f, allow_unicode=True, sort_keys=False)
                
    return {"message": "Markdown file uploaded and saved correctly."}

@app.delete("/api/topics/{slug}/skill")
def delete_topic_skill(slug: str):
    """Deletes the physical file. The Analyst will revert to being dynamic."""
    file_path = os.path.join(SKILLS_DIR, f"{slug.upper()}_EVALUATION.md")
    
    if os.path.exists(file_path):
        os.remove(file_path)
        return {"message": "Custom rubric deleted. The system will revert to using the Dynamic Rubric in memory."}