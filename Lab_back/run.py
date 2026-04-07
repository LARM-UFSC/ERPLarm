#!/usr/bin/env python3
"""
Script para executar a API Lab Back
"""

import uvicorn
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

if __name__ == "__main__":
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", 8000))
    debug = os.getenv("DEBUG", "True").lower() == "true"
    
    print(f"🚀 Iniciando Lab Back API")
    print(f"📍 Host: {host}")
    print(f"🔌 Porta: {port}")
    print(f"🐛 Debug: {debug}")
    print(f"📚 Docs: http://{host}:{port}/docs")
    print(f"🔍 Health: http://{host}:{port}/health")
    print("-" * 50)
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=debug,
        log_level="info"
    )
