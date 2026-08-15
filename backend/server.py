"""
Emergent backend slot (port 8001).

This is a thin reverse-proxy that forwards all /api HTTP requests and the
/api/ws WebSocket to the Node.js game server (server.js) running on the
frontend port (default http://localhost:3000).

Why: The Emergent ingress routes external '/api/*' traffic to port 8001
(this FastAPI app) while everything else goes to port 3000 (Next.js).
The real game/matchmaking logic lives in the single authoritative Node
server (server.js) so it stays in sync with the GitHub/Vercel version.
This proxy just bridges 8001 -> 3000 so online multiplayer works in preview.
"""
import os
import asyncio

from fastapi import FastAPI, Request, Response, WebSocket, WebSocketDisconnect
import httpx
import websockets

NODE_TARGET = os.environ.get("NODE_TARGET", "http://localhost:3000")
NODE_WS_TARGET = NODE_TARGET.replace("https://", "wss://").replace("http://", "ws://")

app = FastAPI(title="Neon Pitch Striker - API Proxy")

_HOP_BY_HOP = {
    "content-encoding",
    "content-length",
    "transfer-encoding",
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "upgrade",
}


@app.get("/api/health")
async def health():
    return {"status": "ok", "proxy_target": NODE_TARGET}


@app.websocket("/api/ws")
async def ws_proxy(client_ws: WebSocket):
    await client_ws.accept()
    upstream_url = f"{NODE_WS_TARGET}/api/ws"
    try:
        async with websockets.connect(upstream_url, max_size=None) as upstream:

            async def client_to_upstream():
                try:
                    while True:
                        data = await client_ws.receive_text()
                        await upstream.send(data)
                except WebSocketDisconnect:
                    pass
                except Exception:
                    pass

            async def upstream_to_client():
                try:
                    async for message in upstream:
                        if isinstance(message, bytes):
                            message = message.decode("utf-8", errors="ignore")
                        await client_ws.send_text(message)
                except Exception:
                    pass

            t1 = asyncio.create_task(client_to_upstream())
            t2 = asyncio.create_task(upstream_to_client())
            done, pending = await asyncio.wait(
                {t1, t2}, return_when=asyncio.FIRST_COMPLETED
            )
            for task in pending:
                task.cancel()
    except Exception:
        pass
    finally:
        try:
            await client_ws.close()
        except Exception:
            pass


@app.api_route(
    "/api/{path:path}",
    methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
)
async def http_proxy(path: str, request: Request):
    url = f"{NODE_TARGET}/api/{path}"
    body = await request.body()
    fwd_headers = {
        k: v for k, v in request.headers.items() if k.lower() != "host"
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        upstream_resp = await client.request(
            request.method,
            url,
            params=dict(request.query_params),
            content=body,
            headers=fwd_headers,
        )
    resp_headers = {
        k: v
        for k, v in upstream_resp.headers.items()
        if k.lower() not in _HOP_BY_HOP
    }
    return Response(
        content=upstream_resp.content,
        status_code=upstream_resp.status_code,
        headers=resp_headers,
    )
