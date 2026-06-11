import { corsair } from '@/utils/corsair'

async function main() {
    const client = corsair.withTenant('dev');

    const { messages } = await client.gmail.api.messages.list({
        maxResults: 10,
    });

    for (const msg of messages ?? []) {
        const full = await client.gmail.api.messages.get({
            id: msg.id!,
            format: 'metadata',
        });

        console.log("HEADERS:", JSON.stringify(full.payload?.headers));

        console.log("PAYLOAD keys:", Object.keys(full.payload ?? {}));
    }
}

main();
