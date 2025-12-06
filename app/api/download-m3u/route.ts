import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: NextRequest) {
    let url: string = '';

    try {
        const body = await req.json();
        url = body.url;

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        console.log(`[Proxy] Attempting download from: ${url}`);

        try {
            return await downloadM3U(url);
        } catch (initialError: any) {
            console.warn(`[Proxy] Initial download failed: ${initialError.message}`);

            // Fallback logic: Try replacing hostname with localhost
            try {
                const urlObj = new URL(url);
                if (urlObj.hostname !== 'localhost' && urlObj.hostname !== '127.0.0.1') {
                    urlObj.hostname = 'localhost';
                    const fallbackUrl = urlObj.toString();

                    console.log(`[Proxy] Retrying with fallback URL: ${fallbackUrl}`);
                    return await downloadM3U(fallbackUrl);
                } else {
                    throw initialError; // If already localhost, just rethrow
                }
            } catch (fallbackError: any) {
                console.error(`[Proxy] Fallback failed: ${fallbackError.message}`);
                throw initialError; // Throw original error for clarity
            }
        }

    } catch (error: any) {
        console.error('[Proxy] Download process failed:', error.message);
        return NextResponse.json({
            error: 'Failed to download M3U',
            details: error.message
        }, { status: 500 });
    }
}

async function downloadM3U(url: string) {
    const response = await axios.get(url, {
        responseType: 'text',
        timeout: 30000,
    });

    return new NextResponse(response.data, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
    });
}
