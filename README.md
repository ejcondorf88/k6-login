# Load Test: FakeStoreAPI Login

## Descripción
Prueba de carga para el endpoint POST `/auth/login` de fakestoreapi.com con data parameterization desde CSV.

## Configuración

### Escenario
- **Executor**: `constant-arrival-rate`
- **Throughput**: 20 TPS (transacciones por segundo)
- **Duración**: 2 minutos
- **VUs**: 5-20 (pre-allocated: 5, máximo: 20)

### Datos
Archivo: `data/users.csv`
```csv
user,passwd
donero,ewedon
kevinryan,kev02937@
johnd,m38rmF$
derek,jklg*_56
mor_2314,83r5^_
```

### Thresholds (SLA)
| Métrica | Límite | Descripción |
|---------|--------|-------------|
| http_req_duration | p(95) < 1,500ms | 95% de las peticiones deben responder en menos de 1.5 segundos |
| http_req_failed | rate < 0.03 | Menos del 3% de las peticiones pueden fallar |

---

## Resultados del Test

### Resumen Ejecución
| Métrica | Valor |
|---------|-------|
| **Duración Total** | 2m 0.3s |
| **Iteraciones Completadas** | 2,394 |
| **Iteraciones Interrumpidas** | 0 |
| **Iteraciones Dropeadas** | 6 |
| **Peticiones HTTP** | 2,394 |
| **VUs Máximos** | 11 |

### Estado de Thresholds
| Threshold | Resultado | Valor Medido | Estado |
|-----------|-----------|--------------|--------|
| http_req_duration p(95) < 1500ms | ✅ **PASS** | 358.88ms | Cumple SLA |
| http_req_failed rate < 0.03 | ✅ **PASS** | 0.00% | Cumple SLA |

---

## Métricas Detalladas

### 1. Iteraciones
| Métrica | Valor | Significado |
|---------|-------|-------------|
| **Total Iteraciones** | 2,394 | Número total de ejecuciones de la función de test |
| **Tasa de Iteraciones** | 19.90/s | Promedio de iteraciones por segundo (objetivo: 20 TPS) |
| **Iteraciones Dropeadas** | 6 | Iteraciones que no se pudieron ejecutar (0.25%) |

**Interpretación**: Se alcanzaron aproximadamente 20 TPS, con solo 6 iteraciones dropeadas debido a la ramp-up inicial.

---

### 2. Duración de Peticiones HTTP (http_req_duration)
| Métrica | Valor | Significado |
|---------|-------|-------------|
| **Promedio (avg)** | 343.92ms | Tiempo medio de respuesta |
| **Mínimo (min)** | 324.77ms | Respuesta más rápida |
| **Mediana (med)** | 341.27ms | 50% de las respuestas fueron más rápidas que esto |
| **Máximo (max)** | 747.38ms | Respuesta más lenta |
| **Percentil 90 (p90)** | 353.77ms | 90% de las respuestas fueron más rápidas que esto |
| **Percentil 95 (p95)** | 358.88ms | 95% de las respuestas fueron más rápidas que esto |

**Interpretación**: 
- ✅ Todas las respuestas están muy por debajo del SLA de 1,500ms
- El p95 de 358.88ms es 4.2x más rápido que el límite permitido
- Distribución consistente sin outliers críticos

---

### 3. Errores HTTP (http_req_failed)
| Métrica | Valor | Significado |
|---------|-------|-------------|
| **Peticiones Fallidas** | 0 | Total de peticiones HTTP con error |
| **Peticiones Exitosas** | 2,394 | Total de peticiones HTTP exitosas |
| **Tasa de Fallo** | 0.00% | Porcentaje de peticiones fallidas |

**Interpretación**: 
- ✅ **0% de errores**, muy por debajo del límite del 3%
- Todas las peticiones recibieron HTTP 201 con token JWT válido
- El endpoint de fakestoreapi.com manejó la carga sin problemas

---

### 4. Checks
| Check | Pases | Fallos | Estado |
|-------|-------|--------|--------|
| **status is 201** | 2,394 | 0 | ✅ 100% |
| **has token** | 2,394 | 0 | ✅ 100% |
| **Total Checks** | 4,788 | 0 | ✅ 100% |

