import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-mermaid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CodeEditorPanelProps {
  code: string;
  onCodeChange: (code: string) => void;
}

export function CodeEditorPanel({ code, onCodeChange }: CodeEditorPanelProps) {
  return (
    <Card className="h-full border-0 rounded-none flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="text-lg">Mermaid Code</CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-auto">
        <Editor
          value={code}
          onValueChange={onCodeChange}
          highlight={(codeStr) =>
            highlight(codeStr, languages.mermaid || languages.markup, "mermaid")
          }
          padding={16}
          style={{
            fontFamily: '"Fira Code", "Courier New", monospace',
            fontSize: 14,
            minHeight: "100%",
            backgroundColor: "#1e1e1e",
            color: "#d4d4d4",
          }}
          textareaClassName="focus:outline-none"
        />
      </CardContent>
    </Card>
  );
}
