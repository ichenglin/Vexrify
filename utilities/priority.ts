export default class VerificationPriority {

    public static priority_awards(award_name: string) {
        const awards_priority = [/^World/, /^Division/, /^Tournament/, /^Robot Skills/, /Award$/];
        for (let pattern_index = 0; pattern_index < awards_priority.length; pattern_index++) {
            if (award_name.match(awards_priority[pattern_index]) === null) continue;
            return awards_priority.length - pattern_index;
        }
        return 0;
    }

}