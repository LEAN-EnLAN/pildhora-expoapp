# Guía de Estilo y Diseño - Pildhora App

## Principios de Diseño
Nuestra interfaz se basa en la claridad, la accesibilidad y la eficiencia para el cuidador.

### 1. Paleta de Colores
Utilizamos un sistema de tokens semánticos para garantizar consistencia y soporte para temas.

- **Primario (Brand)**:
  - `primary[500]`: Acción principal, enlaces activos.
  - `primary[600]`: Estados hover/press, textos importantes.
  - `primary[50]`: Fondos sutiles, estados seleccionados.

- **Semánticos**:
  - **Éxito**: `success[500]` (Verde) - Tareas completadas, adherencia alta (>80%), dispositivo conectado.
  - **Advertencia**: `warning[500]` (Naranja) - Adherencia media (50-80%), batería baja, alertas no críticas.
  - **Error**: `error[500]` (Rojo) - Adherencia baja (<50%), dispositivo desconectado, errores críticos.
  - **Info**: `info[500]` (Azul) - Estados informativos, actualizaciones.

- **Neutros**:
  - `gray[900]`: Texto principal (títulos).
  - `gray[500]`: Texto secundario (metadatos, etiquetas).
  - `gray[100]`: Bordes, divisores.
  - `gray[50]`: Fondo de aplicación/contenedores secundarios.

### 2. Tipografía
Jerarquía clara para facilitar el escaneo rápido.

- **Encabezados**:
  - `text-2xl` / Bold: Títulos de pantalla.
  - `text-lg` / Semibold: Títulos de tarjetas y secciones.
  
- **Cuerpo**:
  - `text-base` / Regular: Texto de párrafo estándar.
  - `text-sm` / Medium: Datos secundarios, etiquetas de estado.
  - `text-xs`: Metadatos, fechas relativas.

### 3. Componentes

#### Tarjetas (Cards)
- **Fondo**: Blanco (`colors.surface`).
- **Borde**: `borderRadius.lg` (12px).
- **Sombra**: `shadows.sm` (sutil para elevación).
- **Padding**: `spacing.md` (16px).

#### Botones
- **Primario**: Fondo sólido, texto blanco. Altura mínima 44px (touch target).
- **Secundario/Outline**: Borde 1px, fondo transparente.
- **Ghost**: Sin borde ni fondo, solo texto/icono.

#### Listas
- Elementos con altura suficiente (>48px).
- Separadores sutiles (`gray[100]`).
- Estados de carga con Skeleton o indicadores claros.

### 4. Espaciado
Sistema base de 4px.
- `xs`: 4px
- `sm`: 8px
- `md`: 16px
- `lg`: 24px
- `xl`: 32px

### 5. Accesibilidad
- **Contraste**: Todos los textos deben cumplir ratio 4.5:1 contra el fondo.
- **Áreas Táctiles**: Mínimo 44x44px para elementos interactivos.
- **Feedback**: Todos los estados interactivos deben tener feedback visual (opacidad, cambio de color).
