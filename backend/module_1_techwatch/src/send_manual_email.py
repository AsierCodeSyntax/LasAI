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
    """Native Python function to send SMTP email, forcing TLS connection."""
    recipient_email = "aiglesias@codesyntax.eus"
    print(f"📧 [API] Preparing to send email to {recipient_email}...")
    
    # 1. Leer credenciales dinámicas
    smtp_host = os.environ.get("SMTP_HOST", "178.104.28.80")
    smtp_port = int(os.environ.get("SMTP_PORT", 587))
    smtp_user = os.environ.get("SMTP_USER", "")
    smtp_pass = os.environ.get("SMTP_PASS", "")
    sender_email = os.environ.get("SENDER_EMAIL", "lasIA@korpoweb.com")
    
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
        
        # 2. Lógica para conectar FORZANDO TLS (STARTTLS)
        print(f"   -> Connecting to {smtp_host}:{smtp_port} with TLS...")
        
        if smtp_port == 465:
            # Puerto 465 es el único que usa SSL directo tradicional
            with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=15) as smtp:
                if smtp_user and smtp_pass:
                    smtp.login(smtp_user, smtp_pass)
                smtp.send_message(msg)
        else:
            # Puertos 587 o 25 requieren activar TLS explícitamente
            with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as smtp:
                smtp.ehlo()           # 1. Saluda al servidor
                smtp.starttls()       # 2. 🔥 ACTIVA TLS COMO PIDIÓ EL SYSADMIN 🔥
                smtp.ehlo()           # 3. Vuelve a saludar por el túnel seguro
                
                # Si hay usuario/contraseña, se autentica
                if smtp_user and smtp_pass:
                    smtp.login(smtp_user, smtp_pass)
                
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
    
    # Si falla, abortamos
    if "❌" in result:
        print("⚠️ Email failed. Aborting database update.")
        sys.exit(1)

    # 2. "Consume" the news
    print("🗄️ [DB] Marking sent news items as 'published'...")
    bulletin_path = "/workspace/build/bulletin.json"
    
    if os.path.exists(bulletin_path):
        with open(bulletin_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        ids_to_publish = []
        for sec in data.get("sections", []):
            if "items" in sec:
                ids_to_publish.extend([item["id"] for item in sec["items"]])
                    
        if ids_to_publish:
            db_url = os.environ.get("DATABASE_URL")
            with psycopg.connect(db_url) as conn:
                with conn.cursor() as cur:
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