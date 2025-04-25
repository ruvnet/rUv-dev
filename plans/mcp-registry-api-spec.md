# MCP Registry API Specification

## Overview

The MCP Registry API provides a centralized service for discovering and retrieving metadata about available MCP servers. This specification defines the API endpoints, request/response formats, authentication mechanisms, and error handling for the registry service.

## Base URL

```
https://registry.example.com/api/mcp
```

## Authentication

The API requires authentication using a Bearer token in the Authorization header:

```http
Authorization: Bearer <token>
```

Tokens can be obtained through the authentication service (detailed in a separate document).

## API Endpoints

### 1. List All MCP Servers

Retrieves a paginated list of all available MCP servers with their basic metadata.

#### Request

```http
GET /servers
Host: registry.example.com
Authorization: Bearer <token>
```

#### Query Parameters

| Parameter | Type   | Required | Description                                |
|-----------|--------|----------|--------------------------------------------|
| page      | number | No       | Page number (default: 1)                   |
| pageSize  | number | No       | Number of items per page (default: 10)     |
| tags      | string | No       | Comma-separated list of tags to filter by  |
| search    | string | No       | Search term to filter servers by name      |

#### Response

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "servers": [
    {
      "id": "supabase",
      "name": "Supabase",
      "description": "Supabase MCP server for database operations",
      "version": "1.0.0",
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest"
      ],
      "requiredArgs": [
        {
          "name": "access-token",
          "description": "Supabase access token",
          "secret": true,
          "envVar": "SUPABASE_ACCESS_TOKEN"
        },
        {
          "name": "project-id",
          "description": "Supabase project ID",
          "secret": false
        }
      ],
      "optionalArgs": [
        {
          "name": "region",
          "description": "Supabase region",
          "default": "us-east-1"
        }
      ],
      "recommendedPermissions": [
        "list_tables",
        "execute_sql",
        "list_projects"
      ],
      "documentation": "https://example.com/docs/supabase-mcp",
      "tags": ["database", "backend"],
      "popularity": 4.8
    },
    {
      "id": "openai",
      "name": "OpenAI",
      "description": "OpenAI MCP server for AI operations",
      "version": "1.0.0",
      "command": "npx",
      "args": [
        "-y",
        "@openai/mcp-server@latest"
      ],
      "requiredArgs": [
        {
          "name": "api-key",
          "description": "OpenAI API key",
          "secret": true,
          "envVar": "OPENAI_API_KEY"
        }
      ],
      "optionalArgs": [
        {
          "name": "organization",
          "description": "OpenAI organization ID",
          "secret": false
        },
        {
          "name": "model",
          "description": "Default model to use",
          "default": "gpt-4"
        }
      ],
      "recommendedPermissions": [
        "create_completion",
        "list_models",
        "create_embedding"
      ],
      "documentation": "https://example.com/docs/openai-mcp",
      "tags": ["ai", "nlp"],
      "popularity": 4.9
    }
  ],
  "meta": {
    "total": 2,
    "page": 1,
    "pageSize": 10,
    "lastUpdated": "2025-04-20T12:00:00Z"
  }
}
```

### 2. Get MCP Server Details

Retrieves detailed information about a specific MCP server.

#### Request

```http
GET /servers/{server-id}
Host: registry.example.com
Authorization: Bearer <token>
```

#### Path Parameters

| Parameter | Type   | Required | Description                |
|-----------|--------|----------|----------------------------|
| server-id | string | Yes      | Unique ID of the MCP server|

#### Response

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": "supabase",
  "name": "Supabase",
  "description": "Supabase MCP server for database operations",
  "version": "1.0.0",
  "command": "npx",
  "args": [
    "-y",
    "@supabase/mcp-server-supabase@latest"
  ],
  "requiredArgs": [
    {
      "name": "access-token",
      "description": "Supabase access token",
      "secret": true,
      "envVar": "SUPABASE_ACCESS_TOKEN"
    },
    {
      "name": "project-id",
      "description": "Supabase project ID",
      "secret": false
    }
  ],
  "optionalArgs": [
    {
      "name": "region",
      "description": "Supabase region",
      "default": "us-east-1"
    }
  ],
  "recommendedPermissions": [
    "list_tables",
    "execute_sql",
    "list_projects"
  ],
  "documentation": "https://example.com/docs/supabase-mcp",
  "tags": ["database", "backend"],
  "popularity": 4.8,
  "examples": [
    {
      "name": "Basic configuration",
      "config": {
        "command": "npx",
        "args": [
          "-y",
          "@supabase/mcp-server-supabase@latest",
          "--access-token",
          "${env:SUPABASE_ACCESS_TOKEN}",
          "--project-id",
          "abcdef123456"
        ],
        "alwaysAllow": [
          "list_tables",
          "execute_sql"
        ]
      }
    },
    {
      "name": "Advanced configuration",
      "config": {
        "command": "npx",
        "args": [
          "-y",
          "@supabase/mcp-server-supabase@latest",
          "--access-token",
          "${env:SUPABASE_ACCESS_TOKEN}",
          "--project-id",
          "abcdef123456",
          "--region",
          "eu-west-1"
        ],
        "alwaysAllow": [
          "list_tables",
          "execute_sql",
          "list_projects",
          "create_table"
        ]
      }
    }
  ],
  "roomodeTemplate": {
    "slug": "mcp-supabase",
    "name": "Supabase Database Assistant",
    "roleDefinition": "You are a Supabase database specialist who helps users interact with their Supabase database through the MCP integration. You can execute SQL queries, list tables, and help users understand their database schema.",
    "customInstructions": "When users ask about their database, use the MCP tools to list tables and explore the schema. For data operations, help users craft SQL queries and execute them safely.",
    "groups": [
      "read",
      "edit",
      "mcp"
    ]
  }
}
```

