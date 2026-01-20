# IndiGo Backend

A Twitter webhook ingestion system that receives, normalizes, and stores tweets from Twitter's webhook API.

## Overview

This backend service is built with [Convex](https://convex.dev) and handles incoming tweet data from Twitter webhooks. It provides:

- Real-time tweet ingestion via webhooks
- Automatic deduplication of tweets
- Structured storage with efficient indexing
- Query capabilities by rule ID

## Tech Stack

- **Backend**: Convex (database, server functions, HTTP handlers)
- **Frontend**: Next.js, React
- **Language**: TypeScript
- **Styling**: Tailwind CSS

## Twitter Webhook Integration

### Webhook Endpoint

The application exposes a webhook endpoint at:

```
/twitter-webhook
```

- `GET /twitter-webhook` - Handles Twitter's webhook verification handshake
- `POST /twitter-webhook` - Receives tweet payloads from Twitter

### Twitter API Setup

The webhook is configured with the Twitter API using filter rules. Rules are managed at:

**https://twitterapi.io/tweet-filter-rules**

When tweets match configured filter rules, Twitter sends them to the `/twitter-webhook` endpoint with:
- `event_type` - Type of event
- `rule_id` - ID of the matching filter rule
- `rule_tag` - Tag associated with the rule
- `tweets` - Array of tweet objects
- `timestamp` - Event timestamp

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
convex/
  ├── http.ts        # HTTP endpoint handlers (webhook)
  ├── twitter.ts     # Tweet storage and query functions
  ├── schema.ts      # Database schema definitions
  └── myFunctions.ts # Utility functions
```

## Learn More

- [Convex Documentation](https://docs.convex.dev/)
- [Next.js Documentation](https://nextjs.org/docs)
