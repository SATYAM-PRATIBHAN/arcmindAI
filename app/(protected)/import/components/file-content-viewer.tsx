import { File, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { getLanguageFromFilename } from "./file-browser-utils";
import Image from "next/image";

interface FileContentViewerProps {
  selectedFile: string | null;
  fileContent: string;
  loadingContent: boolean;
  onClose: () => void;
}

export function FileContentViewer({
  selectedFile,
  fileContent,
  loadingContent,
  onClose,
}: FileContentViewerProps) {
  if (!selectedFile) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
        <File className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-lg font-medium">No file selected</p>
        <p className="text-sm">
          Select a file from the sidebar to view its contents
        </p>
      </div>
    );
  }

  if (loadingContent) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isImage = /\.(png|jpg|jpeg|gif|svg|webp|bmp|ico)$/i.test(selectedFile);

  return (
    <div className="h-full overflow-auto flex flex-col">
      {/* File header */}
      <div className="sticky top-0 bg-background border-b px-4 py-3 items-center justify-between z-10 hidden md:flex">
        <h3 className="font-medium text-sm truncate">
          {selectedFile.split("/").pop()}
        </h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* File content */}
      <div className="p-4 flex-1">
        {isImage ? (
          <div className="flex justify-center">
            <Image
              src={fileContent}
              alt={selectedFile || "Uploaded preview"}
              width={500}
              height={300}
              className="max-w-full h-auto rounded-lg object-contain"
              unoptimized
            />
          </div>
        ) : (
          <SyntaxHighlighter
            language={getLanguageFromFilename(selectedFile)}
            style={vscDarkPlus}
            showLineNumbers
            customStyle={{
              margin: 0,
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
            }}
          >
            {fileContent}
          </SyntaxHighlighter>
        )}
      </div>
    </div>
  );
}
