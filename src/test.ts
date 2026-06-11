import { corsair } from './server/corsair';

async function main() {
    const client = corsair.withTenant('dev');

    const { messages } = await client.gmail.api.messages.list({
        maxResults: 10,
    });

    for (const msg of messages ?? []) {
        const full = await client.gmail.api.messages.get({
            id: msg.id!,
            format: 'full',
        });

        const headers = full.payload?.headers ?? [];
        const subject = headers.find(h => h.name === 'Subject')?.value ?? '(no subject)';
        const from = headers.find(h => h.name === 'From')?.value ?? '(unknown)';
        const date = headers.find(h => h.name === 'Date')?.value ?? '';
        const body = full.payload?.body?.data
            ? Buffer.from(full.payload.body.data, 'base64').toString('utf-8')
            : full.snippet ?? '(no body)';

        console.log(`From:    ${from}`);
        console.log(`Date:    ${date}`);
        console.log(`Subject: ${subject}`);
        console.log(`Body:\n${body}\n`);
    }
}

main();
