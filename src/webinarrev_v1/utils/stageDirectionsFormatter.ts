export function formatStageDirections(
  purpose: string,
  transition_in: string,
  transition_out: string
): string {
  const parts: string[] = [];

  if (transition_in && transition_in.trim().length > 0) {
    parts.push(`**Enter:** ${transition_in.trim()}`);
  }

  if (purpose && purpose.trim().length > 0) {
    parts.push(`**Purpose:** ${purpose.trim()}`);
  }

  if (transition_out && transition_out.trim().length > 0) {
    parts.push(`**Exit:** ${transition_out.trim()}`);
  }

  return parts.join('\n\n');
}

export function hasPlaceholders(text: string): boolean {
  const placeholderPatterns = [
    /\{\{[^}]+\}\}/,
    /\[TBD\]/i,
    /\[TODO\]/i,
    /\[INSERT[^\]]*\]/i,
    /\[PLACEHOLDER\]/i,
    /\[FILL[^\]]*\]/i,
    /\[ADD[^\]]*\]/i,
    /_placeholder/,
    /XXX/,
    /FIXME/i,
  ];

  return placeholderPatterns.some(pattern => pattern.test(text));
}
