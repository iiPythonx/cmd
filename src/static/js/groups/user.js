// Copyright (c) 2025 iiPython
// Command group - account management

const API_URL = "http://localhost:8001/api";
const CONSTRAINT_INFO = "    * Name: Must be between 3 and 32 characters long.\n    * Password: Must be at least 8 characters long.";

window._account_data = JSON.parse(localStorage.getItem("account"));

async function request(endpoint, data, authorization = "") {
    return await (await fetch(
        `${API_URL}/${endpoint}`,
        {
            method: data ? "POST" : "GET",
            headers: {
                "Authorization": authorization,
                "Content-Type": "application/json"
            },
            body: data ? JSON.stringify(data) : null
        }
    )).json();
}

async function auth(terminal, type) {
    if (window._account_data) return await terminal.write("  * You are already logged in.");

    // Steal their information
    const username = await terminal.read("  Account name: ");
    const password = await terminal.read("  Password: ", "password");

    const result = await request(type, { username, password });
    if (result.code !== 200) {
        await terminal.write("\n  Login failed.");
        if (result.detail) return await terminal.write(CONSTRAINT_INFO);

        return await terminal.write("    * " + result.data.message);
    }

    window._account_data = { token: result.data.token, username };
    localStorage.setItem("account", JSON.stringify(window._account_data));

    await terminal.write("\n  " + (type === "login" ? `Welcome back, ${username}.` : `Enjoy your new account, ${username}.`));
}

export async function login(terminal) { await auth(terminal, "login"); }
export async function register(terminal) { await auth(terminal, "register"); }

export async function logout(terminal) {
    if (!window._account_data) return await terminal.write("  * Not logged in.");

    await terminal.write(`  Goodbye, ${window._account_data.username}.`);

    localStorage.removeItem("account");
    window._account_data = null;
}

export async function account(terminal, args) {
    if (!window._account_data) return await terminal.write("  * Not logged in.");

    await terminal.write(`  Account name: ${window._account_data.username}.`);
    await terminal.write(`  Token: ${args[0] === "token" ? window._account_data.token : "(redacted, view via `account token`)"}.`);
}

export async function mail(terminal, args) {
    if (!window._account_data) return await terminal.write("  * Not logged in.");

    // Handle message sending
    if (args[0] === "send") {
        const recipient = await terminal.read("  Message recipient: ");
        const subject = await terminal.read("  Subject (blank): ");

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

        if (!message.length) return await terminal.write("\n  * oMessage canceled due to lack of content.");            

        // Confirmation
        await terminal.write("\n  Please take the time to ensure your message is ready to send.");
        if (!["yes", "y"].includes((await terminal.read("  Confirm send (Y/n)? ")).toLowerCase() || "y")) return await terminal.write("\n  * Message canceled.");

        // Process response
        const response = await request("message", {
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

    // Fetch mail
    const mail = await request("inbox", null, window._account_data.token);
    if (mail.code !== 200) return await terminal.write("  * An error occured while reading your inbox.");

    // Pagination
    let page = 0;
    while (true) {
        await terminal.clear();
        await terminal.write(`** Mailbox - Page ${page + 1} / ${Math.ceil(mail.data.length / 10)} **`);
        for (let i = 0; i < 10; i++) {
            const message = mail.data[i + (10 * page)];
            if (!message) break;

            const date = new Date(message.sent).toLocaleString("en-US", {
                month: "2-digit", day: "2-digit", year: "numeric",
                hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
            });
            await terminal.write(`  [${i + (10 * page) + 1}] ${message.subject || "(no subject)"} - ${message.sender} @ ${date}`);
        }

        await terminal.write(`\n  * ${mail.data.length ? "You got mail!" : "No mail :("}`);

        // Prompt for user action
        await terminal.write("\nActions: back (b), next (n), exit (quit, q)");
        await terminal.write("Type a Message ID to view it.\n");

        const action = (await terminal.read("  Action >> ")).toLowerCase();
        if (action == "q" || action == "quit" || action == "exit") break;

        // View messages
        const message = mail.data[+action - 1];
        if (message) {
            await terminal.clear();
            await terminal.write(`** Message from ${message.sender} **
════════════════════════════════════════════════

  ${message.subject ? `Subject: ${message.subject}\n\n` : ""}  ${message.content}
════════════════════════════════════════════════`);
            await terminal.read("Press [ENTER] to go back.");
        }

        // Handle page swapping
        // TODO

    }
}
