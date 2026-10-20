import { ProgrammingLanguage, WorkspaceFile } from "./workspace.types";

export const STARTER_SNIPPETS: Record<ProgrammingLanguage, { filename: string; code: string }> = {
  python: {
    filename: "main.py",
    code: `# CodeBasick - Python Workspace
# Beginner-friendly programming environment

def greet(name: str) -> str:
    return f"Hello, {name}! Welcome to CodeBasick."

def main():
    message = greet("Learner")
    print(message)
    print("Ready to explore algorithms, data structures, and AI assistance.")

if __name__ == "__main__":
    main()
`,
  },
  c: {
    filename: "main.c",
    code: `// CodeBasick - C Workspace
// Beginner-friendly programming environment

#include <stdio.h>

int main(void) {
    char name[] = "Learner";
    printf("Hello, %s! Welcome to CodeBasick.\\n", name);
    printf("Ready to explore structured logic and system programming.\\n");
    return 0;
}
`,
  },
  javascript: {
    filename: "index.js",
    code: `// CodeBasick - JavaScript Workspace
// Beginner-friendly programming environment

function greet(name) {
    return \`Hello, \${name}! Welcome to CodeBasick.\`;
}

console.log(greet("Learner"));
console.log("Ready to explore asynchronous coding and modern JS.");
`,
  },
  "html-css": {
    filename: "index.html",
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CodeBasick Web Playground</title>
  <style>
    body { font-family: sans-serif; padding: 2rem; background: #0b0c0e; color: #f3f4f6; }
    h1 { color: #10b981; }
  </style>
</head>
<body>
  <h1>Welcome to CodeBasick</h1>
  <p>Your beginner-friendly web coding environment.</p>
</body>
</html>
`,
  },
};

export function getStarterFileForLanguage(lang: ProgrammingLanguage): WorkspaceFile {
  const meta = STARTER_SNIPPETS[lang] || STARTER_SNIPPETS.python;
  return {
    id: `file_${lang}_entry_${Date.now().toString(36)}`,
    name: meta.filename,
    language: lang,
    content: meta.code,
    isEntry: true,
    isStarter: true,
  };
}

export function getMonacoLanguage(lang: ProgrammingLanguage | string): string {
  switch (lang) {
    case "c":
      return "c";
    case "python":
      return "python";
    case "javascript":
      return "javascript";
    case "html-css":
      return "html";
    default:
      return "plaintext";
  }
}

export function detectLanguageFromFilename(filename: string): ProgrammingLanguage {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".c") || lower.endsWith(".h")) return "c";
  if (lower.endsWith(".py")) return "python";
  if (lower.endsWith(".js") || lower.endsWith(".ts")) return "javascript";
  if (lower.endsWith(".html") || lower.endsWith(".css")) return "html-css";
  return "python";
}
