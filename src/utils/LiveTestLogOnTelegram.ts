export const sendLogOnTelegram = async (msg: string): Promise<void> => {
    try {
        const url = `https://api.telegram.org/bot7912010445:AAH8DivQSTW8PrN6N9hNXpDj2WdG5DVXAaI/sendMessage?chat_id=807564728&text=${encodeURIComponent(msg)}`;
        await fetch(url);
    } catch (e) {
        console.error("Failed to send log on telegram:", e);
    }
}

// sendLogOnTelegram("test msg"); it's working if have tested out # Approved