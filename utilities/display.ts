export default class VerificationDisplay {

    public static string_list(string_items: string[]): string {
        if      (string_items.length <= 0)  return "";
        else if (string_items.length === 1) return string_items[0];
        else if (string_items.length === 2) return `${string_items[0]} and ${string_items[1]}`;
        const index_last = (string_items.length - 1);
        string_items[index_last] = `and ${string_items[index_last]}`;
        return string_items.join(", ");
    }

}