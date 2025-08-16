// Esquemas de campos para cada estrategia

export const STRATEGY_SCHEMAS = {
  CompraPesca: {
    ticker: { type: "text", required: true, label: "Ticker", default: "" },
    profundidad_minima: { type: "number", required: false, label: "Profundidad Mínima", default: 3 },
    intervalo: { type: "number", required: false, label: "Intervalo (segundos)", default: 20 },
    mejorar_precio: { type: "boolean", required: false, label: "Mejorar Precio (Adelantar la punta)", default: false },
    activa: { type: "boolean", required: false, label: "Estado", default: true },
  },
  VentaPesca: {
    ticker: { type: "text", required: true, label: "Ticker", default: "" },
    profundidad_minima: { type: "number", required: false, label: "Profundidad Mínima", default: 3 },
    intervalo: { type: "number", required: false, label: "Intervalo (segundos)", default: 20 },
    mejorar_precio: { type: "boolean", required: false, label: "Mejorar Precio (Adelantar la punta)", default: false },
    activa: { type: "boolean", required: false, label: "Estado", default: true },
  },
  ArbitrajeMEP: {
    ticker_ars: { type: "text", required: true, label: "Ticker", default: "" },
    ticker_usd: { type: "text", required: true, label: "Ticker", default: "" },
    precio_minimo: { type: "number", required: true, label: "Precio Limite Minimo", default: "" },
    precio_maximo: { type: "number", required: true, label: "Precio Limite Maximo", default: "" },
    compra_en_pesos: { type: "boolean", required: false, label: "Habilitar Compra en Pesos", default: true },
    venta_en_pesos: { type: "boolean", required: false, label: "Habilitar Venta en Pesos", default: true },
    compra_en_dolares: { type: "boolean", required: false, label: "Habilitar Compra en Dolares", default: true },
    venta_en_dolares: { type: "boolean", required: false, label: "Habilitar Venta en Dolares", default: true },
    profundidad_minima: { type: "number", required: false, label: "Profundidad Mínima", default: 2 },
    intervalo: { type: "number", required: false, label: "Intervalo (segundos)", default: "20" },
    mejorar_precio: { type: "boolean", required: false, label: "Mejorar Precio (Adelantar la punta)", default: false },
    activa: { type: "boolean", required: false, label: "Estado", default: true },
  },
  // ArbitrajeSimple: {
  //   ticker_primary: { type: "text", required: true, label: "Ticker Primario" },
  //   ticker_secondary: { type: "text", required: true, label: "Ticker Secundario" },
  //   spread_threshold: { type: "number", required: true, label: "Umbral de Spread" },
  //   max_position: { type: "number", required: false, label: "Posición Máxima" },
  //   symbols_to_listen: { type: "ticker_array", required: false, label: "Símbolos a Escuchar" },
  //   active: { type: "boolean", required: false, label: "Activo" },
  // },
  // ScalpingRapido: {
  //   ticker: { type: "text", required: true, label: "Ticker" },
  //   price_threshold: { type: "number", required: true, label: "Umbral de Precio" },
  //   volume_min: { type: "number", required: true, label: "Volumen Mínimo" },
  //   timeout: { type: "number", required: false, label: "Timeout (ms)" },
  //   symbols_pairs: { type: "ticker_pairs", required: false, label: "Pares de Símbolos" },
  //   active: { type: "boolean", required: false, label: "Activo" },
  // },
}