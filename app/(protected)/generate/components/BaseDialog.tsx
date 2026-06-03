import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface BaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  trigger?: React.ReactNode;
}

export function BaseDialog({ open, onOpenChange, title, description, icon, children, footer, trigger }: BaseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md border-border/60 rounded-2xl bg-card/95 backdrop-blur-xl">
        <DialogHeader className="space-y-3">
          {icon && (
            <div className="mx-auto w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-2">
              {icon}
            </div>
          )}
          <DialogTitle className={`text-xl font-bold tracking-tight ${icon ? 'text-center' : ''}`}>
            {title}
          </DialogTitle>
          <DialogDescription className={`text-sm text-muted-foreground ${icon ? 'text-center' : ''}`}>
            {description}
          </DialogDescription>
        </DialogHeader>
        {children}
        {footer && (
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:gap-3 mt-4 sm:justify-start">
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
