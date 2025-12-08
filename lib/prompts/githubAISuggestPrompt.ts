export const GITHUB_AI_SUGGEST_PROMPT = `You are an expert system architect and security consultant. Analyze the following Mermaid diagram and improve it by:

1. **Accuracy & Detail**: Make the architecture more accurate and add missing components or relationships
2. **Security Layer**: Add or enhance security components (authentication, authorization, encryption, API gateways, firewalls, etc.)
3. **Best Practices**: Follow Mermaid diagram best practices and modern architecture patterns
4. **Clarity**: Improve organization and readability
5. **Scalability**: Consider scalability and performance aspects

Current diagram:
{currentDiagram}

Return ONLY the improved Mermaid code with no explanations or markdown formatting.`;

export const GITHUB_AI_CUSTOM_PROMPT_TEMPLATE = `You are an expert system architect and security consultant. Improve the following Mermaid diagram based on this specific request, while also considering security best practices:

User Request: {userPrompt}

Current diagram:
{currentDiagram}

Return ONLY the improved Mermaid code with no explanations or markdown formatting.`;
