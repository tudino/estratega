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
import { Upload, Plus, Save, Moon, Sun } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
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
          description: `Se cargaron ${data.length} componentes exitosamente.`,
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
      toast({
        title: "Error",
        description: "El archivo no tiene un formato JSON válido.",
        variant: "destructive",
      })
    }
  }

  // Seleccionar componente
  const handleSelectComponent = (component: StrategyComponent, index: number) => {
    setSelectedComponent({ ...component })
    setSelectedIndex(index)
    setShowCreateForm(false)
  }

  // Actualizar campo del componente seleccionado
  const handleUpdateField = (field: string, value: any) => {
    if (!selectedComponent) return

    const updated = { ...selectedComponent, [field]: value }
    setSelectedComponent(updated)

    // Actualizar en la lista
    const newComponents = [...components]
    newComponents[selectedIndex] = updated
    setComponents(newComponents)
  }

  // Crear nuevo componente
  const handleCreateNew = () => {
    setShowCreateForm(true)
    setSelectedComponent(null)
    setNewStrategy("")
    setNewComponent({})
  }

  // Seleccionar estrategia para nuevo componente
  const handleStrategySelect = (strategy: string) => {
    setNewStrategy(strategy)
    const schema = STRATEGY_SCHEMAS[strategy as keyof typeof STRATEGY_SCHEMAS]
    const defaultComponent: Partial<StrategyComponent> = { strategy }

    // Inicializar con valores por defecto
    Object.entries(schema).forEach(([key, config]) => {
      if (config.type === "boolean") {
        defaultComponent[key] = false
      } else if (config.type === "number") {
        defaultComponent[key] = 0
      } else {
        defaultComponent[key] = ""
      }
    })

    setNewComponent(defaultComponent)
  }

  // Guardar nuevo componente
  const handleSaveNew = () => {
    if (!newStrategy || !newComponent.strategy) return

    const schema = STRATEGY_SCHEMAS[newStrategy as keyof typeof STRATEGY_SCHEMAS]

    // Validar campos requeridos
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
      title: "Componente creado",
      description: "El nuevo componente se ha agregado exitosamente.",
    })
  }

  // Borrar componente
  const handleDeleteComponent = () => {
    if (selectedIndex === -1) return

    const newComponents = components.filter((_, index) => index !== selectedIndex)
    setComponents(newComponents)
    setSelectedComponent(null)
    setSelectedIndex(-1)

    toast({
      title: "Componente eliminado",
      description: "El componente se ha eliminado exitosamente.",
    })
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
              Nuevo Componente
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Panel izquierdo - Lista de componentes */}
        <div className="w-96 border-r bg-card">
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">Estrategias ({components.length})</h2>
            <div className="space-y-1 overflow-y-auto h-[calc(100vh-150px)]">
              {components.map((component, index) => (
                <Card
                  key={index}
                  className={`cursor-pointer transition-colors hover:bg-accent py-0 rounded ${
                    selectedIndex === index ? "bg-yellow-100" : ""
                  }`}
                  onClick={() => handleSelectComponent(component, index)}
                >
                  <CardContent className="p-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{component.strategy}</p>
                        <p className="text-sm text-muted-foreground truncate">{component.ticker}</p>
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
              ))}

              {components.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No hay componentes cargados</p>
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
                <CardTitle>Crear Nuevo Componente</CardTitle>
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
                      <Button onClick={handleSaveNew}>Crear Componente</Button>
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
                  Editar Componente: {selectedComponent.strategy}
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
                <p className="text-lg mb-2">Selecciona un componente para editarlo</p>
                <p>o crea uno nuevo usando el botón superior</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input oculto para cargar archivos */}
      <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileLoad} className="hidden" />
    </div>
  )
}
