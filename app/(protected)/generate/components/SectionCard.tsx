import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function SectionCard({ title, children, className }: SectionCardProps) {
  return (
    <Card className={`border-border/60 shadow-none bg-card/30 ${className || ''}`}>
      <CardHeader className="pb-3 border-b border-border/40">
        <CardTitle className="text-lg font-bold tracking-tight">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {children}
      </CardContent>
    </Card>
  );
}
