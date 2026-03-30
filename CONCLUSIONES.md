# Conclusiones - Login Load Test

## Resumen Ejecutivo

Se realizó una prueba de carga exitosa contra el endpoint POST `/auth/login` de fakestoreapi.com, alcanzando **20 TPS sostenidos** durante 2 minutos con **0% de errores** y latencia **p95 de 358.88ms**, muy por debajo del SLA de 1,500ms.

---

## Hallazgos Principales

### 1. Rendimiento del Servicio

| Métrica | Resultado | SLA | Estado |
|---------|-----------|-----|--------|
| Throughput | 19.90 TPS | 20 TPS | ✅ Cumple |
| Latencia p95 | 358.88ms | < 1,500ms | ✅ Cumple |
| Latencia p90 | 353.77ms | < 1,500ms | ✅ Cumple |
| Latencia promedio | 343.92ms | - | ✅ Excelente |
| Tasa de error | 0.00% | < 3% | ✅ Cumple |

**Interpretación**: El servicio de fakestoreapi.com manejó la carga sin degradación. La latencia promedio de ~344ms indica capacidad de respuesta rápida consistente.

---

### 2. Estabilidad bajo Carga

**Iteraciones**: 2,394 completadas  
**Iteraciones fallidas**: 0 (0%)  
**Iteraciones dropeadas**: 6 (0.25%)

**Análisis**:
- Las 6 iteraciones dropeadas ocurrieron durante el ramp-up inicial (primeros segundos), lo cual es esperado al iniciar el executor `constant-arrival-rate`
- Cero iteraciones interrumpidas indica que todos los VUs completaron su trabajo sin errores de timeout
- El throughput se mantuvo estable en 20 TPS durante toda la ejecución

---

### 3. Comportamiento de Virtual Users

| Métrica | Valor |
|---------|-------|
| VUs mínimos | 6 |
| VUs máximos | 7 |
| VUs configurados (máx) | 20 |

**Interpretación**: 
- Solo se necesitaron 6-7 VUs para mantener 20 TPS
- Esto indica que cada VU procesó aproximadamente 3-4 peticiones por segundo
- Hay capacidad de escalamiento disponible (hasta 20 VUs) si la latencia aumenta

---

### 4. Distribución de Datos (Data Parameterization)

**Usuarios**: 5 credenciales desde CSV  
**Estrategia**: Round-robin (`iterationInTest % 5`)

**Distribución esperada**:
- Cada usuario recibió ~479 peticiones (2,394 ÷ 5)
- ~4 logins por segundo por usuario (20 TPS ÷ 5)

**Hallazgo**: No se observó rate limiting. La API toleró 4 requests/segundo por usuario sin rechazar peticiones.

---

### 5. Análisis de Tiempos HTTP

| Fase | Tiempo | % Total |
|------|--------|---------|
| Waiting (TTFB) | 343.78ms | 99.9% |
| Receiving | 0.14ms | 0.04% |
| Blocked | 0.07ms | 0.02% |
| TLS Handshaking | 0.04ms | 0.01% |
| Connecting | 0.01ms | 0.003% |
| Sending | 0.005ms | 0.001% |

**Conclusión**: 
- El 99.9% del tiempo se invierte en "waiting" (tiempo de procesamiento del servidor)
- Overhead de red despreciable
- Conexiones TLS reutilizadas (handshake casi instantáneo)
- El cuello de botella está en el servidor de fakestoreapi.com, no en la red

---

### 6. Tráfico de Red

| Métrica | Valor |
|---------|-------|
| Data recibida | 1.4 MB |
| Data enviada | 290 KB |
| Tasa recepción | 12 kB/s |
| Tasa envío | 2.4 kB/s |

**Interpretación**:
- Peticiones JSON pequeñas (~120 bytes cada una)
- Respuestas con JWT (~590 bytes cada una)
- Tráfico de red muy bajo y eficiente

---

### 7. Validaciones (Checks)

| Check | Pases | Fallos | Tasa Éxito |
|-------|-------|--------|------------|
| status is 201 | 2,394 | 0 | 100% |
| has token | 2,394 | 0 | 100% |
| **Total** | 4,788 | 0 | 100% |

**Interpretación**: 
- Todas las respuestas fueron HTTP 201 con token JWT presente
- Sin errores de autenticación
- Sin respuestas malformadas
- Estructura de respuesta consistente

---

## Conclusiones Técnicas

