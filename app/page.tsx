"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Upload, Plus, Save, Moon, Sun, Search, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { INSTRUMENTS } from "@/app/instruments"
import { STRATEGY_SCHEMAS } from "./schemas"

// Definición de tipos
interface StrategyComponent {
  strategy: string
  ticker: string
  min_depth: number
  interval: number
  active: boolean
  [key: string]: any
}

export default function StrategyManager() {
  const [components, setComponents] = useState<StrategyComponent[]>([])
  const [selectedComponent, setSelectedComponent] = useState<StrategyComponent | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newStrategy, setNewStrategy] = useState("")
  const [newComponent, setNewComponent] = useState<Partial<StrategyComponent>>({})
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDarkMode])

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  const filteredComponents = components.filter((component) => {
    if (!searchTerm) return true

    const searchLower = searchTerm.toLowerCase()

    // Buscar por estrategia
    if (component.strategy.toLowerCase().includes(searchLower)) {
      return true
    }

    // Buscar en todos los campos que empiecen con "ticker"
    const tickerFields = Object.keys(component).filter((key) => key.toLowerCase().startsWith("ticker"))

    for (const field of tickerFields) {
      const value = component[field]
      if (typeof value === "string" && value.toLowerCase().includes(searchLower)) {
        return true
      }
    }

    // También buscar en arrays de tickers
    if (component.symbols_to_listen && Array.isArray(component.symbols_to_listen)) {
      return component.symbols_to_listen.some((symbol: string) => symbol.toLowerCase().includes(searchLower))
    }

    // Buscar en pares de símbolos
    if (component.symbols_pairs && Array.isArray(component.symbols_pairs)) {
      return component.symbols_pairs.some((pair: string[]) =>
        pair.some((symbol: string) => symbol.toLowerCase().includes(searchLower)),
      )
    }

    return false
  })

  // Cargar archivo JSON
  const handleFileLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        setComponents(data)
        setSelectedComponent(null)
        setSelectedIndex(-1)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
        toast({
          title: "Archivo cargado",
          description: `Se cargaron ${data.length} estrategias exitosamente.`,
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "El archivo no tiene un formato JSON válido.",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)
  }

  // Guardar cambios
  const handleSave = async () => {
    try {
      const dataStr = JSON.stringify(components, null, 2)
      const handle = await window.showSaveFilePicker({
        suggestedName: 'estrategias.json',
        types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }]
      });
      const writable = await handle.createWritable();
      await writable.write(dataStr);
      await writable.close();
    } catch (error) {
      if (error.name === 'AbortError') {
        return;
      }
      toast({
        title: "Error",
        description: "El archivo no tiene un formato JSON válido.",
        variant: "destructive",
      })
    }
  }

  // Seleccionar estrategia
  const handleSelectComponent = (component: StrategyComponent, index: number) => {
    setSelectedComponent({ ...component })
    setSelectedIndex(index)
    setShowCreateForm(false)
  }

  // Actualizar campo del estrategia seleccionado
  const handleUpdateField = (field: string, value: any) => {
    if (!selectedComponent) return

    const updated = { ...selectedComponent, [field]: value }
    setSelectedComponent(updated)

    const newComponents = [...components]
    newComponents[selectedIndex] = updated
    setComponents(newComponents)
  }

  // Crear nuevo estrategia
  const handleCreateNew = () => {
    setShowCreateForm(true)
    setSelectedComponent(null)
    setNewStrategy("")
    setNewComponent({})
  }

  // Seleccionar estrategia para nuevo estrategia
  const handleStrategySelect = (strategy: string) => {
    setNewStrategy(strategy)
    const schema = STRATEGY_SCHEMAS[strategy as keyof typeof STRATEGY_SCHEMAS]
    const defaultComponent: Partial<StrategyComponent> = { strategy }

    Object.entries(schema).forEach(([key, config]) => {
      if (config.type === "boolean") {
        defaultComponent[key] = false
      } else if (config.type === "number") {
        defaultComponent[key] = 0
      } else if (config.type === "ticker_array") {
        defaultComponent[key] = []
      } else if (config.type === "ticker_pairs") {
        defaultComponent[key] = []
      } else {
        defaultComponent[key] = ""
      }
    })

    setNewComponent(defaultComponent)
  }

  // Guardar nuevo estrategia
  const handleSaveNew = () => {
    if (!newStrategy || !newComponent.strategy) return

    const schema = STRATEGY_SCHEMAS[newStrategy as keyof typeof STRATEGY_SCHEMAS]

    const missingFields = Object.entries(schema)
      .filter(([key, config]) => config.required && !newComponent[key])
      .map(([key]) => key)

    if (missingFields.length > 0) {
      toast({
        title: "Campos requeridos",
        description: `Faltan los siguientes campos: ${missingFields.join(", ")}`,
        variant: "destructive",
      })
      return
    }

    const newComponents = [...components, newComponent as StrategyComponent]
    setComponents(newComponents)
    setShowCreateForm(false)
    setNewComponent({})
    setNewStrategy("")

    toast({
      title: "Estrategia creada",
      description: "La nueva estrategia se ha agregado exitosamente.",
    })
  }

  // Borrar estrategia
  const handleDeleteComponent = () => {
    if (selectedIndex === -1) return

    const newComponents = components.filter((_, index) => index !== selectedIndex)
    setComponents(newComponents)
    setSelectedComponent(null)
    setSelectedIndex(-1)

    toast({
      title: "Estrategia eliminada",
      description: "La estrategia se ha eliminado exitosamente.",
    })
  }

  const getInstrumentSuggestions = (query: string) => {
    if (!query || query.length < 1) return []

    const searchLower = query.toLowerCase()
    return INSTRUMENTS.filter(
      (instrument) =>
        instrument.symbolReference.toLowerCase().includes(searchLower) ||
        instrument.tradingSymbol.toLowerCase().includes(searchLower),
    ).slice(0, 10) // Limitar a 10 sugerencias
  }

  const InstrumentSuggestions = ({
    query,
    onSelect,
    className = "",
  }: {
    query: string
    onSelect: (instrument: any) => void
    className?: string
  }) => {
    const suggestions = getInstrumentSuggestions(query)

    if (suggestions.length === 0) return null

    return (
      <div
        className={`absolute z-50 w-full bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto ${className}`}
      >
        {suggestions.map((instrument, index) => (
          <div
            key={index}
            className="px-3 py-2 cursor-pointer hover:bg-accent text-sm border-b last:border-b-0"
            onClick={() => onSelect(instrument)}
          >
            <div className="font-medium">{instrument.symbolReference}</div>
            <div className="text-xs text-muted-foreground">{instrument.tradingSymbol}</div>
          </div>
        ))}
      </div>
    )
  }

  const TickerInputWithSuggestions = ({
    value,
    onChange,
    placeholder,
    id,
  }: {
    value: string
    onChange: (value: string) => void
    placeholder: string
    id: string
  }) => {
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [inputValue, setInputValue] = useState("")
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
      const instrument = INSTRUMENTS.find((i) => i.tradingSymbol === value)
      setInputValue(instrument ? instrument.symbolReference : value || "")
    }, [value])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setInputValue(newValue)
      setShowSuggestions(newValue.length > 0)
      setSelectedSuggestionIndex(-1)
    }

    const focusNextInput = () => {
      setTimeout(() => {
        const currentInput = inputRef.current
        if (currentInput) {
          // Buscar en todo el documento por inputs focuseables
          const allInputs = document.querySelectorAll(
            'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])',
          )
          const inputsArray = Array.from(allInputs) as HTMLElement[]
          const currentIndex = inputsArray.indexOf(currentInput)

          if (currentIndex !== -1 && currentIndex < inputsArray.length - 1) {
            const nextInput = inputsArray[currentIndex + 1]
            nextInput.focus()
          }
        }
      }, 50) // Pequeño delay para asegurar que el DOM se actualice
    }

    const handleSelectInstrument = (instrument: any) => {
      setInputValue(instrument.symbolReference)
      onChange(instrument.tradingSymbol)
      setShowSuggestions(false)
      setSelectedSuggestionIndex(-1)
      focusNextInput()
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!showSuggestions) return

      const suggestions = getInstrumentSuggestions(inputValue)

      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedSuggestionIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1))
      } else if (e.key === "Enter" && selectedSuggestionIndex >= 0) {
        e.preventDefault()
        handleSelectInstrument(suggestions[selectedSuggestionIndex])
      } else if (e.key === "Escape") {
        setShowSuggestions(false)
        setSelectedSuggestionIndex(-1)
      }
    }

    const handleBlur = (e: React.FocusEvent) => {
      setTimeout(() => {
        if (!document.activeElement?.closest(".suggestions-container")) {
          setShowSuggestions(false)
          setSelectedSuggestionIndex(-1)
          if (inputValue && !INSTRUMENTS.find((i) => i.symbolReference === inputValue)) {
            onChange(inputValue)
          }
        }
      }, 150)
    }

    return (
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue.length > 0 && setShowSuggestions(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
        />
        {showSuggestions && (
          <div className="suggestions-container absolute z-50 w-full bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto top-full mt-1">
            {getInstrumentSuggestions(inputValue).map((instrument, index) => (
              <div
                key={index}
                className={`px-3 py-2 cursor-pointer text-sm border-b last:border-b-0 ${
                  index === selectedSuggestionIndex ? "bg-accent" : "hover:bg-accent"
                }`}
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleSelectInstrument(instrument)
                }}
                onMouseEnter={() => setSelectedSuggestionIndex(index)}
              >
                <div className="font-medium">{instrument.symbolReference}</div>
                <div className="text-xs text-muted-foreground">{instrument.tradingSymbol}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const TickerArrayField = ({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) => {
    const [newTicker, setNewTicker] = useState("")
    const [showSuggestions, setShowSuggestions] = useState(false)

    const addTicker = (ticker: string) => {
      if (ticker && !value.includes(ticker)) {
        onChange([...value, ticker])
        setNewTicker("")
        setShowSuggestions(false)
      }
    }

    const handleSelectInstrument = (instrument: any) => {
      addTicker(instrument.tradingSymbol)
    }

    const removeTicker = (indexToRemove: number) => {
      const newArray = [...value]
      newArray.splice(indexToRemove, 1)
      onChange(newArray)
    }

    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              value={newTicker}
              onChange={(e) => {
                setNewTicker(e.target.value)
                setShowSuggestions(e.target.value.length > 0)
              }}
              onFocus={() => newTicker.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Ingrese ticker..."
            />
            {showSuggestions && (
              <InstrumentSuggestions query={newTicker} onSelect={handleSelectInstrument} className="top-full mt-1" />
            )}
          </div>
          <Button type="button" onClick={() => addTicker(newTicker)} disabled={!newTicker}>
            Agregar
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {value.map((ticker, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {INSTRUMENTS.find((i) => i.tradingSymbol === ticker)?.symbolReference || ticker}
              <span
                className="cursor-pointer hover:text-destructive transition-colors"
                style={{ cursor: "pointer" }}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  removeTicker(index)
                }}>
                x
              </span>
            </Badge>
          ))}
        </div>
      </div>
    )
  }

  const TickerPairsField = ({ value, onChange }: { value: string[][]; onChange: (value: string[][]) => void }) => {
    const [newPair, setNewPair] = useState(["", ""])
    const [showSuggestions1, setShowSuggestions1] = useState(false)
    const [showSuggestions2, setShowSuggestions2] = useState(false)

    const addPair = () => {
      if (newPair[0] && newPair[1]) {
        onChange([...value, [...newPair]])
        setNewPair(["", ""])
      }
    }

    const removePair = (index: number) => {
      onChange(value.filter((_, i) => i !== index))
    }

    const updateNewPair = (index: number, ticker: string) => {
      const updated = [...newPair]
      updated[index] = ticker
      setNewPair(updated)
    }

    const handleSelectInstrument = (instrument: any, pairIndex: number) => {
      updateNewPair(pairIndex, instrument.tradingSymbol)
      if (pairIndex === 0) setShowSuggestions1(false)
      else setShowSuggestions2(false)
    }

    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              value={INSTRUMENTS.find((i) => i.tradingSymbol === newPair[0])?.symbolReference || newPair[0]}
              onChange={(e) => {
                updateNewPair(0, e.target.value)
                setShowSuggestions1(e.target.value.length > 0)
              }}
              onFocus={() => newPair[0].length > 0 && setShowSuggestions1(true)}
              onBlur={() => setTimeout(() => setShowSuggestions1(false), 150)}
              placeholder="Primer símbolo..."
            />
            {showSuggestions1 && (
              <InstrumentSuggestions
                query={newPair[0]}
                onSelect={(instrument) => handleSelectInstrument(instrument, 0)}
                className="top-full mt-1"
              />
            )}
          </div>
          <div className="flex-1 relative">
            <Input
              value={INSTRUMENTS.find((i) => i.tradingSymbol === newPair[1])?.symbolReference || newPair[1]}
              onChange={(e) => {
                updateNewPair(1, e.target.value)
                setShowSuggestions2(e.target.value.length > 0)
              }}
              onFocus={() => newPair[1].length > 0 && setShowSuggestions2(true)}
              onBlur={() => setTimeout(() => setShowSuggestions2(false), 150)}
              placeholder="Segundo símbolo..."
            />
            {showSuggestions2 && (
              <InstrumentSuggestions
                query={newPair[1]}
                onSelect={(instrument) => handleSelectInstrument(instrument, 1)}
                className="top-full mt-1"
              />
            )}
          </div>
          <Button type="button" onClick={addPair} disabled={!newPair[0] || !newPair[1]}>
            Agregar Par
          </Button>
        </div>
        <div className="space-y-2">
          {value.map((pair, index) => (
            <div key={index} className="flex items-center gap-2 p-2 border rounded">
              <Badge variant="outline">
                {INSTRUMENTS.find((i) => i.tradingSymbol === pair[0])?.symbolReference || pair[0]}
              </Badge>
              <span>↔</span>
              <Badge variant="outline">
                {INSTRUMENTS.find((i) => i.tradingSymbol === pair[1])?.symbolReference || pair[1]}
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => removePair(index)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const getComponentTickerReferences = (component: StrategyComponent): string[] => {
    const tickerReferences: string[] = []

    // Buscar todos los campos que empiecen con "ticker"
    Object.keys(component).forEach((key) => {
      if (key.toLowerCase().startsWith("ticker")) {
        const value = component[key]
        if (typeof value === "string" && value) {
          const instrument = INSTRUMENTS.find((i) => i.tradingSymbol === value)
          if (instrument) {
            tickerReferences.push(instrument.symbolReference)
          } else {
            tickerReferences.push(value) // Si no encuentra el instrumento, mostrar el valor original
          }
        }
      }
    })

    // También buscar en arrays de tickers
    if (component.symbols_to_listen && Array.isArray(component.symbols_to_listen)) {
      component.symbols_to_listen.forEach((symbol: string) => {
        const instrument = INSTRUMENTS.find((i) => i.tradingSymbol === symbol)
        if (instrument) {
          tickerReferences.push(instrument.symbolReference)
        } else {
          tickerReferences.push(symbol)
        }
      })
    }

    // Buscar en pares de símbolos
    if (component.symbols_pairs && Array.isArray(component.symbols_pairs)) {
      component.symbols_pairs.forEach((pair: string[]) => {
        pair.forEach((symbol: string) => {
          const instrument = INSTRUMENTS.find((i) => i.tradingSymbol === symbol)
          if (instrument) {
            tickerReferences.push(instrument.symbolReference)
          } else {
            tickerReferences.push(symbol)
          }
        })
      })
    }

    return [...new Set(tickerReferences)] // Eliminar duplicados
  }

  // Renderizar campo del formulario
  const renderFormField = (key: string, value: any, isNew = false) => {
    const strategy = isNew ? newStrategy : selectedComponent?.strategy
    if (!strategy) return null

    const schema = STRATEGY_SCHEMAS[strategy as keyof typeof STRATEGY_SCHEMAS]
    const fieldConfig = schema[key]
    if (!fieldConfig) return null

    const handleChange = (newValue: any) => {
      if (isNew) {
        setNewComponent((prev) => ({ ...prev, [key]: newValue }))
      } else {
        handleUpdateField(key, newValue)
      }
    }

    return (
      <div key={key} className="space-y-2">
        <Label htmlFor={key} className="flex items-center gap-2">
          {fieldConfig.label}
          {fieldConfig.required && <span className="text-red-500">*</span>}
        </Label>

        {fieldConfig.type === "boolean" ? (
          <div className="flex items-center space-x-2">
            <Switch id={key} checked={value || false} onCheckedChange={handleChange} />
            <Label htmlFor={key}>{value ? "Activo" : "Inactivo"}</Label>
          </div>
        ) : fieldConfig.type === "number" ? (
          <Input
            id={key}
            type="number"
            value={value || ""}
            onChange={(e) => handleChange(Number(e.target.value))}
            placeholder={`Ingrese ${fieldConfig.label.toLowerCase()}`}
          />
        ) : fieldConfig.type === "ticker_array" ? (
          <TickerArrayField value={value || []} onChange={handleChange} />
        ) : fieldConfig.type === "ticker_pairs" ? (
          <TickerPairsField value={value || []} onChange={handleChange} />
        ) : key.toLowerCase().startsWith("ticker") ? (
          <TickerInputWithSuggestions
            id={key}
            value={INSTRUMENTS.find((i) => i.tradingSymbol === value)?.symbolReference || value || ""}
            onChange={handleChange}
            placeholder={`Ingrese ${fieldConfig.label.toLowerCase()}`}
          />
        ) : (
          <Input
            id={key}
            type="text"
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={`Ingrese ${fieldConfig.label.toLowerCase()}`}
          />
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Barra superior */}
      <div className="border-b bg-card">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold">Gestor de Estrategias</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="flex items-center justify-center bg-transparent"
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Cargar JSON
            </Button>
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={components.length === 0}
              className="flex items-center gap-2 bg-transparent"
            >
              <Save className="h-4 w-4" />
              Guardar
            </Button>
            <Button onClick={handleCreateNew} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nueva Estrategia
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Panel izquierdo - Lista de estrategias */}
        <div className="w-96 border-r bg-card">
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">Estrategias ({components.length})</h2>

            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por estrategia o instrumento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchTerm && (
                  <X
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => setSearchTerm("")}
                  />
                )}
              </div>
            </div>

            <div className="space-y-1">
              {filteredComponents.map((component, index) => {
                const originalIndex = components.findIndex((c) => c === component)
                const tickerReferences = getComponentTickerReferences(component)

                return (
                  <Card
                    key={originalIndex}
                    className={`cursor-pointer transition-colors hover:bg-accent py-0 ${
                      selectedIndex === originalIndex ? "bg-yellow-100" : ""
                    }`}
                    onClick={() => handleSelectComponent(component, originalIndex)}
                  >
                    <CardContent className="p-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{component.strategy}</p>
                          <div className="text-xs text-muted-foreground">
                            {tickerReferences.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {tickerReferences.map((ref, idx) => (
                                  <span key={idx} className="truncate">
                                    {ref}
                                    {idx < tickerReferences.length - 1 ? "," : ""}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs italic">Sin instrumentos</span>
                            )}
                          </div>
                        </div>
                        <Badge
                          variant={component.active ? "default" : "secondary"}
                          className={component.active ? "bg-green-500" : "bg-gray-200"}
                        >
                          {component.active ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              {filteredComponents.length === 0 && components.length > 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No se encontraron estrategias</p>
                  <p className="text-sm">Intenta con otro término de búsqueda</p>
                </div>
              )}

              {components.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No hay estrategias cargadas</p>
                  <p className="text-sm">Carga un archivo JSON para comenzar</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Panel derecho - Formulario */}
        <div className="flex-1 p-6">
          {showCreateForm ? (
            <Card>
              <CardHeader>
                <CardTitle>Crear Nueva Estrategia</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Estrategia</Label>
                  <Select value={newStrategy} onValueChange={handleStrategySelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una estrategia" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(STRATEGY_SCHEMAS).map((strategy) => (
                        <SelectItem key={strategy} value={strategy}>
                          {strategy}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {newStrategy && (
                  <>
                    <Separator />
                    <div className="grid gap-4">
                      {Object.entries(STRATEGY_SCHEMAS[newStrategy as keyof typeof STRATEGY_SCHEMAS]).map(([key]) =>
                        renderFormField(key, newComponent[key], true),
                      )}
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleSaveNew}>Crear Estrategia</Button>
                      <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : selectedComponent ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Editar Estrategia: {selectedComponent.strategy}
                  <Button variant="destructive" size="sm" onClick={handleDeleteComponent} className="ml-4">
                    Eliminar
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(selectedComponent).map(([key, value]) => renderFormField(key, value))}
              </CardContent>
            </Card>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <p className="text-lg mb-2">Selecciona una estrategia para editarla</p>
                <p>o crea uno nuevo usando el botón superior</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileLoad} className="hidden" />
    </div>
  )
}
