// Vendor menus and plan limits change often: re-check both official help pages before editing, then bump lastChecked.
// Claude: https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp
// ChatGPT: https://help.openai.com/en/articles/12584461-connecting-custom-mcp-servers-in-chatgpt
export const connectAi = {
    lastChecked: '2026-11-02',
    vendors: [
        {
            id: 'claude',
            name: 'Claude',
            plan: 'Works on every Claude plan. On Free you can add one custom connector. On Team and Enterprise, an owner adds the connector first; members then connect it.',
            steps: [
                'Copy the address above.',
                'In Claude, open Customize → Connectors, choose + Add and then Add custom connector.',
                'Enter WhatsNextAction as the name, paste the address and choose Continue. Keep the suggested sign-in settings and choose Add.',
                'Choose Connect. WhatsNextAction opens: sign in if needed, check that Claude is the app asking, and tap Allow access.',
                'In a new chat, choose + → Connectors, turn WhatsNextAction on and ask, for example, "What\'s on my Today list?"',
            ],
        },
        {
            id: 'chatgpt',
            name: 'ChatGPT',
            plan: 'Works on ChatGPT Business, Enterprise and Edu, on the web only — there an admin or owner adds the connector. On Pro the app can read your lists but not change them; other plans can\'t add custom connectors yet.',
            steps: [
                'Copy the address above.',
                'In ChatGPT on the web, open Plugins, choose + and then Add custom MCP server.',
                'Enter WhatsNextAction as the name, paste the address under Connection and choose OAuth for authentication.',
                'Tick I understand and want to continue, then choose Create as a plugin.',
                'WhatsNextAction opens: sign in if needed, check that ChatGPT is the app asking, and tap Allow access.',
                'In a new chat, type @, pick WhatsNextAction and ask, for example, "Add \'Call the dentist\' to my Inbox."',
            ],
        },
    ],
}
