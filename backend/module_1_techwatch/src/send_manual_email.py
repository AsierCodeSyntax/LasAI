import sys
import json
import os
import psycopg
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

# load environment variables
load_dotenv()

def send_email_direct(subject: str, body: str, attachment_path: str) -> str:
    """Native Python function to send SMTP email, without relying on agents."""
    recipient_email = "aiglesias@codesyntax.com"
    print(f"📧 [API] Preparing to send email to {recipient_email}...")
    
    sender_email = os.environ.get("GMAIL_ADDRESS")
    app_password = os.environ.get("GMAIL_APP_PASSWORD")
    
    if not sender_email or not app_password:
        return "❌ Error: Missing credentials. Define GMAIL_ADDRESS and GMAIL_APP_PASSWORD in your environment."
        
    if not os.path.exists(attachment_path):
        return f"❌ Error: The attachment does not exist at the path: {attachment_path}"
        
    try:
        msg = EmailMessage()
        msg['Subject'] = subject
        msg['From'] = sender_email
        msg['To'] = recipient_email
        msg.set_content(body)
        
        with open(attachment_path, 'rb') as f:
            pdf_data = f.read()
            pdf_name = os.path.basename(attachment_path)
            
        msg.add_attachment(
            pdf_data, 
            maintype='application', 
            subtype='pdf', 
            filename=pdf_name
        )
        
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login(sender_email, app_password)
            smtp.send_message(msg)
            
        return f"✅ Email successfully sent to {recipient_email} with the attachment {pdf_name}"
        
    except Exception as e:
        return f"❌ System error while sending the email: {e}"


def main():
    print("🚀 [API] Starting manual email sending...")
    
    # 1. Send the email
    result = send_email_direct(
        subject="TechWatch - Weekly News Bulletin",
        body="Hello!\n\nHere is this week's news bulletin (attached as a PDF).\n\nBest regards,\nTechWatch Platform",
        attachment_path="/workspace/build/bulletin_compiled.pdf"
    )
    
    print(result)
    
    # If the direct email function returns an error, exit the script
    if "❌ Error" in result:
        sys.exit(1)

    # 2. "Consume" the news (Mark them as published)
    print("🗄️ [DB] Marking sent news items as 'published'...")
    bulletin_path = "/workspace/build/bulletin.json"
    
    if os.path.exists(bulletin_path):
        with open(bulletin_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        # EXTRACT THE IDs (Corrected to read from "sections"!)
        ids_to_publish = []
        for sec in data.get("sections", []):
            if "items" in sec:
                ids_to_publish.extend([item["id"] for item in sec["items"]])
                    
        # Update the database
        if ids_to_publish:
            db_url = os.environ.get("DATABASE_URL")
            with psycopg.connect(db_url) as conn:
                with conn.cursor() as cur:
                    # We use ANY(%s) to update multiple IDs in a single query
                    cur.execute(
                        "UPDATE items SET status = 'published' WHERE id = ANY(%s)",
                        (ids_to_publish,)
                    )
            print(f"✅ {len(ids_to_publish)} news items updated to 'published'.")
        else:
            print("⚠️ No IDs found in the bulletin. Was it empty?")
    else:
        print("⚠️ bulletin.json not found. DB was not updated.")

if __name__ == "__main__":
    main()