import { request, auth } from "/src/js/lib/auth";

window._account_data = JSON.parse(localStorage.getItem("account"));

export const account = {
    name: "account",
    group: "account",
    description: "check who you're logged in as",
    subcommands: {
        "login": "login to your account",
        "register": "create a shiny account",
        "delete": "delete your account",
        "logout": "it logs you out, duh"
    },
    command: async (terminal, args) => {
        if (args) {
            switch (args[0]) {
                case "login":
                    return await auth(terminal, "login");

                case "register":
                    return await auth(terminal, "register");

                case "logout":
                    if (!window._account_data) return await terminal.write("  * Not logged in.");

                    await terminal.write(`  Goodbye, ${window._account_data.username}.`);

                    window._account_data = null;
                    return localStorage.removeItem("account");

                case "delete":
                    if (!window._account_data) return await terminal.write("  * Not logged in.");

                    const result = await request("account/delete", {}, window._account_data.token);
                    if (result.code !== 200) return await terminal.write("  Account deletion failed, ensure your login state is correct.");

                    await terminal.write(`  Goodbye, ${window._account_data.username}.`);

                    window._account_data = null;
                    return localStorage.removeItem("account");
            }
        }

        if (!window._account_data) return await terminal.write("  * Not logged in.");

        await terminal.write(`  Account name: ${window._account_data.username}.`);
        await terminal.write(`  Token: ${args[0] === "token" ? window._account_data.token : "(redacted, view via `account token`)"}.`);
    }
}
