import re
from typing import Dict, Any

def parse_user_agent(user_agent: str) -> Dict[str, Any]:
    """
    Parsea el User-Agent para identificar el sistema operativo, navegador
    y tipo de dispositivo (desktop o mobile).
    """
    ua = user_agent or ""
    
    # 1. Determinar Sistema Operativo
    os_name = "Desconocido"
    if "Windows NT 10.0" in ua:
        os_name = "Windows 11" if "Edg/" in ua or "Chrome/" in ua else "Windows 10"
    elif "Windows" in ua:
        os_name = "Windows"
    elif "iPhone" in ua:
        os_name = "iOS (iPhone)"
    elif "iPad" in ua:
        os_name = "iPadOS (iPad)"
    elif "Android" in ua:
        match = re.search(r"Android\s+([\d\.]+)", ua)
        os_name = f"Android {match.group(1)}" if match else "Android"
    elif "Macintosh" in ua or "Mac OS X" in ua:
        os_name = "macOS"
    elif "Linux" in ua:
        os_name = "Linux"

    # 2. Determinar Navegador
    browser = "Navegador Web"
    if "Edg/" in ua or "Edge/" in ua:
        browser = "Microsoft Edge"
    elif "Chrome/" in ua and "Safari/" in ua:
        browser = "Google Chrome"
    elif "Firefox/" in ua:
        browser = "Mozilla Firefox"
    elif "Safari/" in ua and "Chrome/" not in ua:
        browser = "Apple Safari"
    elif "Opera/" in ua or "OPR/" in ua:
        browser = "Opera"
    elif "Postman" in ua:
        browser = "Postman Runtime"

    # 3. Determinar tipo de dispositivo
    is_mobile = any(keyword in ua.lower() for keyword in ["iphone", "android", "mobile", "ipad"])
    device_type = "mobile" if is_mobile else "desktop"

    # Etiqueta legible
    device_label = f"{browser} en {os_name}"

    return {
        "device": device_label,
        "device_type": device_type,
        "os": os_name,
        "browser": browser,
        "location": "México"  # Default / Geolocalización base
    }

def extract_client_ip(headers: Dict[str, str], client_host: str) -> str:
    """
    Obtiene la IP real del cliente analizando cabeceras X-Forwarded-For,
    X-Real-IP o fallback a client.host
    """
    x_forwarded_for = headers.get("x-forwarded-for")
    if x_forwarded_for:
        # La primera IP en la lista separada por comas es la original del cliente
        return x_forwarded_for.split(",")[0].strip()

    x_real_ip = headers.get("x-real-ip")
    if x_real_ip:
        return x_real_ip.strip()

    return client_host or "127.0.0.1"

