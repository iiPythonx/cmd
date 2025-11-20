const API_URL = window.location.hostname === "localhost" ? "http://localhost:8001/api" : "/api";
const CONSTRAINT_INFO = "    * Name: Must be between 3 and 32 characters long.\n    * Password: Must be at least 8 characters long.";

export async function request(endpoint, data, authorization = "") {
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

export async function auth(terminal, type) {
    if (window._account_data) return await terminal.write("  * You are already logged in.");

    // Steal their information
    const username = await terminal.read("  Account name: ");
    const password = await terminal.read("  Password: ", "password");

    const result = await request(`account/${type}`, { username, password });
    if (result.code !== 200) {
        await terminal.write("\n  Login failed.");
        if (result.detail) return await terminal.write(CONSTRAINT_INFO);

        return await terminal.write("    * " + result.data.message);
    }

    window._account_data = { token: result.data.token, username };
    localStorage.setItem("account", JSON.stringify(window._account_data));

    await terminal.write("\n  " + (type === "login" ? `Welcome back, ${username}.` : `Enjoy your new account, ${username}.`));
}
