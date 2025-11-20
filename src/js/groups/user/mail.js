import { split } from "/src/js/lib/split";
import { request } from "/src/js/lib/auth";

function format_date(t) {
    return new Date(t).toLocaleString("en-US", {
        month: "2-digit", day: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
    });
}

async function send_message(terminal, recipient, subject) {
    if (!recipient) recipient = await terminal.read("  Message recipient: ");
    if (!subject) subject = await terminal.read("  Subject (blank): ");

    let message = "";
    await terminal.write("\n  You may now begin to write your message.\n  Please type '!!done' when you are done editing lines.\n");

    while (true) {
        const input = await terminal.read("    * Line: ");
        if (input === "!!done") break;

        // Message length heads up
        if (input.length + message.length > 2500) {
            await terminal.write("  Adding this line hits the message length limit. It has been skipped.");
            await terminal.write("  Please type a line with less characters or end the message early.");

            continue;
        }

        message += input + "\n";
    }

    if (!message.length) return await terminal.write("\n  * Message canceled due to lack of content.");            

    // Confirmation
    await terminal.write("\n  Please take the time to ensure your message is ready to send.");
    if (!["yes", "y"].includes((await terminal.read("  Confirm send (Y/n)? ")).toLowerCase() || "y")) return await terminal.write("\n  * Message canceled.");

    // Process response
    const response = await request("message/send", {
        recipient,
        subject,
        content: message
    }, window._account_data.token);

    if (response.detail || response.code !== 201) {
        await terminal.write("\n  Message failed to send.");
        if (response.detail) return await terminal.write(`    * Subject: Must be at most 100 characters long.`);

        return await terminal.write(`    * ${response.data.message}`);
    }
        
    return await terminal.write("\n  * Message sent!");
}

export const mail = {
    name: "mail",
    group: "account",
    description: "view your personal inbox",
    subcommands: {
        "send": "send a message to a user"
    },
    command: async (terminal, args) => {
        if (!window._account_data) return await terminal.write("  * Not logged in.");

        // Handle message sending
        if (args[0] === "send") return await send_message(terminal);

        // Pagination
        let page = 0, refetch = true, mail = null, tab = "inbox";
        while (true) {
            await terminal.clear();

            // Fetch mail?
            if (refetch) {
                mail = await request(tab, null, window._account_data.token);
                if (mail.code !== 200) return await terminal.write("  * An error occured while reading your inbox.");

                mail.data.sort((m1, m2) => m1.sent_at <= m2.sent_at);
            }

            // List mail
            const pages = Math.ceil(mail.data.length / 10);
            if (mail.data.length) {
                await terminal.write(`** Mailbox - ${tab === "inbox" ? "Inbox" : "Sent"} - Page ${page + 1} / ${pages} **`);
                for (let i = 0; i < 10; i++) {
                    const message = mail.data[i + (10 * page)];
                    if (!message) break;
        
                    const date = format_date(message.sent_at);
                    await terminal.write(`  [${i + (10 * page) + 1}] ${message.subject || "(no subject)"} - ${message.sender} @ ${date}`);
                }
        
                if (tab === "inbox") await terminal.write("\n  * You got mail!");
            } else { await terminal.write(`** Mailbox - ${tab === "inbox" ? "Inbox" : "Sent"} - Empty **\n\n  * You${tab === "inbox" ? " have" : "'ve sent"} no mail :(`); }
            
            // Prompt for user action
            await terminal.write("\nActions: back (b), next (n), refetch (r), exit (quit, q)");
            await terminal.write("Available tabs: inbox (i), sent (s)\n");
            await terminal.write("Type a Message ID to view it.\n");

            const action = (await terminal.read("  Action >> ")).toLowerCase();
            if (action == "q" || action == "quit" || action == "exit") break;

            // Tab switching
            if (action == "inbox" || action == "i") {
                tab = "inbox";
                refetch = true;
                continue;
            } else if (action == "sent" || action == "s") {
                tab = "outbox";
                refetch = true;
                continue;
            }

            // Handle refetching from server
            if (action == "r" || action == "refetch") {
                refetch = true;
                continue;
            }

            // View messages
            const message = mail.data[+action - 1];
            if (message) {
                await terminal.clear();
                await terminal.write(`** Message ${tab === "inbox" ? `from ${message.sender}` : `to ${message.recipient}`} **\n════════════════════════════════════════════════\n`);

                if (message.subject) await terminal.write(`  Subject: ${message.subject}\n`);
                for (const line of message.content.split(/\n/)) {
                    if (!line.trim()) {
                        await terminal.blank();
                        continue;
                    }
                    for (const chunk of split(line)) await terminal.write("  " + chunk.trim());
                }

                await terminal.write("════════════════════════════════════════════════\n");
                await terminal.write(`  Sent at: ${format_date(message.sent_at)}`);
                await terminal.write(`  Message ID: ${message.message_id}`);

                // Prompt for user action
                await terminal.write(`\nActions: ${tab === "inbox" ? "delete (d), reply (r)" : "none available"}`);
                await terminal.write("Type anything else or just press ENTER to go back.\n");

                const action = (await terminal.read("  Action >> ")).toLowerCase();
                if (tab !== "inbox") continue;

                // Delete
                if (action == "d" || action == "delete") {
                    await request("message/delete", { message_id: message.message_id }, window._account_data.token);
                    refetch = true;
                };

                // Reply
                if (action == "r" || action == "reply") {
                    await terminal.clear();
                    await terminal.write("** Replying to message **")

                    await send_message(terminal, message.sender, `Re: ${message.subject}`);
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                }
            }

            // Handle page swapping
            if (action == "next" || action == "n" && (page < pages - 1)) {
                page++;
            } else if (action == "back" || action == "b" && page) {
                page--;
            }
        }
    }
}
