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
            await terminal.write("  Please type in a new biography to display on your profile.");
            await terminal.write("  You can type '!!remove' to delete it.\n");

            let bio = await terminal.read("  New bio (unchanged): ");
            bio = bio === "!!remove" ? null : bio;

            if (bio !== null && !bio.length) return;

            // Post update
            const response = await request("profile/update", { bio }, window._account_data.token);
            if (response.detail) return await terminal.write("  * Failed to set bio, must be 75 characters max.");

            return await terminal.write("  * Biography updated!");
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
