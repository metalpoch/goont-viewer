# API Documentation - GoONT Server

## Introducción

El servidor GoONT proporciona una API REST para consultar información de OLTs y mediciones de tráfico de ONTs. Los datos se almacenan en bases de datos SQLite (una por OLT) y se agregan por hora para análisis de tráfico.

**URL Base:** `http://localhost:8080/api/v1/`

## Formato de Fechas

Todos los endpoints que requieran rango de fechas utilizan los parámetros de consulta `initDate` y `endDate` en formato **RFC3339**.

Ejemplos válidos:
- `2026-03-18T00:00:00Z` (UTC)
- `2026-03-18T00:00:00-04:00` (con offset de zona horaria)

**Nota:** Ambos parámetros son obligatorios cuando se usan. Si se omite alguno, el endpoint devolverá un error `400 Bad Request`.

---

## Endpoints Disponibles

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/olt` | Lista todos los OLTs configurados |
| GET | `/api/v1/olt/{ip}` | Obtiene los detalles de un OLT específico |
| GET | `/api/v1/traffic/{ip}` | Tráfico por GPON |
| GET | `/api/v1/traffic/{ip}/{gpon}` | Lista de ONTs en un GPON específico |
| GET | `/api/v1/traffic/{ip}/{gpon}/{ont}` | Mediciones detalladas de una ONT específica |
| GET | `/api/v1/health` | Verifica el estado del servidor |
| GET | `/` | Página de inicio |

---

## Detalle de Endpoints

### 1. Listar todos los OLTs
`GET /api/v1/olt`

**Respuesta:** Array de objetos `InfoOLT`.

**Ejemplo de solicitud:**
```bash
curl "http://localhost:8080/api/v1/olt"
```

**Ejemplo de respuesta:**
```json
[
  {
    "ip": "10.125.109.87",
    "community": "public",
    "name": "OLT-1",
    "location": "Central",
    "created_at": "2026-03-11T19:00:02.523144048-04:00",
    "updated_at": "2026-03-11T19:00:02.523144048-04:00"
  },
  {
    "ip": "10.125.180.112",
    "community": "public",
    "name": "OLT-2",
    "location": "Norte",
    "created_at": "2026-03-11T19:00:02.523144048-04:00",
    "updated_at": "2026-03-11T19:00:02.523144048-04:00"
  },
  {
    "ip": "10.125.58.182",
    "community": "public",
    "name": "OLT-3",
    "location": "Sur",
    "created_at": "2026-03-11T19:00:02.523144048-04:00",
    "updated_at": "2026-03-11T19:00:02.523144048-04:00"
  }
]
```

### 2. Obtener un OLT específico
`GET /api/v1/olt/{ip}`

**Parámetros de ruta:**
- `ip` (string): Dirección IP del OLT

**Respuesta:** Objeto `OLT` o `404 Not Found` si no existe.

**Ejemplo de solicitud:**
```bash
curl "http://localhost:8080/api/v1/olt/10.125.109.87"
```

**Ejemplo de respuesta:**
```json
{
  "ip": "10.125.109.87",
  "community": "public",
  "name": "OLT-1",
  "location": "Central",
  "timeout": 5,
  "retries": 3,
  "created_at": "2026-03-11T19:00:02.523144048-04:00",
  "updated_at": "2026-03-11T19:00:02.523144048-04:00"
}
```

### 3. Agregación de tráfico por GPON
`GET /api/v1/traffic/{ip}`

**Nuevo endpoint** que agrega el tráfico de todas las ONTs por hora para cada GPON, incluyendo contadores de estado.

**Parámetros de ruta:**
- `ip` (string): Dirección IP del OLT

**Parámetros de consulta:**
- `initDate` (RFC3339): Fecha/hora inicial
- `endDate` (RFC3339): Fecha/hora final

**Respuesta:** Objeto `GponResponse` (map donde la clave es el índice de GPON y el valor es un array de `GponMeasurement` ordenado por hora).

**Ejemplo de solicitud:**
```bash
curl "http://localhost:8080/api/v1/traffic/10.125.109.87?initDate=2026-03-18T00:00:00Z&endDate=2026-03-19T00:00:00Z"
```

**Ejemplo de respuesta:**
```json
{
  "4194312192": [
    {
      "time": "2026-03-18T19:00:00-04:00",
      "gpon_interface": "GPON 0/1/0",
      "total_bytes_in": 344396933503,
      "total_bytes_out": 79244717587,
      "total_bps_in": 40280491.0195036,
      "total_bps_out": 9268422.057766221,
      "count_active": 40,
      "count_inactive": 1,
      "count_error": 0
    },
    {
      "time": "2026-03-18T20:00:00-04:00",
      "gpon_interface": "GPON 0/1/0",
      "total_bytes_in": 30630018910,
      "total_bytes_out": 16982922611,
      "total_bps_in": 68055936.94275755,
      "total_bps_out": 37733855.591600984,
      "count_active": 40,
      "count_inactive": 1,
      "count_error": 0
    }
  ],
  "4194312448": [
    {
      "time": "2026-03-18T19:00:00-04:00",
      "gpon_interface": "GPON 0/1/1",
      "total_bytes_in": 290863660889,
      "total_bytes_out": 73483971432,
      "total_bps_in": 34022816.12700066,
      "total_bps_out": 8595983.084401127,
      "count_active": 41,
      "count_inactive": 1,
      "count_error": 0
    }
  ]
}
```

### 4. Listar ONTs en un GPON
`GET /api/v1/traffic/{ip}/{gpon}`

**Parámetros de ruta:**
- `ip` (string): Dirección IP del OLT
- `gpon` (int): Índice del GPON (ej: 4194312192)

**Parámetros de consulta:**
- `initDate` (RFC3339): Fecha/hora inicial
- `endDate` (RFC3339): Fecha/hora final

**Respuesta:** Objeto `OntResponse` (map donde la clave es el índice de ONT y el valor es un array de `OntMeasurement`).

**Ejemplo de solicitud:**
```bash
curl "http://localhost:8080/api/v1/traffic/10.125.109.87/4194312192?initDate=2026-03-18T00:00:00Z&endDate=2026-03-19T00:00:00Z"
```

**Ejemplo de respuesta:**
```json
{
  "10": [
    {
      "time": "2026-03-18T19:00:02.218020086-04:00",
      "status": 1,
      "temperature": 46,
      "olt_distance": 89,
      "tx_power": -22.08,
      "rx_power": -26.08,
      "bps_in": 36697.05021808645,
      "bps_out": 11328.286673513788,
      "bytes_in": 203871,
      "bytes_out": 62934,
      "desp": "CLIENTE 10",
      "serial_number": "48575443ABCDEF10",
      "plan": "100M"
    },
    {
      "time": "2026-03-18T20:00:02.218020086-04:00",
      "status": 1,
      "temperature": 46,
      "olt_distance": 89,
      "tx_power": -22.08,
      "rx_power": -26.08,
      "bps_in": 36507.11374304417,
      "bps_out": 11278.286673513788,
      "bytes_in": 202817,
      "bytes_out": 62657,
      "desp": "CLIENTE 10",
      "serial_number": "48575443ABCDEF10",
      "plan": "100M"
    }
  ],
  "11": [
    {
      "time": "2026-03-18T19:00:02.218020086-04:00",
      "status": 1,
      "temperature": 46,
      "olt_distance": 92,
      "tx_power": -22.08,
      "rx_power": -26.08,
      "bps_in": 36697.05021808645,
      "bps_out": 11328.286673513788,
      "bytes_in": 203871,
      "bytes_out": 62934,
      "desp": "CLIENTE 11",
      "serial_number": "48575443ABCDEF11",
      "plan": "200M"
    }
  ]
}
```

### 5. Mediciones detalladas de una ONT
`GET /api/v1/traffic/{ip}/{gpon}/{ont}`

**Parámetros de ruta:**
- `ip` (string): Dirección IP del OLT
- `gpon` (int): Índice del GPON
- `ont` (int): Índice de la ONT

**Parámetros de consulta:**
- `initDate` (RFC3339): Fecha/hora inicial
- `endDate` (RFC3339): Fecha/hora final

**Respuesta:** Array de objetos `OntMeasurement` ordenados por tiempo.

**Ejemplo de solicitud:**
```bash
curl "http://localhost:8080/api/v1/traffic/10.125.109.87/4194312192/10?initDate=2026-03-18T00:00:00Z&endDate=2026-03-19T00:00:00Z"
```

**Ejemplo de respuesta:**
```json
[
  {
    "time": "2026-03-18T19:00:02.218020086-04:00",
    "status": 1,
    "temperature": 46,
    "olt_distance": 89,
    "tx_power": -22.08,
    "rx_power": -26.08,
    "bps_in": 36697.05021808645,
    "bps_out": 11328.286673513788,
    "bytes_in": 203871,
    "bytes_out": 62934,
    "desp": "CLIENTE 10",
    "serial_number": "48575443ABCDEF10",
    "plan": "100M"
  },
  {
    "time": "2026-03-18T20:00:02.218020086-04:00",
    "status": 1,
    "temperature": 46,
    "olt_distance": 89,
    "tx_power": -22.08,
    "rx_power": -26.08,
    "bps_in": 36507.11374304417,
    "bps_out": 11278.286673513788,
    "bytes_in": 202817,
    "bytes_out": 62657,
    "desp": "CLIENTE 10",
    "serial_number": "48575443ABCDEF10",
    "plan": "100M"
  },
  {
    "time": "2026-03-18T21:00:02.218020086-04:00",
    "status": 1,
    "temperature": 46,
    "olt_distance": 89,
    "tx_power": -22.08,
    "rx_power": -26.08,
    "bps_in": 36487.11374304417,
    "bps_out": 11268.286673513788,
    "bytes_in": 202717,
    "bytes_out": 62607,
    "desp": "CLIENTE 10",
    "serial_number": "48575443ABCDEF10",
    "plan": "100M"
  }
]
```

### 6. Health Check
`GET /api/v1/health`

**Respuesta:** Objeto con estado del servidor.

**Ejemplo de solicitud:**
```bash
curl "http://localhost:8080/api/v1/health"
```

**Ejemplo de respuesta:**
```json
{
  "status": "ok",
  "timestamp": 1773952264,
  "version": "1.0.0"
}
```

### 7. Página de inicio
`GET /`

**Respuesta:** Mensaje de bienvenida en texto plano.

---

## Modelos de Datos

### InfoOLT
```go
type InfoOLT struct {
    IP        string    `json:"ip"`
    Community string    `json:"community"`
    Name      string    `json:"name"`
    Location  string    `json:"location"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}
```

### OLT
```go
type OLT struct {
    IP        string    `json:"ip"`
    Community string    `json:"community"`
    Name      string    `json:"name"`
    Location  string    `json:"location"`
    Timeout   int       `json:"timeout"`
    Retries   int       `json:"retries"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}