### 3. Get Server Categories

Retrieves a list of all server categories/tags available in the registry.

#### Request

```http
GET /categories
Host: registry.example.com
Authorization: Bearer <token>
```

#### Response

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "categories": [
    {
      "name": "database",
      "count": 3,
      "description": "Database and storage services"
    },
    {
      "name": "ai",
      "count": 5,
      "description": "Artificial intelligence and machine learning services"
    },
    {
      "name": "backend",
      "count": 8,
      "description": "Backend and server-side services"
    },
    {
      "name": "frontend",
      "count": 2,
      "description": "Frontend and client-side services"
    },
    {
      "name": "devops",
      "count": 4,
      "description": "DevOps and infrastructure services"
    }
  ]
}
```

### 4. Search MCP Servers

Searches for MCP servers based on various criteria.

#### Request

```http
GET /search
Host: registry.example.com
Authorization: Bearer <token>
```

#### Query Parameters

| Parameter   | Type   | Required | Description                                |
|-------------|--------|----------|--------------------------------------------|
| q           | string | Yes      | Search query                               |
| category    | string | No       | Filter by category                         |
| minRating   | number | No       | Minimum popularity rating (0-5)            |
| maxResults  | number | No       | Maximum number of results (default: 20)    |

#### Response

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "results": [
    {
      "id": "supabase",
      "name": "Supabase",
      "description": "Supabase MCP server for database operations",
      "version": "1.0.0",
      "tags": ["database", "backend"],
      "popularity": 4.8,
      "relevance": 0.95
    },
    {
      "id": "postgres",
      "name": "PostgreSQL",
      "description": "PostgreSQL MCP server for direct database access",
      "version": "1.0.0",
      "tags": ["database", "backend"],
      "popularity": 4.6,
      "relevance": 0.82
    }
  ],
  "meta": {
    "total": 2,
    "query": "database",
    "filters": {
      "category": "database",
      "minRating": 4.0
    }
  }
}
```

## Error Responses

### 1. Authentication Error

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "error": "unauthorized",
  "message": "Invalid or missing authentication token",
  "code": "AUTH_001"
}
```

### 2. Not Found Error

```http
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "error": "not_found",
  "message": "The requested resource was not found",
  "code": "RES_001"
}
```

### 3. Validation Error

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "validation_error",
  "message": "Invalid request parameters",
  "code": "VAL_001",
  "details": [
    {
      "field": "pageSize",
      "message": "Must be between 1 and 100"
    }
  ]
}
```

### 4. Rate Limit Error

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
Retry-After: 60

{
  "error": "rate_limit_exceeded",
  "message": "Rate limit exceeded. Please try again later.",
  "code": "RATE_001",
  "retryAfter": 60
}
```

### 5. Server Error

```http
HTTP/1.1 500 Internal Server Error
Content-Type: application/json

{
  "error": "server_error",
  "message": "An unexpected error occurred",
  "code": "SRV_001",
  "requestId": "req_123456789"
}
```

## Data Models

### Server List Item

```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "version": "string",
  "command": "string",
  "args": ["string"],
  "requiredArgs": [
    {
      "name": "string",
      "description": "string",
      "secret": boolean,
      "envVar": "string"
    }
  ],
  "optionalArgs": [
    {
      "name": "string",
      "description": "string",
      "default": "string"
    }
  ],
  "recommendedPermissions": ["string"],
  "documentation": "string",
  "tags": ["string"],
  "popularity": number
}
```

### Server Detail

```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "version": "string",
  "command": "string",
  "args": ["string"],
  "requiredArgs": [
    {
      "name": "string",
      "description": "string",
      "secret": boolean,
      "envVar": "string"
    }
  ],
  "optionalArgs": [
    {
      "name": "string",
      "description": "string",
      "default": "string"
    }
  ],
  "recommendedPermissions": ["string"],
  "documentation": "string",
  "tags": ["string"],
  "popularity": number,
  "examples": [
    {
      "name": "string",
      "config": {
        "command": "string",
        "args": ["string"],
        "alwaysAllow": ["string"]
      }
    }
  ],
  "roomodeTemplate": {
    "slug": "string",
    "name": "string",
    "roleDefinition": "string",
    "customInstructions": "string",
    "groups": ["string"]
  }
}
```

### Category

```json
{
  "name": "string",
  "count": number,
  "description": "string"
}
```

### Search Result

```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "version": "string",
  "tags": ["string"],
  "popularity": number,
  "relevance": number
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- 100 requests per minute per API key
- Rate limit headers are included in all responses:
  - `X-RateLimit-Limit`: Maximum requests per minute
  - `X-RateLimit-Remaining`: Remaining requests in the current window
  - `X-RateLimit-Reset`: Time in seconds until the rate limit resets

When rate limits are exceeded, a 429 Too Many Requests response is returned with a Retry-After header.

## Versioning

The API is versioned through the URL path. This specification describes v1 of the API:

```
https://registry.example.com/api/v1/mcp
```

Future versions will be available at `/api/v2/mcp`, etc.

## Caching

Responses may be cached according to the Cache-Control headers:

- List endpoints: `Cache-Control: max-age=300` (5 minutes)
- Detail endpoints: `Cache-Control: max-age=3600` (1 hour)
- Category endpoints: `Cache-Control: max-age=86400` (24 hours)

Clients should respect these cache headers to minimize unnecessary requests.

## Conclusion

This API specification provides a comprehensive reference for implementing the MCP Registry client. It defines all endpoints, request/response formats, error handling, and data models needed to integrate with the registry service.