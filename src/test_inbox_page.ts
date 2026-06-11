import InboxPage from './app/dashboard/inbox/page';

async function main() {
  console.log("Invoking InboxPage server component...");
  try {
    const result = await InboxPage();
    console.log("InboxPage render result type:", typeof result);
    console.log("InboxPage render props initialEmails:", JSON.stringify(result.props.initialEmails, null, 2));
  } catch (error) {
    console.error("Error invoking InboxPage:", error);
  }
}

main();