```

### GponMeasurement
```go
type GponMeasurement struct {
    Time          time.Time `json:"time"`
    GponInterface string    `json:"gpon_interface"`
    TotalBytesIn  uint64    `json:"total_bytes_in"`
    TotalBytesOut uint64    `json:"total_bytes_out"`
    TotalBpsIn    float64   `json:"total_bps_in"`
    TotalBpsOut   float64   `json:"total_bps_out"`
    CountActive   int       `json:"count_active"`
    CountInactive int       `json:"count_inactive"`
    CountError    int       `json:"count_error"`
}
```

### OntMeasurement
```go
type OntMeasurement struct {
    Time         time.Time `json:"time"`
    Status       int8      `json:"status"`
    Temperature  int8      `json:"temperature"`
    OltDistance  int16     `json:"olt_distance"`
    Tx           float64   `json:"tx_power"`
    Rx           float64   `json:"rx_power"`
    BpsIn        float64   `json:"bps_in"`
    BpsOut       float64   `json:"bps_out"`
    BytesIn      uint64    `json:"bytes_in"`
    BytesOut     uint64    `json:"bytes_out"`
    DNI          string    `json:"desp"`
    SerialNumber string    `json:"serial_number"`
    Plan         string    `json:"plan"`
}
```

### Estructuras de Respuesta
- `GponResponse`: `map[int][]GponMeasurement` (clave = índice GPON)
- `OntResponse`: `map[uint8][]OntMeasurement` (clave = índice ONT)

---

## Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| 200 | OK - Solicitud exitosa |
| 400 | Bad Request - Parámetros incorrectos o faltantes |
| 404 | Not Found - Recurso no encontrado |
| 500 | Internal Server Error - Error en el servidor |

## Ejemplos de Errores

**Faltan parámetros de fecha:**
```json
{
  "error": "Both initDate and endDate must be provided when using date range"
}
```

**IP no encontrada:**
```json
{
  "error": "ONT database for IP 10.0.0.1 not found"
}
```

**GPON no es un número:**
```json
{
  "error": "GPON must be an integer"
}
```

---

## Ejemplos Prácticos

### 1. Obtener tráfico de todo un día por GPON
```bash
curl "http://localhost:8080/api/v1/traffic/10.125.109.87?initDate=2026-03-18T00:00:00Z&endDate=2026-03-19T00:00:00Z"
```

### 2. Monitorear una ONT específica cada hora
```bash
curl "http://localhost:8080/api/v1/traffic/10.125.109.87/4194312192/10?initDate=2026-03-18T00:00:00Z&endDate=2026-03-19T00:00:00Z"
```

### 3. Listar todos los OLTs activos
```bash
curl "http://localhost:8080/api/v1/olt"
```

---

## Notas de Implementación

1. **Base de datos por OLT:** Cada OLT tiene su propia base de datos SQLite con nombre igual a su IP.
2. **Agregación horaria:** El endpoint `/traffic/{ip}` agrupa mediciones por hora (truncando a la hora completa).
3. **Cálculo de BPS:** Los bits por segundo se calculan como `(bytes_diferencia / segundos) * 8`.
4. **Manejo de contadores de bytes:** Se maneja el desbordamiento de contadores de 64 bits.
5. **Estados de ONT:** `status = 1` (activa), `2` (inactiva), `-1` (error).

---

*Última actualización: 19 de marzo de 2026*