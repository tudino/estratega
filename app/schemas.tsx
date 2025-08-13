// Esquemas de campos para cada estrategia

export const STRATEGY_SCHEMAS = {
  CompraPesca: {
    ticker: { type: "text", required: true, label: "Ticker" },
    min_depth: { type: "number", required: true, label: "Profundidad Mínima" },
    interval: { type: "number", required: true, label: "Intervalo (segundos)" },
    active: { type: "boolean", required: false, label: "Activo" },
  },
  VentaPesca: {
    ticker: { type: "text", required: true, label: "Ticker" },
    min_depth: { type: "number", required: true, label: "Profundidad Mínima" },
    interval: { type: "number", required: true, label: "Intervalo (segundos)" },
    active: { type: "boolean", required: false, label: "Activo" },
  },
  ArbitrajeSimple: {
    ticker_primary: { type: "text", required: true, label: "Ticker Primario" },
    ticker_secondary: { type: "text", required: true, label: "Ticker Secundario" },
    spread_threshold: { type: "number", required: true, label: "Umbral de Spread" },
    max_position: { type: "number", required: false, label: "Posición Máxima" },
    active: { type: "boolean", required: false, label: "Activo" },
  },
  ScalpingRapido: {
    ticker: { type: "text", required: true, label: "Ticker" },
    price_threshold: { type: "number", required: true, label: "Umbral de Precio" },
    volume_min: { type: "number", required: true, label: "Volumen Mínimo" },
    timeout: { type: "number", required: false, label: "Timeout (ms)" },
    active: { type: "boolean", required: false, label: "Activo" },
  },
}