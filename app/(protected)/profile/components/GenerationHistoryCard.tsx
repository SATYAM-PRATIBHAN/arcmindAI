"use client";

import { useState, useMemo } from "react";
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
import { useRouter } from "next/navigation";
import { DOC_ROUTES } from "@/lib/routes";

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
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  // Filter history based on search term (case-insensitive)
  const filteredHistory = useMemo(() => {
    return history
      .filter((gen) =>
        (gen.systemName || "Custom Generation")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()),
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [history, searchTerm]);

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
        <input
          type="text"
          placeholder="Search by system name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filteredHistory.length > 0 ? (
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
                {filteredHistory.map((gen: Generation) => (
                  <TableRow
                    key={gen.id}
                    onClick={() =>
                      router.push(`${DOC_ROUTES.GENERATE}/${gen.id}`)
                    }
                    className="cursor-pointer"
                  >
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
            <h3 className="text-lg font-semibold mb-2">No generations found</h3>
            <p>Try adjusting your search or create new AI generations.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
