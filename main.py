import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import Optional
import json

# --- Configuración de Correo Electrónico (Gmail) ---
# Usa variables de entorno para las credenciales por seguridad en el despliegue
class EmailConfig:
    """Configuración para el envío de correos, leyendo variables de entorno."""
    # ¡IMPORTANTE! Configura estas variables en tu servicio de despliegue (Render/Railway)
    EMAIL_USER = os.environ.get("EMAIL_USER", "tu_correo@gmail.com") 
    EMAIL_PASS = os.environ.get("EMAIL_PASS", "TU_PASSWORD_DE_APLICACION") 
    SMTP_SERVER = "smtp.gmail.com"
    SMTP_PORT = 587
    RECIPIENT_EMAIL = os.environ.get("RECIPIENT_EMAIL", "correo_destino@ejemplo.com") 

# Inicia la aplicación de FastAPI
app = FastAPI()

# Configura CORS (Asegúrate de usar la URL donde se aloja tu GitHub Pages)
origins = [
    "http://127.0.0.1:5500",
    "https://TU_USUARIO.github.io" # ¡Reemplaza con tu usuario real!
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Función de Envío de Correo (Asíncrona para mayor eficiencia) ---
def send_email_notification(contact_data: dict):
    """
    Envía una notificación por correo electrónico con los datos del contacto.
    """
    if not EmailConfig.EMAIL_USER or not EmailConfig.RECIPIENT_EMAIL or EmailConfig.EMAIL_PASS == "TU_PASSWORD_DE_APLICACION":
        # Esta es la advertencia que verás en la consola si no configuras el env
        print("Advertencia: Variables de correo no configuradas correctamente. Saltando el envío de email.")
        return

    body = f"""
    ¡Nuevo mensaje de contacto recibido!
    -----------------------------------
    Nombre: {contact_data.get('nombre', 'N/A')}
    Empresa: {contact_data.get('empresa', 'N/A')}
    Teléfono: {contact_data.get('telefono', 'N/A')}
    Servicio Solicitado: {contact_data.get('servicio', 'N/A')}
    Mensaje:
    ---
    {contact_data.get('mensaje', 'Sin mensaje.')}
    """
    
    msg = MIMEMultipart()
    msg['From'] = EmailConfig.EMAIL_USER
    msg['To'] = EmailConfig.RECIPIENT_EMAIL
    msg['Subject'] = f"Nuevo Contacto: {contact_data.get('nombre', 'Desconocido')}"
    msg.attach(MIMEText(body, 'plain'))

    try:
        server = smtplib.SMTP(EmailConfig.SMTP_SERVER, EmailConfig.SMTP_PORT)
        server.starttls()
        server.login(EmailConfig.EMAIL_USER, EmailConfig.EMAIL_PASS)
        server.sendmail(EmailConfig.EMAIL_USER, EmailConfig.RECIPIENT_EMAIL, msg.as_string())
        server.quit()
        print(f"Correo enviado exitosamente a {EmailConfig.RECIPIENT_EMAIL}")
    except Exception as e:
        print(f"ERROR AL ENVIAR EL CORREO: {e}")
        # En el proyecto empresarial C#, esto se registraría formalmente.
        
# --- El Endpoint de Contacto ---
@app.post("/contacto/")
async def create_contact(request: Request):
    """
    Recibe los datos del formulario de contacto y envía una notificación por correo.
    """
    try:
        form_data = await request.form()
        
        # Preparamos los datos
        contact_data = {
            "nombre": form_data.get("nombre"),
            "empresa": form_data.get("empresa"),
            "telefono": form_data.get("telefono"),
            "servicio": form_data.get("servicio"),
            "mensaje": form_data.get("mensaje"),
        }
        
        # 1. Enviar Correo de Notificación (Ya no hay DB, solo el email)
        send_email_notification(contact_data)

        # 2. Retornar fragmento de HTML de éxito para HTMX
        return HTMLResponse(content="<div class='p-4 bg-green-100 border-l-4 border-green-500 text-green-700' role='alert'><p class='font-bold'>¡Mensaje recibido con éxito!</p><p>Te contactaremos pronto. Se ha enviado una notificación por correo.</p></div>", status_code=200)

    except Exception as e:
        print(f"Error en create_contact: {e}")
        # Retornar fragmento de HTML de error para HTMX
        return HTMLResponse(content=f"<div class='p-4 bg-red-100 border-l-4 border-red-500 text-red-700' role='alert'><p class='font-bold'>Error al enviar el mensaje.</p><p>Por favor, inténtalo de nuevo.</p></div>", status_code=500)

# Endpoint de ejemplo para verificar que la aplicación está funcionando
@app.get("/", response_class=HTMLResponse)
async def read_root():
    return "<h1>Servidor de Contacto de FastAPI funcionando.</h1>"
