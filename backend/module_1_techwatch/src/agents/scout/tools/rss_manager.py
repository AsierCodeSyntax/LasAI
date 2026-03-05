import os
import requests
import feedparser
import psycopg
from langchain_core.tools import tool

@tool
def manage_rss_tool(action: str, url: str, topic: str = "", name: str = "") -> str:
    """
    Skill: RSS Manager.
    Allows validating, adding, or disabling RSS sources in the PostgreSQL database.
    - action: "check" (only validates), "add" (validates and adds to the DB), "disable" (disables in the DB).
    - url: The URL of the RSS feed.
    - topic: The assigned topic. Mandatory for the "add" action.
    - name: Name of the source (e.g., "Cybersecurity Blog").
    """
    print(f"📡 [Scout Skill: RSS Manager] Action: {action} | URL: {url}")
    
    # 1. Validate the RSS (Reasoning prior to the action)
    if action in ["check", "add"]:
        headers = {
            'User-Agent': 'Mozilla/5.0 (TechWatchBot/1.0)',
            'Accept': 'application/rss+xml, application/xml, text/xml, */*'
        }
        try:
            response = requests.get(url, headers=headers, timeout=15)
            response.raise_for_status()
            feed = feedparser.parse(response.content)
            
            if not feed.entries:
                return f"❌ The RSS {url} responds, but it does not contain valid articles."
            
            if action == "check":
                return f"✅ Valid RSS. Contains {len(feed.entries)} entries. Example: {feed.entries[0].get('title')}"
                
        except Exception as e:
            return f"❌ Error validating the RSS {url}: {str(e)}"

    # 2. Act on the Database
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        return "❌ Internal error: DATABASE_URL not found."

    try:
        with psycopg.connect(db_url) as conn:
            with conn.cursor() as cur:
                if action == "add":
                    if not topic:
                        return "❌ Error: I need to know the 'topic' (plone, django, ai) to save the RSS."
                    
                    source_id = name.lower().replace(" ", "_").replace(".", "")[:30] if name else "custom_rss"
                    cur.execute(
                        """
                        INSERT INTO sources (id, topic, source_type, name, url, enabled, updated_at)
                        VALUES (%s, %s, 'rss', %s, %s, true, now())
                        ON CONFLICT (id) DO UPDATE SET enabled = true, url = EXCLUDED.url
                        """,
                        (source_id, topic, name, url)
                    )
                    conn.commit()
                    return f"✅ RSS '{name}' saved successfully in the DB under the topic '{topic}'."
                    
                elif action == "disable":
                    cur.execute("UPDATE sources SET enabled = false WHERE url = %s", (url,))
                    conn.commit()
                    if cur.rowcount > 0:
                        return f"✅ RSS source '{url}' disabled in the DB."
                    return f"⚠️ I couldn't find any source with that URL to disable."
                    
    except Exception as e:
        return f"❌ Database Error: {str(e)}"
        
    return "❌ Invalid action. Use 'check', 'add', or 'disable'."