**Interpretación**: 
- Validaciones funcionan correctamente
- Cada petición valida: HTTP 201 + presencia de token
- 2 checks por iteración (status + token) = 4,788 checks totales

---

### 5. Duración de Iteración (iteration_duration)
| Métrica | Valor | Significado |
|---------|-------|-------------|
| **Promedio** | 344.12ms | Tiempo total de cada iteración |
| **Mediana** | 341.42ms | Valor central de duraciones |
| **Máximo** | 771.54ms | Iteración más lenta |

**Interpretación**: Incluye tiempo de HTTP request + checks. La diferencia con http_req_duration es mínima (~0.2ms), indicando que los checks son muy rápidos.

---

### 6. Virtual Users (VUs)
| Métrica | Valor | Significado |
|---------|-------|-------------|
| **VUs Activos (min)** | 6 | Mínimo de VUs concurrentes |
| **VUs Activos (max)** | 7 | Máximo de VUs concurrentes |
| **VUs Máximos Configurados** | 11 | Límite de escalamiento |

**Interpretación**: El executor usó 6-7 VUs para mantener 20 TPS, bien por debajo del máximo configurado de 20 VUs.

---

### 7. Métricas de Red
| Métrica | Valor | Significado |
|---------|-------|-------------|
| **Data Recibida** | 1.4 MB | Total de datos descargados |
| **Data Enviada** | 290 KB | Total de datos subidos |
| **Tasa Recepción** | 12 kB/s | Velocidad promedio de descarga |
| **Tasa Envío** | 2.4 kB/s | Velocidad promedio de subida |

**Interpretación**: Tráfico de red moderado, consistente con peticiones JSON pequeñas (~120 bytes request, ~590 bytes response).

---

### 8. Tiempos de Fases HTTP
| Métrica | Valor | Significado |
|---------|-------|-------------|
| **Blocked** | 0.07ms | Tiempo esperando conexión disponible |
| **Connecting** | 0.01ms | Tiempo estableciendo conexión TCP |
| **TLS Handshaking** | 0.04ms | Tiempo negociación TLS (reusado) |
| **Sending** | 0.005ms | Tiempo enviando request |
| **Waiting** | 343.78ms | Tiempo esperando respuesta del servidor (TTFB) |
| **Receiving** | 0.14ms | Tiempo recibiendo response |

**Interpretación**: 
- **99.9% del tiempo** es "waiting" (tiempo del servidor)
- Conexiones TLS reusadas (handshake casi 0)
- Overhead de red despreciable

---

## Conclusión

### Estado General: ✅ **EXITOSO**

| Criterio | Requerido | Obtenido | Estado |
|----------|-----------|----------|--------|
| Throughput | 20 TPS | 19.90 TPS | ✅ Cumple |
| Latencia p95 | < 1,500ms | 358.88ms | ✅ Cumple |
| Tasa de Error | < 3% | 0% | ✅ Cumple |
| Duración | 2 minutos | 2m 0.3s | ✅ Cumple |

### Hallazgos
1. **El endpoint fakestoreapi.com soporta 20 TPS** sin degradación
2. **Latencia promedio de ~344ms** es excelente para un servicio externo
3. **0% de errores** indica estabilidad del servicio bajo carga
4. **6 iteraciones dropeadas** (0.25%) es aceptable durante ramp-up

### Recomendaciones
- El servicio puede soportar cargas mayores (stress test recomendado)
- Considerar test de mayor duración (soak test) para detectar degradación
- Monitorear rate limiting si se aumenta TPS (>50 TPS)

---

## Ejecución

```bash
# Ejecutar test completo (2 minutos)
k6 run main.js

# Ejecutar con salida JSON
k6 run --summary-export=results.json main.js

# Ejecutar smoke test (1 iteración)
k6 run --vus 1 --iterations 1 main.js
```

## Estructura del Proyecto
```
k6/
├── main.js              # Entry point
├── config/
│   └── test.json       # Configuración de escenario
├── scenarios/
│   └── login.js        # Orquestador (carga CSV, selecciona usuario)
├── scripts/
│   └── login.js        # Implementación HTTP (POST + checks)
├── data/
│   └── users.csv       # Credenciales
└── common/
    └── utils.js        # Utilidades
```
