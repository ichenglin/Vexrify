import CountryCode from "../data/country_code.json";

export default class CountryFlag {

    public static get_flag(country_name: string): string {
        const team_country_code = CountryCode.find(country_data => country_data.name === country_name)?.code;
        return (team_country_code !== undefined) ? `:flag_${team_country_code.toLowerCase()}:` : ":earth_americas:";
    }

}