# AI Tattoo Generator

An AI-powered web application that generates unique tattoo designs based on user prompts. Built with Next.js, Supabase, and Replicate AI.

## Features

- AI-powered tattoo design generation
- User authentication with Google
- Image storage and history
- Responsive design
- Download generated designs

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Supabase (Auth & Storage)
- Replicate AI (Image Generation)

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/[your-username]/tattoke.git
cd tattoke
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory with the following variables:
```env
REPLICATE_API_TOKEN=your_replicate_token
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Setup

1. Create a Supabase project and set up:
   - Authentication (Google provider)
   - Storage bucket named "tattogenerator"
   - Database tables and policies

2. Get a Replicate API token

3. Configure environment variables as shown above

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)