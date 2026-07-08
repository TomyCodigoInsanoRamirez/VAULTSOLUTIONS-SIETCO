Monorepo de SIETCO: dos aplicaciones [Next.js](https://nextjs.org) independientes que comparten un paquete de diseño común.

## Estructura

```
apps/word/     Editor de documentos (Word)   → http://localhost:3000
apps/excel/    Hoja de cálculo (Excel)        → http://localhost:3001
packages/ui/   Componentes de diseño compartidos (@sietco/ui)
```

## Getting Started

Instala las dependencias una sola vez desde la raíz (usa npm workspaces):

```bash
npm install
```

Corre cada app en su propia terminal:

```bash
npm run dev:word    # http://localhost:3000
npm run dev:excel   # http://localhost:3001
```

Otros scripts disponibles desde la raíz: `build:word`, `build:excel`, `lint:word`, `lint:excel`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
