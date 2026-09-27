This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Local Database & Email Verification

This project uses **Supabase** for its database and authentication. To run the backend locally:

1. Ensure Docker is running.
2. Start local Supabase:
```bash
npx supabase start
```
3. The API and database will be running on your local machine.

### Verifying Auth Emails Locally
Since emails are not actually sent to real addresses during local development, Supabase intercepts them using a built-in local SMTP testing server (Inbucket). 

To view confirmation emails (like when you register a new account) or password reset emails:
1. Open your browser and navigate to the Local Email Inbox: **[http://localhost:54324](http://localhost:54324)**
2. Click on the email in the inbox to view it and click the confirmation links directly.

*(Note: You can also access the full local Supabase Studio dashboard at [http://localhost:54323](http://localhost:54323))*

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

