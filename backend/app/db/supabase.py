import httpx
from typing import Any, Dict, List, Optional
from fastapi import HTTPException
from app.core.config import settings

class SupabaseService:
    def __init__(self, token: str):
        self.token = token
        self.headers = {
            "Authorization": f"Bearer {token}",
            "apikey": settings.SUPABASE_ANON_KEY,
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }
        self.base_url = f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1"

    async def get(self, table: str, params: Optional[Dict[str, Any]] = None, extra_headers: Optional[Dict[str, str]] = None) -> Any:
        url = f"{self.base_url}/{table}"
        headers = {**self.headers, **(extra_headers or {})}
        async with httpx.AsyncClient() as client:
            res = await client.get(url, headers=headers, params=params, timeout=10.0)
            if res.status_code >= 400:
                raise HTTPException(status_code=res.status_code, detail=res.text)
            return res.json()

    async def post(self, table: str, data: Any, extra_headers: Optional[Dict[str, str]] = None) -> Any:
        url = f"{self.base_url}/{table}"
        headers = {**self.headers, **(extra_headers or {})}
        async with httpx.AsyncClient() as client:
            res = await client.post(url, headers=headers, json=data, timeout=10.0)
            if res.status_code >= 400:
                raise HTTPException(status_code=res.status_code, detail=res.text)
            return res.json()

    async def patch(self, table: str, params: Dict[str, Any], data: Dict[str, Any]) -> Any:
        url = f"{self.base_url}/{table}"
        async with httpx.AsyncClient() as client:
            res = await client.patch(url, headers=self.headers, params=params, json=data, timeout=10.0)
            if res.status_code >= 400:
                raise HTTPException(status_code=res.status_code, detail=res.text)
            return res.json()

    async def delete(self, table: str, params: Dict[str, Any]) -> Any:
        url = f"{self.base_url}/{table}"
        async with httpx.AsyncClient() as client:
            res = await client.delete(url, headers=self.headers, params=params, timeout=10.0)
            if res.status_code >= 400:
                raise HTTPException(status_code=res.status_code, detail=res.text)
            return res.json()

    async def rpc(self, function_name: str, payload: Dict[str, Any]) -> Any:
        url = f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1/rpc/{function_name}"
        async with httpx.AsyncClient() as client:
            res = await client.post(url, headers=self.headers, json=payload, timeout=20.0)
            if res.status_code >= 400:
                raise HTTPException(status_code=res.status_code, detail=res.text)
            return res.json()

