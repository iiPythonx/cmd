import { request } from "/src/js/lib/auth";

export const profile = {
    name: "profile",
    group: "account",
    description: "view your personal profile",
    subcommands: {
        "{user}": "view somebodies profile",
        "update": "update your profile info"
    },
    command: async (terminal, args) => {
        let username = args[0];
        if (!args.length) {
            if (!window._account_data) return await terminal.write("  * Not logged in.");
            username = window._account_data.username;
        }

        // Handle account updating
        if (username === "update") {
            if (!window._account_data) return await terminal.write("  * Not logged in.");
            console.log("update account info");
        }

        // Show profile
        const { code, data: profile } = await request(`profile/${username}`);
        if (code === 404) return await terminal.write("* No such account exists.");

        await terminal.write(`\n  ** Account profile **`);
        await terminal.write(`    Username: ${username} (${username.toLowerCase()})`);
        await terminal.write(`    Moneyz: ${profile.moneyz}`);

        if (profile.pb_wpm !== null) {
            await terminal.write(`    PB WPM: ${profile.pb_wpm}wpm`);
            await terminal.write(`    PB ACC: ${profile.pb_acc}%`);
        }

        if (profile.bio) await terminal.write(`\n    Bio: ${profile.bio}`);
        await terminal.blank();
    }
}
