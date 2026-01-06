# Diagrama de Flujo Detallado: Funcionalidad de Cotizaciones

## Flujo Principal del Sistema

```mermaid
graph TD
    A[Inicio] --> B[Usuario Administrador]
    B --> C[Ver Servicios Existentes]
    C --> D{¿Desea crear cotización?}
    D -->|No| E[Flujo normal de reservas]
    D -->|Sí| F[Seleccionar Servicio]
    F --> G[Click en "Guardar como Cotización"]
    G --> H[API: Crear Cotización]
    H --> I[Generar número único]
    I --> J[Calcular fecha de expiración]
    J --> K[Guardar en BD]
    K --> L[Mostrar confirmación]
    L --> M[Cotización creada con éxito]

    M --> N{¿Qué acción desea realizar?}
    N --> O[Ver lista de cotizaciones]
    N --> P[Enviar por WhatsApp]
    N --> Q[Convertir en servicio]
    N --> R[Editar cotización]

    O --> S[Interfaz de Administración]
    S --> T[Filtrar y buscar cotizaciones]
    T --> U[Seleccionar cotización]
    U --> V[Ver detalles y acciones]

    P --> W[Generar mensaje WhatsApp]
    W --> X[Abrir WhatsApp con mensaje]
    X --> Y[Cliente recibe cotización]
    Y --> Z{Cliente responde}
    Z -->|Acepta| AA[Actualizar estado a "aceptada"]
    Z -->|Rechaza| AB[Actualizar estado a "rechazada"]

    Q --> AC[Validar datos]
    AC --> AD[Crear nuevo servicio]
    AD --> AE[Actualizar estado cotización]
    AE --> AF[Servicio disponible para reservas]

    R --> AG[Cargar datos de cotización]
    AG --> AH[Modificar campos permitidos]
    AH --> AI[Guardar cambios]
    AI --> AJ[Cotización actualizada]
```

## Flujo Detallado de Creación de Cotización

```mermaid
sequenceDiagram
    participant Admin as Administrador
    participant UI as Interfaz de Usuario
    participant API as API de Cotizaciones
    participant DB as Base de Datos
    participant Service as Servicio Original

    Admin->>UI: Ve lista de servicios
    UI->>Admin: Muestra servicios con botón "Guardar como Cotización"
    Admin->>UI: Click en botón para servicio específico
    UI->>API: POST /api/tenants/[tenant]/quotes
    Note right of API: Body: {serviceId, name, description, price, duration, validityDays}

    API->>DB: Verificar tenant existe
    DB-->>API: Tenant encontrado
    API->>DB: Verificar servicio existe y pertenece al tenant
    DB-->>API: Servicio encontrado
    API->>API: Generar número único de cotización
    API->>API: Calcular fecha de expiración
    API->>DB: INSERT INTO service_quotes
    DB-->>API: Cotización creada con ID
    API-->>UI: Response 201 con datos de cotización
    UI->>Admin: Mostrar confirmación con número de cotización
```

## Flujo Detallado de Envío por WhatsApp

```mermaid
sequenceDiagram
    participant Admin as Administrador
    participant UI as Interfaz de Administración
    participant WA as WhatsApp
    participant Client as Cliente

    Admin->>UI: Ve lista de cotizaciones
    Admin->>UI: Selecciona cotización y click "Enviar WhatsApp"
    UI->>UI: Validar que cotización tiene teléfono de cliente
    UI->>UI: Generar mensaje formateado
    Note right of UI: Mensaje incluye: número de cotización, servicio, precio, validez

    UI->>WA: Abrir URL de WhatsApp con mensaje preformateado
    Note right of WA: URL: https://wa.me/[phone]?text=[encoded_message]

    WA->>Client: Recibe mensaje de WhatsApp
    Client->>WA: Lee cotización
    Client->>WA: Responde mensaje (acepta/rechaza/consulta)
    WA->>Admin: Recibe respuesta del cliente
    Admin->>UI: Actualiza estado de cotización según respuesta
```

## Flujo Detallado de Conversión a Servicio

```mermaid
sequenceDiagram
    participant Admin as Administrador
    participant UI as Interfaz de Administración
    participant API as API de Cotizaciones
    participant ServiceAPI as API de Servicios
    participant DB as Base de Datos
    participant Quote as Cotización
    participant NewService as Nuevo Servicio

    Admin->>UI: Selecciona cotización y click "Convertir a Servicio"
    UI->>Admin: Mostrar diálogo de confirmación
    Admin->>UI: Confirma conversión
    UI->>API: POST /api/tenants/[tenant]/quotes/[id]/convert-to-service

    API->>DB: Verificar cotización existe y pertenece al tenant
    DB-->>API: Cotización encontrada
    API->>DB: Verificar que cotización no esté convertida
    DB-->>API: Cotización válida para conversión

    API->>ServiceAPI: Crear nuevo servicio con datos de cotización
    Note right of ServiceAPI: Datos: name, description, price, duration, metadata

    ServiceAPI->>DB: INSERT INTO services
    DB-->>ServiceAPI: Servicio creado con ID
    ServiceAPI-->>API: Servicio creado exitosamente

    API->>DB: UPDATE service_quotes SET status = 'converted'
    DB-->>API: Cotización actualizada

    API-->>UI: Response con servicio creado y cotización actualizada
    UI->>Admin: Mostrar confirmación de conversión exitosa
    UI->>Admin: Opción de ver nuevo servicio creado
```

