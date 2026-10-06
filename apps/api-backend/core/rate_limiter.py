import time
from collections import defaultdict
from fastapi import Request, HTTPException, status
from typing import Dict, List, Tuple

class InMemoryRateLimiter:
    """
    Controlador de Rate Limiting en memoria para protección contra ataques de fuerza bruta y DoS.
    Implementa ventana deslizante (sliding window) por IP y ruta.
    """
    def __init__(self, max_requests: int = 15, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._requests: Dict[str, List[float]] = defaultdict(list)

    def _clean_old_requests(self, key: str, current_time: float):
        cutoff = current_time - self.window_seconds
        self._requests[key] = [t for t in self._requests[key] if t > cutoff]

    async def __call__(self, request: Request):
        client_ip = request.client.host if request.client else "127.0.0.1"
        route = request.url.path
        key = f"{client_ip}:{route}"
        now = time.time()

        self._clean_old_requests(key, now)

        if len(self._requests[key]) >= self.max_requests:
            retry_after = int(self.window_seconds - (now - self._requests[key][0]))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Demasiadas solicitudes en poco tiempo. Límite de tasa excedido para proteger el servicio.",
                headers={"Retry-After": str(max(1, retry_after))}
            )

        self._requests[key].append(now)

# Instancias predefinidas según criticidad
auth_rate_limiter = InMemoryRateLimiter(max_requests=10, window_seconds=60) # 10 intentos por minuto
api_rate_limiter = InMemoryRateLimiter(max_requests=120, window_seconds=60) # 120 peticiones por minuto
