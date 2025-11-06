"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Generation {
  id: string;
  systemName?: string;
  userInput: string;
  createdAt: Date;
}

interface GenerationHistoryCardProps {
  history: Generation[];
  isLoading: boolean;
}

export function GenerationHistoryCard({
  history,
  isLoading,
}: GenerationHistoryCardProps) {
  const sortedHistory = history.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Generation History
        </CardTitle>
        <CardDescription>
          Your previous AI generations and chats
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : sortedHistory.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Input</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedHistory.map((gen: Generation) => (
                  <TableRow key={gen.id}>
                    <TableCell className="font-medium">
                      {new Date(gen.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {gen.systemName || "Custom Generation"}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      <span className="text-muted-foreground">
                        {gen.userInput.substring(0, 50)}
                        {gen.userInput.length > 50 ? "..." : ""}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(gen.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No generations yet</h3>
            <p>Start creating AI generations to see your history here.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