## Estados y Transiciones de Cotización

```mermaid
stateDiagram-v2
    [*] --> Pending: Crear Cotización
    Pending --> Accepted: Cliente Acepta
    Pending --> Rejected: Cliente Rechaza
    Pending --> Expired: Tiempo Expira
    Pending --> Converted: Convertir a Servicio
    Pending --> Pending: Editar Cotización

    Accepted --> Converted: Convertir a Servicio
    Rejected --> [*]: Eliminar
    Expired --> [*]: Eliminar
    Converted --> [*]: Archivar

    note right of Pending
        Estado inicial
        Puede ser editada
        Enviada por WhatsApp
    end note

    note right of Accepted
        Cliente ha aceptado
        Lista para conversión
    end note

    note right of Rejected
        Cliente rechazó
        Puede eliminarse
    end note

    note right of Expired
        Validez expirada
        Puede eliminarse
    end note

    note right of Converted
        Ya es servicio real
        Archivada para historial
    end note
```

## Diagrama de Componentes UI

```mermaid
graph TD
    A[ServiceCard] --> B[QuoteButton]
    A --> C[Reservar Ahora]

    D[QuotesAdminPage] --> E[QuotesClient]
    E --> F[QuoteFilters]
    E --> G[QuoteList]
    G --> H[QuoteCard]

    H --> I[QuoteActions]
    I --> J[EditButton]
    I --> K[WhatsAppButton]
    I --> L[ConvertButton]
    I --> M[DeleteButton]

    N[QuoteDetailsPage] --> O[QuotePreview]
    O --> P[QuoteInfo]
    O --> Q[QuoteCustomerInfo]
    O --> R[QuotePricing]
    O --> S[QuoteValidity]

    T[WhatsAppModal] --> U[MessagePreview]
    U --> V[CustomerPhone]
    V --> W[SendButton]
```

## Flujo de Datos entre Componentes

```mermaid
graph LR
    subgraph Frontend
        A[ServiceCard] --> B[QuoteButton]
        B --> C[useQuoteAPI]
        C --> D[POST /quotes]

        E[QuotesAdminPage] --> F[useQuotesList]
        F --> G[GET /quotes]

        H[QuoteCard] --> I[onConvert]
        I --> J[useConvertQuote]
        J --> K[POST /quotes/[id]/convert-to-service]

        L[QuoteCard] --> M[onSendWhatsApp]
        M --> N[generateWhatsAppMessage]
        N --> O[window.open WhatsApp URL]
    end

    subgraph Backend
        P[API Quotes] --> Q[Database]
        Q --> R[service_quotes table]

        S[API Convert] --> T[Services API]
        T --> U[services table]
    end

    D --> P
    G --> P
    K --> S
```

## Flujo de Permisos y Validación

```mermaid
graph TD
    A[Usuario Accede] --> B[Verificar Rol]
    B --> C{¿Es Admin o Gerente?}
    C -->|Sí| D[Permitir ver cotizaciones]
    C -->|No| E[Denegar acceso]

    D --> F[Acción: Crear Cotización]
    F --> G{¿Tiene permiso?}
    G -->|Sí| H[Permitir creación]
    G -->|No| I[Bloquear botón]

    D --> J[Acción: Enviar WhatsApp]
    J --> K{¿Tiene teléfono cliente?}
    K -->|Sí| L[Permitir envío]
    K -->|No| M[Mostrar error]

    D --> N[Acción: Convertir a Servicio]
    N --> O{¿Estado es convertible?}
    O -->|Sí| P[Permitir conversión]
    O -->|No| Q[Bloquear acción]

    H --> R[Crear cotización]
    L --> S[Generar URL WhatsApp]
    P --> T[Convertir a servicio]
```

## Flujo de Manejo de Errores

```mermaid
graph TD
    A[Acción de Usuario] --> B[Intentar operación]
    B --> C{¿Error?}
    C -->|No| D[Operación exitosa]
    C -->|Sí| E[Identificar tipo de error]

    E --> F[Error de red]
    E --> G[Error de validación]
    E --> H[Error de permisos]
    E --> I[Error de base de datos]

    F --> J[Mostrar "Error de conexión"]
    G --> K[Mostrar mensaje específico]
    H --> L[Mostrar "Sin permisos"]
    I --> M[Mostrar "Error interno"]

    J --> N[Reintentar conexión]
    K --> O[Corregir datos]
    L --> P[Solicitar permisos]
    M --> Q[Contactar soporte]

    N --> B
    O --> B
    P --> B
    Q --> R[Loggear error]
```

Este diagrama detallado muestra todos los flujos, interacciones y estados del sistema de cotizaciones, permitiendo una comprensión completa antes de la implementación.
