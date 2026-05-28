# INDICE DE LECCIONES APRENDIDAS — RoSaas Factory

Este es el indice compacto. Las lecciones completas viven en skills categorizados.
Para cargar una leccion, lee el skill correspondiente.

## Skills de lecciones

| Skill | Ruta | Cuantas |
|---|---|---|
| Supabase | `skills/lessons-supabase/SKILL.md` | 17 lecciones |
| LLM y Agentes IA | `skills/lessons-llm-agents/SKILL.md` | 16 lecciones |
| Vercel y Deploy | `skills/lessons-vercel-deploy/SKILL.md` | 8 lecciones |
| Frontend y UI | `skills/lessons-frontend-ui/SKILL.md` | 14 lecciones |
| Telegram Bots | `skills/lessons-telegram-bots/SKILL.md` | 7 lecciones |
| Chrome Extensions | `skills/lessons-chrome-ext/SKILL.md` | 5 lecciones |

## Auto-activacion

- Trabajando con Supabase/DB/RLS/migraciones -> cargar `lessons-supabase`
- Trabajando con IA/agentes/LLM/tool calling -> cargar `lessons-llm-agents`
- Trabajando con deploy/Vercel/build/env vars -> cargar `lessons-vercel-deploy`
- Trabajando con UI/frontend/Tailwind/motion -> cargar `lessons-frontend-ui`
- Trabajando con Telegram/bot/Grammy -> cargar `lessons-telegram-bots`
- Trabajando con Chrome extension/Banana -> cargar `lessons-chrome-ext`

## Indice completo

