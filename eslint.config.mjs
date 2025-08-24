import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/components/*", "!@/components/client/**", "!@/components/server/**", "!@/components/shared/**", "!@/components/providers/**", "!@/components/ui/**", "!@/components/docs/**"],
              message: "Import from specific component directories: @/components/client/*, @/components/server/*, @/components/shared/*, @/components/providers/*, @/components/ui/*, or @/components/docs/*"
            },
            {
              group: ["@prisma/client", "**/prisma*"],
              importNames: ["PrismaClient", "Prisma"],
              message: "Direct Prisma imports not allowed in client components. Use server components with serialized data or queries from lib/db/queries/"
            },
            {
              group: ["@/lib/db/prisma", "@/lib/db/index"],
              message: "Direct Prisma database imports not allowed in client components. Use server components with queries from lib/db/queries/"
            }
          ]
        }
      ]
    }
  },
  {
    files: ["app/api/**/*", "lib/db/**/*", "lib/services/**/*", "scripts/**/*"],
    rules: {
      "no-restricted-imports": "off"
    }
  },
  {
    files: ["components/client/**/*"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@prisma/client", "@/lib/db/prisma", "@/lib/db/index", "**/prisma*"],
              message: "Client components cannot import Prisma. Use server components for data fetching and pass serialized props."
            },
            {
              group: ["@/components/server/*"],
              message: "Client components cannot import server components directly. Server components should be used as parents."
            }
          ]
        }
      ]
    }
  },
  {
    files: ["components/server/**/*"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/components/client/*"],
              message: "Server components should not import client components directly. Use dynamic imports or composition patterns."
            }
          ]
        }
      ]
    }
  },
  {
    files: ["components/shared/**/*"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@prisma/client", "@/lib/db/prisma", "@/lib/db/index", "**/prisma*"],
              message: "Shared components should be pure presentational components without data dependencies."
            },
            {
              group: ["@/components/client/*", "@/components/server/*"],
              message: "Shared components should not depend on client or server components. They should be pure and reusable."
            }
          ]
        }
      ]
    }
  }
];

export default eslintConfig;
