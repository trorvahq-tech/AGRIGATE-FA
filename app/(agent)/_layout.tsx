import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import CustomTabBar from '../../components/ui/CustomTabBar';
import Sidebar from '../../components/ui/Sidebar';
import { SidebarProvider } from '../../context/SidebarContext';
import { ThemeProvider } from '../../context/ThemeContext';

const tabRouterOverrides = (original: any) => ({
    ...original,
    getStateForAction(state: any, action: any, options: any) {
        let normalizedAction = action;

        // In React Navigation 7, TabRouter rejects PUSH and REPLACE actions (returns null),
        // causing Expo Router's root stack to handle the action and reload (agent) at index.
        // Converting PUSH / REPLACE to NAVIGATE allows tab switching to hidden screens!
        if (action.type === 'PUSH' || action.type === 'REPLACE') {
            normalizedAction = {
                ...action,
                type: 'NAVIGATE'
            };
        } else if (action.type === 'POP') {
            normalizedAction = {
                ...action,
                type: 'GO_BACK'
            };
        }

        // If action.payload.name is missing but has nested state routes (e.g. from linking or router.navigate)
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

        // If action has params.screen matching a route in this tab navigator (nested navigation)
        if (normalizedAction.type === 'NAVIGATE' && normalizedAction.payload?.params?.screen) {
            const screenName = normalizedAction.payload.params.screen.replace(/^\/?\(agent\)\//, '').replace(/^\//, '');
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

        // Strip group prefix e.g. '(agent)/drafts' or '/(agent)/drafts' to match registered tab screen names
        if (normalizedAction.payload?.name && typeof normalizedAction.payload.name === 'string') {
            const cleanName = normalizedAction.payload.name.replace(/^\/?\(agent\)\//, '').replace(/^\//, '');
            if (cleanName !== normalizedAction.payload.name && state.routeNames.includes(cleanName)) {
                normalizedAction = {
                    ...normalizedAction,
                    payload: {
                        ...normalizedAction.payload,
                        name: cleanName
                    }
                };
            }
        }

        return original.getStateForAction(state, normalizedAction, options);
    }
});

export default function AgentLayout() {
    const { t } = useTranslation();
    return (
        <ThemeProvider>
            <SidebarProvider>
                <Tabs
                    backBehavior="history"
                    {...({ UNSTABLE_router: tabRouterOverrides } as any)}
                    tabBar={(props) => <CustomTabBar {...props} />}
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
                        name="farmers"
                        options={{
                            title: t('farmers'),
                        }}
                    />
                    <Tabs.Screen
                        name="farms"
                        options={{
                            title: t('farms'),
                        }}
                    />
                    <Tabs.Screen
                        name="mtgGroups"
                        options={{
                            title: 'MTG',
                        }}
                    />
                    <Tabs.Screen
                        name="reports"
                        options={{
                            title: 'Season Tracker',
                        }}
                    />
                    <Tabs.Screen
                        name="settings"
                        options={{
                            title: t('settings'),
                        }}
                    />
                    <Tabs.Screen
                        name="tasks"
                        options={{
tabBarStyle: { display: 'none' },
                        }}
                    />
                    <Tabs.Screen name="needs-visit" options={{tabBarStyle: { display: 'none' } }} />
                    <Tabs.Screen name="needs-call" options={{tabBarStyle: { display: 'none' } }} />
                    <Tabs.Screen name="awaiting-validation" options={{tabBarStyle: { display: 'none' } }} />
                    <Tabs.Screen name="visit-farmer" options={{tabBarStyle: { display: 'none' } }} />
                    <Tabs.Screen name="call-farmer" options={{tabBarStyle: { display: 'none' } }} />
                    <Tabs.Screen name="task-awaiting-validation" options={{tabBarStyle: { display: 'none' } }} />

                    <Tabs.Screen
                        name="farmerDetails"
                        options={{
tabBarStyle: { display: 'none' },
                        }}
                    />
                    <Tabs.Screen
                        name="farmDetails"
                        options={{
tabBarStyle: { display: 'none' },
                        }}
                    />
                    <Tabs.Screen
                        name="addFarmTask"
                        options={{
tabBarStyle: { display: 'none' },
                        }}
                    />
                    <Tabs.Screen
                        name="subplotDetails"
                        options={{
tabBarStyle: { display: 'none' },
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
                        name="helpCenter"
                        options={{
tabBarStyle: { display: 'none' },
                        }}
                    />
                    <Tabs.Screen
                        name="myTickets"
                        options={{
tabBarStyle: { display: 'none' },
                        }}
                    />
                    <Tabs.Screen
                        name="ticketChat"
                        options={{
tabBarStyle: { display: 'none' },
                        }}
                    />
                    <Tabs.Screen
                        name="devices"
                        options={{
tabBarStyle: { display: 'none' },
                        }}
                    />
                    <Tabs.Screen
                        name="accountStatus"
                        options={{
tabBarStyle: { display: 'none' },
                        }}
                    />
                    <Tabs.Screen
                        name="feedback"
                        options={{
tabBarStyle: { display: 'none' },
                        }}
                    />
                    <Tabs.Screen
                        name="biometrics"
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
                    <Tabs.Screen
                        name="notifications"
                        options={{
tabBarStyle: { display: 'none' },
                        }}
                    />
                    <Tabs.Screen
                        name="archiving"
                        options={{
tabBarStyle: { display: 'none' },
                        }}
                    />
                    <Tabs.Screen
                        name="accessibility"
                        options={{
tabBarStyle: { display: 'none' },
                        }}
                    />

                    <Tabs.Screen
                        name="register-farmer/kyc"
                        options={{
tabBarStyle: { display: 'none' },
                        }}
                    />
                    <Tabs.Screen
                        name="register-farmer/personal-details"
                        options={{
tabBarStyle: { display: 'none' },
                        }}
                    />
                    <Tabs.Screen
                        name="register-farmer/farm-details"
                        options={{
tabBarStyle: { display: 'none' },
                        }}
                    />
                    <Tabs.Screen
                        name="register-farmer/documents"
                        options={{
tabBarStyle: { display: 'none' },
                        }}
                    />
                    <Tabs.Screen
                        name="register-farmer/questionnaire"
                        options={{
tabBarStyle: { display: 'none' },
                        }}
                    />
                    <Tabs.Screen
                        name="alerts"
                        options={{
tabBarStyle: { display: 'none' },
                        }}
                    />
                    <Tabs.Screen
                        name="notification-settings"
                        options={{
tabBarStyle: { display: 'none' },
                        }}
                    />

                    <Tabs.Screen
                        name="mtgDetails"
                        options={{
tabBarStyle: { display: 'none' },
                        }}
                    />
                    <Tabs.Screen
                        name="createMtg"
                        options={{
tabBarStyle: { display: 'none' },
                        }}
                    />
                    <Tabs.Screen
                        name="mtgTraining"
                        options={{
tabBarStyle: { display: 'none' },
                        }}
                    />
                    <Tabs.Screen name="mtgFundingInputs" options={{tabBarStyle: { display: 'none' } }} />
                    <Tabs.Screen name="mtgFundingContributions" options={{tabBarStyle: { display: 'none' } }} />
                    <Tabs.Screen name="mtgFundingReview" options={{tabBarStyle: { display: 'none' } }} />
                    <Tabs.Screen name="mtgFundingSummary" options={{tabBarStyle: { display: 'none' } }} />
                    <Tabs.Screen
                        name="demoPlots"
                        options={{
tabBarStyle: { display: 'none' },
                        }}
                    />
                    <Tabs.Screen
                        name="profile"
                        options={{
tabBarStyle: { display: 'none' },
                        }}
                    />
                    <Tabs.Screen
                        name="drafts"
                        options={{
tabBarStyle: { display: 'none' },
                        }}
                    />
                    <Tabs.Screen
                        name="stageDetails"
                        options={{
tabBarStyle: { display: 'none' },
                        }}
                    />
                    <Tabs.Screen
                        name="vcmScorecard"
                        options={{
                            tabBarStyle: { display: 'none' },
                        }}
                    />
                    <Tabs.Screen
                        name="kwali"
                        options={{
                            tabBarStyle: { display: 'none' },
                        }}
                    />
                </Tabs>
                <Sidebar />
            </SidebarProvider>
        </ThemeProvider>
    );
}