| # | Leccion | Skill |
|---|---|---|
| 1 | ENV vars crash Vercel build — usar fallback | vercel-deploy |
| 2 | [object Object] en error msgs — extraer profundo | frontend-ui |
| 3 | Metadata viewport separado (Next.js 15+) | vercel-deploy |
| 4 | UTC vs Local — separar fecha/rango_hora | supabase |
| 5 | Spread operator en CRUD — mapear explicitamente | frontend-ui |
| 6 | Botones admin flotantes destruyen UI movil | frontend-ui |
| 7 | Webhook Make.com — media_type obligatorio en carruseles | chrome-ext |
| 8 | RLS: ENABLE antes de POLICIES | supabase |
| 9 | Hydration mismatch con new Date() | frontend-ui |
| 10 | Trigger updated_at obligatorio | supabase |
| 11 | Doble cita — constraint UNIQUE compuesto | supabase |
| 12 | SQLite sin indices = bot lento | llm-agents |
| 13 | fal.ai video es asincrono (queue pattern) | llm-agents |
| 14 | OpenRouter modelo incorrecto = silencio total | llm-agents |
| 15 | Auth callback roto en deploy (localhost) | vercel-deploy |
| 16 | Calculo de edad con getFullYear() sin mes/dia | frontend-ui |
| 17 | Supabase Free Tier se duerme a los 7 dias | supabase |
| 18 | Dictado handsfree — permisos microfono macOS | frontend-ui |
| 19 | Groq rate limit en generacion masiva | llm-agents |
| 20 | Variable config undefined en webhook route | frontend-ui |
| 21 | Gemini en Google Workspace — rate_limit: 0 | llm-agents |
| 22 | Cerebras vs Groq para chatbots serverless | llm-agents |
| 23 | Groq rate limit por tokens, no requests | llm-agents |
| 24 | Arquitectura Orquestador vs Ejecutor | llm-agents |
| 25 | Feedback inmediato en tareas largas (onProgress) | frontend-ui |
| 26 | /rest/v1/ no cuenta como actividad de DB | supabase |
| 27 | Servicios background — no correr en Mac local | vercel-deploy |
| 28 | Dictado paste fallido por try monolitico | frontend-ui |
| 29 | Cerebras llama3.1-8b para chatbots Vercel | llm-agents |
| 30 | Lead extraction — siempre inferir proyecto | llm-agents |
| 31 | Deduplicacion de leads — Telegram flood | llm-agents |
| 32 | Layout shift por texto animado (RotatingWord) | frontend-ui |
| 33 | Supabase Auth — Site URL apunta a localhost | supabase |
| 34 | Env vars no se configuran automaticamente en Vercel | vercel-deploy |
| 35 | RLS para bots — ENABLE sin policies (service_role) | supabase |
| 36 | Base64 en tablas — asesino del plan gratuito | supabase |
| 37 | Dashboard metricas asincronas (12-24h lag) | supabase |
| 38 | SECURITY DEFINER — search_path hijacking | supabase |
| 39 | Leaked Password Protection — exclusivo Plan Pro | supabase |
| 40 | Google Imagen 3 auto-traduce texto espanol | chrome-ext |
| 41 | Batching concurrente colapsa extension Chrome | chrome-ext |
| 42 | Linter revierte cambios TTS entre deploys | telegram-bots |
| 43 | Limite actividad diaria no aplica a cuentas activas | telegram-bots |
| 44 | vercel env add puede colgar indefinidamente | vercel-deploy |
| 45 | Render free tier mata crons internos | vercel-deploy |
| 46 | replyWithVoice requiere OGG OPUS, no MP3 | telegram-bots |
| 47 | Estado en memoria se pierde en serverless | telegram-bots |
| 48 | toISOString() devuelve fecha de manana despues de 6pm | supabase |
| 49 | timestamptz naive vs queries de rango | supabase |
| 50 | Modelos pequenos embeben tool calls como texto plano | llm-agents |
| 51 | tool_choice "required" causa alucinaciones | llm-agents |
| 52 | backdrop-blur + gradientes = texto ilegible | frontend-ui |
| 53-57 | Duplicados consolidados en supabase skill | supabase |
| 58-59 | Duplicados consolidados en chrome-ext skill | chrome-ext |
| 60-62 | Duplicados consolidados en telegram/vercel skills | telegram / vercel |
| 63 | Cron */3 crea gaps de 8+ dias | supabase |
| 64 | JWT decode antes de cambiar keys | supabase |
| 65 | Auto-healing para UUID en tools de agentes | llm-agents |
| 66 | SERVICE_ROLE_KEY faltante = cero resultados sin error | supabase |
| 67 | CDMX offset fijo -06:00 (sin DST desde 2023) | supabase |
| 68 | Pre-fetch de tools deterministas | llm-agents |
| 69 | Arquitectura de tools clinicos (patron MdPulso) | llm-agents |
| 70 | Groq tool_use_failed — XML format | llm-agents |
| 71 | selectTools() — palabras genericas disparan tools | telegram-bots |
| 72 | OpenRouter free tier — modelos cambian sin aviso | llm-agents |
| 73 | Memoria estrecha rompe continuidad entre dias | llm-agents |
| 74 | Cerebras free tier MUERTO (mayo 2026) | llm-agents |
| 75 | Groq XML leak en content (3 formatos) | llm-agents |
| 76 | Web scraping — smartExtract article>main>p>body | llm-agents |
| 77 | Motor autonomo sin datos = motor vacio | llm-agents |
| 78 | WebRTC: caller sin video track nunca recibe video | frontend-ui |
| 79 | iOS Safari: onloadeddata NUNCA dispara con MediaStream | frontend-ui |
| 80 | iOS Safari autoplay: NO .play() fuera de gesture | frontend-ui |
| 81 | Motion detection cuarto oscuro — IIR background model + canvas 32x18 | frontend-ui |
| 82 | Audio sensitivity tuning — multiplicador sobre avg frecuencias | frontend-ui |
| 83 | Git author email no registrado en equipo Vercel = deploy silencioso | vercel-deploy |
| 84 | Groq Llama 3 deprecado/decommissioned — migrar a llama-3.1-8b-instant | llm-agents |
| 85 | Permisos de accesibilidad macOS bloqueados para wrappers .app | frontend-ui |
| 86 | Bucle infinito con rumps.Timer(0) en PyObjC/macOS | frontend-ui |

> Ultima actualizacion: 22 Mayo 2026 — Lecciones Dictado Handsfree v6.0, Groq Llama 3.1 y PyObjC | Ro SaaS Factory v5.5
