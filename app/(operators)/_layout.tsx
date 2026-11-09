import { Tabs } from 'expo-router';
import { View } from 'react-native';
import OperatorCustomTabBar from '../../components/ui/OperatorCustomTabBar';
import Sidebar from '../../components/ui/Sidebar';
import { SidebarProvider } from '../../context/SidebarContext';
import { ThemeProvider } from '../../context/ThemeContext';

const tabRouterOverrides = (original: any) => ({
    ...original,
    getStateForAction(state: any, action: any, options: any) {
        let normalizedAction = action;
        if (action.type === 'PUSH' || action.type === 'REPLACE') {
            normalizedAction = { ...action, type: 'NAVIGATE' };
        } else if (action.type === 'POP') {
            normalizedAction = { ...action, type: 'GO_BACK' };
        }
        if (normalizedAction.type === 'NAVIGATE' && !normalizedAction.payload?.name && normalizedAction.payload?.state?.routes?.[0]?.name) {
            normalizedAction = {
                ...normalizedAction,
                payload: {
                    ...normalizedAction.payload,
                    name: normalizedAction.payload.state.routes[0].name,
                    params: normalizedAction.payload.state.routes[0].params
                }
            };
        }
        if (normalizedAction.type === 'NAVIGATE' && normalizedAction.payload?.params?.screen) {
            const screenName = normalizedAction.payload.params.screen.replace(/^\/?\(operators\)\//, '').replace(/^\//, '');
            if (state.routeNames.includes(screenName)) {
                normalizedAction = {
                    ...normalizedAction,
                    payload: {
                        name: screenName,
                        params: normalizedAction.payload.params.params
                    }
                };
            }
        }
        if (normalizedAction.payload?.name && typeof normalizedAction.payload.name === 'string') {
            const cleanName = normalizedAction.payload.name.replace(/^\/?\(operators\)\//, '').replace(/^\//, '');
            if (cleanName !== normalizedAction.payload.name && state.routeNames.includes(cleanName)) {
                normalizedAction = {
                    ...normalizedAction,
                    payload: { ...normalizedAction.payload, name: cleanName }
                };
            }
        }
        return original.getStateForAction(state, normalizedAction, options);
    }
});

export default function OperatorLayout() {
    return (
        <ThemeProvider>
            <SidebarProvider>
                <View style={{ flex: 1 }}>
                    <Tabs
                        backBehavior="history"
                        {...({ UNSTABLE_router: tabRouterOverrides } as any)}
                        tabBar={(props) => <OperatorCustomTabBar {...props} />}
                        screenOptions={{
                            headerShown: false,
                        }}
                    >
                        <Tabs.Screen
                            name="index"
                            options={{
                                title: 'Home',
                            }}
                        />
                        <Tabs.Screen
                            name="tasks"
                            options={{
                                title: 'Tasks',
                            }}
                        />
                        <Tabs.Screen
                            name="reports"
                            options={{
                                title: 'Report',
                            }}
                        />
                        <Tabs.Screen
                            name="settings"
                            options={{
                                title: 'Settings',
                            }}
                        />
                        <Tabs.Screen
                            name="allActivities"
                            options={{
tabBarStyle: { display: 'none' },
                            }}
                        />
                        <Tabs.Screen
                            name="activityDetails"
                            options={{
tabBarStyle: { display: 'none' },
                            }}
                        />
                        <Tabs.Screen
                            name="reportDetails"
                            options={{
tabBarStyle: { display: 'none' },
                            }}
                        />
                        <Tabs.Screen
                            name="about"
                            options={{
tabBarStyle: { display: 'none' },
                            }}
                        />
                        <Tabs.Screen
                            name="legal"
                            options={{
tabBarStyle: { display: 'none' },
                            }}
                        />
                        <Tabs.Screen
                            name="taskDetails"
                            options={{
tabBarStyle: { display: 'none' },
                            }}
                        />
                        <Tabs.Screen
                            name="report-issue/form"
                            options={{
tabBarStyle: { display: 'none' },
                            }}
                        />
                        <Tabs.Screen
                            name="report-issue/index"
                            options={{
tabBarStyle: { display: 'none' },
                            }}
                        />
                    </Tabs>
                    <Sidebar />
                </View>
            </SidebarProvider>
        </ThemeProvider>
    );
}
