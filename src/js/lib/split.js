const REGEX = new RegExp("(.{1,80})(\\s|$)", "g");
export function split(s) {
    const result = [];
    let match;
    while ((match = REGEX.exec(s)) !== null) result.push(match[1].trim());
    return result;
}