### 1. Capacidad del Servicio

**fakestoreapi.com puede soportar al menos 20 TPS** en el endpoint de login sin degradación aparente. Los tiempos de respuesta se mantuvieron estables (~344ms) durante toda la prueba.

### 2. Estrategia de Data Parameterization

La estrategia de **round-robin con 5 usuarios** funcionó correctamente:
- Distribución uniforme de carga
- Sin sesiones duplicadas excesivas
- Sin rate limiting detectado

### 3. Configuration del Executor

El executor `constant-arrival-rate` fue apropiado:
- Mantuvo throughput constante de 20 TPS
- Se ajustó dinámicamente con 6-7 VUs
- Solo 6 iteraciones dropeadas (0.25%)

### 4. SLA Compliance

Todos los thresholds cumplieron holgadamente:
- Latencia p95: **358ms vs 1,500ms** (4.2x mejor que el límite)
- Error rate: **0% vs 3%** (0 errores)

---

## Recomendaciones

### 1. Para Pruebas Futuras

| Tipo de Prueba | Configuración Recomendada |
|----------------|---------------------------|
| **Stress Test** | Incrementar hasta 50-100 TPS hasta encontrar límite |
| **Soak Test** | Mantener 20 TPS por 1 hora para detectar degradación |
| **Spike Test** | Pico de 50 TPS por 30s, luego volver a 10 TPS |

### 2. Consideraciones de Rate Limiting

Aunque no se observó rate limiting en esta prueba:
- Producción real podría tener límites más estrictos
- Recomendado implementar backoff en caso de HTTP 429
- Considerar distribución más amplia de usuarios (10-20 en lugar de 5)

### 3. Optimizaciones Sugeridas

**Si se necesita reducir latencia:**
- Mantener conexiones HTTP persistentes (connection pooling ya activo en k6)
- Considerar ejecutar desde ubicación geográfica cercana al servidor
- Reducir payload (ya es mínimo)

**Si se necesita aumentar throughput:**
- Aumentar `maxVUs` en config
- Verificar límite de la API externa
- Considerar ejecutar en modo cloud (k6 Cloud) para mayor paralelismo

---

## Limitaciones del Ejercicio

### 1. Datos Limitados
- Solo 5 usuarios disponibles
- No se probó con contraseñas inválidas
- No se evaluó comportamiento con tokens expirados

### 2. Alcance Reducido
- Solo endpoint de login probado
- No se evaluaron endpoints autenticados (que requieren token)
- No se probó escenarios de múltiples endpoints

### 3. Dependencia Externa
- fakestoreapi.com es un servicio gratuito de demostración
- No garantiza disponibilidad 24/7
- Puede tener rate limiting no documentado

---

## Lecciones Aprendidas

### 1. Arquitectura de Scripts
La estructura template (config → scenarios → scripts) facilitó:
- Reutilización de código (login function)
- Separación de responsabilidades
- Configuración externalizada en JSON

### 2. Data Parameterization
Cargar CSV en el init context (fuera de la función default) es eficiente:
- Evita re-parsear CSV en cada iteración
- Memoria compartida entre VUs
- Tiempo de carga inicial despreciable

### 3. Thresholds
Configurar thresholds desde el inicio ayudó a:
- Validar automáticamente el SLA
- Detectar fallos inmediatamente
- Generar reporte claro de PASS/FAIL

---

## Métricas Clave para Reporte Ejecutivo

```
┌─────────────────────────────────────────────────┐
│          LOGIN LOAD TEST - RESUMEN            │
├─────────────────────────────────────────────────┤
│  Throughput:       19.90 TPS (objetivo: 20)   │
│  Latencia p95:     358.88ms (objetivo: <1500) │
│  Error Rate:       0.00% (objetivo: <3%)       │
│  Iteraciones:      2,394 completadas           │
│  Duración:         2 minutos                   │
│  Estado:           ✅ EXITOSO                  │
└─────────────────────────────────────────────────┘
```

---

## Referencias

- **k6 Documentation**: https://k6.io/docs/
- **fakestoreapi.com**: https://fakestoreapi.com/
- **Test Script**: `main.js`
- **Configuración**: `config/test.json`
- **Datos**: `data/users.csv`

---

**Fecha de ejecución**: 30 de marzo, 2026  
**Duración de la prueba**: 2 minutos 0.3 segundos  
**Estado final**: ✅ TODOS LOS SLAs CUMPLIDOS
