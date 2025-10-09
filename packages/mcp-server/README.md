# MCP Server for Messaging Platform

This package exposes a subset of the messaging platform backend over the [Model Context Protocol](https://modelcontextprotocol.io).

## Prerequisites

- Node.js 18+
- A company identifier to scope data. Set `MCP_COMPANY_ID=<companyId>` before starting the server.
- A user identifier for authorship of created resources. Set `MCP_USER_ID=<userId>` (or `DEFAULT_USER_ID`) so schedule creation can attribute the action.

## Available capabilities

| Type     | Name                          | Description                                                                                                                                                          |
| -------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resource | `templates:list`              | Returns all templates for the configured company as JSON.                                                                                                            |
| Tool     | `templates:create`            | Creates a new template. Automatically extracts `{{variables}}` from the content if none are provided.                                                                |
| Resource | `contacts:list`               | Lists every contact (with metadata) belonging to the configured company.                                                                                             |
| Resource | `contacts:birthdayCandidates` | Lists contacts that have a `birthDate`, handy for BIRTHDAY schedules.                                                                                                |
| Tool     | `contacts:create`             | Creates a contact. Requires `firstName`, `lastName`, and `phoneNumber`; supports optional email, address, note, and ISO `birthDate`.                                 |
| Resource | `groups:list`                 | Returns every group with member rollups and birthdate hints.                                                                                                         |
| Resource | `schedules:list`              | Returns the scheduled-message queue, including status flags and timestamps.                                                                                          |
| Tool     | `schedules:create`            | Creates a scheduled message. Mirrors backend validation (template variables, BIRTHDAY guard, future `scheduledAt`) and returns the created schedule with recipients. |

## Development

```bash
pnpm --filter @repo/mcp-server dev
```

The command watches `src/index.ts`, recompiles with `tsup`, and keeps the stdio transport open for an MCP client.

## Production build

```bash
pnpm --filter @repo/mcp-server build
```

Outputs compiled ESM and type definitions into `dist/`.

## Running manually

```bash
MCP_COMPANY_ID=<companyId> pnpm --filter @repo/mcp-server dev
```

From an MCP-compatible client (e.g. Claude Desktop or the VS Code extension), point to the compiled entrypoint in `dist/index.js` or run the dev script above and connect via stdio.

## Connecting with Claude Code

1.  Build once so the entrypoint exists:

        ```bash
        pnpm --filter @repo/mcp-server build
        ```

2.  Register the server with Claude Code (adjust the `--cwd` path if your workspace lives elsewhere):

        ```bash
        claude mcp add messaging-platform \
        	--command "node packages/mcp-server/dist/index.js" \
        	--cwd /Users/bob/Desktop/messaging-platform \
        	--env DATABASE_URL \
        	--env MCP_COMPANY_ID \
        	--env MCP_USER_ID
        ```

        - Use `DEFAULT_COMPANY_ID` / `DEFAULT_USER_ID` flags instead if you rely on those fallbacks.
        - Claude Code will start and manage the process, streaming stdio back to the IDE.

3.  Whenever you change `src/index.ts`, rebuild (or run the dev watcher) so the Claude-managed process picks up the latest output.

### Optional: watch mode during development

If you prefer Claude Code to run the watcher directly, point it at the dev script instead of the compiled bundle:

```bash
claude mcp add messaging-platform-dev \
	--command "pnpm --filter @repo/mcp-server dev" \
	--cwd /Users/bob/Desktop/messaging-platform \
	--env MCP_COMPANY_ID \
	--env MCP_USER_ID
```

Because the dev script recompiles on every change, you can leave one Claude integration for production-style builds and another for hot iteration.

## Notes

- The server instantiates its own Prisma client; ensure `DATABASE_URL` points at the same database used by the Express backend.
- Additional resources/tools can be registered by importing backend services and calling `server.registerResource` / `server.registerTool` in `src/index.ts`.
- The MCP schedule workflow enforces the same rules as the REST API. Provide either direct `content` or a `templateId` plus required variables; BIRTHDAY schedules must target at least one contact that has a birth date on file.
