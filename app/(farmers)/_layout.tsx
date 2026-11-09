import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import FarmerCustomTabBar from '../../components/ui/FarmerCustomTabBar';
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
            const screenName = normalizedAction.payload.params.screen.replace(/^\/?\(farmers\)\//, '').replace(/^\//, '');
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
            const cleanName = normalizedAction.payload.name.replace(/^\/?\(farmers\)\//, '').replace(/^\//, '');
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

export default function FarmerLayout() {
    const { t } = useTranslation();
    return (
        <ThemeProvider>
            <SidebarProvider>
                <View style={{ flex: 1 }}>
                    <Tabs
                        backBehavior="history"
                        {...({ UNSTABLE_router: tabRouterOverrides } as any)}
                        tabBar={(props) => <FarmerCustomTabBar {...props} />}
                        screenOptions={{
                            headerShown: false,
                        }}
                    >
                        <Tabs.Screen
                            name="index"
                            options={{
                                title: t('home'),
                            }}
                        />
                        <Tabs.Screen
                            name="farms"
                            options={{
                                title: t('farms'),
                            }}
                        />
                        <Tabs.Screen
                            name="reports"
                            options={{
                                title: t('report'),
                            }}
                        />
                        <Tabs.Screen
                            name="settings"
                            options={{
                                title: t('settings'),
                            }}
                        />
                        <Tabs.Screen
                            name="farmTabDetails"
                            options={{
tabBarStyle: { display: 'none' },
                            }}
                        />
                        <Tabs.Screen
                            name="subplotTabDetails"
                            options={{
tabBarStyle: { display: 'none' },
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
                            name="addSubplot"
                            options={{
tabBarStyle: { display: 'none' },
                            }}
                        />
                        <Tabs.Screen
                            name="addSubplotDetails"
                            options={{
tabBarStyle: { display: 'none' },
                            }}
                        />
                        <Tabs.Screen
                            name="farmDetailsAfterSave"
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
                            name="selectFarm"
                            options={{
tabBarStyle: { display: 'none' },
                            }}
                        />
                        <Tabs.Screen
                            name="selectSubplots"
                            options={{
tabBarStyle: { display: 'none' },
                            }}
                        />
                        <Tabs.Screen
                            name="logActivities"
                            options={{
tabBarStyle: { display: 'none' },
                            }}
                        />
                        <Tabs.Screen
                            name="assessFarm"
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
                            name="changePassword"
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
