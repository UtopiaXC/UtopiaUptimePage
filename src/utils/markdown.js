/**
 * Simple markdown renderer for announcements
 * Supports: headings, bold, italic, links, code, lists, blockquotes, line breaks
 */

export function renderMarkdown(text) {
    if (!text) return '';

    let html = escapeHtml(text);

    // Code blocks (``` ... ```)
    html = html.replace(/```([\s\S]*?)```/g, '<pre class="md-code-block"><code>$1</code></pre>');

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>');

    // Headings
    html = html.replace(/^### (.+)$/gm, '<h4 class="md-heading">$1</h4>');
    html = html.replace(/^## (.+)$/gm, '<h3 class="md-heading">$1</h3>');
    html = html.replace(/^# (.+)$/gm, '<h2 class="md-heading">$1</h2>');

    // Bold + Italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="md-link">$1</a>');

    // Blockquotes
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote class="md-blockquote">$1</blockquote>');

    // Unordered lists
    html = html.replace(/^[*-] (.+)$/gm, '<li class="md-list-item">$1</li>');
    html = html.replace(/((?:<li class="md-list-item">.*<\/li>\n?)+)/g, '<ul class="md-list">$1</ul>');

    // Horizontal rules
    html = html.replace(/^---$/gm, '<hr class="md-hr">');

    // Line breaks (double newline = paragraph, single = br)
    html = html.replace(/\n\n/g, '</p><p class="md-paragraph">');
    html = html.replace(/\n/g, '<br>');

    // Wrap in paragraph if not already wrapped
    if (!html.startsWith('<')) {
        html = '<p class="md-paragraph">' + html + '</p>';
    }

    return html;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
