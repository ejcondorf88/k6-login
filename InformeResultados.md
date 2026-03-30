# Informe de Resultados — Prueba de Carga
**App Transaction Balance**
**Herramienta:** k6 | **Fecha:** Abril 24, 2025

---

## 1. Resumen Ejecutivo

Se ejecutó una prueba de carga sobre el endpoint *App Transaction Balance* utilizando la herramienta k6. La prueba simuló hasta 140 usuarios virtuales (VUs) concurrentes y generó un total de 276,650 iteraciones. Los resultados evidencian un rendimiento aceptable bajo carga moderada, aunque se identificaron problemas críticos de estabilidad durante el pico de carga, incluyendo errores de servidor (HTTP 5xx) y tiempos de respuesta extremos que requieren atención inmediata.

---

## 2. Parámetros de Ejecución

| Parámetro | Valor |
|---|---|
| Herramienta | k6 (Grafana Labs) |
| Endpoint bajo prueba | App Transaction Balance |
| VUs mínimos | 2 |
| VUs máximos | 140 |
| Total iteraciones | 276,650 |
| Total peticiones HTTP | 276,650 @ 73.18 req/s |
| Datos recibidos | 842 MB (223 kB/s) |
| Datos enviados | 588 MB (156 kB/s) |

---

## 3. Resultados Generales

### 3.1 Validaciones (Checks)

| Métrica | Valor |
|---|---|
| Checks exitosos | 269,891 (97.55%) |
| Checks fallidos | 6,759 (2.45%) |
| Peticiones fallidas (failed_request) | 6,759 (2.44%) |

El 97.55% de las transacciones pasaron la validación de respuesta OK. Sin embargo, el 2.44% de fallos representa un volumen significativo (6,759 peticiones) que debe investigarse.

### 3.2 Tiempos de Respuesta HTTP (`http_req_duration`)

| Estadístico | Valor | Evaluación |
|---|---|---|
| Mínimo | 191.86 ms | ✅ Aceptable |
| Promedio | 861.68 ms | 🟡 Lento |
| Mediana (p50) | 613.42 ms | 🟡 Moderado |
| Percentil 90 (p90) | 1.28 s | 🟡 Lento |
| Percentil 95 (p95) | 1.57 s | 🔴 Crítico |
| Máximo | 29.93 s | 🔴 Crítico |

> **Observación clave:** El tiempo máximo de 29.93 segundos indica que al menos una petición experimentó una demora inaceptable, probablemente durante el colapso registrado entre las 01:50 y 02:00.

### 3.3 Desglose de Tiempos de Red

| Métrica | Promedio | Máximo |
|---|---|---|
| `http_req_waiting` (TTFB) | 861.21 ms | 29.93 s |
| `http_req_receiving` | 424.03 µs | 39.58 ms |
| `http_req_sending` | 43.22 µs | 31.25 ms |
| `http_req_connecting` | 3.3 µs | 11.82 ms |
| `http_req_tls_handshaking` | 7.36 µs | 27.02 ms |
| `http_req_blocked` | 10.97 µs | 35.02 ms |

El tiempo dominante es el `http_req_waiting` (tiempo hasta el primer byte — TTFB), lo que indica que el cuello de botella está en el **procesamiento del servidor**, no en la red.

### 3.4 Errores por Tipo HTTP

| Tipo de Error | Cantidad | Tasa |
|---|---|---|
| HTTP 4xx — Stage 1 | 769 | 0.2034/s |
| HTTP 5xx — Stage 1 | 5,987 | 1.5836/s |
| HTTP 5xx — Stage 2 | 2 | 0.0005/s |
| HTTP 5xx — Stage 0 | 1 | 0.0003/s |

> **Los errores HTTP 5xx (6,759 en total) son el hallazgo más crítico.** Representan fallos del lado del servidor bajo carga, no errores del cliente.

---

## 4. Análisis del Diagrama VUs vs. Peticiones por Segundo

