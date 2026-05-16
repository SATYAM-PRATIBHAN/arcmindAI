/**
 * Cleans a Mermaid string by removing code block markers and handling escaped characters.
 * @param input The raw Mermaid string to clean.
 * @returns A cleaned Mermaid string.
 */
export function cleanMermaidString(input: string | undefined | null): string {
  if (!input || typeof input !== "string") return "";

  return (
    input
      // Remove code block markers if present (for backward compatibility)
      .replace(/^```mermaid\n?/g, "")
      .replace(/\n?```$/g, "")
      .replace(/```/g, "")
      // Convert escaped newlines to actual newlines
      .replace(/\\n/g, "\n")
      // Handle any other escaped characters
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      .trim()
  );
}
