# Roadmap: Evolución a Agente con Memoria

Este documento detalla los pasos que iremos implementando para convertir a Stly Agent de un bot conversacional estándar a un agente inteligente con memoria persistente y evolutiva.

## Fase 1: Memoria de Corto Plazo (Historial de Conversación)
- [ ] **Persistencia Local:** Guardar el historial de chat actual en el navegador (`localStorage` o `IndexedDB`) para no perder el contexto al recargar la página.
- [ ] **Gestión de Sesiones (Hilos):** Permitir al usuario crear, guardar y cargar múltiples "sesiones" o colecciones de diseño diferentes.

## Fase 2: Memoria Estructural (Base de Datos)
- [ ] **Integración de Base de Datos:** Configurar una base de datos ligera (ej. SQLite, Turso o PostgreSQL) mediante un ORM (Prisma/Drizzle ORM).
- [ ] **Perfiles y Preferencias:** Almacenar de forma persistente las preferencias (ej. colores favoritos, elementos recurrentes, tallas o formatos fotográficos preferidos).

## Fase 3: Memoria a Largo Plazo y Contexto Semántico (RAG)
- [ ] **Embeddings y Base de Datos Vectorial:** Implementar un sistema de búsqueda semántica (ej. Pinecone, ChromaDB o pgvector).
- [ ] **Recuerdo de Diseños Exitosos:** Guardar los prompts e imágenes que fueron generados y marcados como "Favoritos" o "Aprobados".
- [ ] **Recuperación de Contexto:** Antes de responder, el agente consultará automáticamente el historial de la base de datos para recordar diseños anteriores y mantener la coherencia de la colección.

## Fase 4: Evolución Autónoma y Reflexión
- [ ] **Feedback Loop en BRAND_MEMORY:** Capacidad del agente para proponer actualizaciones dinámicas a su propio ADN (`BRAND_MEMORY.md`) basado en lo que ha ido aprendiendo de la interacción con el usuario.
- [ ] **Auto-evaluación de Prompts:** Que el agente analice cuáles de sus prompts generaron las mejores imágenes y optimice su técnica para el futuro.
