import { Home, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileBreadcrumbProps {
  selectedFile: string;
  onBack: () => void;
}

export function FileBreadcrumb({ selectedFile, onBack }: FileBreadcrumbProps) {
  return (
    <div className="flex items-center gap-2 text-sm overflow-x-auto pb-2">
      {/* Back button on mobile */}
      <Button
        variant="ghost"
        size="sm"
        className="lg:hidden shrink-0"
        onClick={onBack}
      >
        <ChevronRight className="w-4 h-4 rotate-180" />
        Files
      </Button>

      {/* Breadcrumb path */}
      <div className="flex items-center gap-1 text-muted-foreground">
        <Home className="w-3 h-3 shrink-0" />
        <ChevronRight className="w-3 h-3 shrink-0" />
        {selectedFile.split("/").map((segment, index, array) => (
          <div key={index} className="flex items-center gap-1 shrink-0">
            {index === array.length - 1 ? (
              <span className="font-medium text-foreground">{segment}</span>
            ) : (
              <>
                <span>{segment}</span>
                <ChevronRight className="w-3 h-3" />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