El monitoreo de la prueba arrojó el siguiente comportamiento en la relación entre usuarios virtuales (VUs) y peticiones por segundo (`http_reqs`):

| Período | Comportamiento | Interpretación |
|---|---|---|
| 01:38 – 01:48 | VUs suben a ~140; reqs ~75/s | Rampa de carga normal |
| 01:48 – 02:00 | VUs se mantienen en 140; reqs caen drásticamente a ~0-20/s | **Colapso del sistema** |
| 02:00 – 02:30 | VUs en 140; reqs se recuperan a ~75-85/s | Recuperación y estabilización |
| 02:30 – fin | VUs caen a 0; reqs bajan a 0 | Fin de prueba |

### Hallazgo Principal del Diagrama

La caída abrupta de peticiones entre las **01:48 y 02:00** mientras los VUs permanecían en 140 indica que el servidor dejó de procesar peticiones a pesar de que los usuarios virtuales seguían activos. Esto es una señal clara de **saturación o fallo temporal del servidor**. La recuperación posterior sugiere que el sistema tiene capacidad de auto-recuperación, pero la inestabilidad durante ese período es inaceptable para un entorno de producción.

---

## 5. Hallazgos

1. **Tasa de fallos del 2.44%:** Aunque parece baja en porcentaje, en volumen absoluto representa 6,759 peticiones fallidas, la mayoría por errores HTTP 5xx del servidor.

2. **Tiempo máximo de respuesta de 29.93 segundos:** Inaceptable para cualquier experiencia de usuario. Ocurrió probablemente durante el colapso entre 01:48–02:00.

3. **TTFB promedio de 861 ms:** El tiempo de espera del servidor es el principal cuello de botella identificado.

4. **Colapso temporal bajo carga pico:** El sistema no sostuvo el throughput esperado con 140 VUs concurrentes durante un período de aproximadamente 12 minutos.

5. **Recuperación espontánea:** El sistema se recuperó sin intervención manual, lo que sugiere un problema de recursos transitorios (memoria, conexiones, pool de hilos).

---

## 6. Conclusiones

La aplicación **no cumple los criterios de rendimiento esperados** bajo una carga de 140 usuarios concurrentes. Si bien la mayoría de las transacciones se completan exitosamente en condiciones normales, el sistema presenta una vulnerabilidad clara ante picos de carga sostenidos, manifestada en:

- Errores masivos de servidor (HTTP 5xx)
- Tiempos de respuesta extremos
- Pérdida temporal de capacidad de procesamiento

El sistema requiere optimización antes de ser expuesto a tráfico real equivalente a esta carga.

---

## 7. Recomendaciones

1. **Investigar la causa raíz de los HTTP 5xx:** Revisar los logs del servidor durante la ventana 01:48–02:00 para identificar si se trata de agotamiento de conexiones de base de datos, memoria, timeouts o errores de aplicación.

2. **Optimizar el TTFB:** Con un promedio de 861 ms, se recomienda revisar la lógica de negocio del endpoint, consultas a base de datos y uso de caché.

3. **Implementar circuit breaker / rate limiting:** Para evitar que el sistema colapse ante picos, se recomienda implementar patrones de resiliencia como circuit breaker o throttling.

4. **Escalar la infraestructura:** Evaluar si se requiere escalamiento horizontal (más instancias) o vertical (más recursos por instancia) para soportar 140 VUs sin degradación.

5. **Definir SLAs de rendimiento:** Establecer umbrales aceptables (ej. p95 < 1s, tasa de error < 1%) y utilizarlos como criterios de aceptación en futuras pruebas de carga.

6. **Ejecutar prueba de soak (resistencia):** Ejecutar la misma carga durante un período más largo para verificar si el problema se agrava con el tiempo (memory leaks, connection pool exhaustion).

---

*Documento generado como parte del Ejercicio de Análisis de Resultados — Ejercicio 2*
