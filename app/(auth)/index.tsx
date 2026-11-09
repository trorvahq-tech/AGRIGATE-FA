import { Redirect } from 'expo-router';

export default function IndexScreen() {
    // Skip directly to onboarding - no welcome page
    return <Redirect href="/onboarding" />;
}
